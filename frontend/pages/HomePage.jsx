import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import HeroFogScene from '../components/HeroFogScene.jsx';
import CaseResultsSection from '../components/CaseResultsSection.jsx';
import PricingSection from '../components/PricingSection.jsx';
import TestimonialsSection from '../components/TestimonialsSection.jsx';
import FaqSection from '../components/FaqSection.jsx';
import {
  ArrowUpRightIcon,
} from '../components/Icons.jsx';
import { useAtmosphere } from '../context/AtmosphereContext.jsx';
import { useRouter } from '../context/RouterContext.jsx';
import {
  HOW_IT_WORKS_STAGES,
  TECHNICAL_SPECS,
} from '../data/teralioContent.js';

const ARCHITECTURE_STAGES = [
  {
    step: '01',
    title: 'Accommodation Discovery Berbasis AI',
    description:
      'Sampaikan kebutuhan tempat tinggal Anda menggunakan bahasa sehari-hari. Asisten percakapan AI Teralio memahami kriteria budget, tipe kos putra/putri, fasilitas AC/water heater, dan lingkungan tenang secara akurat ke database 46 unit terkurasi.',
  },
  {
    step: '02',
    title: 'Budget Intelligence & Transparansi Biaya',
    description:
      'Menghilangkan 74% biaya tersembunyi yang kerap dihadapi mahasiswa. Sistem mengkalkulasikan sewa pokok ditambah estimasi utilitas listrik, air, dan kebersihan menjadi total biaya bulanan yang rasional sebelum survei.',
  },
  {
    step: '03',
    title: 'Location Intelligence & Google Maps API',
    description:
      'Penentuan koordinat presisi berbasis Google Maps Platform dan kalkulasi rute jalan kaki OpenStreetMap (OSRM) ke gerbang kampus Telkom University, ITB, UTB, UI, dan UGM, lengkap dengan analisis kawasan bebas banjir.',
  },
  {
    step: '04',
    title: 'Mekanisme Direct-to-Owner & Visit Schedule',
    description:
      'Hubungi pemilik kos asli secara langsung melalui WhatsApp atau telepon tanpa perantara/makelar. Jadwalkan survei kunjungan fisik dan simpan langsung ke kalender interaktif aplikasi.',
  },
];

const HARDWARE_BLUEPRINT_SPECS = [
  '46 Katalog Properti Terkurasi dengan Koordinat Riil di Bandung Raya, Depok & Yogyakarta',
  'AI Percakapan Natural Language Teks & Suara Real-time (OpenAI WebRTC)',
  'Pemetaan Geospasial Google Maps API + Engine Rute Jalan Kaki OSRM',
  'Kalkulasi Total Biaya Tinggal: Sewa Pokok + Estimasi Utilitas Bulanan',
  'Model Direct-to-Owner 100% Bebas Biaya Komisi Makelar / Perantara',
  'Penyelarasan Kalender Survei Kunjungan Kos & Booking Interaktif',
  'Basis Data PostgreSQL Supabase Diamankan Row Level Security (RLS)',
  '104 Skenario Pengujian Otomatis Lulus 100% (Vitest & Supertest)',
];

