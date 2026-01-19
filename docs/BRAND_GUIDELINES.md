# 🎨 SURFACED - Brand Guidelines

## Brand Identity Overview

### Brand Concept
**Surfaced** représente l'émergence, la visibilité, le fait de remonter à la surface dans l'océan de données de l'IA. Le concept visuel s'inspire de :
- L'océan profond → la surface lumineuse
- La donnée invisible → la visibilité
- L'émergence, l'ascension, la découverte

### Design Direction
**Tone** : Premium Tech / Refined Minimal / Ocean-Inspired Modern
- Pas de "AI purple cliché"
- Élégance professionnelle avec une touche organique (eau, lumière)
- Confiance et expertise (marchands e-commerce = professionnels)

---

## 🎨 Color Palette

### Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Deep Ocean** | `#0A1628` | 10, 22, 40 | Backgrounds, text principal |
| **Surface Blue** | `#0EA5E9` | 14, 165, 233 | CTA, accents principaux, logo |
| **Bright Surface** | `#38BDF8` | 56, 189, 248 | Highlights, hover states |

### Secondary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Foam White** | `#F0F9FF` | 240, 249, 255 | Backgrounds clairs |
| **Pearl** | `#E0F2FE` | 224, 242, 254 | Cards, surfaces secondaires |
| **Slate** | `#64748B` | 100, 116, 139 | Texte secondaire |

### Accent Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Success Green** | `#10B981` | 16, 185, 129 | Scores positifs, validations |
| **Warning Amber** | `#F59E0B` | 245, 158, 11 | Alertes, attention |
| **Error Red** | `#EF4444` | 239, 68, 68 | Erreurs, scores critiques |

### Gradient

```css
/* Primary Gradient - "Surface Rising" */
background: linear-gradient(135deg, #0A1628 0%, #1E3A5F 50%, #0EA5E9 100%);

/* Accent Gradient - "Light Break" */
background: linear-gradient(180deg, #38BDF8 0%, #0EA5E9 100%);

/* Subtle Background Gradient */
background: linear-gradient(180deg, #F0F9FF 0%, #E0F2FE 100%);
```

---

## 📝 Typography

### Primary Font: **Outfit**
Google Fonts: https://fonts.google.com/specimen/Outfit

**Pourquoi Outfit :**
- Moderne et géométrique mais chaleureux
- Excellente lisibilité (UI/UX)
- Variable font (performance)
- Pas surexploité comme Inter/Poppins

### Secondary Font: **JetBrains Mono**
Google Fonts: https://fonts.google.com/specimen/JetBrains+Mono

**Usage :** Code snippets, données techniques, scores

### Font Scale

```css
/* CSS Variables */
:root {
  /* Font Families */
  --font-primary: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Font Sizes */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  --text-5xl: 3rem;      /* 48px */
  --text-6xl: 3.75rem;   /* 60px */
  
  /* Font Weights */
  --font-light: 300;
  --font-regular: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  
  /* Line Heights */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.625;
}
```

### Typography Usage

| Element | Font | Size | Weight | Color |
|---------|------|------|--------|-------|
| H1 | Outfit | 48px | 700 | Deep Ocean |
| H2 | Outfit | 36px | 600 | Deep Ocean |
| H3 | Outfit | 24px | 600 | Deep Ocean |
| Body | Outfit | 16px | 400 | Slate |
| Small | Outfit | 14px | 400 | Slate |
| Code | JetBrains Mono | 14px | 400 | Surface Blue |
| Score | JetBrains Mono | 48px | 700 | Surface Blue |

---

## 🖼️ Logo Specifications

### Logo Concept
Le logo représente une **vague stylisée qui émerge** combinée avec la lettre "S" :
- Forme fluide évoquant l'eau qui monte
- Mouvement ascendant = émergence, visibilité
- Simple mais mémorable
- Fonctionne en monochrome

### Logo Versions

| Version | Usage | Format |
|---------|-------|--------|
| **Primary** | Fond sombre | SVG, PNG |
| **Light** | Fond clair | SVG, PNG |
| **Icon Only** | Favicon, app icon | SVG, PNG, ICO |
| **Wordmark** | Header, documents | SVG, PNG |

### Logo Clear Space
Espace minimum autour du logo = hauteur de l'icône × 0.5

### Minimum Sizes
- Icon seul : 24px × 24px minimum
- Logo complet : 120px largeur minimum

---

## 🎯 Logo SVG Code

### Icon Only (Favicon/App Icon)

```svg
<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="surfaceGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="#0A1628"/>
  <path d="M16 44 C16 44 22 36 32 36 C42 36 48 44 48 44 C48 44 42 28 32 28 C22 28 16 44 16 44 Z" 
        fill="url(#surfaceGradient)" opacity="0.4"/>
  <path d="M12 36 C12 36 20 24 32 24 C44 24 52 36 52 36 C52 36 44 16 32 16 C20 16 12 36 12 36 Z" 
        fill="url(#surfaceGradient)"/>
  <circle cx="32" cy="22" r="3" fill="#38BDF8"/>
</svg>
```

### Full Logo (Horizontal)

