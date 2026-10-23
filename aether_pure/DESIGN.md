---
name: Aether Pure
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#45464d'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006a61'
  on-secondary: '#ffffff'
  secondary-container: '#86f2e4'
  on-secondary-container: '#006f66'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#001f26'
  on-tertiary-container: '#0090a9'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#89f5e7'
  secondary-fixed-dim: '#6bd8cb'
  on-secondary-fixed: '#00201d'
  on-secondary-fixed-variant: '#005049'
  tertiary-fixed: '#acedff'
  tertiary-fixed-dim: '#4cd7f6'
  on-tertiary-fixed: '#001f26'
  on-tertiary-fixed-variant: '#004e5c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  display-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 64px
    fontWeight: '700'
    lineHeight: 72px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 38px
    fontWeight: '700'
    lineHeight: 44px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 44px
    fontWeight: '600'
    lineHeight: 52px
    letterSpacing: -0.025em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
    letterSpacing: -0.01em
  body-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0em
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0.01em
  label-numeric:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 36px
    letterSpacing: -0.03em
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.08em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 4rem
  margin-tablet: 2rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

## Brand & Style

The design system embodies the purity, weightlessness, and precision of pristine alpine air merged with Swiss industrial engineering and Scandinavian minimalism. It targets discerning homeowners, wellness purists, and design-conscious technocrats who demand clinical air quality wrapped in museum-grade aesthetics.

The visual style is **Hyper-Clean Minimalist Glassmorphism**:
- **Purity & Atmosphere:** Vast negative space evokes boundless breathability and uncluttered living spaces.
- **Micro-Textures:** Translucent, frosted glass surfaces mimic vapor, air currents, and pristine ice sheets, grounding technological precision without visual noise.
- **Clinical Precision:** Strict alignment, microscopic indicator lights, and razor-sharp typographic discipline balance warm organic comfort with medical-grade efficacy.

## Colors

The palette is engineered to invoke cold, filtered atmosphere, laboratory cleanliness, and physical product solidity:

- **Primary (`#0F172A` - Deep Obsidian):** Used for commanding headlines, high-contrast structural text, and anchored call-to-actions. Represents structural stability and precision metal casing.
- **Secondary (`#0D9488` - Alpine Teal/Emerald):** The primary signal of purity, safety, and operational excellence. Applied to verified HEPA certifications, optimal air quality metrics (AQI 0–20), and focused micro-interactions.
- **Tertiary (`#06B6D4` - Ion Cyan):** An electric atmospheric accent used sparingly for interactive highlights, dynamic air-stream visualizers, and state shifts.
- **Neutral (`#64748B` - Slate Silver):** A balanced cool gray dedicated to secondary copy, subtle divider borders, inactive states, and hardware metrics.
- **Base Canvas (`#F8FAFC` to `#FFFFFF`):** Deep, ultra-clean white surfaces layered with subtle cool gray tints to construct layered glass depths without introducing warmth or yellow casts.

## Typography

The typographic hierarchy utilizes **Plus Jakarta Sans** throughout, balancing geometric precision with sculpted, organic terminal curves.

- **Hero & Section Headlines:** Use tight negative letter spacing (`-0.03em` to `-0.02em`) to mirror premium editorial hardware design. Headings must remain laconic and scannable.
- **Metric Displays (`label-numeric`):** Engineered for real-time telemetry panels (e.g., `PM2.5: 03 µg/m³`, `CADR: 650 m³/h`), featuring proportional, tabular-like precision.
- **Micro-labels (`label-sm`):** Rendered in uppercase with generous tracking (`0.08em`) to act as technical metadata tags, filter status badges, and sensor status keys.

## Layout & Spacing

The layout is built upon an architectural 12-column fluid grid system pinned to a maximum canvas width of `1360px`, framed by wide breathing buffers (`space-3xl` between vertical narrative sections).

