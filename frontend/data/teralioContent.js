import { HERO_IMAGES } from '../constants/heroAssets.js';

export const HOME_TELEMETRY = Object.freeze({
  morning: {
    badge: 'Morning Harvest Active • 08:40 Local',
    headline: 'Capturing diffuse & direct dawn irradiance before peak household demand.',
    summary:
      'Low-angle anti-reflective charcoal tiles wake at first light, powering induction kitchens and heat pumps while topping up your LiFePO4 reserve and banking high-tariff export credits.',
    stats: [
      { label: 'Roof Array Output', value: '9.4 kW', delta: '+98.4% MPPT efficiency' },
      { label: 'Home Consumption', value: '2.1 kW', delta: '100% solar self-powered' },
      { label: 'Reserve Charge', value: '88% SoC', delta: '+4.8 kW charging rate' },
      { label: 'Net Grid Bill', value: '$0.00', delta: '$6.40 morning export credit' },
    ],
    flowSteps: [
      { title: 'Charcoal Solar Array', detail: '9.4 kW DC harvested across 64 architectural tiles' },
      { title: 'Smart Controller AI', detail: 'Routes 2.1 kW to home, 4.8 kW to battery, 2.5 kW to grid' },
      { title: '7-Year Zero Ledger', detail: 'Surplus credits offset winter & storm nights contractually' },
    ],
  },
  night: {
    badge: 'Night Autonomy Active • 21:15 Local',
    headline: 'Silent reserve dispatch & wholesale tariff arbitrage while your home sleeps.',
    summary:
      'When dusk falls and utility rates spike 3.4×, Teralio isolates your home from expensive grid power—running HVAC, EV charging, and warm architectural lighting purely from stored solar.',
    stats: [
      { label: 'Battery Dispatch', value: '3.2 kW', delta: 'Zero grid draw (<8ms switchover)' },
      { label: 'Evening Peak Tariff', value: 'Bypassed', delta: '$0.44/kWh utility spike avoided' },
      { label: 'Reserve Remaining', value: '74% SoC', delta: '31.8 kWh protected through dawn' },
      { label: 'Net Grid Bill', value: '$0.00', delta: 'Month 41 of 84 guaranteed $0' },
    ],
    flowSteps: [
      { title: 'Thermal & LiFePO4 Vault', detail: '43.2 kWh high-density indoor/outdoor silent reserve' },
      { title: 'Smart Controller AI', detail: 'Holds 20% storm buffer while arbitraging overnight spot lows' },
      { title: '7-Year Zero Ledger', detail: 'Contractual zero-balance settlement—even in December' },
    ],
  },
});

export const HOME_PILLARS = Object.freeze([
  {
    id: 'architectural-roof',
    eyebrow: '01 / Architectural Hardware',
    title: 'Charcoal solar roof tiles indistinguishable from Nordic slate.',
    description:
      'Engineered with matte micro-textured tempered glass and concealed busbars. Rated Class-4 against 50mm hail, 210 km/h coastal gusts, and heavy alpine snow loads.',
    metric: '23.8%',
    metricLabel: 'Cell conversion efficiency',
  },
  {
    id: 'smart-controller',
    eyebrow: '02 / Neural Orchestration',
    title: 'A Smart Controller that out-trades the energy market for you.',
    description:
      'Every 5 minutes, Teralio forecasts hyper-local cloud cover, household thermal load, and 48-hour wholesale spot prices—storing cheap or solar kWh and exporting at peak spikes.',
    metric: '288×',
    metricLabel: 'Daily autonomous grid decisions',
  },
  {
    id: 'zero-bill-guarantee',
    eyebrow: '03 / Contractual Guarantee',
    title: 'Seven full years of $0.00 electricity bills, underwritten in writing.',
    description:
      'No seasonal surprises or fine-print weather clauses. If prolonged winter fog ever pushes net usage positive, Teralio settles the utility difference directly on your behalf.',
    metric: '84 mos',
    metricLabel: 'Guaranteed $0 utility balance',
  },
]);

