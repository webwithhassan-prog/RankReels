import React, { useState } from 'react';
import { Bot, Terminal, Copy, Check, Sparkles, ExternalLink, Code2, Cpu } from 'lucide-react';

export default function SkillApiSection({ onOpenStudio }) {
  const [copied, setCopied] = useState(false);
  const [showCode, setShowCode] = useState(false);

  const sampleAgentPrompt = `/rankreel topic="5 Best AI Coding Assistants for 2026"
--niche="Software Engineering"
--ranking="S: Cursor IDE, A: Claude Code, B: Copilot, C: ChatGPT, D: Tabnine"
--avatar="alex_founder.png"
--output="vertical_mp4"`;

  const copyPrompt = () => {
    navigator.clipboard.writeText(sampleAgentPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="skill-api" style={{ padding: '80px 0', scrollMarginTop: '88px' }}>
      <div className="wrap">
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: '28px',
            padding: '48px 44px',
            border: '1px solid var(--hair-2)',
            background: `
              radial-gradient(circle at 10% 0%, rgba(255, 92, 57, 0.12), transparent 35%),
              radial-gradient(circle at 94% 100%, rgba(108, 71, 255, 0.1), transparent 35%),
              var(--tile)
            `
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: '32px',
              flexWrap: 'wrap',
              borderBottom: '1px solid var(--hair)',
              paddingBottom: '32px'
            }}
          >
            <div>
              <span className="lab" style={{ marginBottom: '10px' }}>RankReels for Agents</span>
              <h2 className="display" style={{ fontSize: 'clamp(28px, 3.8vw, 44px)', maxWidth: '20ch', margin: 0 }}>
                Create reels from chat or your stack.
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowCode(!showCode)}
                className="btn btn-secondary sm"
              >
                <Code2 size={15} />
                <span>{showCode ? 'Hide Schema' : 'Inspect Agent Skill'}</span>
              </button>
              <button onClick={onOpenStudio} className="btn btn-accent sm">
                <Sparkles size={15} />
                <span>Start Creating</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '40px',
              marginTop: '36px'
            }}
          >
            {/* Card 1: Agent Skill */}
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Agent Skill &amp; MCP
              </span>
              <h3 className="display" style={{ fontSize: '24px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
                Ask for a reel.
              </h3>
              <p style={{ color: 'var(--text-2)', fontSize: '14.5px', lineHeight: 1.6, maxWidth: '36ch' }}>
                Brief your AI agent directly in terminal or chat. RankReels takes the topic and generates the complete tier script &amp; video.
              </p>

              {/* Logos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--hair)', fontSize: '12.5px', fontWeight: 600 }}>
                  <Terminal size={14} style={{ color: '#D97757' }} />
                  <span>Claude Code</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--hair)', fontSize: '12.5px', fontWeight: 600 }}>
                  <Bot size={14} style={{ color: '#3B82F6' }} />
                  <span>Manus / Cursor</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--hair)', fontSize: '12.5px', fontWeight: 600 }}>
                  <Cpu size={14} style={{ color: '#10B981' }} />
                  <span>Perplexity</span>
                </div>
              </div>
            </div>

            {/* Card 2: Developer API */}
            <div style={{ borderLeft: '1px solid var(--hair)', paddingLeft: '32px' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-3)' }}>
                Developer API &amp; Webhooks
              </span>
              <h3 className="display" style={{ fontSize: '24px', fontWeight: 600, marginTop: '12px', marginBottom: '8px' }}>
                Automate reel production.
              </h3>
              <p style={{ color: 'var(--text-2)', fontSize: '14.5px', lineHeight: 1.6, maxWidth: '36ch' }}>
                Plug into your automated content pipeline. Batch-create and download reels using n8n, Make, or custom python scripts.
              </p>

              {/* Logos */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--hair)', fontSize: '12.5px', fontWeight: 600 }}>
                  <span style={{ color: '#EA4B71', fontWeight: 800 }}>n8n</span>
                  <span>Workflows</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--hair)', fontSize: '12.5px', fontWeight: 600 }}>
                  <span style={{ color: '#6D00CC', fontWeight: 800 }}>Make</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--hair)', fontSize: '12.5px', fontWeight: 600 }}>
                  <span style={{ color: '#FF4F00', fontWeight: 800 }}>Zapier</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Agent Skill Inspector Drawer */}
          {showCode && (
            <div
              style={{
                marginTop: '36px',
                padding: '20px',
                borderRadius: '16px',
                background: '#09090C',
                border: '1px solid var(--hair-2)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 600, color: 'var(--text)' }}>
                  <Terminal size={14} style={{ color: 'var(--accent)' }} />
                  <span>Agent Prompt / MCP Slash Command</span>
                </div>
                <button
                  onClick={copyPrompt}
                  className="btn btn-secondary sm"
                  style={{ fontSize: '12px', padding: '5px 12px' }}
                >
                  {copied ? <Check size={13} style={{ color: '#10B981' }} /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Command'}</span>
                </button>
              </div>

              <pre
                style={{
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: '#FF8A72',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '14px',
                  borderRadius: '10px',
                  overflowX: 'auto',
                  lineHeight: 1.5
                }}
              >
                {sampleAgentPrompt}
              </pre>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
