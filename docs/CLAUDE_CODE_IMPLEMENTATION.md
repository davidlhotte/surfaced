# 🎨 SURFACED - Claude Code Implementation Guide

## Pour mettre à jour l'application Shopify et la Landing Page

Ce document contient toutes les informations nécessaires pour Claude Code pour implémenter la charte graphique Surfaced.

---

## 1. INSTALLATION DES FONTS

### Google Fonts Import (HTML head)
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

### CSS Import Alternative
```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap');
```

---

## 2. CSS VARIABLES (À ajouter en haut du CSS global)

```css
:root {
  /* ===== SURFACED BRAND COLORS ===== */
  /* Primary */
  --color-deep-ocean: #0A1628;
  --color-surface-blue: #0EA5E9;
  --color-bright-surface: #38BDF8;
  
  /* Secondary */
  --color-foam-white: #F0F9FF;
  --color-pearl: #E0F2FE;
  --color-slate: #64748B;
  
  /* Accents */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  /* ===== GRADIENTS ===== */
  --gradient-primary: linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%);
  --gradient-surface-rise: linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%);
  --gradient-subtle: linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%);
  
  /* ===== TYPOGRAPHY ===== */
  --font-primary: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;
  --text-5xl: 3rem;
  --text-6xl: 3.75rem;
  
  /* Font Weights */
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* ===== SPACING ===== */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;
  
  /* ===== BORDER RADIUS ===== */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* ===== SHADOWS ===== */
  --shadow-sm: 0 1px 2px rgba(10, 22, 40, 0.05);
  --shadow-md: 0 4px 12px rgba(10, 22, 40, 0.1);
  --shadow-lg: 0 8px 24px rgba(10, 22, 40, 0.12);
  --shadow-xl: 0 16px 48px rgba(10, 22, 40, 0.16);
  --shadow-glow: 0 0 24px rgba(14, 165, 233, 0.4);
  --shadow-glow-lg: 0 0 48px rgba(14, 165, 233, 0.5);
  
  /* ===== ANIMATIONS ===== */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
}

/* ===== ANIMATIONS KEYFRAMES ===== */
@keyframes surfaceRise {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(14, 165, 233, 0.6);
  }
}

@keyframes waveMotion {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

/* ===== DARK THEME ===== */
[data-theme="dark"] {
  --bg-primary: #0A1628;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --text-primary: #F0F9FF;
  --text-secondary: #94A3B8;
  --border-color: rgba(14, 165, 233, 0.2);
}
```

---

## 3. TAILWIND CONFIG (si utilisé)

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'deep-ocean': '#0A1628',
        'surface-blue': '#0EA5E9',
        'bright-surface': '#38BDF8',
        'foam-white': '#F0F9FF',
        'pearl': '#E0F2FE',
        'slate-custom': '#64748B',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 24px rgba(14, 165, 233, 0.4)',
        'glow-lg': '0 0 48px rgba(14, 165, 233, 0.5)',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%)',
        'gradient-surface': 'linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%)',
      },
      animation: {
        'surface-rise': 'surfaceRise 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'wave': 'waveMotion 3s ease-in-out infinite',
      },
      keyframes: {
        surfaceRise: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(14, 165, 233, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(14, 165, 233, 0.6)' },
        },
        waveMotion: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
      },
    },
  },
  plugins: [],
}
```

---

## 4. COMPOSANTS UI STANDARDS

### Primary Button
```css
.btn-primary {
  background: var(--gradient-primary);
  color: #FFFFFF;
  font-family: var(--font-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  border: none;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);
  transition: all var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
}

.btn-primary:active {
  transform: translateY(0);
}
```

### Secondary Button
```css
.btn-secondary {
  background: transparent;
  color: var(--color-surface-blue);
  font-family: var(--font-primary);
  font-weight: var(--font-semibold);
  font-size: var(--text-base);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  border: 2px solid var(--color-surface-blue);
  transition: all var(--duration-normal) var(--ease-out);
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--color-surface-blue);
  color: #FFFFFF;
}
```

### Card Component
```css
.card {
  background: #FFFFFF;
  border-radius: var(--radius-xl);
  padding: var(--space-6);
  box-shadow: var(--shadow-md);
  border: 1px solid var(--color-pearl);
  transition: all var(--duration-normal) var(--ease-out);
}

