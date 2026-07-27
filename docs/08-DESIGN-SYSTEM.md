# eGovPH + eAbot Design System

> **Version:** 1.0  
> **Last updated:** 22 July 2026  
> **Consolidates:** `eAbot_Visual_Design.md` + PRD visual requirements + integration UI patterns  
> **Purpose:** Single source of truth for all UI implementation decisions  

---

## 1. Design Identity

### One-Sentence Direction

> A calm, airy Filipino public-service dashboard made from crisp white space, compact Poppins typography, pale service circles, soft pastel tiles, and one unmistakable royal-blue primary action.

### Core Visual Properties

| Property | Rule |
|----------|------|
| Canvas | White covers ≥ 70% of visible home screen |
| Typography | Poppins only — light, calm, compact |
| Primary color | Royal blue for actions, links, active states |
| Accents | Yellow (small highlights), Red (badges, warnings) |
| Shadows | Almost invisible — only bottom nav and raised center action |
| Radii | 12–16px for cards; never oversized bubble shapes |
| Density | Utility-first; compact; no marketing hero blocks |

---

## 2. Color System

### 2.1 Core Tokens

```css
:root {
  /* === Brand & Actions === */
  --color-primary: #0753da;
  --color-primary-pressed: #0647bd;
  --color-primary-soft: #eff5ff;
  --color-sun: #f6c700;
  --color-bandila-red: #d93d45;

  /* === Canvas & Neutrals === */
  --color-canvas: #ffffff;
  --color-section: #fbfbfd;
  --color-text: #252525;
  --color-text-soft: #515151;
  --color-muted: #8d929a;
  --color-placeholder: #b2b2b2;
  --color-border: #dddddf;
  --color-divider: #ececf0;

  /* === Pastel Modules === */
  --color-pastel-blue: #f2f8ff;
  --color-pastel-pink: #ffe9ea;
  --color-pastel-yellow: #fff4c9;
  --color-pastel-green: #eaf8dd;
  --color-pastel-lilac: #f2edff;

  /* === Semantic States === */
  --color-success: #248a54;
  --color-success-soft: #eaf7ef;
  --color-warning: #8b6900;
  --color-warning-soft: #fff5ce;
  --color-danger: #c93643;
  --color-danger-soft: #ffeaed;
}
```

### 2.2 Usage Rules

- Blue: icons, active controls, links, raised center action — NOT full-page backgrounds
- Yellow: small icon accents, positive highlights, selected states
- Red: badges ("Bago"), warnings, small brand detail only
- Pastels: tile backgrounds only — cards stay white
- Never use color alone for status — always combine with icon + text

---

## 3. Typography

### Font: Poppins (all weights loaded)

```css
:root {
  --font-interface: 'Poppins', sans-serif;
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;    /* Use sparingly — short phrases only */
}
```

### Scale

| Role | Mobile | Desktop | Weight | Line Height |
|------|--------|---------|--------|-------------|
| Greeting name | 18px | 20px | 600 | 1.25 |
| Greeting subtitle | 13px | 14px | 300 | 1.45 |
| Section heading | 22px | 26px | 500 | 1.25 |
| Card title | 16px | 17px | 500 | 1.35 |
| Body | 14px | 15px | 300–400 | 1.55 |
| Nav label | 11px | 12px | 400 | 1.2 |
| Active nav label | 11px | 12px | 600 | 1.2 |
| Metadata | 11px | 12px | 300–400 | 1.45 |
| Badge | 10px | 10px | 500–600 | 1 |

---

## 4. Spacing & Layout

### 4px Base Grid

```css
:root {
  --space-1: 4px;   --space-2: 8px;   --space-3: 12px;
  --space-4: 16px;  --space-5: 20px;  --space-6: 24px;
  --space-8: 32px;  --space-10: 40px; --space-12: 48px;
}
```

### Key Measurements

| Element | Value |
|---------|-------|
| Page gutter (mobile) | 18–22px |
| Page gutter (< 360px) | 15px |
| Section gap | 20–28px |
| Card internal padding | 10–16px |
| Related control gap | 8–10px |
| Max content width (desktop) | 1180px |
| Bottom nav height | 76–80px + safe area |
| Bottom padding for content | ≥ 104px |

### Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| 320–430px | Mobile reference (single column) |
| 431–699px | Wide mobile (same structure, more breathing room) |
| 700–1023px | Tablet (32px gutters, optional 2-column) |
| 1024px+ | Desktop (centered max-width, no phone frame) |

