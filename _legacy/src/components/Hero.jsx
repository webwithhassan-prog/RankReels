import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Sparkles, ArrowRight, Wand2, Layers, Video, Bot, Shuffle } from 'lucide-react';
import { PRESET_REELS } from '../data/mockData';
import { startProceduralBeat, stopProceduralBeat, playTierSlamSound, playChimeSound } from '../utils/audioEngine';

export default function Hero({ onOpenStudio }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [heroReelIndex, setHeroReelIndex] = useState(0);
  const [activeItemIndex, setActiveItemIndex] = useState(0);
  const sampleReel = PRESET_REELS[heroReelIndex];

  const handleShuffleHero = () => {
    setHeroReelIndex((prev) => (prev + 1) % PRESET_REELS.length);
    setActiveItemIndex(0);
    playChimeSound();
  };

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setActiveItemIndex((prev) => {
          const next = (prev + 1) % sampleReel.items.length;
          if (next === 0) {
            playChimeSound();
          } else {
            playTierSlamSound();
          }
          return next;
        });
      }, 2600);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, sampleReel.items.length]);

  const togglePlayback = () => {
    if (!isPlaying) {
      setIsPlaying(true);
      if (!isMuted) {
        startProceduralBeat(94);
      }
      playChimeSound();
    } else {
      setIsPlaying(false);
      stopProceduralBeat();
    }
  };

  const toggleSound = (e) => {
    e.stopPropagation();
    if (isMuted) {
      setIsMuted(false);
      if (isPlaying) {
        startProceduralBeat(94);
      }
    } else {
      setIsMuted(true);
      stopProceduralBeat();
    }
  };

  return (
    <section
      style={{
        position: 'relative',
        paddingTop: '124px',
        paddingBottom: '64px',
        textAlign: 'center',
        overflow: 'hidden'
      }}
    >
      <div className="bg-grid" />

      {/* Top ambient radial glow */}
      <div
        style={{
          position: 'absolute',
          top: '-12%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '740px',
          height: '420px',
          background: 'radial-gradient(ellipse at center, rgba(99, 102, 241, 0.18) 0%, rgba(99, 102, 241, 0) 70%)',
          pointerEvents: 'none',
          zIndex: 0
        }}
      />

      <div className="wrap">
        {/* Audience Pill */}
        <div style={{ marginBottom: '20px' }}>
          <span className="lab" style={{ marginBottom: 0 }}>
            For Coaches, Marketers, Founders &amp; Creators
          </span>
        </div>

        {/* Hero Title */}
        <h1
          className="display"
          style={{
            fontSize: 'clamp(36px, 5.2vw, 66px)',
            maxWidth: '1000px',
            margin: '0 auto',
            letterSpacing: '-0.03em'
          }}
        >
          Ranking reels that <span style={{ color: 'var(--accent-light)' }}>blow up.</span>
          <br />
          Made for you without filming
        </h1>

        {/* Lede copy */}
        <p
          style={{
            color: 'var(--text-2)',
            fontSize: 'clamp(15.5px, 1.25vw, 18px)',
            maxWidth: '720px',
            margin: '20px auto 0',
            lineHeight: 1.65,
            textWrap: 'balance'
          }}
        >
          Turn your ideas into ready-to-post ranking reels using video, your voice, and your brand.{' '}
          <strong style={{ color: '#E2E8F0', fontWeight: 600 }}>
            Choose what to rank, approve the script, and let your Digital Twin handle the production.
          </strong>
        </p>

        {/* Deal announcement */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            margin: '24px auto 0',
            padding: '7px 18px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--hair-2)',
            fontSize: '13px',
            fontWeight: 600
          }}
        >
          <span style={{ color: 'var(--text)' }}>Create unlimited ranking reels</span>
          <span style={{ color: 'var(--text-3)' }}>·</span>
          <span style={{ color: 'var(--accent-light)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Sparkles size={13} /> 100% Free Client-Side Studio (Zero Paid APIs)
          </span>
        </div>

        {/* CTA Buttons */}
        <div
          style={{
            marginTop: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          <button
            onClick={onOpenStudio}
            className="btn btn-primary lg"
            style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Wand2 size={17} style={{ color: 'var(--accent)' }} />
            <span>Create Your First Reel</span>
            <ArrowRight size={15} />
          </button>

          <button
            onClick={togglePlayback}
            className="btn btn-secondary lg"
            style={{ fontWeight: 500 }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} fill="currentColor" />}
            <span>{isPlaying ? 'Pause Demo' : 'Watch Live Reel'}</span>
          </button>

          <button
            onClick={handleShuffleHero}
            className="btn btn-secondary lg"
            style={{ fontWeight: 500, borderColor: 'var(--hair-accent)' }}
            title="Shuffle to another video ranking preset"
          >
            <Shuffle size={16} style={{ color: 'var(--accent-light)' }} />
            <span>Shuffle Video</span>
          </button>
        </div>

        {/* Interactive 3D Deck */}
        <div className="hero-deck-wrap">
          <div className="hero-deck">
            {/* Left Card: 5 B2B Growth Engines */}
            <div className="hero-card left" onClick={togglePlayback}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(180deg, #111116 0%, #08080B 100%)',
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <img
                      src={PRESET_REELS[1].creator.avatar}
                      alt="creator"
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>Elena Rostova</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-3)' }}>@elena.growth</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, textAlign: 'left', lineHeight: 1.3 }}>
                    Ranking 5 B2B Engines to $100K MRR
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 'auto 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                    <span className="tier-s" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '12px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>S</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Founder Video</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                    <span className="tier-a" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '12px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>A</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Account-Based Outbound</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(14, 165, 233, 0.15)', border: '1px solid rgba(14, 165, 233, 0.4)' }}>
                    <span className="tier-b" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '12px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>B</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>SEO Topic Clusters</span>
                  </div>
                </div>

                <div style={{ fontSize: '9px', color: 'var(--text-3)', textAlign: 'center' }}>
                  Tap to preview
                </div>
              </div>
            </div>

            {/* Middle Live Card: Interactive Live 9:16 Video Player */}
            <div className="hero-card mid" onClick={togglePlayback}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(180deg, #14141A 0%, #0A0A0E 60%, #050507 100%)',
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: 'inset 0 0 0 1px rgba(255, 255, 255, 0.1)'
                }}
              >
                {/* Reel Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ position: 'relative' }}>
                      <img
                        src={sampleReel.creator.avatar}
                        alt="creator"
                        style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--accent)' }}
                      />
                      {isPlaying && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: -1,
                            right: -1,
                            width: '9px',
                            height: '9px',
                            borderRadius: '50%',
                            background: '#10B981',
                            border: '1.5px solid #000'
                          }}
                        />
                      )}
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFFFFF' }}>{sampleReel.creator.name}</div>
                      <div style={{ fontSize: '9.5px', color: 'var(--text-2)' }}>{sampleReel.creator.handle}</div>
                    </div>
                  </div>

                  {/* Sound button */}
                  <button
                    onClick={toggleSound}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid var(--hair-2)',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#FFF',
                      cursor: 'pointer'
                    }}
                    title={isMuted ? 'Turn on sound' : 'Mute sound'}
                  >
                    {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} style={{ color: 'var(--accent-light)' }} />}
                  </button>
                </div>

                {/* Main Video Animation Area */}
                <div style={{ textAlign: 'center', margin: 'auto 0', width: '100%' }}>
                  {/* Topic badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '4px 10px',
                      borderRadius: '999px',
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--hair-accent)',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--accent-light)',
                      marginBottom: '10px'
                    }}
                  >
                    <Layers size={11} /> 2026 AI STACK
                  </div>

                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: '#FFFFFF',
                      lineHeight: 1.25,
                      textTransform: 'uppercase',
                      letterSpacing: '-0.02em',
                      marginBottom: '16px'
                    }}
                  >
                    {sampleReel.title}
                  </div>

                  {/* Animated Active Tier Highlight */}
                  <div
                    style={{
                      background: 'rgba(10, 10, 14, 0.85)',
                      border: '1px solid var(--hair-2)',
                      borderRadius: '14px',
                      padding: '12px 14px',
                      textAlign: 'left',
                      boxShadow: '0 10px 24px rgba(0, 0, 0, 0.5)',
                      transform: isPlaying ? 'scale(1.02)' : 'none',
                      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          className={`tier-${sampleReel.items[activeItemIndex].tier.toLowerCase()}`}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '6px',
                            fontSize: '14px',
                            fontWeight: 900,
                            display: 'grid',
                            placeItems: 'center'
                          }}
                        >
                          {sampleReel.items[activeItemIndex].tier}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                          {sampleReel.items[activeItemIndex].name}
                        </span>
                      </div>
                      <span style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--accent-light)' }}>
                        {sampleReel.items[activeItemIndex].score}
                      </span>
                    </div>

                    <p style={{ fontSize: '11.5px', color: 'var(--text-2)', lineHeight: 1.4, margin: 0 }}>
                      "{sampleReel.items[activeItemIndex].reasoning}"
                    </p>
                  </div>

                  {/* Subtitle box */}
                  <div
                    style={{
                      marginTop: '16px',
                      padding: '6px 10px',
                      borderRadius: '8px',
                      background: 'rgba(0, 0, 0, 0.75)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#FFFFFF'
                    }}
                  >
                    <span style={{ color: 'var(--accent-light)' }}>S-TIER:</span> "{sampleReel.items[activeItemIndex].name} wins without debate."
                  </div>
                </div>

                {/* Bottom Live Controls */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: isPlaying ? 'var(--accent)' : 'var(--text-3)',
                        boxShadow: isPlaying ? '0 0 8px var(--accent)' : 'none'
                      }}
                    />
                    <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-3)' }}>
                      {isPlaying ? 'PLAYING PREVIEW' : 'CLICK TO PLAY'}
                    </span>
                  </div>

                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#FFF',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px var(--accent-glow)'
                    }}
                  >
                    {isPlaying ? <Pause size={14} fill="#FFF" /> : <Play size={14} fill="#FFF" style={{ marginLeft: '2px' }} />}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: 5 Fat Loss Diets */}
            <div className="hero-card right" onClick={togglePlayback}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(180deg, #111116 0%, #08080B 100%)',
                  padding: '18px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <img
                      src={PRESET_REELS[4].creator.avatar}
                      alt="creator"
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text)' }}>David Miller</div>
                      <div style={{ fontSize: '9px', color: 'var(--text-3)' }}>@miller.physique</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, textAlign: 'left', lineHeight: 1.3 }}>
                    Ranking 5 Fat Loss Diets for Busy Founders
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: 'auto 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)' }}>
                    <span className="tier-s" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '12px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>S</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>High-Protein Tracking</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
                    <span className="tier-a" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '12px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>A</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Mediterranean Foods</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '8px', background: 'rgba(100, 116, 139, 0.15)', border: '1px solid rgba(100, 116, 139, 0.4)' }}>
                    <span className="tier-d" style={{ width: '22px', height: '22px', borderRadius: '5px', fontSize: '12px', fontWeight: 900, display: 'grid', placeItems: 'center' }}>D</span>
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>Juice Detox Cleanses</span>
                  </div>
                </div>

                <div style={{ fontSize: '9px', color: 'var(--text-3)', textAlign: 'center' }}>
                  Tap to preview
                </div>
              </div>
            </div>
          </div>

          {/* Handwritten Annotations around the deck */}
          <div
            style={{
              position: 'relative',
              maxWidth: '860px',
              margin: '28px auto 0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                <path d="M4 14 C 6 8, 12 6, 18 8" strokeLinecap="round" />
                <path d="M14 6 L 19 8 L 16 13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-hand" style={{ color: 'var(--text-2)', fontSize: '20px' }}>
                Scripted, voiced &amp; edited by AI
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                <path d="M12 20 C 12 14, 12 8, 12 4" strokeLinecap="round" />
                <path d="M8 8 L 12 4 L 16 8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-hand" style={{ color: 'var(--accent-light)', fontSize: '22px' }}>
                Your Digital Twin, not another camera day
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="2">
                <path d="M20 14 C 18 8, 12 6, 6 8" strokeLinecap="round" />
                <path d="M10 6 L 5 8 L 8 13" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-hand" style={{ color: 'var(--text-2)', fontSize: '20px' }}>
                Your point of view in every reel
              </span>
            </div>
          </div>
        </div>

        {/* Proof Line */}
        <div style={{ marginTop: '36px', textAlign: 'center' }}>
          <p style={{ fontSize: '14px', color: 'var(--text-3)', fontWeight: 500 }}>
            <em style={{ fontStyle: 'normal', color: 'var(--text-2)', fontWeight: 600 }}>Made with RankReels.</em>{' '}
            One topic in. A finished vertical ranking reel out.
          </p>
        </div>
      </div>
    </section>
  );
}