```svg
<svg viewBox="0 0 280 64" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="surfaceGradient" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#0EA5E9"/>
      <stop offset="100%" stop-color="#38BDF8"/>
    </linearGradient>
  </defs>
  <!-- Icon -->
  <rect width="64" height="64" rx="14" fill="#0A1628"/>
  <path d="M16 44 C16 44 22 36 32 36 C42 36 48 44 48 44 C48 44 42 28 32 28 C22 28 16 44 16 44 Z" 
        fill="url(#surfaceGradient)" opacity="0.4"/>
  <path d="M12 36 C12 36 20 24 32 24 C44 24 52 36 52 36 C52 36 44 16 32 16 C20 16 12 36 12 36 Z" 
        fill="url(#surfaceGradient)"/>
  <circle cx="32" cy="22" r="3" fill="#38BDF8"/>
  <!-- Wordmark -->
  <text x="80" y="42" font-family="Outfit, sans-serif" font-size="28" font-weight="600" fill="#0A1628">
    surfaced
  </text>
</svg>
```

---

## 📐 UI Components Style

### Buttons

```css
/* Primary Button */
.btn-primary {
  background: linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%);
  color: #FFFFFF;
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 8px;
  border: none;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);
  transition: all 0.2s ease;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(14, 165, 233, 0.5);
}

/* Secondary Button */
.btn-secondary {
  background: transparent;
  color: #0EA5E9;
  font-family: var(--font-primary);
  font-weight: 600;
  font-size: 16px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 2px solid #0EA5E9;
  transition: all 0.2s ease;
}

.btn-secondary:hover {
  background: #0EA5E9;
  color: #FFFFFF;
}
```

### Cards

```css
.card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(10, 22, 40, 0.08);
  border: 1px solid #E0F2FE;
}

.card-dark {
  background: #0A1628;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(14, 165, 233, 0.2);
}
```

### Score Display

```css
.score-badge {
  font-family: var(--font-mono);
  font-size: 48px;
  font-weight: 700;
  background: linear-gradient(135deg, #0EA5E9 0%, #38BDF8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.score-excellent { color: #10B981; }  /* 80-100 */
.score-good { color: #0EA5E9; }       /* 60-79 */
.score-warning { color: #F59E0B; }    /* 40-59 */
.score-critical { color: #EF4444; }   /* 0-39 */
```

---

## 🖥️ Application Themes

### Light Theme (Default)

```css
:root {
  --bg-primary: #FFFFFF;
  --bg-secondary: #F0F9FF;
  --bg-tertiary: #E0F2FE;
  --text-primary: #0A1628;
  --text-secondary: #64748B;
  --border-color: #E0F2FE;
  --accent: #0EA5E9;
  --accent-hover: #38BDF8;
}
```

### Dark Theme

```css
[data-theme="dark"] {
  --bg-primary: #0A1628;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --text-primary: #F0F9FF;
  --text-secondary: #94A3B8;
  --border-color: rgba(14, 165, 233, 0.2);
  --accent: #38BDF8;
  --accent-hover: #7DD3FC;
}
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile first */
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Small desktops */
--breakpoint-xl: 1280px;  /* Large desktops */
--breakpoint-2xl: 1536px; /* Extra large */
```

---

## 🎬 Animation Guidelines

### Timing Functions

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
--bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
```

### Standard Durations

```css
--duration-fast: 150ms;
--duration-normal: 250ms;
--duration-slow: 400ms;
```

### Key Animations

```css
/* Surface Rise Animation */
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

/* Pulse Glow */
@keyframes pulseGlow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(14, 165, 233, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(14, 165, 233, 0.6);
  }
}

/* Wave Motion */
@keyframes waveMotion {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}
```

---

## 📋 CSS Variables - Complete

```css
:root {
  /* Colors */
  --color-deep-ocean: #0A1628;
  --color-surface-blue: #0EA5E9;
  --color-bright-surface: #38BDF8;
  --color-foam-white: #F0F9FF;
  --color-pearl: #E0F2FE;
  --color-slate: #64748B;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  
  /* Typography */
  --font-primary: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
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
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-2xl: 24px;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(10, 22, 40, 0.05);
  --shadow-md: 0 4px 12px rgba(10, 22, 40, 0.1);
  --shadow-lg: 0 8px 24px rgba(10, 22, 40, 0.12);
  --shadow-xl: 0 16px 48px rgba(10, 22, 40, 0.16);
  --shadow-glow: 0 0 24px rgba(14, 165, 233, 0.4);
}
```

---

## 🔗 Google Fonts Import

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
```

---

## 📱 Tailwind CSS Config

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
        'slate': '#64748B',
      },
      fontFamily: {
        'outfit': ['Outfit', 'sans-serif'],
        'mono': ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'glow': '0 0 24px rgba(14, 165, 233, 0.4)',
        'glow-lg': '0 0 48px rgba(14, 165, 233, 0.5)',
      },
      animation: {
        'surface-rise': 'surfaceRise 0.6s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'wave': 'waveMotion 3s ease-in-out infinite',
      },
    },
  },
}
```

---

## ✅ Brand Do's and Don'ts

### ✅ DO
- Utiliser le gradient "Surface Rising" pour les éléments premium
- Maintenir un contraste élevé pour l'accessibilité
- Utiliser l'animation "surface rise" pour les éléments entrants
- Garder beaucoup d'espace blanc (ou "deep ocean" en dark mode)

### ❌ DON'T
- Utiliser le logo sur des fonds qui réduisent le contraste
- Mélanger les gradients AI clichés (purple/pink)
- Surcharger les animations
- Utiliser d'autres polices que Outfit et JetBrains Mono
- Déformer ou modifier les proportions du logo
