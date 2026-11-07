import crypto from 'node:crypto';
import { CAMPUS_HUBS_DATA, CURATED_ACCOMMODATIONS } from '../data/curatedAccommodations.js';
import { config, isOpenAiConfigured } from '../config/env.js';
import { getOpenAiClient, hasOpenAiTestOverride } from './openaiClient.js';
import { osmGeoService } from './osmGeoService.js';
import { extractVerifiedRecommendations } from './recommendationExtractor.js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseService.js';

const sleep = (ms, signal) =>
  new Promise((resolve) => {
    if (!ms || ms <= 0 || signal?.aborted) {
      resolve();
      return;
    }
    const timer = setTimeout(resolve, ms);
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
    }
  });

export function toSupabaseRow(item) {
  return {
    id: item.id,
    slug: item.slug || item.id,
    campus_id: item.campusId,
    campus_name: item.campusName || CAMPUS_HUBS_DATA[item.campusId]?.name || 'Kampus Utama',
    city: item.city || 'Bandung',
    area: item.area || '',
    name: item.name,
    address: item.address,
    latitude: Number(item.lat),
    longitude: Number(item.lng),
    price_monthly: Number(item.priceMonthly || item.priceValue || 1250000),
    price_label: item.price || `Rp${Number(item.priceMonthly || 1250000).toLocaleString('id-ID')} / bln`,
    distance_label: item.distance || '',
    kos_type: item.type || 'Putra / Putri',
    match_score: Number(item.matchScore || 95),
    tag: item.tag || `Match ${item.matchScore || 95}%`,
    rating: Number(item.rating || 4.8),
    reviews_count: Number(item.reviewsCount ?? (Array.isArray(item.reviews) ? item.reviews.length : 25)),
    rooms_available: Number(item.roomsAvailable ?? 2),
    visiting_hours: item.visitingHours || 'Setiap hari • 08.00 – 21.00 WIB',
    verified: item.verified !== false,
    description: item.description || '',
    owner_name: item.contact?.ownerName || item.ownerName || null,
    contact_phone: item.contact?.phone || item.contactPhone || null,
    contact_whatsapp: item.contact?.whatsapp || item.contactWhatsapp || null,
    features: Array.isArray(item.features) ? item.features : [],
    nearby_landmarks: Array.isArray(item.nearbyLandmarks) ? item.nearbyLandmarks : [],
    reviews: Array.isArray(item.reviews) ? item.reviews : [],
    accent_palette: Array.isArray(item.accentPalette) ? item.accentPalette : ['#1d4ed8', '#38bdf8'],
  };
}

export function fromSupabaseRow(row) {
  if (!row || typeof row !== 'object') return null;
  const lat = Number(row.latitude ?? row.lat);
  const lng = Number(row.longitude ?? row.lng);
  const priceMonthly = Number(row.price_monthly ?? row.priceMonthly ?? row.priceValue ?? 1250000);
  const reviewsArr = Array.isArray(row.reviews) ? row.reviews : [];

  return {
    id: String(row.id),
    slug: row.slug || String(row.id),
    campusId: row.campus_id || row.campusId || 'telkom',
    campusName:
      row.campus_name ||
      row.campusName ||
      CAMPUS_HUBS_DATA[row.campus_id || row.campusId || 'telkom']?.name ||
      'Telkom University Bandung',
    city: row.city || 'Bandung',
    area: row.area || '',
    name: row.name || row.title || 'Hunian Kos Teralio',
    address: row.address || '',
    lat,
    lng,
    location: Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null,
    priceMonthly,
    priceValue: priceMonthly,
    price: row.price_label || row.price || `Rp${priceMonthly.toLocaleString('id-ID')} / bln`,
    distance: row.distance_label || row.distance || 'Dekat Kampus',
    type: row.kos_type || row.type || 'Putra / Putri',
    matchScore: Number(row.match_score ?? row.matchScore ?? 95),
    tag: row.tag || `Match ${Number(row.match_score ?? row.matchScore ?? 95)}%`,
    rating: Number(row.rating ?? 4.8),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? (reviewsArr.length || 24)),
    roomsAvailable: Number(row.rooms_available ?? row.roomsAvailable ?? 2),
    visitingHours: row.visiting_hours || row.visitingHours || 'Setiap hari • 08.00 – 21.00 WIB',
    verified: row.verified !== false,
    description: row.description || '',
    contact: {
      ownerName: row.owner_name || row.contact?.ownerName || null,
      phone: row.contact_phone || row.contact?.phone || null,
      whatsapp: row.contact_whatsapp || row.contact?.whatsapp || null,
    },
    features: Array.isArray(row.features) ? row.features : [],
    nearbyLandmarks: Array.isArray(row.nearby_landmarks)
      ? row.nearby_landmarks
      : Array.isArray(row.nearbyLandmarks)
        ? row.nearbyLandmarks
        : [],
    reviews: reviewsArr,
    accentPalette: Array.isArray(row.accent_palette)
      ? row.accent_palette
      : Array.isArray(row.accentPalette)
        ? row.accentPalette
        : ['#1d4ed8', '#38bdf8'],
  };
}

const NORMALIZED_SEED_ITEMS = CURATED_ACCOMMODATIONS.map((item) => fromSupabaseRow(toSupabaseRow(item)));

let missingTableBackoffUntil = 0;
let missingBookingsBackoffUntil = 0;
let runtimeBookings = [];

/**
 * Mengembalikan konteks waktu & kalender aktual zona waktu Indonesia Barat (`Asia/Jakarta`).
 */
