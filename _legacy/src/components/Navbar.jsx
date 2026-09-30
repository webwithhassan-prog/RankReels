import React, { useState, useEffect } from 'react';
import { Sparkles, Wand2, Play, Code2, Video, Bot } from 'lucide-react';

export default function Navbar({ onOpenStudio, onOpenApiGuide }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        backdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
        WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'blur(8px)',
        background: scrolled ? 'rgba(7, 7, 9, 0.88)' : 'rgba(7, 7, 9, 0.45)',
        borderBottom: `1px solid ${scrolled ? 'var(--hair-2)' : 'var(--hair)'}`,
      }}
    >
      <div className="wrap" style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Brand Logo */}
        <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '11px', textDecoration: 'none' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '2.5px',
              boxShadow: '0 4px 14px var(--accent-glow)',
              padding: '5px'
            }}
          >
            <div style={{ width: '18px', height: '2.5px', borderRadius: '1.5px', background: '#FFFFFF', opacity: 0.95 }} />
            <div style={{ width: '13px', height: '2.5px', borderRadius: '1.5px', background: '#FFFFFF', opacity: 0.8 }} />
            <div style={{ width: '8px', height: '2.5px', borderRadius: '1.5px', background: '#FFFFFF', opacity: 0.65 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span
              className="display"
              style={{
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
                lineHeight: 1.1
              }}
            >
              RankReels<span style={{ color: 'var(--accent-light)' }}>.ai</span>
            </span>
          </div>
        </a>

        {/* Center Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
            fontSize: '13.5px',
            fontWeight: 500,
            color: 'var(--text-2)'
          }}
          className="desktop-nav"
        >
          <a href="#how" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text)'} onMouseLeave={e => e.target.style.color = 'inherit'}>
            How it Works
          </a>
          <a href="#catalogue" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text)'} onMouseLeave={e => e.target.style.color = 'inherit'}>
            Catalogue
          </a>
          <a href="#skill-api" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text)'} onMouseLeave={e => e.target.style.color = 'inherit'}>
            Agent Skill + API
          </a>
          <a href="#benefits" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text)'} onMouseLeave={e => e.target.style.color = 'inherit'}>
            Benefits
          </a>
          <a href="#faq" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.target.style.color = 'var(--text)'} onMouseLeave={e => e.target.style.color = 'inherit'}>
            FAQ
          </a>
        </nav>

        {/* Right CTA Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onOpenApiGuide}
            className="btn btn-secondary sm"
            style={{ fontSize: '12.5px', padding: '7px 13px' }}
            title="Inspect Agent Skill & API"
          >
            <Bot size={14} style={{ color: 'var(--accent-light)' }} />
            <span>AI Skill</span>
          </button>

          <button
            onClick={onOpenStudio}
            className="btn btn-accent sm"
            style={{ fontSize: '13px', padding: '8px 18px', fontWeight: 600 }}
          >
            <Wand2 size={14} />
            <span>Create a Reel</span>
          </button>
        </div>
      </div>
    </header>
  );
}
