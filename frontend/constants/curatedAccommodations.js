/**
 * Dataset Hunian / Kos Terkurasi TERALIO (Mapped 1:1 ke skema tabel Supabase `public.accommodations`).
 * Total 46 hunian terverifikasi di Telkom University & kota pendidikan Indonesia.
 */

export const CAMPUS_HUBS_DATA = {
  "utb": {
    "id": "utb",
    "shortName": "UTB Bandung",
    "name": "Universitas Teknologi Bandung (UTB)",
    "city": "Bandung",
    "address": "Jl. Soekarno-Hatta No. 378, Kebon Lega, Bojongloa Kidul, Kota Bandung",
    "lat": -6.9482,
    "lng": 107.6011
  },
  "telkom": {
    "id": "telkom",
    "shortName": "Telkom Univ",
    "name": "Telkom University Bandung",
    "city": "Bandung",
    "address": "Jl. Telekomunikasi No. 1, Terusan Buahbatu, Bandung",
    "lat": -6.9733,
    "lng": 107.6305
  },
  "itb": {
    "id": "itb",
    "shortName": "ITB Bandung",
    "name": "Institut Teknologi Bandung (Ganesha)",
    "city": "Bandung",
    "address": "Jl. Ganesa No. 10, Coblong, Kota Bandung",
    "lat": -6.8915,
    "lng": 107.6107
  },
  "ui": {
    "id": "ui",
    "shortName": "UI Depok",
    "name": "Universitas Indonesia Depok",
    "city": "Depok",
    "address": "Kampus Baru UI Depok, Jawa Barat",
    "lat": -6.3628,
    "lng": 106.8271
  },
  "ugm": {
    "id": "ugm",
    "shortName": "UGM Jogja",
    "name": "Universitas Gadjah Mada Yogyakarta",
    "city": "Yogyakarta",
    "address": "Bulaksumur, Caturtunggal, Sleman, DIY",
    "lat": -7.7713,
    "lng": 110.3775
  }
};

