import { useState, useEffect, useMemo, Component } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import { getTrees } from '../api';
import { useDarkMode } from '../context/DarkModeContext';
import { createStylizedPin, getSpeciesColor, getBotanicalMonogram } from '../utils/mapPins';

class MapErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("Map failed to load:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Unable to display map
          </p>
          <p className="text-sm text-gray-500 mt-1 mb-4">
            A map rendering error occurred. Please check your connection.
          </p>
          <button 
            className="btn-primary text-sm px-4 py-2"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Smoothly pans the map to the first search match without abrupt teleporting
function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target && target.latitude && target.longitude) {
      map.flyTo([parseFloat(target.latitude), parseFloat(target.longitude)], 19, {
        duration: 0.8,
        easeLinearity: 0.25
      });
    }
  }, [target, map]);
  return null;
}

export default function MapPage() {
  const [dark] = useDarkMode();
  const [trees, setTrees] = useState([]);
  const [search, setSearch] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);
  const [matchCount, setMatchCount] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [floraFilter, setFloraFilter] = useState('all'); // 'all' | 'tree' | 'plant'

  useEffect(() => {
    getTrees().then(r => setTrees(r.data)).catch(console.error);
  }, []);

  const center = useMemo(() => {
    const valid = trees.filter(t => t.latitude && t.longitude && !isNaN(t.latitude) && !isNaN(t.longitude));
    return valid.length > 0
      ? [parseFloat(valid[0].latitude), parseFloat(valid[0].longitude)]
      : [11.678, 78.125];
  }, [trees]);

  // Search query lowercase
  const q = search.toLowerCase().trim();

  // Filter trees matching both search and flora filter
  const filtered = useMemo(() => {
    return trees.filter(t => {
      const matchSearch = !q || [t.common_name, t.botanical_name, t.area, t.family, t.tree_id, t.tamil_name]
        .some(v => v?.toLowerCase().includes(q));
      const matchFlora = floraFilter === 'all' || (t.flora_type || 'tree') === floraFilter;
      return matchSearch && matchFlora;
    });
  }, [trees, q, floraFilter]);

  // Set of matched tree IDs for dimming non-matches rather than turning everything red
  const matchedIds = useMemo(() => {
    if (!q) return null;
    return new Set(filtered.map(t => t.tree_id));
  }, [filtered, q]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!q) {
      setFlyTarget(null);
      setMatchCount(null);
      return;
    }
    setMatchCount(filtered.length);
    if (filtered.length > 0) {
      setFlyTarget(filtered[0]);
    }
  };

  // Distinct campus areas for legend
  const uniqueAreas = useMemo(() => {
    return [...new Set(trees.map(t => t.area).filter(Boolean))].sort();
  }, [trees]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>
      {/* Top Controls Bar */}
      <div
        className="px-4 py-2.5 border-b shrink-0 transition-colors"
        style={{
          background: dark ? '#1c2128' : '#ffffff',
          borderColor: dark ? '#30363d' : '#e5e7eb'
        }}
      >
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-bold" style={{ color: dark ? '#e6edf3' : '#111827' }}>
              Campus Flora Map
            </h1>
            <span
              className="badge text-xs font-semibold px-2.5 py-0.5 rounded-full"
              style={{ background: dark ? '#21262d' : '#d9edcf', color: '#2d6a27' }}
            >
              {filtered.length} {floraFilter === 'tree' ? 'trees' : floraFilter === 'plant' ? 'plants' : 'flora'}
            </span>
            {matchCount !== null && (
              <span className="text-xs" style={{ color: '#8b949e' }}>
                {matchCount === 0 ? 'No matches' : `${matchCount} found`}
              </span>
            )}
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              className="input text-xs w-60 py-1.5 px-3 rounded-lg"
              placeholder="Search botanical, common, area..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) {
                  setFlyTarget(null);
                  setMatchCount(null);
                }
              }}
              style={{
                background: dark ? '#161b22' : '#fff',
                color: dark ? '#e6edf3' : '#111827',
                border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
              }}
            />
            <button type="submit" className="btn-primary text-xs px-3 py-1.5 rounded-lg">
              Search
            </button>
            {search && (
              <button
                type="button"
                className="text-xs px-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500"
                onClick={() => {
                  setSearch('');
                  setFlyTarget(null);
                  setMatchCount(null);
                }}
              >
                ✕
              </button>
            )}
          </form>
        </div>
      </div>

      {/* Map Canvas with Half-Step Zoom & High Performance */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        {/* Optimized Legend Overlay */}
        {trees.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: 54,
              zIndex: 1000,
              background: dark ? 'rgba(28,33,40,0.95)' : 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(8px)',
              borderRadius: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              border: `1px solid ${dark ? '#30363d' : '#e5e7eb'}`,
              overflow: 'hidden',
              minWidth: 190
            }}
          >
            <button
              onClick={() => setLegendOpen(o => !o)}
              className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold w-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ color: dark ? '#e6edf3' : '#1f2937' }}
            >
              <span>🌱 Map Filters & Legend</span>
              <span className="text-[10px] text-gray-400">{legendOpen ? '▲' : '▼'}</span>
            </button>

            {legendOpen && (
              <div className="p-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3 max-h-80 overflow-y-auto text-xs">
                {/* Flora type filter */}
                <div>
                  <p className="text-[11px] font-semibold mb-1.5 text-gray-500 dark:text-gray-400">
                    Flora Filter
                  </p>
                  <div className="flex gap-1">
                    {[
                      ['all', 'All'],
                      ['tree', '🌳 Trees'],
                      ['plant', '🌿 Plants']
                    ].map(([v, l]) => (
                      <button
                        key={v}
                        onClick={() => setFloraFilter(v)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                          floraFilter === v
                            ? 'bg-forest-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape / Pin Guide */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] font-semibold mb-1 text-gray-500 dark:text-gray-400">Pin Legend</p>
                  <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-300">
                    <span className="flex items-center gap-1">📍 <strong>Tree</strong> (Teardrop)</span>
                    <span className="flex items-center gap-1">🍃 <strong>Plant</strong> (Sprout)</span>
                  </div>
                </div>

                {/* Campus Areas Palette */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-[11px] font-semibold mb-1 text-gray-500 dark:text-gray-400">Areas</p>
                  <div className="space-y-1">
                    {uniqueAreas.map(a => (
                      <div key={a} className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ background: getSpeciesColor(a) }}
                        />
                        <span className="truncate">{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <MapErrorBoundary>
          {trees.length > 0 && (
            <MapContainer
              center={center}
              zoom={18}
              zoomSnap={0.5}
              zoomDelta={0.5}
              wheelPxPerZoomLevel={120}
              style={{ height: '100%', width: '100%' }}
              maxZoom={22}
            >
              <FlyTo target={flyTarget} />

              <LayersControl position="topright">
                <LayersControl.BaseLayer name="Street">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap"
                    maxNativeZoom={19}
                    maxZoom={22}
                  />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer checked name="Satellite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="© Esri"
                    maxNativeZoom={19}
                    maxZoom={22}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              {filtered.map(tree => {
                if (!tree.latitude || !tree.longitude || isNaN(tree.latitude) || isNaN(tree.longitude)) {
                  return null;
                }

                const isPlant = (tree.flora_type || 'tree') === 'plant';
                // Fixed professional color by species name
                const color = getSpeciesColor(tree.botanical_name || tree.area);
                const monogram = getBotanicalMonogram(tree.botanical_name, tree.common_name);
                const isMatch = matchedIds ? matchedIds.has(tree.tree_id) : true;
                const isSelected = flyTarget?.tree_id === tree.tree_id;

                return (
                  <Marker
                    key={tree.tree_id}
                    position={[parseFloat(tree.latitude), parseFloat(tree.longitude)]}
                    icon={createStylizedPin({
                      color,
                      label: monogram,
                      isPlant,
                      isSelected,
                      isDimmed: !isMatch
                    })}
                  >
                    <Popup>
                      <div className="p-1 min-w-[160px] text-xs">
                        {tree.species_image_url && (
                          <div className="mb-2 h-20 overflow-hidden rounded-lg">
                            <img
                              src={tree.species_image_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <p className="font-bold text-gray-900 text-sm mb-0.5">{tree.common_name}</p>
                        <p className="italic text-gray-500 mb-1">{tree.botanical_name}</p>
                        <p className="font-mono text-xs text-forest-600 font-bold mb-1">ID: {tree.tree_id}</p>
                        <p className="text-gray-500 mb-2">📍 {tree.area}</p>
                        <Link
                          to={`/trees/${tree.tree_id}`}
                          className="inline-block px-3 py-1 bg-forest-600 text-white rounded-md font-semibold hover:bg-forest-700"
                        >
                          View details →
                        </Link>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          )}
        </MapErrorBoundary>
      </div>
    </div>
  );
}