export const HOW_IT_WORKS_STAGES = Object.freeze([
  {
    step: '01',
    title: 'Full-Surface Solar Roof Synthesis',
    subtitle: 'Structural protection meets high-density power generation',
    description:
      'Instead of bolting aluminum racks onto aging shingles, Teralio replaces or integrates flush charcoal solar tiles with color-matched inactive perimeter tiles—turning every sunlit plane into an architectural generator.',
    specs: ['440W equivalent per 1.8m² active zone', 'IP68 marine-grade junction sealing', 'Zero visible silver gridlines'],
  },
  {
    step: '02',
    title: 'High-Density LiFePO4 Energy Vault',
    subtitle: 'Modular 14.4 kWh to 57.6 kWh cobalt-free home storage',
    description:
      'Liquid-regulated lithium iron phosphate modules maintain optimal thermal performance from -25°C winter frost to +48°C summer heatwaves, delivering 10,000+ deep cycles without fire propagation risk.',
    specs: ['< 8ms blackout islanding transfer', '15.2 kW continuous surge output (EV + heat pump)', 'Whisper-quiet 24 dBA natural convection'],
  },
  {
    step: '03',
    title: 'Teralio Smart Controller V4',
    subtitle: 'Autonomous weather-horizon & wholesale tariff arbitrage',
    description:
      'Connected directly to regional day-ahead electricity exchanges and satellite irradiance models, the Smart Controller turns excess daytime harvest into monetary credits that neutralize dark winter weeks.',
    specs: ['Sub-second per-circuit load sensing', 'Automated negative-price grid charging', 'Over-the-air neural model updates'],
  },
  {
    step: '04',
    title: '84-Month Zero-Bill Settlement',
    subtitle: 'Zero invoices, zero tariff anxiety, total transparency',
    description:
      'Teralio becomes your single automated energy steward. Every month for 7 years, your statement reads $0.00—and after year 7, you own an asset still operating above 92% rated capacity.',
    specs: ['25-year structural & weatherproof warranty', '7-year 100% bill-zero financial guarantee', 'Transferable to future home buyers'],
  },
]);

export const TECHNICAL_SPECS = Object.freeze([
  { parameter: 'Active Tile Finish', value: 'Matte Charcoal Obsidian (Low-Glare AR Satin)' },
  { parameter: 'Cell Architecture', value: 'N-Type Back-Contact Monocrystalline Silicon' },
  { parameter: 'Hail & Wind Rating', value: 'UL 2218 Class 4 (50mm steel sphere) • 210 km/h wind uplift' },
  { parameter: 'Smart Controller Compute', value: 'Dual ARM Cortex-A76 Edge NPU + Dual-SIM LTE/Wi-Fi 6' },
  { parameter: 'Battery Chemistry', value: 'Automotive-grade Prismatic LiFePO4 (0% Cobalt)' },
  { parameter: 'Island Switchover Time', value: '7.4 milliseconds (flicker-free medical & server grade)' },
  { parameter: 'Operating Temperature', value: '-30°C to +55°C with active self-warming winter loop' },
  { parameter: 'Guaranteed Bill Protection', value: '84 consecutive billing cycles at $0.00 net homeowner cost' },
]);

