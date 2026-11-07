export const BRAND = {
  name: 'Teralio',
  mark: 'T',
  copyrightYear: 2026,
  taglineLead: 'Smarter energy automation,',
  taglineAccent: 'powered by AI.',
  stayInTouchLabel: 'Stay in touch!',
  feelingLuckyLabel: 'Feeling lucky?',
  subscribePromptLead: 'AI moves fast.',
  subscribePromptStrong: 'Stay ahead with Teralio.',
};

export const MEDIA_ASSETS = {
  hero: {
    skyMorning:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040343_a73684b4-3f71-4613-a843-c8be80fb1211.png&w=1600&q=80',
    skyNight:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040308_f31964ab-ed8e-4ea4-90eb-3226c0859936.png&w=1600&q=80',
    groundMorning:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040259_1be34093-835e-4de4-b3a8-f875e6a74591.png&w=2560&q=85',
    cutoutMorning:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040416_e3b05fa4-cc80-4a43-afde-8a0a053933e9.png&w=2560&q=85',
    groundNight:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040211_c8fd4865-285e-4c1f-8a37-4bfe0771357b.png&w=2560&q=85',
    cutoutNight:
      'https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20261102_040415_2ab95096-8c39-449f-b36c-17c2813815a4.png&w=2560&q=85',
  },
  footerVideo:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260503_104800_bc43ae09-f494-43e3-97d7-2f8c1692cfd7.mp4',
  authVideo:
    'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260506_081238_406ed0e3-5d83-436e-a512-0bbff7ec5b95.mp4',
};

export const NAV_LINKS = [
  { label: 'How It Works', to: '/how-it-works' },
  { label: 'Our Cases', to: '/our-cases' },
  { label: 'About Us', to: '/about-us' },
  { label: 'Careers', to: '/careers' },
  { label: 'Resources', to: '/resources' },
];

export const FOOTER_NAV_COLUMNS = [
  {
    title: 'Navigation',
    links: [
      { label: 'How it works', to: '/how-it-works' },
      { label: 'Features', to: '/customers' },
      { label: 'Pricing', to: '/quote' },
      { label: 'Testimonials', to: '/our-cases' },
      { label: 'FAQ', to: '/resources' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'Blog', to: '/resources' },
      { label: 'About', to: '/about-us' },
      { label: 'Careers', to: '/careers' },
      { label: 'Terms and Condition', to: '/resources?doc=terms' },
      { label: 'Privacy Policy', to: '/resources?doc=privacy' },
    ],
  },
];

export const FOOTER_SOCIAL_LINKS = [
  { id: 'discord', label: 'Teralio Discord', href: 'https://discord.com' },
  { id: 'x', label: 'Teralio on X', href: 'https://x.com' },
  { id: 'linkedin', label: 'Teralio LinkedIn', href: 'https://linkedin.com' },
  { id: 'github', label: 'Teralio GitHub', href: 'https://github.com' },
];

export const AUTH_PHASES = [
  { number: 1, text: 'Register your identity' },
  { number: 2, text: 'Configure your studio' },
  { number: 3, text: 'Finalize your profile' },
];

export const PROOF_METRICS = [
  {
    value: '$0.00',
    label: 'Guaranteed Electricity Bill',
    detail: 'Contractually backed for 84 consecutive billing cycles',
  },
  {
    value: '23.8%',
    label: 'Charcoal N-Type Tile Yield',
    detail: 'Bifacial low-light harvest even through coastal morning fog',
  },
  {
    value: '< 10 ms',
    label: 'Smart Controller Cutover',
    detail: 'Imperceptible islanding during winter storms & grid brownouts',
  },
  {
    value: '25 Yrs',
    label: 'Structural Roof Warranty',
    detail: 'Class 4 hail impact & 210 km/h wind uplift certification',
  },
];

