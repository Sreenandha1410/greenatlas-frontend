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

  useEffect(() => { getTrees().then(r => setTrees(r.data)) }, [])

  const center = trees.length > 0
    ? [trees[0].latitude, trees[0].longitude]
    : [11.678, 78.125]

  const filtered = search.trim()
    ? trees.filter(t => {
        const q = search.toLowerCase()
        return [t.common_name, t.botanical_name, t.area, t.family, t.tree_id, t.tamil_name]
          .some(v => v?.toLowerCase().includes(q))
      })
    : trees

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

  const treeIcon = (tree) => {
    const color = search.trim() ? '#e53e3e' : colorForArea(tree.area);
    const parts = (tree.botanical_name || '').split(' ');
    const label = ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
    return L.divIcon({
      className: '',
      html: `<div style="
        width:20px;height:20px;background:${color};
        border:2px solid white;border-radius:50%;
        box-shadow:0 2px 6px rgba(0,0,0,0.35);
        display:flex;align-items:center;justify-content:center;
        color:white;font-size:7px;font-weight:700;font-family:sans-serif;
        line-height:1;
      ">${label}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
      popupAnchor: [0, -12],
    });
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
              {search.trim() ? `${filtered.length} matches` : `${trees.length} trees`}
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

      {/* Area legend */}
      {trees.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {[...new Set(trees.map(t => t.area).filter(Boolean))].map(area => (
            <div key={area} className="flex items-center gap-1 text-xs"
              style={{ color: dark ? '#e6edf3' : '#374151' }}>
              <div style={{
                width: 16, height: 16, borderRadius: '50%',
                background: colorForArea(area),
                border: '2px solid white',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              }} />
              {area}
            </div>
          ))}
        </div>
      )}

      {/* Map */}
      <div style={{ flex: 1, minHeight: 0 }}>
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
                icon={areaIcon(tree)}>
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
