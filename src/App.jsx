import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Accessibility,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Bell,
  Bot,
  Building2,
  CalendarCheck2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  CloudOff,
  Coins,
  FileCheck2,
  FileText,
  Fingerprint,
  GraduationCap,
  HandHeart,
  HeartHandshake,
  Home,
  Info,
  Languages,
  LockKeyhole,
  MapPin,
  MessageCircle,
  Mic,
  Navigation,
  Phone,
  RefreshCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  UserRound,
  Users,
  Volume2,
  WalletCards,
  Waypoints,
  X,
} from 'lucide-react';

const DEMO_PROFILE = {
  name: 'Rosa Villanueva',
  shortName: 'Aling Rosa',
  age: 65,
  city: 'San Juan City',
  occupation: 'Food vendor',
  idSuffix: '0482',
};

const REQUIREMENTS = [
  {
    id: 'identity',
    title: 'Demo identity confirmed',
    detail: 'Synthetic profile only — no real National ID data used.',
    icon: Fingerprint,
  },
  {
    id: 'age',
    title: 'Age and residency matched',
    detail: 'Matched against the illustrative SocPen rule set.',
    icon: BadgeCheck,
  },
  {
    id: 'national-id',
    title: 'Identity document on file',
    detail: 'A mock document is attached to this demo journey.',
    icon: FileCheck2,
  },
  {
    id: 'indigency',
    title: 'Add proof of indigency',
    detail: 'Upload or request a Barangay Certificate of Indigency.',
    action: 'Use demo document',
    icon: FileText,
  },
  {
    id: 'contact',
    title: 'Confirm contact number',
    detail: 'Used for appointment updates and reminders.',
    action: 'Confirm demo number',
    icon: Phone,
  },
];

const SERVICES = [
  {
    id: 'birth-certificate',
    title: 'PSA Birth Certificate',
    agency: 'Philippine Statistics Authority',
    description: 'Build the right request path for a birth certificate copy.',
    meta: '4 guided steps',
    category: 'Dokumento',
    icon: FileText,
    color: 'blue',
  },
  {
    id: 'pwd-renewal',
    title: 'PWD ID Renewal',
    agency: 'Local Government Unit',
    description: 'Check local requirements before visiting your PDAO.',
    meta: '5 guided steps',
    category: 'LGU',
    icon: Accessibility,
    color: 'red',
  },
  {
    id: 'barangay-clearance',
    title: 'Barangay Clearance',
    agency: 'Barangay Services',
    description: 'Prepare identity and residency proof in the right order.',
    meta: '3 guided steps',
    category: 'LGU',
    icon: Building2,
    color: 'gold',
  },
  {
    id: 'business-permit',
    title: 'Business Permit',
    agency: 'Business Permits Office',
    description: 'See dependencies across barangay, zoning, and city permits.',
    meta: '8 guided steps',
    category: 'Negosyo',
    icon: Store,
    color: 'green',
  },
  {
    id: 'student-aid',
    title: 'Student Assistance',
    agency: 'Education and LGU programs',
    description: 'Explore illustrative aid programs that may fit your profile.',
    meta: 'Eligibility check',
    category: 'Benepisyo',
    icon: GraduationCap,
    color: 'blue',
  },
  {
    id: 'senior-services',
    title: 'Senior Citizen Services',
    agency: 'OSCA / DSWD',
    description: 'Navigate registrations, benefits, and supporting documents.',
    meta: 'Program guide',
    category: 'Benepisyo',
    icon: HeartHandshake,
    color: 'red',
  },
];