export function HomePage() {
  const { isNight } = useAtmosphere();
  const { navigate } = useRouter();

  // Smooth scrolling Lenis (diterapkan halus khusus desktop landing page, dinonaktifkan pada HP/mobile)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Deteksi HP / perangkat mobile (layar <= 768px, pointer kasar/touch, atau user-agent mobile)
    const isMobile =
      window.innerWidth <= 768 ||
      (typeof window.matchMedia === 'function' &&
        window.matchMedia('(max-width: 768px), (pointer: coarse)').matches) ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent || ''
      );

    // Pada HP, matikan Lenis sepenuhnya agar menggunakan native smooth scrolling bawaan sistem operasi
    if (isMobile) {
      return;
    }

    let lenis;
    let rafId;

    try {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        wheelMultiplier: 0.95,
      });

      const raf = (time) => {
        lenis?.raf(time);
        rafId = requestAnimationFrame(raf);
      };
      rafId = requestAnimationFrame(raf);
    } catch {
      // Fallback gracefully jika environment tidak mendukung
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenis) lenis.destroy();
    };
  }, []);

  const handlePrimaryAction = () => {
    navigate('/login');
  };

  return (
    <div className="home-page" data-testid="home-page">
      {/* 1. Hero Section: Lumen Roof 3D Fog Scene & $0 Electric Bills Guarantee */}
      <section id="hero" aria-label="Lumen Roof Hero">
        <HeroFogScene />
      </section>

      {/* 2. How It Works Section: 4-Stage Autonomous Power Architecture & Hardware Blueprint Points */}
      <section
        id="how-it-works"
        className="home-section landing-section"
        data-testid="how-it-works-page"
      >
        <div className="section-shell">
          <div className="section-header-split">
            <div>
              <span className="eyebrow-pill">Intelligent Living Ecosystem</span>
              <h2 className="section-title">
                Tiga Lapisan Terintegrasi. <i className="split-muted">Tanpa Biaya Tersembunyi.</i>
              </h2>
            </div>
            <p className="section-lead max-w-lg">
              Teralio menggabungkan Accommodation Discovery, Budget Intelligence, dan Location Intelligence
              ke dalam satu alur percakapan cerdas yang menghubungkan mahasiswa langsung dengan pemilik hunian.
            </p>
          </div>

          {/* 4 Architectural Stages (01 - 04) */}
          <div className="arch-stages-grid">
            {ARCHITECTURE_STAGES.map((stage) => (
              <article key={stage.step} className="arch-stage-card">
                <div className="arch-stage-header">
                  <span className="arch-stage-num">{stage.step}</span>
                  <div className="arch-stage-line" />
                </div>
                <h3 className="arch-stage-title">{stage.title}</h3>
                <p className="arch-stage-desc">{stage.description}</p>
              </article>
            ))}
          </div>

          {/* Hardware Blueprint — Microgrid Technical Specifications Point List */}
          <div className="hardware-blueprint-panel">
            <div className="blueprint-top-bar">
              <div>
                <span className="eyebrow-pill">Spesifikasi Arsitektur Sistem</span>
                <h3 className="blueprint-heading">
                  Fondasi Teknis Platform Teralio
                </h3>
              </div>
              <button
                type="button"
                className="ghost-pill-btn"
                onClick={handlePrimaryAction}
              >
                <span>Mulai Eksplorasi Hunian</span>
                <ArrowUpRightIcon size={14} />
              </button>
            </div>

            <div className="blueprint-points-grid">
              {HARDWARE_BLUEPRINT_SPECS.map((specText, idx) => (
                <div key={`spec-point-${idx}`} className="blueprint-point-item">
                  <span className="blueprint-point-dot" />
                  <span className="blueprint-point-text">{specText}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Our Cases Section: Elo One Results Section with Sunset Orange Cards */}
      <section id="cases" className="home-section landing-section" data-testid="our-cases-page">
        <div className="section-shell">
          <CaseResultsSection />
        </div>
      </section>

      {/* 4 & 5. Pricing & Testimonials Sections: Menyatu Seamless Sebagai Satu Kesatuan Visual */}
      <div id="pricing-testimonials-block" className="w-full relative" data-testid="careers-page">
        {/* Pricing Section (Menggantikan Careers) */}
        <PricingSection onAction={handlePrimaryAction} />

        {/* Testimonials Section (Menyambung langsung dengan halaman atas) */}
        <TestimonialsSection onAction={handlePrimaryAction} />
      </div>

      {/* 6. FAQ Section: FAQ dengan Dropdown Accordion Halus */}
      <FaqSection onAction={handlePrimaryAction} />
    </div>
  );
}

export default HomePage;
