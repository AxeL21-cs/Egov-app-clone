# eGovPH Front-End Architecture

> **Version:** 1.0  
> **Last updated:** 22 July 2026  
> **Stack:** React 18 + Vite + CSS Modules / CSS Variables  
> **Target:** Mobile-first SPA (320–500 px primary), centered on larger viewports  

---

## 1. Project Structure

```
src/
├── main.jsx                    → App entry point, renders <App />
├── App.jsx                     → Root component, routing, layout shell
├── styles.css                  → Global styles, CSS variables, resets
│
├── assets/                     → Static assets (SVGs, images, icons)
│   ├── icons/
│   │   ├── home.svg
│   │   ├── scan-qr.svg
│   │   ├── digital-id.svg
│   │   ├── history.svg
│   │   └── account.svg
│   ├── images/
│   │   ├── egov-logo.svg
│   │   ├── campaign-etravel.png
│   │   └── weather-icons/
│   └── illustrations/
│
├── components/                 → Reusable UI components
│   ├── common/                 → Generic building blocks
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Modal.jsx
│   │   ├── SearchBar.jsx
│   │   ├── Badge.jsx
│   │   ├── Avatar.jsx
│   │   ├── Spinner.jsx
│   │   ├── ErrorBoundary.jsx
│   │   └── SkipLink.jsx
│   │
│   ├── layout/                 → Structural components
│   │   ├── AppShell.jsx        → Main layout wrapper
│   │   ├── BottomNav.jsx       → Fixed bottom navigation
│   │   ├── Header.jsx          → Identity header row
│   │   └── SafeArea.jsx        → Safe-area inset wrapper
│   │
│   ├── home/                   → Home screen sections
│   │   ├── ContextStrip.jsx    → Location + date row
│   │   ├── CategoryRail.jsx    → Horizontal scrolling categories
│   │   ├── CampaignBanner.jsx  → Rotating announcement cards
│   │   ├── ContextCards.jsx    → Weather + feature cards grid
│   │   └── FeaturedServices.jsx → National/Local tabbed services
│   │
│   ├── services/               → Service interaction components
│   │   ├── ServiceCard.jsx     → Individual service entry
│   │   ├── ServiceModal.jsx    → Detail sheet with continue action
│   │   └── ServiceList.jsx     → Filtered list of services
│   │
│   ├── digital-id/             → Digital ID components
│   │   ├── IDCard.jsx          → Credential display card
│   │   └── IDReveal.jsx        → Mask/reveal toggle
│   │
│   ├── payment/                → eGovPay flow components
│   │   ├── PaymentSummary.jsx
│   │   ├── PaymentStatus.jsx
│   │   └── PaymentReturn.jsx
│   │
│   └── ai/                     → eGov AI assistant
│       ├── ChatBubble.jsx
│       ├── ChatInput.jsx
│       └── AIAssistant.jsx
│
├── pages/                      → Route-level page components
│   ├── HomePage.jsx
│   ├── ScanQRPage.jsx
│   ├── DigitalIDPage.jsx
│   ├── HistoryPage.jsx
│   ├── AccountPage.jsx
│   └── NotFoundPage.jsx
│
├── hooks/                      → Custom React hooks
│   ├── useServices.js          → Service data fetching/filtering
│   ├── useSearch.js            → Search state and debouncing
│   ├── useAuth.js              → Auth state management
│   ├── usePayment.js           → Payment flow state
│   ├── useReducedMotion.js     → prefers-reduced-motion detection
│   └── useKeyboardShortcut.js  → Ctrl+K, Escape bindings
│
├── services/                   → API communication layer
│   ├── api.js                  → Main API client with mock branching
│   ├── mocks/                  → Mock response data
│   │   ├── services.json
│   │   ├── categories.json
│   │   ├── payment.json
│   │   └── ai-chat.json
│   └── constants.js            → API route constants
│
├── context/                    → React Context providers
│   ├── AuthContext.jsx         → User authentication state
│   ├── NavigationContext.jsx   → Active tab state
│   └── ThemeContext.jsx        → (future) dark mode support
│
└── utils/                      → Pure utility functions
    ├── format.js               → Date, currency formatting
    ├── validators.js           → Input validation helpers
    ├── storage.js              → localStorage wrapper (history)
    └── a11y.js                 → Focus trap, screen reader utils
```

---

## 2. Component Hierarchy