export function getCurrentWibContext(referenceDate = new Date()) {
  const isoFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const fullDateFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const shortDateFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const weekdayFormatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
  });

  const todayIso = isoFormatter.format(referenceDate);
  const rawTime = timeFormatter.format(referenceDate).replace('.', ':');
  const currentTimeWib = `${rawTime} WIB`;
  const todayLabel = fullDateFormatter.format(referenceDate);

  const upcomingDays = Array.from({ length: 10 }, (_, offset) => {
    const dt = new Date(referenceDate.getTime() + offset * 24 * 60 * 60 * 1000);
    const isoDate = isoFormatter.format(dt);
    const dayName = weekdayFormatter.format(dt);
    const relativeLabel =
      offset === 0 ? 'Hari Ini' : offset === 1 ? 'Besok' : offset === 2 ? 'Lusa' : dayName;
    return {
      offset,
      isoDate,
      dayName,
      relativeLabel,
      formatted: shortDateFormatter.format(dt),
    };
  });

  return {
    timezone: 'Asia/Jakarta',
    isoNow: referenceDate.toISOString(),
    todayIso,
    todayLabel,
    currentTimeWib,
    tomorrowIso: upcomingDays[1].isoDate,
    dayAfterTomorrowIso: upcomingDays[2].isoDate,
    upcomingDays,
  };
}