export const CASE_STUDIES = Object.freeze([
  {
    id: 'charcoal-farmhouse-uppsala',
    title: 'Värmdö Charcoal Farmhouse',
    location: 'Stockholm Archipelago, Sweden',
    climate: 'Nordic & Cold',
    image: HERO_IMAGES.nightGround,
    morningImage: HERO_IMAGES.morningGround,
    roofArea: '186 m²',
    systemSize: '16.8 kWp',
    storageSize: '43.2 kWh',
    annualSavings: '$4,820 / yr',
    monthsZero: '38 / 84 mos completed',
    quote:
      'Even through January snowstorms with a ground-source heat pump and two EVs, we have not paid a single krona for electricity in over three years.',
    homeowner: 'Henrik & Maja Lindqvist',
    highlights: [
      'Generates 142% of summer load to bank Nordic winter tariff credits',
      'Automated snow-shed thermal pulse clears roof planes in 18 minutes',
      'Preserved historic gable silhouette required by coastal municipality',
    ],
  },
  {
    id: 'mist-ridge-residence',
    title: 'Mist Ridge Timber Villa',
    location: ' Bergen Fjordland, Norway',
    climate: 'Coastal',
    image: HERO_IMAGES.morningGround,
    morningImage: HERO_IMAGES.nightGround,
    roofArea: '154 m²',
    systemSize: '14.2 kWp',
    storageSize: '28.8 kWh',
    annualSavings: '$4,190 / yr',
    monthsZero: '29 / 84 mos completed',
    quote:
      'Bergen sees over 230 days of rain and coastal fog. Teralio’s diffuse-light response and spot-market controller turned a skeptic into an evangelist.',
    homeowner: 'Soren Solberg, Architect',
    highlights: [
      'High-haze spectral tuning captures +19% energy under overcast skies',
      'Marine-anodized flashings resist North Sea salt spray corrosion',
      'Survived 3 regional winter grid outages with zero interruption',
    ],
  },
  {
    id: 'alpine-gable-haus',
    title: 'Engadin Passive Chalet',
    location: 'Graubünden, Switzerland',
    climate: 'Nordic & Cold',
    image: HERO_IMAGES.nightGround,
    morningImage: HERO_IMAGES.morningGround,
    roofArea: '210 m²',
    systemSize: '19.4 kWp',
    storageSize: '57.6 kWh',
    annualSavings: '$5,640 / yr',
    monthsZero: '44 / 84 mos completed',
    quote:
      'At 1,750m altitude, roof durability isn’t optional. Teralio handles two-meter snow loads effortlessly while powering our entire radiant floor system.',
    homeowner: 'Dr. Lukas Weber',
    highlights: [
      'Reinforced 12,000 Pa snow-load subframe certified for high-alpine zones',
      'Exports peak afternoon hydro-deficit power at 3.8× baseline rates',
      'Zero maintenance visits required across four alpine winters',
    ],
  },
  {
    id: 'cotswold-courtyard-barn',
    title: 'Converted Slate Barn',
    location: 'Gloucestershire, United Kingdom',
    climate: 'Heritage',
    image: HERO_IMAGES.morningGround,
    morningImage: HERO_IMAGES.nightGround,
    roofArea: '142 m²',
    systemSize: '12.6 kWp',
    storageSize: '28.8 kWh',
    annualSavings: '$3,910 / yr',
    monthsZero: '22 / 84 mos completed',
    quote:
      'Conservation officers rejected traditional bolt-on panels twice. They approved Teralio’s matte charcoal slate profile in a single review.',
    homeowner: 'claire & Thomas Whitaker',
    highlights: [
      'Approved in Area of Outstanding Natural Beauty conservation review',
      'Smart Controller charges overnight during negative UK wind-surplus windows',
      'Eliminated £3,100 annual electricity & oil-heating transition bill',
    ],
  },
  {
    id: 'baltic-dune-pavilion',
    title: 'Klaipėda Pine Pavilion',
    location: 'Curonian Spit, Lithuania',
    climate: 'Coastal',
    image: HERO_IMAGES.nightGround,
    morningImage: HERO_IMAGES.morningGround,
    roofArea: '128 m²',
    systemSize: '11.8 kWp',
    storageSize: '28.8 kWh',
    annualSavings: '$3,480 / yr',
    monthsZero: '19 / 84 mos completed',
    quote:
      'Volatile Baltic energy prices used to swing our winter bills wildly. Having a guaranteed $0 balance for seven years completely changed household planning.',
    homeowner: 'Darius Kazlauskas',
    highlights: [
      'Pine-needle & coastal sand self-cleaning hydrophobic glass coating',
      'Full sauna, heat-pump, and EV charger autonomy year-round',
      'Installed in 44 hours from scaffold erection to grid commissioning',
    ],
  },
  {
    id: 'bavarian-orchard-home',
    title: 'Starnberg Courtyard Home',
    location: 'Upper Bavaria, Germany',
    climate: 'Temperate',
    image: HERO_IMAGES.morningGround,
    morningImage: HERO_IMAGES.nightGround,
    roofArea: '168 m²',
    systemSize: '15.6 kWp',
    storageSize: '43.2 kWh',
    annualSavings: '$5,120 / yr',
    monthsZero: '31 / 84 mos completed',
    quote:
      'German electricity tariffs are among the highest in Europe. Teralio paid back peace of mind from day one with zero visual clutter on our roof.',
    homeowner: 'Katrin Hoffmann',
    highlights: [
      'Dynamic §14a EnWG smart-grid integration with automated bonus rebates',
      'Powers dual home studios plus bidirectional V2H readiness',
      '108% net annual energy positivity verified by independent meter',
    ],
  },
]);

