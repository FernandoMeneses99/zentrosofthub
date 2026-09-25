// Ilustraciones empty-state estilo Flowbite (SVG inline, colores de marca).
export function InboxEmpty() {  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
      <rect x="14" y="18" width="92" height="60" rx="10" fill="#eef4fb" stroke="#bcd2ec" strokeWidth="2" />
      <rect x="26" y="32" width="48" height="8" rx="4" fill="#4b82c3" opacity="0.5" />
      <rect x="26" y="46" width="68" height="6" rx="3" fill="#bcd2ec" />
      <rect x="26" y="57" width="54" height="6" rx="3" fill="#bcd2ec" />
      <circle cx="88" cy="66" r="14" fill="#4fd290" />
      <path d="M82 66l4 4 7-8" stroke="#0a1628" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ChartEmpty() {
  return (
    <svg width="120" height="80" viewBox="0 0 120 80" fill="none" aria-hidden="true">
      <path d="M10 70 L40 45 L60 55 L85 25 L110 35" stroke="#4b82c3" strokeWidth="3" strokeLinecap="round" />
      {[70, 45, 55, 25, 35].map((y, i) => (
        <circle key={i} cx={10 + i * 25} cy={y} r="4" fill="#4fd290" stroke="#0a1628" strokeWidth="1.5" />
      ))}
      <line x1="5" y1="75" x2="115" y2="75" stroke="#bcd2ec" strokeWidth="2" />
    </svg>
  );
}

// Arte de servicio técnico: engranaje + checklist (estilo ilustraciones Flowbite).
export function ServiceArt() {
  return (
    <svg width="160" height="120" viewBox="0 0 160 120" fill="none" aria-hidden="true">
      <rect x="8" y="14" width="96" height="92" rx="12" fill="#eef4fb" stroke="#bcd2ec" strokeWidth="2" />
      <line x1="24" y1="34" x2="88" y2="34" stroke="#4b82c3" strokeWidth="5" strokeLinecap="round" />
      <line x1="24" y1="50" x2="70" y2="50" stroke="#bcd2ec" strokeWidth="5" strokeLinecap="round" />
      <line x1="24" y1="66" x2="78" y2="66" stroke="#bcd2ec" strokeWidth="5" strokeLinecap="round" />
      <circle cx="34" cy="88" r="6" fill="#4fd290" />
      <path d="M31 88l2.5 2.5 4.5-5" stroke="#0a1628" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="48" y1="88" x2="88" y2="88" stroke="#bcd2ec" strokeWidth="5" strokeLinecap="round" />
      <circle cx="126" cy="40" r="18" fill="#0a1628" />
      <circle cx="126" cy="40" r="8" fill="#132238" />
      <circle cx="126" cy="40" r="3" fill="#4fd290" />
      <rect x="112" y="66" width="28" height="40" rx="6" fill="#4b82c3" />
      <rect x="118" y="74" width="16" height="4" rx="2" fill="#fff" opacity="0.8" />
      <rect x="118" y="82" width="16" height="4" rx="2" fill="#fff" opacity="0.6" />
      <rect x="118" y="90" width="10" height="4" rx="2" fill="#fff" opacity="0.4" />
    </svg>
  );
}
