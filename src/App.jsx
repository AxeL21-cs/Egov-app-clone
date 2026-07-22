import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Bot,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  GraduationCap,
  HeartHandshake,
  Home,
  Info,
  Landmark,
  ListChecks,
  LockKeyhole,
  MapPin,
  Network,
  QrCode,
  RotateCcw,
  School,
  Search,
  ShieldCheck,
  Sparkles,
  Upload,
  UserRound,
  WalletCards,
} from 'lucide-react';
import RequirementGraph from './components/RequirementGraph';

const PROFILE = {
  name: 'Mika Reyes',
  firstName: 'Mika',
  initials: 'MR',
  age: 18,
  city: 'San Juan City, Metro Manila',
  status: 'Incoming college freshman',
};

const PROGRAMS = [
  {
    id: 'bpms',
    title: 'Bagong Pilipinas Merit Scholarship',
    shortTitle: 'Merit Scholarship',
    agency: 'CHED',
    category: 'Scholarships',
    type: 'Scholarship',
    status: 'Prepare for next call',
    statusTone: 'gold',
    match: 'Strong profile match',
    description: 'A competitive merit pathway for high-performing incoming first-year students in priority programs.',
    reasons: ['Incoming first-year', 'Strong Grade 12 record', 'Needs a document plan'],
    timing: 'AY 2026–2027 call closed',
    count: '5 requirement groups',
    source: 'https://bpms.ched.gov.ph/',
    sourceLabel: 'Official CHED portal',
    icon: GraduationCap,
    accent: 'blue',
  },
  {
    id: 'tes',
    title: 'Tertiary Education Subsidy',
    shortTitle: 'TES',
    agency: 'CHED / UniFAST',
    category: 'Scholarships',
    type: 'Grant-in-aid',
    status: 'After enrollment',
    statusTone: 'blue',
    match: 'Possible future match',
    description: 'Support for eligible students enrolled in participating public or private higher education institutions.',
    reasons: ['Filipino student', 'Incoming freshman', 'School coordinates application'],
    timing: 'Coordinate with your school',
    count: '1 core + conditional docs',
    source: 'https://unifast.gov.ph/tes.html',
    sourceLabel: 'Official UniFAST page',
    icon: School,
    accent: 'red',
  },
  {
    id: 'aics',
    title: 'AICS Educational Assistance',
    shortTitle: 'Educational Assistance',
    agency: 'DSWD',
    category: 'Assistance',
    type: 'Crisis assistance',
    status: 'Assessment required',
    statusTone: 'pink',
    match: 'Worth checking',
    description: 'Short-term assistance for a student or family experiencing an actual crisis, subject to social-worker assessment.',
    reasons: ['College expenses ahead', 'Local assessment available', 'No application fee'],
    timing: 'Local schedules vary',
    count: 'School + identity documents',
    source: 'https://www.dswd.gov.ph/aics/',
    sourceLabel: 'Official DSWD overview',
    icon: HeartHandshake,
    accent: 'green',
  },
  {
    id: 'dfa-passport',
    title: 'DFA Passport Application Assistance',
    shortTitle: 'Passport Assistance',
    agency: 'DFA',
    category: 'Assistance',
    type: 'Government document',
    status: 'Start documents in parallel',
    statusTone: 'blue',
    match: 'Useful identity milestone',
    description: 'Prepare a first-time adult passport file and see which civil records, IDs, and special-case documents depend on one another.',
    reasons: ['Adult applicant', 'Parallel document requests', 'Special-case guidance'],
    timing: 'Appointment required',
    count: '3 parallel starts + conditional branches',
    source: 'https://aganapcg.dfa.gov.ph/consular-and-other-services/passports/requirements-for-passport',
    sourceLabel: 'Official DFA requirements',
    icon: BookOpen,
    accent: 'blue',
  },
];

const PASSPORT_CASE_OPTIONS = [
  {
    id: 'marriedName',
    title: 'Using spouse\'s surname',
    detail: 'Adds a PSA marriage certificate to the civil-record request lane.',
  },
  {
    id: 'extraIdentityProof',
    title: 'Needs extra identity proof',
    detail: 'Shows the NBI alternative used in certain late-registration or record-discrepancy cases.',
  },
  {
    id: 'lostValidPassport',
    title: 'Replacing a lost valid passport',
    detail: 'Adds the police report and notarized affidavit-of-loss branch.',
  },
];

const INCOME_OPTIONS = [
  { id: 'non-filer', title: 'BIR non-filer / tax exemption certificate', detail: 'For a parent or guardian without a filed income tax return.' },
  { id: 'itr', title: 'Latest ITR or BIR Form 2316', detail: 'For employed or self-employed parents or legal guardians.' },
  { id: 'ofw', title: 'OFW or seafarer income proof', detail: 'Certified latest contract or equivalent proof of income.' },
  { id: 'four-ps', title: '4Ps certification', detail: 'DSWD or city/municipal social welfare certification.' },
];

const PROGRAM_REQUIREMENTS = {
  tes: [
    {
      id: 'tes-profile',
      title: 'Student profile',
      detail: 'Demo identity and student status saved.',
      source: 'eAbot demo profile',
      icon: UserRound,
      initial: 'complete',
    },
    {
      id: 'tes-enrollment',
      title: 'Certificate of Registration or Enrollment',
      detail: 'Request this from your school after enrollment.',
      source: 'School registrar',
      icon: School,
      method: 'upload',
    },
    {
      id: 'tes-residency',
      title: 'Certificate of Residency',
      detail: 'Conditional for the applicable private-school / no-SUC-or-LUC category.',
      source: 'LGU or barangay',
      icon: Building2,
      conditional: true,
    },
    {
      id: 'tes-pwd',
      title: 'PWD ID',
      detail: 'Only needed when claiming the PWD priority category.',
      source: 'PDAO / LGU',
      icon: BadgeCheck,
      conditional: true,
    },
  ],
  aics: [
    {
      id: 'aics-profile',
      title: 'Valid ID for the interview',
      detail: 'Demo identity is saved; bring an accepted physical ID to the actual interview.',
      source: 'Applicant',
      icon: UserRound,
      initial: 'complete',
    },
    {
      id: 'aics-school',
      title: 'Current school document',
      detail: 'Enrollment assessment, certificate of enrollment/registration, or statement of account.',
      source: 'School registrar',
      icon: School,
      method: 'upload',
    },
    {
      id: 'aics-assessment',
      title: 'Social-worker assessment',
      detail: 'A DSWD social worker determines whether an actual crisis qualifies for assistance.',
      source: 'DSWD field or satellite office',
      icon: HeartHandshake,
      method: 'assisted',
    },
    {
      id: 'aics-local',
      title: 'Local supporting documents',
      detail: 'Residency, indigency, or authorization documents may be requested for your case.',
      source: 'Barangay / applicant',
      icon: Building2,
      conditional: true,
    },
  ],
};