.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.card-dark {
  background: var(--color-deep-ocean);
  border: 1px solid rgba(14, 165, 233, 0.2);
}
```

### Score Badge
```css
.score-badge {
  font-family: var(--font-mono);
  font-size: var(--text-5xl);
  font-weight: var(--font-bold);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.score-excellent { color: var(--color-success); }
.score-good { color: var(--color-surface-blue); }
.score-warning { color: var(--color-warning); }
.score-critical { color: var(--color-error); }
```

### Input Field
```css
.input-field {
  font-family: var(--font-primary);
  font-size: var(--text-base);
  padding: var(--space-3) var(--space-4);
  border: 2px solid var(--color-pearl);
  border-radius: var(--radius-md);
  background: #FFFFFF;
  color: var(--color-deep-ocean);
  transition: all var(--duration-fast) var(--ease-out);
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: var(--color-surface-blue);
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
}

.input-field::placeholder {
  color: var(--color-slate);
}
```

---

## 5. LOGO SVG INLINE (Pour header/navigation)

### Icon seul (32x32)
```jsx
const SurfacedIcon = ({ size = 32 }) => (
  <svg viewBox="0 0 64 64" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
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
  </svg>
);
```

### Logo complet avec texte
```jsx
const SurfacedLogo = ({ height = 40, dark = false }) => (
  <svg viewBox="0 0 320 80" height={height} xmlns="http://www.w3.org/2000/svg">
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
          fontFamily="Outfit, sans-serif" 
          fontSize="36" 
          fontWeight="600" 
          fill={dark ? "#F0F9FF" : "#0A1628"}
          letterSpacing="-0.02em">
      surfaced
    </text>
  </svg>
);
```

---

## 6. FAVICON SETUP

### HTML Head
```html
<!-- Favicon -->
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- PWA -->
<link rel="manifest" href="/site.webmanifest">
<meta name="theme-color" content="#0A1628">
```

### site.webmanifest
```json
{
  "name": "Surfaced",
  "short_name": "Surfaced",
  "icons": [
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "theme_color": "#0A1628",
  "background_color": "#0A1628",
  "display": "standalone"
}
```

---

## 7. POLARIS OVERRIDE (Pour Shopify App)

Si tu utilises Polaris dans l'app Shopify, voici comment override les styles :

```css
/* Override Polaris with Surfaced brand */
.Polaris-Frame {
  --p-color-bg: var(--color-foam-white);
  --p-color-bg-surface: #FFFFFF;
  --p-color-text: var(--color-deep-ocean);
  --p-color-text-secondary: var(--color-slate);
}

.Polaris-Button--primary {
  background: var(--gradient-primary) !important;
  border: none !important;
}

.Polaris-Card {
  border-radius: var(--radius-xl) !important;
  box-shadow: var(--shadow-md) !important;
}

/* Custom score display in Polaris */
.surfaced-score {
  font-family: var(--font-mono);
  font-size: var(--text-4xl);
  font-weight: var(--font-bold);
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
```

---

## 8. RÉSUMÉ QUICK REFERENCE

### Couleurs Hex
| Name | Hex |
|------|-----|
| Deep Ocean | `#0A1628` |
| Surface Blue | `#0EA5E9` |
| Bright Surface | `#38BDF8` |
| Foam White | `#F0F9FF` |
| Pearl | `#E0F2FE` |
| Slate | `#64748B` |
| Success | `#10B981` |
| Warning | `#F59E0B` |
| Error | `#EF4444` |

### Fonts
- **Primary**: Outfit (Google Fonts)
- **Mono**: JetBrains Mono (Google Fonts)

### Border Radius
- Small: `4px`
- Medium: `8px`
- Large: `12px`
- XL: `16px`
- 2XL: `24px`

### Shadows
- Small: `0 1px 2px rgba(10, 22, 40, 0.05)`
- Medium: `0 4px 12px rgba(10, 22, 40, 0.1)`
- Large: `0 8px 24px rgba(10, 22, 40, 0.12)`
- Glow: `0 0 24px rgba(14, 165, 233, 0.4)`