---

## 5. Shape & Elevation

```css
:root {
  --radius-control: 12px;
  --radius-card: 13px;
  --radius-large: 16px;
  --radius-pill: 999px;

  --shadow-control: 0 2px 8px rgba(0, 0, 0, 0.025);
  --shadow-nav: 0 -4px 18px rgba(24, 38, 65, 0.06);
  --shadow-floating-action: 0 10px 22px rgba(7, 83, 218, 0.22);
}
```

**Rules:**
- Default cards: NO shadow
- Search field: thin border + extremely subtle shadow
- Bottom nav: faint upward shadow or 1px top divider
- Raised center action: ONLY element with strong shadow

---

## 6. Iconography

- **Library:** Lucide React (consistent outline style)
- **Stroke:** 2px
- **Primary color:** Royal blue
- **Accent:** Yellow for small inner details
- **Category icons:** Inside 58–64px pale-blue circles
- **Nav icons:** 22–24px, slate gray (blue when active)
- **Center nav icon:** 27–30px, white on blue circle

---

## 7. Component Dimensions Quick Reference

| Component | Height | Width | Radius |
|-----------|--------|-------|--------|
| Search field | 52–56px | 100% | 12px |
| Category circle | 56–60px | 56–60px | 50% |
| Banner carousel | ~130px (3:1) | 100% | 13px |
| Utility tile | ~120px | 50% - gap | 13px |
| Service row | 76–84px | 100% | 12–13px |
| Bottom nav | 76–80px | 100% | 0 |
| Center action | 60px | 60px | 50% |
| Avatar | 48–50px | 48–50px | 50% |
| Segmented control | 44–46px | 100% | 8px |
| Button (primary) | 52–56px | auto | 12px |
| Touch target (min) | 44px | 44px | — |

---

## 8. Screen-by-Screen Integration Map

How eGov API integrations appear in the UI:

| Screen | eGov Service | UI Component | User Action |
|--------|-------------|--------------|-------------|
| Home | — | Header + greeting | Display authenticated user name |
| Home | eGov AI | "Ask eAbot" tile | Tap → opens AI chat |
| Home | COMPASS | Budget insight card | Passive display |
| Login | eGov SSO | Login button | Redirect to SSO |
| Digital ID | eVerify + Face Liveness | ID card + verify button | Progressive verification |
| Payment | eGovPay | Payment summary → hosted page | Create → redirect → confirm |
| Notifications | eMessage | Toast/banner confirmations | After payment/action |
| Reports | eReport | Report form + submit | Category → description → submit |
| AI Chat | eGov AI | Chat interface | Type message → get response |
| Account | eGov SSO | Logout button | Clear session |

---

## 9. Motion Specification

| Interaction | Duration | Easing | Properties |
|-------------|----------|--------|------------|
| Page entry | 160–220ms | ease-out | opacity, translateY(6px) |
| Button press | immediate | — | opacity: 0.85 or bg change |
| Carousel slide | 220–280ms | ease-in-out | translateX |
| Modal/sheet open | 240–300ms | ease-out | translateY, opacity |
| Number update | 300ms | ease-in-out | scale or countup |

**Rules:**
- GPU-only: `transform` and `opacity`
- Respect `prefers-reduced-motion: reduce` → instant transitions
- No confetti, bouncing, parallax, or continuous decorative animation

---

## 10. Accessibility in Design

| Requirement | Implementation |
|-------------|---------------|
| Touch targets | ≥ 44×44px (prefer 48px) |
| Text contrast | 4.5:1 (body) / 3:1 (large text) |
| Focus visible | 3px blue ring on keyboard focus |
| Status indication | Icon + label + color (never color alone) |
| Nav labels | Always visible text (never icon-only) |
| Carousel | Buttons with labels like "Show banner 2 of 3" |
| Modals | Focus trap + Escape + restore focus |
| Zoom | Functional at 200% / 320px minimum |
| Images | Decorative = `alt=""`; informational = descriptive alt |

---

## 11. Design Decision Tiebreaker

When visual judgment is ambiguous, choose the option that is:

1. **Whiter** (more white space)
2. **Lighter** (font weight)
3. **Smaller** (radius)
4. **Lower** (shadow)
5. **Shorter** (copy)
6. **More compact** (height)
7. **Closer to the reference** (eGov screenshot proportions)

---

*End of Design System document.*