const NAV_ITEMS = [
  { id: 'home', label: 'Tahanan', icon: Home },
  { id: 'discover', label: 'Hanap', icon: Search },
  { id: 'assistant', label: 'eAbot AI', icon: Bot, primary: true },
  { id: 'journey', label: 'Lakbay', icon: Waypoints },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const QUICK_PROMPTS = [
  'Kwalipikado ba ako sa pension?',
  'Kailangan ko ng birth certificate',
  'Ano ang dadalhin ko sa Hub?',
];

const INITIAL_COMPLETED = ['identity', 'age', 'national-id'];

function safeRead(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function Brand({ compact = false }) {
  return (
    <div className={`brand-lockup ${compact ? 'compact' : ''}`} aria-label="eAbot">
      <span className="brand-mark" aria-hidden="true">
        <span className="brand-sun" />
        <span className="brand-path" />
      </span>
      <span className="brand-word">e<span>Abot</span></span>
    </div>
  );
}

function PrototypeBadge() {
  return (
    <span className="prototype-badge">
      <Sparkles aria-hidden="true" /> Hackathon prototype
    </span>
  );
}

function ProgressRing({ value, size = 'large' }) {
  return (
    <div
      className={`progress-ring ${size}`}
      style={{ '--progress': `${value * 3.6}deg` }}
      role="img"
      aria-label={`${value}% ready`}
    >
      <div>
        <strong>{value}%</strong>
        <span>handa</span>
      </div>
    </div>
  );
}

function StepDots({ step }) {
  return (
    <div className="step-dots" aria-label={`Step ${step + 1} of 3`}>
      {[0, 1, 2].map((index) => (
        <span key={index} className={index <= step ? 'active' : ''} />
      ))}
    </div>
  );
}

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [checking, setChecking] = useState(false);
  const [consent, setConsent] = useState(false);
  const [updates, setUpdates] = useState(true);

  const verifyDemoProfile = () => {
    setChecking(true);
    window.setTimeout(() => {
      setChecking(false);
      setStep(2);
    }, 850);
  };

  return (
    <main className="onboarding-shell">
      <div className="onboarding-pattern" aria-hidden="true" />
      <section className="onboarding-card">
        <header className="onboarding-header">
          <Brand />
          <PrototypeBadge />
        </header>

        {step === 0 && (
          <div className="onboarding-panel welcome-panel screen-enter">
            <div className="welcome-art" aria-hidden="true">
              <span className="art-sun" />
              <span className="art-path path-one" />
              <span className="art-path path-two" />
              <span className="art-person"><HandHeart /></span>
              <span className="art-check"><Check /></span>
            </div>
            <p className="eyebrow">Gobyernong lumalapit sa iyo</p>
            <h1>Hanapin. Gabayan. <span>Iabot.</span></h1>
            <p className="lead">
              Tinutulungan ka ng eAbot na malaman ang posibleng benepisyo, ayusin ang requirements,
              at maghanda bago pumunta sa government service hub.
            </p>
            <div className="promise-grid">
              <div><Sparkles /><span><strong>May para sa iyo?</strong> Tuklasin ang posibleng benepisyo.</span></div>
              <div><Waypoints /><span><strong>Hindi ka maliligaw.</strong> Isang malinaw na hakbang kada screen.</span></div>
              <div><CalendarCheck2 /><span><strong>Isang biyahe lang.</strong> Kumpleto bago pumunta sa Hub.</span></div>
            </div>
            <button className="primary-button full-width" onClick={() => setStep(1)}>
              Simulan ang guided demo <ArrowRight />
            </button>
            <p className="safety-copy"><ShieldCheck /> Demo data lamang. Walang tunay na government account na kailangan.</p>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-panel screen-enter">
            <button className="back-button" onClick={() => setStep(0)}><ArrowLeft /> Bumalik</button>
            <p className="eyebrow">Demo identity</p>
            <h1>Kilalanin natin si <span>Aling Rosa.</span></h1>
            <p className="lead compact-lead">Synthetic ang profile na ito para ligtas mong masubukan ang buong journey.</p>
            <article className="identity-card">
              <div className="identity-avatar">RV</div>
              <div>
                <span className="card-label">Demo citizen</span>
                <h2>{DEMO_PROFILE.name}</h2>
                <p>{DEMO_PROFILE.age} taong gulang · {DEMO_PROFILE.city}</p>
              </div>
              <Fingerprint aria-hidden="true" />
              <dl>
                <div><dt>Hanapbuhay</dt><dd>{DEMO_PROFILE.occupation}</dd></div>
                <div><dt>Demo ID</dt><dd>•••• {DEMO_PROFILE.idSuffix}</dd></div>
              </dl>
            </article>
            <div className="trust-panel">
              <ShieldCheck />
              <div><strong>Walang real PSN o password</strong><span>Ang official identity APIs ay future integration lamang.</span></div>
            </div>
            <button className="primary-button full-width" onClick={verifyDemoProfile} disabled={checking}>
              {checking ? <><span className="spinner" /> Sinusuri ang demo profile…</> : <>I-confirm ang demo profile <ArrowRight /></>}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-panel screen-enter">
            <button className="back-button" onClick={() => setStep(1)}><ArrowLeft /> Bumalik</button>
            <p className="eyebrow">Ikaw ang may kontrol</p>
            <h1>Payagan ang <span>benefit matching.</span></h1>
            <p className="lead compact-lead">Ginagamit lang ng prototype ang demo profile para magpatakbo ng malinaw at deterministic na sample rules.</p>
            <label className="consent-option required">
              <input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />
              <span className="custom-check"><Check /></span>
              <span><strong>Payag ako sa demo eligibility matching</strong><small>Kailangan ito para ipakita ang proactive discovery flow. Maaari itong bawiin sa Profile.</small></span>
            </label>
            <label className="consent-option">
              <input type="checkbox" checked={updates} onChange={(event) => setUpdates(event.target.checked)} />
              <span className="custom-check"><Check /></span>
              <span><strong>Ipakita ang sample SMS updates</strong><small>Preview lamang — walang aktuwal na mensaheng ipapadala.</small></span>
            </label>
            <div className="rule-note">
              <Info />
              <p><strong>AI is not the source of truth.</strong> Official, versioned program rules ang magpapasya; ipinapaliwanag lamang ito ng assistant.</p>
            </div>
            <button className="primary-button full-width" disabled={!consent} onClick={() => onComplete({ updates })}>
              Pumasok sa eAbot <ArrowRight />
            </button>
          </div>
        )}

        <StepDots step={step} />
      </section>
    </main>
  );
}

function TopBar({ activeScreen, onNavigate, onShowNotice }) {
  const activeLabel = NAV_ITEMS.find((item) => item.id === activeScreen)?.label;
  return (
    <header className="top-bar">
      <button className="mobile-brand" onClick={() => onNavigate('home')} aria-label="Go to eAbot home">
        <Brand compact />
      </button>
      <div className="desktop-page-title">
        <span>eAbot workspace</span>
        <strong>{activeLabel}</strong>
      </div>
      <div className="top-actions">
        <button className="notice-button" onClick={onShowNotice} aria-label="Show notifications">
          <Bell />
          <span>1</span>
        </button>
        <button className="avatar-button" onClick={() => onNavigate('profile')} aria-label="Open demo profile">RV</button>
      </div>
    </header>
  );
}

function Sidebar({ active, onNavigate, progress }) {
  return (
    <aside className="sidebar">
      <Brand />
      <PrototypeBadge />
      <nav aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={active === item.id ? 'active' : ''} onClick={() => onNavigate(item.id)} aria-current={active === item.id ? 'page' : undefined}>
              <Icon /> <span>{item.label}</span>
              {item.id === 'journey' && <em>{progress}%</em>}
            </button>
          );
        })}
      </nav>
      <article className="sidebar-journey">
        <span className="card-label">Aktibong lakbay</span>
        <strong>Social Pension</strong>
        <div className="mini-progress"><span style={{ width: `${progress}%` }} /></div>
        <p>{progress}% ready · {progress === 100 ? 'Ready for Hub request' : 'May susunod pang hakbang'}</p>
        <button onClick={() => onNavigate('journey')}>Ipagpatuloy <ChevronRight /></button>
      </article>
      <p className="sidebar-foot"><ShieldCheck /> Demo data only</p>
    </aside>
  );
}

