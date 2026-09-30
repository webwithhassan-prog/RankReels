import React from 'react';

export default function TierComparison() {
  const tiers = [
    {
      tier: 'S',
      title: 'RankReel Platform',
      desc: 'Your ideas and identity, without the recurring production workload or paid APIs.',
      badge: 'Built to Repeat',
      isTop: true,
      tierClass: 'tier-s'
    },
    {
      tier: 'A',
      title: 'In-House Videographer',
      desc: 'High quality and fast iterations, but $60,000+ salary plus expensive camera gear overhead.',
      badge: '$5K/mo Overhead',
      isTop: false,
      tierClass: 'tier-a'
    },
    {
      tier: 'B',
      title: 'Hiring an Agency Production Team',
      desc: 'High control, $4,000/mo retainer, and another grueling production cycle for every single reel.',
      badge: '$4K/mo Retainer',
      isTop: false,
      tierClass: 'tier-b'
    },
    {
      tier: 'C',
      title: 'Filming & Editing It Yourself',
      desc: 'Authentic, but every single reel demands 3 hours of lighting, multiple takes, and CapCut trimming.',
      badge: 'Time Sink',
      isTop: false,
      tierClass: 'tier-c'
    },
    {
      tier: 'D',
      title: 'Generic Faceless AI Slideshows',
      desc: 'Fast to churn out, instantly skipped by viewers, and zero brand affinity or trust.',
      badge: '0 Authority',
      isTop: false,
      tierClass: 'tier-d'
    }
  ];

  return (
    <section style={{ padding: '80px 0', borderTop: '1px solid var(--hair)' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="lab">We Ranked the Options</span>
          <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)', maxWidth: '22ch', margin: '0 auto' }}>
            How the options stack up.
          </h2>
        </div>

        <div style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
          {tiers.map((t, idx) => (
            <div
              key={t.title}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px 16px',
                borderTop: '1px solid var(--hair)',
                borderBottom: idx === tiers.length - 1 ? '1px solid var(--hair)' : 'none',
                background: t.isTop ? 'rgba(99, 102, 241, 0.05)' : 'transparent',
                borderRadius: t.isTop ? '14px' : '0',
                transition: 'all 0.2s ease',
                opacity: t.isTop ? 1 : 0.72
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '1';
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = t.isTop ? '1' : '0.72';
                e.currentTarget.style.background = t.isTop ? 'rgba(99, 102, 241, 0.05)' : 'transparent';
              }}
            >
              {/* Tier letter block */}
              <span
                className={t.tierClass}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  fontFamily: 'Inter Tight',
                  fontWeight: 900,
                  fontSize: '22px',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0
                }}
              >
                {t.tier}
              </span>

              {/* Text */}
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontFamily: 'Inter Tight',
                    fontWeight: 700,
                    fontSize: '17px',
                    letterSpacing: '-0.02em',
                    color: t.isTop ? '#FFF' : 'var(--text)'
                  }}
                >
                  {t.title}
                </h3>
                <p style={{ color: t.isTop ? 'var(--text-2)' : 'var(--text-3)', fontSize: '13.5px', marginTop: '2px', lineHeight: 1.5 }}>
                  {t.desc}
                </p>
              </div>

              {/* Badge */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: t.isTop ? 'var(--accent-light)' : 'var(--text-3)',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  background: t.isTop ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                  whiteSpace: 'nowrap'
                }}
              >
                {t.badge}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
