import React, { useState } from 'react';
import { ArrowRight, Wand2, Sparkles, UserCheck, Sliders, CheckCircle2 } from 'lucide-react';

export default function HowItWorks({ onOpenStudio }) {
  const [activeChip, setActiveChip] = useState('SaaS Founders');
  const chips = ['SaaS Founders', 'B2B Coaches', 'Fitness Creators', 'Crypto & Web3', 'Agency Owners'];

  return (
    <section id="how" style={{ padding: '100px 0 80px', position: 'relative' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <span className="lab">The Fix</span>
          <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)', maxWidth: '24ch', margin: '0 auto' }}>
            Three steps. No filming day.
          </h2>
          <p
            style={{
              color: 'var(--text-2)',
              fontSize: '16px',
              maxWidth: '56ch',
              margin: '14px auto 0',
              lineHeight: 1.6
            }}
          >
            Create your Digital Twin in less than five minutes with one photo or selfie and a short voice sample.
            Then reuse it for every reel.
          </p>
        </div>

        {/* 3 Step Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px'
          }}
        >
          {/* Step 01: Digital Twin */}
          <div
            className="glass-tile"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Animated Canvas / SVG Tile */}
            <div
              style={{
                height: '140px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hair)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              {/* Phone Frame */}
              <div
                style={{
                  width: '64px',
                  height: '94px',
                  borderRadius: '12px',
                  border: '1.5px solid rgba(255,255,255,0.2)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#0D0D10'
                }}
              >
                {/* Face Circle */}
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: '1.5px solid rgba(255,255,255,0.35)',
                    background: 'rgba(255, 92, 57, 0.1)',
                    display: 'grid',
                    placeItems: 'center',
                    position: 'relative'
                  }}
                >
                  <UserCheck size={16} style={{ color: 'var(--accent)' }} />
                </div>
                {/* Moving Scan Line */}
                <div
                  style={{
                    position: 'absolute',
                    top: '15px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: '#FF5C39',
                    boxShadow: '0 0 8px #FF5C39',
                    animation: 'scanLine 2s ease-in-out infinite alternate'
                  }}
                />
                {/* Recording Dot */}
                <div
                  style={{
                    position: 'absolute',
                    top: '6px',
                    right: '8px',
                    width: '5px',
                    height: '5px',
                    borderRadius: '50%',
                    background: '#FF5C39'
                  }}
                />
              </div>

              {/* Pulsing Voice Waves */}
              <div style={{ marginLeft: '16px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                {[14, 26, 38, 22, 12].map((height, i) => (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      height: `${height}px`,
                      borderRadius: '2px',
                      background: 'linear-gradient(180deg, #F08A7E 0%, #F2B27C 100%)',
                      animation: `voiceBars 0.8s ease-in-out ${i * 0.15}s infinite alternate`
                    }}
                  />
                ))}
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>01</span>
                <h3 className="display" style={{ fontSize: '19px', fontWeight: 600 }}>Create your Digital Twin</h3>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Add one clear photo or selfie and choose your voice timbre. Your Digital Twin is initialized in under a minute.
              </p>
              <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-3)' }}>
                ↳ Saved client-side for every future reel.
              </div>
            </div>
          </div>

          {/* Step 02: Pick Topic */}
          <div
            className="glass-tile"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Interactive Chip Tile */}
            <div
              style={{
                height: '140px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hair)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px',
                gap: '8px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'center' }}>
                {chips.slice(0, 3).map((chip) => (
                  <span
                    key={chip}
                    onClick={() => setActiveChip(chip)}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      padding: '4px 10px',
                      borderRadius: '999px',
                      cursor: 'pointer',
                      background: activeChip === chip ? 'rgba(255, 92, 57, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      color: activeChip === chip ? 'var(--accent)' : 'var(--text-2)',
                      border: `1px solid ${activeChip === chip ? 'var(--accent)' : 'var(--hair)'}`,
                      transition: 'all 0.2s'
                    }}
                  >
                    {chip}
                  </span>
                ))}
              </div>

              {/* Fake typing input */}
              <div
                style={{
                  width: '90%',
                  height: '32px',
                  borderRadius: '8px',
                  border: '1px solid rgba(255,255,255,0.18)',
                  background: '#0D0D10',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 10px',
                  gap: '6px'
                }}
              >
                <span style={{ fontSize: '11px', color: 'var(--text-2)' }}>Top 5 tools for {activeChip}...</span>
                <span style={{ width: '2px', height: '14px', background: 'var(--accent)', animation: 'pulseGlow 0.8s infinite' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>02</span>
                <h3 className="display" style={{ fontSize: '19px', fontWeight: 600 }}>Choose what to rank</h3>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Bring your own idea or generate a viral batch tailored to your niche, audience, offer, and polarizing hot takes.
              </p>
              <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-3)' }}>
                ↳ 60+ pre-tested viral niche frameworks included.
              </div>
            </div>
          </div>

          {/* Step 03: Review and publish */}
          <div
            className="glass-tile"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Visual tier stack tile */}
            <div
              style={{
                height: '140px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--hair)',
                position: 'relative',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                marginBottom: '20px'
              }}
            >
              {/* Animated Tier mini list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', width: '130px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 6px', borderRadius: '4px', background: 'rgba(240,138,126,0.2)', border: '1px solid rgba(240,138,126,0.4)' }}>
                  <span className="tier-s" style={{ width: '16px', height: '16px', borderRadius: '3px', fontSize: '9px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>S</span>
                  <div style={{ height: '5px', width: '70px', borderRadius: '2px', background: '#F08A7E' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 6px', borderRadius: '4px', background: 'rgba(242,178,124,0.2)', border: '1px solid rgba(242,178,124,0.4)' }}>
                  <span className="tier-a" style={{ width: '16px', height: '16px', borderRadius: '3px', fontSize: '9px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>A</span>
                  <div style={{ height: '5px', width: '55px', borderRadius: '2px', background: '#F2B27C' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '3px 6px', borderRadius: '4px', background: 'rgba(237,216,127,0.2)', border: '1px solid rgba(237,216,127,0.4)' }}>
                  <span className="tier-b" style={{ width: '16px', height: '16px', borderRadius: '3px', fontSize: '9px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>B</span>
                  <div style={{ height: '5px', width: '40px', borderRadius: '2px', background: '#EDD87F' }} />
                </div>
              </div>

              {/* Ready badge */}
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255,92,57,0.15)',
                  border: '1px solid var(--accent)',
                  display: 'grid',
                  placeItems: 'center',
                  color: 'var(--accent)'
                }}
              >
                <CheckCircle2 size={20} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent)' }}>03</span>
                <h3 className="display" style={{ fontSize: '19px', fontWeight: 600 }}>Review and publish</h3>
              </div>
              <p style={{ color: 'var(--text-2)', fontSize: '14.5px', lineHeight: 1.6 }}>
                Edit the script, preview the vertical video, adjust audio pacing, and download the finished vertical reel.
              </p>
              <div style={{ marginTop: '12px', fontSize: '12.5px', color: 'var(--text-3)' }}>
                ↳ 1080×1920 MP4/WebM ready for IG &amp; TikTok.
              </div>
            </div>
          </div>
        </div>

        {/* Handwritten Note bottom */}
        <div style={{ textAlign: 'center', marginTop: '48px' }}>
          <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <svg width="28" height="32" viewBox="0 0 28 32" fill="none" stroke="var(--text-3)" strokeWidth="1.8">
              <path d="M14 28 C 12 20, 16 12, 14 4" strokeLinecap="round" />
              <path d="M9 9 L 14 4 L 19 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-hand" style={{ color: 'var(--text-2)', fontSize: '26px' }}>
              AI handles production. You approve the final cut.
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '30px' }}>
          <button
            onClick={onOpenStudio}
            className="btn btn-primary"
            style={{ padding: '14px 34px', fontSize: '15.5px' }}
          >
            <span>Create my first ranking reel</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}