```
<App>
  <ErrorBoundary>
    <AuthContext.Provider>
      <NavigationContext.Provider>
        <AppShell>
          <SkipLink />
          <SafeArea>
            {/* Active page based on navigation state */}
            <HomePage />        ─┐
            <ScanQRPage />       │  Only one renders at a time
            <DigitalIDPage />    │  (simple state-based routing,
            <HistoryPage />      │   no react-router needed for 5 tabs)
            <AccountPage />     ─┘
          </SafeArea>
          <BottomNav />         {/* Fixed, always visible */}
        </AppShell>
      </NavigationContext.Provider>
    </AuthContext.Provider>
  </ErrorBoundary>
</App>
```

### HomePage Detail:
```
<HomePage>
  <Header />                    → Logo + greeting + avatar
  <ContextStrip />              → Location icon + date
  <SearchBar />                 → Service search input
  <CategoryRail />              → Horizontal scrolling icons
  <CampaignBanner />            → Auto-rotating cards
  <ContextCards />              → Weather + eTrabaho + eGov AI
  <FeaturedServices />          → Tabs (National/Local) + ServiceList
  <ServiceModal />              → Conditionally rendered overlay
</HomePage>
```

---

## 3. State Management Strategy

| Concern | Approach | Reason |
|---------|----------|--------|
| Active navigation tab | `NavigationContext` | Shared across AppShell and BottomNav |
| Auth state | `AuthContext` | SSO login status, demo user profile |
| Search query | Local state in `HomePage` | Only relevant to home screen |
| Category filter | Local state in `HomePage` | Same as search |
| Service modal | Local state in `HomePage` | Open/close + selected service |
| Payment flow | `usePayment` hook | Multi-step state machine |
| History entries | `localStorage` via `useServices` | Non-sensitive prototype data |
| AI chat messages | Local state in `AIAssistant` | Session-scoped conversation |

**Rule:** No global state library (Redux, Zustand) unless complexity demands it. Context + hooks are sufficient for this prototype.

---

## 4. Routing Strategy

Since the app has only 5 primary destinations (all bottom-nav tabs), use a lightweight state-based approach:

```jsx
// context/NavigationContext.jsx
const TABS = ['home', 'scan-qr', 'digital-id', 'history', 'account'];

function NavigationProvider({ children }) {
  const [activeTab, setActiveTab] = useState('home');
  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab, TABS }}>
      {children}
    </NavigationContext.Provider>
  );
}
```

```jsx
// components/layout/AppShell.jsx
function AppShell({ children }) {
  const { activeTab } = useNavigation();
  const pages = {
    'home': <HomePage />,
    'scan-qr': <ScanQRPage />,
    'digital-id': <DigitalIDPage />,
    'history': <HistoryPage />,
    'account': <AccountPage />,
  };
  return (
    <main role="main" aria-label="eGovPH Services">
      {pages[activeTab] || <NotFoundPage />}
    </main>
  );
}
```

---

## 5. Design Token System

```css
/* src/styles.css — Root variables */
:root {
  /* Colors */
  --color-primary: #064ED8;
  --color-primary-dark: #06338F;
  --color-primary-soft: #EAF2FF;
  --color-accent-yellow: #F7C928;
  --color-accent-red: #E43D4E;
  --color-ink: #141B2B;
  --color-muted: #637087;
  --color-divider: #DFE6F1;
  --color-surface: #FFFFFF;
  --color-background: #F8FAFC;

  /* Typography */
  --font-family: 'Poppins', system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;    /* 12px */
  --font-size-sm: 0.875rem;   /* 14px */
  --font-size-base: 1rem;     /* 16px */
  --font-size-lg: 1.125rem;   /* 18px */
  --font-size-xl: 1.25rem;    /* 20px */
  --font-size-2xl: 1.5rem;    /* 24px */

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;

  /* Layout */
  --gutter: 20px;
  --max-width: 500px;
  --nav-height: 64px;
  --search-height: 52px;
  --target-min: 44px;
  --target-preferred: 48px;

  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 14px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-nav: 0 -2px 12px rgba(0, 0, 0, 0.08);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-modal: 0 -4px 24px rgba(0, 0, 0, 0.12);

  /* Safe areas */
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left: env(safe-area-inset-left, 0px);
  --safe-right: env(safe-area-inset-right, 0px);
}
```

---

## 6. Component Specifications

### 6.1 BottomNav