export const HOURLY_PROFILES = [
  {
    id: 'dawn',
    time: '06:30',
    period: 'Morning Fog',
    isNightMode: false,
    solarKw: 3.4,
    homeKw: 1.9,
    batteryPct: 68,
    gridAction: 'Charging Vault (+1.5 kW)',
    spotPrice: '$0.14 / kWh',
    netBill: '$0.00',
    summary:
      'Low-angle diffused photons pierce morning mist. High-sensitivity N-type cells wake early, covering breakfast & heat-pump loads while banking surplus.',
  },
  {
    id: 'midday',
    time: '12:45',
    period: 'Solar Peak',
    isNightMode: false,
    solarKw: 14.2,
    homeKw: 2.1,
    batteryPct: 98,
    gridAction: 'Banking Reserve (+12.1 kW)',
    spotPrice: '$0.06 / kWh',
    netBill: '$0.00',
    summary:
      'Wholesale grid prices dip near zero at noon. Instead of exporting cheap power, Teralio Smart Controller tops off your LFP Vault and pre-heats thermal storage.',
  },
  {
    id: 'dusk',
    time: '18:30',
    period: 'Evening Arbitrage',
    isNightMode: true,
    solarKw: 1.2,
    homeKw: 3.8,
    batteryPct: 84,
    gridAction: 'Exporting Peak Credit ($0.49/kWh)',
    spotPrice: '$0.49 / kWh',
    netBill: '$0.00',
    summary:
      'Utility tariffs surge 8x at supper hour. Teralio dispatches reserved kWh into the local feeder, building a cash credit buffer that pays winter months.',
  },
  {
    id: 'midnight',
    time: '01:15',
    period: 'Silent Night',
    isNightMode: true,
    solarKw: 0.0,
    homeKw: 1.1,
    batteryPct: 61,
    gridAction: 'Autonomous Island Mode',
    spotPrice: '$0.09 / kWh',
    netBill: '$0.00',
    summary:
      'Your home runs silently on stored sunshine. If a blizzard forecast approaches, Teralio pre-buffers backup capacity automatically.',
  },
];

export const WEATHER_SCENARIOS = {
  summer: {
    name: 'Clear Summer Week',
    tag: 'High Irradiance',
    solarDailyKwh: 78.4,
    consumptionKwh: 29.0,
    batteryFloor: '64%',
    arbitrageCredit: '+$148 / mo',
    guaranteedBill: '$0.00',
    controllerNote:
      'Surplus midday harvest charges EVs directly and exports during 17:00–21:00 tariff spikes, accumulating seasonal credits.',
  },
  fog: {
    name: 'Dense Coastal Fog',
    tag: 'Diffused Light',
    solarDailyKwh: 31.2,
    consumptionKwh: 27.5,
    batteryFloor: '48%',
    arbitrageCredit: '+$34 / mo',
    guaranteedBill: '$0.00',
    controllerNote:
      'Anti-reflective textured charcoal glass captures scattered UV/blue wavelengths, sustaining 100% self-consumption without grid draw.',
  },
  winter: {
    name: 'Sub-Zero Winter Storm',
    tag: 'Snow & Short Days',
    solarDailyKwh: 14.6,
    consumptionKwh: 42.0,
    batteryFloor: '35%',
    arbitrageCredit: 'Covered by Summer Ledger',
    guaranteedBill: '$0.00',
    controllerNote:
      'Active micro-pulse snow shedding clears roof pitch in 22 minutes. Any seasonal grid import is settled automatically by Teralio’s 7-Year Guarantee Reserve.',
  },
  outage: {
    name: '72-Hour Grid Blackout',
    tag: 'Islanded Microgrid',
    solarDailyKwh: 38.0,
    consumptionKwh: 24.2,
    batteryFloor: '52%',
    arbitrageCredit: '100% Off-Grid Protected',
    guaranteedBill: '$0.00',
    controllerNote:
      'Solid-state transfer switch isolates your main panel in 8.4 ms. Heat pump, refrigeration, lighting, and Wi-Fi never blink.',
  },
};