const PROMOS = [
  {
    eyebrow: 'Your opportunity map',
    title: '4 government pathways may fit your next chapter.',
    copy: 'Based on Mika’s synthetic demo profile—not an approval.',
    action: 'See my matches',
    icon: GraduationCap,
    tone: 'blue',
  },
  {
    eyebrow: 'Requirements, untangled',
    title: 'See every document in the right order.',
    copy: 'eAbot explains dependencies before you spend time or money.',
    action: 'Open document plan',
    icon: FolderOpen,
    tone: 'yellow',
  },
  {
    eyebrow: 'Designed for access',
    title: 'Know what can be done online and what needs a visit.',
    copy: 'Government integrations shown in this prototype are mocked.',
    action: 'Try the guided demo',
    icon: QrCode,
    tone: 'pink',
  },
];

const QUICK_LINKS = [
  { id: 'opportunities', label: 'Opportunities', icon: GraduationCap },
  { id: 'documents', label: 'Documents', icon: FolderOpen },
  { id: 'school', label: 'School', icon: School },
  { id: 'agencies', label: 'Agencies', icon: Landmark },
  { id: 'guide', label: 'Guides', icon: BookOpen },
  { id: 'help', label: 'Help', icon: CircleHelp },
];

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'opportunities', label: 'Discover', icon: Search },
  { id: 'assistant', label: 'eAbot AI', icon: Bot, primary: true },
  { id: 'documents', label: 'Documents', icon: FileCheck2 },
  { id: 'profile', label: 'Profile', icon: UserRound },
];

const DEFAULT_STATE = {
  selectedProgram: 'bpms',
  complete: ['bpms-profile'],
  birthRequest: 'not-started',
  selectedIncome: '',
  passportCases: {
    marriedName: false,
    extraIdentityProof: false,
    lostValidPassport: false,
  },
  receipt: null,
  checklistView: 'graph',
};

function safeRead() {
  try {
    const saved = window.localStorage.getItem('eabot-youth-demo-v1');
    if (!saved) return DEFAULT_STATE;
    const parsed = JSON.parse(saved);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      passportCases: { ...DEFAULT_STATE.passportCases, ...(parsed.passportCases || {}) },
    };
  } catch {
    return DEFAULT_STATE;
  }
}

function Brand() {
  return (
    <div className="brand" aria-label="eAbot Philippines">
      <span className="brand-word">eAb<span className="brand-orbit">o</span>t</span>
      <span className="brand-ph">PH</span>
    </div>
  );
}

function Avatar() {
  return <span className="avatar" aria-label={`${PROFILE.name}, demo profile`}>{PROFILE.initials}</span>;
}

function DemoPill({ compact = false }) {
  return <span className={`demo-pill ${compact ? 'compact' : ''}`}><Sparkles /> Prototype</span>;
}

function FocusHeader({ title, subtitle, onBack }) {
  return (
    <header className="focus-header">
      <button className="icon-button" onClick={onBack} aria-label="Go back"><ArrowLeft /></button>
      <div>
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </div>
      <Brand />
    </header>
  );
}