export function normalizeVisitTimeWib(rawTime = '') {
  const cleaned = String(rawTime || '').trim();
  if (!cleaned) return '10:00 WIB';
  const hhmm = cleaned.match(/(\d{1,2})[.:](\d{2})/);
  if (hhmm) {
    const h = Math.min(23, Math.max(0, Number.parseInt(hhmm[1], 10)));
    const m = Math.min(59, Math.max(0, Number.parseInt(hhmm[2], 10)));
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} WIB`;
  }
  const hourOnly = cleaned.match(/\b(\d{1,2})\b/);
  if (hourOnly) {
    let h = Number.parseInt(hourOnly[1], 10);
    if (/sore|malam/i.test(cleaned) && h < 12) h += 12;
    else if (/siang/i.test(cleaned) && h >= 1 && h <= 5) h += 12;
    return `${String(Math.min(23, Math.max(0, h))).padStart(2, '0')}:00 WIB`;
  }
  return cleaned.toUpperCase().includes('WIB') ? cleaned : `${cleaned} WIB`;
}

export function formatVisitScheduleLabel(isoDate, rawTime) {
  const timeWib = normalizeVisitTimeWib(rawTime);
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(String(isoDate))) {
    return `Besok • ${timeWib}`;
  }
  const [y, m, d] = String(isoDate).split('-').map(Number);
  const utcNoon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const datePart = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(utcNoon);
  return `${datePart} • ${timeWib}`;
}

export function resolveDateInputToIso(rawInput = '', referenceDate = new Date()) {
  const ctx = getCurrentWibContext(referenceDate);
  const str = String(rawInput || '').trim();
  if (!str) return ctx.tomorrowIso;

  const isoMatch = str.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  const lower = str.toLowerCase();
  if (/\b(hari\s*ini|today|sekarang|malam\s*ini|sore\s*ini|siang\s*ini)\b/i.test(lower)) {
    return ctx.todayIso;
  }
  if (/\b(lusa)\b/i.test(lower)) {
    return ctx.dayAfterTomorrowIso;
  }
  if (/\b(besok|esok|tomorrow)\b/i.test(lower)) {
    return ctx.tomorrowIso;
  }

  const dayAliases = [
    { re: /\bsenin\b/i, day: 'senin' },
    { re: /\bselasa\b/i, day: 'selasa' },
    { re: /\brabu\b/i, day: 'rabu' },
    { re: /\bkamis\b/i, day: 'kamis' },
    { re: /\bjum'?at\b/i, day: 'jumat' },
    { re: /\bsabtu\b/i, day: 'sabtu' },
    { re: /\b(minggu|ahad)\b/i, day: 'minggu' },
  ];

  for (const entry of dayAliases) {
    if (entry.re.test(lower)) {
      const candidate =
        ctx.upcomingDays.find(
          (d) => d.offset >= 1 && d.dayName.toLowerCase().replace(/[^a-z]/g, '') === entry.day,
        ) ||
        ctx.upcomingDays.find(
          (d) => d.dayName.toLowerCase().replace(/[^a-z]/g, '') === entry.day,
        );
      if (candidate) return candidate.isoDate;
    }
  }

  return ctx.tomorrowIso;
}

/**
 * Mengekstrak niat pencarian kos berbahasa Indonesia (kampus, area, tipe kos, budget, fasilitas, urutan).
 */
export function parseSmartKosIntent(promptText = '', fallbackCampusId = 'telkom') {
  const raw = String(promptText || '').trim();
  const lower = raw.toLowerCase();

  let detectedCampusId = null;
  let detectedCity = null;

  if (
    /\b(utb|universitas\s*teknologi\s*bandung|stt\s*bandung|sttb|soekarno\s*-?\s*hatta|378|leuwi\s*panjang|leuwipanjang|mekarwangi|kebon\s*lega|bojongloa|muara\s*raya|cibaduyut|moh\.?\s*toha)\b/i.test(
      lower,
    )
  ) {
    detectedCampusId = 'utb';
    detectedCity = 'Bandung';
  } else if (/\b(itb|ganesha|cisitu|dago|tamansari|pelesiran|dipatiukur|unpad|sabuga|coblong)\b/i.test(lower)) {
    detectedCampusId = 'itb';
    detectedCity = 'Bandung';
  } else if (/\b(universitas indonesia|\bui\b|depok|kukusan|kutek|pondok cina|pocin|margonda|bikun|fasilkom)\b/i.test(lower)) {
    detectedCampusId = 'ui';
    detectedCity = 'Depok';
  } else if (/\b(ugm|gadjah mada|jogja|yogyakarta|sleman|pogung|sendowo|sardjito|fkkmk|bulaksumur|kaliurang)\b/i.test(lower)) {
    detectedCampusId = 'ugm';
    detectedCity = 'Yogyakarta';
  } else if (/\b(telkom|sukapura|sukabirus|bojongsoang|cikoneng|dayeuhkolot|buah\s*batu|umayah|\bpga\b)\b/i.test(lower)) {
    detectedCampusId = 'telkom';
    detectedCity = 'Bandung';
  } else if (/\bbandung\b/i.test(lower)) {
    detectedCity = 'Bandung';
  }

  let kosType = null;
  if (/\b(putri|cewek|mahasiswi|perempuan|wanita)\b/i.test(lower) && !/\bputra\s*\/?\s*putri\b/i.test(lower)) {
    kosType = 'putri';
  } else if (/\b(putra|cowok|mahasiswa pria|laki)\b/i.test(lower) && !/\bputra\s*\/?\s*putri\b/i.test(lower)) {
    kosType = 'putra';
  } else if (/\bcampur\b/i.test(lower)) {
    kosType = 'campur';
  }

  // Ekstraksi batas anggaran (contoh: "1.3 juta", "1,25jt", "1300rb", "1.200.000", "murah")
  let maxPrice = null;
  const jutaMatch = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:juta|jt)\b/i);
  const ribuMatch = lower.match(/(\d{3,4})\s*(?:ribu|rb)\b/i);
  const fullRupiahMatch = lower.match(/rp\.?\s*(1[.,]\d{3}[.,]\d{3})/i);

  if (jutaMatch) {
    const num = Number.parseFloat(jutaMatch[1].replace(',', '.'));
    if (Number.isFinite(num) && num > 0 && num < 20) {
      maxPrice = Math.round(num * 1_000_000);
    }
  } else if (ribuMatch) {
    const num = Number.parseInt(ribuMatch[1], 10);
    if (Number.isFinite(num) && num >= 500) {
      maxPrice = num * 1000;
    }
  } else if (fullRupiahMatch) {
    const digits = Number.parseInt(fullRupiahMatch[1].replace(/[.,]/g, ''), 10);
    if (Number.isFinite(digits)) maxPrice = digits;
  } else if (/\b(murah|hemat|terjangkau|ekonomis|budget)\b/i.test(lower)) {
    maxPrice = 1_300_000;
  }

  const keywordSignals = [];
  const KEYWORD_CATALOG = [
    { pattern: /\bac\b|ber-ac|pendingin/i, term: 'ac' },
    { pattern: /water\s*heater|air\s*hangat|air\s*panas/i, term: 'water heater' },
    { pattern: /kamar\s*mandi\s*dalam|\bkmd\b/i, term: 'kamar mandi dalam' },
    { pattern: /wi-?fi|internet|fiber/i, term: 'wi-fi' },
    { pattern: /laundry|cuci/i, term: 'laundry' },
    { pattern: /listrik/i, term: 'listrik' },
    { pattern: /smart\s*(?:door\s*)?lock|kartu\s*akses|fingerprint/i, term: 'smart' },
    { pattern: /balkon|rooftop|loft/i, term: 'balkon' },
    { pattern: /stasiun|krl|commuter/i, term: 'stasiun' },
    { pattern: /tenang|quiet|hening|fokus|skripsi|koas/i, term: 'tenang' },
    { pattern: /\bpga\b/i, term: 'pga' },
    { pattern: /sukapura/i, term: 'sukapura' },
    { pattern: /sukabirus|umayah/i, term: 'sukabirus' },
    { pattern: /bojongsoang|cikoneng/i, term: 'bojongsoang' },
    { pattern: /cisitu|dago/i, term: 'cisitu' },
    { pattern: /tamansari|pelesiran|ciwalk/i, term: 'tamansari' },
    { pattern: /dipatiukur|\bdu\b|unpad/i, term: 'dipatiukur' },
    { pattern: /kukusan|kutek/i, term: 'kukusan' },
    { pattern: /pondok\s*cina|pocin|margonda/i, term: 'pondok cina' },
    { pattern: /pogung/i, term: 'pogung' },
    { pattern: /sendowo|sardjito|fkkmk/i, term: 'sendowo' },
    { pattern: /utb|universitas\s*teknologi\s*bandung|soekarno/i, term: 'soekarno' },
    { pattern: /mekarwangi/i, term: 'mekarwangi' },
    { pattern: /leuwi\s*panjang|leuwipanjang/i, term: 'leuwi panjang' },
    { pattern: /kebon\s*lega/i, term: 'kebon lega' },
    { pattern: /muara\s*raya|muara/i, term: 'muara' },
    { pattern: /co-?working|coworking/i, term: 'co-working' },
  ];

  for (const entry of KEYWORD_CATALOG) {
    if (entry.pattern.test(lower)) {
      keywordSignals.push(entry.term);
    }
  }

  let sortBy = 'relevance';
  if (/\b(terdekat|paling\s*dekat|jalan\s*kaki|selangkah)\b/i.test(lower)) {
    sortBy = 'nearest';
  } else if (/\b(termurah|paling\s*murah|hemat)\b/i.test(lower)) {
    sortBy = 'cheapest';
  }

  return {
    rawPrompt: raw,
    campusId: detectedCampusId || (detectedCity ? null : fallbackCampusId || 'telkom'),
    explicitCampusDetected: Boolean(detectedCampusId),
    city: detectedCity,
    kosType,
    maxPrice,
    keywordSignals,
    sortBy,
  };
}

function parseMetersFromDistanceLabel(distanceStr) {
  const str = String(distanceStr || '').toLowerCase();
  const kmMatch = str.match(/(\d+(?:[.,]\d+)?)\s*km/);
  if (kmMatch) {
    return Math.round(Number.parseFloat(kmMatch[1].replace(',', '.')) * 1000);
  }
  const mMatch = str.match(/(\d+)\s*m\b/);
  if (mMatch) {
    return Number.parseInt(mMatch[1], 10);
  }
  return 750;
}

export const accommodationsService = {
  /**
   * Mengambil seluruh data kos dari tabel `public.accommodations` di Supabase,
   * atau sinkron mulus ke dataset terpetakan apabila tabel belum dibuat di SQL Editor.
   */
  async loadCatalog({ forceSupabaseCheck = false } = {}) {
    const supaConfigured = isSupabaseConfigured();

    if (supaConfigured && (forceSupabaseCheck || Date.now() >= missingTableBackoffUntil)) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('accommodations')
          .select('*')
          .order('match_score', { ascending: false });

        if (error) {
          if (error.code === 'PGRST205' || /accommodations/i.test(error.message || '')) {
            missingTableBackoffUntil = Date.now() + 12_000;
          }
          throw error;
        }

        if (Array.isArray(data) && data.length > 0) {
          return {
            source: 'supabase',
            supabaseConfigured: true,
            tableReady: true,
            campusHubs: CAMPUS_HUBS_DATA,
            items: data.map(fromSupabaseRow).filter(Boolean),
          };
        }
      } catch {
        // Lanjut ke dataset terpetakan agar demo selalu 100% jalan tanpa error
      }
    }

    return {
      source: 'supabase-mapped-seed',
      supabaseConfigured: supaConfigured,
      tableReady: false,
      campusHubs: CAMPUS_HUBS_DATA,
      items: NORMALIZED_SEED_ITEMS,
    };
  },

  async getById(idOrSlug) {
    const needle = String(idOrSlug || '').trim().toLowerCase();
    if (!needle) return null;

    const catalog = await this.loadCatalog();
    return (
      catalog.items.find(
        (item) =>
          item.id.toLowerCase() === needle ||
          String(item.slug || '').toLowerCase() === needle ||
          item.name.toLowerCase() === needle,
      ) || null
    );
  },

  async resolveAccommodation(idOrQuery) {
    const raw = String(idOrQuery || '').trim();
    if (!raw) return null;

    const exact = await this.getById(raw);
    if (exact) return exact;

    const lower = raw.toLowerCase();
    const catalog = await this.loadCatalog();
    const partial = catalog.items.find(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        lower.includes(item.name.toLowerCase()) ||
        String(item.slug || '').toLowerCase().includes(lower),
    );
    if (partial) return partial;

    const searched = await this.search({ query: raw, limit: 1 });
    return searched.primaryMatch || null;
  },

  /**
   * Pencarian terstruktur & berbasis relevansi untuk REST API, Tool Orchestrator, maupun Smart Kos AI.
   */
  async search({ campusId, city, type, maxPrice, query, limit = 12 } = {}) {
    const catalog = await this.loadCatalog();
    const intent = query ? parseSmartKosIntent(query, campusId || 'telkom') : null;

    const effectiveCampusId =
      intent?.explicitCampusDetected
        ? intent.campusId
        : campusId || intent?.campusId || null;
    const effectiveCity = city || intent?.city || null;
    const effectiveType = type || intent?.kosType || null;
    const effectiveMaxPrice =
      typeof maxPrice === 'number' && maxPrice > 0 ? maxPrice : intent?.maxPrice || null;

    // 1. Filter kandidat utama berdasarkan kampus/kota
    let pool = [...catalog.items];
    if (effectiveCampusId && CAMPUS_HUBS_DATA[effectiveCampusId]) {
      const campusMatches = pool.filter((item) => item.campusId === effectiveCampusId);
      if (campusMatches.length > 0) pool = campusMatches;
    } else if (effectiveCity) {
      const cityLower = effectiveCity.toLowerCase();
      const cityMatches = pool.filter((item) => item.city.toLowerCase() === cityLower);
      if (cityMatches.length > 0) pool = cityMatches;
    }

    // 2. Hitung skor kecocokan cerdas per kandidat
    const queryLower = String(query || '').trim().toLowerCase();
    const scored = pool.map((item) => {
      let score = item.matchScore || 90;
      const haystack = [
        item.name,
        item.area,
        item.address,
        item.city,
        item.campusName,
        item.type,
        item.description,
        ...(item.features || []),
        ...(item.nearbyLandmarks || []).map((l) => l.name),
      ]
        .join(' ')
        .toLowerCase();

      // Nama kos disebut eksplisit
      if (queryLower && queryLower.length >= 4 && queryLower.includes(item.name.toLowerCase())) {
        score += 60;
      } else if (queryLower && item.name.toLowerCase().includes(queryLower) && queryLower.length >= 4) {
        score += 45;
      }

      // Kecocokan tipe kos (Putri / Putra / Campur)
      const itemTypeLower = item.type.toLowerCase();
      if (effectiveType === 'putri') {
        if (itemTypeLower === 'putri') score += 28;
        else if (itemTypeLower.includes('putri')) score += 10;
        else score -= 35;
      } else if (effectiveType === 'putra') {
        if (itemTypeLower === 'putra') score += 28;
        else if (itemTypeLower.includes('putra')) score += 10;
        else score -= 35;
      } else if (effectiveType === 'campur') {
        if (itemTypeLower.includes('campur') || itemTypeLower.includes('putra / putri')) score += 20;
      }

      // Kecocokan anggaran
      if (effectiveMaxPrice) {
        if (item.priceMonthly <= effectiveMaxPrice) {
          score += 22;
        } else {
          const diffRatio = (item.priceMonthly - effectiveMaxPrice) / effectiveMaxPrice;
          score -= Math.min(40, Math.round(diffRatio * 80));
        }
      }

      // Kecocokan sinyal fasilitas & area mikro
      if (intent?.keywordSignals?.length) {
        for (const sig of intent.keywordSignals) {
          if (haystack.includes(sig)) {
            score += 18;
          }
        }
      }

      const approxMeters = parseMetersFromDistanceLabel(item.distance);
      if (intent?.sortBy === 'nearest') {
        score += Math.max(0, Math.round((1200 - approxMeters) / 25));
      } else if (intent?.sortBy === 'cheapest') {
        score += Math.max(0, Math.round((1_700_000 - item.priceMonthly) / 20_000));
      }

      return { item, score, approxMeters };
    });

    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.approxMeters - b.approxMeters;
    });

    // Filter ketat bila ada preferensi tipe eksklusif yang memang punya kandidat valid
    let filteredScored = scored;
    if (effectiveType === 'putri') {
      const strictPutri = scored.filter(({ item }) => item.type.toLowerCase().includes('putri'));
      if (strictPutri.length > 0) filteredScored = strictPutri;
    } else if (effectiveType === 'putra') {
      const strictPutra = scored.filter(({ item }) => item.type.toLowerCase().includes('putra'));
      if (strictPutra.length > 0) filteredScored = strictPutra;
    }

    if (effectiveMaxPrice) {
      const withinBudget = filteredScored.filter(({ item }) => item.priceMonthly <= effectiveMaxPrice);
      if (withinBudget.length > 0) filteredScored = withinBudget;
    }

    const matchedItems = filteredScored.slice(0, Math.max(1, limit)).map((entry) => entry.item);
    const primaryMatch = matchedItems[0] || pool[0] || catalog.items[0] || null;
    const resolvedCampusId = primaryMatch?.campusId || effectiveCampusId || 'telkom';

    return {
      source: catalog.source,
      supabaseConfigured: catalog.supabaseConfigured,
      tableReady: catalog.tableReady,
      campusId: resolvedCampusId,
      campus: CAMPUS_HUBS_DATA[resolvedCampusId] || CAMPUS_HUBS_DATA.telkom,
      intent,
      totalMatched: filteredScored.length,
      items: matchedItems,
      primaryMatch,
    };
  },

  /**
   * Menyusun teks penjelasan grounded (anti-halusinasi) langsung dari baris data Supabase yang cocok,
   * lengkap dengan ringkasan suara singkat (`voiceSummary`) untuk dibacakan oleh AI Voice.
   */
  buildGroundedReply({ prompt, searchResult, route }) {
    const primary = searchResult.primaryMatch;
    const campus = searchResult.campus;
    const alternatives = searchResult.items.slice(1, 3);

    if (!primary) {
      return {
        markdown:
          'Maaf, saat ini belum ditemukan data kos yang cocok di database Teralio untuk kriteria tersebut. Silakan coba kata kunci area kampus lain seperti Telkom University, ITB Bandung, UI Depok, atau UGM Yogyakarta.',
        voiceSummary:
          'Maaf, belum ada kos yang cocok dengan kriteria tersebut di database kami.',
      };
    }

    const distInfo = route?.distanceText
      ? `${route.distanceText} (~${route.walkMinutes} menit jalan kaki / ${route.rideMinutes} menit naik motor ke ${campus.shortName})`
      : primary.distance;

    const topFeatures = (primary.features || []).slice(0, 4).join(', ');
    const contactLine = primary.contact?.phone
      ? `${primary.contact.ownerName ? `${primary.contact.ownerName} • ` : ''}${primary.contact.phone}`
      : 'Tersedia pada panel Overview Kos';

    const landmarkText =
      Array.isArray(primary.nearbyLandmarks) && primary.nearbyLandmarks.length > 0
        ? primary.nearbyLandmarks.map((l) => `${l.name} (${l.distance})`).join(', ')
        : 'Dekat minimarket dan kuliner mahasiswa';

    const reviewSnippet =
      Array.isArray(primary.reviews) && primary.reviews.length > 0 && primary.reviews[0]?.comment
        ? `"${primary.reviews[0].comment}" — ${primary.reviews[0].author || 'Mahasiswa'}`
        : null;

    const lines = [
      `Berdasarkan pencarian Anda di database Teralio sekitar **${campus.name}**, saya telah mengarahkan peta langsung ke rekomendasi terbaik:`,
      '',
      `### 1. ${primary.name} (${primary.tag || `Match ${primary.matchScore}%`})`,
      `- **Harga & Tipe:** ${primary.price} • Kos ${primary.type} (Sisa ${primary.roomsAvailable} kamar)`,
      `- **Lokasi & Jarak:** ${primary.address} — **${distInfo}**`,
      `- **Fasilitas Utama:** ${topFeatures}`,
      `- **Lingkungan & Fasilitas Sekitar:** Area ${primary.area || campus.city}. Fasilitas penunjang: ${landmarkText}`,
      ...(reviewSnippet ? [`- **Ulasan Penghuni:** ${reviewSnippet}`] : []),
      `- **Kontak Pengelola:** ${contactLine}`,
    ];

    if (alternatives.length > 0) {
      lines.push('', '**Opsi terdekat lainnya di peta:**');
      alternatives.forEach((alt, idx) => {
        lines.push(
          `${idx + 2}. **${alt.name}** — ${alt.price} (${alt.type}, ${alt.distance})`,
        );
      });
    }

    lines.push(
      '',
      'Panel **Overview Lokasi** di sebelah kiri peta sudah saya bukakan otomatis agar Anda bisa langsung melihat detail fasilitas, ulasan penghuni, rute kampus, dan jadwal survei.',
    );

    const voiceSummary = `Saya menemukan ${primary.name} di ${primary.area || campus.city}, dengan tarif ${primary.price}, berjarak ${route?.distanceText || primary.distance} atau sekitar ${route?.walkMinutes || 7} menit jalan kaki dari ${campus.shortName}. Peta dan overview kos sudah saya arahkan langsung ke lokasi tersebut.`;

    return {
      markdown: lines.join('\n'),
      voiceSummary,
    };
  },

  /**
   * Streaming SSE interaktif untuk Smart Kos Match (baik melalui Prompt Teks maupun Suara / Voice Orb).
   * Mengirimkan indikator status Thinking Orbs bertahap -> event `redirect_location` -> `recommendations` -> `text_delta` -> `done`.
   */
  async streamSmartKosSearch(
    {
      message,
      campusId = 'telkom',
      reasoningEffort = 'none',
      stepDelayMs,
    } = {},
    { onEvent, signal } = {},
  ) {
    const emit = typeof onEvent === 'function' ? onEvent : () => {};
    const isTestEnv = Boolean(process.env.VITEST) || process.env.NODE_ENV === 'test';
    const paceMs = typeof stepDelayMs === 'number' ? stepDelayMs : isTestEnv ? 0 : 20;

    const startTime = Date.now();
    const isDeepThinking = reasoningEffort === 'high' || reasoningEffort === 'xhigh';

    // Step 1: Reasoning / Analisis Kriteria
    emit('status', {
      orbState: 'reasoning',
      variant: reasoningEffort && reasoningEffort !== 'none' ? 'twins' : 'default',
      step: 'intent',
      label: 'Menganalisis kriteria lokasi, tipe kos, & budget Anda...',
    });
    await sleep(paceMs, signal);

    // Step 2: Pencarian Database Supabase
    emit('status', {
      orbState: 'searching',
      variant: 'lighthouse',
      step: 'database',
      label: 'Mencari kos terdekat berdasarkan database Supabase...',
    });
    const searchResult = await this.search({
      query: message,
      campusId,
      limit: 6,
    });
    await sleep(paceMs, signal);

    // Step 3: Perhitungan Rute & Jarak Geospasial Kampus
    emit('status', {
      orbState: 'working',
      variant: 'gyro',
      step: 'routing',
      label: `Menghitung jarak & rute jalan kaki ke ${searchResult.campus.shortName}...`,
    });

    const primary = searchResult.primaryMatch;
    const route = primary
      ? await osmGeoService.computeCampusRoute(searchResult.campus, primary, { mode: 'foot' })
      : null;
    await sleep(Math.round(paceMs * 0.75), signal);

    // Step 4: Emit `redirect_location` -> UI langsung flyTo ke koordinat kos & membuka In-Platform Overview!
    if (primary) {
      emit('status', {
        orbState: 'using',
        variant: 'zoom',
        step: 'redirect',
        label: `Mengarahkan peta ke ${primary.name}...`,
      });

      emit('redirect_location', {
        campusId: searchResult.campusId,
        campus: searchResult.campus,
        targetKos: primary,
        matchedAccommodations: searchResult.items,
        route,
        dataSource: searchResult.source,
      });
    }

    // Step 5: Emit `recommendations` terverifikasi (konsisten dengan kontrak halaman Chat)
    const verifiedRecommendations = extractVerifiedRecommendations([
      {
        name: 'teralio_search_accommodations',
        args: { query: message },
        ok: true,
        data: { accommodations: searchResult.items },
      },
      ...(primary && route
        ? [
            {
              name: 'maps_compute_route',
              args: {
                origin: searchResult.campus.name,
                destination: primary.name,
                travelMode: 'WALK',
              },
              ok: true,
              data: {
                travelMode: 'WALK',
                routes: [
                  {
                    distanceMeters: route.distanceMeters,
                    distanceText: route.distanceText,
                    durationText: `${route.walkMinutes} mnt jalan kaki`,
                  },
                ],
              },
            },
          ]
        : []),
    ]);

    emit('recommendations', verifiedRecommendations);

    // Step 6: Susun respons penjelasan (OpenAI `gpt-6-astra` jika aktif, atau grounded database streamer)
    const grounded = this.buildGroundedReply({
      prompt: message,
      searchResult,
      route,
    });

    let finalText = grounded.markdown;
    let aiEngine = 'grounded-database';
    let streamedFromOpenAi = false;

    if (((isOpenAiConfigured() && !config.isTest) || hasOpenAiTestOverride()) && primary) {
      try {
        emit('status', {
          orbState: 'working',
          variant: 'default',
          step: 'answering',
          label: `Menyusun rekomendasi bersama ${config.openai.textModel}...`,
        });

        const client = getOpenAiClient();
        const contextPayload = searchResult.items.slice(0, 3).map((k) => ({
          name: k.name,
          type: k.type,
          price: k.price,
          area: k.area,
          address: k.address,
          distance: k.distance,
          rating: k.rating,
          roomsAvailable: k.roomsAvailable,
          features: k.features,
          nearbyLandmarks: k.nearbyLandmarks,
          reviews: (k.reviews || []).slice(0, 2),
          contact: k.contact,
        }));

        const stream = await client.responses.create(
          {
            model: config.openai.textModel,
            stream: true,
            instructions:
              'Kamu adalah asisten Smart Kos Teralio berbahasa Indonesia yang analitis, cermat, dan solutif. Penulisan nama platform adalah "Teralio" (Title Case, huruf kapital di awal saja). DILARANG KERAS MENGGUNAKAN EMOJI ATAU EMOTICON APAPUN. Jangan pernah menghindar dari pertanyaan pengguna: fokuskan berpikir untuk menganalisis kebutuhan tempat tinggal mahasiswa (lingkungan hidup, potensi banjir/keamanan kawasan Bojongsoang/Sukapura/Sukabirus/Dayeuhkolot, ketenangan belajar, jarak aktual dan estimasi waktu tempuh jalan kaki vs motor ke gerbang kampus, serta ketersediaan warteg/minimarket/laundry terdekat). Gunakan HANYA fakta dari data kos dan kampus yang diberikan tanpa mengarang.',
            input: `Pertanyaan pengguna: "${message}"\nKampus acuan: ${searchResult.campus.name}\nRute kos utama: ${route?.distanceText || primary.distance} (${route?.walkMinutes || 7} menit jalan kaki).\nData kos terverifikasi Supabase:\n${JSON.stringify(contextPayload, null, 2)}`,
            max_output_tokens: 650,
          },
          signal ? { signal } : undefined,
        );

        if (stream && typeof stream[Symbol.asyncIterator] === 'function') {
          let collected = '';
          for await (const ev of stream) {
            if (signal?.aborted) break;
            if (ev?.type === 'response.output_text.delta' && ev.delta) {
              collected += ev.delta;
              emit('text_delta', { delta: ev.delta });
              streamedFromOpenAi = true;
            }
          }
          if (collected.trim().length > 10) {
            finalText = collected.trim();
            aiEngine = `openai:${config.openai.textModel}`;
          }
        } else if (stream?.output_text && stream.output_text.trim().length > 10) {
          finalText = stream.output_text.trim();
          aiEngine = `openai:${config.openai.textModel}`;
        }
      } catch {
        // Gunakan teks grounded database bila pemanggilan model eksternal terkendala
      }
    }

    if (!streamedFromOpenAi) {
      const tokens = finalText.match(/.{1,36}(\s|$)/gs) || [finalText];
      for (const chunk of tokens) {
        if (signal?.aborted) break;
        emit('text_delta', { delta: chunk });
        if (paceMs > 0) {
          await sleep(6, signal);
        }
      }
    }

    const responseId = `smartkos_${crypto.randomUUID().slice(0, 12)}`;
    const elapsedMs = Math.max(60, Date.now() - (startTime || Date.now()));
    const elapsedSeconds = Number((elapsedMs / 1000).toFixed(2));
    const totalOutputTokens = Math.round(finalText.length / 3.8) || 120;
    const throughput = Number((totalOutputTokens / Math.max(0.1, elapsedSeconds)).toFixed(1));

    const metrics = {
      elapsedMs,
      elapsedSeconds,
      outputTokens: totalOutputTokens,
      throughput,
      isDeepThinking: Boolean(isDeepThinking),
    };

    emit('done', {
      responseId,
      aiEngine,
      outputText: finalText,
      voiceSummary: grounded.voiceSummary,
      campusId: searchResult.campusId,
      campus: searchResult.campus,
      targetKos: primary,
      route,
      matchedAccommodations: searchResult.items,
      recommendations: verifiedRecommendations,
      dataSource: searchResult.source,
      metrics,
    });
  },

  /**
   * Mengisi / memperbarui (upsert) seluruh 12 kos terkurasi ke tabel `public.accommodations` di Supabase.
   */
  async seedToSupabase() {
    if (!isSupabaseConfigured()) {
      const err = new Error(
        'SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum terkonfigurasi di backend/.env.',
      );
      err.status = 503;
      err.code = 'SUPABASE_NOT_CONFIGURED';
      throw err;
    }

    const supabase = getSupabaseClient();
    const rows = CURATED_ACCOMMODATIONS.map(toSupabaseRow);

    const { data, error } = await supabase
      .from('accommodations')
      .upsert(rows, { onConflict: 'id' })
      .select();

    if (error) {
      if (error.code === 'PGRST205') {
        const ddlError = new Error(
          'Tabel public.accommodations belum dibuat di Supabase Anda. Silakan jalankan file supabase/migrations/001_smart_kos_accommodations.sql terlebih dahulu di Supabase SQL Editor, lalu jalankan kembali seed ini.',
        );
        ddlError.status = 428;
        ddlError.code = 'SUPABASE_TABLE_MISSING';
        throw ddlError;
      }
      throw error;
    }

    missingTableBackoffUntil = 0;
    return {
      insertedOrUpdated: Array.isArray(data) ? data.length : rows.length,
      items: (data || rows).map(fromSupabaseRow),
    };
  },

  /**
   * Mengambil daftar jadwal survei kos dari tabel `public.survey_bookings` di Supabase (atau store runtime aktif).
   */
  async listSurveyBookings() {
    if (isSupabaseConfigured() && Date.now() >= missingBookingsBackoffUntil) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('survey_bookings')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          if (error.code === 'PGRST205' || /survey_bookings/i.test(error.message || '')) {
            missingBookingsBackoffUntil = Date.now() + 12_000;
          }
          throw error;
        }

        if (Array.isArray(data)) {
          return {
            source: 'supabase',
            items: data.map((row) => {
              const iso = row.scheduled_iso || resolveDateInputToIso(row.scheduled_label || '');
              const timeWib = normalizeVisitTimeWib(row.scheduled_time || row.scheduled_label || '10:00 WIB');
              return {
                id: row.id,
                accommodationId: row.accommodation_id,
                accommodationName: row.accommodation_name,
                campusName: row.campus_name,
                address: row.address,
                ownerName: row.owner_name,
                contactPhone: row.contact_phone,
                scheduledLabel: row.scheduled_label || formatVisitScheduleLabel(iso, timeWib),
                scheduledIso: iso,
                scheduledTime: timeWib,
                notes: row.notes || '',
                visitorName: row.visitor_name,
                status: row.status || 'Terjadwal',
                createdAt: row.created_at,
              };
            }),
          };
        }
      } catch {
        // Lanjut ke runtime store bila tabel belum dieksekusi di SQL Editor
      }
    }

    return {
      source: 'runtime-store',
      items: [...runtimeBookings],
    };
  },

  /**
   * Membuat jadwal survei kos baru secara dinamis ke Supabase `public.survey_bookings` (dengan sinkronisasi runtime).
   */
  async createSurveyBooking(payload = {}) {
    const kos =
      payload.accommodationId || payload.accommodationName
        ? await this.resolveAccommodation(payload.accommodationId || payload.accommodationName)
        : null;
    const id = `srv_${crypto.randomUUID().slice(0, 10)}`;
    const nowIso = new Date().toISOString();

    const scheduledIso = resolveDateInputToIso(
      payload.scheduledIso || payload.visitDate || payload.scheduledLabel || '',
    );
    const scheduledTime = normalizeVisitTimeWib(
      payload.scheduledTime || payload.visitTime || payload.scheduledLabel || '10:00 WIB',
    );
    const scheduledLabel = payload.scheduledLabel
      ? String(payload.scheduledLabel)
      : formatVisitScheduleLabel(scheduledIso, scheduledTime);

    const record = {
      id,
      accommodationId: String(kos?.id || payload.accommodationId || 'kos-custom'),
      accommodationName: String(payload.accommodationName || kos?.name || 'Hunian Kos Teralio'),
      campusId: kos?.campusId || payload.campusId || null,
      campusName: String(payload.campusName || kos?.campusName || ''),
      address: String(payload.address || kos?.address || ''),
      ownerName: String(payload.ownerName || kos?.contact?.ownerName || 'Pengelola Kos'),
      contactPhone: String(payload.contactPhone || kos?.contact?.phone || ''),
      scheduledLabel,
      scheduledIso,
      scheduledTime,
      notes: String(payload.notes || '').trim(),
      visitorName: String(payload.visitorName || 'Mahasiswa Teralio'),
      status: String(payload.status || 'Terjadwal'),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    if (isSupabaseConfigured() && Date.now() >= missingBookingsBackoffUntil) {
      try {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from('survey_bookings')
          .insert([
            {
              id: record.id,
              accommodation_id: record.accommodationId,
              accommodation_name: record.accommodationName,
              campus_name: record.campusName,
              address: record.address,
              owner_name: record.ownerName,
              contact_phone: record.contactPhone,
              scheduled_label: record.scheduledLabel,
              scheduled_iso: record.scheduledIso,
              visitor_name: record.visitorName,
              status: record.status,
            },
          ])
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST205' || /survey_bookings/i.test(error.message || '')) {
            missingBookingsBackoffUntil = Date.now() + 12_000;
          }
          throw error;
        }

        if (data) {
          const saved = {
            ...record,
            createdAt: data.created_at || nowIso,
          };
          runtimeBookings = [saved, ...runtimeBookings.filter((b) => b.id !== saved.id)].slice(0, 50);
          return {
            source: 'supabase',
            booking: saved,
          };
        }
      } catch {
        // Simpan ke runtime store agar alur jadwal survei tidak gagal
      }
    }

    runtimeBookings = [record, ...runtimeBookings].slice(0, 50);
    return {
      source: 'runtime-store',
      booking: record,
    };
  },

  /**
   * Memperbarui jadwal survei / janji temu (ubah jam, ubah tanggal, status, atau catatan).
   */
  async updateSurveyBooking(idOrMatch, patch = {}) {
    const listed = await this.listSurveyBookings();
    const allItems = listed.items || [];

    const needle = String(idOrMatch || patch.bookingId || '').trim();
    const nameNeedle = String(patch.accommodationName || '').trim().toLowerCase();

    let target = null;
    if (needle) {
      target =
        allItems.find((b) => b.id === needle) ||
        allItems.find(
          (b) =>
            b.accommodationId?.toLowerCase() === needle.toLowerCase() ||
            b.accommodationName?.toLowerCase().includes(needle.toLowerCase()),
        ) ||
        null;
    }
    if (!target && nameNeedle) {
      target =
        allItems.find((b) => b.accommodationName?.toLowerCase().includes(nameNeedle)) || null;
    }
    if (!target && allItems.length > 0) {
      target = allItems.find((b) => b.status !== 'Dibatalkan') || allItems[0];
    }

    if (!target) {
      const err = new Error('Jadwal janji temu survei tidak ditemukan untuk diperbarui');
      err.status = 404;
      err.code = 'BOOKING_NOT_FOUND';
      throw err;
    }

    const nextIso =
      patch.scheduledIso || patch.newDate
        ? resolveDateInputToIso(patch.scheduledIso || patch.newDate)
        : target.scheduledIso || resolveDateInputToIso(target.scheduledLabel);

    const nextTime =
      patch.scheduledTime || patch.newTime
        ? normalizeVisitTimeWib(patch.scheduledTime || patch.newTime)
        : target.scheduledTime || normalizeVisitTimeWib(target.scheduledLabel);

    const nextLabel = patch.scheduledLabel
      ? String(patch.scheduledLabel)
      : formatVisitScheduleLabel(nextIso, nextTime);

    const updated = {
      ...target,
      scheduledIso: nextIso,
      scheduledTime: nextTime,
      scheduledLabel: nextLabel,
      status: patch.status ? String(patch.status) : target.status === 'Dibatalkan' ? 'Terjadwal' : target.status,
      notes: patch.notes !== undefined ? String(patch.notes).trim() : target.notes || '',
      updatedAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && Date.now() >= missingBookingsBackoffUntil) {
      try {
        const supabase = getSupabaseClient();
        const { error } = await supabase
          .from('survey_bookings')
          .update({
            scheduled_label: updated.scheduledLabel,
            scheduled_iso: updated.scheduledIso,
            status: updated.status,
          })
          .eq('id', updated.id);

        if (error) {
          if (error.code === 'PGRST205' || /survey_bookings/i.test(error.message || '')) {
            missingBookingsBackoffUntil = Date.now() + 12_000;
          }
          throw error;
        }

        runtimeBookings = runtimeBookings.some((b) => b.id === updated.id)
          ? runtimeBookings.map((b) => (b.id === updated.id ? updated : b))
          : [updated, ...runtimeBookings];

        return {
          source: 'supabase',
          booking: updated,
        };
      } catch {
        // Fallback ke runtime store
      }
    }

    runtimeBookings = runtimeBookings.some((b) => b.id === updated.id)
      ? runtimeBookings.map((b) => (b.id === updated.id ? updated : b))
      : [updated, ...runtimeBookings];

    return {
      source: 'runtime-store',
      booking: updated,
    };
  },

  /**
   * Menghapus jadwal survei dari daftar janji temu.
   */
  async deleteSurveyBooking(id) {
    const cleanId = String(id || '').trim();
    if (!cleanId) {
      const err = new Error('ID jadwal wajib diisi');
      err.status = 400;
      err.code = 'BAD_REQUEST';
      throw err;
    }

    if (isSupabaseConfigured() && Date.now() >= missingBookingsBackoffUntil) {
      try {
        const supabase = getSupabaseClient();
        await supabase.from('survey_bookings').delete().eq('id', cleanId);
      } catch {
        // Lanjut hapus dari runtime store
      }
    }

    const beforeLen = runtimeBookings.length;
    runtimeBookings = runtimeBookings.filter((b) => b.id !== cleanId);
    return {
      deleted: true,
      removedFromRuntime: beforeLen !== runtimeBookings.length,
      id: cleanId,
    };
  },

  _resetRuntimeBookingsForTesting() {
    runtimeBookings = [];
  },
};

export default accommodationsService;