- **Desktop (≥ 1024px):** 12-column grid, `gutter: 1.5rem`, `margin: 4rem`. Asymmetric column arrangements (7:5 split for product visual vs. sensor intelligence).
- **Tablet (768px – 1023px):** 8-column grid, `gutter: 1.25rem`, `margin: 2rem`. Sensor and feature grids reflow into dual-column cards.
- **Mobile (< 768px):** 4-column grid, `gutter: 1rem`, `margin: 1.25rem`. Complex telemetry units stack into horizontally scrolling glass segments or single vertical tracks.

## Elevation & Depth

Visual hierarchy rejects harsh dropshadows in favor of ethereal diffusion, refractive translucency, and crisp optical boundaries:

- **Surface Base:** `#FFFFFF` with faint atmospheric background gradients (linear wash of `#F0FDFA` to `#F8FAFC`).
- **Glassmorphism Panels:** Background fill set to `rgba(255, 255, 255, 0.72)` coupled with `backdrop-filter: blur(20px) saturate(180%)`. Edge definition is reinforced with a 1px border using `rgba(255, 255, 255, 0.9)` at the top and `rgba(15, 23, 42, 0.05)` at the bottom to simulate a top-lit glass edge.
- **Ambient Shadow System:**
  - *Resting Element:* `0 4px 20px -2px rgba(15, 23, 42, 0.03), 0 2px 6px -1px rgba(15, 23, 42, 0.02)`.
  - *Hover & Dynamic Hover:* `0 20px 40px -8px rgba(13, 148, 136, 0.08), 0 8px 16px -4px rgba(15, 23, 42, 0.04)`.
- **Aura Ambient Bloom:** Sensor indicators utilize a soft chromatic back-glow: `box-shadow: 0 0 24px rgba(13, 148, 136, 0.25)`.

## Shapes

The geometric signature uses deliberate, continuous curves (squircle philosophy):

- **Interactive Nodes & Metric Pods:** Built with standard `rounded` (0.5rem / 8px) to `rounded-lg` (1rem / 16px) for interior glass cards.
- **Outer Shells & Enclosures:** Large narrative hero containers and product showcases employ `rounded-xl` (1.5rem / 24px), echoing the milled aluminum radiuses of modern architectural appliances.
- **Badges & System Pills:** Use full pill shapes (`rounded-full` / 9999px) to communicate organic, tactile, and ergonomic states.

## Components

### Buttons
- **Primary Action (Precision Obsidian):** Solid `#0F172A` fill, `#FFFFFF` text, `rounded-xl` (or pill), 0 1px 2px rgba(0,0,0,0.05). Hover reveals an internal teal gradient glow with a subtle `-1px` vertical translation.
- **Secondary Atmospheric (Glass Button):** `rgba(255, 255, 255, 0.65)` background, `backdrop-filter: blur(12px)`, border `1px solid rgba(15, 23, 42, 0.08)`, `#0F172A` text. Hover scales border tint to `#0D9488`.

### Air Quality Index (AQI) & PM2.5 Telemetry Badge
- Ultra-compact floating glass widget with a live pulsing status beacon (emerald `#0D9488` for pristine, cyan `#06B6D4` for filtering active).
- Numeric output styled via `label-numeric` accompanied by micro-labels (`label-sm`) noting units (`µg/m³`).

### Filter Tier Cards (HEPA H13 & Nanotech Activated Carbon)
- Constructed with multi-layered translucency: frosted background, 1px top highlight border, inset padding `space-xl`.
- Micro-pill badges with `#0D9488` text against `rgba(13, 148, 136, 0.1)` backgrounds for efficiency tiers (`99.97% at 0.1 Micron`).

### Input Fields & Consultation Booking
- Input fields rely on frosted minimalist wells (`rgba(248, 250, 252, 0.8)`) with `1px solid rgba(100, 116, 139, 0.2)`. 
- Focus state instantly expands an ambient halo of `0 0 0 3px rgba(13, 148, 136, 0.15)` with the border shifting to `#0D9488`. Text is `#0F172A`, placeholder is `#94A3B8`.

### Checkboxes & Toggle Switches
- Toggles utilize a cylindrical pill track in `#E2E8F0` switching to `#0D9488` upon engagement; handle is pure `#FFFFFF` with a crisp micro-shadow (`0 2px 4px rgba(0,0,0,0.1)`).