export const ABOUT_METRICS = Object.freeze([
  { value: '14,200+', label: 'Charcoal roofs energized across 11 countries' },
  { value: '$0.00', label: 'Contractual electricity bill across 84 months' },
  { value: '196 GWh', label: 'Clean autonomous solar dispatched & traded' },
  { value: '99.98%', label: 'Smart Controller fleet uptime over 5 winters' },
]);

export const LEADERSHIP_TEAM = Object.freeze([
  {
    name: 'Astrid Holm',
    role: 'Chief Executive Officer & Co-Founder',
    bio: 'Former VP of Grid Storage Systems in Stockholm; 14 years scaling residential power electronics and Nordic utility microgrids.',
  },
  {
    name: 'Mateo Lindner',
    role: 'Chief Technology Officer & Co-Founder',
    bio: 'Architected machine-learning spot-market trading engines across Nord Pool and EPEX SPOT; PhD in Control Systems, ETH Zürich.',
  },
  {
    name: 'Nadia Vance, RIBA',
    role: 'VP of Architectural Product Design',
    bio: 'Industrial & architectural façade designer focused on zero-glare photovoltaic glass textures that honor vernacular residential craft.',
  },
  {
    name: 'Rafi Pratama',
    role: 'Head of Embedded AI & Firmware',
    bio: 'Leads real-time edge inference on Teralio Smart Controller V4, sub-8ms islanding safety, and fleet telemetry security.',
  },
]);

export const CAREER_ROLES = Object.freeze([
  {
    id: 'staff-power-electronics',
    title: 'Staff Power Electronics Engineer — Smart Controller V5',
    department: 'Hardware & Power Electronics',
    location: 'Stockholm / Hybrid',
    type: 'Full-Time',
    compensation: '€115k – €145k + Equity',
    summary:
      'Design bidirectional SiC inverter topologies and sub-8ms grid-forming transfer switches for next-generation residential autonomy.',
    requirements: [
      '6+ years designing 10kW–30kW grid-tied or grid-forming SiC/GaN converters',
      'Deep familiarity with IEC 62109, thermal simulation, and EMC pre-compliance',
      'Track record shipping high-reliability hardware into harsh outdoor climates',
    ],
  },
  {
    id: 'ml-energy-arbitrage',
    title: 'Senior ML Engineer — Energy Market & Weather Forecasting',
    department: 'AI & Grid Software',
    location: 'Remote (Europe / GMT+1–GMT+8)',
    type: 'Full-Time',
    compensation: '€110k – €140k + Equity',
    summary:
      'Train probabilistic cloud-motion and wholesale tariff forecasting models running both in the cloud and quantized on home edge NPUs.',
    requirements: [
      'Experience with time-series forecasting, stochastic optimization, or reinforcement learning',
      'Production proficiency in Python, Rust/C++ edge runtime deployment, and real-time telemetry',
      'Passion for decarbonizing residential grids through mathematical precision',
    ],
  },
  {
    id: 'architectural-solar-specialist',
    title: 'Lead Architectural Roof Systems Designer',
    department: 'Architectural Design',
    location: 'Zurich or London',
    type: 'Full-Time',
    compensation: '€95k – €122k + Equity',
    summary:
      'Craft custom flashing details, LiDAR-to-BIM automated tile layouts, and heritage conservation packages for bespoke residential roofs.',
    requirements: [
      'Degree in Architecture or Structural Façade Engineering with 5+ years residential roof envelope experience',
      'Mastery of parametric CAD/BIM workflows and building-integrated photovoltaics (BIPV)',
      'Eye for minimalist proportion, shadow lines, and weatherproof durability',
    ],
  },
  {
    id: 'frontend-design-engineer',
    title: 'Senior Design Engineer — Homeowner Telemetry & WebGL',
    department: 'AI & Grid Software',
    location: 'Remote / Hybrid',
    type: 'Full-Time',
    compensation: '€100k – €130k + Equity',
    summary:
      'Build tactile, calm, high-frame-rate interfaces that make complex household energy flows feel effortless for every homeowner.',
    requirements: [
      'Deep craft in React, modern CSS color/layout systems, SVG data visualization, and WebGL shaders',
      'Obsession with 60fps responsiveness, accessibility, and clean component architecture',
      'Ability to translate complex hardware telemetry into intuitive visual narratives',
    ],
  },
  {
    id: 'master-commissioning-lead',
    title: 'Regional Field Commissioning Lead',
    department: 'Field Operations',
    location: 'Munich, Germany',
    type: 'Full-Time',
    compensation: '€82k – €104k + Equity',
    summary:
      'Lead our 48-hour precision roof & Smart Controller installation teams, certifying zero-defect handovers across Southern Germany.',
    requirements: [
      'Master electrician certification (Meisterbrief or equivalent EU high-voltage credential)',
      'Experience leading residential solar, battery storage, and heat-pump integrations',
      'Commitment to spotless jobsite hospitality and uncompromising safety standards',
    ],
  },
]);

