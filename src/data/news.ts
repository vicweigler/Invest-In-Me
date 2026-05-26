import { NewsArticle, GeopoliticalEvent, SectorAnalysis, Sector } from '../types';

// ── GEOPOLITICAL EVENTS ──────────────────────────────────────────────────────
export const GEOPOLITICAL_EVENTS: GeopoliticalEvent[] = [
  {
    id:'geo1', title:'Bank of England holds rates at 4.75%',
    description:'The Monetary Policy Committee voted 7-2 to hold rates unchanged. Governor Bailey signalled further cuts likely in 2026 as inflation continues to ease towards the 2% target, boosting UK bank margins and financial sector confidence.',
    region:'United Kingdom', impact:'high', affectedSectors:['Financials','Real Estate','Utilities'], date:'2026-05-15', sentiment:'positive',
  },
  {
    id:'geo2', title:'OPEC+ agrees surprise production cut',
    description:'OPEC+ surprised markets by announcing a 500,000 barrel-per-day production cut effective June 2026, citing demand uncertainty. Brent crude surged 4% to $85/bbl, benefiting major oil and gas producers.',
    region:'Middle East', impact:'high', affectedSectors:['Energy','Materials'], date:'2026-05-10', sentiment:'positive',
  },
  {
    id:'geo3', title:'US tariffs on European goods escalate trade tensions',
    description:'The US announced 10% tariffs on selected European manufactured goods, raising fears of a broader trade war. UK exporters with significant US revenues flagged potential earnings headwinds in upcoming guidance.',
    region:'North America', impact:'high', affectedSectors:['Industrials','Consumer Discretionary','Technology'], date:'2026-05-08', sentiment:'negative',
  },
  {
    id:'geo4', title:'China GDP growth slows to 4.2% in Q1 2026',
    description:'China\'s economy grew slower than the 5% target in Q1 2026, dampening demand for commodities and luxury goods. Mining stocks and premium consumer brands with significant China exposure sold off sharply.',
    region:'Asia Pacific', impact:'high', affectedSectors:['Materials','Consumer Discretionary','Energy'], date:'2026-04-30', sentiment:'negative',
  },
  {
    id:'geo5', title:'UK-EU trade deal expanded to cover financial services',
    description:'The UK and EU announced a comprehensive financial services equivalence agreement, the first such deal since Brexit. UK banks and insurers welcomed improved market access to EU clients.',
    region:'Europe', impact:'high', affectedSectors:['Financials','Technology'], date:'2026-04-22', sentiment:'positive',
  },
  {
    id:'geo6', title:'Russia-Ukraine ceasefire talks restart in Geneva',
    description:'Diplomatic sources confirm preliminary ceasefire talks between Russia and Ukraine are underway, reducing geopolitical risk premium in European energy markets. Gas futures fell 8%, easing cost pressures on UK manufacturers.',
    region:'Eastern Europe', impact:'medium', affectedSectors:['Energy','Industrials','Consumer Staples'], date:'2026-04-18', sentiment:'positive',
  },
  {
    id:'geo7', title:'UK government announces £28bn defence spending increase',
    description:'The Chancellor confirmed a multi-year uplift to UK defence spending to 2.5% of GDP by 2027, benefiting domestic defence and aerospace contractors. BAE Systems, Rolls-Royce and Cobham cited as key beneficiaries.',
    region:'United Kingdom', impact:'high', affectedSectors:['Industrials'], date:'2026-04-10', sentiment:'positive',
  },
  {
    id:'geo8', title:'Ofwat imposes £1.6bn fine on UK water companies',
    description:'The water regulator imposed record fines and tighter leakage and pollution targets on the UK\'s largest water companies, adding near-term cost pressure and limiting dividend capacity.',
    region:'United Kingdom', impact:'medium', affectedSectors:['Utilities'], date:'2026-04-05', sentiment:'negative',
  },
  {
    id:'geo9', title:'Federal Reserve signals fewer cuts in 2026',
    description:'Fed Chair Jerome Powell indicated the central bank is in no rush to cut rates further, citing persistent US services inflation. Global risk assets sold off as dollar strengthened, pressuring emerging market revenues of UK multinationals.',
    region:'North America', impact:'high', affectedSectors:['Financials','Real Estate','Consumer Discretionary'], date:'2026-03-20', sentiment:'negative',
  },
  {
    id:'geo10', title:'India emerges as key growth market for UK companies',
    description:'UK-India trade deal finalised, reducing tariffs across pharmaceuticals, spirits, financial services and automotive exports. AstraZeneca, Diageo, HSBC and Jaguar Land Rover among anticipated beneficiaries.',
    region:'Asia Pacific', impact:'medium', affectedSectors:['Healthcare','Consumer Staples','Financials'], date:'2026-03-15', sentiment:'positive',
  },
  {
    id:'geo11', title:'EU Carbon Border Adjustment Mechanism takes full effect',
    description:'The EU CBAM officially entered full implementation, imposing carbon costs on imports from non-compliant countries. UK manufacturers and commodity producers exporting to Europe face new levies on carbon-intensive products.',
    region:'Europe', impact:'medium', affectedSectors:['Materials','Energy','Industrials'], date:'2026-03-01', sentiment:'negative',
  },
  {
    id:'geo12', title:'Middle East tensions threaten Red Sea shipping routes',
    description:'Escalating tensions in the Red Sea forced major shipping lines to reroute via the Cape of Good Hope, adding 10-14 days and significant costs to supply chains. Retailers and manufacturers with Asian supply chains warned of margin pressure.',
    region:'Middle East', impact:'high', affectedSectors:['Consumer Discretionary','Consumer Staples','Industrials'], date:'2026-02-12', sentiment:'negative',
  },
  {
    id:'geo13', title:'UK planning reforms unlock 300,000 new homes target',
    description:'Parliament passed sweeping planning reform legislation removing barriers to housebuilding, unlocking the government\'s 300,000 annual homes target. Shares in UK housebuilders surged on improved land bank pipeline visibility.',
    region:'United Kingdom', impact:'high', affectedSectors:['Real Estate'], date:'2026-02-05', sentiment:'positive',
  },
  {
    id:'geo14', title:'Global semiconductor shortage eases as Taiwan production recovers',
    description:'TSMC and Samsung confirmed capacity expansions have resolved the global chip shortage, benefiting technology hardware manufacturers and companies reliant on semiconductors for production.',
    region:'Asia Pacific', impact:'medium', affectedSectors:['Technology','Industrials'], date:'2026-01-20', sentiment:'positive',
  },
  {
    id:'geo15', title:'UK autumn budget increases employer National Insurance',
    description:'The Chancellor raised employer NI contributions by 1.2 percentage points and lowered the secondary threshold, adding an estimated £25bn cost to UK businesses. Labour-intensive sectors such as retail, hospitality and care flagged material margin pressure.',
    region:'United Kingdom', impact:'high', affectedSectors:['Consumer Discretionary','Consumer Staples','Industrials'], date:'2025-10-30', sentiment:'negative',
  },
];

