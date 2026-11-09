import L from 'leaflet';

// Fixed botanical palette — professional, distinct colors
const PALETTE = [
  '#1b5e20', // Forest Emerald
  '#00796b', // Teal Jade
  '#d97706', // Warm Amber Gold
  '#4f46e5', // Royal Indigo
  '#c2410c', // Terracotta
  '#2563eb', // Sapphire Blue
  '#7c3aed', // Purple Violet
  '#059669', // Mint Jade
  '#b45309', // Ochre
  '#0284c7'  // Sky Cyan
];

// Deterministic color by species string
export const getSpeciesColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

// 2-letter monogram from botanical name
export const getBotanicalMonogram = (botanicalName = '', commonName = '') => {
  const parts = (botanicalName || commonName || 'TR').trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].slice(0, 2).toUpperCase();
};

/**
 * Creates a stylized pin with strong tree vs. plant shape differentiation.
 *
 * TREE:  Inverted teardrop + large filled TRIANGLE canopy above the head (like a tree silhouette)
 * PLANT: Inverted teardrop + 3 overlapping circles above the head (like a bush cluster)
 */
export const createStylizedPin = ({
  color = '#1b5e20',
  label = 'TR',
  isPlant = false,
  isSelected = false,
  isDimmed = false
}) => {
  const scale = isSelected ? 1.2 : 1;
  const W = Math.round(34 * scale);
  const H = Math.round(50 * scale);
  const pinFill   = isSelected ? '#15803d' : color;
  const stroke    = isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)';
  const sw        = isSelected ? 2.5 : 1.5;
  const opacity   = isDimmed ? 0.22 : 1;
  const glow      = isSelected ? 'filter:drop-shadow(0 0 8px rgba(34,197,94,0.85));' : '';

  // The teardrop body (bottom anchor)
  const body = `<path d="M17 48C17 48 31 32 31 20C31 11.7 24.7 5 17 5C9.3 5 3 11.7 3 20C3 32 17 48 17 48Z"
        fill="${pinFill}" stroke="${stroke}" stroke-width="${sw}"/>
      <circle cx="17" cy="20" r="10" fill="#ffffff"/>
      <text x="17" y="23.5" text-anchor="middle"
            font-family="system-ui,-apple-system,sans-serif"
            font-size="8" font-weight="800" fill="${pinFill}">${label}</text>`;

  // TREE top: solid triangle canopy (tall, clearly tree-shaped)
  const treeTop = `
      <polygon points="17,0 9,13 25,13" fill="${pinFill}" stroke="${stroke}" stroke-width="1" stroke-linejoin="round"/>`;

  // PLANT top: 3 overlapping circles forming a bush cluster
  const plantTop = `
      <circle cx="17" cy="8"  r="6"   fill="${pinFill}" stroke="${stroke}" stroke-width="1"/>
      <circle cx="11" cy="11" r="5.5" fill="${pinFill}" stroke="${stroke}" stroke-width="1"/>
      <circle cx="23" cy="11" r="5.5" fill="${pinFill}" stroke="${stroke}" stroke-width="1"/>`;

  const svg = `<svg width="${W}" height="${H}" viewBox="0 0 34 50"
       fill="none" xmlns="http://www.w3.org/2000/svg" style="${glow}">
    ${isPlant ? plantTop : treeTop}
    ${body}
  </svg>`;

  return L.divIcon({
    className: 'custom-tree-pin',
    html: `<div style="opacity:${opacity};transition:opacity 0.2s ease;">${svg}</div>`,
    iconSize:    [W, H],
    iconAnchor:  [W / 2, H],
    popupAnchor: [0, -H + 4]
  });
};
