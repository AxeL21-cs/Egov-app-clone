import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BadgeHelp,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CloudSun,
  FileClock,
  FileText,
  Grid2X2,
  HeartPulse,
  History,
  Home,
  Hospital,
  Landmark,
  Languages,
  MapPin,
  Moon,
  Plane,
  QrCode,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Store,
  UserRound,
  WalletCards,
  X,
} from 'lucide-react';

const serviceCategories = [
  { id: 'ngas', label: 'NGAs', icon: Landmark },
  { id: 'lgus', label: 'LGUs', icon: Building2 },
  { id: 'travel', label: 'Travel', icon: Plane },
  { id: 'health', label: 'Health', icon: HeartPulse },
  { id: 'report', label: 'Report', icon: ShieldAlert, badge: 'New' },
  { id: 'jobs', label: 'Jobs', icon: BriefcaseBusiness },
];

const services = [
  { id: 1, title: 'National ID', short: 'View your digital PhilSys ID and identity details.', category: 'ngas', icon: WalletCards, tone: 'blue' },
  { id: 2, title: 'NBI Clearance', short: 'Apply for or renew your clearance online.', category: 'ngas', icon: ShieldCheck, tone: 'yellow' },
  { id: 3, title: 'Birth Certificate', short: 'Request PSA civil registry documents.', category: 'ngas', icon: FileText, tone: 'red' },
  { id: 4, title: 'Pag-IBIG Services', short: 'Access contributions, loans, and membership records.', category: 'ngas', icon: Home, tone: 'blue' },
  { id: 5, title: 'Pasig City Services', short: 'Local permits, taxes, and community assistance.', category: 'lgus', icon: Building2, tone: 'green' },
  { id: 6, title: 'eTravel', short: 'Submit your Philippine travel declaration.', category: 'travel', icon: Plane, tone: 'blue' },
  { id: 7, title: 'Health Facility Finder', short: 'Locate verified hospitals and health centers.', category: 'health', icon: Hospital, tone: 'green' },
  { id: 8, title: 'eReport', short: 'Report a public safety or community concern.', category: 'report', icon: ShieldAlert, tone: 'red' },
  { id: 9, title: 'eTrabaho', short: 'Find government-verified work opportunities.', category: 'jobs', icon: BriefcaseBusiness, tone: 'yellow' },
  { id: 10, title: 'Business Name Registration', short: 'Start and manage a sole proprietorship.', category: 'ngas', icon: Store, tone: 'blue' },
];

const banners = [
  {
    eyebrow: 'eTravel',
    title: 'Your journey starts with one form.',
    body: 'Complete your Philippine travel declaration before you fly.',
    action: 'Open eTravel',
    variant: 'travel',
    icon: Plane,
  },
  {
    eyebrow: 'Bagong Pilipinas',
    title: 'Public services, made simpler.',
    body: 'Find national and local services from one secure place.',
    action: 'Browse services',
    variant: 'services',
    icon: Landmark,
  },
  {
    eyebrow: 'eGov AI',
    title: 'Ask. Understand. Get it done.',
    body: 'Get clear guidance for common government transactions.',
    action: 'Ask eGov AI',
    variant: 'ai',
    icon: Sparkles,
  },
];

const navItems = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'scan', label: 'Scan QR', icon: ScanLine },
  { id: 'id', label: 'Digital ID', icon: WalletCards, primary: true },
  { id: 'history', label: 'History', icon: FileClock },
  { id: 'account', label: 'Account', icon: Grid2X2 },
];

const localServices = [
  { id: 'l1', title: 'Business Permit', short: 'Renew or apply through the Pasig City portal.', category: 'lgus', icon: Store, tone: 'blue' },
  { id: 'l2', title: 'Community Tax', short: 'Request a community tax certificate online.', category: 'lgus', icon: FileText, tone: 'yellow' },
  { id: 'l3', title: 'Health Center', short: 'Find schedules and book eligible services.', category: 'health', icon: Hospital, tone: 'green' },
  { id: 'l4', title: 'City Help Desk', short: 'Raise and track a local service request.', category: 'report', icon: BadgeHelp, tone: 'red' },
];

function Brand() {
  return (
    <div className="brand" aria-label="eGovPH">
      <span>eG</span><i>O</i><span>V</span><small>PH</small>
    </div>
  );
}

