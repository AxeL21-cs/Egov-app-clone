const isFilipino = {
  id: 'is-filipino', label: 'Filipino citizen', kind: 'hard',
  test: (p) => p.citizenship === null ? 'unknown' : p.citizenship === 'PH',
};

const isIncomingFreshman = {
  id: 'is-incoming-freshman', label: 'Incoming first-year student', kind: 'hard',
  test: (p) => p.educationStatus === null ? 'unknown' : p.educationStatus === 'incoming-college',
};

const isStudent = {
  id: 'is-student', label: 'Incoming or enrolled college student', kind: 'hard',
  test: (p) => p.educationStatus === null
    ? 'unknown'
    : ['incoming-college', 'enrolled-college'].includes(p.educationStatus),
};

const strongRecord = {
  id: 'strong-record', label: 'Strong Grade 12 record', kind: 'soft',
  test: (p) => p.academicStanding === null ? 'unknown' : p.academicStanding === 'high',
};

const lowIncome = {
  id: 'low-income', label: 'Low household income', kind: 'soft',
  test: (p) => p.householdIncomeBracket === null ? 'unknown' : p.householdIncomeBracket === 'low',
};

const hasStudentInHousehold = {
  id: 'has-student-in-household', label: 'A student in the household', kind: 'hard',
  test: (p) => p.hasStudentInHousehold === null ? 'unknown' : p.hasStudentInHousehold === true,
};

