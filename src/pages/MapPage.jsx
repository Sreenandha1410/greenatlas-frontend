import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { getTrees } from '../api';
import { useDarkMode } from '../context/DarkModeContext'
{/*
const MarkerClusterGroup = require('react-leaflet-cluster').default || require('react-leaflet-cluster');
import 'react-leaflet-cluster/lib/assets/MarkerCluster.css';
import 'react-leaflet-cluster/lib/assets/MarkerCluster.Default.css';
*/}
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

{/*
const dotIcon = (color = '#2d5a27') => L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35)"></div>`,
  iconSize: [14, 14], iconAnchor: [7, 7],
})
*/}

const AREA_COLORS = [
  '#e74c3c','#3498db','#2ecc71','#f39c12','#9b59b6',
  '#1abc9c','#e67e22','#e91e63','#00bcd4','#8bc34a',
  '#ff5722','#607d8b','#795548','#ff9800','#673ab7',
];

const areaColorMap = {};
let areaColorIndex = 0;

const colorForArea = (area) => {
  if (!areaColorMap[area]) {
    areaColorMap[area] = AREA_COLORS[areaColorIndex % AREA_COLORS.length];
    areaColorIndex++;
  }
  return areaColorMap[area];
};

// Flies map to first search result
function FlyTo({ target }) {
  const map = useMap()
  useEffect(() => {
    if (target) map.flyTo([target.latitude, target.longitude], 20, { duration: 1 })
  }, [target])
  return null
}