function ReferenceCrop({ viewBox, className = '' }) {
  return (
    <svg className={className} viewBox={viewBox} aria-hidden="true" focusable="false">
      <image href="/egov-reference.jpg" width="920" height="2048" />
    </svg>
  );
}

function BannerArtwork({ variant }) {
  if (variant === 'travel') {
    return (
      <div className="banner-art travel-art" aria-hidden="true">
        <div className="sun-disc" />
        <Plane className="flying-plane" />
        <div className="passport"><span>PH</span><div /></div>
        <div className="phone"><div className="phone-screen"><QrCode /><span>eTravel</span></div></div>
      </div>
    );
  }
  if (variant === 'services') {
    return (
      <div className="banner-art services-art" aria-hidden="true">
        <div className="orbit orbit-one"><Building2 /></div>
        <div className="orbit orbit-two"><HeartPulse /></div>
        <div className="center-seal"><Landmark /></div>
      </div>
    );
  }
  return (
    <div className="banner-art ai-art" aria-hidden="true">
      <div className="ai-phone"><Sparkles /><span>Kamusta!</span><i /></div>
      <div className="chat-bubble bubble-one">How can I help?</div>
      <div className="chat-bubble bubble-two">Salamat!</div>
    </div>
  );
}

function ServiceIcon({ service, compact = false }) {
  const Icon = service.icon;
  return <span className={`service-icon ${service.tone} ${compact ? 'compact' : ''}`}><Icon /></span>;
}

function ServiceModal({ service, onClose, onProceed }) {
  if (!service) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section className="service-modal" role="dialog" aria-modal="true" aria-labelledby="service-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="icon-button modal-close" type="button" onClick={onClose} aria-label="Close service details"><X /></button>
        <ServiceIcon service={service} />
        <p className="modal-kicker">Government service</p>
        <h2 id="service-title">{service.title}</h2>
        <p>{service.short}</p>
        <div className="trust-note"><ShieldCheck /><span>You’ll continue through a secure government service portal.</span></div>
        <button className="primary-button" type="button" onClick={() => onProceed(service)}>Continue to service <ChevronRight /></button>
      </section>
    </div>
  );
}

