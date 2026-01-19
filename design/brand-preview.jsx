import React, { useState } from 'react';

const SurfacedBrandPreview = () => {
  const [darkMode, setDarkMode] = useState(false);
  
  // Logo Icon Component
  const LogoIcon = ({ size = 64 }) => (
    <svg viewBox="0 0 64 64" width={size} height={size}>
      <defs>
        <linearGradient id="surfaceGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0EA5E9"/>
          <stop offset="100%" stopColor="#38BDF8"/>
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="#0A1628"/>
      <path d="M10 46 Q20 38 32 38 Q44 38 54 46 Q44 30 32 30 Q20 30 10 46 Z" 
            fill="url(#surfaceGrad)" opacity="0.3"/>
      <path d="M8 40 Q18 28 32 28 Q46 28 56 40 Q46 20 32 20 Q18 20 8 40 Z" 
            fill="url(#surfaceGrad)" opacity="0.5"/>
      <path d="M6 34 Q16 18 32 18 Q48 18 58 34 Q48 12 32 12 Q16 12 6 34 Z" 
            fill="url(#surfaceGrad)"/>
      <circle cx="32" cy="16" r="4" fill="#38BDF8"/>
      <ellipse cx="24" cy="20" rx="3" ry="1.5" fill="#FFFFFF" opacity="0.3"/>
    </svg>
  );

  // Full Logo Component
  const FullLogo = ({ dark = false, height = 50 }) => (
    <svg viewBox="0 0 320 80" height={height}>
      <defs>
        <linearGradient id="surfaceGradFull" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0EA5E9"/>
          <stop offset="100%" stopColor="#38BDF8"/>
        </linearGradient>
      </defs>
      <g transform="translate(8, 8)">
        <rect width="64" height="64" rx="14" fill="#0A1628"/>
        <path d="M10 46 Q20 38 32 38 Q44 38 54 46 Q44 30 32 30 Q20 30 10 46 Z" 
              fill="url(#surfaceGradFull)" opacity="0.3"/>
        <path d="M8 40 Q18 28 32 28 Q46 28 56 40 Q46 20 32 20 Q18 20 8 40 Z" 
              fill="url(#surfaceGradFull)" opacity="0.5"/>
        <path d="M6 34 Q16 18 32 18 Q48 18 58 34 Q48 12 32 12 Q16 12 6 34 Z" 
              fill="url(#surfaceGradFull)"/>
        <circle cx="32" cy="16" r="4" fill="#38BDF8"/>
      </g>
      <text x="92" y="52" 
            fontFamily="system-ui, sans-serif" 
            fontSize="36" 
            fontWeight="600" 
            fill={dark ? "#F0F9FF" : "#0A1628"}
            style={{ letterSpacing: '-0.02em' }}>
        surfaced
      </text>
    </svg>
  );

  const colors = [
    { name: 'Deep Ocean', hex: '#0A1628', usage: 'Backgrounds, text' },
    { name: 'Surface Blue', hex: '#0EA5E9', usage: 'Primary accent, CTAs' },
    { name: 'Bright Surface', hex: '#38BDF8', usage: 'Highlights, hover' },
    { name: 'Foam White', hex: '#F0F9FF', usage: 'Light backgrounds' },
    { name: 'Pearl', hex: '#E0F2FE', usage: 'Cards, borders' },
    { name: 'Slate', hex: '#64748B', usage: 'Secondary text' },
  ];

  const accents = [
    { name: 'Success', hex: '#10B981' },
    { name: 'Warning', hex: '#F59E0B' },
    { name: 'Error', hex: '#EF4444' },
  ];

  return (
    <div style={{ 
      fontFamily: 'system-ui, sans-serif',
      background: darkMode ? '#0A1628' : '#F0F9FF',
      minHeight: '100vh',
      padding: '32px',
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '48px'
      }}>
        <h1 style={{ 
          color: darkMode ? '#F0F9FF' : '#0A1628',
          fontSize: '28px',
          fontWeight: '700',
          margin: 0
        }}>
          🌊 Surfaced Brand Guidelines
        </h1>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '8px',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {/* Logo Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          color: darkMode ? '#F0F9FF' : '#0A1628',
          fontSize: '20px',
          marginBottom: '24px'
        }}>
          Logo
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {/* Icon Only */}
          <div style={{
            background: darkMode ? '#1E293B' : 'white',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '16px',
            boxShadow: '0 4px 24px rgba(10, 22, 40, 0.1)'
          }}>
            <LogoIcon size={120} />
            <span style={{ color: darkMode ? '#94A3B8' : '#64748B', fontSize: '14px' }}>
              Icon (Favicon / App Icon)
            </span>
          </div>
          
          {/* Full Logo Light */}
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            boxShadow: '0 4px 24px rgba(10, 22, 40, 0.1)'
          }}>
            <FullLogo dark={false} height={60} />
            <span style={{ color: '#64748B', fontSize: '14px' }}>
              Full Logo (Light BG)
            </span>
          </div>
          
          {/* Full Logo Dark */}
          <div style={{
            background: '#0A1628',
            borderRadius: '16px',
            padding: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            boxShadow: '0 4px 24px rgba(0, 0, 0, 0.3)'
          }}>
            <FullLogo dark={true} height={60} />
            <span style={{ color: '#94A3B8', fontSize: '14px' }}>
              Full Logo (Dark BG)
            </span>
          </div>
        </div>
      </section>

      {/* Colors Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          color: darkMode ? '#F0F9FF' : '#0A1628',
          fontSize: '20px',
          marginBottom: '24px'
        }}>
          Color Palette
        </h2>
        
        {/* Main Colors */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {colors.map((color) => (
            <div key={color.name} style={{
              background: darkMode ? '#1E293B' : 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              boxShadow: '0 2px 12px rgba(10, 22, 40, 0.08)'
            }}>
              <div style={{ 
                background: color.hex, 
                height: '80px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {color.hex === '#0A1628' || color.hex === '#64748B' ? (
                  <span style={{ color: 'white', fontSize: '12px', opacity: 0.7 }}>{color.hex}</span>
                ) : null}
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ 
                  fontWeight: '600', 
                  color: darkMode ? '#F0F9FF' : '#0A1628',
                  fontSize: '14px'
                }}>
                  {color.name}
                </div>
                <div style={{ 
                  color: darkMode ? '#94A3B8' : '#64748B',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {color.hex}
                </div>
                <div style={{ 
                  color: darkMode ? '#64748B' : '#94A3B8',
                  fontSize: '11px',
                  marginTop: '4px'
                }}>
                  {color.usage}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Accent Colors */}
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {accents.map((color) => (
            <div key={color.name} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              background: darkMode ? '#1E293B' : 'white',
              padding: '12px 16px',
              borderRadius: '8px'
            }}>
              <div style={{ 
                width: '32px', 
                height: '32px', 
                borderRadius: '8px',
                background: color.hex 
              }} />
              <div>
                <div style={{ 
                  fontWeight: '600', 
                  color: darkMode ? '#F0F9FF' : '#0A1628',
                  fontSize: '13px'
                }}>
                  {color.name}
                </div>
                <div style={{ 
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  color: darkMode ? '#94A3B8' : '#64748B'
                }}>
                  {color.hex}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          color: darkMode ? '#F0F9FF' : '#0A1628',
          fontSize: '20px',
          marginBottom: '24px'
        }}>
          Typography
        </h2>
        <div style={{
          background: darkMode ? '#1E293B' : 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 24px rgba(10, 22, 40, 0.08)'
        }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ 
              color: darkMode ? '#94A3B8' : '#64748B',
              fontSize: '12px',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Primary Font
            </div>
            <div style={{ 
              fontSize: '48px', 
              fontWeight: '700',
              color: darkMode ? '#F0F9FF' : '#0A1628',
              marginBottom: '8px'
            }}>
              Outfit
            </div>
            <div style={{ 
              color: darkMode ? '#94A3B8' : '#64748B',
              fontSize: '14px'
            }}>
              Google Fonts · Weights: 300, 400, 500, 600, 700
            </div>
          </div>
          
          <div style={{ 
            borderTop: `1px solid ${darkMode ? 'rgba(148, 163, 184, 0.2)' : '#E0F2FE'}`,
            paddingTop: '24px'
          }}>
            <div style={{ 
              color: darkMode ? '#94A3B8' : '#64748B',
              fontSize: '12px',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Mono Font (Scores & Code)
            </div>
            <div style={{ 
              fontSize: '32px', 
              fontWeight: '700',
              fontFamily: 'monospace',
              color: darkMode ? '#F0F9FF' : '#0A1628',
              marginBottom: '8px'
            }}>
              JetBrains Mono
            </div>
            <div style={{ 
              fontFamily: 'monospace',
              fontSize: '14px',
              color: '#0EA5E9'
            }}>
              const score = 87; // AI Readiness Score
            </div>
          </div>
        </div>
      </section>

      {/* UI Components Section */}
      <section style={{ marginBottom: '48px' }}>
        <h2 style={{ 
          color: darkMode ? '#F0F9FF' : '#0A1628',
          fontSize: '20px',
          marginBottom: '24px'
        }}>
          UI Components
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px'
        }}>
          {/* Buttons */}
          <div style={{
            background: darkMode ? '#1E293B' : 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(10, 22, 40, 0.08)'
          }}>
            <div style={{ 
              color: darkMode ? '#94A3B8' : '#64748B',
              fontSize: '12px',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Buttons
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button style={{
                background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.4)'
              }}>
                Primary Button
              </button>
              <button style={{
                background: 'transparent',
                color: '#0EA5E9',
                border: '2px solid #0EA5E9',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '16px',
                cursor: 'pointer'
              }}>
                Secondary Button
              </button>
            </div>
          </div>

          {/* Score Card */}
          <div style={{
            background: darkMode ? '#1E293B' : 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(10, 22, 40, 0.08)'
          }}>
            <div style={{ 
              color: darkMode ? '#94A3B8' : '#64748B',
              fontSize: '12px',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Score Display
            </div>
            <div style={{ 
              display: 'flex',
              alignItems: 'baseline',
              gap: '8px'
            }}>
              <span style={{
                fontFamily: 'monospace',
                fontSize: '56px',
                fontWeight: '700',
                background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                87
              </span>
              <span style={{ 
                color: darkMode ? '#94A3B8' : '#64748B',
                fontSize: '18px'
              }}>
                / 100
              </span>
            </div>
            <div style={{ 
              color: '#10B981',
              fontSize: '14px',
              fontWeight: '500',
              marginTop: '8px'
            }}>
              ✓ AI Ready
            </div>
          </div>

          {/* Card */}
          <div style={{
            background: darkMode ? '#1E293B' : 'white',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 24px rgba(10, 22, 40, 0.08)',
            border: `1px solid ${darkMode ? 'rgba(14, 165, 233, 0.2)' : '#E0F2FE'}`
          }}>
            <div style={{ 
              color: darkMode ? '#94A3B8' : '#64748B',
              fontSize: '12px',
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.1em'
            }}>
              Card Component
            </div>
            <h3 style={{ 
              color: darkMode ? '#F0F9FF' : '#0A1628',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '8px'
            }}>
              AI Visibility Check
            </h3>
            <p style={{ 
              color: darkMode ? '#94A3B8' : '#64748B',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              Track your brand presence across ChatGPT, Perplexity, and other AI platforms.
            </p>
          </div>
        </div>
      </section>

      {/* Gradient Section */}
      <section>
        <h2 style={{ 
          color: darkMode ? '#F0F9FF' : '#0A1628',
          fontSize: '20px',
          marginBottom: '24px'
        }}>
          Gradients
        </h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{
            width: '200px',
            height: '100px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '12px'
          }}>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>
              Primary Gradient
            </span>
          </div>
          <div style={{
            width: '200px',
            height: '100px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '12px'
          }}>
            <span style={{ color: 'white', fontSize: '12px', fontWeight: '500' }}>
              Surface Rising
            </span>
          </div>
          <div style={{
            width: '200px',
            height: '100px',
            borderRadius: '12px',
            background: 'linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%)',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '12px',
            border: '1px solid #E0F2FE'
          }}>
            <span style={{ color: '#64748B', fontSize: '12px', fontWeight: '500' }}>
              Subtle Background
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SurfacedBrandPreview;