export default function MapPage() {
  const [dark] = useDarkMode()
  const [trees, setTrees]       = useState([])
  const [search, setSearch]     = useState('')
  const [flyTarget, setFlyTarget] = useState(null)
  const [matchCount, setMatchCount] = useState(null)
  const [legendOpen, setLegendOpen] = useState(false);
  const [floraFilter, setFloraFilter] = useState('all'); // 'all' | 'tree' | 'plant'

  useEffect(() => { getTrees().then(r => setTrees(r.data)) }, [])

  const center = trees.length > 0
    ? [trees[0].latitude, trees[0].longitude]
    : [11.678, 78.125]

  const filtered = trees.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !search.trim() || [t.common_name, t.botanical_name, t.area, t.family, t.tree_id, t.tamil_name]
      .some(v => v?.toLowerCase().includes(q))
    const matchFlora = floraFilter === 'all' || t.flora_type === floraFilter
    return matchSearch && matchFlora
  })

  const handleSearch = (e) => {
    e.preventDefault()
    if (!search.trim()) { setFlyTarget(null); setMatchCount(null); return }
    const matches = trees.filter(t => {
      const q = search.toLowerCase()
      return [t.common_name, t.botanical_name, t.area, t.family, t.tree_id, t.tamil_name]
        .some(v => v?.toLowerCase().includes(q))
    })
    setMatchCount(matches.length)
    if (matches.length > 0) setFlyTarget(matches[0])
  }

  {/*const areaIcon = (tree) => {
    const color = search.trim() ? '#e53e3e' : colorForArea(tree.area);
    const label = (tree.area_code || tree.area || '').substring(0, 3).toUpperCase();
    return L.divIcon({
      className: '',
      html: `<div style="
        width:32px;height:32px;background:${color};
        border:2.5px solid white;border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:9px;font-weight:700;font-family:sans-serif;
        line-height:1;text-align:center;
      ">${label}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });
  };*/}

  {/*const FAMILY_EMOJI = {
    'Fabaceae': '🫘',    'Leguminosae': '🫘',
    'Arecaceae': '🌴',   'Palmae': '🌴',
    'Moraceae': '🌳',
    'Meliaceae': '🪵',
    'Myrtaceae': '🍃',
    'Rutaceae': '🍋',
    'Anacardiaceae': '🥭',
    'Apocynaceae': '🌸',
    'Bignoniaceae': '🌺',
    'Verbenaceae': '🌻',
    'Lauraceae': '🍂',
    'Malvaceae': '🌼',   'Bombacaceae': '🌼',
    'Euphorbiaceae': '🍀',
    'Casuarinaceae': '🎋',
    'Combretaceae': '🌿',
    'Mimosaceae': '🌾',
  };
  
  const treeIcon = (tree) => {
    const color = search.trim() ? '#e53e3e' : colorForArea(tree.area);
    const emoji = FAMILY_EMOJI[tree.family] || '🌳';
    return L.divIcon({
      className: '',
      html: `<div style="
        width:28px;height:28px;background:${color};
        border:2px solid white;border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        font-size:14px;line-height:1;
      ">${emoji}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    });
  };*/}

  const treeShapeIcon = (color, label) => L.divIcon({
    className: '',
    html: `<svg width="24" height="30" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,1 0,20 24,20" fill="${color}" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
      <rect x="10" y="19" width="4" height="10" rx="1.5" fill="${color}" stroke="white" stroke-width="1"/>
      <text x="12" y="14" text-anchor="middle" fill="white" font-size="6.5" font-weight="700" font-family="sans-serif">${label}</text>
    </svg>`,
    iconSize: [24, 30], iconAnchor: [12, 30], popupAnchor: [0, -32],
  });
  
  const plantShapeIcon = (color, label) => L.divIcon({
    className: '',
    html: `<svg width="28" height="28" viewBox="0 0 28 28" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="14" cy="12" rx="12" ry="9" fill="${color}" stroke="white" stroke-width="1.5"/>
      <rect x="12" y="20" width="4" height="7" rx="1.5" fill="${color}" stroke="white" stroke-width="1"/>
      <text x="14" y="15" text-anchor="middle" fill="white" font-size="6.5" font-weight="700" font-family="sans-serif">${label}</text>
    </svg>`,
    iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -30],
  });
  
  const treeIcon = (tree) => {
    const color = search.trim() ? '#e53e3e' : colorForArea(tree.area);
    const parts = (tree.botanical_name || '').split(' ');
    const label = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    return tree.flora_type === 'plant'
      ? plantShapeIcon(color, label)
      : treeShapeIcon(color, label);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>

      {/* Header */}
      <div className="px-4 py-3 border-b shrink-0"
        style={{
          background: dark ? '#1c2128' : '#ffffff',
          borderColor: dark ? '#30363d' : '#e5e7eb'
        }}>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-xl font-semibold"
              style={{ color: dark ? '#e6edf3' : '#111827' }}>
              Campus Tree Map
            </h1>
            <span className="badge"
              style={{ background: dark ? '#21262d' : '#d9edcf', color: '#3d7a32' }}>
              {filtered.length} {floraFilter === 'tree' ? 'trees' : floraFilter === 'plant' ? 'plants' : 'entries'}
              {floraFilter !== 'all' && ` of ${trees.filter(t => t.flora_type === floraFilter).length}`}
            </span>
            {matchCount !== null && (
              <span className="text-xs" style={{ color: '#8b949e' }}>
                {matchCount === 0 ? 'No results' : `Showing ${matchCount} • map moved to first result`}
              </span>
            )}
          </div>
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              className="input text-sm w-64"
              placeholder="Search by name, area, family, ID…"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                if (!e.target.value.trim()) { setFlyTarget(null); setMatchCount(null) }
              }}
              style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
            />
            <button type="submit" className="btn-primary text-sm px-4">Search</button>
            {search && (
              <button type="button" className="btn-secondary text-sm px-3"
                onClick={() => { setSearch(''); setFlyTarget(null); setMatchCount(null) }}>
                ✕
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Area legend */}{/*
      {trees.length > 0 && (
        <div className="relative shrink-0"
          style={{ borderBottom: legendOpen ? `1px solid ${dark ? '#30363d' : '#e5e7eb'}` : 'none' }}>
          <button
            onClick={() => setLegendOpen(o => !o)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold w-full"
            style={{ color: dark ? '#e6edf3' : '#374151', background: dark ? '#1c2128' : '#f9fafb' }}>
            <div className="flex items-center gap-1">
              {[...new Set(trees.map(t => t.area).filter(Boolean))].slice(0, 5).map(area => (
                <div key={area} style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: colorForArea(area), border: '1.5px solid white',
                }} />
              ))}
              <span className="ml-1">+{[...new Set(trees.map(t => t.area).filter(Boolean))].length} areas</span>
            </div>
            <span style={{ marginLeft: 'auto' }}>{legendOpen ? '▲ Hide' : '▼ Legend'}</span>
          </button>
      
          {legendOpen && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 px-4 py-3"
              style={{ background: dark ? '#1c2128' : '#f9fafb' }}>
              {[...new Set(trees.map(t => t.area).filter(Boolean))].map(area => (
                <div key={area} className="flex items-center gap-1.5 text-xs"
                  style={{ color: dark ? '#e6edf3' : '#374151' }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%',
                    background: colorForArea(area),
                    border: '1.5px solid white',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    flexShrink: 0,
                  }} />
                  {area}
                </div>
              ))}
            </div>
          )}
        </div>
      )}*/}

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Legend overlay — place this INSIDE the map div, before MapContainer */}
        {trees.length > 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 50, zIndex: 1000,
            background: dark ? 'rgba(28,33,40,0.95)' : 'rgba(255,255,255,0.95)',
            borderRadius: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
            overflow: 'hidden', minWidth: 180,
          }}>
            {/* Toggle button */}
            <button onClick={() => setLegendOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-2 text-xs font-semibold w-full"
              style={{ color: dark ? '#e6edf3' : '#374151' }}>
              <span className="font-semibold">Legend</span>
              <span style={{ marginLeft: 'auto' }}>{legendOpen ? '▲' : '▼'}</span>
            </button>
        
            <div style={{
              maxHeight: legendOpen ? 400 : 0,
              opacity: legendOpen ? 1 : 0,
              overflow: 'hidden auto',
              transition: 'max-height 0.3s ease, opacity 0.2s ease',
            }}>
              {/* Flora type filter */}
              <div className="px-3 pb-2 pt-1">
                <p className="text-xs font-semibold mb-1.5" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                  Show
                </p>
                <div className="flex gap-1">
                  {[['all','All'],['tree','🌳 Trees'],['plant','🌿 Plants']].map(([v, l]) => (
                    <button key={v} onClick={() => setFloraFilter(v)}
                      className="text-xs px-2 py-1 rounded-md font-medium transition-colors"
                      style={{
                        background: floraFilter === v
                          ? 'var(--color-forest-500)'
                          : (dark ? '#21262d' : '#f3f4f6'),
                        color: floraFilter === v ? 'white' : (dark ? '#e6edf3' : '#374151'),
                      }}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
        
              <div style={{ height: 1, background: dark ? '#30363d' : '#f3f4f6', margin: '0 12px 8px' }} />
        
              {/* Shape guide */}
              <div className="px-3 pb-2 flex gap-3">
                <div className="flex items-center gap-1.5 text-xs" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                  <svg width="12" height="15" viewBox="0 0 24 30"><polygon points="12,1 0,20 24,20" fill={dark ? '#8b949e' : '#6b7280'}/><rect x="10" y="19" width="4" height="10" rx="1" fill={dark ? '#8b949e' : '#6b7280'}/></svg>
                  Tree
                </div>
                <div className="flex items-center gap-1.5 text-xs" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                  <svg width="13" height="13" viewBox="0 0 28 28"><ellipse cx="14" cy="11" rx="12" ry="9" fill={dark ? '#8b949e' : '#6b7280'}/><rect x="12" y="19" width="4" height="7" rx="1" fill={dark ? '#8b949e' : '#6b7280'}/></svg>
                  Plant
                </div>
              </div>
        
              <div style={{ height: 1, background: dark ? '#30363d' : '#f3f4f6', margin: '0 12px 8px' }} />
        
              {/* Area colours */}
              <div className="flex flex-col gap-1.5 px-3 pb-3">
                <p className="text-xs font-semibold" style={{ color: dark ? '#8b949e' : '#6b7280' }}>Areas</p>
                {[...new Set(trees.map(t => t.area).filter(Boolean))].map(area => (
                  <div key={area} className="flex items-center gap-2 text-xs"
                    style={{ color: dark ? '#e6edf3' : '#374151' }}>
                    <div style={{
                      width: 12, height: 12, borderRadius: '50%', flexShrink: 0,
                      background: colorForArea(area), border: '1.5px solid white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }} />
                    {area}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {trees.length > 0 && (
          <MapContainer center={center} zoom={17}
            style={{ height: '100%', width: '100%' }} maxZoom={22}>

            <FlyTo target={flyTarget} />

            <LayersControl position="topright">
              <LayersControl.BaseLayer checked name="Street">
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap contributors"
                  maxNativeZoom={19} maxZoom={22} />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Satellite">
                <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="© Esri" maxNativeZoom={19} maxZoom={22} />
              </LayersControl.BaseLayer>
            </LayersControl>

            {filtered.map(tree => tree.latitude && tree.longitude && (
              <Marker key={tree.tree_id}
                position={[tree.latitude, tree.longitude]}
                icon={treeIcon(tree)}>
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    {tree.species_image_url && (
                      <div style={{ margin: '-8px -12px 8px', height: 80, overflow: 'hidden', borderRadius: '4px 4px 0 0' }}>
                        <img src={tree.species_image_url} alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )}
                    <p style={{ fontWeight: 700, marginBottom: 2, fontSize: '0.9rem' }}>{tree.common_name}</p>
                    <p style={{ fontSize: '0.75rem', color: '#888', fontStyle: 'italic', marginBottom: 4 }}>{tree.botanical_name}</p>
                    <p style={{ fontSize: '0.78rem', color: '#555', marginBottom: 6 }}>📍 {tree.area}</p>
                    <Link to={`/trees/${tree.tree_id}`}
                      style={{ color: '#2d5a27', fontWeight: 600, fontSize: '0.82rem' }}>
                      View details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  )
}
