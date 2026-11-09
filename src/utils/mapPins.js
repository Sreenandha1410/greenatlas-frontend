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
 * Coordinate space: viewBox "0 0 34 58"  (unchanged — only rendered W/H shrunk)
 * Rendered size:    W=24 H=42  (compact, was 34×58)
 *
 * SVG painter order (later = on top):
 *   1. Teardrop body  (green, tip at y=57)
 *   2. White overlay circle  (cx=17 cy=31 r=9) — shifted lower → more top space
 *   3. Monogram text  (y=35)
 *   4. Shape indicator — LAST so always visible above body
 *
 * TREE:  two-layer pine canopy (narrow upper + wide lower triangle sharing apex)
 * PLANT: three overlapping circles forming a bush cluster
 *
 * Both shapes have their lower edge at y=17 = teardrop top → seamless colour merge.
 */
export const createStylizedPin = ({
  color = '#1b5e20',
  label = 'TR',
  isPlant = false,
  isSelected = false,
  isDimmed = false
}) => {
  const scale   = isSelected ? 1.15 : 1;
  const W       = Math.round(24 * scale);   // compact
  const H       = Math.round(42 * scale);   // compact
  const pinFill = isSelected ? '#15803d' : color;
  const stroke  = isSelected ? '#ffffff' : 'rgba(255,255,255,0.8)';
  const sw      = isSelected ? 2 : 1.5;
  const opacity = isDimmed ? 0.22 : 1;
  const glow    = isSelected ? 'filter:drop-shadow(0 0 6px rgba(34,197,94,0.9));' : '';

  // ── Body (rendered FIRST = behind shape) ─────────────────────────────────────────
  // Circle center shifted to cy=31 (was 28) → teardrop top now at y=17 (was y=14)
  // This gives y=0–17 of clear space for the shape indicator above the green body
  const body = `
    <path d="M17 57C17 57 30 44 30 31C30 23 24.3 17 17 17C9.7 17 4 23 4 31C4 44 17 57 17 57Z"
          fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>
    <circle cx="17" cy="31" r="9" fill="#ffffff"/>
    <text x="17" y="35" text-anchor="middle"
          font-family="system-ui,-apple-system,sans-serif"
          font-size="7" font-weight="800" fill="${pinFill}">${label}</text>`;

  // ── TREE: double-layer pine canopy (rendered LAST = on top) ──────────────────────
  // Upper narrow canopy: shared apex (17,3) → base (10,12)–(24,12), width=14
  // Lower wide  canopy:  shared apex (17,8) → base  (5,17)–(29,17), width=24
  //   • Base of lower canopy at y=17 = teardrop top → colours merge perfectly
  //   • The two triangles create a layered pine silhouette, immediately recognisable
  const treeTop = `
    <polygon points="17,3 10,12 24,12"
             fill="${pinFill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>
    <polygon points="17,8 5,17 29,17"
             fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}" stroke-linejoin="round"/>`;

  // ── PLANT: 3-bubble bush cluster (rendered LAST = on top) ────────────────────────
  // Central top bubble: cx=17 cy=10 r=8  (top at y=2 — prominent crown)
  // Side base bubbles:  cx=9/25 cy=17 r=7 (bottom at y=24, extending into body → seamless)
  const plantTop = `
    <circle cx="17" cy="10" r="8"   fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>
    <circle cx="9"  cy="17" r="7"   fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>
    <circle cx="25" cy="17" r="7"   fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>`;

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