export const CASE_STUDIES = [
  {
    id: 'uppsala-farmhouse',
    title: 'Uppsala Charcoal Farmhouse',
    location: 'Uppsala, Sweden',
    climate: 'Nordic / Snow',
    roofArea: '218 m²',
    systemSize: '18.4 kWp',
    storageSize: '30.0 kWh',
    priorAnnualBill: '$4,380 / yr',
    currentBill: '$0 / yr',
    monthsAtZero: 38,
    co2Offset: '6.8 t / yr',
    preferNightImg: true,
    quote:
      'Three Swedish winters with a ground-source heat pump and two electric cars—not a single krona paid for electricity.',
    homeowner: 'Henrik & Maja Lindqvist',
    specs: [
      '42° standing-seam compatible charcoal solar slate',
      'Automated snow-melt thermal pulse array',
      'NordPool hourly spot-price VPP integration',
    ],
  },
  {
    id: 'vermont-gable',
    title: 'Champlain Valley Timber Barn',
    location: 'Burlington, Vermont',
    climate: 'Continental',
    roofArea: '264 m²',
    systemSize: '22.0 kWp',
    storageSize: '45.0 kWh',
    priorAnnualBill: '$5,120 / yr',
    currentBill: '$0 / yr',
    monthsAtZero: 29,
    co2Offset: '9.4 t / yr',
    preferNightImg: false,
    quote:
      'Neighbors thought it was architectural slate until we told them it powers our entire woodworking studio and home.',
    homeowner: 'Claire & Thomas Vance',
    specs: [
      'Dual-pitch heritage gable flush integration',
      'Whole-home 200A continuous backup gateway',
      'Survived four ice storms with zero downtime',
    ],
  },
  {
    id: 'astoria-mist',
    title: 'Astoria Ridge Fog Residence',
    location: 'Astoria, Oregon',
    climate: 'Coastal Fog',
    roofArea: '186 m²',
    systemSize: '15.6 kWp',
    storageSize: '28.8 kWh',
    priorAnnualBill: '$3,490 / yr',
    currentBill: '$0 / yr',
    monthsAtZero: 44,
    co2Offset: '5.9 t / yr',
    preferNightImg: true,
    quote:
      'We get 210 overcast days a year on the Pacific coast. Teralio’s Smart Controller still keeps our statement at $0.00.',
    homeowner: 'Dr. Evan Morales',
    specs: [
      'Marine-grade C5-M salt-mist anodized framing',
      'High-haze diffused-spectrum cell binning',
      'Predictive Pacific barometric dispatch algorithm',
    ],
  },
  {
    id: 'bavaria-courtyard',
    title: 'Allgäu Alpine Hof',
    location: 'Kempten, Germany',
    climate: 'Nordic / Snow',
    roofArea: '290 m²',
    systemSize: '24.8 kWp',
    storageSize: '45.0 kWh',
    priorAnnualBill: '$6,240 / yr',
    currentBill: '$0 / yr',
    monthsAtZero: 31,
    co2Offset: '11.1 t / yr',
    preferNightImg: false,
    quote:
      'Even in December alpine fog, our dynamic tariff arbitrage bank covers every kilowatt-hour our hydronic heating draws.',
    homeowner: 'Lukas & Hanna Weber',
    specs: [
      '4,200 Pa heavy alpine snow load certification',
      'EPEX Spot 15-minute automated trading',
      'Three-phase 22 kW bidirectional EV readiness',
    ],
  },
  {
    id: 'maine-peninsula',
    title: 'Penobscot Point Gables',
    location: 'Camden, Maine',
    climate: 'Coastal Fog',
    roofArea: '205 m²',
    systemSize: '17.2 kWp',
    storageSize: '30.0 kWh',
    priorAnnualBill: '$4,690 / yr',
    currentBill: '$0 / yr',
    monthsAtZero: 24,
    co2Offset: '7.2 t / yr',
    preferNightImg: true,
    quote:
      'Coastal nor’easters used to knock out our feeder twice a winter. Now we only notice because the street goes dark.',
    homeowner: 'Eleanor & Sam Whitman',
    specs: [
      '210 km/h Atlantic gale uplift rating',
      'Sub-zero self-warming LiFePO4 vault modules',
      'Zero visible conduits or external combiner boxes',
    ],
  },
  {
    id: 'hudson-passive',
    title: 'Rhinebeck Passive Homestead',
    location: 'Rhinebeck, New York',
    climate: 'Continental',
    roofArea: '172 m²',
    systemSize: '14.4 kWp',
    storageSize: '28.8 kWh',
    priorAnnualBill: '$3,820 / yr',
    currentBill: '$0 / yr',
    monthsAtZero: 36,
    co2Offset: '6.3 t / yr',
    preferNightImg: false,
    quote:
      'Cleanest roof line in the valley, and our utility statement has read $0.00 for three straight years.',
    homeowner: 'Nadia & Marcus Chen',
    specs: [
      'Airtight passive-house membrane flashing kit',
      'Geothermal heat-pump thermal load shifting',
      'NYISO peak demand response revenue sharing',
    ],
  },
];