export const CURATED_ACCOMMODATIONS = [
  {
    "id": "kos-utb-1",
    "slug": "soekarno-hatta-378-student-residence",
    "campusId": "utb",
    "campusName": "Universitas Teknologi Bandung (UTB)",
    "city": "Bandung",
    "area": "Kebon Lega, Soekarno-Hatta",
    "name": "Soekarno Hatta 378 Student Residence",
    "address": "Jl. Soekarno-Hatta Gg. Kebon Lega II No. 14, Bojongloa Kidul, Kota Bandung",
    "lat": -6.9474,
    "lng": 107.6021,
    "priceMonthly": 1200000,
    "price": "Rp1.200.000 / bln",
    "distance": "180m dari Kampus UTB",
    "type": "Putra / Putri",
    "matchScore": 99,
    "tag": "Match 99%",
    "rating": 4.9,
    "reviewsCount": 56,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Hunian mahasiswa paling dekat dari gedung utama Universitas Teknologi Bandung (UTB) Jl. Soekarno-Hatta No. 378—cukup 3 menit jalan kaki, dilengkapi fiber optic 100 Mbps dan kamar mandi dalam.",
    "contact": {
      "ownerName": "Bapak H. Asep Suryana",
      "phone": "+62 812-2301-3780",
      "whatsapp": "6281223013780"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Wi-Fi Fiber 100 Mbps",
      "Meja Belajar & Kursi Kerja",
      "Akses Kunci 24 Jam",
      "CCTV & Parkir Motor Beratap"
    ],
    "nearbyLandmarks": [
      {
        "name": "Kampus Utama UTB (Soekarno-Hatta 378)",
        "distance": "180 m • 3 mnt jalan kaki"
      },
      {
        "name": "Terminal & Halte Leuwi Panjang",
        "distance": "450 m • 5 mnt jalan kaki"
      },
      {
        "name": "Minimarket Soekarno-Hatta",
        "distance": "110 m • 2 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Rizwan Fauzi (Teknik Informatika UTB)",
        "rating": 5,
        "comment": "Dekat banget sama kampus UTB, jalan kaki 3 menit sampai kelas, internet kencang buat ngoding."
      },
      {
        "author": "Nisa Rahmawati (DKV UTB)",
        "rating": 5,
        "comment": "Kamarnya bersih, tenang meski dekat jalan utama Soekarno-Hatta."
      }
    ],
    "accentPalette": [
      "#1e293b",
      "#334155"
    ]
  },
  {
    "id": "kos-utb-2",
    "slug": "mekarwangi-putri-exclusive-utb",
    "campusId": "utb",
    "campusName": "Universitas Teknologi Bandung (UTB)",
    "city": "Bandung",
    "area": "Mekarwangi, Bojongloa Kidul",
    "name": "Mekarwangi Putri Exclusive Kost",
    "address": "Jl. Mekar Utama No. 8, Mekarwangi, Bojongloa Kidul, Kota Bandung",
    "lat": -6.9511,
    "lng": 107.6038,
    "priceMonthly": 1350000,
    "price": "Rp1.350.000 / bln",
    "distance": "420m dari Kampus UTB",
    "type": "Putri",
    "matchScore": 97,
    "tag": "Match 97%",
    "rating": 4.9,
    "reviewsCount": 42,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.30 – 20.30 WIB",
    "verified": true,
    "description": "Kos khusus mahasiswi di komplek elit Mekarwangi belakang UTB yang aman, rapi, dan dekat pusat kuliner Mekarwangi, dilengkapi water heater serta kamar ber-AC.",
    "contact": {
      "ownerName": "Ibu Lina Marlina",
      "phone": "+62 813-2188-4490",
      "whatsapp": "6281321884490"
    },
    "features": [
      "AC Dingin",
      "Water Heater",
      "Kamar Mandi Dalam",
      "Smart Door Lock",
      "Dapur Bersih & Dispenser RO"
    ],
    "nearbyLandmarks": [
      {
        "name": "Universitas Teknologi Bandung (UTB)",
        "distance": "420 m • 5 mnt jalan kaki"
      },
      {
        "name": "Kawasan Kuliner Mekarwangi",
        "distance": "150 m • 2 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Siti Nurhaliza (Bisnis Digital UTB)",
        "rating": 5,
        "comment": "Lingkungan komplek Mekarwangi aman banget buat mahasiswi, ke UTB tinggal jalan kaki."
      }
    ],
    "accentPalette": [
      "#1e293b",
      "#475569"
    ]
  },
  {
    "id": "kos-utb-3",
    "slug": "leuwi-panjang-tech-paviliun",
    "campusId": "utb",
    "campusName": "Universitas Teknologi Bandung (UTB)",
    "city": "Bandung",
    "area": "Leuwi Panjang, Kebon Lega",
    "name": "Leuwi Panjang Tech Paviliun",
    "address": "Jl. Leuwi Panjang Gg. Kebon Kalapa No. 21, Bojongloa Kidul, Kota Bandung",
    "lat": -6.9465,
    "lng": 107.5983,
    "priceMonthly": 1050000,
    "price": "Rp1.050.000 / bln",
    "distance": "360m dari Kampus UTB",
    "type": "Putra",
    "matchScore": 95,
    "tag": "Best Value UTB",
    "rating": 4.8,
    "reviewsCount": 34,
    "roomsAvailable": 4,
    "visitingHours": "Setiap hari • 08.00 – 21.30 WIB",
    "verified": true,
    "description": "Kos putra ramah kantong mahasiswa UTB dengan tarif sudah termasuk listrik dan air, kamar mandi dalam, serta akses cepat ke koridor Trans Metro Bandung & Leuwi Panjang.",
    "contact": {
      "ownerName": "Bapak Dani Ramdani",
      "phone": "+62 821-1765-9022",
      "whatsapp": "6282117659022"
    },
    "features": [
      "Listrik & Air Termasuk",
      "Kamar Mandi Dalam",
      "Wi-Fi Cepat",
      "Parkir Motor Luas",
      "Bebas Jam Malam"
    ],
    "nearbyLandmarks": [
      {
        "name": "Kampus UTB Bandung",
        "distance": "360 m • 4 mnt jalan kaki"
      },
      {
        "name": "RS Immanuel Bandung",
        "distance": "900 m • 3 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Fikri Maulana (Teknik Industri UTB)",
        "rating": 5,
        "comment": "Harga paling bersahabat dekat UTB dan sudah include listrik."
      }
    ],
    "accentPalette": [
      "#1e293b",
      "#334155"
    ]
  },
  {
    "id": "kos-utb-4",
    "slug": "muara-raya-coliving-utb",
    "campusId": "utb",
    "campusName": "Universitas Teknologi Bandung (UTB)",
    "city": "Bandung",
    "area": "Komplek Muara, Soekarno-Hatta",
    "name": "Muara Raya Co-Living UTB",
    "address": "Jl. Muara Raya No. 19, Pelindung Hewan, Astanaanyar, Kota Bandung",
    "lat": -6.9449,
    "lng": 107.6042,
    "priceMonthly": 1450000,
    "price": "Rp1.450.000 / bln",
    "distance": "520m dari Kampus UTB",
    "type": "Campur",
    "matchScore": 96,
    "tag": "Co-Working Space",
    "rating": 4.8,
    "reviewsCount": 39,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 09.00 – 21.00 WIB",
    "verified": true,
    "description": "Co-living modern di Komplek Muara seberang koridor UTB Soekarno-Hatta, memiliki ruang diskusi tim untuk lomba/tugas kuliah, Wi-Fi 150 Mbps, dan kamar ber-AC.",
    "contact": {
      "ownerName": "Bapak Reza Darmawan",
      "phone": "+62 811-2244-7890",
      "whatsapp": "6281122447890"
    },
    "features": [
      "Ruang Diskusi & Co-Working",
      "AC Inverter",
      "Wi-Fi 150 Mbps",
      "Kamar Mandi Dalam + Water Heater",
      "Pantry & Kulkas Bersama"
    ],
    "nearbyLandmarks": [
      {
        "name": "Universitas Teknologi Bandung (UTB)",
        "distance": "520 m • 6 mnt jalan kaki"
      },
      {
        "name": "Taman Tegallega Bandung",
        "distance": "1,2 km • 4 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Aldi Pratama (Informatika UTB)",
        "rating": 5,
        "comment": "Co-working space di lantai bawah nyaman banget buat kerja tim persiapan lomba."
      }
    ],
    "accentPalette": [
      "#1e293b",
      "#334155"
    ]
  },
  {
    "id": "kos-1",
    "slug": "kos-harmoni-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Kos Harmoni Sukapura",
    "address": "Jl. Sukapura No. 18, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9708,
    "lng": 107.6334,
    "priceMonthly": 1250000,
    "price": "Rp1.250.000 / bln",
    "distance": "650m dari Gerbang Sukapura",
    "type": "Putra / Putri",
    "matchScore": 96,
    "tag": "Match 96%",
    "rating": 4.9,
    "reviewsCount": 48,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Hunian mahasiswa modern dengan pencahayaan alami, koneksi fiber optic 100 Mbps stabil untuk kuliah daring, serta akses jalan kaki 7 menit ke Gerbang Sukapura Telkom University.",
    "contact": {
      "ownerName": "Bapak Herman Pratama",
      "phone": "+62 812-2104-8891",
      "whatsapp": "6281221048891"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Wi-Fi 100 Mbps",
      "Kasur Springbed",
      "Meja Belajar Ergonomis",
      "CCTV 24 Jam",
      "Parkir Motor Beratap"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Sukapura Telkom Univ",
        "distance": "650 m • 7 mnt jalan kaki"
      },
      {
        "name": "Indomaret Sukapura Raya",
        "distance": "120 m • 2 mnt jalan kaki"
      },
      {
        "name": "Klinik Telkomedika",
        "distance": "780 m • 3 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Raka Pratama (Informatika)",
        "rating": 5,
        "comment": "Wi-Fi sangat stabil buat nugas malam, lingkungan bersih dan Bapak kos responsif."
      },
      {
        "author": "Nadia Putri (DKV)",
        "rating": 5,
        "comment": "Jarak ke kampus dekat sekali, banyak kuliner mahasiswa di sepanjang jalan."
      }
    ],
    "accentPalette": [
      "#1d4ed8",
      "#38bdf8"
    ]
  },
  {
    "id": "kos-2",
    "slug": "sukapura-loft-residence",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Buahbatu",
    "name": "Sukapura Loft Residence",
    "address": "Jl. Sukapura No. 45, Terusan Buahbatu, Bandung",
    "lat": -6.9695,
    "lng": 107.6348,
    "priceMonthly": 1350000,
    "price": "Rp1.350.000 / bln",
    "distance": "820m dari Kampus",
    "type": "Campur",
    "matchScore": 94,
    "tag": "Quiet Area",
    "rating": 4.8,
    "reviewsCount": 36,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 09.00 – 20.30 WIB",
    "verified": true,
    "description": "Desain mezzanine loft minimalis dengan kartu akses pintar (Smart Lock), water heater, dan balkon menghadap area tenang yang kondusif untuk fokus belajar.",
    "contact": {
      "ownerName": "Ibu Rina Kartika",
      "phone": "+62 813-2290-4412",
      "whatsapp": "6281322904412"
    },
    "features": [
      "Water Heater",
      "Smart Door Lock",
      "Balkon Pribadi",
      "Dapur Bersama Modern",
      "Wi-Fi Mesh Cepat",
      "Kamar Mandi Dalam"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gedung Kuliah Umum Tokong Nanas",
        "distance": "820 m • 9 mnt jalan kaki"
      },
      {
        "name": "Transmart Buahbatu",
        "distance": "1,9 km • 6 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Kevin Wijaya (Sistem Informasi)",
        "rating": 5,
        "comment": "Kamarnya estetik, ada balkon buat udara segar, keamanan smart lock bikin tenang."
      }
    ],
    "accentPalette": [
      "#0f766e",
      "#2dd4bf"
    ]
  },
  {
    "id": "kos-3",
    "slug": "bojongsoang-green-suites",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Cikoneng, Bojongsoang",
    "name": "Bojongsoang Green Suites",
    "address": "Jl. Cikoneng No. 22, Bojongsoang, Kabupaten Bandung",
    "lat": -6.9756,
    "lng": 107.6368,
    "priceMonthly": 1150000,
    "price": "Rp1.150.000 / bln",
    "distance": "950m dari Kampus",
    "type": "Putri",
    "matchScore": 92,
    "tag": "Best Value",
    "rating": 4.7,
    "reviewsCount": 29,
    "roomsAvailable": 1,
    "visitingHours": "Senin–Minggu • 08.00 – 20.00 WIB",
    "verified": true,
    "description": "Kos khusus putri yang asri dan hemat biaya (sudah termasuk listrik pemakaian wajar & kuota laundry bulanan), dilengkapi penjaga keamanan 24 jam.",
    "contact": {
      "ownerName": "Ibu Hj. Dewi Lestari",
      "phone": "+62 811-2345-6789",
      "whatsapp": "6281123456789"
    },
    "features": [
      "Listrik Termasuk",
      "CCTV 24 Jam",
      "Parkir Motor Luas",
      "Gratis Laundry 10kg/bln",
      "Taman Tengah Asri"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Timur Telkom Univ",
        "distance": "950 m • 11 mnt jalan kaki"
      },
      {
        "name": "Yogya Griya Bojongsoang",
        "distance": "600 m • 7 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Salsabila Zahra (Akuntansi)",
        "rating": 5,
        "comment": "Hemat banget karena sudah include listrik dan laundry, ibu kos ramah."
      }
    ],
    "accentPalette": [
      "#15803d",
      "#4ade80"
    ]
  },
  {
    "id": "kos-4",
    "slug": "pga-executive-student-kost",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Gerbang PGA, Buahbatu",
    "name": "PGA Executive Student Kost",
    "address": "Komplek Permata Buah Batu Blok C-14 (Gerbang PGA), Bandung",
    "lat": -6.9766,
    "lng": 107.6309,
    "priceMonthly": 1450000,
    "price": "Rp1.450.000 / bln",
    "distance": "380m dari Gerbang PGA",
    "type": "Putra",
    "matchScore": 98,
    "tag": "Match 98%",
    "rating": 4.9,
    "reviewsCount": 64,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 22.00 WIB",
    "verified": true,
    "description": "Kos putra eksklusif selangkah dari Gerbang Selatan/PGA Telkom University. Dilengkapi AC dingin, kamar mandi dalam kloset duduk, dan internet dedicated 150 Mbps.",
    "contact": {
      "ownerName": "Bapak Dedi Kurniawan",
      "phone": "+62 821-1988-3301",
      "whatsapp": "6282119883301"
    },
    "features": [
      "AC Inverter",
      "Kamar Mandi Dalam",
      "Fiber 150 Mbps",
      "Akses Fingerprint 24 Jam",
      "Ruang Komunal & Dispenser"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang PGA Telkom University",
        "distance": "380 m • 4 mnt jalan kaki"
      },
      {
        "name": "Masjid Syamsul Ulum",
        "distance": "450 m • 5 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Dimas Arya (Teknik Elektro)",
        "rating": 5,
        "comment": "Kuliah pagi jam 7 tinggal jalan kaki 4 menit sampai kelas. AC dan internet juara."
      }
    ],
    "accentPalette": [
      "#1e40af",
      "#60a5fa"
    ]
  },
  {
    "id": "kos-5",
    "slug": "umayah-pavilion-sukabirus",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Umayah Pavilion Sukabirus",
    "address": "Jl. Umayah II No. 9, Sukabirus, Citeureup, Bandung",
    "lat": -6.9691,
    "lng": 107.6286,
    "priceMonthly": 1200000,
    "price": "Rp1.200.000 / bln",
    "distance": "540m dari Kampus",
    "type": "Putri",
    "matchScore": 95,
    "tag": "Match 95%",
    "rating": 4.8,
    "reviewsCount": 41,
    "roomsAvailable": 4,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Paviliun khusus mahasiswi di komplek Umayah yang tenang dan bebas banjir, memiliki area belajar bersama ber-AC serta pantry bersih di tiap lantai.",
    "contact": {
      "ownerName": "Ibu Sari Wulandari",
      "phone": "+62 812-8877-5521",
      "whatsapp": "6281288775521"
    },
    "features": [
      "Bebas Banjir",
      "Kamar Mandi Dalam",
      "Pantry Tiap Lantai",
      "Wi-Fi 100 Mbps",
      "Ruang Tamu Khusus Putri"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Belakang Telkom Univ",
        "distance": "540 m • 6 mnt jalan kaki"
      },
      {
        "name": "Pusat Kuliner Sukabirus",
        "distance": "80 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Fathia Rahma (Manajemen Bisnis)",
        "rating": 5,
        "comment": "Lokasi aman, tidak bising, cocok buat yang butuh ketenangan belajar skripsi."
      }
    ],
    "accentPalette": [
      "#7c3aed",
      "#c084fc"
    ]
  },
  {
    "id": "kos-6",
    "slug": "roemah-kita-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Roemah Kita Residence Telkom",
    "address": "Jl. Sukapura No. 42, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9718,
    "lng": 107.6322,
    "priceMonthly": 1400000,
    "price": "Rp1.400.000 / bln",
    "distance": "250m dari Gerbang Sukapura",
    "type": "Putri",
    "matchScore": 99,
    "tag": "Top Rujukan Tel-U",
    "rating": 4.95,
    "reviewsCount": 82,
    "roomsAvailable": 1,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos legendaris paling favorit mahasiswa Telkom University di Sukapura. Suasana homie, bersih, ventilasi silang sejuk, dan keamanan terjamin dengan penjaga ramah 24 jam.",
    "contact": {
      "ownerName": "Ibu Hj. Nining",
      "phone": "+62 812-2033-9182",
      "whatsapp": "6281220339182"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Wi-Fi Fiber 100 Mbps",
      "Dapur Bersama Bersih",
      "Ruang Belajar Komunal",
      "Penjaga Standby 24 Jam",
      "Parkir Motor Beratap"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Sukapura Telkom Univ",
        "distance": "250 m • 3 mnt jalan kaki"
      },
      {
        "name": "Kantin Sukapura",
        "distance": "60 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Amanda Maharani (Teknik Industri)",
        "rating": 5,
        "comment": "Kos paling nyaman selama kuliah di Telkom! Waiting list terbayar lunas dengan fasilitasnya."
      }
    ],
    "accentPalette": [
      "#b45309",
      "#fcd34d"
    ]
  },
  {
    "id": "kos-7",
    "slug": "ananda-residence-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Ananda Residence Sukapura",
    "address": "Jl. Sukapura Raya No. 15, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9725,
    "lng": 107.6335,
    "priceMonthly": 1650000,
    "price": "Rp1.650.000 / bln",
    "distance": "320m dari Kampus",
    "type": "Campur",
    "matchScore": 97,
    "tag": "Premium Modern",
    "rating": 4.9,
    "reviewsCount": 65,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 21.30 WIB",
    "verified": true,
    "description": "Kos modern eksklusif dengan gedung kokoh 3 lantai, AC Daikin hemat energi, kamar mandi dalam shower air panas, dan kartu akses digital smart lock.",
    "contact": {
      "ownerName": "Bapak Gunawan Santoso",
      "phone": "+62 813-9944-1200",
      "whatsapp": "6281399441200"
    },
    "features": [
      "AC Daikin Dingin",
      "Kamar Mandi Dalam Water Heater",
      "Smart Door Lock",
      "Kasur Springbed Queen Size",
      "Wi-Fi Dedicated Tiap Lantai",
      "Parkir Mobil & Motor Luas"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Sukapura Tel-U",
        "distance": "320 m • 4 mnt jalan kaki"
      },
      {
        "name": "Alfamart Sukapura",
        "distance": "80 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Rizky Ramadhan (Teknik Komputer)",
        "rating": 5,
        "comment": "AC dingin, air panas lancar, dan parkiran mobil aman banget."
      }
    ],
    "accentPalette": [
      "#1e3a8a",
      "#93c5fd"
    ]
  },
  {
    "id": "kos-8",
    "slug": "kosqita-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Kosqita Student Living Sukapura",
    "address": "Jl. Sukapura Gg. Sauyunan No. 8, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9712,
    "lng": 107.6318,
    "priceMonthly": 1150000,
    "price": "Rp1.150.000 / bln",
    "distance": "380m dari Kampus",
    "type": "Putra",
    "matchScore": 95,
    "tag": "Akses 24 Jam",
    "rating": 4.8,
    "reviewsCount": 44,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Pilihan kos putra strategis di gang tenang Sukapura. Akses keluar masuk 24 jam dengan gerbang gembok kombinasi, Wi-Fi fiber kencang untuk game & tugas.",
    "contact": {
      "ownerName": "Bapak Cecep Hidayat",
      "phone": "+62 822-1400-3329",
      "whatsapp": "6282214003329"
    },
    "features": [
      "Wi-Fi Fiber Kencang",
      "Kasur Springbed & Bantal",
      "Lemari Pakaian 2 Pintu",
      "Meja Belajar Kayu",
      "Akses Gerbang 24 Jam",
      "CCTV 8 Titik Aktif"
    ],
    "nearbyLandmarks": [
      {
        "name": "Telkom University Gate 1",
        "distance": "380 m • 5 mnt jalan kaki"
      },
      {
        "name": "Warmindo Sauyunan",
        "distance": "50 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Fajar Nugraha (Informatika)",
        "rating": 5,
        "comment": "Bebas jam malam tapi tetap aman ada CCTV, internet stabil buat streaming."
      }
    ],
    "accentPalette": [
      "#047857",
      "#6ee7b7"
    ]
  },
  {
    "id": "kos-9",
    "slug": "kos-omah-umi-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Kos Omah Umi Putri Sukapura",
    "address": "Jl. Sukapura Gg. Melati No. 22, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.973,
    "lng": 107.6341,
    "priceMonthly": 1250000,
    "price": "Rp1.250.000 / bln",
    "distance": "290m dari Gerbang Utama",
    "type": "Putri",
    "matchScore": 96,
    "tag": "Lingkungan Asri",
    "rating": 4.85,
    "reviewsCount": 39,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos putri asri dengan tanaman hijau terawat, ruang santai luas, dan suasana kekeluargaan. Dikelola langsung oleh Umi yang ramah dan siap sedia membantu mahasiswa baru.",
    "contact": {
      "ownerName": "Umi Kalsum",
      "phone": "+62 813-2011-8844",
      "whatsapp": "6281320118844"
    },
    "features": [
      "Kamar Mandi Dalam Bersih",
      "Wi-Fi 75 Mbps",
      "Dapur & Kulkas Bersama",
      "Ruang Tamu Mahasiswi",
      "Mesin Cuci Bersama",
      "Area Bebas Genangan"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Sukapura Tel-U",
        "distance": "290 m • 4 mnt jalan kaki"
      },
      {
        "name": "Apotek K-24 Sukapura",
        "distance": "150 m • 2 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Tiara Andini (Ilmu Komunikasi)",
        "rating": 5,
        "comment": "Umi baik banget seperti orang tua sendiri. Kosnya bersih, wangi, dan aman."
      }
    ],
    "accentPalette": [
      "#c026d3",
      "#f0abfc"
    ]
  },
  {
    "id": "kos-10",
    "slug": "pondok-rafina-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Pondok Rafina Sukapura",
    "address": "Jl. Sukapura Gg. Masjid No. 5, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9708,
    "lng": 107.6325,
    "priceMonthly": 950000,
    "price": "Rp950.000 / bln",
    "distance": "410m dari Kampus",
    "type": "Putri",
    "matchScore": 94,
    "tag": "Best Budget",
    "rating": 4.7,
    "reviewsCount": 52,
    "roomsAvailable": 4,
    "visitingHours": "Setiap hari • 08.00 – 20.30 WIB",
    "verified": true,
    "description": "Kos hemat bersahabat di bawah 1 juta rupiah per bulan dengan fasilitas esensial lengkap. Sangat cocok bagi mahasiswa baru yang mengutamakan efisiensi biaya sewa.",
    "contact": {
      "ownerName": "Ibu Ratna",
      "phone": "+62 857-2201-9933",
      "whatsapp": "6285722019933"
    },
    "features": [
      "Kasur Busa Tebal",
      "Meja Belajar & Kursi",
      "Lemari Pakaian",
      "Kamar Mandi Bersih Rasio 1:2",
      "Dapur Gas Gratis",
      "Parkir Motor Aman"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gedung Tokong Nanas Tel-U",
        "distance": "410 m • 5 mnt jalan kaki"
      },
      {
        "name": "Masjid Sukapura",
        "distance": "60 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Dina Marlina (MBTI)",
        "rating": 5,
        "comment": "Harga sangat bersahabat buat dompet mahasiswa, lokasi dekat dan bersih."
      }
    ],
    "accentPalette": [
      "#0284c7",
      "#7dd3fc"
    ]
  },
  {
    "id": "kos-11",
    "slug": "pondok-zeta-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Pondok Zeta Residence Sukapura",
    "address": "Jl. Sukapura No. 71, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9738,
    "lng": 107.6312,
    "priceMonthly": 1300000,
    "price": "Rp1.300.000 / bln",
    "distance": "350m dari Kampus",
    "type": "Putra",
    "matchScore": 96,
    "tag": "Rooftop Cozy",
    "rating": 4.8,
    "reviewsCount": 37,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Hunian kos putra modern berkonsep semi-industrial dengan rooftop santai untuk ngopi dan nugas bareng. Dilengkapi kamar mandi dalam dan meteran listrik mandiri.",
    "contact": {
      "ownerName": "Bapak Hendra Wijaya",
      "phone": "+62 813-1122-3344",
      "whatsapp": "6281311223344"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Wi-Fi 100 Mbps",
      "Rooftop View Gunung Malabar",
      "Parkir Motor Luas Berkanopi",
      "Token Listrik Mandiri",
      "CCTV 24 Jam"
    ],
    "nearbyLandmarks": [
      {
        "name": "Open Library Telkom Univ",
        "distance": "450 m • 6 mnt jalan kaki"
      },
      {
        "name": "Kopi Kenangan Sukapura",
        "distance": "120 m • 2 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Bagas Aditya (Desain Produk)",
        "rating": 5,
        "comment": "Rooftop-nya asik banget buat nugas malam atau sekadar refreshing liat pemandangan."
      }
    ],
    "accentPalette": [
      "#334155",
      "#94a3b8"
    ]
  },
  {
    "id": "kos-12",
    "slug": "dparagon-telkom-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "D Paragon Sukapura Exclusive",
    "address": "Jl. Sukapura No. 12, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9705,
    "lng": 107.6338,
    "priceMonthly": 2100000,
    "price": "Rp2.100.000 / bln",
    "distance": "480m dari Kampus",
    "type": "Campur",
    "matchScore": 98,
    "tag": "Eksklusif Hotel Bintang",
    "rating": 4.95,
    "reviewsCount": 91,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 22.00 WIB",
    "verified": true,
    "description": "Kos eksklusif standar hotel bintang dengan fasilitas kamar fully furnished: AC, TV LED, kulkas mini, pembersih kamar berkala, serta parkiran mobil dan motor yang sangat aman.",
    "contact": {
      "ownerName": "Management D Paragon Telkom",
      "phone": "+62 811-2882-991",
      "whatsapp": "628112882991"
    },
    "features": [
      "AC Split Dingin",
      "TV LED 32 Inch",
      "Water Heater Otomatis",
      "Kulkas Kamar Mini",
      "Cleaning Service Mingguan",
      "Parkir Mobil Luas & Aman"
    ],
    "nearbyLandmarks": [
      {
        "name": "Telkom University Landmark Tower",
        "distance": "550 m • 7 mnt jalan kaki"
      },
      {
        "name": "Supermarket Borma Buahbatu",
        "distance": "1,4 km • 4 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Gavin Pratama (Teknik Telekomunikasi)",
        "rating": 5,
        "comment": "Fasilitas terbaik, serasa tinggal di hotel. Ada housekeeping yang bersihin kamar teratur."
      }
    ],
    "accentPalette": [
      "#854d0e",
      "#facc15"
    ]
  },
  {
    "id": "kos-13",
    "slug": "bale-rancage-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Bale Rancage Student House",
    "address": "Jl. Sukapura Dalam No. 19, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9721,
    "lng": 107.6348,
    "priceMonthly": 1050000,
    "price": "Rp1.050.000 / bln",
    "distance": "400m dari Kampus",
    "type": "Putra",
    "matchScore": 93,
    "tag": "Suasana Tenang",
    "rating": 4.75,
    "reviewsCount": 31,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Bangunan bernuansa bata ekspos yang adem dan nyaman. Kamar luas dengan perabotan kayu solid, jendela kaca besar, dan dapur bersama yang selalu bersih.",
    "contact": {
      "ownerName": "Bapak Kusnadi",
      "phone": "+62 812-9900-5511",
      "whatsapp": "6281299005511"
    },
    "features": [
      "Wi-Fi Stabil",
      "Kasur Springbed Nyaman",
      "Meja Kursi Kayu Solid",
      "Ventilasi Jendela Besar",
      "Dapur Umum Kompor Gratis",
      "Bebas Jam Malam"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Sukapura Tel-U",
        "distance": "400 m • 5 mnt jalan kaki"
      },
      {
        "name": "Laundry Kiloan Sukapura",
        "distance": "50 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Arif Hidayat (Sains Data)",
        "rating": 5,
        "comment": "Sirkulasi udara bagus banget gak perlu sering nyalain kipas angin. Meja belajar kokoh."
      }
    ],
    "accentPalette": [
      "#9a3412",
      "#fdba74"
    ]
  },
  {
    "id": "kos-14",
    "slug": "wisma-sakinah-sukapura",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukapura, Dayeuhkolot",
    "name": "Wisma Sakinah Putri Sukapura",
    "address": "Jl. Sukapura Gg. H. Kurdi No. 3, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9742,
    "lng": 107.6328,
    "priceMonthly": 1200000,
    "price": "Rp1.200.000 / bln",
    "distance": "310m dari Gerbang Barat",
    "type": "Putri",
    "matchScore": 95,
    "tag": "Muslimah Friendly",
    "rating": 4.85,
    "reviewsCount": 43,
    "roomsAvailable": 1,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos khusus mahasiswi berlingkungan religius, tertib, dan bersih. Memiliki fasilitas mushola bersama, kamar mandi dalam tiap kamar, dan akses gerbang kartu RFID.",
    "contact": {
      "ownerName": "Ibu Hj. Siti Aminah",
      "phone": "+62 852-1920-3388",
      "whatsapp": "6285219203388"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Mushola Bersama Sejuk",
      "Wi-Fi Fiber Cepat",
      "Dapur Gas Gratis",
      "Pintu Gerbang Aman RFID",
      "Dekat Kantin Kampus"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gedung Tokong Nanas",
        "distance": "310 m • 4 mnt jalan kaki"
      },
      {
        "name": "Masjid Al-Fath Telkom",
        "distance": "280 m • 3 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Nurul Izzah (Teknik Biomedis)",
        "rating": 5,
        "comment": "Lingkungan sangat kondusif untuk ibadah dan belajar, tidak berisik kendaraan."
      }
    ],
    "accentPalette": [
      "#065f46",
      "#34d399"
    ]
  },
  {
    "id": "kos-15",
    "slug": "sukabirus-residence",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Sukabirus Student Residence",
    "address": "Jl. Sukabirus No. 25, Desa Citeureup, Dayeuhkolot, Bandung",
    "lat": -6.9745,
    "lng": 107.6288,
    "priceMonthly": 1350000,
    "price": "Rp1.350.000 / bln",
    "distance": "350m dari Gerbang Belakang",
    "type": "Campur",
    "matchScore": 97,
    "tag": "Pusat Kuliner Sukabirus",
    "rating": 4.9,
    "reviewsCount": 74,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 22.00 WIB",
    "verified": true,
    "description": "Pusat hunian di jalan utama Sukabirus. Dikelilingi puluhan kedai kopi mahasiswa, warmindo 24 jam, dan laundry. Kamar mandi dalam dengan air jernih bebas bau.",
    "contact": {
      "ownerName": "Bapak Agung Wijanarko",
      "phone": "+62 813-2288-9901",
      "whatsapp": "6281322889901"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Wi-Fi 100 Mbps",
      "Token Listrik Mandiri",
      "Balkon Luar",
      "Parkir Motor Luas",
      "Dikelilingi Warung & Cafe"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Belakang Telkom Univ",
        "distance": "350 m • 4 mnt jalan kaki"
      },
      {
        "name": "Pujasera Sukabirus",
        "distance": "30 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Rifky Ananda (Teknik Informatika)",
        "rating": 5,
        "comment": "Gampang banget cari makan kapan pun, jalan ke kampus lewat gerbang belakang cuma 4 menit."
      }
    ],
    "accentPalette": [
      "#1d4ed8",
      "#60a5fa"
    ]
  },
  {
    "id": "kos-16",
    "slug": "kost-adonis-sukabirus",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Kost Adonis Putra Sukabirus",
    "address": "Jl. Sukabirus Gg. Swadaya No. 11, Citeureup, Dayeuhkolot",
    "lat": -6.9752,
    "lng": 107.6275,
    "priceMonthly": 1100000,
    "price": "Rp1.100.000 / bln",
    "distance": "420m dari Kampus",
    "type": "Putra",
    "matchScore": 95,
    "tag": "Favorit Gamers & IT",
    "rating": 4.8,
    "reviewsCount": 58,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos favorit mahasiswa teknik informatika dan gamer di Sukabirus. Dilengkapi jaringan internet berlatensi rendah, meja belajar lebar muat dual monitor, dan parkir motor berpagar.",
    "contact": {
      "ownerName": "Bapak Dani",
      "phone": "+62 821-2900-4411",
      "whatsapp": "6282129004411"
    },
    "features": [
      "Wi-Fi Dedicated Low Latency",
      "Meja Kerja Lebar Dual Monitor",
      "Kasur Springbed",
      "Akses 24 Jam Bebas",
      "Parkir Motor Berpagar Besi",
      "Dapur Bersama Kompor Gas"
    ],
    "nearbyLandmarks": [
      {
        "name": "Fakultas Informatika Tel-U",
        "distance": "450 m • 5 mnt jalan kaki"
      },
      {
        "name": "Warmindo Putra Panjalu",
        "distance": "70 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Satria Dewa (Informatika)",
        "rating": 5,
        "comment": "Mejanya luas muat PC dan laptop, koneksi internetnya ngebut banget stabil."
      }
    ],
    "accentPalette": [
      "#4338ca",
      "#818cf8"
    ]
  },
  {
    "id": "kos-17",
    "slug": "uniq-residence-sukabirus",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Uniq Residence Putri Sukabirus",
    "address": "Jl. H. Umayah No. 34, Sukabirus, Citeureup, Bandung",
    "lat": -6.9758,
    "lng": 107.6295,
    "priceMonthly": 1500000,
    "price": "Rp1.500.000 / bln",
    "distance": "300m dari Kampus",
    "type": "Putri",
    "matchScore": 98,
    "tag": "Smart Card Access",
    "rating": 4.92,
    "reviewsCount": 62,
    "roomsAvailable": 1,
    "visitingHours": "Setiap hari • 08.00 – 21.30 WIB",
    "verified": true,
    "description": "Kos putri modern dengan sistem keamanan kartu akses RFID mandiri. Kamar mandi dalam dengan pemanas air (water heater), AC dingin, serta pantry bersih dan dispenser gratis di setiap lantai.",
    "contact": {
      "ownerName": "Ibu Linda Susanti",
      "phone": "+62 812-2300-8819",
      "whatsapp": "6281223008819"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Water Heater Otomatis",
      "AC Dingin Hemat Listrik",
      "Smart Card Access",
      "Wi-Fi 100 Mbps",
      "Dapur Bersama Lengkap"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Belakang Telkom Univ",
        "distance": "300 m • 4 mnt jalan kaki"
      },
      {
        "name": "Minimarket Umayah",
        "distance": "40 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Clarissa Putri (DKV)",
        "rating": 5,
        "comment": "Aman banget ada kartu RFID sendiri, kamar wangi dan water heater berfungsi mantap."
      }
    ],
    "accentPalette": [
      "#e11d48",
      "#fda4af"
    ]
  },
  {
    "id": "kos-18",
    "slug": "micasa-residence-victoria",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Micasa Residence Victoria Sukabirus",
    "address": "Jl. H. Umayah No. 18, Sukabirus, Citeureup, Bandung",
    "lat": -6.9762,
    "lng": 107.6282,
    "priceMonthly": 1600000,
    "price": "Rp1.600.000 / bln",
    "distance": "340m dari Kampus",
    "type": "Putri",
    "matchScore": 97,
    "tag": "Estetik Minimalis",
    "rating": 4.9,
    "reviewsCount": 49,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos putri bernuansa estetika Scandinavian dengan perabotan serba putih dan kayu cerah. Memiliki pencahayaan matahari alami, AC, water heater, dan area komunal yang sangat rapi.",
    "contact": {
      "ownerName": "Ibu Maya Victoria",
      "phone": "+62 813-8899-7711",
      "whatsapp": "6281388997711"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Water Heater Air Hangat",
      "AC Dingin & Bersih",
      "Interior Scandinavian Estetik",
      "Wi-Fi Cepat Stabil",
      "Kulkas & Dispenser Bersama"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Kampus Belakang",
        "distance": "340 m • 4 mnt jalan kaki"
      },
      {
        "name": "Kedai Kopi Sukabirus",
        "distance": "60 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Salma Aulia (Manajemen Rekayasa)",
        "rating": 5,
        "comment": "Desain kamarnya cantik banget bikin betah nugas di kamar seharian!"
      }
    ],
    "accentPalette": [
      "#d97706",
      "#fde68a"
    ]
  },
  {
    "id": "kos-19",
    "slug": "kost-raflesia-putri-citeureup",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Kost Raflesia Putri Citeureup",
    "address": "Jl. Sukabirus Gg. Raflesia No. 7, Citeureup, Dayeuhkolot",
    "lat": -6.9768,
    "lng": 107.6268,
    "priceMonthly": 950000,
    "price": "Rp950.000 / bln",
    "distance": "510m dari Gerbang Belakang",
    "type": "Putri",
    "matchScore": 93,
    "tag": "Suasana Hangat & Bersih",
    "rating": 4.78,
    "reviewsCount": 35,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 20.30 WIB",
    "verified": true,
    "description": "Kos putri ramah dengan harga bersahabat di gang tenang Raflesia. Dilengkapi dapur bersama gas gratis, area jemuran beratap kaca, dan lingkungan tetangga yang sopan.",
    "contact": {
      "ownerName": "Ibu Hj. Tuti",
      "phone": "+62 856-2411-8877",
      "whatsapp": "6285624118877"
    },
    "features": [
      "Kasur Lemari Meja Belajar",
      "Wi-Fi Fiber",
      "Dapur Bersama Gas Gratis",
      "Ibu Kos Ramah & Pengertian",
      "Area Jemur Tertutup",
      "Keamanan Terjaga"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Belakang Telkom Univ",
        "distance": "510 m • 6 mnt jalan kaki"
      },
      {
        "name": "Pasar Mini Citeureup",
        "distance": "180 m • 2 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Mega Puspita (Akuntansi)",
        "rating": 5,
        "comment": "Sangat aman, ibu kos selalu siap membantu kalau ada lampu mati atau butuh air minum galon."
      }
    ],
    "accentPalette": [
      "#ec4899",
      "#fbcfe8"
    ]
  },
  {
    "id": "kos-20",
    "slug": "enzoe-le-dortoir-sukabirus",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Enzoe Le Dortoir Co-Living",
    "address": "Jl. Sukabirus No. 70, Citeureup, Dayeuhkolot, Bandung",
    "lat": -6.974,
    "lng": 107.627,
    "priceMonthly": 1750000,
    "price": "Rp1.750.000 / bln",
    "distance": "460m dari Kampus",
    "type": "Campur",
    "matchScore": 97,
    "tag": "Kamar Luas 4x4m",
    "rating": 4.88,
    "reviewsCount": 41,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 22.00 WIB",
    "verified": true,
    "description": "Kamar ekstra luas ukuran 4x4 meter dengan langit-langit tinggi berkonsep co-living. Dilengkapi AC, kamar mandi dalam air panas, meja kerja panjang untuk workstation, dan parkir mobil.",
    "contact": {
      "ownerName": "Bapak Vincent",
      "phone": "+62 811-2099-1144",
      "whatsapp": "6281120991144"
    },
    "features": [
      "Kamar Luas 4x4 Meter",
      "Kamar Mandi Dalam Air Panas",
      "AC Dingin 1 PK",
      "Meja Belajar Lebar Workstation",
      "Parkir Mobil & Motor",
      "Wi-Fi 150 Mbps High-Speed"
    ],
    "nearbyLandmarks": [
      {
        "name": "Telkom University Sport Complex",
        "distance": "460 m • 6 mnt jalan kaki"
      },
      {
        "name": "Indomaret Sukabirus 2",
        "distance": "50 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Jonathan Lee (Teknik Fisika)",
        "rating": 5,
        "comment": "Kamarnya paling luas dibanding kos lain di Sukabirus, parkir mobil gampang banget."
      }
    ],
    "accentPalette": [
      "#164e63",
      "#67e8f9"
    ]
  },
  {
    "id": "kos-21",
    "slug": "wisma-maulana-putra",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Wisma Maulana Putra Sukabirus",
    "address": "Jl. Sukabirus Gg. Ibu Hj. Siti No. 14, Citeureup, Bandung",
    "lat": -6.9772,
    "lng": 107.628,
    "priceMonthly": 850000,
    "price": "Rp850.000 / bln",
    "distance": "480m dari Kampus",
    "type": "Putra",
    "matchScore": 92,
    "tag": "Pilihan Hemat",
    "rating": 4.65,
    "reviewsCount": 47,
    "roomsAvailable": 4,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos putra ramah kantong dengan biaya sewa sudah termasuk pemakaian listrik normal. Dikelilingi warung makan mahasiswa berharga sangat terjangkau.",
    "contact": {
      "ownerName": "Bapak Maulana",
      "phone": "+62 878-2200-1199",
      "whatsapp": "6287822001199"
    },
    "features": [
      "Listrik Sudah Termasuk",
      "Kasur & Lemari Pakaian",
      "Wi-Fi Bersama",
      "Kamar Mandi Luar Bersih",
      "Dekat Fotokopi & Laundry",
      "Bebas Jam Malam Sopan"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Belakang Tel-U",
        "distance": "480 m • 6 mnt jalan kaki"
      },
      {
        "name": "Warteg Bahari Sukabirus",
        "distance": "40 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Ilham Syahputra (Teknik Logistik)",
        "rating": 5,
        "comment": "Sangat hemat buat anak rantau, makan murah banyak di sekitar kos."
      }
    ],
    "accentPalette": [
      "#475569",
      "#cbd5e1"
    ]
  },
  {
    "id": "kos-22",
    "slug": "mahdis-house-sukabirus",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Mahdis House Sukabirus",
    "address": "Jl. Sukabirus Gg. Saluyu No. 9, Citeureup, Dayeuhkolot",
    "lat": -6.9748,
    "lng": 107.626,
    "priceMonthly": 1200000,
    "price": "Rp1.200.000 / bln",
    "distance": "530m dari Kampus",
    "type": "Putra",
    "matchScore": 94,
    "tag": "Jam Malam Fleksibel",
    "rating": 4.75,
    "reviewsCount": 38,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos putra di gang tenang Saluyu Sukabirus. Kamar mandi dalam dengan sanitasi baik, kasur busa tebal baru, meja kerja kokoh, dan jam keluar-masuk bebas.",
    "contact": {
      "ownerName": "Bapak Mahdi",
      "phone": "+62 822-1988-7766",
      "whatsapp": "6282219887766"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Kasur Busa Tebal Baru",
      "Meja Kerja Minimalis",
      "Wi-Fi Stabil",
      "Parkir Motor Luas",
      "Bebas Jam Malam"
    ],
    "nearbyLandmarks": [
      {
        "name": "Fakultas Rekayasa Industri",
        "distance": "530 m • 6 mnt jalan kaki"
      },
      {
        "name": "Laundry Express Saluyu",
        "distance": "50 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Dian Permana (Teknik Elektro)",
        "rating": 5,
        "comment": "Kamarnya bersih dan sirkulasi angin sejuk. Bapak kos baik banget."
      }
    ],
    "accentPalette": [
      "#155e75",
      "#22d3ee"
    ]
  },
  {
    "id": "kos-23",
    "slug": "kos-nirwana-citeureup",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Kos Nirwana Citeureup",
    "address": "Jl. Citeureup Gg. Masjid Baiturrahman No. 2, Dayeuhkolot",
    "lat": -6.978,
    "lng": 107.6272,
    "priceMonthly": 900000,
    "price": "Rp900.000 / bln",
    "distance": "600m dari Kampus",
    "type": "Putra / Putri",
    "matchScore": 91,
    "tag": "Lingkungan Nyaman",
    "rating": 4.7,
    "reviewsCount": 28,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 20.00 WIB",
    "verified": true,
    "description": "Hunian kos ekonomis dengan suasana pemukiman Sunda yang asri dan tenang. Area parkir motor tertutup dan terhindar dari kebisingan jalan raya utama.",
    "contact": {
      "ownerName": "Ibu Nenden",
      "phone": "+62 858-6011-2299",
      "whatsapp": "6285860112299"
    },
    "features": [
      "Parkir Motor Luas Berkanopi",
      "Wi-Fi 50 Mbps",
      "Dapur Gas Gratis",
      "Lingkungan Tenang Asri",
      "Ventilasi Kamar Segar"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Telkom University",
        "distance": "600 m • 7 mnt jalan kaki"
      },
      {
        "name": "Masjid Baiturrahman",
        "distance": "30 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Rifaldi (Sistem Komputer)",
        "rating": 5,
        "comment": "Tenang buat belajar, harganya terjangkau dan air sumur jernih."
      }
    ],
    "accentPalette": [
      "#14532d",
      "#86efac"
    ]
  },
  {
    "id": "kos-24",
    "slug": "kos-sakura-putri-sukabirus",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Kos Sakura Putri Sukabirus",
    "address": "Jl. Sukabirus No. 15, Citeureup, Dayeuhkolot, Bandung",
    "lat": -6.9735,
    "lng": 107.6285,
    "priceMonthly": 1400000,
    "price": "Rp1.400.000 / bln",
    "distance": "280m dari Gerbang Belakang",
    "type": "Putri",
    "matchScore": 97,
    "tag": "Dekat Banget Kampus",
    "rating": 4.9,
    "reviewsCount": 53,
    "roomsAvailable": 1,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Hanya 3 menit jalan kaki santai ke gerbang belakang kampus Telkom University. Kamar mandi dalam air hangat, balkon menghadap pepohonan asri, dan pintu pagar aman terkunci.",
    "contact": {
      "ownerName": "Ibu Sakura",
      "phone": "+62 812-2199-4455",
      "whatsapp": "6281221994455"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Water Heater Air Hangat",
      "Balkon Pribadi Tiap Kamar",
      "Wi-Fi Fiber 100 Mbps",
      "Dapur Bersama Bersih",
      "CCTV & Penjaga Standby"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Belakang Tel-U",
        "distance": "280 m • 3 mnt jalan kaki"
      },
      {
        "name": "Cafe Ruang Duduk Sukabirus",
        "distance": "40 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Anisa Larasati (Ilmu Komunikasi)",
        "rating": 5,
        "comment": "Dekat banget kalau ada kelas pagi, balkon kamarnya enak buat santai sore."
      }
    ],
    "accentPalette": [
      "#db2777",
      "#f472b6"
    ]
  },
  {
    "id": "kos-25",
    "slug": "bale-citra-sukabirus",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Sukabirus, Citeureup",
    "name": "Bale Citra Student Living",
    "address": "Jl. Sukabirus No. 48, Citeureup, Dayeuhkolot",
    "lat": -6.975,
    "lng": 107.6292,
    "priceMonthly": 1150000,
    "price": "Rp1.150.000 / bln",
    "distance": "320m dari Kampus",
    "type": "Campur",
    "matchScore": 95,
    "tag": "Ventilasi Sejuk",
    "rating": 4.8,
    "reviewsCount": 34,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Hunian praktis di pinggir jalan Sukabirus. Kamar mandi dalam, jendela besar menghadap luar untuk pencahayaan optimal, dan meja belajar memadai untuk skripsi.",
    "contact": {
      "ownerName": "Bapak Citra",
      "phone": "+62 813-2009-8833",
      "whatsapp": "6281320098833"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Jendela Hadap Luar (Sirkulasi Bagus)",
      "Meja Belajar Luas",
      "Wi-Fi 75 Mbps",
      "Parkir Motor Terlindungi"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gedung Tokong Nanas Tel-U",
        "distance": "320 m • 4 mnt jalan kaki"
      },
      {
        "name": "Minimarket Sukabirus",
        "distance": "50 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Gilang Ramadhan (Teknik Fisika)",
        "rating": 5,
        "comment": "Lokasi strategis, keluar kos langsung banyak makanan dan toko kebutuhan."
      }
    ],
    "accentPalette": [
      "#ea580c",
      "#fdba74"
    ]
  },
  {
    "id": "kos-26",
    "slug": "kost-grahadi-bojongsoang",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Jl. Raya Bojongsoang",
    "name": "Kost Grahadi Executive Bojongsoang",
    "address": "Jl. Raya Bojongsoang No. 142, Lengkong, Bojongsoang",
    "lat": -6.972,
    "lng": 107.6365,
    "priceMonthly": 1800000,
    "price": "Rp1.800.000 / bln",
    "distance": "550m dari Gerbang Timur",
    "type": "Campur",
    "matchScore": 98,
    "tag": "Parkir Mobil Luas",
    "rating": 4.94,
    "reviewsCount": 78,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.30 WIB",
    "verified": true,
    "description": "Kos eksklusif di tepi jalan utama Bojongsoang dengan akses mobil mudah dan bebas macet gang. Kamar ber-AC, Smart TV, kloset duduk Toto, dan parkir mobil berkanopi.",
    "contact": {
      "ownerName": "Bapak Grahadi",
      "phone": "+62 811-2334-5566",
      "whatsapp": "6281123345566"
    },
    "features": [
      "AC Split Dingin",
      "Smart TV LED",
      "Kamar Mandi Dalam Water Heater",
      "Kloset Duduk Toto",
      "Parkir Mobil Luas Beratap",
      "Wi-Fi Fiber 100 Mbps"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Timur Telkom Univ",
        "distance": "550 m • 6 mnt jalan kaki"
      },
      {
        "name": "SPBU Bojongsoang",
        "distance": "120 m • 1 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Fajar Maulana (Manajemen Bisnis Telekomunikasi)",
        "rating": 5,
        "comment": "Sangat cocok untuk yang bawa mobil. Kamar wangi, AC dingin, dan security 24 jam."
      }
    ],
    "accentPalette": [
      "#1e293b",
      "#64748b"
    ]
  },
  {
    "id": "kos-27",
    "slug": "kost-berlian-house-dayeuhkolot",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Dayeuhkolot, Bandung",
    "name": "Kost Berlian House Dayeuhkolot",
    "address": "Jl. Raya Dayeuhkolot No. 67, Dayeuhkolot, Kabupaten Bandung",
    "lat": -6.9785,
    "lng": 107.624,
    "priceMonthly": 800000,
    "price": "Rp800.000 / bln",
    "distance": "850m dari Kampus",
    "type": "Putra",
    "matchScore": 90,
    "tag": "Hemat Super",
    "rating": 4.6,
    "reviewsCount": 40,
    "roomsAvailable": 5,
    "visitingHours": "Setiap hari • 08.00 – 20.00 WIB",
    "verified": true,
    "description": "Pilihan paling ekonomis untuk mahasiswa yang mencari sewa hemat di bawah 850 ribu per bulan. Akses transportasi angkot mudah di depan jalan raya.",
    "contact": {
      "ownerName": "Ibu Berlian",
      "phone": "+62 812-3344-9900",
      "whatsapp": "6281233449900"
    },
    "features": [
      "Kasur Springbed & Bantal",
      "Lemari 2 Pintu",
      "Wi-Fi Bersama",
      "Dekat Jalur Angkot",
      "Dapur Umum",
      "Hemat Banget"
    ],
    "nearbyLandmarks": [
      {
        "name": "Telkom University",
        "distance": "850 m • 10 mnt jalan kaki / 3 mnt motor"
      },
      {
        "name": "Pasar Dayeuhkolot",
        "distance": "300 m • 4 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Ahmad Fauzi (Teknik Elektro)",
        "rating": 5,
        "comment": "Paling murah tapi tetap layak huni dan nyaman buat istirahat."
      }
    ],
    "accentPalette": [
      "#047857",
      "#a7f3d0"
    ]
  },
  {
    "id": "kos-28",
    "slug": "blueberry-kost-bojongsoang",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Jl. Raya Bojongsoang",
    "name": "Blueberry Kost Putri Bojongsoang",
    "address": "Gg. Masjid Al-Ikhlas No. 4, Bojongsoang, Kabupaten Bandung",
    "lat": -6.971,
    "lng": 107.6372,
    "priceMonthly": 1250000,
    "price": "Rp1.250.000 / bln",
    "distance": "620m dari Kampus",
    "type": "Putri",
    "matchScore": 95,
    "tag": "Tenang & Bersih",
    "rating": 4.85,
    "reviewsCount": 46,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos putri bersih bernuansa ungu pastel di Bojongsoang. Lingkungan tenang tidak berisik suara motor, kamar mandi dalam, serta CCTV dan penjaga malam.",
    "contact": {
      "ownerName": "Ibu Maya Blueberry",
      "phone": "+62 813-2900-5522",
      "whatsapp": "6281329005522"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Suasana Tenang Asri",
      "Wi-Fi 75 Mbps",
      "CCTV 24 Jam",
      "Dapur Bersama Lengkap",
      "Kulkas & Dispenser Bersama"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Tel-U Bojongsoang",
        "distance": "620 m • 7 mnt jalan kaki"
      },
      {
        "name": "Yogya Bojongsoang",
        "distance": "400 m • 5 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Melati Suci (Desain Komunikasi Visual)",
        "rating": 5,
        "comment": "Kamarnya bersih, wangi, dan dekat minimarket buat belanja kebutuhan bulanan."
      }
    ],
    "accentPalette": [
      "#6366f1",
      "#a5b4fc"
    ]
  },
  {
    "id": "kos-29",
    "slug": "pondok-soendawa-pga",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Gerbang PGA, Bojongsoang",
    "name": "Pondok Soendawa PGA Telkom",
    "address": "Jl. PGA No. 34, Lengkong, Bojongsoang, Kabupaten Bandung",
    "lat": -6.9702,
    "lng": 107.635,
    "priceMonthly": 1350000,
    "price": "Rp1.350.000 / bln",
    "distance": "430m dari Gerbang PGA",
    "type": "Campur",
    "matchScore": 96,
    "tag": "Akses Bebas 24 Jam",
    "rating": 4.82,
    "reviewsCount": 51,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 22.00 WIB",
    "verified": true,
    "description": "Kos di jalur strategis PGA dengan akses kunci gerbang mandiri 24 jam. Kamar mandi dalam dengan sanitasi modern, dapur bersama kompor tanam, dan Wi-Fi cepat.",
    "contact": {
      "ownerName": "Bapak Iwan Soendawa",
      "phone": "+62 812-1400-6677",
      "whatsapp": "6281214006677"
    },
    "features": [
      "Akses Kunci Gerbang 24 Jam",
      "Kamar Mandi Dalam",
      "Dapur Kompor Tanam Gas Gratis",
      "Wi-Fi Cepat",
      "Parkir Motor Aman Berkanopi"
    ],
    "nearbyLandmarks": [
      {
        "name": "Pintu Gerbang Asrama (PGA) Tel-U",
        "distance": "430 m • 5 mnt jalan kaki"
      },
      {
        "name": "Klinik & Apotek Bojongsoang",
        "distance": "250 m • 3 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Aldi Taher (Informatika)",
        "rating": 5,
        "comment": "Akses 24 jam sangat membantu kalau ada kegiatan himpunan atau nugas larut malam di kampus."
      }
    ],
    "accentPalette": [
      "#0f766e",
      "#5eead4"
    ]
  },
  {
    "id": "kos-30",
    "slug": "pondok-putri-al-barokah-pga",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Gerbang PGA, Bojongsoang",
    "name": "Pondok Putri Al-Barokah PGA",
    "address": "Jl. PGA No. 45, Lengkong, Bojongsoang, Kabupaten Bandung",
    "lat": -6.9698,
    "lng": 107.6358,
    "priceMonthly": 1100000,
    "price": "Rp1.100.000 / bln",
    "distance": "490m dari Kampus",
    "type": "Putri",
    "matchScore": 94,
    "tag": "Portal Keamanan 24 Jam",
    "rating": 4.8,
    "reviewsCount": 36,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos khusus mahasiswi di komplek perumahan PGA dengan portal gerbang perumahan yang dijaga satpam 24 jam. Lingkungan bersih, tenang, dan bebas banjir.",
    "contact": {
      "ownerName": "Ibu Barokah",
      "phone": "+62 857-1900-4422",
      "whatsapp": "6285719004422"
    },
    "features": [
      "Khusus Mahasiswi Muslimah",
      "Bersih, Asri & Tenang",
      "Keamanan Portal Komplek 24 Jam",
      "Wi-Fi Fiber Cepat",
      "Dapur Bersama Bersih"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang PGA Tel-U",
        "distance": "490 m • 6 mnt jalan kaki"
      },
      {
        "name": "Indomaret PGA",
        "distance": "80 m • 1 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Hafizhah (Teknik Telekomunikasi)",
        "rating": 5,
        "comment": "Orang tua tenang karena kompleknya ada portal satpam 24 jam."
      }
    ],
    "accentPalette": [
      "#16a34a",
      "#86efac"
    ]
  },
  {
    "id": "kos-31",
    "slug": "paviliun-ciganitri-telkom",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Ciganitri, Bojongsoang",
    "name": "Paviliun Asri Ciganitri Telkom",
    "address": "Komplek Ciganitri Mukti Blok B No. 9, Bojongsoang, Bandung",
    "lat": -6.968,
    "lng": 107.639,
    "priceMonthly": 1450000,
    "price": "Rp1.450.000 / bln",
    "distance": "890m dari Kampus (3 mnt motor)",
    "type": "Campur",
    "matchScore": 96,
    "tag": "Bebas Banjir Komplek Tenang",
    "rating": 4.89,
    "reviewsCount": 42,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Paviliun mewah di kawasan dataran tinggi Ciganitri yang dijamin bebas banjir. Lingkungan perumahan asri berhawa sejuk, kamar mandi dalam air panas, dan parkir mobil leluasa.",
    "contact": {
      "ownerName": "Bapak Bambang Hariyanto",
      "phone": "+62 812-9911-3322",
      "whatsapp": "6281299113322"
    },
    "features": [
      "Bebas Banjir Komplek Perumahan",
      "Kamar Mandi Dalam Air Panas",
      "Wi-Fi 100 Mbps",
      "Parkir Mobil & Motor Leluasa",
      "Dapur Luas & Kulkas"
    ],
    "nearbyLandmarks": [
      {
        "name": "Telkom University Gate 2",
        "distance": "890 m • 3 mnt motor / 10 mnt jalan"
      },
      {
        "name": "Griya Toserba Bojongsoang",
        "distance": "500 m • 2 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Farhan Maulana (Sistem Informasi)",
        "rating": 5,
        "comment": "Ciganitri posisinya tinggi jadi bebas banjir saat musim hujan. Parkir mobil aman banget."
      }
    ],
    "accentPalette": [
      "#0284c7",
      "#38bdf8"
    ]
  },
  {
    "id": "kos-32",
    "slug": "pondok-asri-buah-batu",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Terusan Buah Batu, Bandung",
    "name": "Pondok Asri Terusan Buah Batu",
    "address": "Jl. Terusan Buah Batu No. 210, Kujangsari, Bandung",
    "lat": -6.965,
    "lng": 107.633,
    "priceMonthly": 1550000,
    "price": "Rp1.550.000 / bln",
    "distance": "980m dari Kampus",
    "type": "Putri",
    "matchScore": 97,
    "tag": "Dekat Pintu Tol Buah Batu",
    "rating": 4.91,
    "reviewsCount": 60,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos putri eksklusif di jalan raya Terusan Buahbatu dengan akses super mudah ke Tol Buahbatu dan Transmart. Kamar ber-AC, kamar mandi dalam, dan security 24 jam.",
    "contact": {
      "ownerName": "Ibu Asri Widiastuti",
      "phone": "+62 813-1100-7799",
      "whatsapp": "6281311007799"
    },
    "features": [
      "AC Inverter Dingin",
      "Kamar Mandi Dalam",
      "Akses Jalan Raya Utama",
      "Wi-Fi 100 Mbps",
      "Security 24 Jam",
      "Dekat Transmart & Gerbang Tol"
    ],
    "nearbyLandmarks": [
      {
        "name": "Telkom University Gate Buahbatu",
        "distance": "980 m • 4 mnt motor"
      },
      {
        "name": "Pintu Tol Buah Batu",
        "distance": "400 m • 2 mnt mobil"
      },
      {
        "name": "Transmart Buah Batu",
        "distance": "500 m • 3 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Nabila Syahrani (Manajemen)",
        "rating": 5,
        "comment": "Akses gampang banget buat orang tua kalau jemput ke Bandung via tol Buahbatu."
      }
    ],
    "accentPalette": [
      "#b91c1c",
      "#f87171"
    ]
  },
  {
    "id": "kos-33",
    "slug": "the-suite-metro-buah-batu",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Terusan Buah Batu / Soekarno Hatta",
    "name": "The Suite Metro Studio Apartment",
    "address": "Apartemen The Suite Metro Tower B, Jl. Soekarno-Hatta No. 698",
    "lat": -6.945,
    "lng": 107.658,
    "priceMonthly": 2300000,
    "price": "Rp2.300.000 / bln",
    "distance": "3.5 km dari Tel-U (Shuttle Bus)",
    "type": "Campur",
    "matchScore": 96,
    "tag": "Apartemen Full Fasilitas",
    "rating": 4.93,
    "reviewsCount": 110,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Unit apartemen studio fully furnished dengan akses kolam renang olympic size, gym, kartu akses lift, mini market di lobby, dan shuttle bus langsung ke kampus Telkom University.",
    "contact": {
      "ownerName": "Bapak Samuel (Property Agent)",
      "phone": "+62 811-9988-1212",
      "whatsapp": "6281199881212"
    },
    "features": [
      "Kolam Renang & Gym",
      "AC Dingin 1 PK",
      "Dapur Kitchen Set Pribadi",
      "Balkon View Kota Bandung",
      "Kartu Akses Lift Pribadi",
      "Keamanan 24 Jam CCTV & Security"
    ],
    "nearbyLandmarks": [
      {
        "name": "Metro Indah Mall (MIM)",
        "distance": "100 m • 2 mnt jalan kaki"
      },
      {
        "name": "Telkom University",
        "distance": "3,5 km • 8 mnt shuttle bus / ojol"
      }
    ],
    "reviews": [
      {
        "author": "Christian Hartono (Teknik Industri)",
        "rating": 5,
        "comment": "Fasilitas kolam renang dan gym mantap. Ada shuttle bus harian ke kampus Tel-U."
      }
    ],
    "accentPalette": [
      "#4f46e5",
      "#a5b4fc"
    ]
  },
  {
    "id": "kos-34",
    "slug": "kost-cherry-bojongsoang",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Bojongsoang, Bandung",
    "name": "Kost Cherry Putri Bojongsoang",
    "address": "Gg. Cijeruk No. 18, Bojongsoang, Kabupaten Bandung",
    "lat": -6.974,
    "lng": 107.637,
    "priceMonthly": 1150000,
    "price": "Rp1.150.000 / bln",
    "distance": "680m dari Kampus",
    "type": "Putri",
    "matchScore": 94,
    "tag": "Homey & Bersih",
    "rating": 4.8,
    "reviewsCount": 29,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos putri bernuansa pink ceria yang bersih dan nyaman. Dikelilingi toko kelontong dan tempat makan, kamar mandi dalam dengan kloset duduk, dan penjaga kos wanita.",
    "contact": {
      "ownerName": "Ibu Cherry",
      "phone": "+62 821-1400-5599",
      "whatsapp": "6282114005599"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Meja Belajar Ergonomis",
      "Kulkas Bersama",
      "Wi-Fi Fiber",
      "Penjaga Kos Standby",
      "Parkir Motor Aman"
    ],
    "nearbyLandmarks": [
      {
        "name": "Telkom University Gate Timur",
        "distance": "680 m • 8 mnt jalan kaki"
      },
      {
        "name": "Apotek Bojongsoang",
        "distance": "200 m • 3 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Putri Ayu (Desain Interior)",
        "rating": 5,
        "comment": "Tempatnya bersih banget, penjaganya rajin nyapu dan ngepel lorong setiap hari."
      }
    ],
    "accentPalette": [
      "#be185d",
      "#f472b6"
    ]
  },
  {
    "id": "kos-35",
    "slug": "wisma-lavender-mengger",
    "campusId": "telkom",
    "campusName": "Telkom University Bandung",
    "city": "Bandung",
    "area": "Mengger, Bojongsoang",
    "name": "Wisma Lavender Mengger Telkom",
    "address": "Jl. Mengger Girang No. 28, Bojongsoang, Bandung",
    "lat": -6.967,
    "lng": 107.629,
    "priceMonthly": 1250000,
    "price": "Rp1.250.000 / bln",
    "distance": "850m dari Kampus",
    "type": "Putra / Putri",
    "matchScore": 95,
    "tag": "Bebas Banjir & Asri",
    "rating": 4.83,
    "reviewsCount": 33,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kawasan Mengger yang teduh dengan akses mudah ke kampus via jalan tembus belakang. Kamar mandi dalam, sirkulasi udara bebas polusi, dan parkir motor tertutup.",
    "contact": {
      "ownerName": "Bapak Sugeng",
      "phone": "+62 813-2190-8844",
      "whatsapp": "6281321908844"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Lingkungan Tenang Asri",
      "Wi-Fi 75 Mbps",
      "Parkir Motor Beratap",
      "Dapur Bersama Gas Gratis"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Telkom Univ",
        "distance": "850 m • 9 mnt jalan kaki / 3 mnt motor"
      },
      {
        "name": "Klinik Harapan Sehat Mengger",
        "distance": "300 m • 4 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Deni Setiawan (Teknik Komputer)",
        "rating": 5,
        "comment": "Suasana asri dan tidak bising suara knalpot, cocok buat yang butuh konsentrasi tinggi."
      }
    ],
    "accentPalette": [
      "#7e22ce",
      "#c084fc"
    ]
  },
  {
    "id": "kos-itb-1",
    "slug": "cisitu-indah-smart-kost",
    "campusId": "itb",
    "campusName": "Institut Teknologi Bandung (Ganesha)",
    "city": "Bandung",
    "area": "Cisitu, Dago, Coblong",
    "name": "Cisitu Indah Smart Kost",
    "address": "Jl. Cisitu Indah VI No. 12, Dago, Coblong, Kota Bandung",
    "lat": -6.8828,
    "lng": 107.6114,
    "priceMonthly": 1650000,
    "price": "Rp1.650.000 / bln",
    "distance": "890m dari ITB Ganesha",
    "type": "Putra / Putri",
    "matchScore": 97,
    "tag": "Match 97%",
    "rating": 4.9,
    "reviewsCount": 52,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.30 – 21.00 WIB",
    "verified": true,
    "description": "Kos favorit mahasiswa ITB di kawasan udara sejuk Cisitu Dago. Dilengkapi air hangat sentral (solar water heater), meja kerja lebar untuk studio/coding, dan rooftop view Bandung.",
    "contact": {
      "ownerName": "Bapak Ir. Arif Budiman",
      "phone": "+62 812-2040-7711",
      "whatsapp": "6281220407711"
    },
    "features": [
      "Water Heater Sentral",
      "Wi-Fi 100 Mbps",
      "Meja Gambar / Kerja Lebar",
      "Rooftop Lounge",
      "Kamar Mandi Dalam",
      "Parkir Motor & Mobil Terbatas"
    ],
    "nearbyLandmarks": [
      {
        "name": "Sabuga & Gerbang Utara ITB",
        "distance": "890 m • 10 mnt jalan kaki"
      },
      {
        "name": "Simpang Dago McD",
        "distance": "750 m • 8 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Fajar Ramadhan (STEI ITB)",
        "rating": 5,
        "comment": "Air hangat selalu jalan di udara Dago yang dingin, rooftop-nya enak buat diskusi."
      }
    ],
    "accentPalette": [
      "#0284c7",
      "#38bdf8"
    ]
  },
  {
    "id": "kos-itb-2",
    "slug": "pelesiran-ganesha-suites",
    "campusId": "itb",
    "campusName": "Institut Teknologi Bandung (Ganesha)",
    "city": "Bandung",
    "area": "Tamansari, Coblong",
    "name": "Pelesiran Ganesha Suites",
    "address": "Jl. Pelesiran No. 28, Tamansari, Kota Bandung",
    "lat": -6.8962,
    "lng": 107.6079,
    "priceMonthly": 1300000,
    "price": "Rp1.300.000 / bln",
    "distance": "610m dari Gerbang Selatan ITB",
    "type": "Putri",
    "matchScore": 95,
    "tag": "Match 95%",
    "rating": 4.8,
    "reviewsCount": 33,
    "roomsAvailable": 1,
    "visitingHours": "Setiap hari • 08.00 – 20.30 WIB",
    "verified": true,
    "description": "Kos putri strategis dekat Gerbang Selatan ITB dan Ciwalk. Kamar terang berventilasi silang, keamanan terjaga dengan akses satu pintu dan penjaga kos.",
    "contact": {
      "ownerName": "Ibu Ratna Ningrum",
      "phone": "+62 813-9450-1188",
      "whatsapp": "6281394501188"
    },
    "features": [
      "Kamar Mandi Dalam",
      "Dekat Gerbang Selatan ITB",
      "CCTV 24 Jam",
      "Wi-Fi Cepat",
      "Dapur Bersih & Air Minum RO"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Utama / Selatan ITB",
        "distance": "610 m • 7 mnt jalan kaki"
      },
      {
        "name": "Cihampelas Walk (Ciwalk)",
        "distance": "550 m • 6 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Clarissa Putri (SBM ITB)",
        "rating": 5,
        "comment": "Ke kampus tinggal jalan kaki lewat Tamansari, cari makan malam juga gampang."
      }
    ],
    "accentPalette": [
      "#db2777",
      "#f472b6"
    ]
  },
  {
    "id": "kos-itb-3",
    "slug": "dipatiukur-scholar-residence",
    "campusId": "itb",
    "campusName": "Institut Teknologi Bandung (Ganesha)",
    "city": "Bandung",
    "area": "Dipatiukur, Lebakgede",
    "name": "Dipatiukur Scholar Residence",
    "address": "Jl. Dipatiukur Dalam No. 11, Lebakgede, Coblong, Kota Bandung",
    "lat": -6.8904,
    "lng": 107.6178,
    "priceMonthly": 1550000,
    "price": "Rp1.550.000 / bln",
    "distance": "750m dari ITB & Unpad DU",
    "type": "Putra",
    "matchScore": 94,
    "tag": "Dekat ITB & Unpad",
    "rating": 4.8,
    "reviewsCount": 27,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 09.00 – 21.00 WIB",
    "verified": true,
    "description": "Lokasi prima di koridor pendidikan Dipatiukur—hanya beberapa menit jalan kaki ke kampus ITB Ganesha maupun Unpad Dipatiukur dan halte Trans Metro Pasundan.",
    "contact": {
      "ownerName": "Bapak Hendra Gunawan",
      "phone": "+62 811-2209-3344",
      "whatsapp": "6281122093344"
    },
    "features": [
      "Water Heater",
      "Kamar Mandi Dalam",
      "Wi-Fi Fiber 100 Mbps",
      "Meja Belajar & Lemari Jati",
      "Akses 24 Jam"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Timur ITB",
        "distance": "750 m • 9 mnt jalan kaki"
      },
      {
        "name": "Kampus Unpad Dipatiukur",
        "distance": "320 m • 4 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Bagas Prakoso (FTSL ITB)",
        "rating": 5,
        "comment": "Strategis banget di tengah-tengah DU dan Dago, transportasi umum lewat depan gang."
      }
    ],
    "accentPalette": [
      "#2563eb",
      "#818cf8"
    ]
  },
  {
    "id": "kos-ui-1",
    "slug": "kukusan-teknik-green-kost",
    "campusId": "ui",
    "campusName": "Universitas Indonesia Depok",
    "city": "Depok",
    "area": "Kukusan Teknik (Kutek), Beji",
    "name": "Kukusan Teknik Green Kost",
    "address": "Jl. Juragan Sinda II No. 7, Kukusan, Beji, Kota Depok",
    "lat": -6.3612,
    "lng": 106.8208,
    "priceMonthly": 1400000,
    "price": "Rp1.400.000 / bln",
    "distance": "480m dari Gerbang Kukusan Teknik",
    "type": "Putra / Putri",
    "matchScore": 97,
    "tag": "Match 97%",
    "rating": 4.9,
    "reviewsCount": 59,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 21.00 WIB",
    "verified": true,
    "description": "Kos ber-AC di jantung area Kukusan Teknik (Kutek) UI Depok. Sangat dekat ke Fakultas Teknik, FEB, dan halte Bis Kuning (Bikun) UI.",
    "contact": {
      "ownerName": "Bapak Bambang Suryono",
      "phone": "+62 812-8090-2211",
      "whatsapp": "6281280902211"
    },
    "features": [
      "AC Dingin",
      "Kamar Mandi Dalam",
      "Wi-Fi Cepat",
      "Akses Gerbang Kutek 5 Menit",
      "CCTV & Parkir Motor"
    ],
    "nearbyLandmarks": [
      {
        "name": "Gerbang Kukusan Teknik (FT UI)",
        "distance": "480 m • 5 mnt jalan kaki"
      },
      {
        "name": "Halte Bikun Teknik",
        "distance": "550 m • 6 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Rizky Ananda (Fasilkom UI)",
        "rating": 5,
        "comment": "AC dingin, kamar bersih, jalan kaki bentar langsung sampai pangkalan Bikun."
      }
    ],
    "accentPalette": [
      "#ca8a04",
      "#facc15"
    ]
  },
  {
    "id": "kos-ui-2",
    "slug": "pondok-cina-station-loft",
    "campusId": "ui",
    "campusName": "Universitas Indonesia Depok",
    "city": "Depok",
    "area": "Pondok Cina, Margonda",
    "name": "Pondok Cina Station Loft",
    "address": "Jl. Margonda Raya Gg. Kober No. 19, Pondok Cina, Depok",
    "lat": -6.3685,
    "lng": 106.8325,
    "priceMonthly": 1250000,
    "price": "Rp1.250.000 / bln",
    "distance": "520m dari Stasiun Pondok Cina",
    "type": "Putri",
    "matchScore": 94,
    "tag": "Dekat Stasiun KRL",
    "rating": 4.7,
    "reviewsCount": 44,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.30 – 20.30 WIB",
    "verified": true,
    "description": "Kos putri modern dekat Stasiun KRL Pondok Cina dan Margo City. Cocok bagi mahasiswi UI yang sering bermobilitas ke Jakarta menggunakan Commuter Line.",
    "contact": {
      "ownerName": "Ibu Maya Anggraini",
      "phone": "+62 815-1122-8899",
      "whatsapp": "6281511228899"
    },
    "features": [
      "Dekat Stasiun KRL Pocin",
      "Smart Door Lock",
      "Kasur Orthopedic",
      "Dapur Bersama & Kulkas",
      "Kamar Mandi Dalam"
    ],
    "nearbyLandmarks": [
      {
        "name": "Stasiun KRL Pondok Cina & UI",
        "distance": "520 m • 6 mnt jalan kaki"
      },
      {
        "name": "Margo City Mall",
        "distance": "850 m • 10 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Tiara Maharani (FISIP UI)",
        "rating": 5,
        "comment": "Enak banget mau naik KRL ke Jakarta atau masuk kampus lewat stasiun Pocin tinggal jalan kaki."
      }
    ],
    "accentPalette": [
      "#0d9488",
      "#5eead4"
    ]
  },
  {
    "id": "kos-ugm-1",
    "slug": "pogung-dalangan-exclusive",
    "campusId": "ugm",
    "campusName": "Universitas Gadjah Mada Yogyakarta",
    "city": "Yogyakarta",
    "area": "Pogung Dalangan, Sinduadi, Sleman",
    "name": "Pogung Dalangan Exclusive",
    "address": "Pogung Dalangan SIA XVI No. 31, Sinduadi, Mlati, Sleman, DIY",
    "lat": -7.7634,
    "lng": 110.3742,
    "priceMonthly": 1350000,
    "price": "Rp1.350.000 / bln",
    "distance": "620m dari Kluster Teknik/MIPA UGM",
    "type": "Putra / Putri",
    "matchScore": 98,
    "tag": "Match 98%",
    "rating": 4.9,
    "reviewsCount": 71,
    "roomsAvailable": 3,
    "visitingHours": "Setiap hari • 08.00 – 21.30 WIB",
    "verified": true,
    "description": "Hunian eksklusif di kawasan favorit mahasiswa UGM Pogung Dalangan. Kamar lega ber-AC, parkir motor & mobil teduh, serta lingkungan tenang untuk riset & skripsi.",
    "contact": {
      "ownerName": "Bapak Joko Susilo",
      "phone": "+62 813-2877-6655",
      "whatsapp": "6281328776655"
    },
    "features": [
      "AC Inverter",
      "Kamar Mandi Dalam + Shower",
      "Fiber Wi-Fi Cepat",
      "Parkir Luas Beratap",
      "Bebas Jam Malam (Akses Kunci Sendiri)"
    ],
    "nearbyLandmarks": [
      {
        "name": "Fakultas Teknik & MIPA UGM",
        "distance": "620 m • 7 mnt jalan kaki"
      },
      {
        "name": "Jalan Kaliurang KM 5",
        "distance": "700 m • 3 mnt motor"
      }
    ],
    "reviews": [
      {
        "author": "Bima Sakti (DTETI UGM)",
        "rating": 5,
        "comment": "Pogung paling nyaman, ke kampus dekat, bapak kos sangat membantu kalau ada kendala."
      }
    ],
    "accentPalette": [
      "#0369a1",
      "#38bdf8"
    ]
  },
  {
    "id": "kos-ugm-2",
    "slug": "sendowo-quiet-scholar-house",
    "campusId": "ugm",
    "campusName": "Universitas Gadjah Mada Yogyakarta",
    "city": "Yogyakarta",
    "area": "Sendowo, Sekip, Sleman",
    "name": "Sendowo Quiet Scholar House",
    "address": "Jl. Kesehatan Sendowo Blok D-42, Sinduadi, Sleman, DIY",
    "lat": -7.7745,
    "lng": 110.3718,
    "priceMonthly": 1100000,
    "price": "Rp1.100.000 / bln",
    "distance": "450m dari FKKMK UGM & RSUP Sardjito",
    "type": "Putri",
    "matchScore": 95,
    "tag": "Tenang & Strategis",
    "rating": 4.8,
    "reviewsCount": 38,
    "roomsAvailable": 2,
    "visitingHours": "Setiap hari • 08.00 – 20.30 WIB",
    "verified": true,
    "description": "Kos putri tenang hanya 5 menit jalan kaki dari FKKMK UGM dan RSUP Dr. Sardjito, sangat ideal untuk mahasiswi rumpun kesehatan maupun koas.",
    "contact": {
      "ownerName": "Ibu Endang Sriwahyuni",
      "phone": "+62 812-2711-9900",
      "whatsapp": "6281227119900"
    },
    "features": [
      "Tenang & Asri",
      "Kamar Mandi Dalam",
      "Dapur & Kulkas Bersama",
      "CCTV 24 Jam",
      "Wi-Fi Stabil"
    ],
    "nearbyLandmarks": [
      {
        "name": "FKKMK UGM & RSUP Dr. Sardjito",
        "distance": "450 m • 5 mnt jalan kaki"
      },
      {
        "name": "Grha Sabha Pramana UGM",
        "distance": "850 m • 10 mnt jalan kaki"
      }
    ],
    "reviews": [
      {
        "author": "Anindya Saraswati (Kedokteran UGM)",
        "rating": 5,
        "comment": "Sangat membantu saat jadwal koas padat karena tinggal jalan kaki ke Sardjito."
      }
    ],
    "accentPalette": [
      "#15803d",
      "#86efac"
    ]
  }
];

export default CURATED_ACCOMMODATIONS;