function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`} role="status"><ShieldCheck />{message}</div>;
}

function HomeScreen({ onOpenService, historyCount, onNavigate }) {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [slide, setSlide] = useState(0);
  const [featuredTab, setFeaturedTab] = useState('national');
  const searchRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setSlide((current) => (current + 1) % banners.length), 7000);
    return () => window.clearInterval(timer);
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return services.filter((service) => {
      const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
      const matchesQuery = !normalized || `${service.title} ${service.short}`.toLowerCase().includes(normalized);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, query]);

  const selectCategory = (id) => {
    setActiveCategory((current) => current === id ? 'all' : id);
    window.setTimeout(() => document.getElementById('service-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  };

  const visibleFeatured = featuredTab === 'national' ? services.slice(0, 4) : localServices;
  const banner = banners[slide];

  return (
    <main className="home-screen screen-enter">
      <section className="top-panel">
        <div className="mobile-brand-row">
          <Brand />
          <div className="mobile-welcome">
            <strong>Mabuhay, ZARRAH</strong>
            <span>Welcome to eGovPH</span>
          </div>
          <button className="profile-button" type="button" onClick={() => onNavigate('account')} aria-label="Open account">
            <ReferenceCrop className="reference-avatar" viewBox="772 136 105 106" />
          </button>
        </div>

        <header className="welcome-row">
          <div>
            <p className="eyebrow">Good evening</p>
            <h1>Mabuhay, <span>Zarrah!</span></h1>
            <p>What can we help you with today?</p>
          </div>
          <div className="desktop-profile">
            <span className="avatar">ZM</span>
            <div><b>Zarrah M.</b><small>Verified account</small></div>
          </div>
        </header>

        <div className="context-bar">
          <div><Moon /><span>Pasig City, Metro Manila</span></div>
          <div><CalendarDays /><span>Tue · Jul 21, 2026</span></div>
        </div>

        <form className="search-box" onSubmit={(event) => { event.preventDefault(); document.getElementById('service-results')?.scrollIntoView({ behavior: 'smooth' }); }}>
          <Search />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search government services" placeholder="Search services like National ID" />
          {query && <button type="button" onClick={() => setQuery('')} aria-label="Clear search"><X /></button>}
          <span className="search-shortcut" aria-hidden="true">⌘ K</span>
        </form>
      </section>

      <section className="category-section" aria-labelledby="categories-heading">
        <div className="section-heading compact-heading">
          <div><p className="eyebrow">Quick access</p><h2 id="categories-heading">Browse by category</h2></div>
          {activeCategory !== 'all' && <button type="button" className="text-button" onClick={() => setActiveCategory('all')}>Clear filter</button>}
        </div>
        <div className="category-scroller">
          {serviceCategories.map((category) => {
            const Icon = category.icon;
            const isActive = activeCategory === category.id;
            return (
              <button key={category.id} type="button" className={`category-button ${isActive ? 'active' : ''}`} onClick={() => selectCategory(category.id)} aria-pressed={isActive}>
                <span className="category-orb"><Icon />{category.badge && <em>{category.badge}</em>}</span>
                <span>{category.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={`hero-banner ${banner.variant}`} aria-roledescription="carousel" aria-label="Featured announcements">
        {slide === 0 ? (
          <button className="reference-banner-button" type="button" onClick={() => onOpenService(services.find((item) => item.id === 6))} aria-label="Open eTravel">
            <ReferenceCrop className="reference-banner" viewBox="50 804 820 270" />
          </button>
        ) : (
          <>
            <div className="banner-copy" key={`${banner.variant}-copy`}>
              <p className="eyebrow">{banner.eyebrow}</p>
              <h2>{banner.title}</h2>
              <p>{banner.body}</p>
              <button type="button" onClick={() => searchRef.current?.focus()}>{banner.action}<ChevronRight /></button>
            </div>
            <BannerArtwork variant={banner.variant} />
          </>
        )}
        <button className="carousel-arrow previous" type="button" aria-label="Previous announcement" onClick={() => setSlide((slide - 1 + banners.length) % banners.length)}><ChevronLeft /></button>
        <button className="carousel-arrow next" type="button" aria-label="Next announcement" onClick={() => setSlide((slide + 1) % banners.length)}><ChevronRight /></button>
        <div className="carousel-dots" aria-hidden="true">
          {Array.from({ length: 15 }, (_, index) => <span key={index} className={index === slide ? 'current' : ''} />)}
        </div>
      </section>

      <section className="insight-grid" aria-label="Daily information and shortcuts">
        <article className="weather-card">
          <div className="weather-copy"><CloudSun /><p><strong>26°</strong><span>Pasig</span><small>Partly cloudy</small></p></div>
          <div className="weather-detail"><span>Rain<br/><b>24%</b></span><span>Humidity<br/><b>78%</b></span></div>
        </article>
        <button className="shortcut-card trabaho" type="button" onClick={() => onOpenService(services.find((item) => item.id === 9))}>
          <ReferenceCrop className="reference-tile" viewBox="478 1172 393 202" />
        </button>
        <button className="shortcut-card ai" type="button" onClick={() => onOpenService({ title: 'eGov AI', short: 'Ask questions and get step-by-step guidance for government services.', icon: Sparkles, tone: 'green' })}>
          <ReferenceCrop className="reference-tile" viewBox="478 1392 393 202" />
        </button>
        <button className="shortcut-card activity" type="button" onClick={() => onNavigate('history')}>
          <span><small>Recent activity</small><strong>{historyCount || 'No'} transaction{historyCount === 1 ? '' : 's'}</strong><em>View history</em></span><History />
        </button>
      </section>

      {(query || activeCategory !== 'all') && (
        <section id="service-results" className="results-section" aria-live="polite">
          <div className="section-heading"><div><p className="eyebrow">Search results</p><h2>{results.length} service{results.length === 1 ? '' : 's'} found</h2></div></div>
          {results.length ? <div className="service-grid">{results.map((service) => <ServiceCard key={service.id} service={service} onOpen={onOpenService} />)}</div> : <div className="empty-state"><Search /><h3>No matching services</h3><p>Try a broader keyword or clear the category filter.</p><button className="secondary-button" type="button" onClick={() => { setQuery(''); setActiveCategory('all'); }}>Clear search</button></div>}
        </section>
      )}

      <section className="featured-section" id="featured-services">
        <div className="section-heading">
          <div><p className="eyebrow">One government, one app</p><h2>Featured eGovPH services</h2></div>
          <button type="button" className="text-button" onClick={() => { setQuery(''); setActiveCategory('all'); searchRef.current?.focus(); }}>View all <ChevronRight /></button>
        </div>
        <div className="segmented-control" role="tablist" aria-label="Service scope">
          <button type="button" role="tab" aria-selected={featuredTab === 'national'} className={featuredTab === 'national' ? 'selected' : ''} onClick={() => setFeaturedTab('national')}>National</button>
          <button type="button" role="tab" aria-selected={featuredTab === 'local'} className={featuredTab === 'local' ? 'selected' : ''} onClick={() => setFeaturedTab('local')}>Local</button>
        </div>
        <div className="service-grid">
          {visibleFeatured.map((service) => <ServiceCard key={service.id} service={service} onOpen={onOpenService} />)}
        </div>
      </section>
    </main>
  );
}

function ServiceCard({ service, onOpen }) {
  return (
    <button className="service-card" type="button" onClick={() => onOpen(service)}>
      <ServiceIcon service={service} compact />
      <span><strong>{service.title}</strong><small>{service.short}</small></span>
      <ChevronRight className="card-arrow" />
    </button>
  );
}

function ScanScreen({ onNavigate }) {
  const [scanning, setScanning] = useState(false);
  return (
    <main className="utility-screen screen-enter">
      <div className="utility-header"><p className="eyebrow">Secure scanner</p><h1>Scan a government QR</h1><p>Place the code inside the frame to verify or open a service.</p></div>
      <section className={`scanner-card ${scanning ? 'scanning' : ''}`}>
        <div className="scanner-window"><span/><span/><span/><span/><QrCode />{scanning && <i />}</div>
        <p>{scanning ? 'Looking for a QR code…' : 'Camera preview demo'}</p>
        <button className="primary-button" type="button" onClick={() => setScanning(!scanning)}>{scanning ? 'Stop scanning' : 'Start scanner'}<ScanLine /></button>
      </section>
      <button className="secondary-button" type="button" onClick={() => onNavigate('home')}>Back to home</button>
    </main>
  );
}

function DigitalIDScreen() {
  const [revealed, setRevealed] = useState(false);
  return (
    <main className="utility-screen id-screen screen-enter">
      <div className="utility-header"><p className="eyebrow">Verified identity</p><h1>My Digital ID</h1><p>Use this secure preview when a participating agency asks for identification.</p></div>
      <section className="digital-id-card">
        <div className="id-watermark">PILIPINAS</div>
        <div className="id-top"><Brand /><ShieldCheck /></div>
        <div className="id-person"><span className="avatar large">ZM</span><div><small>Full name</small><h2>Zarrah Mae Mercado</h2><span>Filipino · Verified</span></div></div>
        <div className="id-number"><small>PhilSys Card Number</small><strong>{revealed ? '1234 5678 9012' : '•••• •••• 9012'}</strong></div>
        <div className="id-footer"><span>Valid digital credential</span><QrCode /></div>
      </section>
      <button className="primary-button" type="button" onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide ID number' : 'Reveal ID number'}<ShieldCheck /></button>
      <p className="privacy-note"><ShieldCheck /> Your ID details stay on this device in this prototype.</p>
    </main>
  );
}

function HistoryScreen({ history, onOpenService }) {
  return (
    <main className="utility-screen wide-utility screen-enter">
      <div className="utility-header"><p className="eyebrow">Activity log</p><h1>Transaction history</h1><p>Your recently opened services appear here.</p></div>
      {history.length ? <div className="history-list">{history.map((entry) => <button type="button" key={entry.key} onClick={() => onOpenService(entry.service)}><ServiceIcon service={entry.service} compact/><span><strong>{entry.service.title}</strong><small>{entry.date}</small></span><ChevronRight /></button>)}</div> : <div className="empty-state"><History/><h3>No activity yet</h3><p>Services you open will be saved here for easy reference.</p></div>}
    </main>
  );
}

function AccountScreen() {
  const [language, setLanguage] = useState('English');
  const [alerts, setAlerts] = useState(true);
  return (
    <main className="utility-screen wide-utility screen-enter">
      <div className="account-hero"><span className="avatar xl">ZM</span><div><p className="eyebrow">Verified citizen</p><h1>Zarrah Mae Mercado</h1><p>zarrah@example.com</p></div><ShieldCheck /></div>
      <section className="account-settings">
        <h2>Preferences</h2>
        <label><span><Languages/><span><strong>Language</strong><small>Choose your preferred language</small></span></span><select value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Filipino</option><option>Cebuano</option></select></label>
        <label><span><Bell/><span><strong>Service alerts</strong><small>Important reminders and updates</small></span></span><input type="checkbox" checked={alerts} onChange={(event) => setAlerts(event.target.checked)} /></label>
        <button type="button"><span><CircleUserRound/><span><strong>Personal information</strong><small>Review your account details</small></span></span><ChevronRight/></button>
        <button type="button"><span><ShieldCheck/><span><strong>Privacy & security</strong><small>Manage credentials and permissions</small></span></span><ChevronRight/></button>
      </section>
      <p className="prototype-note">Prototype UI · No real personal or government data is stored.</p>
    </main>
  );
}

function Sidebar({ active, onNavigate }) {
  return (
    <aside className="desktop-sidebar">
      <Brand />
      <p className="sidebar-label">Citizen portal</p>
      <nav>{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} type="button" className={active === item.id ? 'active' : ''} onClick={() => onNavigate(item.id)}><Icon/><span>{item.label}</span>{item.id === 'id' && <em>Verified</em>}</button>; })}</nav>
      <div className="sidebar-help"><BadgeHelp/><strong>Need help?</strong><p>Get guidance on any service.</p><button type="button">Visit help center</button></div>
      <small>Secure connection <ShieldCheck/></small>
    </aside>
  );
}

function BottomNavigation({ active, onNavigate }) {
  return (
    <nav className="bottom-navigation" aria-label="Primary navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        return <button key={item.id} type="button" className={`${active === item.id ? 'active' : ''} ${item.primary ? 'primary-nav' : ''}`} onClick={() => onNavigate(item.id)} aria-current={active === item.id ? 'page' : undefined}><span><Icon /></span><small>{item.label}</small></button>;
      })}
    </nav>
  );
}

function hydrateHistory(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.map((entry) => {
    const knownService = [...services, ...localServices].find((service) => service.title === entry?.service?.title);
    const fallbackIcon = entry?.service?.title === 'eGov AI' ? Sparkles : FileText;
    return {
      ...entry,
      service: {
        ...entry.service,
        icon: knownService?.icon ?? fallbackIcon,
      },
    };
  }).filter((entry) => entry.service?.title);
}

export default function App() {
  const [activeScreen, setActiveScreen] = useState('home');
  const [selectedService, setSelectedService] = useState(null);
  const [toast, setToast] = useState('');
  const [history, setHistory] = useState(() => {
    try { return hydrateHistory(JSON.parse(window.localStorage.getItem('egov-history') || '[]')); } catch { return []; }
  });

  useEffect(() => {
    const handler = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setActiveScreen('home');
        window.setTimeout(() => document.querySelector('.search-box input')?.focus(), 80);
      }
      if (event.key === 'Escape') setSelectedService(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const navigate = (screen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const proceed = (service) => {
    const entry = { key: `${service.title}-${Date.now()}`, date: 'Opened just now', service };
    const next = [entry, ...history.filter((item) => item.service.title !== service.title)].slice(0, 8);
    setHistory(next);
    try { window.localStorage.setItem('egov-history', JSON.stringify(next)); } catch { /* private browsing fallback */ }
    setSelectedService(null);
    setToast(`${service.title} opened in demo mode`);
    window.setTimeout(() => setToast(''), 3200);
  };

  return (
    <div className="app-shell">
      <Sidebar active={activeScreen} onNavigate={navigate} />
      <div className="app-content">
        {activeScreen === 'home' && <HomeScreen onOpenService={setSelectedService} historyCount={history.length} onNavigate={navigate} />}
        {activeScreen === 'scan' && <ScanScreen onNavigate={navigate} />}
        {activeScreen === 'id' && <DigitalIDScreen />}
        {activeScreen === 'history' && <HistoryScreen history={history} onOpenService={setSelectedService} />}
        {activeScreen === 'account' && <AccountScreen />}
      </div>
      <BottomNavigation active={activeScreen} onNavigate={navigate} />
      <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} onProceed={proceed} />
      <Toast message={toast} />
    </div>
  );
}