// ── SECTOR ANALYSIS ────────────────────────────────────────────────────────
export const SECTOR_ANALYSES: Record<string, SectorAnalysis> = {
  'Energy': {
    sector: 'Energy', outlook: 'Neutral',
    summary: 'UK energy majors face a structural transition as they balance near-term oil and gas cash flows with long-term decarbonisation commitments. OPEC+ production discipline supports Brent above $80/bbl, but the energy transition creates longer-dated uncertainty.',
    keyDrivers: ['OPEC+ production discipline','UK North Sea licensing policy','Global energy transition capex','LNG demand from Asia'],
    risks: ['Faster-than-expected renewable substitution','Windfall tax extensions','US shale supply growth'],
  },
  'Materials': {
    sector: 'Materials', outlook: 'Bearish',
    summary: 'Mining and materials companies are caught between structurally weaker Chinese demand for industrial metals and supply-side discipline. Copper and lithium face opposing forces from the energy transition boom and near-term China slowdown.',
    keyDrivers: ['Copper demand from EV transition','Gold as safe-haven in geopolitical uncertainty','China stimulus effectiveness'],
    risks: ['China property sector continued weakness','US dollar strength','Commodity demand destruction from global slowdown'],
  },
  'Financials': {
    sector: 'Financials', outlook: 'Bullish',
    summary: 'UK banks are benefiting from elevated interest margins following BoE rate cycles, with improving credit quality and returning capital to shareholders. Insurance earnings remain resilient with hardening premium rates across most lines.',
    keyDrivers: ['Net interest margin expansion','Improving UK economic outlook','Shareholder returns (buybacks and dividends)','Insurance pricing cycle'],
    risks: ['Rate cuts compressing NIM sooner than expected','UK consumer credit stress','Commercial real estate exposure'],
  },
  'Healthcare': {
    sector: 'Healthcare', outlook: 'Neutral',
    summary: 'UK healthcare is a tale of two segments: AstraZeneca\'s oncology pipeline drives premium valuation while legacy pharma faces pricing pressure. Consumer health spun-offs offer defensive income but face slower growth as post-pandemic demand normalises.',
    keyDrivers: ['Oncology drug approvals (AZN pipeline)','GLP-1 drug competition impact','NHS procurement reforms','Emerging market expansion'],
    risks: ['US drug pricing legislation','Patent cliff exposures','Clinical trial failures'],
  },
  'Consumer Staples': {
    sector: 'Consumer Staples', outlook: 'Neutral',
    summary: 'Consumer staples companies are navigating the post-inflation environment as price elasticity reasserts and volumes recover. Premium brands face pressure from private label trade-down, while UK grocery multiples benefit from improved consumer confidence.',
    keyDrivers: ['Volume recovery post-inflation','Private label vs branded mix dynamics','Cost savings programmes','India and Africa expansion'],
    risks: ['Consumer trade-down to private label','Commodity cost inflation resurgence','Alcohol demand softness (Diageo)'],
  },
  'Consumer Discretionary': {
    sector: 'Consumer Discretionary', outlook: 'Neutral',
    summary: 'UK consumer discretionary is bifurcating: value retailers and experiential spend (travel, hotels) outperform while luxury and sports fashion face China weakness. The UK housing recovery is a key swing factor for home improvement retailers.',
    keyDrivers: ['UK consumer confidence recovery','Housing market recovery (DIY, furniture)','Travel and hospitality demand resilience','Gambling regulation outcome'],
    risks: ['Discretionary spending squeeze from mortgage rollovers','China luxury demand weakness','Employer NI impact on retail labour costs'],
  },
  'Industrials': {
    sector: 'Industrials', outlook: 'Bullish',
    summary: 'UK industrial conglomerates are benefiting from a defence spending supercycle, re-shoring trends and aviation recovery. Rolls-Royce\'s operational transformation is the standout story, with BAE Systems gaining from NATO spending commitments.',
    keyDrivers: ['Defence spending supercycle','Aviation MRO recovery (Rolls-Royce)','Data analytics and testing demand','US infrastructure spending spillover'],
    risks: ['Aerospace supply chain constraints','Integration risk in acquisitions','Global manufacturing slowdown'],
  },
  'Technology': {
    sector: 'Technology', outlook: 'Bullish',
    summary: 'UK technology companies benefit from recurring revenue models and strong AI integration momentum. Sage\'s cloud transition, Auto Trader\'s marketplace dominance and Experian\'s data flywheel support premium valuations with improving growth visibility.',
    keyDrivers: ['Cloud and SaaS transition (Sage)','AI-enhanced products and pricing','Digital advertising recovery','Consumer credit demand (Experian)'],
    risks: ['Open banking disrupting consumer credit','Price comparison market saturation (Auto Trader/Rightmove)','AI competition from US hyperscalers'],
  },
  'Real Estate': {
    sector: 'Real Estate', outlook: 'Bullish',
    summary: 'UK real estate is entering a recovery phase as interest rate cuts improve valuations and lending availability. Housebuilders are the primary beneficiary of planning reform, while logistics REITs maintain structural tailwinds from e-commerce growth.',
    keyDrivers: ['BoE rate cuts improving affordability','Planning reform (housebuilders)','E-commerce logistics demand (Segro/Tritax)','Student accommodation demand (Unite)'],
    risks: ['Building cost inflation','Delayed BoE rate cuts','Office market structural oversupply'],
  },
  'Utilities': {
    sector: 'Utilities', outlook: 'Neutral',
    summary: 'UK utilities offer defensive income amid economic uncertainty but face regulatory headwinds particularly for water companies following Ofwat\'s tighter regulatory settlement. Grid-linked utilities benefit from government net zero investment commitments.',
    keyDrivers: ['Government net zero infrastructure spending','Inflation-linked revenue mechanisms','Rate cuts improving debt servicing costs'],
    risks: ['Water regulator enforcement and fines','Higher capex requirements','Political populism and nationalisation risk'],
  },
  'Communication Services': {
    sector: 'Communication Services', outlook: 'Bearish',
    summary: 'UK telecoms face structural pressures from commoditised connectivity pricing, high debt loads and expensive network upgrade programmes. Media is disrupted by streaming competition. WPP faces AI disruption to traditional advertising agency models.',
    keyDrivers: ['Broadband and 5G premium upsell','Cost reduction and network sharing','Advertising market recovery'],
    risks: ['Price competition in mobile and broadband','AI replacing advertising agency services (WPP)','High debt refinancing in higher-rate environment'],
  },
};