```jsx
// components/layout/BottomNav.jsx
const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'scan-qr', label: 'Scan QR', icon: ScanQRIcon },
  { id: 'digital-id', label: 'Digital ID', icon: DigitalIDIcon, raised: true },
  { id: 'history', label: 'History', icon: HistoryIcon },
  { id: 'account', label: 'Account', icon: AccountIcon },
];
```

**Requirements:**
- Fixed to viewport bottom with `position: fixed`
- Respects `--safe-bottom` for home indicator
- Each item: minimum 44x44 px target
- Digital ID: raised circular blue button, visually centered
- Active state: blue icon + label + soft-blue indicator dot
- `aria-current="page"` on active item
- `role="navigation"` with `aria-label="Main navigation"`

### 6.2 SearchBar

**Requirements:**
- Height: 52px (meets 44px minimum with padding)
- White outlined field with trailing search icon
- Placeholder: "Search services like National ID"
- Clear focus ring: 2px solid `--color-primary`
- `Ctrl/Cmd+K` shortcut focuses this input
- Debounced input (300ms) before filtering
- `role="search"` on container; `aria-label` on input

### 6.3 ServiceModal

**Requirements:**
- Slide-up sheet from bottom (respects `prefers-reduced-motion`)
- Focus trapped within modal when open
- Close with Escape key
- Close with backdrop click
- Returns focus to trigger element on close
- Contains: service icon, title, description, trust notice, "Continue" button
- `role="dialog"` with `aria-modal="true"` and `aria-labelledby`

### 6.4 CategoryRail

**Requirements:**
- Horizontal scroll container (only allowed horizontal scroll on page)
- Circular pale-blue icon containers (48px diameter)
- Labels below each icon
- "Report" may carry a red "New" badge
- `role="list"` with `role="listitem"` children
- Scroll snapping for clean alignment
- No scrollbar visible (hide with CSS)

---

## 7. API Communication Layer

```javascript
// src/services/api.js
const API_MODE = import.meta.env.VITE_API_MODE;
const BASE = import.meta.env.VITE_EABOT_API_BASE_URL || '/api';

async function request(path, options = {}) {
  if (API_MODE === 'mock') {
    return loadMock(path, options.method);
  }

  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new ApiError(response.status, error.error || 'Request failed', error.details);
  }

  return response.json();
}

// Exported service methods
export const api = {
  // Payment
  createPayment: () => request('/egovpay/create', { method: 'POST' }),
  getPaymentStatus: (uuid) => request(`/egovpay/status?uuid=${uuid}`),

  // AI Assistant
  chatAI: (messages, context) => request('/egov-ai/chat', {
    method: 'POST',
    body: { messages, context },
  }),

  // Identity
  verifyIdentity: (data) => request('/everify/verify', { method: 'POST', body: data }),
  checkLiveness: (image) => request('/face-liveness/check', { method: 'POST', body: { image } }),

  // Notifications
  sendMessage: (data) => request('/emessage/send', { method: 'POST', body: data }),

  // Reporting
  submitReport: (report) => request('/ereport/submit', { method: 'POST', body: report }),

  // Auth
  login: () => request('/auth/login', { method: 'POST' }),
  verifyAuth: () => request('/auth/verify'),
};
```

---

## 8. Accessibility Implementation

### 8.1 Skip Link
```jsx
// First focusable element in the app
<a href="#main-content" className="skip-link">
  Skip to main content
</a>
```

### 8.2 Focus Management
```javascript
// hooks/useFocusTrap.js
export function useFocusTrap(ref, isActive) {
  useEffect(() => {
    if (!isActive || !ref.current) return;
    const focusable = ref.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    // Trap focus within modal...
  }, [isActive]);
}
```

### 8.3 Reduced Motion
```javascript
// hooks/useReducedMotion.js
export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  // Listen for changes...
  return reduced;
}
```

---

## 9. Performance Guidelines

| Concern | Strategy |
|---------|----------|
| Bundle size | Tree-shake unused code; no heavy libraries |
| Images | Use SVG for icons; lazy-load campaign images |
| Fonts | Preload Poppins (400, 500, 600 weights only) |
| Rendering | Avoid unnecessary re-renders; memoize service lists |
| Search | Debounce 300ms; filter client-side from loaded data |
| Animations | GPU-accelerated transforms only |
| Code splitting | Consider lazy-loading non-home pages |

**Target:** Lighthouse Performance score > 90; TTI < 3s on 4G.

---

## 10. Build Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,       // No sourcemaps in production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000', // Local Vercel dev
    },
  },
});
```

---

*End of Front-End Architecture document.*