export const RESOURCES_LIBRARY = Object.freeze([
  {
    id: 'guarantee-whitepaper',
    category: 'Guarantee & Legal',
    readTime: '6 min read',
    date: 'Updated Oct 2026',
    title: 'How the 7-Year $0 Electricity Bill Guarantee Works Under the Hood',
    excerpt:
      'A transparent actuarial and engineering breakdown of how solar over-provisioning, LiFePO4 reserve sizing, and wholesale arbitrage fund 84 months of zero bills.',
    content: [
      'Traditional solar installers quote theoretical "average payback periods" that fall apart when winter cloud cover arrives or utilities slash feed-in tariffs. Teralio replaces estimates with a binding 84-month zero-bill contract.',
      'Before signing, our LiDAR & horizon-shading engine sizes your charcoal tile array and battery vault to generate 115%–135% of your modeled annual household demand. During bright spring and summer mornings, our Smart Controller exports surplus power specifically during high-price wholesale windows.',
      'Those monetary credits accumulate in your Teralio Balancing Reserve. In dark winter weeks—or even during negative-price wind storms when the controller gets paid to charge your battery from the grid—any remaining utility charges are automatically settled by Teralio.',
    ],
  },
  {
    id: 'diffuse-irradiance-paper',
    category: 'Engineering Whitepaper',
    readTime: '9 min read',
    date: 'Sep 2026',
    title: 'Low-Angle & Fog Irradiance: Why Matte Micro-Textured Glass Wins',
    excerpt:
      'Optical lab measurements comparing conventional glossy solar modules against Teralio’s satin charcoal light-trapping surface in morning mist and overcast latitudes.',
    content: [
      'Standard flat solar glass reflects up to 18% of incident photons when the sun sits below 20° above the horizon—precisely during morning and evening tariff peaks.',
      'Teralio’s etched micro-pyramidal satin surface scatters oblique and diffuse cloud-filtered photons inward toward N-type back-contact silicon cells, boosting early-morning and foggy-day yield by 16.4% while eliminating harsh neighborhood glare.',
    ],
  },
  {
    id: 'winter-resilience-guide',
    category: 'Homeowner Guide',
    readTime: '5 min read',
    date: 'Aug 2026',
    title: 'Preparing for Multi-Day Winter Grid Outages with Storm Guard',
    excerpt:
      'How Smart Controller V4 automatically pre-charges your home reserve 36 hours ahead of severe weather alerts and islands your home in 7.4 milliseconds.',
    content: [
      'Whenever national meteorological services issue high-wind, ice, or blizzard advisories for your postal code, Teralio activates Storm Guard automatically.',
      'Your reserve target lifts to 100% SoC ahead of the front. Should regional transmission lines fail, solid-state relays isolate your home in 7.4ms—so desktop computers, heat pumps, Wi-Fi, and induction cooking continue without a single blink.',
    ],
  },
  {
    id: 'heritage-architecture-spec',
    category: 'Architectural Spec',
    readTime: '7 min read',
    date: 'Jul 2026',
    title: 'Architect’s Specification Manual: Pitch, Flashings & Conservation Approval',
    excerpt:
      'CAD details, roof pitch tolerances (14°–65°), concealed perimeter trim profiles, and municipal heritage approval templates for architects and builders.',
    content: [
      'Teralio active and perimeter dummy tiles share identical thickness, shadow-line reveal, and matte charcoal chroma (ΔE < 0.8), enabling edge-to-edge coverage around skylights, dormers, and chimneys.',
      'Downloadable BIM families and wind-tunnel certificates streamline conservation board approvals in historic European and North American districts.',
    ],
  },
]);