function BottomNavigation({ active, onNavigate }) {
  return (
    <nav className="bottom-navigation" aria-label="Main navigation">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`${active === item.id ? 'active' : ''} ${item.primary ? 'primary-nav' : ''}`}
            onClick={() => onNavigate(item.id)}
            aria-current={active === item.id ? 'page' : undefined}
          >
            <span><Icon /></span>
            <small>{item.label}</small>
          </button>
        );
      })}
    </nav>
  );
}

function HomeScreen({ progress, completed, matching, onNavigate, onOpenBenefit, onSelectService, appointment }) {
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return needle ? SERVICES.filter((service) => `${service.title} ${service.agency}`.toLowerCase().includes(needle)) : SERVICES.slice(0, 4);
  }, [query]);
  const next = REQUIREMENTS.find((item) => !completed.includes(item.id));

  return (
    <div className="page home-page screen-enter">
      <section className="home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Magandang araw, {DEMO_PROFILE.shortName}</p>
          <h1>May tulong na puwedeng <span>umabot sa iyo.</span></h1>
          <p>Hindi mo kailangang kabisaduhin ang gobyerno. Sabihin lang ang goal mo, at aayusin natin ang susunod na hakbang.</p>
          <div className="hero-actions">
            <button className="primary-button" onClick={matching ? onOpenBenefit : () => onNavigate('profile')}>{matching ? 'Tingnan ang bagong tugma' : 'I-manage ang consent'} <ArrowRight /></button>
            <button className="secondary-button" onClick={() => onNavigate('assistant')}><Bot /> Magtanong kay eAbot</button>
          </div>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <span className="visual-sun" />
          <span className="visual-route route-a" />
          <span className="visual-route route-b" />
          <span className="visual-person"><HandHeart /></span>
          <span className="visual-card visual-card-one"><CheckCircle2 /> Natagpuan</span>
          <span className="visual-card visual-card-two"><Navigation /> Ginagabayan</span>
        </div>
      </section>

      <section className="stat-row" aria-label="Demo overview">
        <div><span className="stat-icon red"><Sparkles /></span><span><strong>{matching ? '1' : '0'}</strong><small>{matching ? 'bagong tugma' : 'matching paused'}</small></span></div>
        <div><span className="stat-icon blue"><Waypoints /></span><span><strong>{progress}%</strong><small>journey ready</small></span></div>
        <div><span className="stat-icon gold"><CalendarDays /></span><span><strong>{appointment ? '1' : '0'}</strong><small>Hub request</small></span></div>
      </section>

      <section className="content-grid two-column">
        {matching ? <article className="benefit-card">
          <div className="card-topline">
            <span className="new-match"><Sparkles /> Bagong tugma</span>
            <span className="source-chip">Demo rules v1.2</span>
          </div>
          <div className="benefit-icon"><Coins /></div>
          <p className="eyebrow">Posibleng kwalipikado</p>
          <h2>Social Pension for Indigent Senior Citizens</h2>
          <p>Batay sa edad, lokasyon, at synthetic demo profile ni Rosa.</p>
          <div className="match-reasons">
            <span><Check /> 60+ years old</span>
            <span><Check /> San Juan resident</span>
            <span><Check /> No pension in demo record</span>
          </div>
          <button className="text-link" onClick={onOpenBenefit}>Bakit ako na-match? <ArrowRight /></button>
        </article> : <article className="benefit-card matching-paused-card">
          <div className="benefit-icon"><ShieldCheck /></div>
          <p className="eyebrow">Matching paused</p>
          <h2>Walang profile matching habang naka-off ang consent.</h2>
          <p>Ikaw ang may kontrol. Maaari mo itong i-on ulit sa Profile kung gusto mong makita ang sample benefit discoveries.</p>
          <button className="text-link" onClick={() => onNavigate('profile')}>Buksan ang consent controls <ArrowRight /></button>
        </article>}

        <article className="journey-card">
          <div className="journey-card-head">
            <div>
              <span className="card-label">Aktibong lakbay</span>
              <h2>Social Pension Application</h2>
              <p>DSWD · San Juan pilot journey</p>
            </div>
            <ProgressRing value={progress} size="small" />
          </div>
          {progress < 100 ? (
            <div className="next-action">
              <span className="next-number">{completed.length + 1}</span>
              <span><small>Susunod mong gagawin</small><strong>{next?.title}</strong></span>
              <ChevronRight />
            </div>
          ) : (
            <div className="next-action ready">
              <span className="next-number"><Check /></span>
              <span><small>Ready for the next step</small><strong>Request a Serbisyo Hub slot</strong></span>
              <ChevronRight />
            </div>
          )}
          <button className="secondary-button full-width" onClick={() => onNavigate('journey')}>Ipagpatuloy ang journey <ArrowRight /></button>
        </article>
      </section>

      <section className="search-section">
        <div className="section-heading">
          <div><p className="eyebrow">Voluntary request</p><h2>Ano ang gusto mong ma-accomplish?</h2></div>
          <button className="text-link desktop-only-link" onClick={() => onNavigate('discover')}>Lahat ng serbisyo <ArrowRight /></button>
        </div>
        <label className="search-field">
          <Search />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hal. birth certificate, PWD ID…" />
          {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X /></button>}
        </label>
        <div className="service-preview-grid">
          {filtered.length ? filtered.map((service) => <ServiceCard key={service.id} service={service} onSelect={onSelectService} compact />) : (
            <div className="empty-state"><Search /><strong>Walang eksaktong tugma</strong><p>Subukang gumamit ng mas simpleng salita o magtanong kay eAbot.</p><button className="secondary-button" onClick={() => onNavigate('assistant')}>Magtanong kay eAbot</button></div>
          )}
        </div>
      </section>

      <section className="dont-return-banner">
        <div className="banner-seal"><ShieldCheck /></div>
        <div><p className="eyebrow">“Huwag Mo Akong Pabalikin” check</p><h2>Alamin kung kumpleto ka bago bumiyahe.</h2><p>Binubuksan lang ang Hub request kapag 100% ready ang requirements.</p></div>
        <button className="secondary-button" onClick={() => onNavigate('journey')}>I-check ang readiness <ArrowRight /></button>
      </section>
    </div>
  );
}