export const OPEN_ROLES = [
  {
    id: 'staff-power-electronics',
    title: 'Staff Power Electronics Architect',
    department: 'Hardware & Power',
    location: 'Stockholm / Hybrid',
    type: 'Full-Time',
    comp: '€135k – €168k + Equity',
    summary:
      'Design next-generation silicon-carbide (SiC) bidirectional inverters integrated directly beneath the ridge cap.',
    requirements: [
      '8+ years designing >10 kW grid-forming inverters or HV battery BMS hardware',
      'Deep fluency in electromagnetic compatibility (EMC) and UL 1741 SA / IEEE 1547',
      'Hands-on thermal simulation for passive-cooled architectural enclosures',
    ],
  },
  {
    id: 'ml-energy-trading',
    title: 'Principal Grid Arbitrage & Forecasting Engineer',
    department: 'Grid AI & Firmware',
    location: 'Zurich / Remote EU',
    type: 'Full-Time',
    comp: 'CHF 155k – CHF 190k + Equity',
    summary:
      'Build probabilistic weather + day-ahead wholesale electricity bidding models that power Teralio’s 7-Year $0 Bill Guarantee.',
    requirements: [
      'Production experience in stochastic optimization, time-series forecasting, or quantitative energy trading',
      'Familiarity with NordPool, EPEX Spot, ERCOT, or CAISO market microstructures',
      'Ability to deploy lightweight quantized inference to edge Rust firmware',
    ],
  },
  {
    id: 'embedded-rust',
    title: 'Senior Embedded Rust Engineer — Smart Controller',
    department: 'Grid AI & Firmware',
    location: 'Austin, TX / Hybrid',
    type: 'Full-Time',
    comp: '$165k – $195k + Equity',
    summary:
      'Own deterministic <10 ms islanding cutover logic and local Home Area Network telemetry on the Teralio Smart Controller.',
    requirements: [
      '5+ years bare-metal or RTOS firmware in Rust or modern C++',
      'Experience with CAN-FD, Modbus TCP, Matter Energy, and OCPP 2.0.1',
      'Obsession with fault-tolerant OTA updates and hardware watchdogs',
    ],
  },
  {
    id: 'architectural-roofing-lead',
    title: 'Lead Building Envelope & Flashing Industrial Designer',
    department: 'Architectural Roofing',
    location: 'Stockholm',
    type: 'Full-Time',
    comp: '€110k – €138k + Equity',
    summary:
      'Refine interlocking charcoal glass-slate details, dormer valleys, and concealed gutter wireways so roofers install 40% faster.',
    requirements: [
      'Background in architectural facade systems, BIPV, or Scandinavian metal/slate roofing',
      'Mastery of CAD tolerance stacks, EPDM/silicone gasket longevity, and wind-driven rain testing',
      'Track record taking physical building products from prototype rig to mass tooling',
    ],
  },
  {
    id: 'vpp-regulatory',
    title: 'Head of Utility Interconnection & VPP Markets',
    department: 'Operations',
    location: 'New York / Hybrid',
    type: 'Full-Time',
    comp: '$175k – $210k + Equity',
    summary:
      'Expand Teralio’s Virtual Power Plant retail & wholesale settlement licenses across North American and European ISOs.',
    requirements: [
      '6+ years in distributed energy aggregation, retail energy supply, or FERC Order 2222 programs',
      'Strong relationships with DSOs, utilities, and clean-energy project underwriters',
      'Clear communicator able to translate complex tariff math into simple $0 homeowner guarantees',
    ],
  },
];

