import React from 'react';
import { Check, ArrowRight, UserCheck, Mic, Sparkles, Layers, Play } from 'lucide-react';
import { PRESET_REELS } from '../data/mockData';

export default function ScaleProof({ onOpenStudio }) {
  const steps = [
    { name: 'Scripting', detail: 'Your angle & hot take' },
    { name: 'Storyboard', detail: 'Tier structure & pacing' },
    { name: 'Voiceovers', detail: 'Your cloned timbre' },
    { name: 'Talking Head', detail: 'Your Digital Twin' },
    { name: 'B-roll & Visuals', detail: 'On brand & dynamic' },
    { name: 'Editing & Captions', detail: 'Karaoke word sync' },
    { name: 'Rendering', detail: '1080×1920 Vertical MP4' }
  ];

  return (
    <section
      id="scale"
      style={{
        padding: '100px 0',
        borderTop: '1px solid var(--hair)',
        borderBottom: '1px solid var(--hair)',
        background: 'rgba(13, 13, 15, 0.4)'
      }}
    >
      <div className="wrap">
        {/* Top Grid: Scale copy + Done List */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
            gap: '56px',
            alignItems: 'center'
          }}
        >
          <div>
            <span className="lab" style={{ textAlign: 'left', marginBottom: '14px' }}>
              One setup. Your entire reel engine.
            </span>
            <h2
              className="display"
              style={{
                fontSize: 'clamp(32px, 4.4vw, 54px)',
                lineHeight: 1.15,
                marginBottom: '20px'
              }}
            >
              Your ideas. Your identity.{' '}
              <span style={{ color: 'var(--accent)' }}>Every production step handled.</span>
            </h2>
            <p
              style={{
                color: 'var(--text-2)',
                fontSize: '18px',
                fontWeight: 500,
                letterSpacing: '-0.01em',
                lineHeight: 1.5,
                marginBottom: '14px'
              }}
            >
              No filming crew. No editing timeline. No starting from zero.
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: '14px', lineHeight: 1.6, maxWidth: '42ch' }}>
              RankReels keeps your face, voice, style, and brand consistent while every topic gives you a fresh reason to post.
            </p>
          </div>

          {/* Done List card */}
          <div
            className="glass-tile"
            style={{
              padding: '16px 24px',
              border: '1px solid var(--hair-2)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            {steps.map((step, idx) => (
              <div
                key={step.name}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '13px 0',
                  borderBottom: idx < steps.length - 1 ? '1px solid var(--hair)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span style={{ fontFamily: 'Inter Tight', fontWeight: 600, fontSize: '15.5px' }}>
                    {step.name}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-3)', fontWeight: 400 }}>
                    {step.detail}
                  </span>
                </div>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    color: 'var(--text-2)'
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: 'rgba(255, 92, 57, 0.15)',
                      color: 'var(--accent)',
                      display: 'grid',
                      placeItems: 'center'
                    }}
                  >
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <span>Done</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom IO Block */}
        <div style={{ marginTop: '100px', paddingTop: '80px', borderTop: '1px solid var(--hair)' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <span className="lab">Set it once. Keep creating.</span>
            <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)', maxWidth: '22ch', margin: '0 auto' }}>
              Your ideas in. Ranking reels out.
            </h2>
            <p
              style={{
                color: 'var(--text-2)',
                fontSize: '16px',
                maxWidth: '54ch',
                margin: '14px auto 0',
                lineHeight: 1.6
              }}
            >
              Give RankReels the ingredients that make the content yours. Change the topic, ranking, or opinion. Keep the identity your audience recognizes.
            </p>
          </div>

          {/* Interactive IO Stage Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '32px',
              alignItems: 'center'
            }}
          >
            {/* Identity Card */}
            <div
              className="glass-tile"
              style={{
                padding: '24px',
                border: '1px solid var(--hair-2)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '18px', borderBottom: '1px solid var(--hair)' }}>
                <img
                  src={PRESET_REELS[0].creator.avatar}
                  alt="avatar"
                  style={{ width: '56px', height: '56px', borderRadius: '16px', objectFit: 'cover', border: '1px solid var(--hair-2)' }}
                />
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600 }}>
                    Your Creator Profile
                  </div>
                  <div style={{ fontFamily: 'Inter Tight', fontWeight: 700, fontSize: '16px', color: '#FFF' }}>
                    Alex Rivera (Ready)
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hair)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
                    <UserCheck size={15} style={{ color: 'var(--accent)' }} />
                    <span>Photo / Face Identity</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Added</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--hair)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
                    <Mic size={15} style={{ color: 'var(--accent)' }} />
                    <span>Voice Timbre</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Cloned</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-2)' }}>
                    <Sparkles size={15} style={{ color: 'var(--accent)' }} />
                    <span>Brand Kit &amp; Tone</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Saved</span>
                </div>
              </div>
            </div>

            {/* Generated 4 Reel Fan Stack */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '16px' }}>
                Four ready-to-post ranking reels
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '12px',
                  flexWrap: 'wrap'
                }}
              >
                {PRESET_REELS.slice(0, 4).map((reel, i) => (
                  <div
                    key={reel.id}
                    onClick={onOpenStudio}
                    style={{
                      width: '130px',
                      height: '210px',
                      borderRadius: '16px',
                      background: '#121216',
                      border: '1px solid var(--hair-2)',
                      padding: '12px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      boxShadow: '0 14px 30px rgba(0,0,0,0.5)',
                      transform: `rotate(${(i - 1.5) * 4}deg)`,
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-10px) scale(1.06)';
                      e.currentTarget.style.borderColor = 'var(--accent)';
                      e.currentTarget.style.zIndex = '5';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = `rotate(${(i - 1.5) * 4}deg)`;
                      e.currentTarget.style.borderColor = 'var(--hair-2)';
                      e.currentTarget.style.zIndex = '1';
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '9px', fontWeight: 800, color: 'var(--accent)' }}>0{i + 1}</span>
                      <span className="tier-s" style={{ fontSize: '8.5px', fontWeight: 900, padding: '1px 4px', borderRadius: '3px' }}>S</span>
                    </div>

                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '10.5px', fontWeight: 700, color: '#FFF', lineHeight: 1.25 }}>
                        {reel.title}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div
                        style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.1)',
                          display: 'grid',
                          placeItems: 'center',
                          color: '#FFF'
                        }}
                      >
                        <Play size={11} fill="#FFF" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ marginTop: '18px', color: 'var(--text-2)', fontSize: '13.5px' }}>
                One identity. Four angles. One recognizable series.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