// ── NEWS TEMPLATES PER SECTOR ─────────────────────────────────────────────
const newsTemplates: Record<string, Array<Omit<NewsArticle, 'id' | 'publishedAt'>>> = {
  'Energy': [
    { title:'Oil majors report record free cash flow as Brent holds above $82/bbl', summary:'Shell and BP both reported stronger-than-expected quarterly free cash flow as oil prices remained supported by OPEC+ discipline and resilient US demand. Both companies raised their quarterly dividend guidance and expanded buyback programmes.', source:'Financial Times', sentiment:'positive', category:'sector', tags:['oil','energy','dividends','OPEC'] },
    { title:'UK North Sea operator flags decommissioning cost surge', summary:'An operator on the UK Continental Shelf warned decommissioning costs for legacy fields have risen 35% in two years, pressuring returns on late-life assets. The government is reviewing the tax treatment of decommissioning expenditure.', source:'Reuters', sentiment:'negative', category:'sector', tags:['North Sea','decommissioning','UK energy policy'] },
    { title:'LNG demand from Asia driving European gas premium', summary:'Asian LNG buyers are competing aggressively for summer cargoes, keeping European gas spot prices elevated relative to historical norms and supporting revenues for UK upstream producers.', source:'Bloomberg', sentiment:'positive', category:'sector', tags:['LNG','natural gas','Asia demand'] },
  ],
  'Financials': [
    { title:'UK banks beat Q1 profit forecasts on resilient net interest margins', summary:'HSBC, Barclays and NatWest all beat consensus Q1 profit estimates, with net interest margins proving more durable than feared. Mortgage book performance improved as arrears remained contained despite higher rates.', source:'The Telegraph', sentiment:'positive', category:'sector', tags:['banking','profits','NIM','UK banks'] },
    { title:'FCA launches review into motor finance commission practices', summary:'The Financial Conduct Authority expanded its motor finance commission review, raising potential liability across lenders. Analysts estimate industry-wide provisions could reach £16bn in a worst-case scenario.', source:'Guardian', sentiment:'negative', category:'sector', tags:['FCA','regulation','motor finance','PPI'] },
    { title:'UK insurance premium rates rise 8% in Q1 driven by motor costs', summary:'UK motor insurance premiums rose at an 8% annual rate in Q1, reflecting sustained claims inflation from repair costs and replacement vehicle expenses. Underwriters with motor book exposure saw improved margins.', source:'Insurance Times', sentiment:'positive', category:'sector', tags:['insurance','motor','premiums','claims inflation'] },
  ],
  'Healthcare': [
    { title:'NHS digital transformation accelerates demand for medical technology', summary:'The government\'s NHS productivity plan includes £4.2bn for digital infrastructure and AI diagnostic tools, accelerating procurement of connected health devices and software from UK-listed healthcare companies.', source:'HSJ', sentiment:'positive', category:'sector', tags:['NHS','digital health','AI diagnostics'] },
    { title:'EU pharmaceutical regulations create market access hurdles', summary:'New EU clinical trial data requirements are extending approval timelines for drugs seeking pan-European licences. UK-listed pharma companies with EU exposure flagged 6-12 month delays to expected product launches.', source:'Pharma Times', sentiment:'negative', category:'sector', tags:['EU regulation','drug approval','pharma'] },
    { title:'GLP-1 drugs reshape cardiovascular and obesity treatment market', summary:'Weight-loss drugs from Novo Nordisk and Eli Lilly are beginning to impact device and medicine markets. UK pharma companies are accelerating pipeline pivots to target the obesity-adjacencies opportunity.', source:'Reuters Health', sentiment:'neutral', category:'sector', tags:['GLP-1','obesity drugs','market disruption'] },
  ],
  'Materials': [
    { title:'Copper prices hit six-month high on energy transition demand', summary:'LME copper prices rose to $9,800/tonne on renewed optimism over electric vehicle infrastructure spending in the US and India. UK-listed copper miners with South American operations were among the session\'s top performers.', source:'Metal Bulletin', sentiment:'positive', category:'sector', tags:['copper','LME','electric vehicles','mining'] },
    { title:'Iron ore price falls to 18-month low on China property concerns', summary:'Iron ore futures dropped to $95/tonne after Chinese property sales data showed continued weakness. Mining companies with significant iron ore exposure revised full-year shipment guidance lower.', source:'Bloomberg Commodities', sentiment:'negative', category:'sector', tags:['iron ore','China','property','mining'] },
    { title:'Gold price holds above $2,400 as investors seek safe-haven assets', summary:'Gold continues to trade at historically elevated levels as central bank purchases and geopolitical uncertainty sustain demand. UK-listed gold miners with West African operations outperformed the broader mining sector.', source:'Kitco News', sentiment:'positive', category:'sector', tags:['gold','safe haven','central banks','inflation hedge'] },
  ],
  'Consumer Staples': [
    { title:'UK grocery volumes recover as real wages return to growth', summary:'The latest grocery market data showed volume growth of 1.8% as consumers gradually replaced units lost during the cost-of-living crisis. Branded goods recaptured market share from private label for the first time in three years.', source:'Kantar Worldpanel', sentiment:'positive', category:'sector', tags:['UK grocery','consumer spending','branded goods'] },
    { title:'Alcohol consumption trends weigh on spirits volumes', summary:'A generational shift away from alcohol consumption, particularly among 18-35 year olds, is beginning to impact beverage company volumes. Premium spirits brands face specific pressure from the Dry January and moderation trend.', source:'Drinks Business', sentiment:'negative', category:'sector', tags:['alcohol','spirits','consumer trends','Millennials'] },
    { title:'Tobacco companies accelerate transition to heated products', summary:'British American Tobacco and Imperial Brands reported accelerating uptake of heated tobacco products in Japan and Eastern Europe. The segment now accounts for 12% of combined revenue and carries significantly better margins.', source:'Tobacco Reporter', sentiment:'positive', category:'sector', tags:['tobacco','heated products','HTP','ESG'] },
  ],
  'Consumer Discretionary': [
    { title:'UK retail sales beat expectations as consumer confidence improves', summary:'The ONS reported UK retail sales grew 0.8% month-on-month, beating the 0.3% consensus. Clothing and footwear led the recovery as mild weather and pent-up demand drove footfall in high streets and retail parks.', source:'ONS', sentiment:'positive', category:'sector', tags:['UK retail','consumer confidence','ONS data'] },
    { title:'Online gambling regulation tightening across Europe', summary:'Multiple European jurisdictions announced stricter affordability checks and deposit limits for online gambling. Operators with exposure to Germany, Netherlands and Italy guided for regulatory compliance costs of £200-400m over three years.', source:'iGaming Business', sentiment:'negative', category:'sector', tags:['gambling regulation','online betting','affordability checks'] },
    { title:'Holiday bookings hit record levels for summer 2026', summary:'UK travel companies reported record forward bookings for summer 2026, with consumers prioritising holiday experiences over discretionary goods. Package holiday and flight-only bookings were both tracking 15% ahead of 2025.', source:'ABTA', sentiment:'positive', category:'sector', tags:['travel','holidays','summer 2026','UK consumer'] },
  ],
  'Industrials': [
    { title:'Defence sector order books swell as NATO spending commitments met', summary:'UK defence contractors reported record order books following NATO members committing to 2.5% of GDP defence spending targets. Long-duration contracts provide multi-year revenue visibility with inflation-linked pricing mechanisms.', source:'Jane\'s Defence', sentiment:'positive', category:'sector', tags:['defence','NATO','order book','aerospace'] },
    { title:'Aviation recovery drives engine services demand for UK manufacturers', summary:'International air travel volumes reached 104% of 2019 levels in Q1 2026, driving strong demand for engine maintenance, repair and overhaul services. UK engine makers reported shop visit volumes 18% ahead of prior year.', source:'Aviation Week', sentiment:'positive', category:'sector', tags:['aviation','MRO','engine services','travel recovery'] },
    { title:'Supply chain reshoring trend accelerates UK industrial orders', summary:'UK manufacturers reported an uptick in domestic orders as European companies pursue supply chain resilience strategies following recent geopolitical disruptions. Capital goods orders grew 4.2% quarter-on-quarter.', source:'Make UK', sentiment:'positive', category:'sector', tags:['reshoring','UK manufacturing','supply chain','industrial'] },
  ],
  'Technology': [
    { title:'UK tech sector attracts record venture capital inflows', summary:'UK technology companies attracted £9.4bn in venture capital funding in H1 2026, making the UK the second-largest recipient globally. AI, fintech and deeptech attracted the majority of capital as US investors increased UK exposure.', source:'Tech Nation', sentiment:'positive', category:'sector', tags:['UK tech','venture capital','AI','fintech'] },
    { title:'Cloud migration accelerating among UK mid-market businesses', summary:'Software vendors reported accelerating cloud migration from on-premise solutions among UK businesses with 250-2,500 employees. Enterprise software subscription revenues are growing at double-digit rates as the transition matures.', source:'CRN UK', sentiment:'positive', category:'sector', tags:['cloud computing','SaaS','digital transformation','enterprise software'] },
    { title:'Property platform listings grow as housing market warms', summary:'UK property portals reported a 22% increase in new property listings compared to the same period last year, reflecting growing vendor confidence as rate cuts improve buyer affordability. Monthly unique visitors reached new records.', source:'Rightmove Data', sentiment:'positive', category:'sector', tags:['property tech','housing market','listings','digital platforms'] },
  ],
  'Real Estate': [
    { title:'UK house prices rise for fifth consecutive month', summary:'The Halifax house price index showed a 0.4% monthly increase, the fifth consecutive month of gains, as lower mortgage rates and the planning reform pipeline improved buyer confidence. London and the South East led the recovery.', source:'Halifax', sentiment:'positive', category:'sector', tags:['UK house prices','housing market','mortgage rates','Halifax index'] },
    { title:'Logistics property vacancy rates at record lows near major cities', summary:'Prime logistics property vacancy rates around London, Manchester and Birmingham fell to 1.8%, driving double-digit rental growth for modern big box warehouses. E-commerce and 3PL operators competed for limited supply.', source:'CBRE Research', sentiment:'positive', category:'sector', tags:['logistics','warehousing','REITs','e-commerce'] },
    { title:'Office market faces continued headwinds from hybrid working', summary:'UK office vacancy rates rose to 8.6% in Q1, the highest since 2010, as hybrid working policies reduced demand for traditional workspace. Grade A offices in prime city centre locations maintained occupancy while secondary stock deteriorated.', source:'Knight Frank', sentiment:'negative', category:'sector', tags:['office market','hybrid working','commercial property','REITs'] },
  ],
  'Utilities': [
    { title:'BoE rate cuts improve refinancing prospects for UK utilities', summary:'UK utility companies welcomed the Bank of England\'s rate cut cycle as a positive for future debt refinancing costs. Regulated utilities with inflation-linked revenues and high gearing stand to benefit most from improving debt serviceability.', source:'Utility Week', sentiment:'positive', category:'sector', tags:['BoE','interest rates','utilities','debt','refinancing'] },
    { title:'Grid investment plans require £50bn of new capital by 2030', summary:'National Grid published its ten-year capital investment plan requiring £50bn of electricity transmission and distribution upgrades to support net zero targets. The company expects to grow regulated asset value at 10% annually through the decade.', source:'National Grid IR', sentiment:'positive', category:'sector', tags:['electricity grid','net zero','capital investment','National Grid'] },
    { title:'Sewage discharge fines put water sector dividends at risk', summary:'Ofwat\'s latest enforcement action against water companies for illegal sewage discharges included dividend suspension conditions for the most egregious offenders. Investors in water utilities reassessed income assumptions.', source:'Ofwat', sentiment:'negative', category:'sector', tags:['water companies','sewage','Ofwat','regulation','dividends'] },
  ],
  'Communication Services': [
    { title:'BT Openreach investment accelerates full-fibre rollout', summary:'BT Group confirmed its full-fibre broadband network now passes 14 million UK premises, on track to reach 25 million by 2026. The Openreach infrastructure continues to attract regulated returns under Ofcom\'s pricing framework.', source:'BT Group', sentiment:'positive', category:'sector', tags:['BT','full fibre','broadband','Openreach'] },
    { title:'UK advertising market grows 6% as digital channels dominate', summary:'The AA/WARC advertising expenditure report showed total UK adspend grew 6.4% in Q1 2026, with digital formats taking a 78% share. TV advertising underperformed as streaming continued to fragment audiences.', source:'AA/WARC', sentiment:'positive', category:'sector', tags:['advertising','UK media','digital advertising','ITV'] },
    { title:'Vodafone completes Vantage Towers stake sale, accelerates debt reduction', summary:'Vodafone completed the sale of its remaining stake in Vantage Towers for €2.4bn, enabling accelerated debt reduction and freeing capital for potential further European mergers. The company maintained its dividend but guided for a further review.', source:'Reuters', sentiment:'neutral', category:'sector', tags:['Vodafone','towers','asset sale','debt reduction'] },
  ],
};

