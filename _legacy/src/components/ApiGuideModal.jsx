import React, { useState } from 'react';
import { X, Terminal, Copy, Check, Code2, Bot, Layers } from 'lucide-react';

export default function ApiGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;
  const [activeTab, setActiveTab] = useState('agent');
  const [copied, setCopied] = useState(false);

  const agentSkillMd = `### RankReels Agent Skill (Claude Code, Cursor, Manus)

Prompt:
"You are a viral short-form video producer. Using the RankReels framework, generate a polarizing 9:16 ranking reel for the following niche:
- Niche: 'AI Developer Tools'
- Tone: 'Authoritative, punchy, contrarian'
- Format: S, A, B, C, D tiers with strong justifications
- Output: Return JSON with hook, items array, and viral CTA."

Input Parameters:
{
  "topic": "Top 5 AI Coding Tools for 2026",
  "niche": "Software & AI",
  "tiers": ["S", "A", "B", "C", "D"],
  "format": "vertical_9_16",
  "speech_engine": "web_speech_api"
}`;

  const pythonSnippet = `# rankreels_local.py - Free Local Ranking Generator
import json

def generate_ranking_reel(topic, items):
    payload = {
        "title": topic,
        "aspect_ratio": "9:16",
        "audio_engine": "client_web_audio",
        "items": items
    }
    print("🎬 Generated RankReel Config:")
    print(json.dumps(payload, indent=2))
    return payload

# Run locally with zero paid APIs
generate_ranking_reel("Top 5 SaaS Growth Tactics", [
    {"tier": "S", "name": "Founder Organic Video", "score": "9.9/10"},
    {"tier": "A", "name": "Targeted Outbound", "score": "8.8/10"},
    {"tier": "B", "name": "SEO Topic Clusters", "score": "7.5/10"},
    {"tier": "C", "name": "Meta Retargeting", "score": "6.0/10"},
    {"tier": "D", "name": "Spam Cold Email", "score": "2.1/10"}
])`;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        background: 'rgba(5, 5, 7, 0.88)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '780px',
          background: 'var(--tile)',
          border: '1px solid var(--hair-2)',
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 30px 90px rgba(0,0,0,0.85)'
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--hair)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10,10,12,0.6)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Terminal size={18} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: 'Inter Tight', fontWeight: 700, fontSize: '17px', color: '#FFF' }}>
              RankReels Agent Skill &amp; API Guide
            </span>
          </div>

          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--hair)',
              color: 'var(--text-2)',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--hair)', display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveTab('agent')}
            className={`btn sm ${activeTab === 'agent' ? 'btn-accent' : 'btn-secondary'}`}
          >
            <Bot size={13} />
            <span>Agent Skill (Claude / Cursor)</span>
          </button>
          <button
            onClick={() => setActiveTab('python')}
            className={`btn sm ${activeTab === 'python' ? 'btn-accent' : 'btn-secondary'}`}
          >
            <Code2 size={13} />
            <span>Local Python / CLI</span>
          </button>
        </div>

        {/* Code Content */}
        <div style={{ padding: '24px', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '34px', right: '36px' }}>
            <button
              onClick={() => copyToClipboard(activeTab === 'agent' ? agentSkillMd : pythonSnippet)}
              className="btn btn-secondary sm"
              style={{ fontSize: '12px' }}
            >
              {copied ? <Check size={12} style={{ color: '#10B981' }} /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
          </div>

          <pre
            style={{
              fontFamily: 'monospace',
              fontSize: '13px',
              color: '#FF8A72',
              background: '#09090C',
              padding: '18px',
              borderRadius: '12px',
              border: '1px solid var(--hair)',
              overflowX: 'auto',
              maxHeight: '360px',
              lineHeight: 1.55
            }}
          >
            {activeTab === 'agent' ? agentSkillMd : pythonSnippet}
          </pre>

          <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-3)', lineHeight: 1.5 }}>
            💡 Zero paid APIs required. You can generate ranking reel schemas locally and feed them right into the in-browser Studio for instant client-side rendering.
          </p>
        </div>
      </div>
    </div>
  );
}