export const FAQS = Object.freeze([
  {
    question: 'What happens if we have an unusually cloudy winter or energy prices spike?',
    answer:
      'Nothing changes for you—your bill remains $0.00. Teralio’s Smart Controller hedges seasonal variance by banking high-value export credits in sunny months and charging during negative/low overnight wholesale windows in winter. Any residual balance within fair household usage bounds is covered directly by Teralio.',
  },
  {
    question: 'What happens in Year 8 after the 7-year guarantee period ends?',
    answer:
      'You own your Teralio solar roof and battery vault outright with zero liens, covered by our 25-year structural and power-output warranty. Homeowners can either keep 100% of their autonomous generation and export revenue directly, or renew Teralio Smart Grid Stewardship on a simple annual plan.',
  },
  {
    question: 'Can I add an electric vehicle or heat pump after installation?',
    answer:
      'Yes. During your Instant Quote & LiDAR engineering assessment, we model planned EV chargers, heat pumps, or induction upgrades upfront so your roof array and LiFePO4 reserve have built-in headroom from day one.',
  },
  {
    question: 'How long does physical roof installation take?',
    answer:
      'Once your existing roof deck is prepped, certified Teralio crews complete tile interlocking, concealed wiring, battery vault mounting, and Smart Controller commissioning in 48 to 72 hours.',
  },
]);

export const CUSTOMER_LEDGER_MONTHS = Object.freeze([
  { month: 'Oct 2026', generated: '1,180 kWh', consumed: '940 kWh', gridCredit: '+$38.20', netBill: '$0.00' },
  { month: 'Sep 2026', generated: '1,540 kWh', consumed: '860 kWh', gridCredit: '+$94.60', netBill: '$0.00' },
  { month: 'Aug 2026', generated: '1,890 kWh', consumed: '890 kWh', gridCredit: '+$142.10', netBill: '$0.00' },
  { month: 'Jul 2026', generated: '2,010 kWh', consumed: '910 kWh', gridCredit: '+$161.40', netBill: '$0.00' },
  { month: 'Jun 2026', generated: '1,960 kWh', consumed: '830 kWh', gridCredit: '+$154.80', netBill: '$0.00' },
]);

export const FLEET_METRICS = Object.freeze([
  { label: 'Active Fleet Generation', value: '42.8 MW', delta: '+12.4% vs target' },
  { label: 'Grid Outages Islanded', value: '1,420 events', delta: '100% sub-8ms response' },
  { label: 'Average Household Export', value: '8.4 kWh/day', delta: '$0.00 net billing' },
  { label: 'Battery Storage Capacity', value: '186 MWh', delta: '99.98% fleet availability' },
]);

export const CUSTOMER_TESTIMONIALS = Object.freeze([
  {
    homeowner: 'Henrik & Astrid Lindqvist',
    location: 'Uppsala, Sweden',
    estate: 'Restored 1924 Timber Villa',
    zeroMonths: '38 Months at $0.00',
    quote:
      'Even in January with sub-zero temperatures and snow on the eaves, our Smart Controller kept our heat pump humming and our energy bill at zero.',
  },
  {
    homeowner: 'Dr. Clara Beauchamp',
    location: 'Brighton, UK',
    estate: 'Edwardian Coastal Semi',
    zeroMonths: '44 Months at $0.00',
    quote:
      'The dark slate appearance matched our heritage conservation area guidelines flawlessly. We have had zero grid charges since day one.',
  },
  {
    homeowner: 'Elias & Sanna Virtanen',
    location: 'Espoo, Finland',
    estate: 'Nordic Passive Modernist House',
    zeroMonths: '29 Months at $0.00',
    quote:
      'The transition from grid power during the winter storm was so seamless our desktop servers did not even reboot. Complete peace of mind.',
  },
]);

// Structural Aliases for modular pages
export const TEAM_MEMBERS = LEADERSHIP_TEAM;
export const OPEN_ROLES = CAREER_ROLES;
export const RESOURCES_LIST = RESOURCES_LIBRARY;
