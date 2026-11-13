import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import Supercluster from 'supercluster';
import L from 'leaflet';
import { Search, MapPin, Move, MousePointer2, Save, RotateCcw, X, Loader2, AlertCircle, History, Clock3, Download, Crosshair, AlertTriangle, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getTrees, updateTreeLocation, getTreeLocationHistory, getRecentLocationUpdates, undoTreeLocation, exportLocationHistory } from '../api';
import { getBotanicalMonogram, createStylizedPin } from '../utils/mapPins';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const DEFAULT_CENTER = [11.678, 78.125];
const DEFAULT_ZOOM = 18;
const canvasRenderer = L.canvas({ padding: 0.5 });

const valid = (v, min, max) => v !== '' && v != null && Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max;
const validTree = t => t && valid(t.latitude, -90, 90) && valid(t.longitude, -180, 180);
const pos = t => ({ lat: Number(t.latitude), lng: Number(t.longitude) });
const dateText = d => d ? new Date(d).toLocaleString() : 'Unknown date';
const distance = (a, b) => {
  const r = n => n * Math.PI / 180;
  const x = Math.sin(r(b.lat - a.lat) / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
};

const ClickPlacement = memo(function ClickPlacement({ enabled, onPlace }) {
  useMapEvents({
    click(e) {
      if (enabled) onPlace({ lat: e.latlng.lat, lng: e.latlng.lng });
    }
  });
  return null;
});

const MapResizeHandler = memo(function MapResizeHandler({ sidebarOpen }) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize({ pan: false }), 200);
    return () => window.clearTimeout(timer);
  }, [sidebarOpen, map]);
  return null;
});

// Cluster layer filtered to only current search matches
const ClusterLayer = memo(function ClusterLayer({ trees, selectedTreeId, onSelect }) {
  const map = useMap();
  const [view, setView] = useState(null);

  const index = useMemo(() => {
    const features = trees
      .filter(t => t.tree_id !== selectedTreeId && validTree(t))
      .map(t => ({
        type: 'Feature',
        properties: { cluster: false, tree: t },
        geometry: {
          type: 'Point',
          coordinates: [Number(t.longitude), Number(t.latitude)]
        }
      }));
    return new Supercluster({ radius: 50, maxZoom: 19, minZoom: 15, minPoints: 2 }).load(features);
  }, [trees, selectedTreeId]);

  const refresh = useCallback(() => {
    const b = map.getBounds().pad(0.12);
    setView({
      bbox: [b.getWest(), b.getSouth(), b.getEast(), b.getNorth()],
      zoom: Math.floor(map.getZoom())
    });
  }, [map]);

  useEffect(() => {
    refresh();
    map.on('moveend', refresh);
    map.on('zoomend', refresh);
    return () => {
      map.off('moveend', refresh);
      map.off('zoomend', refresh);
    };
  }, [map, refresh]);

  const features = useMemo(() => {
    if (!view) return [];
    return index.getClusters(view.bbox, view.zoom);
  }, [index, view]);

  const zoomCluster = useCallback(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    const expansionZoom = Math.min(index.getClusterExpansionZoom(feature.properties.cluster_id), 22);
    map.setView([lat, lng], expansionZoom, { animate: true });
  }, [index, map]);

  return features.map(feature => {
    const [lng, lat] = feature.geometry.coordinates;
    if (feature.properties.cluster) {
      const count = feature.properties.point_count;
      const radius = count >= 100 ? 19 : count >= 25 ? 16 : 13;
      return (
        <CircleMarker
          key={`cluster-${feature.properties.cluster_id}`}
          center={[lat, lng]}
          radius={radius}
          renderer={canvasRenderer}
          pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#15803d', fillOpacity: 0.96 }}
          eventHandlers={{ click: () => zoomCluster(feature) }}
        >
          <Tooltip direction="center" permanent className="tree-cluster-count">
            <span>{count}</span>
          </Tooltip>
        </CircleMarker>
      );
    }

    const tree = feature.properties.tree;
    const isPlant = (tree.flora_type || 'tree') === 'plant';
    const monogram = getBotanicalMonogram(tree.botanical_name, tree.common_name);

    return (
      <CircleMarker
        key={tree.tree_id}
        center={[lat, lng]}
        radius={7}
        renderer={canvasRenderer}
        pathOptions={{
          color: '#ffffff',
          weight: 2,
          fillColor: isPlant ? '#84cc16' : '#16a34a',
          fillOpacity: 0.96
        }}
        eventHandlers={{ click: () => onSelect(tree) }}
      >
        <Tooltip direction="top" offset={[0, -6]} opacity={0.9}>
          <span className="font-mono font-bold text-xs">{tree.tree_id}</span>
          {' '}<span className="text-xs">{tree.common_name}</span>
        </Tooltip>
        <Popup>
          <div className="text-xs">
            <strong>{tree.tree_id}</strong><br />
            {tree.common_name}<br />
            <span className="italic text-gray-500">{tree.botanical_name}</span><br />
            📍 {tree.area}
          </div>
        </Popup>
      </CircleMarker>
    );
  });
});