export const RESOURCES_LIST = [
  {
    id: 'wp-zero-bill-math',
    category: 'Technical Whitepapers',
    readTime: '11 min read',
    date: 'Oct 2026',
    title: 'How Algorithmic Arbitrage Eliminates Residential Electricity Bills for 84 Months',
    excerpt:
      'A transparent actuarial and thermodynamic breakdown of how a 16 kWp solar roof + 30 kWh LFP vault generates net-positive wholesale cashflow even in 59°N latitudes.',
    metrics: 'Includes 4,200-home empirical dataset',
  },
  {
    id: 'guide-architect-spec',
    category: 'Homeowner Guides',
    readTime: '8 min read',
    date: 'Sep 2026',
    title: 'Architect & Custom Homebuilder Specification Guide (v4.2)',
    excerpt:
      'Truss load tables (21.4 kg/m²), roof pitch minimums (14°–65°), concealed ridge ventilation details, and pre-wire conduit checklists for new builds and re-roofs.',
    metrics: 'CAD / BIM & UL 790 Class A specs',
  },
  {
    id: 'report-winter-fog',
    category: 'Grid Market Reports',
    readTime: '6 min read',
    date: 'Aug 2026',
    title: '2026 Winter Resilience Audit: Sub-Zero & Heavy Fog Yield Across 1,100 Homes',
    excerpt:
      'Measured N-type tunnel-oxide passivated contact (TOPCon) cell performance under diffused coastal mist, frost rime, and active snow-shedding cycles.',
    metrics: '+19.4% low-light gain vs. rack PERC',
  },
  {
    id: 'terms',
    category: 'Warranty & Legal',
    readTime: '5 min read',
    date: 'Oct 2026',
    title: 'Terms & Conditions: The 7-Year $0 Bill Guarantee Agreement',
    excerpt:
      'No hidden escalators, no surprise true-ups. Read the exact contractual terms covering EV charging allowances, heat pumps, property transfers, and battery health.',
    metrics: '100% transferable on home sale',
  },
  {
    id: 'privacy',
    category: 'Warranty & Legal',
    readTime: '4 min read',
    date: 'Oct 2026',
    title: 'Privacy Policy & Edge Telemetry Data Governance',
    excerpt:
      'How Teralio encrypts local Smart Controller telemetry, anonymizes VPP dispatch bids, and never sells household occupancy or load signatures.',
    metrics: 'GDPR & SOC2 Type II verified',
  },
  {
    id: 'wp-lfp-safety',
    category: 'Technical Whitepapers',
    readTime: '9 min read',
    date: 'Jun 2026',
    title: 'Cobalt-Free LiFePO4 Chemistry & UL 9540A Thermal Runaway Prevention',
    excerpt:
      'Inside Teralio Vault’s cell-level fused architecture, aerosol fire suppression, and 10,000-cycle longevity at 85% depth of discharge.',
    metrics: 'Zero thermal propagation verified',
  },
];

export const FAQ_ITEMS = [
  {
    q: 'What happens if a winter is unusually dark and my home imports power from the grid?',
    a: 'You still pay $0.00. During sunny and windy price-spike hours across the year, Teralio Smart Controller trades surplus energy into wholesale markets to build a dedicated reserve balance for your home. If severe weather ever exceeds that reserve, Teralio settles the difference directly with your utility under our 7-Year Guarantee.',
  },
  {
    q: 'Are EV charging and electric heat pumps included in the $0 bill guarantee?',
    a: 'Yes. During your Instant Quote, we size your roof array and LFP Vault specifically around your household baseline plus up to two EVs and whole-home heat pump heating. Smart Controller schedules EV charging into high-solar or negative-tariff windows automatically.',
  },
  {
    q: 'Does Teralio replace my actual roof, or mount on top of existing shingles?',
    a: 'Teralio is your complete structural, weatherproof roof. We strip aging shingles down to the decking, lay high-temp ice-and-water membrane, and install interlocking tempered charcoal solar slates alongside matching architectural perimeter tiles.',
  },
  {
    q: 'What happens after the first 7 years?',
    a: 'You own the entire hardware system outright—with 18+ years remaining on your 25-year structural & power warranty. After year 7, you can either renew Teralio Grid Assurance or keep 100% of your solar self-generation and wholesale export revenue yourself.',
  },
  {
    q: 'What if I sell my house before the 7 years are up?',
    a: 'Both the 25-year structural warranty and the remaining balance of the 7-Year $0 Electricity Bill Guarantee transfer seamlessly to the new buyer at zero fee—typically increasing appraised resale value.',
  },
];
