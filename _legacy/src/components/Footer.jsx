import React from 'react';

export default function Footer({ onOpenStudio, onOpenApiGuide }) {
  return (
    <footer style={{ borderTop: '1px solid var(--hair)', padding: '60px 0 42px', background: 'var(--bg)' }}>
      <div className="wrap">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '44px',
            paddingBottom: '40px'
          }}
        >
          {/* Brand info */}
          <div style={{ maxWidth: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FF5C39 0%, #FF3815 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '2px',
                  padding: '4px'
                }}
              >
                <div style={{ width: '15px', height: '2.5px', borderRadius: '1px', background: '#FFF' }} />
                <div style={{ width: '10px', height: '2.5px', borderRadius: '1px', background: '#FFF', opacity: 0.8 }} />
                <div style={{ width: '6px', height: '2.5px', borderRadius: '1px', background: '#FFF', opacity: 0.6 }} />
              </div>
              <span className="display" style={{ fontSize: '18px', fontWeight: 700 }}>
                RankReels<span style={{ color: 'var(--accent)' }}>.ai</span>
              </span>
            </div>
            <p style={{ marginTop: '16px', color: 'var(--text-2)', fontSize: '13.5px', lineHeight: 1.65 }}>
              AI-assisted ranking-reel creation for marketers, founders, coaches, and creators.
              Zero filming days. 100% free client-side studio.
            </p>
          </div>

          {/* Product links */}
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFF', marginBottom: '16px' }}>
              Product
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: 'var(--text-2)' }}>
              <a href="#how" style={{ color: 'inherit', textDecoration: 'none' }}>How it Works</a>
              <a href="#catalogue" style={{ color: 'inherit', textDecoration: 'none' }}>Creator Catalogue</a>
              <a href="#skill-api" style={{ color: 'inherit', textDecoration: 'none' }}>Agent Skill + API</a>
              <a href="#benefits" style={{ color: 'inherit', textDecoration: 'none' }}>Benefits</a>
              <a href="#faq" style={{ color: 'inherit', textDecoration: 'none' }}>FAQ</a>
              <button
                onClick={onOpenStudio}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  padding: 0,
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600
                }}
              >
                Launch Studio App
              </button>
            </div>
          </div>

          {/* Technology & Integrations */}
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFF', marginBottom: '16px' }}>
              Integrations
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13.5px', color: 'var(--text-2)' }}>
              <span style={{ color: 'var(--text-2)' }}>Claude Code Skill</span>
              <span style={{ color: 'var(--text-2)' }}>Cursor &amp; Manus</span>
              <span style={{ color: 'var(--text-2)' }}>n8n Workflows</span>
              <span style={{ color: 'var(--text-2)' }}>Make &amp; Zapier Webhooks</span>
              <span style={{ color: 'var(--text-2)' }}>Web Speech &amp; Audio API</span>
            </div>
          </div>

          {/* Legal / Policy */}
          <div>
            <span style={{ display: 'block', fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#FFF', marginBottom: '16px' }}>
              Zero-Paid Architecture
            </span>
            <div style={{ fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.6 }}>
              <p style={{ marginBottom: '8px' }}>
                Runs 100% inside your browser using modern Web APIs.
              </p>
              <div
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--hair)',
                  color: 'var(--text-2)',
                  fontSize: '12px'
                }}
              >
                ✓ No credit card required<br />
                ✓ No third-party API tokens<br />
                ✓ Private local rendering
              </div>
            </div>
          </div>
        </div>

        {/* Bottom line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
            borderTop: '1px solid var(--hair)',
            paddingTop: '24px',
            flexWrap: 'wrap'
          }}
        >
          <div style={{ color: 'var(--text-3)', fontSize: '12px' }}>
            © 2026 RankReels. All rights reserved.
          </div>
          <p style={{ color: 'var(--text-3)', fontSize: '11.5px', maxWidth: '64ch', margin: 0, textAlign: 'right' }}>
            Results vary. RankReels does not guarantee views, engagement, or algorithm placement. Test hooks and rankings to find your audience fit.
          </p>
        </div>
      </div>
    </footer>
  );
}