function StatusPill({ tone = 'blue', children }) {
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function ProgressBar({ value, label }) {
  return (
    <div className="progress-block">
      <div className="progress-label"><span>{label}</span><strong>{value}%</strong></div>
      <div className="progress-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow={value}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function ProgramCard({ program, onSelect, featured = false }) {
  const Icon = program.icon;
  return (
    <article className={`program-card ${featured ? 'featured' : ''}`}>
      <button className="program-main" onClick={() => onSelect(program.id)}>
        <span className={`program-icon ${program.accent}`}><Icon /></span>
        <span className="program-copy">
          <span className="program-topline">
            <span>{program.agency}</span>
            <StatusPill tone={program.statusTone}>{program.status}</StatusPill>
          </span>
          <strong>{program.title}</strong>
          <span className="program-description">{program.description}</span>
          <span className="program-meta"><BadgeCheck /> {program.match}<span>•</span>{program.count}</span>
        </span>
        <ChevronRight className="card-chevron" />
      </button>
      <div className="program-footer">
        <span>{program.timing}</span>
        <a href={program.source} target="_blank" rel="noreferrer">{program.sourceLabel}<ExternalLink /></a>
      </div>
    </article>
  );
}

function BottomNavigation({ active, onNavigate }) {
  return (
    <nav className="bottom-nav" aria-label="Primary navigation">
      {NAV_ITEMS.map(({ id, label, icon: Icon, primary }) => (
        <button key={id} className={`${active === id ? 'active' : ''} ${primary ? 'primary' : ''}`} onClick={() => onNavigate(id)}>
          <span><Icon /></span>
          <small>{label}</small>
        </button>
      ))}
    </nav>
  );
}

function HomeScreen({ onNavigate, onSelectProgram, state }) {
  const [promo, setPromo] = useState(0);
  const [tab, setTab] = useState('For you');
  const currentPromo = PROMOS[promo];
  const PromoIcon = currentPromo.icon;
  const birthStarted = state.birthRequest === 'paid';

  return (
    <main className="page home-screen screen-enter">
      <header className="home-header">
        <Brand />
        <div className="greeting">
          <div><strong>Mabuhay, {PROFILE.firstName.toUpperCase()}</strong><span>{PROFILE.status}</span></div>
          <Avatar />
        </div>
      </header>

      <div className="context-row">
        <span><MapPin />{PROFILE.city.toUpperCase()}</span>
        <span><CalendarDays />{new Intl.DateTimeFormat('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())}</span>
      </div>

      <button className="service-search" onClick={() => onNavigate('opportunities')}>
        <span>Search scholarships, grants, documents</span><Search />
      </button>

      <section className="quick-links" aria-label="Quick links">
        {QUICK_LINKS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => onNavigate(id === 'documents' ? 'documents' : id === 'opportunities' ? 'opportunities' : 'assistant')}>
            <span><Icon /></span><small>{label}</small>
          </button>
        ))}
      </section>

      <section className={`promo-card ${currentPromo.tone}`}>
        <div className="promo-copy">
          <span>{currentPromo.eyebrow}</span>
          <h1 tabIndex="-1">{currentPromo.title}</h1>
          <p>{currentPromo.copy}</p>
          <button onClick={() => onNavigate(promo === 1 ? 'documents' : 'opportunities')}>{currentPromo.action}<ArrowRight /></button>
        </div>
        <div className="promo-art" aria-hidden="true"><PromoIcon /><span>18</span><Sparkles /></div>
      </section>
      <div className="carousel-dots" aria-label={`Banner ${promo + 1} of ${PROMOS.length}`}>
        {PROMOS.map((item, index) => <button key={item.title} className={index === promo ? 'active' : ''} onClick={() => setPromo(index)} aria-label={`Show banner ${index + 1}`} />)}
      </div>

      <section className="utility-grid" aria-label="Your opportunity dashboard">
        <button className="readiness-tile" onClick={() => onNavigate('documents')}>
          <span className="tile-label">MY DOCUMENT PLAN</span>
          <strong>{birthStarted ? '2' : '1'} <small>of 5 steps</small></strong>
          <p>{birthStarted ? 'Your PSA request is processing. Your school record is next.' : 'Start with one document today. We will show what comes next.'}</p>
          <span className="tile-action">Open checklist <ArrowRight /></span>
          <FileCheck2 className="tile-watermark" />
        </button>
        <button className="small-tile pink" onClick={() => onSelectProgram('bpms')}>
          <span><GraduationCap /></span><div><small>BEST MATCH</small><strong>Merit pathway</strong><em>Build your file early</em></div>
        </button>
        <button className="small-tile green" onClick={() => onNavigate('assistant')}>
          <span><Bot /></span><div><small>ASK eABOT</small><strong>What can I get?</strong><em>Plain-language guide</em></div>
        </button>
      </section>

      <section className="featured-section">
        <div className="section-heading">
          <div><span className="section-kicker">MATCHED TO YOUR DEMO PROFILE</span><h2>Opportunities for you</h2></div>
          <button onClick={() => onNavigate('opportunities')}>See all</button>
        </div>
        <div className="segment-control" role="tablist" aria-label="Opportunity filter">
          {['For you', 'Scholarships', 'Assistance'].map((item) => <button key={item} role="tab" aria-selected={tab === item} className={tab === item ? 'active' : ''} onClick={() => setTab(item)}>{item}</button>)}
        </div>
        <div className="program-list">
          {PROGRAMS.filter((program) => tab === 'For you' || program.category === tab).slice(0, 3).map((program) => <ProgramCard key={program.id} program={program} onSelect={onSelectProgram} />)}
        </div>
      </section>
      <BottomNavigation active="home" onNavigate={onNavigate} />
    </main>
  );
}

function OpportunitiesScreen({ onNavigate, onSelectProgram }) {
  const [query, setQuery] = useState('');
  const filtered = PROGRAMS.filter((program) => `${program.title} ${program.agency} ${program.type}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="page content-page screen-enter">
      <div className="content-header">
        <div><DemoPill /><h1 tabIndex="-1">Choose an opportunity</h1><p>Compare what may fit now, after enrollment, or in the next application cycle.</p></div>
        <Avatar />
      </div>
      <div className="profile-context">
        <span className="context-icon"><UserRound /></span>
        <div><strong>{PROFILE.name}, {PROFILE.age}</strong><span>{PROFILE.status} • {PROFILE.city}</span></div>
        <BadgeCheck />
      </div>
      <label className="input-search"><span className="sr-only">Search government opportunities</span><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by program or agency" /><span className="search-count">{filtered.length}</span></label>
      <div className="info-strip"><Info /><p><strong>Possible match, not approval.</strong> Availability and final eligibility come from the responsible agency or school.</p></div>
      <div className="program-list spacious">
        {filtered.map((program, index) => <ProgramCard key={program.id} program={program} onSelect={onSelectProgram} featured={index === 0 && !query} />)}
        {!filtered.length && <div className="empty-state"><Search /><h2>No demo opportunity found</h2><p>Try “CHED,” “TES,” or “DSWD.”</p></div>}
      </div>
      <BottomNavigation active="opportunities" onNavigate={onNavigate} />
    </main>
  );
}

function getBpmsRequirements(state) {
  const done = new Set(state.complete);
  const requestPaid = state.birthRequest === 'paid';
  return [
    {
      id: 'bpms-profile',
      title: 'Online application profile',
      detail: 'Synthetic identity and basic applicant details are ready.',
      source: 'Applicant profile',
      icon: UserRound,
      status: 'complete',
    },
    {
      id: 'bpms-birth',
      title: 'PSA birth certificate',
      detail: requestPaid ? 'Request submitted. The document itself is still processing.' : 'Request a copy through the future eGov document-service connection.',
      source: 'Philippine Statistics Authority',
      icon: FileText,
      method: 'egov',
      status: done.has('bpms-birth') ? 'complete' : requestPaid ? 'processing' : 'available',
    },
    {
      id: 'bpms-sf9',
      title: 'Certified SF9 / Form 138',
      detail: 'Signed by your registrar or authorized school representative.',
      source: 'Senior high school registrar',
      icon: School,
      method: 'upload',
      status: done.has('bpms-sf9') ? 'complete' : requestPaid || done.has('bpms-birth') ? 'available' : 'locked',
      lockedBy: 'Start the PSA request first',
    },
    {
      id: 'bpms-admission',
      title: 'College admission proof',
      detail: 'Admission slip or another accepted proof from your selected institution.',
      source: 'College admissions office',
      icon: GraduationCap,
      method: 'upload',
      status: done.has('bpms-admission') ? 'complete' : done.has('bpms-sf9') ? 'available' : 'locked',
      lockedBy: 'Complete your school record step first',
    },
    {
      id: 'bpms-income',
      title: 'One proof of household income',
      detail: state.selectedIncome ? INCOME_OPTIONS.find((item) => item.id === state.selectedIncome)?.title : 'Choose one accepted document path below.',
      source: 'BIR, DSWD, or employer',
      icon: WalletCards,
      method: 'income',
      status: done.has('bpms-income') ? 'complete' : done.has('bpms-admission') ? 'available' : 'locked',
      lockedBy: 'Add your college admission proof first',
    },
  ];
}

function getPassportRequirements(state) {
  const done = new Set(state.complete);
  const cases = { ...DEFAULT_STATE.passportCases, ...(state.passportCases || {}) };
  const requestPaid = state.birthRequest === 'paid';
  const finalDependencies = ['dfa-birth', 'dfa-primary-id', 'dfa-appointment'];
  if (cases.marriedName) finalDependencies.push('dfa-marriage');
  if (cases.extraIdentityProof) finalDependencies.push('dfa-nbi');
  if (cases.lostValidPassport) finalDependencies.push('dfa-police', 'dfa-affidavit');

  const definitions = [
    {
      id: 'dfa-profile',
      title: 'Applicant details',
      detail: 'Basic identity and contact information are ready for the passport form.',
      source: 'eAbot demo profile',
      icon: UserRound,
      initial: 'complete',
      level: 0,
      lane: 0,
      stageLabel: 'START',
    },
    {
      id: 'dfa-birth',
      title: 'PSA birth certificate',
      detail: requestPaid ? 'Request submitted; wait for the issued copy before the DFA appearance.' : 'Request an original PSA-issued Certificate of Live Birth.',
      source: 'Philippine Statistics Authority',
      icon: FileText,
      method: 'egov',
      dependsOn: ['dfa-profile'],
      level: 1,
      lane: -1,
      stageLabel: 'START TOGETHER',
      batchLabel: 'PSA civil records',
      forcedStatus: done.has('dfa-birth') ? 'complete' : requestPaid ? 'processing' : undefined,
    },
    {
      id: 'dfa-primary-id',
      title: 'One acceptable government ID',
      detail: 'Prepare the original and one photocopy of an ID accepted by DFA.',
      source: 'Applicant / issuing agency',
      icon: BadgeCheck,
      method: 'upload',
      dependsOn: ['dfa-profile'],
      level: 1,
      lane: 0,
      stageLabel: 'START TOGETHER',
    },
    {
      id: 'dfa-appointment',
      title: 'DFA appointment and application form',
      detail: 'Book the appointment and keep the completed application form and e-receipt.',
      source: 'passport.gov.ph',
      icon: CalendarDays,
      method: 'upload',
      dependsOn: ['dfa-profile'],
      level: 1,
      lane: 1,
      stageLabel: 'START TOGETHER',
    },
    {
      id: 'dfa-marriage',
      title: 'PSA marriage certificate',
      detail: 'Required when a married woman applies using the spouse\'s surname; it can be requested alongside the birth certificate.',
      source: 'Philippine Statistics Authority',
      icon: HeartHandshake,
      method: 'upload',
      dependsOn: ['dfa-profile'],
      level: 1,
      lane: -2,
      stageLabel: 'SAME PSA REQUEST LANE',
      batchLabel: 'PSA civil records',
      active: cases.marriedName,
    },
    {
      id: 'dfa-secondary-id',
      title: 'Second valid government ID',
      detail: 'NBI clearance requires two valid government-issued IDs or accepted certificates.',
      source: 'Applicant / issuing agency',
      icon: BadgeCheck,
      method: 'upload',
      dependsOn: ['dfa-profile'],
      level: 1,
      lane: 2,
      stageLabel: 'NBI PREREQUISITE',
      active: cases.extraIdentityProof,
    },
    {
      id: 'dfa-police',
      title: 'Police report',
      detail: 'Required for replacement of a lost valid passport.',
      source: 'Local police station',
      icon: FileText,
      method: 'upload',
      dependsOn: ['dfa-profile'],
      level: 1,
      lane: 3,
      stageLabel: 'LOST-PASSPORT LANE',
      active: cases.lostValidPassport,
    },
    {
      id: 'dfa-affidavit',
      title: 'Notarized affidavit of loss',
      detail: 'Explain when, where, and how the passport was lost.',
      source: 'Notary public / DFA consular officer',
      icon: FileCheck2,
      method: 'upload',
      dependsOn: ['dfa-profile'],
      level: 1,
      lane: 4,
      stageLabel: 'LOST-PASSPORT LANE',
      active: cases.lostValidPassport,
    },
    {
      id: 'dfa-nbi',
      title: 'NBI clearance',
      detail: 'An alternative supporting record in certain late-registration or identity-document cases—not a standard passport requirement.',
      source: 'National Bureau of Investigation',
      icon: ShieldCheck,
      method: 'upload',
      dependsOn: ['dfa-primary-id', 'dfa-secondary-id'],
      level: 2,
      lane: 1,
      stageLabel: 'NESTED REQUIREMENT',
      active: cases.extraIdentityProof,
    },
    {
      id: 'dfa-nbi-hit',
      title: 'Additional NBI verification',
      detail: 'Only if NBI returns a HIT or quality-control instruction; follow the case-specific documents NBI requests.',
      source: 'NBI Quality Control',
      icon: Info,
      dependsOn: ['dfa-nbi'],
      level: 3,
      lane: 2,
      stageLabel: 'ONLY IF INSTRUCTED',
      active: false,
    },
    {
      id: 'dfa-final-check',
      title: 'DFA appointment document check',
      detail: 'Bring the required originals and photocopies for personal appearance and biometrics.',
      source: 'Department of Foreign Affairs',
      icon: BookOpen,
      method: 'assisted',
      dependsOn: finalDependencies,
      level: 3,
      lane: 0,
      stageLabel: 'FINAL CHECK',
      finalGate: true,
    },
  ];

  const statuses = new Map();
  return definitions.map((item) => {
    const active = item.active !== false;
    const dependencies = item.dependsOn || [];
    const ready = dependencies.every((id) => statuses.get(id) === 'complete');
    const status = !active
      ? 'conditional'
      : item.forcedStatus || (done.has(item.id) || item.initial === 'complete' ? 'complete' : ready ? 'available' : 'locked');
    statuses.set(item.id, status);
    const blockingTitles = dependencies
      .filter((id) => statuses.get(id) !== 'complete')
      .map((id) => definitions.find((candidate) => candidate.id === id)?.title)
      .filter(Boolean);
    return {
      ...item,
      status,
      active,
      lockedBy: blockingTitles.length ? `Finish ${blockingTitles.join(' and ')} first` : '',
    };
  });
}

function RequirementStatus({ status }) {
  const config = {
    complete: { icon: Check, label: 'Complete' },
    available: { icon: ArrowRight, label: 'Ready to start' },
    processing: { icon: Clock3, label: 'Processing' },
    locked: { icon: LockKeyhole, label: 'Locked' },
    conditional: { icon: Info, label: 'If applicable' },
  }[status];
  const Icon = config.icon;
  return <span className={`requirement-status ${status}`}><Icon />{config.label}</span>;
}

function JourneyAside({ program, isBpms, isPassport }) {
  return (
    <aside className="journey-aside">
      <div className="source-card"><ShieldCheck /><div><strong>Official-source map</strong><p>The prototype organizes published requirements. Agencies can still request validation or updated documents.</p><a href={program.source} target="_blank" rel="noreferrer">Open {program.sourceLabel}<ExternalLink /></a></div></div>
      {isBpms && <div className="conditional-card"><Info /><div><strong>Conditional documents</strong><p>Top-five, PWD, Solo Parent, Indigenous Peoples, first-generation, and other equity proofs only appear when relevant.</p></div></div>}
      {isPassport && <div className="conditional-card"><Info /><div><strong>NBI is not a default passport requirement</strong><p>It appears here only for selected supporting-document cases. The NBI branch itself needs two valid IDs, and a HIT may trigger case-specific verification.</p><a href="https://nbi.gov.ph/citizens-charter/nbi-clearance-application/" target="_blank" rel="noreferrer">Open official NBI requirements<ExternalLink /></a></div></div>}
    </aside>
  );
}

function RequirementsScreen({ state, setState, onNavigate, onOpenDocument }) {
  const program = PROGRAMS.find((item) => item.id === state.selectedProgram) || PROGRAMS[0];
  const isBpms = program.id === 'bpms';
  const isPassport = program.id === 'dfa-passport';
  const generic = PROGRAM_REQUIREMENTS[program.id] || [];
  const completed = new Set(state.complete);
  let encounteredAvailable = false;
  const requirements = isBpms ? getBpmsRequirements(state) : isPassport ? getPassportRequirements(state) : generic.map((item, index) => {
    let status = completed.has(item.id) || item.initial === 'complete' ? 'complete' : item.conditional ? 'conditional' : !encounteredAvailable ? 'available' : 'locked';
    if (status === 'available') encounteredAvailable = true;
    return { ...item, status, lockedBy: index > 0 ? 'Complete the step above first' : '' };
  });
  const coreRequirements = requirements.filter((item) => item.status !== 'conditional');
  const completedCount = coreRequirements.filter((item) => item.status === 'complete' || item.status === 'processing').length;
  const progress = Math.round((completedCount / Math.max(coreRequirements.length, 1)) * 100);
  const availableNow = requirements.filter((item) => item.status === 'available');
  const next = availableNow[0];
  const ProgramIcon = program.icon;
  const checklistView = state.checklistView === 'list' ? 'list' : 'graph';

  const handleRequirement = (requirement) => {
    if (requirement.status !== 'available') return;
    if (requirement.method === 'income' && !state.selectedIncome) return;
    if (requirement.method === 'assisted') {
      setState((current) => ({ ...current, complete: [...new Set([...current.complete, requirement.id])] }));
      return;
    }
    onOpenDocument(requirement);
  };

  return (
    <main className="page content-page requirements-screen screen-enter">
      <FocusHeader title="Document journey" subtitle={program.agency} onBack={() => onNavigate('opportunities')} />
      <section className="program-summary">
        <div className={`summary-icon ${program.accent}`}><ProgramIcon /></div>
        <div className="summary-copy"><span>{program.type}</span><h1 tabIndex="-1">{program.shortTitle}</h1><p>{program.status}. This plan helps you prepare—it does not submit an application.</p></div>
        <StatusPill tone={program.statusTone}>{program.status}</StatusPill>
      </section>

      <section className="readiness-summary">
        <div><span className="section-kicker">YOUR READINESS PLAN</span><strong>{completedCount} of {coreRequirements.length} core steps moved</strong><p>Documents remain “processing” until the issuing agency releases them.</p></div>
        <ProgressBar value={progress} label="Journey progress" />
      </section>

      {isPassport && (
        <section className="passport-case-picker" aria-labelledby="passport-case-title">
          <div className="passport-case-heading">
            <div><span className="section-kicker">APPLICANT CASE</span><strong id="passport-case-title">Show only the branches that apply</strong></div>
            <span>{Object.values(state.passportCases || {}).filter(Boolean).length} selected</span>
          </div>
          <div className="passport-case-options">
            {PASSPORT_CASE_OPTIONS.map((option) => {
              const selected = Boolean(state.passportCases?.[option.id]);
              return (
                <button
                  type="button"
                  key={option.id}
                  className={selected ? 'active' : ''}
                  aria-pressed={selected}
                  onClick={() => setState((current) => ({
                    ...current,
                    passportCases: { ...DEFAULT_STATE.passportCases, ...(current.passportCases || {}), [option.id]: !current.passportCases?.[option.id] },
                  }))}
                >
                  <span>{selected ? <Check /> : <Info />}</span>
                  <div><strong>{option.title}</strong><small>{option.detail}</small></div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {availableNow.length > 1 ? (
        <section className="parallel-ready-card">
          <span><Network /></span>
          <div><small>START IN PARALLEL</small><strong>{availableNow.length} steps can move at the same time</strong><p>{availableNow.map((item) => item.title).join(' • ')}</p></div>
          <em>Choose any card in the graph</em>
        </section>
      ) : next ? (
        <div className="next-action-stack">
          <button className="next-action-card" disabled={next.method === 'income' && !state.selectedIncome} onClick={() => handleRequirement(next)}>
            <span><ArrowRight /></span><div><small>NEXT AVAILABLE STEP</small><strong>{next.title}</strong><p>{next.detail}</p></div><ChevronRight />
          </button>
          {next.method === 'income' && (
            <label className="next-branch-picker">
              <span><ChevronDown />Choose one accepted income document</span>
              <select value={state.selectedIncome} onChange={(event) => setState((current) => ({ ...current, selectedIncome: event.target.value }))}>
                <option value="">Select a document path</option>
                {INCOME_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
              </select>
            </label>
          )}
        </div>
      ) : completedCount === coreRequirements.length ? (
        <div className="success-strip"><CheckCircle2 /><div><strong>Your file is organized.</strong><span>Final eligibility and acceptance still come from {program.agency}.</span></div></div>
      ) : null}

      <div className="checklist-viewbar">
        <div><span className="section-kicker">CHECKLIST VIEW</span><strong>See how every step connects</strong></div>
        <div className="checklist-view-switch" role="group" aria-label="Choose checklist view">
          <button type="button" className={checklistView === 'graph' ? 'active' : ''} aria-pressed={checklistView === 'graph'} onClick={() => setState((current) => ({ ...current, checklistView: 'graph' }))}><Network />Graph</button>
          <button type="button" className={checklistView === 'list' ? 'active' : ''} aria-pressed={checklistView === 'list'} onClick={() => setState((current) => ({ ...current, checklistView: 'list' }))}><ListChecks />List</button>
        </div>
      </div>

      {checklistView === 'graph' ? (
        <div className="requirements-layout graph-layout">
          <RequirementGraph requirements={requirements} program={program} onOpen={handleRequirement} selectedIncome={state.selectedIncome} />
          <JourneyAside program={program} isBpms={isBpms} isPassport={isPassport} />
        </div>
      ) : (
        <div className="requirements-layout">
          <section className="requirement-panel">
            <div className="panel-heading"><div><span className="section-kicker">BRANCHING CHECKLIST</span><h2>What you need</h2></div><span>{requirements.length} groups</span></div>
            <p className="panel-intro">You do not have to get everything at once. eAbot unlocks the next sensible action.</p>
            <ol className="requirement-list">
              {requirements.map((requirement, index) => {
                const Icon = requirement.icon;
                return (
                  <li key={requirement.id} className={`requirement-row ${requirement.status}`}>
                    <span className="requirement-number">{requirement.status === 'complete' ? <Check /> : index + 1}</span>
                    <span className="requirement-icon"><Icon /></span>
                    <div className="requirement-copy">
                      <div><div className="requirement-title-block">{requirement.stageLabel && <small>{requirement.stageLabel}</small>}<strong>{requirement.title}</strong></div><RequirementStatus status={requirement.status} /></div>
                      <p>{requirement.detail}</p>
                      <span className="document-source">From: {requirement.source}</span>
                      {requirement.status === 'locked' && <span className="locked-note"><LockKeyhole />{requirement.lockedBy}</span>}
                      {requirement.method === 'income' && requirement.status === 'available' && (
                        <label className="branch-picker">
                          <span><ChevronDown /> Choose one accepted path</span>
                          <select value={state.selectedIncome} onChange={(event) => setState((current) => ({ ...current, selectedIncome: event.target.value }))}>
                            <option value="">Select a document</option>
                            {INCOME_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}
                          </select>
                        </label>
                      )}
                      {requirement.status === 'processing' && requirement.method === 'egov' && (
                        <div className="processing-detail"><span><Check /> Request and payment complete</span><button onClick={() => setState((current) => ({ ...current, complete: [...new Set([...current.complete, requirement.id])] }))}>Mark as issued</button></div>
                      )}
                    </div>
                    {requirement.status === 'available' && (
                      <button className="row-action" disabled={requirement.method === 'income' && !state.selectedIncome} onClick={() => handleRequirement(requirement)}>
                        {requirement.method === 'egov' ? 'Request through eGov' : requirement.method === 'assisted' ? 'View instructions' : 'Add document'}<ChevronRight />
                      </button>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
          <JourneyAside program={program} isBpms={isBpms} isPassport={isPassport} />
        </div>
      )}
      <BottomNavigation active="documents" onNavigate={onNavigate} />
    </main>
  );
}

function DocumentScreen({ requirement, state, onBack, onPayment, onComplete }) {
  if (!requirement) return null;
  const Icon = requirement.icon || FileText;
  const isEgov = requirement.method === 'egov';
  const isIncome = requirement.method === 'income';
  return (
    <main className="focused-page screen-enter">
      <FocusHeader title="Requirement details" subtitle="Step-by-step" onBack={onBack} />
      <div className="focused-content">
        <div className="document-hero">
          <span className="document-symbol"><Icon /></span>
          <DemoPill compact />
          <h1 tabIndex="-1">{requirement.title}</h1>
          <p>{requirement.detail}</p>
        </div>
        <section className="detail-card">
          <div className="detail-row"><span>Purpose</span><strong>{state.selectedProgram === 'bpms' ? 'Merit scholarship readiness' : state.selectedProgram === 'dfa-passport' ? 'Passport application readiness' : 'Education assistance readiness'}</strong></div>
          <div className="detail-row"><span>Document source</span><strong>{requirement.source}</strong></div>
          <div className="detail-row"><span>Current status</span><StatusPill tone="blue">Ready to start</StatusPill></div>
          {isEgov && <div className="detail-row"><span>Service fee</span><strong>₱155.00 <small>sandbox</small></strong></div>}
          {isIncome && <div className="detail-row"><span>Selected path</span><strong>{INCOME_OPTIONS.find((item) => item.id === state.selectedIncome)?.title}</strong></div>}
        </section>

        {isEgov ? (
          <section className="fulfillment-options">
            <h2>How would you like to get it?</h2>
            <button className="fulfillment-option selected" onClick={onPayment}><span><Landmark /></span><div><strong>Request through eGov</strong><p>Connected document request and eGovPay checkout.</p><em>eGovPay sandbox • Secure flow</em></div><ChevronRight /></button>
            <button className="fulfillment-option" onClick={() => onComplete(requirement.id)}><span><Upload /></span><div><strong>I already have a copy</strong><p>Use a safe sample file for this prototype.</p><em>No real document is uploaded</em></div><ChevronRight /></button>
          </section>
        ) : (
          <section className="sample-upload">
            <div className="upload-illustration"><Upload /><span>PDF</span></div>
            <h2>Use a sample document</h2>
            <p>For your privacy, this prototype does not accept real personal files. The button below simulates a validated upload.</p>
            <button className="primary-button" onClick={() => onComplete(requirement.id)}><FileCheck2 />Add safe sample document</button>
          </section>
        )}
        <div className="privacy-note"><ShieldCheck /><p><strong>Prototype privacy:</strong> never enter a real government ID, account number, or payment credential.</p></div>
      </div>
    </main>
  );
}

function PaymentQr() {
  const size = 21;
  const isFinder = (row, col, top, left) => {
    const r = row - top;
    const c = col - left;
    if (r < 0 || c < 0 || r > 6 || c > 6) return null;
    return r === 0 || c === 0 || r === 6 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
  };
  const cells = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const finder = isFinder(row, col, 0, 0) ?? isFinder(row, col, 0, 14) ?? isFinder(row, col, 14, 0);
      const filled = finder === null ? ((row * 11 + col * 7 + row * col * 3) % 9 < 4) : finder;
      cells.push(<span key={`${row}-${col}`} className={filled ? 'filled' : ''} />);
    }
  }
  return <div className="mock-qr" role="img" aria-label="eGovPay sandbox payment QR preview">{cells}</div>;
}

function PaymentScreen({ onBack, onPaid }) {
  const [transaction, setTransaction] = useState(null);
  const [apiState, setApiState] = useState('idle');

  const requestJson = async (url, options) => {
    const response = await fetch(url, options);
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error || `Request failed with HTTP ${response.status}.`);
    return payload;
  };

  const requestWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 1800);
    try {
      return await requestJson(url, { ...options, signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const createSandboxSession = () => {
    const suffix = Date.now().toString().slice(-8);
    return {
      uuid: window.crypto?.randomUUID?.() || `00000000-0000-4000-8000-${suffix.padStart(12, '0')}`,
      refno: `EGP-${suffix}`,
      txnid: `EABOT-${suffix}`,
      amount: 155,
      currency: 'PHP',
      paymentStatus: 'READY',
      url: null,
      sandboxFallback: true,
      testMode: true,
    };
  };

  const generateTransaction = async () => {
    setApiState('creating');
    try {
      const payload = await requestWithTimeout('/api/egovpay/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!payload.transaction?.uuid) throw new Error('Payment session was not returned.');
      setTransaction(payload.transaction);
      setApiState('created');
    } catch {
      setTransaction(createSandboxSession());
      setApiState('created');
    }
  };

  const checkTransaction = async () => {
    if (!transaction?.uuid) return;
    setApiState('checking');
    if (transaction.sandboxFallback) {
      setTransaction((current) => ({ ...current, paymentStatus: 'PAID' }));
      setApiState('created');
      return;
    }
    try {
      const payload = await requestWithTimeout(`/api/egovpay/status?uuid=${encodeURIComponent(transaction.uuid)}`);
      if (!payload.transaction) throw new Error('Payment status was not returned.');
      setTransaction((current) => ({ ...current, ...payload.transaction, url: current.url, refno: current.refno }));
      setApiState('created');
    } catch {
      setTransaction((current) => ({ ...current, paymentStatus: 'PAID', sandboxFallback: true }));
      setApiState('created');
    }
  };

  const reference = transaction?.refno || transaction?.txnid || 'Generated after checkout starts';

  return (
    <main className="focused-page payment-page screen-enter">
      <FocusHeader title="eGovPay" subtitle="Secure government checkout" onBack={onBack} />
      <div className="focused-content payment-content">
        <div className="payment-heading"><h1 tabIndex="-1">Complete your payment</h1><p>Create a secure payment session for your supporting-document request.</p></div>

        <section className="test-payment-panel">
          <div className="test-payment-heading"><span><WalletCards /></span><div><small>EGOVPAY SANDBOX</small><h2>Secure payment session</h2><p>Your reference and checkout status are generated automatically.</p></div></div>
          {!transaction ? (
            <button className="primary-button" onClick={generateTransaction} disabled={apiState === 'creating'}>
              {apiState === 'creating' ? <><span className="spinner" />Creating secure session…</> : <><WalletCards />Start payment</>}
            </button>
          ) : (
            <div className="transaction-result" aria-live="polite">
              <div className="transaction-status"><CheckCircle2 /><div><strong>Payment session ready</strong><span>{transaction.paymentStatus || 'INITIAL'} • ₱{Number(transaction.amount || 155).toFixed(2)} • Sandbox</span></div></div>
              <dl>
                <div><dt>Reference</dt><dd>{reference}</dd></div>
                <div><dt>Transaction UUID</dt><dd>{transaction.uuid}</dd></div>
              </dl>
              <div className="payment-api-actions">
                {transaction.url && <a className="primary-button" href={transaction.url} target="_blank" rel="noreferrer">Open secure checkout<ExternalLink /></a>}
                <button className="secondary-button" onClick={checkTransaction} disabled={apiState === 'checking'}>{apiState === 'checking' ? <><span className="dark-spinner" />Refreshing…</> : <><RotateCcw />Refresh payment status</>}</button>
              </div>
            </div>
          )}
        </section>

        <section className="qr-card">
          <PaymentQr />
          <strong>₱155.00</strong>
          <span>eGovPay payment QR</span>
          <small>Reference: {reference}</small>
        </section>
        <section className="order-summary">
          <h2>Request summary</h2>
          <dl>
            <div><dt>Document</dt><dd>PSA Birth Certificate</dd></div>
            <div><dt>Purpose</dt><dd>Scholarship readiness</dd></div>
            <div><dt>Applicant</dt><dd>{PROFILE.name}</dd></div>
            <div><dt>Payment channel</dt><dd>eGovPay</dd></div>
          </dl>
        </section>
        <div className="payment-warning"><ShieldCheck /><p><strong>Sandbox checkout.</strong> This presentation flow does not move live funds.</p></div>
        <button className="primary-button sticky-action" disabled={!transaction} onClick={() => onPaid(transaction)}><ArrowRight />Continue to receipt</button>
      </div>
    </main>
  );
}

function ReceiptScreen({ receipt, onReturn }) {
  return (
    <main className="focused-page receipt-page screen-enter">
      <FocusHeader title="Payment receipt" subtitle="eGovPay confirmation" onBack={onReturn} />
      <div className="focused-content">
        <section className="receipt-card">
          <div className="receipt-success"><span><Check /></span><small>EGOVPAY SANDBOX</small><h1 tabIndex="-1">Payment confirmed</h1><p>Your payment session was recorded and the supporting-document request is ready to continue.</p></div>
          <div className="receipt-tear" />
          <dl className="receipt-details">
            <div><dt>Receipt number</dt><dd>{receipt?.number || 'EABOT-SBX-RCPT-1042'}</dd></div>
            <div><dt>Document</dt><dd>PSA Birth Certificate</dd></div>
            <div><dt>Applicant</dt><dd>{PROFILE.name}</dd></div>
            <div><dt>Date and time</dt><dd>{receipt?.date || 'Jul 22, 2026 • 10:42 AM'}</dd></div>
            <div><dt>Amount</dt><dd className="receipt-amount">₱155.00</dd></div>
            <div><dt>Payment status</dt><dd><StatusPill tone="blue">{receipt?.paymentStatus || 'PAID'}</StatusPill></dd></div>
          </dl>
        </section>
        <button className="secondary-button download-button" onClick={() => window.print()}><Download />Download receipt</button>
        <div className="payment-warning"><Info /><p>Sandbox receipt for presentation use. No live funds were moved.</p></div>
        <button className="primary-button sticky-action" onClick={onReturn}><FileCheck2 />Return to updated checklist</button>
      </div>
    </main>
  );
}

function AssistantScreen({ onNavigate }) {
  const prompts = ['Which opportunity fits an incoming freshman?', 'What should I prepare before enrollment?', 'Why is my document locked?'];
  const [answer, setAnswer] = useState('');
  return (
    <main className="page content-page assistant-screen screen-enter">
      <div className="assistant-mark"><Bot /></div>
      <DemoPill />
      <h1 tabIndex="-1">Ask eAbot</h1>
      <p className="assistant-lead">Get a plain-language starting point. Agency rules—not AI—decide eligibility.</p>
      <div className="prompt-list">{prompts.map((prompt) => <button key={prompt} onClick={() => setAnswer(prompt)}>{prompt}<ChevronRight /></button>)}</div>
      {answer && <div className="assistant-answer" aria-live="polite"><span><Bot /></span><div><strong>Here is the useful next step</strong><p>{answer.includes('incoming') ? 'Start with the opportunity picker. TES generally becomes actionable after enrollment, DSWD AICS requires a crisis assessment, and merit calls are cycle-specific.' : answer.includes('enrollment') ? 'Keep your admission proof and prepare to request your Certificate of Registration or Enrollment from the school registrar.' : 'A locked item depends on an earlier step. Finish the highlighted “Ready to start” item and eAbot will unlock the next action.'}</p><button onClick={() => onNavigate('opportunities')}>View opportunities</button></div></div>}
      <BottomNavigation active="assistant" onNavigate={onNavigate} />
    </main>
  );
}

function ProfileScreen({ state, onNavigate, onReset }) {
  return (
    <main className="page content-page profile-screen screen-enter">
      <div className="profile-hero"><Avatar /><DemoPill /><h1 tabIndex="-1">{PROFILE.name}</h1><p>{PROFILE.status}</p></div>
      <section className="profile-details"><h2>Demo matching profile</h2><dl><div><dt>Age</dt><dd>{PROFILE.age}</dd></div><div><dt>Location</dt><dd>{PROFILE.city}</dd></div><div><dt>Current goal</dt><dd>Find college support</dd></div><div><dt>Saved journey</dt><dd>{PROGRAMS.find((item) => item.id === state.selectedProgram)?.shortTitle}</dd></div></dl></section>
      <div className="privacy-note"><ShieldCheck /><p><strong>Synthetic data only.</strong> This profile is fictional and exists solely for the hackathon demonstration.</p></div>
      <button className="reset-button" onClick={onReset}><RotateCcw />Reset the guided demo</button>
      <BottomNavigation active="profile" onNavigate={onNavigate} />
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [state, setState] = useState(safeRead);
  const [activeRequirement, setActiveRequirement] = useState(null);
  const announcementRef = useRef(null);

  useEffect(() => {
    window.localStorage.setItem('eabot-youth-demo-v1', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    const heading = document.querySelector('main h1');
    const focusTimer = window.setTimeout(() => heading?.focus({ preventScroll: true }), 40);
    return () => window.clearTimeout(focusTimer);
  }, [screen]);

  const requirements = useMemo(() => state.selectedProgram === 'bpms' ? getBpmsRequirements(state) : PROGRAM_REQUIREMENTS[state.selectedProgram] || [], [state]);

  const navigate = (target) => {
    if (target === 'documents') {
      setScreen('requirements');
      return;
    }
    if (['school', 'agencies', 'guide', 'help'].includes(target)) {
      setScreen('assistant');
      return;
    }
    setScreen(target);
  };

  const selectProgram = (id) => {
    setState((current) => ({ ...current, selectedProgram: id }));
    setScreen('requirements');
  };

  const openDocument = (requirement) => {
    setActiveRequirement(requirement);
    setScreen('document');
  };

  const completeDocument = (id) => {
    setState((current) => ({ ...current, complete: [...new Set([...current.complete, id])] }));
    setScreen('requirements');
  };

  const completePayment = (transaction) => {
    const receipt = {
      number: transaction?.refno || transaction?.txnid || 'EABOT-SBX-RCPT-1042',
      date: new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date()),
      transactionUuid: transaction?.uuid || null,
      paymentStatus: transaction?.paymentStatus || 'PAID',
    };
    setState((current) => ({ ...current, birthRequest: 'paid', receipt }));
    setScreen('receipt');
    if (announcementRef.current) announcementRef.current.textContent = 'Sandbox payment confirmed. Receipt ready.';
  };

  const resetDemo = () => {
    window.localStorage.removeItem('eabot-youth-demo-v1');
    setState({ ...DEFAULT_STATE, complete: [...DEFAULT_STATE.complete] });
    setActiveRequirement(null);
    setScreen('home');
  };

  return (
    <div className="app-shell">
      <div ref={announcementRef} className="sr-only" aria-live="assertive" />
      {screen === 'home' && <HomeScreen onNavigate={navigate} onSelectProgram={selectProgram} state={state} />}
      {screen === 'opportunities' && <OpportunitiesScreen onNavigate={navigate} onSelectProgram={selectProgram} />}
      {screen === 'requirements' && <RequirementsScreen state={state} setState={setState} onNavigate={navigate} onOpenDocument={openDocument} />}
      {screen === 'document' && <DocumentScreen requirement={activeRequirement || requirements.find((item) => item.status === 'available')} state={state} onBack={() => setScreen('requirements')} onPayment={() => setScreen('payment')} onComplete={completeDocument} />}
      {screen === 'payment' && <PaymentScreen onBack={() => setScreen('document')} onPaid={completePayment} />}
      {screen === 'receipt' && <ReceiptScreen receipt={state.receipt} onReturn={() => setScreen('requirements')} />}
      {screen === 'assistant' && <AssistantScreen onNavigate={navigate} />}
      {screen === 'profile' && <ProfileScreen state={state} onNavigate={navigate} onReset={resetDemo} />}
    </div>
  );
}
