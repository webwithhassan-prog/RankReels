import React from 'react';

export default function Statement() {
  return (
    <section
      style={{
        padding: '110px 0 90px',
        textAlign: 'center',
        borderTop: '1px solid var(--hair)',
        borderBottom: '1px solid var(--hair)',
        background: 'linear-gradient(180deg, rgba(255, 92, 57, 0.02) 0%, transparent 100%)'
      }}
    >
      <div className="wrap">
        <p
          className="display"
          style={{
            fontSize: 'clamp(24px, 3.2vw, 38px)',
            color: 'var(--text)',
            maxWidth: '30ch',
            margin: '0 auto',
            lineHeight: 1.2
          }}
        >
          Ranking reels eat up every feed, but setting up tier lists takes hours.
        </p>

        <p
          className="display"
          style={{
            fontSize: 'clamp(22px, 3vw, 36px)',
            color: 'var(--text-3)',
            maxWidth: '32ch',
            margin: '14px auto 0',
            lineHeight: 1.25
          }}
        >
          Every reel means another topic, script, recording session, edit, and caption.
        </p>

        <p
          style={{
            fontFamily: 'Inter Tight, sans-serif',
            fontSize: 'clamp(16px, 2vw, 22px)',
            fontWeight: 600,
            color: 'var(--text-2)',
            maxWidth: '46ch',
            margin: '22px auto 0',
            letterSpacing: '-0.02em'
          }}
        >
          RankReels turns that entire production line into one review.
        </p>

        <p
          className="display"
          style={{
            fontSize: 'clamp(28px, 3.8vw, 46px)',
            color: 'var(--accent)',
            margin: '22px auto 0',
            letterSpacing: '-0.03em'
          }}
        >
          Drop in your niche. AI builds the reel.
        </p>
      </div>
    </section>
  );
}
