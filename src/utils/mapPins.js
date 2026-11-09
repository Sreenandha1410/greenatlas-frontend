import L from 'leaflet';

const PALETTE = [
  '#1b5e20', '#00796b', '#d97706', '#4f46e5', '#c2410c',
  '#2563eb', '#7c3aed', '#059669', '#b45309', '#0284c7'
];

export const getSpeciesColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

export const getBotanicalMonogram = (botanicalName = '', commonName = '') => {
  const parts = (botanicalName || commonName || 'TR').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

/**
 * Pin design (viewBox 0 0 34 58):
 *
 * TREE:  Teardrop (y=15–57) + white circle (cy=28) + text,
 *        THEN triangle canopy (apex y=0, base y=15) painted on top → clearly visible spike
 *
 * PLANT: Teardrop (y=15–57) + white circle (cy=28) + text,
 *        THEN 3 circles (top y≈1, bottom y≈21) painted on top → clearly visible bush cluster
 *
 * Key: body rendered FIRST, shape rendered LAST (SVG painter order = later = on top).
 */
export const createStylizedPin = ({
  color = '#1b5e20',
  label = 'TR',
  isPlant = false,
  isSelected = false,
  isDimmed = false
}) => {
  const scale   = isSelected ? 1.2 : 1;
  const W       = Math.round(34 * scale);
  const H       = Math.round(58 * scale);
  const pinFill = isSelected ? '#15803d' : color;
  const stroke  = isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)';
  const sw      = isSelected ? 2.5 : 1.5;
  const opacity = isDimmed ? 0.22 : 1;
  const glow    = isSelected ? 'filter:drop-shadow(0 0 8px rgba(34,197,94,0.85));' : '';

  // ── Step 1: Teardrop body (rendered first = behind shape) ──────────────
  // Top of head at y≈15, circle center cy=28, tip at y=57
  const body = `
    <path d="M17 57C17 57 30 42 30 28C30 20 24.3 14 17 14C9.7 14 4 20 4 28C4 42 17 57 17 57Z"
          fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>
    <circle cx="17" cy="28" r="10.5" fill="#ffffff"/>
    <text x="17" y="32" text-anchor="middle"
          font-family="system-ui,-apple-system,sans-serif"
          font-size="8.5" font-weight="800" fill="${pinFill}">${label}</text>`;

  // ── Step 2a: TREE — triangle canopy (rendered last = on top of body) ───
  // Apex (17,0), base corners (5,15) & (29,15) — base aligns with teardrop top → seamless join
  const treeTop = `
    <polygon points="17,0 5,15 29,15"
             fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

  // ── Step 2b: PLANT — 3-bubble bush (rendered last = on top of body) ────
  // Central bubble top at y≈0.5, side-bubble bottoms at y≈21 — overlap teardrop top seamlessly
  const plantTop = `
    <circle cx="17" cy="8"  r="8"   fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>
    <circle cx="9"  cy="15" r="7"   fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>
    <circle cx="25" cy="15" r="7"   fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 34 58"
     fill="none" xmlns="http://www.w3.org/2000/svg" style="${glow}">
  ${body}
  ${isPlant ? plantTop : treeTop}
</svg>`;

  return L.divIcon({
    className: 'custom-tree-pin',
    html: `<div style="opacity:${opacity};transition:opacity 0.2s ease;">${svg}</div>`,
    iconSize:    [W, H],
    iconAnchor:  [W / 2, H],
    popupAnchor: [0, -H + 6]
  });
};
