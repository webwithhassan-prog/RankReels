import React, { useState } from 'react';
import { FAQS } from '../data/mockData';
import { Plus } from 'lucide-react';

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <section id="faq" style={{ padding: '80px 0 100px' }}>
      <div className="wrap">
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="lab">FAQs</span>
          <h2 className="display" style={{ fontSize: 'clamp(28px, 4vw, 48px)', maxWidth: '24ch', margin: '0 auto' }}>
            Before you create your first ranking reel
          </h2>
        </div>

        <div style={{ maxWidth: '740px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.q}
                style={{
                  borderRadius: '14px',
                  border: `1px solid ${isOpen ? 'var(--hair-2)' : 'var(--hair)'}`,
                  background: isOpen ? 'var(--surface)' : 'var(--tile)',
                  overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                }}
              >
                {/* Question */}
                <button
                  onClick={() => toggleFaq(idx)}
                  style={{
                    width: '100%',
                    padding: '20px 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFF',
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'Inter Tight',
                    fontWeight: 600,
                    fontSize: '16.5px',
                    letterSpacing: '-0.01em'
                  }}
                >
                  <span>{faq.q}</span>
                  <span
                    style={{
                      transform: isOpen ? 'rotate(45deg)' : 'none',
                      transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                      color: isOpen ? 'var(--accent)' : 'var(--text-3)',
                      display: 'grid',
                      placeItems: 'center',
                      flexShrink: 0
                    }}
                  >
                    <Plus size={20} />
                  </span>
                </button>

                {/* Answer */}
                {isOpen && (
                  <div
                    style={{
                      padding: '0 24px 22px',
                      color: 'var(--text-2)',
                      fontSize: '15px',
                      lineHeight: 1.65,
                      animation: 'floatBob 0.3s ease-out'
                    }}
                  >
                    <p style={{ margin: 0 }}>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
