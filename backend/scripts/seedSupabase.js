import { accommodationsService } from '../services/accommodationsService.js';
import { getSupabaseConfig } from '../services/supabaseService.js';

async function main() {
  const supa = getSupabaseConfig();
  console.log('=== TERALIO SUPABASE SMART KOS SEEDER ===');
  console.log(`Target URL: ${supa.url || '(belum diatur)'}`);

  try {
    const result = await accommodationsService.seedToSupabase();
    console.log(
      `[SUKSES] ${result.insertedOrUpdated} data kos terkurasi berhasil dimasukkan/diperbarui pada tabel public.accommodations!`,
    );
    process.exit(0);
  } catch (err) {
    console.error(`\n[PERHATIAN] ${err.message}`);
    if (err.code === 'SUPABASE_TABLE_MISSING') {
      console.error(
        '\nLangkah cepat (hanya 1x):\n' +
          '1. Buka Supabase Dashboard -> SQL Editor -> New Query\n' +
          '2. Salin isi file: supabase/migrations/001_smart_kos_accommodations.sql lalu klik Run\n' +
          '3. Jalankan kembali perintah: npm run seed:supabase\n',
      );
    }
    process.exit(1);
  }
}

main();
