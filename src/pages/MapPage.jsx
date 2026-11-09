import { useState, useEffect, useMemo, useCallback, useRef, memo, Component } from 'react';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import { Link } from 'react-router-dom';
import L from 'leaflet';
import Supercluster from 'supercluster';
import { getTrees } from '../api';
import { useDarkMode } from '../context/DarkModeContext';
import { createStylizedPin, getSpeciesColor, getBotanicalMonogram } from '../utils/mapPins';

class MapErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false }; }
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(e, i) { console.error('Map error:', e, i); }
  render() {
    if (this.state.hasError) return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center">
        <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">Unable to display map</p>
        <p className="text-sm text-gray-500 mt-1 mb-4">A rendering error occurred. Please check your connection.</p>
        <button className="btn-primary text-sm px-4 py-2" onClick={() => window.location.reload()}>Reload Page</button>
      </div>
    );
    return this.props.children;
  }
}

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const DEFAULT_CENTER = [11.678, 78.125];
const DEFAULT_ZOOM   = 18;

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target?.latitude && target?.longitude) {
      map.flyTo([parseFloat(target.latitude), parseFloat(target.longitude)], 19, {
        duration: 0.8, easeLinearity: 0.25
      });
    }
  }, [target, map]);
  return null;
}

// Cluster + individual marker layer — only renders what's visible in the viewport
const ClusterMarkerLayer = memo(function ClusterMarkerLayer({ trees, matchedIds, flyTarget }) {
  const map = useMap();
  const [view, setView] = useState(null);
  const iconCache = useRef({});

  const index = useMemo(() => {
    const features = trees
      .filter(t => t.latitude && t.longitude && !isNaN(Number(t.latitude)) && !isNaN(Number(t.longitude)))
      .map(t => ({
        type: 'Feature',
        properties: { tree: t },
        geometry: { type: 'Point', coordinates: [Number(t.longitude), Number(t.latitude)] }
      }));
    return new Supercluster({ radius: 80, maxZoom: 20, minPoints: 2 }).load(features);
  }, [trees]);

  const refresh = useCallback(() => {
    const b = map.getBounds().pad(0.1);
    setView({
      bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
      zoom: Math.floor(map.getZoom())
    });
  }, [map]);

  useEffect(() => {
    refresh();
    map.on('moveend', refresh);
    map.on('zoomend', refresh);
    return () => { map.off('moveend', refresh); map.off('zoomend', refresh); };
  }, [map, refresh]);

  const features = useMemo(() => view ? index.getClusters(view.bbox, view.zoom) : [], [index, view]);

  return features.map(feature => {
    const [lng, lat] = feature.geometry.coordinates;

    if (feature.properties.cluster) {
      const count = feature.properties.point_count;
      const r = count >= 100 ? 20 : count >= 25 ? 16 : 12;
      return (
        <CircleMarker
          key={`cl-${feature.properties.cluster_id}`}
          center={[lat, lng]}
          radius={r}
          pathOptions={{ color: '#fff', weight: 2, fillColor: '#15803d', fillOpacity: 0.92 }}
          eventHandlers={{ click: () => {
            const zoom = Math.min(index.getClusterExpansionZoom(feature.properties.cluster_id), 22);
            map.flyTo([lat, lng], zoom, { animate: true, duration: 0.35 });
          }}}
        >
          <Tooltip permanent direction="center" className="map-cluster-label">
            <span>{count}</span>
          </Tooltip>
        </CircleMarker>
      );
    }

    const tree = feature.properties.tree;
    const isPlant  = (tree.flora_type || 'tree') === 'plant';
    const color    = getSpeciesColor(tree.botanical_name || tree.area || '');
    const monogram = getBotanicalMonogram(tree.botanical_name, tree.common_name);
    const isDimmed = matchedIds !== null && !matchedIds.has(tree.tree_id);
    const isSelected = flyTarget?.tree_id === tree.tree_id;

    // Cache icons to avoid re-creating L.divIcon on every render
    const ck = `${isPlant ? 'p' : 't'}-${color}-${monogram}-${isSelected ? 's' : 'n'}-${isDimmed ? 'd' : 'n'}`;
    if (!iconCache.current[ck]) {
      iconCache.current[ck] = createStylizedPin({ color, label: monogram, isPlant, isSelected, isDimmed });
    }

    return (
      <Marker key={tree.tree_id} position={[lat, lng]} icon={iconCache.current[ck]}>
        <Popup>
          <div className="p-1 min-w-[160px] text-xs">
            {tree.species_image_url && (
              <div className="mb-2 h-20 overflow-hidden rounded-lg">
                <img src={tree.species_image_url} alt="" className="w-full h-full object-cover" />
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
  });
});

export default function MapPage() {
  const [dark] = useDarkMode();
  const [trees, setTrees] = useState([]);
  const [search, setSearch] = useState('');
  const [flyTarget, setFlyTarget] = useState(null);
  const [matchCount, setMatchCount] = useState(null);
  const [legendOpen, setLegendOpen] = useState(false);
  const [floraFilter, setFloraFilter] = useState('all');

  useEffect(() => {
    getTrees().then(r => setTrees(r.data)).catch(console.error);
  }, []);

  const q = search.toLowerCase().trim();

  const filtered = useMemo(() => trees.filter(t => {
    const matchSearch = !q || [t.common_name, t.botanical_name, t.area, t.family, t.tree_id, t.tamil_name]
      .some(v => v?.toLowerCase().includes(q));
    const matchFlora = floraFilter === 'all' || (t.flora_type || 'tree') === floraFilter;
    return matchSearch && matchFlora;
  }), [trees, q, floraFilter]);

  const matchedIds = useMemo(() => {
    if (!q) return null;
    return new Set(filtered.map(t => t.tree_id));
  }, [filtered, q]);

  const handleSearchSubmit = e => {
    e.preventDefault();
    if (!q) { setFlyTarget(null); setMatchCount(null); return; }
    setMatchCount(filtered.length);
    if (filtered.length > 0) setFlyTarget(filtered[0]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 4rem)' }}>

      {/* Top Controls Bar */}
      <div
        className="px-4 py-2.5 border-b shrink-0"
        style={{ background: dark ? '#1c2128' : '#ffffff', borderColor: dark ? '#30363d' : '#e5e7eb' }}
      >
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-display text-lg font-bold" style={{ color: dark ? '#e6edf3' : '#111827' }}>
              Campus Flora Map
            </h1>
            <span
              className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
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

          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <input
              className="input text-xs w-60 py-1.5 px-3 rounded-lg"
              placeholder="Search botanical, common, area..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                if (!e.target.value.trim()) { setFlyTarget(null); setMatchCount(null); }
              }}
              style={{
                background: dark ? '#161b22' : '#fff',
                color: dark ? '#e6edf3' : '#111827',
                border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
              }}
            />
            <button type="submit" className="btn-primary text-xs px-3 py-1.5 rounded-lg">Search</button>
            {search && (
              <button
                type="button"
                className="text-xs px-2 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-500"
                onClick={() => { setSearch(''); setFlyTarget(null); setMatchCount(null); }}
              >✕</button>
            )}
          </form>
        </div>
      </div>

      {/* Map Canvas — isolation:isolate keeps Leaflet z-indexes contained so navbar/theme selector stays on top */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', isolation: 'isolate' }}>

        {/* Legend overlay */}
        {trees.length > 0 && (
          <div style={{
            position: 'absolute', top: 12, left: 54, zIndex: 1000,
            background: dark ? 'rgba(28,33,40,0.95)' : 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)',
            borderRadius: 12,
            boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
            border: `1px solid ${dark ? '#30363d' : '#e5e7eb'}`,
            overflow: 'hidden',
            minWidth: 190
          }}>
            <button
              onClick={() => setLegendOpen(o => !o)}
              className="flex items-center justify-between px-3.5 py-2 text-xs font-semibold w-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              style={{ color: dark ? '#e6edf3' : '#1f2937' }}
            >
              <span>🌱 Filters & Legend</span>
              <span className="text-[10px] text-gray-400">{legendOpen ? '▲' : '▼'}</span>
            </button>

            {legendOpen && (
              <div className="p-3 pt-1 border-t border-gray-100 dark:border-gray-800 space-y-3 max-h-80 overflow-y-auto text-xs">

                {/* Flora filter */}
                <div>
                  <p className="text-[11px] font-semibold mb-1.5 text-gray-500 dark:text-gray-400">Flora Filter</p>
                  <div className="flex gap-1">
                    {[['all', 'All'], ['tree', '🌳 Trees'], ['plant', '🌿 Plants']].map(([v, l]) => (
                      <button
                        key={v}
                        onClick={() => setFloraFilter(v)}
                        className={`text-xs px-2.5 py-1 rounded-md font-medium transition-colors ${
                          floraFilter === v
                            ? 'bg-forest-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                      >{l}</button>
                    ))}
                  </div>
                </div>

                {/* Pin type guide — replaces the misleading area colour palette */}
                <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-2">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">Pin Guide</p>

                  {/* Tree pin preview */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                    <svg width="14" height="18" viewBox="0 0 34 58" fill="none">
                      <path d="M17 57C17 57 30 44 30 31C30 23 24.3 17 17 17C9.7 17 4 23 4 31C4 44 17 57 17 57Z" fill="#15803d"/>
                      <circle cx="17" cy="31" r="9" fill="white"/>
                      <polygon points="17,3 10,12 24,12" fill="#15803d"/>
                      <polygon points="17,8 5,17 29,17" fill="#15803d"/>
                    </svg>
                    <span><strong>Tree</strong> — layered pine canopy</span>
                  </div>

                  {/* Plant pin preview */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                    <svg width="14" height="18" viewBox="0 0 34 58" fill="none">
                      <path d="M17 57C17 57 30 44 30 31C30 23 24.3 17 17 17C9.7 17 4 23 4 31C4 44 17 57 17 57Z" fill="#16a34a"/>
                      <circle cx="17" cy="31" r="9" fill="white"/>
                      <circle cx="17" cy="10" r="8" fill="#16a34a"/>
                      <circle cx="9"  cy="17" r="7" fill="#16a34a"/>
                      <circle cx="25" cy="17" r="7" fill="#16a34a"/>
                    </svg>
                    <span><strong>Plant</strong> — round bush cluster</span>
                  </div>

                  {/* Cluster preview */}
                  <div className="flex items-center gap-2 text-[11px] text-gray-700 dark:text-gray-300">
                    <span className="inline-flex items-center justify-center w-[18px] h-[18px] rounded-full bg-forest-700 text-white font-bold" style={{ fontSize: 9 }}>5</span>
                    <span>Cluster — click to zoom in</span>
                  </div>

                  <p className="text-[10px] text-gray-400 dark:text-gray-500 pt-1">
                    Pin colour = species (same species = same colour across all areas)
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        <MapErrorBoundary>
          {trees.length > 0 && (
            <MapContainer
              center={DEFAULT_CENTER}
              zoom={DEFAULT_ZOOM}
              zoomSnap={0.5}
              zoomDelta={0.5}
              wheelPxPerZoomLevel={120}
              maxZoom={22}
              style={{ height: '100%', width: '100%' }}
            >
              <style>{`.map-cluster-label{background:transparent;border:0;box-shadow:none;color:white;font-weight:700;font-size:11px;padding:0}.map-cluster-label:before{display:none}`}</style>
              <FlyTo target={flyTarget} />

              <LayersControl position="topright">
                <LayersControl.BaseLayer name="Street">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap"
                    maxNativeZoom={19} maxZoom={22}
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer checked name="Satellite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="© Esri"
                    maxNativeZoom={19} maxZoom={22}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <ClusterMarkerLayer
                trees={filtered}
                matchedIds={matchedIds}
                flyTarget={flyTarget}
              />
            </MapContainer>
          )}
        </MapErrorBoundary>
      </div>
    </div>
  );
}
