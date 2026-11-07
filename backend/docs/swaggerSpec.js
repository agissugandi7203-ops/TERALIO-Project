/**
 * OpenAPI 3.0.3 Specification untuk Teralio Express Backend.
 * Mendokumentasikan seluruh endpoint REST, SSE Streaming, WebRTC, MCP, Supabase, dan Maps.
 */

export const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Teralio Backend API',
    version: '1.0.0',
    description: `
Dokumentasi interaktif resmi API **Teralio** (AI-First Accommodation & Lifestyle Discovery Platform).

Layanan mencakup:
- **Smart Kos Match**: Pencarian hunian terkurasi Supabase, rute pejalan kaki / motor (OSM & Maps), dan penjadwalan survei (*Visit Schedule*).
- **OpenAI Responses & SSE Streaming**: AI Chat multi-turn, analisis kriteria, reasoning deltas, upload lampiran, dan riset web.
- **OpenAI Realtime Voice & WebRTC**: Sesi audio dua arah latensi rendah, negosiasi SDP, dan *tool-call relay*.
- **Model Context Protocol (MCP)**: JSON-RPC 2.0 streaming tool orchestration.
- **Google Maps Platform**: Geocoding, Places discovery, dan perutean.
    `,
    contact: {
      name: 'Tim Pengembang Teralio',
      email: 'dev@teralio.com',
      url: 'https://teralio.com',
    },
  },
  servers: [
    {
      url: '/api',
      description: 'API Gateway (Default / Vercel rewrite)',
    },
    {
      url: 'http://localhost:5000/api',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'System & Health', description: 'Pemeriksaan kesehatan server dan kesiapan integrasi eksternal' },
    { name: 'Authentication', description: 'Registrasi, autentikasi sesi, Google OAuth, dan manajemen akun' },
    { name: 'Smart Kos Accommodations', description: 'Data kos terkurasi Supabase, rute geospasial, dan kalender survei' },
    { name: 'OpenAI & AI Chat', description: 'Chat completion, streaming SSE, lampiran berkas, dan pencarian web' },
    { name: 'Realtime Voice & WebRTC', description: 'Sesi suara real-time dua arah, client secrets, dan relay tool call' },
    { name: 'MCP (Model Context Protocol)', description: 'Server protokol MCP JSON-RPC 2.0 dan pemanggilan tool' },
    { name: 'Google Maps Platform', description: 'Geocoding, pencarian tempat, dan kalkulasi rute' },
    { name: 'Items', description: 'Manajemen umum data entitas hunian' },
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Kunci akses sesi pengguna Supabase (dikirim via header `Authorization: Bearer <token>`).',
      },
      McpAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Token otorisasi rahasia untuk komunikasi protokol MCP di production (`MCP_SERVER_AUTH_TOKEN`).',
      },
    },
    schemas: {
      StandardResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'Operasi berhasil dieksekusi' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          code: { type: 'string', example: 'BAD_REQUEST' },
          message: { type: 'string', example: 'Parameter tidak valid' },
          errors: {
            type: 'array',
            nullable: true,
            items: { type: 'object' },
          },
        },
      },
      Accommodation: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'kos-01' },
          name: { type: 'string', example: 'Bojongsoang Green Suites' },
          slug: { type: 'string', example: 'bojongsoang-green-suites' },
          campusId: { type: 'string', example: 'telkom' },
          campusName: { type: 'string', example: 'Telkom University Bandung' },
          city: { type: 'string', example: 'Bandung' },
          area: { type: 'string', example: 'Cikoneng' },
          address: { type: 'string', example: 'Jl. Raya Bojongsoang No. 88, Cikoneng' },
          priceMonthly: { type: 'number', example: 1150000 },
          price: { type: 'string', example: 'Rp1.150.000 / bln' },
          type: { type: 'string', example: 'Putri' },
          matchScore: { type: 'number', example: 98 },
          rating: { type: 'number', example: 4.8 },
          reviewsCount: { type: 'number', example: 32 },
          roomsAvailable: { type: 'number', example: 2 },
          verified: { type: 'boolean', example: true },
          location: {
            type: 'object',
            properties: {
              lat: { type: 'number', example: -6.9745 },
              lng: { type: 'number', example: 107.6308 },
            },
          },
          features: {
            type: 'array',
            items: { type: 'string' },
            example: ['WiFi 100 Mbps', 'Kamar Mandi Dalam', 'AC', 'Security 24 Jam'],
          },
        },
      },
      Booking: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'sched_1730982341' },
          accommodationId: { type: 'string', example: 'kos-01' },
          accommodationName: { type: 'string', example: 'Bojongsoang Green Suites' },
          campusName: { type: 'string', example: 'Telkom University' },
          address: { type: 'string', example: 'Jl. Raya Bojongsoang No. 88' },
          ownerName: { type: 'string', example: 'Ibu Hj. Siti Nurjanah' },
          contactPhone: { type: 'string', example: '081223344556' },
          scheduledLabel: { type: 'string', example: 'Besok, Pukul 14.00 WIB' },
          scheduledIso: { type: 'string', example: '2026-11-08T14:00:00+07:00' },
          scheduledTime: { type: 'string', example: '14.00 WIB' },
          visitorName: { type: 'string', example: 'Mahasiswa Teralio' },
          notes: { type: 'string', example: 'Survei kamar tipe deluxe' },
          status: { type: 'string', example: 'Terjadwal' },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['System & Health'],
        summary: 'Pemeriksaan status kesehatan server backend',
        description: 'Mengembalikan uptime, timestamp aktual, dan status proses Express.',
        responses: {
          200: {
            description: 'Server aktif dan sehat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', example: 'ok' },
                    uptime: { type: 'number', example: 42.15 },
                    timestamp: { type: 'string', example: '2026-11-07T08:00:00.000Z' },
                    service: { type: 'string', example: 'Teralio Express Backend' },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/integrations/status': {
      get: {
        tags: ['System & Health'],
        summary: 'Pemeriksaan status kesiapan integrasi backend',
        description: 'Mengecek ketersediaan Supabase, OpenAI, Realtime WebRTC, Web Search, MCP, dan Google Maps.',
        responses: {
          200: {
            description: 'Informasi status integrasi eksternal',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        supabase: { type: 'object' },
                        openai: { type: 'object' },
                        realtime: { type: 'object' },
                        webSearch: { type: 'object' },
                        mcp: { type: 'object' },
                        googleMaps: { type: 'object' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Pendaftaran akun pengguna baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: 'Rahasia123!' },
                  fullName: { type: 'string', example: 'Ahmad Faiz' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Registrasi berhasil' },
          400: { description: 'Input data tidak valid' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'Masuk dengan email dan password',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'user@example.com' },
                  password: { type: 'string', format: 'password', example: 'Rahasia123!' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login berhasil mengembalikan token sesi' },
          401: { description: 'Kredensial salah' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Authentication'],
        summary: 'Mendapatkan profil pengguna yang sedang login',
        security: [{ BearerAuth: [] }],
        responses: {
          200: { description: 'Profil pengguna' },
          401: { description: 'Sesi kedaluwarsa atau tidak valid' },
        },
      },
    },
    '/accommodations': {
      get: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Daftar hunian kos terkurasi Supabase',
        parameters: [
          { name: 'campus', in: 'query', schema: { type: 'string' }, description: 'ID kampus (telkom, itb, ui, ugm)' },
          { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Kata kunci pencarian nama atau area' },
          { name: 'type', in: 'query', schema: { type: 'string' }, description: 'Tipe kos (Putra, Putri, Campur)' },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 }, description: 'Jumlah data per halaman' },
        ],
        responses: {
          200: {
            description: 'Daftar hunian kos',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    count: { type: 'number', example: 8 },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Accommodation' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/accommodations/{id}': {
      get: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Detail hunian kos spesifik berdasarkan ID atau slug',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' }, example: 'kos-01' },
        ],
        responses: {
          200: { description: 'Data kos ditemukan' },
          404: { description: 'Kos tidak ditemukan' },
        },
      },
    },
    '/accommodations/route': {
      post: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Perhitungan rute geospasial pejalan kaki / motor dari kos ke kampus',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['accommodationId'],
                properties: {
                  accommodationId: { type: 'string', example: 'kos-01' },
                  campusId: { type: 'string', example: 'telkom' },
                  mode: { type: 'string', enum: ['foot', 'motorcycle'], default: 'foot' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Data rute, jarak (meter/km), estimasi durasi tempuh, dan polyline' },
        },
      },
    },
    '/accommodations/bookings': {
      get: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Daftar janji temu survei kos (Visit Schedule)',
        responses: {
          200: {
            description: 'Daftar jadwal survei aktif',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Booking' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Membuat janji temu survei kos baru',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['accommodationName', 'scheduledTime'],
                properties: {
                  accommodationId: { type: 'string', example: 'kos-01' },
                  accommodationName: { type: 'string', example: 'Bojongsoang Green Suites' },
                  campusName: { type: 'string', example: 'Telkom University' },
                  scheduledTime: { type: 'string', example: '14.00 WIB' },
                  scheduledDate: { type: 'string', example: 'Besok' },
                  visitorName: { type: 'string', example: 'Faiz' },
                  notes: { type: 'string', example: 'Lihat kamar lantai 2' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Jadwal survei berhasil disimpan' },
          400: { description: 'Data jadwal tidak lengkap' },
        },
      },
    },
    '/accommodations/bookings/{id}': {
      patch: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Memperbarui jam, tanggal, atau catatan janji temu survei',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  scheduledTime: { type: 'string', example: '16.00 WIB' },
                  notes: { type: 'string', example: 'Digeser 2 jam karena ada kuliah' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Jadwal survei diperbarui' },
        },
      },
      delete: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Membatalkan / menghapus jadwal survei kos',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Jadwal survei berhasil dihapus' },
        },
      },
    },
    '/accommodations/ai-search/stream': {
      post: {
        tags: ['Smart Kos Accommodations'],
        summary: 'Pencarian kos cerdas berbasis Server-Sent Events (SSE) Streaming',
        description: 'Menerima pesan kriteria pencarian dan mengalirkan status pemikiran, event redirect_location, rekomendasi terverifikasi, dan token delta respons.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Cari kos putri dekat Telkom University yang hemat budget' },
                  campusId: { type: 'string', example: 'telkom' },
                  reasoningEffort: { type: 'string', enum: ['none', 'low', 'medium', 'high'], default: 'none' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Aliran SSE teks (event: status, event: redirect_location, event: recommendations, event: text_delta, event: done)',
            content: {
              'text/event-stream': {
                schema: { type: 'string' },
              },
            },
          },
        },
      },
    },
    '/openai/chat': {
      post: {
        tags: ['OpenAI & AI Chat'],
        summary: 'Chat completion standar OpenAI',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['messages'],
                properties: {
                  messages: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        role: { type: 'string', enum: ['user', 'assistant', 'system'] },
                        content: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Hasil respons chat' },
        },
      },
    },
    '/openai/responses/stream': {
      post: {
        tags: ['OpenAI & AI Chat'],
        summary: 'Multi-turn Responses API dengan SSE Streaming dan dukungan lampiran',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['message'],
                properties: {
                  message: { type: 'string', example: 'Tolong buatkan tabel perbandingan kos dekat ITB' },
                  reasoningEffort: { type: 'string', enum: ['none', 'low', 'medium', 'high'] },
                  previousResponseId: { type: 'string' },
                  attachments: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        mimeType: { type: 'string' },
                        dataUrl: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Aliran streaming event SSE' },
        },
      },
    },
    '/realtime/client-secrets': {
      post: {
        tags: ['Realtime Voice & WebRTC'],
        summary: 'Membuat ephemeral client secret sesi suara OpenAI Realtime',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  voice: { type: 'string', default: 'alloy' },
                  modalities: { type: 'array', items: { type: 'string' }, example: ['audio', 'text'] },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Client secret token ephemeral dan ID sesi' },
        },
      },
    },
    '/realtime/calls': {
      post: {
        tags: ['Realtime Voice & WebRTC'],
        summary: 'Negosiasi panggilan suara WebRTC (SDP Offer / Answer)',
        requestBody: {
          required: true,
          content: {
            'application/sdp': {
              schema: { type: 'string', example: 'v=0\r\no=- 0 0 IN IP4 127.0.0.1...' },
            },
          },
        },
        responses: {
          200: { description: 'SDP Answer WebRTC' },
        },
      },
    },
    '/realtime/tool-call': {
      post: {
        tags: ['Realtime Voice & WebRTC'],
        summary: 'Relay pemanggilan tool selama percakapan suara real-time berlangsung',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['callId', 'toolName', 'callIndex'],
                properties: {
                  callId: { type: 'string' },
                  toolName: { type: 'string', example: 'teralio_search_accommodations' },
                  toolArgs: { type: 'object' },
                  callIndex: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Hasil eksekusi tool' },
        },
      },
    },
    '/mcp/tools': {
      get: {
        tags: ['MCP (Model Context Protocol)'],
        summary: 'Daftar tools yang disediakan oleh server Model Context Protocol Teralio',
        responses: {
          200: { description: 'Daftar nama tool, deskripsi, dan skema input JSON' },
        },
      },
    },
    '/mcp/tools/call': {
      post: {
        tags: ['MCP (Model Context Protocol)'],
        summary: 'Mengeksekusi tool MCP secara langsung',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['toolName'],
                properties: {
                  toolName: { type: 'string', example: 'teralio_focus_map_location' },
                  arguments: { type: 'object' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Keluaran eksekusi tool' },
        },
      },
    },
    '/maps/places/search': {
      get: {
        tags: ['Google Maps Platform'],
        summary: 'Pencarian tempat di sekitar koordinat via Google Maps Places API',
        parameters: [
          { name: 'query', in: 'query', required: true, schema: { type: 'string' }, example: 'laundry dekat telkom university' },
          { name: 'lat', in: 'query', schema: { type: 'number' }, example: -6.974 },
          { name: 'lng', in: 'query', schema: { type: 'number' }, example: 107.63 },
        ],
        responses: {
          200: { description: 'Hasil pencarian tempat Google Places' },
        },
      },
    },
    '/maps/geocode': {
      get: {
        tags: ['Google Maps Platform'],
        summary: 'Geocoding alamat ke koordinat lintang & bujur',
        parameters: [
          { name: 'address', in: 'query', required: true, schema: { type: 'string' }, example: 'Telkom University Bandung' },
        ],
        responses: {
          200: { description: 'Koordinat lokasi (latitude, longitude, dan formatted address)' },
        },
      },
    },
  },
};

export default swaggerSpec;
