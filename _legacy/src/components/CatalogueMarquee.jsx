import React from 'react';
import { CATALOGUE_ITEMS_ROW_1, CATALOGUE_ITEMS_ROW_2 } from '../data/mockData';
import { Play, Eye, Sparkles } from 'lucide-react';

export default function CatalogueMarquee({ onSelectReel }) {
  // Duplicate arrays for seamless infinite loop
  const row1 = [...CATALOGUE_ITEMS_ROW_1, ...CATALOGUE_ITEMS_ROW_1];
  const row2 = [...CATALOGUE_ITEMS_ROW_2, ...CATALOGUE_ITEMS_ROW_2];

  return (
    <section id="catalogue" style={{ padding: '80px 0 60px', overflow: 'hidden' }}>
      <div className="wrap" style={{ textAlign: 'center', marginBottom: '42px' }}>
        <span className="lab">Creator Catalogue</span>
        <h2 className="display" style={{ fontSize: 'clamp(28px, 3.8vw, 48px)', maxWidth: '24ch', margin: '0 auto' }}>
          This format is eating every feed right now.
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '15.5px', marginTop: '12px' }}>
          Proven high-retention vertical reels across 30+ niches. Click any card to remix in the Studio.
        </p>
      </div>

      {/* Marquee Container with fade edge masks */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          overflow: 'hidden',
          padding: '10px 0'
        }}
      >
        {/* Left & Right gradient masks */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '160px',
            background: 'linear-gradient(90deg, var(--bg) 0%, transparent 100%)',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            width: '160px',
            background: 'linear-gradient(-90deg, var(--bg) 0%, transparent 100%)',
            zIndex: 3,
            pointerEvents: 'none'
          }}
        />

        {/* Row 1 Scrolling Left */}
        <div className="marquee-track-left" style={{ marginBottom: '16px' }}>
          {row1.map((item, idx) => (
            <div
              key={`r1-${idx}`}
              onClick={() => onSelectReel && onSelectReel(item)}
              style={{
                position: 'relative',
                width: '180px',
                height: '310px',
                borderRadius: '18px',
                overflow: 'hidden',
                background: '#121215',
                border: '1px solid var(--hair)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 92, 57, 0.4)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--hair)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={item.bgImg}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
                loading="lazy"
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.92) 100%)'
                }}
              />

              {/* Top pill */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFF',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {item.tag}
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '3px 7px',
                    borderRadius: '999px'
                  }}
                >
                  <Eye size={10} />
                  <span>{item.views}</span>
                </div>
              </div>

              {/* Center Play Icon hover */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  margin: 'auto',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 92, 57, 0.9)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#FFF',
                  boxShadow: '0 4px 16px rgba(255, 92, 57, 0.4)'
                }}
              >
                <Play size={16} fill="#FFF" style={{ marginLeft: '2px' }} />
              </div>

              {/* Bottom Info */}
              <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFF', lineHeight: 1.25, marginBottom: '6px' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>{item.author}</span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: item.tierColor,
                      color: '#000'
                    }}
                  >
                    #1 {item.topPick.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Row 2 Scrolling Right */}
        <div className="marquee-track-right">
          {row2.map((item, idx) => (
            <div
              key={`r2-${idx}`}
              onClick={() => onSelectReel && onSelectReel(item)}
              style={{
                position: 'relative',
                width: '180px',
                height: '310px',
                borderRadius: '18px',
                overflow: 'hidden',
                background: '#121215',
                border: '1px solid var(--hair)',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)';
                e.currentTarget.style.borderColor = 'rgba(255, 92, 57, 0.4)';
                e.currentTarget.style.boxShadow = '0 16px 36px rgba(0,0,0,0.6)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.borderColor = 'var(--hair)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <img
                src={item.bgImg}
                alt={item.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.7)' }}
                loading="lazy"
              />
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.92) 100%)'
                }}
              />

              {/* Top pill */}
              <div
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  right: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '999px',
                    background: 'rgba(0,0,0,0.6)',
                    backdropFilter: 'blur(8px)',
                    color: '#FFF',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}
                >
                  {item.tag}
                </span>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.85)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '3px 7px',
                    borderRadius: '999px'
                  }}
                >
                  <Eye size={10} />
                  <span>{item.views}</span>
                </div>
              </div>

              {/* Center Play Icon hover */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  margin: 'auto',
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 92, 57, 0.9)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#FFF',
                  boxShadow: '0 4px 16px rgba(255, 92, 57, 0.4)'
                }}
              >
                <Play size={16} fill="#FFF" style={{ marginLeft: '2px' }} />
              </div>

              {/* Bottom Info */}
              <div style={{ position: 'absolute', bottom: '14px', left: '14px', right: '14px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#FFF', lineHeight: 1.25, marginBottom: '6px' }}>
                  {item.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.65)' }}>{item.author}</span>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: item.tierColor,
                      color: '#000'
                    }}
                  >
                    #1 {item.topPick.split(' ')[0]}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
