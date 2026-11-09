import L from 'leaflet';

// Fixed botanical palette
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

// Deterministic color generator based on species string
export const getSpeciesColor = (str = '') => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

// Monogram generator: 2 uppercase letters (Genus 1st letter + Species 1st letter)
export const getBotanicalMonogram = (botanicalName = '', commonName = '') => {
  const parts = (botanicalName || commonName || 'TR').trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

/**
 * Creates a stylized teardrop / leaf pin
 * @param {Object} options
 * @param {string} options.color - Background pin color
 * @param {string} options.label - 2-character monogram
 * @param {boolean} options.isPlant - If true, displays plant contour
 * @param {boolean} options.isSelected - Highlighted selection state
 * @param {boolean} options.isDimmed - Search mismatch dimmed state
 */
export const createStylizedPin = ({
  color = '#1b5e20',
  label = 'TR',
  isPlant = false,
  isSelected = false,
  isDimmed = false
}) => {
  const width = isSelected ? 36 : 30;
  const height = isSelected ? 44 : 38;
  const pinFill = isSelected ? '#15803d' : color;
  const strokeColor = isSelected ? '#ffffff' : 'rgba(255,255,255,0.9)';
  const strokeWidth = isSelected ? 2.5 : 1.5;
  const opacity = isDimmed ? 0.25 : 1;
  const haloAnimation = isSelected ? 'filter: drop-shadow(0 0 8px rgba(34,197,94,0.8));' : '';

  // SVG for Tree Pin (Sharp anchor teardrop)
  const treeSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="${haloAnimation}">
      <path d="M15 37C15 37 27 22.5 27 13.5C27 6.87258 21.6274 1.5 15 1.5C8.37258 1.5 3 6.87258 3 13.5C3 22.5 15 37 15 37Z" 
            fill="${pinFill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      <circle cx="15" cy="13.5" r="8.5" fill="#ffffff" />
      <text x="15" y="17" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="7.5" font-weight="800" fill="${pinFill}">${label}</text>
      <circle cx="15" cy="36.5" r="1.5" fill="${pinFill}" />
    </svg>
  `;

  // SVG for Plant / Shrub Pin (Rounded leaf shield with sprout)
  const plantSvg = `
    <svg width="${width}" height="${height}" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg" style="${haloAnimation}">
      <path d="M15 36.5C15 36.5 26.5 22 26.5 14C26.5 7.6 21.3 2.5 15 2.5C8.7 2.5 3.5 7.6 3.5 14C3.5 22 15 36.5 15 36.5Z" 
            fill="${pinFill}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />
      <path d="M15 2.5C15 2.5 13 -0.5 10 0.5C10 0.5 11 3.5 15 2.5Z" fill="${pinFill}" />
      <circle cx="15" cy="14" r="8" fill="#ffffff" />
      <text x="15" y="17.2" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="7" font-weight="800" fill="${pinFill}">${label}</text>
      <circle cx="15" cy="36.5" r="1.5" fill="${pinFill}" />
    </svg>
  `;

  return L.divIcon({
    className: 'custom-tree-pin',
    html: `<div style="opacity: ${opacity}; transition: all 0.2s ease;">${isPlant ? plantSvg : treeSvg}</div>`,
    iconSize: [width, height],
    iconAnchor: [width / 2, height],
    popupAnchor: [0, -height + 4]
  });
};