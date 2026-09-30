import React from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

export default function FinalCta({ onOpenStudio }) {
  const chips = [
    'Your face. Your voice.',
    'Ideas tailored to your niche',
    'Editable script and tier rankings',
    'Ready-to-post vertical 1080×1920 MP4'
  ];

  return (
    <section style={{ padding: '0 0 100px', textAlign: 'center' }}>
      <div className="wrap">
        <div
          style={{
            borderRadius: '28px',
            padding: '76px 44px 64px',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(175deg, #17100E 0%, #0E0B0A 55%, #0A0A0B 100%)',
            border: '1px solid rgba(255, 92, 57, 0.22)',
            boxShadow: '0 30px 80px -20px rgba(255, 92, 57, 0.2)'
          }}
        >
          {/* Radial Top Glow */}
          <div
            style={{
              position: 'absolute',
              top: '-40%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '640px',
              height: '400px',
              background: 'radial-gradient(circle, rgba(255, 92, 57, 0.22) 0%, transparent 70%)',
              pointerEvents: 'none'
            }}
          />

          <span className="lab" style={{ position: 'relative', zIndex: 1, marginBottom: '14px' }}>
            Your audience is scrolling
          </span>

          <h2
            className="display"
            style={{
              position: 'relative',
              zIndex: 1,
              fontSize: 'clamp(32px, 4.8vw, 56px)',
              maxWidth: '18ch',
              margin: '0 auto',
              lineHeight: 1.15
            }}
          >
            Make the ranking reel they <span style={{ color: 'var(--accent)' }}>stop for.</span>
          </h2>

          <p
            style={{
              position: 'relative',
              zIndex: 1,
              color: 'var(--text-2)',
              fontSize: '16.5px',
              maxWidth: '46ch',
              margin: '20px auto 0',
              lineHeight: 1.7
            }}
          >
            Create your Digital Twin once, then turn new ideas into ranking reels that keep your face, voice, and point of view showing up without another filming day.
          </p>

          {/* Chips */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'center',
              gap: '10px',
              flexWrap: 'wrap',
              margin: '28px auto 0',
              maxWidth: '680px'
            }}
          >
            {chips.map((chip) => (
              <span
                key={chip}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-2)',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--hair)',
                  borderRadius: '999px',
                  padding: '6px 14px'
                }}
              >
                <Check size={13} style={{ color: 'var(--accent)', strokeWidth: 3 }} />
                <span>{chip}</span>
              </span>
            ))}
          </div>

          {/* Big Action Button */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: '36px' }}>
            <button
              onClick={onOpenStudio}
              className="btn btn-accent lg"
              style={{
                padding: '16px 42px',
                fontSize: '17px',
                fontWeight: 700,
                boxShadow: '0 20px 50px -15px rgba(255, 92, 57, 0.7)'
              }}
            >
              <span>Create my first ranking reel</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Stats Bar */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              justifyContent: 'center',
              gap: '0',
              flexWrap: 'wrap',
              marginTop: '54px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '36px'
            }}
          >
            <div style={{ textAlign: 'center', padding: '0 36px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontFamily: 'Inter Tight', fontWeight: 700, fontSize: '28px', color: '#FFF' }}>1×</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '4px' }}>Set up your Digital Twin</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 36px', borderRight: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <div style={{ fontFamily: 'Inter Tight', fontWeight: 700, fontSize: '28px', color: '#FFF' }}>4</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '4px' }}>Production stages handled</div>
            </div>
            <div style={{ textAlign: 'center', padding: '0 36px' }}>
              <div style={{ fontFamily: 'Inter Tight', fontWeight: 700, fontSize: '28px', color: '#FFF' }}>1</div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-3)', marginTop: '4px' }}>Final approval from you</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
