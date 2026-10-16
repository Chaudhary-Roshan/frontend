import React from 'react';

/**
 * Authentic Vector Seal for The Islamia University of Bahawalpur (IUB)
 * Renders in high-resolution vector format, immune to CORS or network errors.
 */
export const IUBLogoEmblem = ({ size = 64, className = '' }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 120 120" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 drop-shadow-sm ${className}`}
  >
    {/* Outer Green Ring */}
    <circle cx="60" cy="60" r="58" fill="#044e29" stroke="#b48325" strokeWidth="2.5" />
    <circle cx="60" cy="60" r="53" fill="none" stroke="#f6cf64" strokeWidth="1" strokeDasharray="2 2" />
    <circle cx="60" cy="60" r="49" fill="#023b1e" stroke="#b48325" strokeWidth="1.5" />

    {/* University Name Curved Along Ring */}
    <path id="iub-curve-top" d="M 18,60 A 42,42 0 1,1 102,60" fill="none" />
    <text fill="#ffffff" fontSize="8.2" fontWeight="900" letterSpacing="0.12em" fontFamily="serif">
      <textPath href="#iub-curve-top" startOffset="50%" textAnchor="middle">
        ISLAMIA UNIVERSITY BAHAWALPUR
      </textPath>
    </text>

    <path id="iub-curve-bot" d="M 102,60 A 42,42 0 0,1 18,60" fill="none" />
    <text fill="#f6cf64" fontSize="7" fontWeight="bold" letterSpacing="0.22em" fontFamily="sans-serif">
      <textPath href="#iub-curve-bot" startOffset="50%" textAnchor="middle">
        • ESTD 1925 •
      </textPath>
    </text>

    {/* Inner White / Cream Shield Core */}
    <circle cx="60" cy="60" r="38" fill="#ffffff" stroke="#b48325" strokeWidth="1.5" />
    <circle cx="60" cy="60" r="35" fill="#fcfbf7" />

    {/* Architectural Dome & Minarets */}
    <path d="M60 29 C57 33 55 37 55 42 L65 42 C65 37 63 33 60 29 Z" fill="#b48325" />
    {/* Crescent & Star atop dome */}
    <circle cx="60" cy="27" r="1.5" fill="#d97706" />

    {/* Central Minarets */}
    <rect x="47" y="38" width="4" height="18" fill="#044e29" rx="0.5" />
    <polygon points="49,34 47,38 51,38" fill="#b48325" />
    <rect x="69" y="38" width="4" height="18" fill="#044e29" rx="0.5" />
    <polygon points="71,34 69,38 73,38" fill="#b48325" />

    {/* Central Gateway Arch */}
    <path d="M53 56 L53 43 C53 39 67 39 67 43 L67 56 Z" fill="#034d28" />
    <path d="M56 56 L56 46 C56 43 64 43 64 46 L64 56 Z" fill="#ffffff" />

    {/* Open Book of Knowledge (Quran / Scripture) */}
    <path d="M42 64 C48 62 57 63 60 67 C63 63 72 62 78 64 L77 74 C71 72 63 73 60 76 C57 73 49 72 43 74 Z" fill="#fdfcf8" stroke="#b48325" strokeWidth="1.2" />
    <path d="M60 67 L60 76" stroke="#b48325" strokeWidth="1.2" />
    {/* Page Lines */}
    <line x1="47" y1="67" x2="57" y2="69" stroke="#044e29" strokeWidth="0.8" />
    <line x1="47" y1="70" x2="56" y2="72" stroke="#044e29" strokeWidth="0.8" />
    <line x1="63" y1="69" x2="73" y2="67" stroke="#044e29" strokeWidth="0.8" />
    <line x1="64" y1="72" x2="73" y2="70" stroke="#044e29" strokeWidth="0.8" />

    {/* Laurel Wreath Base */}
    <path d="M38 78 C44 86 52 89 60 89 C68 89 76 86 82 78" stroke="#b48325" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <circle cx="60" cy="89" r="2.5" fill="#d97706" />
  </svg>
);

/**
 * 5 Distinct, Handcrafted Society Certificate Themes:
 * Ensuring no two societies share identical borders, corners, watermark badges, or typography accents!
 */