export default [
  {
    id: 'ched-bpms',
    domain: 'education',
    title: 'Bagong Pilipinas Merit Scholarship',
    shortTitle: 'Merit Scholarship',
    agency: 'CHED',
    type: 'Scholarship',
    status: 'Prepare for next call',
    statusTone: 'gold',
    description: 'A competitive merit pathway for high-performing incoming first-year students in priority programs.',
    icon: 'graduation-cap',
    accent: 'blue',
    gate: 'competitive',
    rules: [isFilipino, isIncomingFreshman, strongRecord],
    window: { status: 'closed', nextOpens: null, note: 'AY 2026–2027 call closed; next call not yet announced' },
    source: 'https://bpms.ched.gov.ph/',
    sourceLabel: 'Official CHED portal',
    verifiedOn: '2026-07-27',
    verification: 'verified',
    compassProgramCode: null,
    journey: {
      id: 'ched-bpms-journey',
      steps: [
        {
          id: 'bpms-profile', title: 'Online application profile',
          detail: 'Synthetic identity and basic applicant details are ready.',
          source: 'Applicant profile', icon: 'user-round',
          method: 'none', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'bpms-birth', title: 'PSA birth certificate',
          detail: 'Request a copy through the future eGov document-service connection.',
          source: 'Philippine Statistics Authority', icon: 'file-text',
          method: 'egov', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'bpms-sf9', title: 'Certified SF9 / Form 138',
          detail: 'Signed by your registrar or authorized school representative.',
          source: 'Senior high school registrar', icon: 'school',
          method: 'upload', dependsOn: ['bpms-birth'], conditional: null, options: null,
        },
        {
          id: 'bpms-admission', title: 'College admission proof',
          detail: 'Admission slip or another accepted proof from your selected institution.',
          source: 'College admissions office', icon: 'graduation-cap',
          method: 'upload', dependsOn: ['bpms-sf9'], conditional: null, options: null,
        },
        {
          id: 'bpms-income', title: 'One proof of household income',
          detail: 'Choose one accepted document path below.',
          source: 'BIR, DSWD, or employer', icon: 'wallet-cards',
          method: 'choice', dependsOn: ['bpms-admission'], conditional: null,
          options: [
            { id: 'non-filer', title: 'BIR non-filer / tax exemption certificate', detail: 'For a parent or guardian without a filed income tax return.' },
            { id: 'itr', title: 'Latest ITR or BIR Form 2316', detail: 'For employed or self-employed parents or legal guardians.' },
            { id: 'ofw', title: 'OFW or seafarer income proof', detail: 'Certified latest contract or equivalent proof of income.' },
            { id: 'four-ps', title: '4Ps certification', detail: 'DSWD or city/municipal social welfare certification.' },
          ],
        },
      ],
    },
  },
  {
    id: 'ched-tes',
    domain: 'education',
    title: 'Tertiary Education Subsidy',
    shortTitle: 'TES',
    agency: 'CHED / UniFAST',
    type: 'Grant-in-aid',
    status: 'After enrollment',
    statusTone: 'blue',
    description: 'Support for students enrolled in participating public or private higher education institutions.',
    icon: 'school',
    accent: 'red',
    gate: 'assessment',
    rules: [isFilipino, isStudent, lowIncome],
    window: { status: 'after-enrollment', nextOpens: null, note: 'School-mediated; coordinate with your HEI after enrollment' },
    source: 'https://unifast.gov.ph/tes.html',
    sourceLabel: 'Official UniFAST page',
    verifiedOn: '2026-07-27',
    verification: 'verified',
    compassProgramCode: null,
    journey: {
      id: 'ched-tes-journey',
      steps: [
        {
          id: 'tes-profile', title: 'Student profile',
          detail: 'Demo identity and student status saved.',
          source: 'eAbot demo profile', icon: 'user-round',
          method: 'none', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'tes-enrollment', title: 'Certificate of Registration or Enrollment',
          detail: 'Request this from your school after enrollment.',
          source: 'School registrar', icon: 'school',
          method: 'upload', dependsOn: ['tes-profile'], conditional: null, options: null,
        },
        {
          id: 'tes-residency', title: 'Certificate of Residency',
          detail: 'Conditional for the applicable private-school / no-SUC-or-LUC category.',
          source: 'LGU or barangay', icon: 'building-2',
          method: 'upload', dependsOn: [], conditional: 'private-school-category', options: null,
        },
        {
          id: 'tes-pwd', title: 'PWD ID',
          detail: 'Only needed when claiming the PWD priority category.',
          source: 'PDAO / LGU', icon: 'badge-check',
          method: 'upload', dependsOn: [], conditional: 'claims-pwd', options: null,
        },
      ],
    },
  },
  {
    id: 'dswd-aics',
    domain: 'education',
    title: 'AICS Educational Assistance',
    shortTitle: 'Educational Assistance',
    agency: 'DSWD',
    type: 'Crisis assistance',
    status: 'Assessment required',
    statusTone: 'pink',
    description: 'Short-term assistance for a student or family experiencing an actual crisis, subject to social-worker assessment.',
    icon: 'heart-handshake',
    accent: 'green',
    gate: 'assessment',
    rules: [isFilipino, lowIncome, hasStudentInHousehold],
    window: { status: 'rolling', nextOpens: null, note: 'Local schedules vary' },
    source: 'https://www.dswd.gov.ph/aics/',
    sourceLabel: 'Official DSWD overview',
    verifiedOn: '2026-07-27',
    verification: 'verified',
    compassProgramCode: null,
    journey: {
      id: 'dswd-aics-journey',
      steps: [
        {
          id: 'aics-profile', title: 'Valid ID for the interview',
          detail: 'Demo identity is saved; bring an accepted physical ID to the actual interview.',
          source: 'Applicant', icon: 'user-round',
          method: 'none', dependsOn: [], conditional: null, options: null,
        },
        {
          id: 'aics-school', title: 'Current school document',
          detail: 'Enrollment assessment, certificate of enrollment/registration, or statement of account.',
          source: 'School registrar', icon: 'school',
          method: 'upload', dependsOn: ['aics-profile'], conditional: null, options: null,
        },
        {
          id: 'aics-assessment', title: 'Social-worker assessment',
          detail: 'A DSWD social worker determines whether an actual crisis qualifies for assistance.',
          source: 'DSWD field or satellite office', icon: 'heart-handshake',
          method: 'assisted', dependsOn: ['aics-school'], conditional: null, options: null,
        },
        {
          id: 'aics-local', title: 'Local supporting documents',
          detail: 'Residency, indigency, or authorization documents may be requested for your case.',
          source: 'Barangay / applicant', icon: 'building-2',
          method: 'upload', dependsOn: [], conditional: 'local-requirements', options: null,
        },
      ],
    },
  },
];
