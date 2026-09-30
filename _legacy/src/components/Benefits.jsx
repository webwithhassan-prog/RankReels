import React from 'react';
import { CameraOff, Clock, Sliders, TrendingUp, Award, UserCheck, Palette, ShieldCheck } from 'lucide-react';

export default function Benefits() {
  const benefits = [
    {
      icon: CameraOff,
      title: 'Skip the Filming Day',
      desc: 'Your Digital Twin delivers the script, so another camera session never blocks the next reel.'
    },
    {
      icon: Clock,
      title: 'Publish Without Burning Out',
      desc: 'Turn new ideas into finished ranking reels without repeating the entire production routine every time.'
    },
    {
      icon: Sliders,
      title: 'Stay in Control',
      desc: 'Review the script, preview the reel, and change individual assets before you publish the final video.'
    },
    {
      icon: TrendingUp,
      title: 'The Algorithm Rewards This',
      desc: 'Ranking reels travel. The algorithm pushes them to strangers and rewards comment controversy.'
    },
    {
      icon: Award,
      title: 'Instant Authority',
      desc: 'You call S-tier and D-tier. That reads as deep domain expertise, and expertise sells.'
    },
    {
      icon: UserCheck,
      title: "Trust That Faceless Can't Buy",
      desc: 'Your face and your voice on every reel. People buy from people, not generic AI stock channels.'
    },
    {
      icon: Palette,
      title: 'Every Reel, Unmistakably You',
      desc: 'Set your colors, handle, and visual tone once. They show up consistently in every frame.'
    },
    {
      icon: ShieldCheck,
      title: 'Zero Paid Subscriptions Needed',
      desc: 'Free client-side rendering with Web Speech and HTML5 canvas. 100% free forever.'
    }
  ];

  return (
    <section id="benefits" style={{ padding: '80px 0', position: 'relative' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: '52px' }}>
          <span className="lab">What you get back</span>
          <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)', maxWidth: '24ch', margin: '0 auto' }}>
            More content. Less production work.
          </h2>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '20px',
            maxWidth: '1020px',
            margin: '0 auto'
          }}
        >
          {benefits.map((b) => {
            const Icon = b.icon;
            return (
              <div
                key={b.title}
                className="glass-tile"
                style={{
                  padding: '24px 22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255, 92, 57, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--hair)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(255, 92, 57, 0.1)',
                    border: '1px solid rgba(255, 92, 57, 0.25)',
                    display: 'grid',
                    placeItems: 'center',
                    color: 'var(--accent)'
                  }}
                >
                  <Icon size={20} />
                </div>

                <h4 style={{ fontFamily: 'Inter Tight', fontWeight: 600, fontSize: '16px', letterSpacing: '-0.01em' }}>
                  {b.title}
                </h4>

                <p style={{ color: 'var(--text-2)', fontSize: '13.5px', lineHeight: 1.6, margin: 0 }}>
                  {b.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