export default function LocationEditorPage() {
  const navigate = useNavigate();
  const role = localStorage.getItem('role');
  const [trees, setTrees] = useState([]);
  const [selectedTree, setSelectedTree] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [search, setSearch] = useState('');
  const [panel, setPanel] = useState('trees');
  const [mode, setMode] = useState('drag');
  const [newPosition, setNewPosition] = useState(null);
  const [latDraft, setLatDraft] = useState('');
  const [lngDraft, setLngDraft] = useState('');
  const [reason, setReason] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [treeListScrollTop, setTreeListScrollTop] = useState(0);
  const treeListRef = useRef(null);
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'street'

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => setSearch(searchText.trim().toLowerCase()), 150);
    return () => window.clearTimeout(handle);
  }, [searchText]);

  useEffect(() => {
    if (role !== 'admin') { setLoading(false); return; }
    getTrees().then(r => setTrees(Array.isArray(r.data) ? r.data : []))
      .catch(e => { console.error(e); setError('Unable to load tree locations.'); })
      .finally(() => setLoading(false));
  }, [role]);

  const loadRecent = useCallback(async () => {
    setRecentLoading(true);
    try { const r = await getRecentLocationUpdates(20); setRecent(r.data.updates || []); }
    catch (e) { console.error('Recent history load failed', e); }
    finally { setRecentLoading(false); }
  }, []);

  const loadHistory = useCallback(async id => {
    if (!id) { setHistory([]); return; }
    setHistoryLoading(true);
    try { const r = await getTreeLocationHistory(id, { limit: 50, offset: 0 }); setHistory(r.data.history || []); }
    catch (e) { setError(e.response?.data?.error || 'Unable to load location history.'); }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { if (role === 'admin') loadRecent(); }, [role, loadRecent]);

  // Synchronize map & tree list search
  const filtered = useMemo(() => {
    if (!search) return trees;
    return trees.filter(t =>
      [t.tree_id, t.common_name, t.botanical_name, t.area, t.family, t.tamil_name]
        .some(v => String(v || '').toLowerCase().includes(search))
    );
  }, [trees, search]);

  const located = useMemo(() => filtered.filter(validTree), [filtered]);

  const TREE_ROW_HEIGHT = 80;
  const TREE_OVERSCAN = 6;
  const treeListHeight = treeListRef.current?.clientHeight || 520;
  const firstTreeIndex = Math.max(0, Math.floor(treeListScrollTop / TREE_ROW_HEIGHT) - TREE_OVERSCAN);
  const lastTreeIndex = Math.min(filtered.length, Math.ceil((treeListScrollTop + treeListHeight) / TREE_ROW_HEIGHT) + TREE_OVERSCAN);
  const renderedTrees = filtered.slice(firstTreeIndex, lastTreeIndex);

  useEffect(() => {
    if (treeListRef.current) treeListRef.current.scrollTop = 0;
    setTreeListScrollTop(0);
  }, [search]);

  const applyPosition = useCallback(p => {
    setNewPosition(p);
    setLatDraft(p.lat.toFixed(8));
    setLngDraft(p.lng.toFixed(8));
    setError('');
    setMessage('');
  }, []);

  const original = useMemo(() => validTree(selectedTree) ? pos(selectedTree) : null, [selectedTree]);
  const shown = newPosition || original;
  const changed = Boolean(newPosition && original && (Math.abs(newPosition.lat - original.lat) > 1e-8 || Math.abs(newPosition.lng - original.lng) > 1e-8));
  const moved = changed && original && newPosition ? distance(original, newPosition) : 0;

  const mayDiscard = useCallback(() => !changed || window.confirm('Discard the unsaved location correction?'), [changed]);

  // Select tree WITHOUT jerking/re-centering map
  const selectTree = useCallback(tree => {
    if (selectedTree?.tree_id === tree.tree_id || !mayDiscard()) return;
    setSelectedTree(tree);
    setNewPosition(null);
    setLatDraft(validTree(tree) ? Number(tree.latitude).toFixed(8) : '');
    setLngDraft(validTree(tree) ? Number(tree.longitude).toFixed(8) : '');
    setReason('');
    setError('');
    setMessage('');
    loadHistory(tree.tree_id);
  }, [selectedTree, mayDiscard, loadHistory]);

  const cancelSelection = () => {
    if (!mayDiscard()) return;
    setSelectedTree(null);
    setNewPosition(null);
    setLatDraft('');
    setLngDraft('');
    setReason('');
    setHistory([]);
    setError('');
    setMessage('');
  };

  const discard = () => {
    setNewPosition(null);
    setLatDraft(original ? original.lat.toFixed(8) : '');
    setLngDraft(original ? original.lng.toFixed(8) : '');
    setError('');
    setMessage('Changes discarded.');
  };

  const applyManual = () => {
    const lat = Number(latDraft);
    const lng = Number(lngDraft);
    if (!valid(lat, -90, 90) || !valid(lng, -180, 180)) {
      setError('Coordinates must be between -90..90 and -180..180.');
      return;
    }
    applyPosition({ lat, lng });
  };

  const save = async () => {
    if (!selectedTree || !newPosition || !changed) return;
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const res = await updateTreeLocation(selectedTree.tree_id, {
        latitude: newPosition.lat,
        longitude: newPosition.lng,
        reason: reason.trim() || undefined
      });
      const updated = res.data?.tree || { ...selectedTree, latitude: newPosition.lat, longitude: newPosition.lng };
      setTrees(prev => prev.map(t => t.tree_id === updated.tree_id ? { ...t, ...updated } : t));
      setSelectedTree(updated);
      setNewPosition(null);
      setReason('');
      setMessage('✅ Location saved successfully.');
      loadRecent();
      loadHistory(updated.tree_id);
    } catch (e) {
      setError(e.response?.data?.error || 'Failed to save location.');
    } finally {
      setSaving(false);
    }
  };

  const undo = async () => {
    if (!selectedTree) return;
    setUndoing(true);
    setError('');
    setMessage('');
    try {
      const res = await undoTreeLocation(selectedTree.tree_id);
      const restored = res.data?.tree;
      if (restored) {
        setTrees(prev => prev.map(t => t.tree_id === restored.tree_id ? { ...t, ...restored } : t));
        setSelectedTree(restored);
        setNewPosition(null);
        setLatDraft(Number(restored.latitude).toFixed(8));
        setLngDraft(Number(restored.longitude).toFixed(8));
        setMessage('↩️ Location undone to previous revision.');
        loadRecent();
        loadHistory(restored.tree_id);
      }
    } catch (e) {
      setError(e.response?.data?.error || 'Could not undo.');
    } finally {
      setUndoing(false);
    }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r = await exportLocationHistory();
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv;charset=utf-8' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'greenatlas-location-history.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.response?.data?.error || 'Could not export history.');
    } finally {
      setExporting(false);
    }
  };

  const chooseRecent = item => {
    const tree = trees.find(t => t.tree_id === item.tree_id);
    if (tree) selectTree(tree);
  };

  if (role !== 'admin') {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6">
        <AlertCircle size={44} className="text-red-500" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <button onClick={() => navigate('/login')} className="btn-primary px-5 py-2">
          Login as Administrator
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-[70vh] flex items-center justify-center gap-3 text-sm text-gray-500">
        <Loader2 className="animate-spin" /> Loading tree coordinates...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 overflow-hidden">
      <style>{`.tree-cluster-count{background:transparent;border:0;box-shadow:none;color:white;font-weight:700;font-size:11px;padding:0}.tree-cluster-count:before{display:none}`}</style>

      {/* 1. Merged Single Top Header */}
      <header className="shrink-0 px-4 py-2.5 border-b bg-white dark:bg-gray-900 dark:border-gray-800 flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="px-2.5 py-1.5 rounded-lg border text-xs font-semibold dark:border-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            ← Back to Admin
          </button>
          <span className="font-bold text-sm text-gray-900 dark:text-white hidden sm:inline">
            Tree Location Management
          </span>
          <span className="text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-800 font-medium">
            {located.length} Located
          </span>
        </div>

        {/* Integrated Edit Actions in Top Bar */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {selectedTree && (
            <>
              <button
                onClick={() => setMode('drag')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  mode === 'drag'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                }`}
              >
                <Move size={14} /> Drag Marker
              </button>
              <button
                onClick={() => setMode('place')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors ${
                  mode === 'place'
                    ? 'bg-green-700 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200'
                }`}
              >
                <MousePointer2 size={14} /> Place Marker
              </button>
              {changed && (
                <button
                  onClick={discard}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-100 text-orange-800 font-medium"
                >
                  <RotateCcw size={13} /> Discard
                </button>
              )}
              <button
                onClick={undo}
                disabled={undoing || saving}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-100 text-amber-800 font-medium disabled:opacity-50"
              >
                {undoing ? <Loader2 size={13} className="animate-spin" /> : <History size={13} />} Undo
              </button>
              <button
                onClick={cancelSelection}
                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-gray-500 hover:text-gray-700"
              >
                <X size={14} /> Deselect
              </button>
              <button
                onClick={save}
                disabled={!changed || saving}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-green-700 hover:bg-green-800 text-white font-semibold disabled:opacity-40"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} Save Location
              </button>
            </>
          )}

          <button
            onClick={exportCsv}
            disabled={exporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50"
          >
            {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />} Export History
          </button>
        </div>
      </header>

      {/* Status Messages */}
      {(error || message) && (
        <div className={`px-4 py-1.5 text-xs font-semibold ${error ? 'bg-red-100 text-red-800' : 'bg-blue-50 text-blue-800'}`}>
          {error || message}
        </div>
      )}

      {/* 2. Main Canvas: Slim Sidebar + Maximized Map */}
      <div className="flex flex-1 min-h-0 flex-col md:flex-row relative overflow-hidden">
        {/* Streamlined Left Sidebar (w-64 instead of w-96) */}
        <aside
          className={`relative shrink-0 bg-white dark:bg-gray-900 border-r dark:border-gray-800 flex flex-col min-h-0 transition-[width] duration-200 ease-out z-10 ${
            sidebarOpen ? 'w-full md:w-64 lg:w-72' : 'w-full h-10 md:w-12 md:h-auto'
          }`}
        >
          {sidebarOpen ? (
            <>
              <div className="flex items-center border-b dark:border-gray-800">
                <div className="grid grid-cols-3 flex-1 text-xs">
                  {[['trees', 'Trees', Search], ['recent', 'Recent', Clock3], ['history', 'History', History]].map(([key, label, Icon]) => (
                    <button
                      key={key}
                      onClick={() => setPanel(key)}
                      className={`flex items-center justify-center gap-1 py-2 font-semibold ${
                        panel === key
                          ? 'text-green-700 border-b-2 border-green-600 bg-green-50 dark:bg-green-950/40'
                          : 'text-gray-500'
                      }`}
                    >
                      <Icon size={13} /> {label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Collapse sidebar"
                  className="h-8 w-8 mx-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-500"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              {panel === 'trees' && (
                <>
                  <div className="p-2.5 border-b dark:border-gray-800">
                    <div className="relative">
                      <Search size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                      <input
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        placeholder="Search ID, species, area..."
                        className="w-full pl-8 pr-2.5 py-1.5 border rounded-lg text-xs outline-none focus:ring-1 focus:ring-green-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">
                      {filtered.length} matching trees shown on map
                    </p>
                  </div>

                  <div
                    ref={treeListRef}
                    className="flex-1 min-h-0 overflow-y-auto relative"
                    onScroll={e => setTreeListScrollTop(e.currentTarget.scrollTop)}
                  >
                    <div style={{ height: filtered.length * TREE_ROW_HEIGHT, position: 'relative' }}>
                      {renderedTrees.map((t, offset) => {
                        const index = firstTreeIndex + offset;
                        const ok = validTree(t);
                        const active = selectedTree?.tree_id === t.tree_id;

                        return (
                          <button
                            key={t.tree_id}
                            onClick={() => selectTree(t)}
                            style={{
                              position: 'absolute',
                              top: index * TREE_ROW_HEIGHT,
                              left: 0,
                              right: 0,
                              height: TREE_ROW_HEIGHT
                            }}
                            className={`w-full text-left px-3 py-2 border-b dark:border-gray-800/80 transition-colors ${
                              active
                                ? 'bg-green-50 border-l-4 border-l-green-600 dark:bg-green-950/60'
                                : 'hover:bg-gray-50 dark:hover:bg-gray-800/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1.5">
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-gray-900 dark:text-white font-mono">
                                  {t.tree_id}
                                </p>
                                <p className="text-xs text-gray-700 dark:text-gray-300 truncate">
                                  {t.common_name || 'Unknown'}
                                </p>
                                <p className="text-[10px] text-gray-400 truncate">{t.area || '—'}</p>
                              </div>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 font-medium ${ok ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                {ok ? 'Located' : 'Missing'}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {!filtered.length && <p className="text-center text-xs text-gray-400 py-8">No trees found.</p>}
                  </div>
                </>
              )}

              {panel === 'recent' && (
                <div className="flex-1 overflow-y-auto p-2.5 text-xs">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Latest 20 Updates</span>
                    <button onClick={loadRecent} className="text-gray-400 hover:text-gray-600">
                      <RefreshCw size={13} />
                    </button>
                  </div>
                  {recentLoading ? (
                    <Loader2 className="animate-spin m-4" />
                  ) : recent.length === 0 ? (
                    <p className="text-gray-400 text-center py-6">No updates logged.</p>
                  ) : (
                    recent.map(item => (
                      <button
                        key={item.id}
                        onClick={() => chooseRecent(item)}
                        className="w-full text-left p-2 mb-1.5 rounded-lg border dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex justify-between">
                          <strong className="font-mono text-gray-900 dark:text-white">{item.tree_id}</strong>
                          <span className={`text-[10px] px-1.5 rounded-full ${item.action === 'UNDO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                            {item.action}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 truncate">{item.common_name} · {dateText(item.created_at)}</p>
                      </button>
                    ))
                  )}
                </div>
              )}

              {panel === 'history' && (
                <div className="flex-1 overflow-y-auto p-2.5 text-xs">
                  <p className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {selectedTree ? `Audit: ${selectedTree.tree_id}` : 'Select a tree to view history'}
                  </p>
                  {historyLoading ? (
                    <Loader2 className="animate-spin m-4" />
                  ) : history.length === 0 ? (
                    <p className="text-gray-400 text-center py-6">No previous corrections.</p>
                  ) : (
                    history.map(h => (
                      <div key={h.id} className="p-2 mb-2 rounded-lg border dark:border-gray-800 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-[10px] font-semibold text-green-700">{h.action}</span>
                          <span className="text-[10px] text-gray-400">{dateText(h.created_at)}</span>
                        </div>
                        <p className="font-mono text-[10px] text-gray-500">
                          {Number(h.new_latitude).toFixed(7)}, {Number(h.new_longitude).toFixed(7)}
                        </p>
                        {h.reason && <p className="text-[10px] text-gray-400 italic">"{h.reason}"</p>}
                      </div>
                    ))
                  )}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Expand sidebar"
              className="w-full h-10 md:h-full flex md:flex-col items-center justify-center gap-1 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800"
            >
              <PanelLeftOpen size={17} />
              <span className="text-[10px] md:[writing-mode:vertical-rl] md:rotate-180">Trees</span>
            </button>
          )}
        </aside>

        {/* Maximized Map Canvas — isolation:isolate keeps Leaflet z-indexes contained */}
        <main className="flex-1 min-w-0 h-full relative" style={{ isolation: 'isolate' }}>

          {/* Mini pin-type legend (bottom-left of map) */}
          <div style={{
            position: 'absolute', bottom: 54, left: 10, zIndex: 1000,
            background: 'rgba(255,255,255,0.93)', borderRadius: 8,
            padding: '5px 10px', fontSize: 11, fontWeight: 600,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            border: '1px solid #e5e7eb', pointerEvents: 'none',
            display: 'flex', gap: 12, alignItems: 'center'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 11, height: 11, borderRadius: 2, background: '#16a34a', display: 'inline-block' }}/>
              🌳 Trees
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 11, height: 11, borderRadius: 2, background: '#84cc16', display: 'inline-block' }}/>
              🌿 Plants
            </span>
          </div>

          {/* Custom layer toggle — replaces LayersControl to avoid event-capture bug with draggable markers */}
          <div style={{
            position: 'absolute', top: 10, right: 10, zIndex: 1000,
            display: 'flex', borderRadius: 8, overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            border: '1px solid #d1d5db', fontSize: 12, fontWeight: 600
          }}>
            <button
              onClick={() => setMapLayer('satellite')}
              style={{
                padding: '6px 12px', cursor: 'pointer', border: 'none',
                background: mapLayer === 'satellite' ? '#15803d' : '#ffffff',
                color: mapLayer === 'satellite' ? '#ffffff' : '#374151',
                transition: 'all 0.15s'
              }}
            >🛰️ Satellite</button>
            <button
              onClick={() => setMapLayer('street')}
              style={{
                padding: '6px 12px', cursor: 'pointer', border: 'none',
                borderLeft: '1px solid #d1d5db',
                background: mapLayer === 'street' ? '#15803d' : '#ffffff',
                color: mapLayer === 'street' ? '#ffffff' : '#374151',
                transition: 'all 0.15s'
              }}
            >🗺️ Street</button>
          </div>

          <MapContainer
            center={DEFAULT_CENTER}
            zoom={DEFAULT_ZOOM}
            minZoom={16}
            maxZoom={22}
            zoomSnap={0.5}
            zoomDelta={0.5}
            wheelPxPerZoomLevel={120}
            className="h-full w-full"
            style={{ height: '100%', width: '100%' }}
          >
            {mapLayer === 'satellite'
              ? <TileLayer
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  attribution="Tiles © Esri"
                  maxNativeZoom={19} maxZoom={22}
                />
              : <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="© OpenStreetMap"
                  maxNativeZoom={19} maxZoom={22}
                />
            }

            <MapResizeHandler sidebarOpen={sidebarOpen} />
            <ClickPlacement enabled={Boolean(selectedTree && mode === 'place')} onPlace={applyPosition} />

            {/* Clusters synchronize with current search */}
            <ClusterLayer
              trees={located}
              selectedTreeId={selectedTree?.tree_id}
              onSelect={selectTree}
            />

            {/* Selected Active Marker */}
            {selectedTree && shown && (
              <Marker
                position={[shown.lat, shown.lng]}
                draggable={mode === 'drag'}
                icon={createStylizedPin({
                  color: '#dc2626',
                  label: getBotanicalMonogram(selectedTree.botanical_name, selectedTree.common_name),
                  isPlant: (selectedTree.flora_type || 'tree') === 'plant',
                  isSelected: true
                })}
                eventHandlers={{
                  dragend: e => {
                    const p = e.target.getLatLng();
                    applyPosition({ lat: p.lat, lng: p.lng });
                  }
                }}
              >
                <Popup>
                  <div className="text-xs">
                    <strong className="font-mono text-red-600">{selectedTree.tree_id}</strong><br />
                    {selectedTree.common_name}<br />
                    <span className="text-[10px] text-gray-500">Drag or place marker to reposition</span>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>

          {/* 3. Minimized Floating Bottom Ribbon (Only When Tree Selected) */}
          {selectedTree && (
            <div className="absolute bottom-3 left-4 right-4 md:left-auto md:right-4 md:max-w-xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl shadow-xl border border-gray-200 dark:border-gray-800 z-[1000] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="min-w-0">
                <span className="font-mono font-bold text-forest-700 dark:text-forest-400">
                  {selectedTree.tree_id}
                </span>: <span className="font-semibold text-gray-800 dark:text-gray-200">{selectedTree.common_name}</span>
                <div className="text-[11px] text-gray-400 font-mono mt-0.5 flex gap-3">
                  <span>GPS: {shown ? `${Number(shown.lat).toFixed(7)}, ${Number(shown.lng).toFixed(7)}` : 'Not set'}</span>
                  {changed && moved > 0 && <span className="text-amber-600 font-semibold">Moved: {moved.toFixed(1)}m</span>}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <input
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Reason (optional)..."
                  className="input text-xs py-1 px-2 w-36 dark:bg-gray-800 dark:border-gray-700"
                />
                
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