// Company-specific news snippets
const companyNewsMap: Record<string, Array<Omit<NewsArticle, 'id' | 'publishedAt'>>> = {
  'AZN': [
    { title:'AstraZeneca wins FDA approval for Dato-DXd in lung cancer', summary:'The FDA granted full approval to AstraZeneca\'s datopotamab deruxtecan for previously treated non-small-cell lung cancer, adding a significant revenue stream to the oncology portfolio. Peak sales estimates were raised to $8bn annually.', source:'Reuters Health', sentiment:'positive', category:'company', tags:['AstraZeneca','FDA approval','oncology','lung cancer'] },
    { title:'AstraZeneca raises full-year revenue guidance on strong oncology sales', summary:'AstraZeneca raised its full-year revenue growth guidance to the "low twenties" percentage range, driven by 28% growth in oncology medicines. CEO Pascal Soriot highlighted the company\'s phase III pipeline as the broadest in its history.', source:'AstraZeneca IR', sentiment:'positive', category:'company', tags:['AstraZeneca','revenue guidance','oncology','pipeline'] },
  ],
  'SHEL': [
    { title:'Shell announces $3.5bn share buyback programme', summary:'Shell announced a further $3.5bn share buyback following strong quarterly cash generation. The company also raised its quarterly dividend by 4%, maintaining its commitment to shareholder returns despite the energy transition.', source:'Shell IR', sentiment:'positive', category:'company', tags:['Shell','buyback','dividend','shareholder returns'] },
    { title:'Shell scales back offshore wind investments', summary:'Shell announced it is scaling back its offshore wind investment pipeline to focus on higher-return LNG and oil projects. The strategic shift reflects the company\'s prioritisation of capital discipline over renewable growth targets.', source:'Bloomberg', sentiment:'neutral', category:'company', tags:['Shell','offshore wind','LNG','strategy'] },
  ],
  'HSBA': [
    { title:'HSBC reports record quarterly pre-tax profit of $12.9bn', summary:'HSBC Holdings reported a record quarterly pre-tax profit, driven by strong Asia wealth management flows and resilient net interest income. The bank also announced a further $2bn share buyback, marking the sixth consecutive quarterly buyback.', source:'HSBC IR', sentiment:'positive', category:'company', tags:['HSBC','profits','Asia','buyback'] },
    { title:'HSBC wealth management AUM surpasses $1 trillion', summary:'HSBC\'s wealth and personal banking division reported assets under management exceeded $1 trillion for the first time, as Asian high-net-worth clients increased allocation to HSBC\'s private banking and investment products.', source:'Financial Times', sentiment:'positive', category:'company', tags:['HSBC','wealth management','AUM','Asia'] },
  ],
  'RR': [
    { title:'Rolls-Royce doubles operating profit target', summary:'Rolls-Royce raised its medium-term operating profit target to £2.5-2.8bn, double the figure achieved at the start of its transformation programme. CEO Tufan Erginbilgic credited structural cost reduction and engine flying hour recovery.', source:'Rolls-Royce IR', sentiment:'positive', category:'company', tags:['Rolls-Royce','profits','transformation','aerospace'] },
    { title:'Rolls-Royce small modular reactors win government backing', summary:'The UK government committed £2.4bn to support development of Rolls-Royce small modular reactors, providing a significant non-aerospace revenue growth opportunity. SMR orders from Poland and Czech Republic are anticipated by 2027.', source:'The Times', sentiment:'positive', category:'company', tags:['Rolls-Royce','SMR','nuclear energy','government contract'] },
  ],
  'BA': [
    { title:'BAE Systems wins £8.2bn UK submarine contract', summary:'The UK Ministry of Defence awarded BAE Systems an £8.2bn contract for the construction of two additional Astute-class submarines, extending the company\'s order book visibility through 2034 and supporting 6,000 UK jobs.', source:'MOD Press', sentiment:'positive', category:'company', tags:['BAE Systems','submarine','MoD contract','defence'] },
  ],
  'BRBY': [
    { title:'Burberry issues profit warning as luxury slowdown deepens', summary:'Burberry issued its second consecutive profit warning, citing weaker demand across all geographies but particularly mainland China and the US. The new CEO\'s brand repositioning strategy is taking longer to gain traction than anticipated.', source:'Financial Times', sentiment:'negative', category:'company', tags:['Burberry','profit warning','luxury','China slowdown'] },
  ],
  'OCDO': [
    { title:'Ocado technology licensing revenues disappoint as Kroger rollout slows', summary:'Ocado reported slower-than-expected revenue recognition from its Kroger technology partnership as the US retailer delayed customer fulfilment centre openings. The company maintained its long-term guidance but near-term revenues fell short of consensus.', source:'Bloomberg', sentiment:'negative', category:'company', tags:['Ocado','Kroger','technology licensing','warehouse automation'] },
  ],
};

let newsCounter = 0;

export function getNewsForCompany(symbol: string, sector: string): NewsArticle[] {
  const articles: NewsArticle[] = [];
  const now = new Date();

  // Company-specific news first
  const specific = companyNewsMap[symbol] ?? [];
  specific.forEach((t, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 3 - 1);
    articles.push({ ...t, id: `${symbol}-${++newsCounter}`, publishedAt: date.toISOString() });
  });

  // Fill with sector news
  const sectorNews = newsTemplates[sector] ?? [];
  sectorNews.forEach((t, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - specific.length * 3 - i * 4 - 2);
    articles.push({ ...t, id: `${sector}-${++newsCounter}`, publishedAt: date.toISOString() });
  });

  return articles.slice(0, 6);
}

export function getGeopoliticalForSectors(sectors: string[]): GeopoliticalEvent[] {
  return GEOPOLITICAL_EVENTS.filter(e =>
    e.affectedSectors.some(s => sectors.includes(s))
  ).slice(0, 5);
}
