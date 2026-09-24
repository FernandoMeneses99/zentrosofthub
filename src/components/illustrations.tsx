// Ilustraciones empty-state estilo Flowbite (SVG inline, colores de marca).
export function InboxEmpty() {
  return (
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