function ServiceCard({ service, onSelect, compact = false }) {
  const Icon = service.icon;
  return (
    <button className={`service-card ${compact ? 'compact' : ''}`} onClick={() => onSelect(service)}>
      <span className={`service-icon ${service.color}`}><Icon /></span>
      <span className="service-copy">
        <small>{service.agency}</small>
        <strong>{service.title}</strong>
        {!compact && <p>{service.description}</p>}
        <em>{service.meta}</em>
      </span>
      <ChevronRight />
    </button>
  );
}

function DiscoverScreen({ onSelectService, onAsk }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('Lahat');
  const categories = ['Lahat', 'Dokumento', 'Benepisyo', 'Negosyo', 'LGU'];
  const results = useMemo(() => {
    const needle = query.toLowerCase().trim();
    return SERVICES.filter((service) => {
      const matchesQuery = !needle || `${service.title} ${service.agency} ${service.description}`.toLowerCase().includes(needle);
      const matchesCategory = category === 'Lahat' || service.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [query, category]);

  return (
    <div className="page discover-page screen-enter">
      <header className="page-heading">
        <p className="eyebrow">Start with your goal</p>
        <h1>Hindi mo kailangang malaman ang <span>agency.</span></h1>
        <p>I-search ang dokumento, benepisyo, o goal. Si eAbot ang tutulong sa tamang sequence.</p>
      </header>
      <label className="search-field large">
        <Search />
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ano ang kailangan mo?" autoFocus />
        {query && <button onClick={() => setQuery('')} aria-label="Clear search"><X /></button>}
      </label>
      <div className="category-pills" aria-label="Service categories">
        {categories.map((item) => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}
      </div>
      <div className="assistant-callout">
        <span><Bot /></span>
        <div><strong>Hindi sigurado sa term?</strong><p>Sabihin sa Tagalog, English, o Taglish kung ano ang gusto mong mangyari.</p></div>
        <button onClick={() => onAsk(query || 'Tulungan mo akong hanapin ang tamang government service')}>Tanungin si eAbot <ArrowRight /></button>
      </div>
      <section className="service-list-section">
        <div className="section-heading"><div><p className="eyebrow">{category}</p><h2>{results.length} sample services</h2></div></div>
        <div className="service-list">
          {results.map((service) => <ServiceCard key={service.id} service={service} onSelect={onSelectService} />)}
        </div>
      </section>
    </div>
  );
}

function JourneyScreen({ completed, progress, onCompleteRequirement, busyRequirement, appointment, onSchedule, onReport }) {
  const nextRequirement = REQUIREMENTS.find((item) => !completed.includes(item.id));
  const currentIndex = nextRequirement ? REQUIREMENTS.findIndex((item) => item.id === nextRequirement.id) : REQUIREMENTS.length;

  return (
    <div className="page journey-page screen-enter">
      <header className="journey-header">
        <div>
          <span className={`status-pill ${progress === 100 ? 'ready' : ''}`}>{progress === 100 ? <CheckCircle2 /> : <Clock3 />}{progress === 100 ? 'Ready for visit request' : 'In progress'}</span>
          <p className="eyebrow">Social Pension journey</p>
          <h1>Isang malinaw na hakbang <span>sa bawat oras.</span></h1>
          <p>Hindi namin ipapakita ang buong government graph. Ang mahalaga: ano ang susunod mong gagawin.</p>
        </div>
        <ProgressRing value={progress} />
      </header>

      {progress < 100 ? (
        <section className="focus-action-card">
          <div className="focus-icon"><nextRequirement.icon /></div>
          <div>
            <p className="eyebrow">Gawin ito ngayon</p>
            <h2>{nextRequirement.title}</h2>
            <p>{nextRequirement.detail}</p>
          </div>
          <button className="primary-button" disabled={busyRequirement === nextRequirement.id} onClick={() => onCompleteRequirement(nextRequirement.id)}>
            {busyRequirement === nextRequirement.id ? <><span className="spinner" /> Sinusuri…</> : <>{nextRequirement.action} <ArrowRight /></>}
          </button>
        </section>
      ) : (
        <section className="focus-action-card complete">
          <div className="focus-icon"><ShieldCheck /></div>
          <div><p className="eyebrow">“Huwag Mo Akong Pabalikin” check</p><h2>Kumpleto ang iyong demo requirements.</h2><p>100% ready means ready to request a visit—not approved for the benefit.</p></div>
          <button className="primary-button" onClick={onSchedule}>{appointment ? 'Tingnan ang Hub request' : 'Mag-request ng Hub slot'} <CalendarCheck2 /></button>
        </section>
      )}

      <div className="journey-layout">
        <section className="requirements-panel">
          <div className="section-heading"><div><p className="eyebrow">Readiness checklist</p><h2>5 requirement checks</h2></div><span className="source-chip">Rules updated Jul 2026</span></div>
          <ol className="requirement-list">
            {REQUIREMENTS.map((item, index) => {
              const Icon = item.icon;
              const isComplete = completed.includes(item.id);
              const isCurrent = index === currentIndex;
              return (
                <li key={item.id} className={`${isComplete ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}>
                  <span className="requirement-state">{isComplete ? <Check /> : isCurrent ? <span>{index + 1}</span> : <LockKeyhole />}</span>
                  <span className="requirement-icon"><Icon /></span>
                  <span className="requirement-copy"><strong>{item.title}</strong><small>{item.detail}</small></span>
                  {isComplete && <span className="done-label">Tapos</span>}
                  {isCurrent && <span className="now-label">Ngayon</span>}
                </li>
              );
            })}
          </ol>
        </section>

        <aside className="journey-side">
          {appointment ? (
            <article className="appointment-card">
              <span className="appointment-icon"><CalendarCheck2 /></span>
              <p className="eyebrow">Hub request sent</p>
              <h2>{appointment.date}</h2>
              <p>{appointment.time} · San Juan Serbisyo Hub</p>
              <span className="pending-chip"><Clock3 /> Human confirmation pending</span>
              <small>Sample SMS preview is available in notifications.</small>
            </article>
          ) : (
            <article className="hub-preview-card">
              <div className="map-pattern" aria-hidden="true"><MapPin /></div>
              <p className="eyebrow">Nearest demo Hub</p>
              <h2>San Juan Serbisyo Hub</h2>
              <p><MapPin /> Pinaglabanan Street, San Juan City</p>
              <p><Clock3 /> Mon–Fri, 8:00 AM–5:00 PM</p>
              <span>{progress === 100 ? 'Ready to request a slot' : `Complete ${REQUIREMENTS.length - completed.length} more check${REQUIREMENTS.length - completed.length === 1 ? '' : 's'} to unlock`}</span>
            </article>
          )}
          <article className="problem-card">
            <span><CircleHelp /></span>
            <div><strong>Na-stuck ang journey?</strong><p>Gumawa ng structured complaint mula sa demo timeline.</p></div>
            <button onClick={onReport}>I-report ang problema <ArrowRight /></button>
          </article>
          <div className="truth-note"><ShieldCheck /><p><strong>Verified rules control status.</strong> Hindi maaaring baguhin ng chat assistant ang completion o dependencies.</p></div>
        </aside>
      </div>
    </div>
  );
}

function getAssistantReply(text) {
  const lower = text.toLowerCase();
  if (lower.includes('pension') || lower.includes('senior')) {
    return 'Batay sa demo profile ni Rosa, may posibleng tugma sa Social Pension. Hindi pa ito approval. Maaari kitang dalhin sa “Bakit ako na-match?” at sa 5-step readiness checklist.';
  }
  if (lower.includes('birth') || lower.includes('psa')) {
    return 'Para sa PSA Birth Certificate, bubuo tayo ng guided request: piliin ang purpose, i-confirm ang record details, tingnan ang sample fee, at piliin ang delivery o pickup. Demo sequence ito at walang totoong request na ipapadala.';
  }
  if (lower.includes('hub') || lower.includes('dalhin') || lower.includes('appointment')) {
    return 'Tatlong checks na ang kumpleto. Kailangan pa ang demo proof of indigency at confirmed contact number. Kapag 100% ready, saka lamang bubukas ang request para sa San Juan Serbisyo Hub.';
  }
  if (lower.includes('permit')) {
    return 'Aling permit ang ibig mong sabihin: Business Permit, Building Permit, o iba pa? Hindi ako manghuhula dahil magkaiba ang requirements ng bawat proseso.';
  }
  return 'Maaari kitang gabayan, pero official and versioned rule data lang ang kaya kong i-verify. Subukan mong sabihin ang goal mo—halimbawa, “Kailangan ko ng birth certificate” o “Ano ang dadalhin ko sa Hub?”';
}

function AssistantScreen({ messages, busy, onSend, onVoice, onRead }) {
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, busy]);

  const submit = (event) => {
    event.preventDefault();
    if (!input.trim() || busy) return;
    onSend(input.trim());
    setInput('');
  };

  return (
    <div className="page assistant-page screen-enter">
      <header className="assistant-hero">
        <span className="assistant-orb"><Bot /></span>
        <div><p className="eyebrow">Guided government navigator</p><h1>Kumusta! Ako si <span>eAbot.</span></h1><p>Sabihin ang goal mo sa Tagalog, English, o Taglish. Ipapaliwanag ko ang verified demo rules—hindi ako mag-iimbento ng requirement.</p></div>
        <span className="verified-rules"><ShieldCheck /> Official-rules-first</span>
      </header>
      <div className="chat-layout">
        <section className="chat-window" aria-label="Chat with eAbot">
          <div className="chat-date">Ngayong araw · Guided demo</div>
          <div className="chat-messages" aria-live="polite">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`chat-message ${message.role}`}>
                {message.role === 'bot' && <span className="message-avatar"><Bot /></span>}
                <div>
                  <p>{message.text}</p>
                  {message.role === 'bot' && <button className="read-button" onClick={() => onRead(message.text)}><Volume2 /> Basahin nang malakas</button>}
                </div>
              </div>
            ))}
            {busy && <div className="chat-message bot"><span className="message-avatar"><Bot /></span><div className="typing" aria-label="eAbot is responding"><span /><span /><span /></div></div>}
            <div ref={endRef} />
          </div>
          <div className="prompt-chips">
            {QUICK_PROMPTS.map((prompt) => <button key={prompt} onClick={() => onSend(prompt)} disabled={busy}>{prompt}</button>)}
          </div>
          <form className="chat-input" onSubmit={submit}>
            <button type="button" className="voice-button" onClick={() => onVoice(setInput)} aria-label="Use voice input"><Mic /></button>
            <input value={input} onChange={(event) => setInput(event.target.value)} placeholder="I-type ang gusto mong gawin…" aria-label="Message eAbot" />
            <button type="submit" className="send-button" disabled={!input.trim() || busy} aria-label="Send message"><Send /></button>
          </form>
          <p className="chat-disclaimer"><Info /> Prototype responses use a fixed demo knowledge base. No government transaction is submitted.</p>
        </section>
        <aside className="assistant-side-panel">
          <article>
            <span className="side-panel-icon"><Waypoints /></span>
            <p className="eyebrow">Aktibong context</p>
            <h2>Social Pension Journey</h2>
            <p>May 2 requirement checks pang kailangang tapusin bago ang Hub request.</p>
          </article>
          <article className="guardrail-card">
            <ShieldCheck />
            <div><strong>Safe fallback</strong><p>Kapag walang verified data, sasabihin ni eAbot na hindi niya ito ma-verify—hindi siya manghuhula.</p></div>
          </article>
        </aside>
      </div>
    </div>
  );
}

function ProfileScreen({ easyMode, setEasyMode, matching, setMatching, updates, setUpdates, onReset }) {
  const [language, setLanguage] = useState('Taglish');
  return (
    <div className="page profile-page screen-enter">
      <header className="profile-hero">
        <div className="large-avatar">RV</div>
        <div><PrototypeBadge /><h1>{DEMO_PROFILE.name}</h1><p>Demo citizen · {DEMO_PROFILE.city}</p></div>
        <span className="demo-verified"><BadgeCheck /> Demo verified</span>
      </header>
      <div className="profile-layout">
        <section className="settings-card">
          <div className="section-heading"><div><p className="eyebrow">Accessibility</p><h2>Gawing mas madaling gamitin</h2></div></div>
          <label className="setting-row">
            <span className="setting-icon blue"><Accessibility /></span>
            <span><strong>Easy Mode</strong><small>Mas malaking text, buttons, at mas simpleng instructions.</small></span>
            <input type="checkbox" checked={easyMode} onChange={(event) => setEasyMode(event.target.checked)} />
          </label>
          <label className="setting-row">
            <span className="setting-icon gold"><Languages /></span>
            <span><strong>Wika</strong><small>Piliin ang pangunahing wika ng gabay.</small></span>
            <select value={language} onChange={(event) => setLanguage(event.target.value)}><option>Taglish</option><option>Filipino</option><option>English</option></select>
          </label>
        </section>
        <section className="settings-card">
          <div className="section-heading"><div><p className="eyebrow">Consent controls</p><h2>Ikaw ang may kontrol sa data</h2></div></div>
          <label className="setting-row">
            <span className="setting-icon red"><Sparkles /></span>
            <span><strong>Demo benefit matching</strong><small>Gamitin ang synthetic profile para maghanap ng sample eligibility matches.</small></span>
            <input type="checkbox" checked={matching} onChange={(event) => setMatching(event.target.checked)} />
          </label>
          <label className="setting-row">
            <span className="setting-icon green"><MessageCircle /></span>
            <span><strong>Sample SMS previews</strong><small>Ipakita ang reminder flow; walang aktuwal na SMS.</small></span>
            <input type="checkbox" checked={updates} onChange={(event) => setUpdates(event.target.checked)} />
          </label>
        </section>
        <section className="integration-card">
          <div><p className="eyebrow">Future possibility</p><h2>Ready for authorized eGov integration</h2><p>Standalone ang eAbot ngayon. Kapag may official access, maaaring palitan ng secure adapters ang demo identity, messaging, payment, at reporting services.</p></div>
          <div className="integration-chips"><span>eVerify</span><span>eMessage</span><span>eGovPay</span><span>eReport</span></div>
          <p className="integration-status"><Info /> These integrations are not active in this prototype.</p>
        </section>
        <section className="privacy-card">
          <ShieldCheck />
          <div><p className="eyebrow">Privacy promise</p><h2>Minimal data. Explicit consent. No selling.</h2><ul><li>Never enter a real PSN or government password.</li><li>Rules determine eligibility; AI only explains.</li><li>“Ready” never means “approved.”</li></ul></div>
        </section>
        <button className="reset-button" onClick={onReset}><RefreshCcw /> I-reset ang guided demo</button>
      </div>
    </div>
  );
}

function ModalShell({ title, onClose, children, className = '' }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const dialog = dialogRef.current;
    dialog?.querySelector('button')?.focus();
    const handleKey = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab' && dialog) {
        const focusable = [...dialog.querySelectorAll('button:not([disabled]), input:not([disabled]), select:not([disabled])')];
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); previous?.focus?.(); };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} className={`modal-sheet ${className}`} role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" onClick={onClose} aria-label="Close dialog"><X /></button>
        {children}
      </section>
    </div>
  );
}

function BenefitModal({ onClose, onStart }) {
  return (
    <ModalShell title="Social Pension eligibility match" onClose={onClose} className="benefit-modal">
      <div className="modal-symbol benefit"><Coins /></div>
      <span className="new-match"><Sparkles /> Proactive discovery</span>
      <h2>May posibleng Social Pension match si Aling Rosa.</h2>
      <p>Inapply ng deterministic demo engine ang sample agency rules sa synthetic profile. Hindi ito final eligibility o approval.</p>
      <div className="explanation-list">
        <div><CheckCircle2 /><span><strong>Age rule matched</strong><small>Demo age: 65 · Rule: 60 or older</small></span></div>
        <div><CheckCircle2 /><span><strong>Residency matched</strong><small>Demo address: San Juan City</small></span></div>
        <div><CheckCircle2 /><span><strong>No pension found in demo record</strong><small>Must still be validated by the responsible agency</small></span></div>
      </div>
      <div className="rule-source"><ShieldCheck /><span><strong>Illustrative rule set v1.2</strong><small>Last updated July 2026 · For hackathon demonstration only</small></span></div>
      <button className="primary-button full-width" onClick={onStart}>Simulan ang guided journey <ArrowRight /></button>
      <button className="quiet-button full-width" onClick={onClose}>Mamaya na</button>
    </ModalShell>
  );
}

function ServiceModal({ service, onClose, onGuide }) {
  const Icon = service.icon;
  return (
    <ModalShell title={service.title} onClose={onClose}>
      <div className={`modal-symbol ${service.color}`}><Icon /></div>
      <p className="eyebrow">{service.agency}</p>
      <h2>{service.title}</h2>
      <p>{service.description}</p>
      <div className="service-preview-steps">
        <div><span>1</span><p><strong>Tell us your goal</strong><small>eAbot asks only what the journey needs.</small></p></div>
        <div><span>2</span><p><strong>Build the sequence</strong><small>Dependencies are ordered automatically.</small></p></div>
        <div><span>3</span><p><strong>Get your next action</strong><small>One clear step at a time.</small></p></div>
      </div>
      <div className="rule-note"><Info /><p>Sample service flow only. No request or document will be sent to a government agency.</p></div>
      <button className="primary-button full-width" onClick={() => onGuide(service)}>I-guide ako ni eAbot <Bot /></button>
    </ModalShell>
  );
}

function AppointmentModal({ appointment, onClose, onSubmit }) {
  const [slot, setSlot] = useState('Jul 24|9:30 AM');
  if (appointment) {
    return (
      <ModalShell title="Hub appointment request" onClose={onClose}>
        <div className="modal-symbol green"><CalendarCheck2 /></div>
        <p className="eyebrow">Request received</p>
        <h2>Hinihintay ang human confirmation.</h2>
        <p>Hindi awtomatikong nagbu-book ang eAbot. A Hub scheduler must confirm capacity first.</p>
        <article className="confirmation-ticket">
          <span><CalendarDays /></span><div><small>Preferred schedule</small><strong>{appointment.date} · {appointment.time}</strong><p>San Juan Serbisyo Hub</p></div>
        </article>
        <div className="rule-note"><Clock3 /><p>Demo status: <strong>For confirmation.</strong> Walang tunay na appointment na ginawa.</p></div>
        <button className="primary-button full-width" onClick={onClose}>Okay, naiintindihan ko</button>
      </ModalShell>
    );
  }
  const slots = [
    { value: 'Jul 24|9:30 AM', date: 'Jul 24', time: '9:30 AM', label: 'Pinakamaaga' },
    { value: 'Jul 24|2:00 PM', date: 'Jul 24', time: '2:00 PM', label: 'Hapon' },
    { value: 'Jul 25|10:30 AM', date: 'Jul 25', time: '10:30 AM', label: 'Next day' },
  ];
  const selected = slots.find((item) => item.value === slot);
  return (
    <ModalShell title="Request a Serbisyo Hub slot" onClose={onClose}>
      <div className="modal-symbol blue"><MapPin /></div>
      <p className="eyebrow">Recommended Hub</p>
      <h2>San Juan Serbisyo Hub</h2>
      <p>Ready na ang demo requirements. Piliin ang preferred slot na ipapa-confirm sa human scheduler.</p>
      <div className="slot-list">
        {slots.map((item) => (
          <label key={item.value} className={slot === item.value ? 'selected' : ''}>
            <input type="radio" name="slot" value={item.value} checked={slot === item.value} onChange={() => setSlot(item.value)} />
            <CalendarDays /><span><strong>{item.date} · {item.time}</strong><small>{item.label}</small></span><span className="radio-dot" />
          </label>
        ))}
      </div>
      <div className="rule-note"><Info /><p>A slot request is not a confirmed appointment. This prototype simulates the handoff to a human scheduler.</p></div>
      <button className="primary-button full-width" onClick={() => onSubmit(selected)}>I-request ang preferred slot <ArrowRight /></button>
    </ModalShell>
  );
}

function ComplaintModal({ onClose }) {
  const [submitted, setSubmitted] = useState(false);
  if (submitted) {
    return (
      <ModalShell title="Demo complaint submitted" onClose={onClose}>
        <div className="modal-symbol green"><CheckCircle2 /></div>
        <p className="eyebrow">Demo record created</p>
        <h2>Handa na ang structured complaint.</h2>
        <p>Sa live integration, dito ipapasa ang evidence package sa authorized eReport/ARTA channel.</p>
        <div className="reference-number"><small>DEMO REFERENCE</small><strong>EABOT-ARTA-0722</strong></div>
        <button className="primary-button full-width" onClick={onClose}>Bumalik sa journey</button>
      </ModalShell>
    );
  }
  return (
    <ModalShell title="Review structured complaint" onClose={onClose}>
      <div className="modal-symbol red"><CircleHelp /></div>
      <p className="eyebrow">Evidence-backed escalation</p>
      <h2>Hindi mo kailangang buuin ulit ang kuwento.</h2>
      <p>Ginawa ng eAbot ang sample evidence package mula sa journey timeline.</p>
      <div className="complaint-evidence">
        <div><span>Journey</span><strong>Social Pension Application</strong></div>
        <div><span>Issue</span><strong>Requirement not disclosed in original checklist</strong></div>
        <div><span>Elapsed time</span><strong>12 demo days · SLA: 7 days</strong></div>
        <div><span>Evidence</span><strong>3 timeline events attached</strong></div>
      </div>
      <div className="rule-note"><Info /><p>This is a simulation. Nothing will be sent to ARTA or any government agency.</p></div>
      <button className="primary-button full-width" onClick={() => setSubmitted(true)}>Gumawa ng demo reference <ArrowRight /></button>
    </ModalShell>
  );
}

function NoticeModal({ updates, appointment, onClose }) {
  return (
    <ModalShell title="Notifications" onClose={onClose}>
      <div className="modal-symbol gold"><Bell /></div>
      <p className="eyebrow">eAbot updates</p>
      <h2>May bagong posibleng benepisyo.</h2>
      <article className="notification-item unread"><span><Sparkles /></span><div><strong>Possible Social Pension match</strong><p>Tingnan kung bakit maaaring kwalipikado si Rosa at simulan ang guided checklist.</p><small>Ngayon · Demo notification</small></div></article>
      {appointment && <article className="notification-item"><span><CalendarCheck2 /></span><div><strong>Hub request received</strong><p>{appointment.date} at {appointment.time} ang preferred schedule. Human confirmation pending.</p><small>Sample update</small></div></article>}
      {updates && <div className="sms-preview"><Phone /><div><small>Sample SMS preview</small><p>eAbot: May posibleng programang para sa iyo. Buksan ang app para makita ang verified demo explanation. Walang fee.</p></div></div>}
      <button className="primary-button full-width" onClick={onClose}>Nabasa ko na</button>
    </ModalShell>
  );
}

function Toast({ message }) {
  return <div className={`toast ${message ? 'show' : ''}`} role="status" aria-live="polite"><CheckCircle2 /> {message}</div>;
}

export default function App() {
  const [onboarded, setOnboarded] = useState(() => safeRead('eabot-onboarded', false));
  const [activeScreen, setActiveScreen] = useState('home');
  const [completed, setCompleted] = useState(() => safeRead('eabot-completed', INITIAL_COMPLETED));
  const [easyMode, setEasyMode] = useState(() => safeRead('eabot-easy-mode', false));
  const [matching, setMatching] = useState(true);
  const [updates, setUpdates] = useState(() => safeRead('eabot-updates', true));
  const [appointment, setAppointment] = useState(() => safeRead('eabot-appointment', null));
  const [selectedService, setSelectedService] = useState(null);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState('');
  const [busyRequirement, setBusyRequirement] = useState(null);
  const [online, setOnline] = useState(() => navigator.onLine);
  const [assistantBusy, setAssistantBusy] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Magandang araw, Aling Rosa! Sabihin mo lang kung anong government goal ang gusto mong ma-accomplish. Isang hakbang kada sagot.' },
  ]);

  const progress = Math.round((completed.length / REQUIREMENTS.length) * 100);

  useEffect(() => {
    window.localStorage.setItem('eabot-completed', JSON.stringify(completed));
    window.localStorage.setItem('eabot-easy-mode', JSON.stringify(easyMode));
    window.localStorage.setItem('eabot-updates', JSON.stringify(updates));
    window.localStorage.setItem('eabot-appointment', JSON.stringify(appointment));
  }, [completed, easyMode, updates, appointment]);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const navigate = (screen) => {
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const finishOnboarding = ({ updates: allowUpdates }) => {
    setOnboarded(true);
    setUpdates(allowUpdates);
    window.localStorage.setItem('eabot-onboarded', JSON.stringify(true));
    setToast('Welcome sa eAbot guided demo!');
  };

  const completeRequirement = (id) => {
    setBusyRequirement(id);
    window.setTimeout(() => {
      setCompleted((current) => current.includes(id) ? current : [...current, id]);
      setBusyRequirement(null);
      setToast(id === 'indigency' ? 'Demo document checked.' : 'Demo contact confirmed. 100% ready!');
    }, 850);
  };

  const sendMessage = (text) => {
    if (!text.trim() || assistantBusy) return;
    setMessages((current) => [...current, { role: 'user', text }]);
    setAssistantBusy(true);
    window.setTimeout(() => {
      setMessages((current) => [...current, { role: 'bot', text: getAssistantReply(text) }]);
      setAssistantBusy(false);
    }, 700);
  };

  const askFromService = (serviceOrPrompt) => {
    const prompt = typeof serviceOrPrompt === 'string' ? serviceOrPrompt : `Kailangan ko ng ${serviceOrPrompt.title}. Ano ang tamang sequence?`;
    setSelectedService(null);
    setModal(null);
    navigate('assistant');
    window.setTimeout(() => sendMessage(prompt), 120);
  };

  const voiceInput = (setInput) => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setToast('Voice input is not supported by this browser.');
      return;
    }
    const recognition = new Recognition();
    recognition.lang = 'fil-PH';
    recognition.interimResults = false;
    recognition.onresult = (event) => setInput(event.results[0][0].transcript);
    recognition.onerror = () => setToast('Hindi nakuha ang boses. Subukan ulit.');
    recognition.start();
  };

  const readAloud = (text) => {
    if (!window.speechSynthesis) { setToast('Read-aloud is not supported by this browser.'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fil-PH';
    window.speechSynthesis.speak(utterance);
  };

  const submitAppointment = (slot) => {
    const nextAppointment = { date: slot.date, time: slot.time, status: 'pending' };
    setAppointment(nextAppointment);
    setToast('Hub request sent for human confirmation.');
  };

  const resetDemo = () => {
    ['eabot-onboarded', 'eabot-completed', 'eabot-easy-mode', 'eabot-updates', 'eabot-appointment'].forEach((key) => window.localStorage.removeItem(key));
    setCompleted(INITIAL_COMPLETED);
    setAppointment(null);
    setEasyMode(false);
    setMatching(true);
    setUpdates(true);
    setActiveScreen('home');
    setOnboarded(false);
  };

  if (!onboarded) return <Onboarding onComplete={finishOnboarding} />;

  return (
    <div className={`app-shell ${easyMode ? 'easy-mode' : ''}`}>
      <Sidebar active={activeScreen} onNavigate={navigate} progress={progress} />
      <div className="main-shell">
        {!online && <div className="offline-banner"><CloudOff /> Offline mode: previously loaded demo data remains available.</div>}
        <TopBar activeScreen={activeScreen} onNavigate={navigate} onShowNotice={() => setModal('notices')} />
        <main id="main-content">
          {activeScreen === 'home' && <HomeScreen progress={progress} completed={completed} matching={matching} onNavigate={navigate} onOpenBenefit={() => setModal('benefit')} onSelectService={setSelectedService} appointment={appointment} />}
          {activeScreen === 'discover' && <DiscoverScreen onSelectService={setSelectedService} onAsk={askFromService} />}
          {activeScreen === 'assistant' && <AssistantScreen messages={messages} busy={assistantBusy} onSend={sendMessage} onVoice={voiceInput} onRead={readAloud} />}
          {activeScreen === 'journey' && <JourneyScreen completed={completed} progress={progress} onCompleteRequirement={completeRequirement} busyRequirement={busyRequirement} appointment={appointment} onSchedule={() => setModal('appointment')} onReport={() => setModal('complaint')} />}
          {activeScreen === 'profile' && <ProfileScreen easyMode={easyMode} setEasyMode={setEasyMode} matching={matching} setMatching={setMatching} updates={updates} setUpdates={setUpdates} onReset={resetDemo} />}
        </main>
      </div>
      <BottomNavigation active={activeScreen} onNavigate={navigate} />
      {modal === 'benefit' && <BenefitModal onClose={() => setModal(null)} onStart={() => { setModal(null); navigate('journey'); }} />}
      {selectedService && <ServiceModal service={selectedService} onClose={() => setSelectedService(null)} onGuide={askFromService} />}
      {modal === 'appointment' && <AppointmentModal appointment={appointment} onClose={() => setModal(null)} onSubmit={submitAppointment} />}
      {modal === 'complaint' && <ComplaintModal onClose={() => setModal(null)} />}
      {modal === 'notices' && <NoticeModal updates={updates} appointment={appointment} onClose={() => setModal(null)} />}
      <Toast message={toast} />
    </div>
  );
}