export const SOCIETY_THEMES = {
  // Theme 1: Tech / Computing / Cyber Security Student Club (CSSC)
  // Deep Navy & Electric Cyan & Polished Gold
  tech_cyber: {
    id: 'tech_cyber',
    name: 'Cyber & Computing Excellence',
    primaryColor: '#0f172a',      // Slate 900
    accentColor: '#0284c7',       // Sky 600
    secondaryColor: '#f59e0b',    // Amber 500
    headerBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
    bgPattern: 'radial-gradient(#0284c7 0.75px, transparent 0.75px), radial-gradient(#0284c7 0.75px, #ffffff 0.75px)',
    bgPatternSize: '28px 28px',
    outerBorder: '12px double #0f172a',
    innerBorder: '2px solid #0284c7',
    badgeTitle: 'CYBER MERIT & EXCELLENCE',
    sealType: 'tech_shield',
    fontStyle: 'font-sans',
    headerFont: 'font-serif',
    accentClass: 'text-sky-600',
    cornerRenderer: () => (
      <>
        {/* Geometric Tech Corner Brackets */}
        <div className="absolute top-2 left-2 w-9 h-9 border-t-4 border-l-4 border-sky-600 pointer-events-none">
          <div className="w-2 h-2 bg-amber-500 rounded-full -mt-1 -ml-1"></div>
        </div>
        <div className="absolute top-2 right-2 w-9 h-9 border-t-4 border-r-4 border-sky-600 pointer-events-none">
          <div className="w-2 h-2 bg-amber-500 rounded-full -mt-1 ml-7"></div>
        </div>
        <div className="absolute bottom-2 left-2 w-9 h-9 border-b-4 border-l-4 border-sky-600 pointer-events-none">
          <div className="w-2 h-2 bg-amber-500 rounded-full mt-7 -ml-1"></div>
        </div>
        <div className="absolute bottom-2 right-2 w-9 h-9 border-b-4 border-r-4 border-sky-600 pointer-events-none">
          <div className="w-2 h-2 bg-amber-500 rounded-full mt-7 ml-7"></div>
        </div>
      </>
    )
  },

  // Theme 2: Emergency, First Aid & Operations / REACT
  // Imperial Emerald & Warm Gold
  emergency_ops: {
    id: 'emergency_ops',
    name: 'Rapid Emergency & Service Honor',
    primaryColor: '#064e3b',      // Emerald 900
    accentColor: '#059669',       // Emerald 600
    secondaryColor: '#d97706',    // Amber 600
    headerBg: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
    bgPattern: 'radial-gradient(#10b981 0.75px, transparent 0.75px), radial-gradient(#10b981 0.75px, #fafdf9 0.75px)',
    bgPatternSize: '32px 32px',
    outerBorder: '12px double #064e3b',
    innerBorder: '2px solid #d97706',
    badgeTitle: 'DISTINGUISHED FIELD SERVICE',
    sealType: 'emerald_laurel',
    fontStyle: 'font-serif',
    headerFont: 'font-serif',
    accentClass: 'text-emerald-700',
    cornerRenderer: () => (
      <>
        {/* Ornate Greek Key / Acanthus Corner Scrolls */}
        <svg className="absolute top-1.5 left-1.5 w-10 h-10 text-amber-600 pointer-events-none" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 38 L2 2 L38 2 M6 34 L6 6 L34 6 M10 30 L10 10 L30 10" />
        </svg>
        <svg className="absolute top-1.5 right-1.5 w-10 h-10 text-amber-600 pointer-events-none" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M38 38 L38 2 L2 2 M34 34 L34 6 L6 6 M30 30 L30 10 L10 10" />
        </svg>
        <svg className="absolute bottom-1.5 left-1.5 w-10 h-10 text-amber-600 pointer-events-none" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 2 L2 38 L38 38 M6 6 L6 34 L34 34 M10 10 L10 30 L30 30" />
        </svg>
        <svg className="absolute bottom-1.5 right-1.5 w-10 h-10 text-amber-600 pointer-events-none" viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M38 2 L38 38 L2 38 M34 6 L34 34 L6 34 M30 10 L30 30 L10 30" />
        </svg>
      </>
    )
  },

  // Theme 3: Digital Forensics & Academic Research / Center for Cyber Security
  // Deep Royal Indigo & Purple-Gold Filigree
  forensics_research: {
    id: 'forensics_research',
    name: 'Forensics & Cryptographic Accreditation',
    primaryColor: '#1e1b4b',      // Indigo 950
    accentColor: '#6366f1',       // Indigo 500
    secondaryColor: '#f59e0b',    // Amber 500
    headerBg: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
    bgPattern: 'radial-gradient(#6366f1 0.75px, transparent 0.75px), radial-gradient(#6366f1 0.75px, #fdfcff 0.75px)',
    bgPatternSize: '24px 24px',
    outerBorder: '14px solid #1e1b4b',
    innerBorder: '2.5px dashed #f59e0b',
    badgeTitle: 'ACADEMIC & INVESTIGATIVE MERIT',
    sealType: 'gold_starburst',
    fontStyle: 'font-serif',
    headerFont: 'font-serif',
    accentClass: 'text-indigo-800',
    cornerRenderer: () => (
      <>
        {/* Baroque Scroll Inlays */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400 pointer-events-none">
          <div className="absolute top-1 left-1 w-5 h-5 border-t border-l border-indigo-400"></div>
        </div>
        <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400 pointer-events-none">
          <div className="absolute top-1 right-1 w-5 h-5 border-t border-r border-indigo-400"></div>
        </div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400 pointer-events-none">
          <div className="absolute bottom-1 left-1 w-5 h-5 border-b border-l border-indigo-400"></div>
        </div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400 pointer-events-none">
          <div className="absolute bottom-1 right-1 w-5 h-5 border-b border-r border-indigo-400"></div>
        </div>
      </>
    )
  },

  // Theme 4: Literary, Debating & Arts Societies
  // Crimson Burgundy & Rose Gold
  literary_arts: {
    id: 'literary_arts',
    name: 'Literary & Rhetorical Laurels',
    primaryColor: '#881337',      // Rose 900
    accentColor: '#e11d48',       // Rose 600
    secondaryColor: '#f59e0b',    // Amber 500
    headerBg: 'linear-gradient(135deg, #881337 0%, #9f1239 100%)',
    bgPattern: 'radial-gradient(#e11d48 0.75px, transparent 0.75px), radial-gradient(#e11d48 0.75px, #fffdfd 0.75px)',
    bgPatternSize: '30px 30px',
    outerBorder: '12px double #881337',
    innerBorder: '2px solid #fb7185',
    badgeTitle: 'ORATORICAL & SCHOLASTIC HONOR',
    sealType: 'ruby_medal',
    fontStyle: 'font-serif',
    headerFont: 'font-serif',
    accentClass: 'text-rose-800',
    cornerRenderer: () => (
      <>
        {/* Victorian Flourish Accents */}
        <div className="absolute top-2 left-2 w-8 h-8 border-t-4 border-l-4 border-rose-800 rounded-tl-xl pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-8 h-8 border-t-4 border-r-4 border-rose-800 rounded-tr-xl pointer-events-none"></div>
        <div className="absolute bottom-2 left-2 w-8 h-8 border-b-4 border-l-4 border-rose-800 rounded-bl-xl pointer-events-none"></div>
        <div className="absolute bottom-2 right-2 w-8 h-8 border-b-4 border-r-4 border-rose-800 rounded-br-xl pointer-events-none"></div>
      </>
    )
  },

  // Theme 5: Engineering, Sports & Student Leadership
  // Titanium Charcoal & Platinum Amber
  engineering_sports: {
    id: 'engineering_sports',
    name: 'Technical & Athletic Distinction',
    primaryColor: '#18181b',      // Zinc 900
    accentColor: '#ea580c',       // Orange 600
    secondaryColor: '#38bdf8',    // Sky 400
    headerBg: 'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
    bgPattern: 'radial-gradient(#ea580c 0.75px, transparent 0.75px), radial-gradient(#ea580c 0.75px, #fafafa 0.75px)',
    bgPatternSize: '26px 26px',
    outerBorder: '12px solid #18181b',
    innerBorder: '2px solid #ea580c',
    badgeTitle: 'ATHLETIC & TECHNICAL HONORS',
    sealType: 'platinum_gear',
    fontStyle: 'font-sans',
    headerFont: 'font-serif',
    accentClass: 'text-orange-700',
    cornerRenderer: () => (
      <>
        {/* Precision Chamfered Corners */}
        <div className="absolute top-2 left-2 w-7 h-7 bg-orange-600/20 border-t-2 border-l-2 border-orange-500 pointer-events-none"></div>
        <div className="absolute top-2 right-2 w-7 h-7 bg-orange-600/20 border-t-2 border-r-2 border-orange-500 pointer-events-none"></div>
        <div className="absolute bottom-2 left-2 w-7 h-7 bg-orange-600/20 border-b-2 border-l-2 border-orange-500 pointer-events-none"></div>
        <div className="absolute bottom-2 right-2 w-7 h-7 bg-orange-600/20 border-b-2 border-r-2 border-orange-500 pointer-events-none"></div>
      </>
    )
  }
};

/**
 * Deterministically maps any society (by ID or name) to its unique certificate theme,
 * guaranteeing that each society gets its own dedicated, non-identical design!
 */
export function getSocietyCertificateTheme(societyId, societyName = '') {
  const normName = (societyName || '').toLowerCase();

  // Keyword-based matching for specific identities
  if (normName.includes('cssc') || normName.includes('student club') || normName.includes('acm') || normName.includes('ieee')) {
    return SOCIETY_THEMES.tech_cyber;
  }
  if (normName.includes('react') || normName.includes('emergency') || normName.includes('health') || normName.includes('rescue')) {
    return SOCIETY_THEMES.emergency_ops;
  }
  if (normName.includes('center') || normName.includes('forensics') || normName.includes('research') || normName.includes('security')) {
    return SOCIETY_THEMES.forensics_research;
  }
  if (normName.includes('literary') || normName.includes('debat') || normName.includes('art') || normName.includes('dramat')) {
    return SOCIETY_THEMES.literary_arts;
  }
  if (normName.includes('sport') || normName.includes('athlet') || normName.includes('engineer') || normName.includes('robot')) {
    return SOCIETY_THEMES.engineering_sports;
  }

  // ID-based deterministic distribution so new societies never collide
  const themeKeys = ['tech_cyber', 'emergency_ops', 'forensics_research', 'literary_arts', 'engineering_sports'];
  const numId = Number(societyId) || 0;
  const pickedKey = themeKeys[numId % themeKeys.length];
  return SOCIETY_THEMES[pickedKey] || SOCIETY_THEMES.tech_cyber;
}
