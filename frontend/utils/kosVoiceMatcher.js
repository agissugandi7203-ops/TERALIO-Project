/**
 * Pencocok nama kos deterministik dari transkrip percakapan suara/teks.
 * Berfungsi sebagai pengaman multi-turn (giliran ke-2, ke-3, dst.) agar kamera peta
 * SELALU berpindah (`flyTo`) ke kos yang sedang dibahas meskipun model AI menjawab
 * langsung dari konteks percakapan sebelumnya.
 */
const GENERIC_WORDS = new Set([
  'kos',
  'kost',
  'student',
  'residence',
  'exclusive',
  'suites',
  'house',
  'paviliun',
  'boarding',
  'smart',
  'living',
  'co-living',
  'putra',
  'putri',
  'bandung',
  'depok',
  'yogyakarta',
]);

export function findMentionedKosInText(text = '', catalog = []) {
  const lower = String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!lower || lower.length < 4 || !Array.isArray(catalog) || catalog.length === 0) {
    return null;
  }

  let bestItem = null;
  let bestScore = 0;

  for (const item of catalog) {
    if (!item?.name) continue;
    const itemNameLower = item.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (lower.includes(itemNameLower)) {
      return item;
    }

    const distinctiveTokens = itemNameLower
      .split(' ')
      .filter((tok) => tok.length >= 3 && !GENERIC_WORDS.has(tok));

    if (distinctiveTokens.length === 0) continue;

    let matchedCount = 0;
    for (const tok of distinctiveTokens) {
      if (lower.includes(tok)) {
        matchedCount += 1;
      }
    }

    // Butuh minimal 2 kata khas cocok, atau 1 kata khas unik >= 6 huruf (misal "mekarwangi", "harmoni", "cisitu", "kukusan", "pogung")
    const hasStrongSingle =
      matchedCount === 1 &&
      distinctiveTokens.some((tok) => tok.length >= 6 && lower.includes(tok));

    if (matchedCount >= 2 || hasStrongSingle) {
      const score = matchedCount * 10 + (hasStrongSingle ? 4 : 0);
      if (score > bestScore) {
        bestScore = score;
        bestItem = item;
      }
    }
  }

  return bestItem;
}

export default findMentionedKosInText;
