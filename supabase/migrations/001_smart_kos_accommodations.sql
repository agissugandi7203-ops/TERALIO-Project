-- ============================================================================
-- TERALIO SMART KOS — SUPABASE POSTGRESQL SCHEMA & SEED DATA
-- Jalankan di Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.accommodations (
    id TEXT PRIMARY KEY,
    slug TEXT UNIQUE NOT NULL,
    campus_id TEXT NOT NULL,
    campus_name TEXT NOT NULL,
    city TEXT NOT NULL,
    area TEXT NOT NULL,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    price_monthly INTEGER NOT NULL,
    price_label TEXT NOT NULL,
    distance_label TEXT,
    kos_type TEXT NOT NULL,
    match_score INTEGER DEFAULT 95,
    tag TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.8,
    reviews_count INTEGER DEFAULT 25,
    rooms_available INTEGER DEFAULT 2,
    visiting_hours TEXT,
    verified BOOLEAN DEFAULT TRUE,
    description TEXT,
    owner_name TEXT,
    contact_phone TEXT,
    contact_whatsapp TEXT,
    features TEXT[] DEFAULT '{}',
    nearby_landmarks JSONB DEFAULT '[]'::jsonb,
    reviews JSONB DEFAULT '[]'::jsonb,
    accent_palette TEXT[] DEFAULT ARRAY['#1d4ed8', '#38bdf8'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_accommodations_campus_id ON public.accommodations (campus_id);
CREATE INDEX IF NOT EXISTS idx_accommodations_city ON public.accommodations (city);
CREATE INDEX IF NOT EXISTS idx_accommodations_price ON public.accommodations (price_monthly);

ALTER TABLE public.accommodations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read accommodations" ON public.accommodations;
CREATE POLICY "Allow public read accommodations"
ON public.accommodations FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow service_role full access accommodations" ON public.accommodations;
CREATE POLICY "Allow service_role full access accommodations"
ON public.accommodations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================================================
-- TABEL JADWAL SURVEI KOS DINAMIS (public.survey_bookings)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.survey_bookings (
    id TEXT PRIMARY KEY,
    accommodation_id TEXT NOT NULL,
    accommodation_name TEXT NOT NULL,
    campus_name TEXT,
    address TEXT,
    owner_name TEXT,
    contact_phone TEXT,
    scheduled_label TEXT NOT NULL,
    scheduled_iso DATE,
    visitor_name TEXT DEFAULT 'Mahasiswa TERALIO',
    status TEXT DEFAULT 'Terjadwal',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.survey_bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read survey_bookings" ON public.survey_bookings;
CREATE POLICY "Allow public read survey_bookings"
ON public.survey_bookings FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Allow public insert survey_bookings" ON public.survey_bookings;
CREATE POLICY "Allow public insert survey_bookings"
ON public.survey_bookings FOR INSERT
TO anon, authenticated, service_role
WITH CHECK (true);

-- Setelah menjalankan SQL ini, jalankan:
--   npm run seed:supabase
-- untuk mengisi otomatis seluruh 12 data kos terkurasi ke Supabase Anda!
