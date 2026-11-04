import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, CircleMarker, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import Supercluster from 'supercluster';
import L from 'leaflet';
import { Search, MapPin, Move, MousePointer2, Save, RotateCcw, X, Loader2, AlertCircle, History, Clock3, Download, Crosshair, AlertTriangle, RefreshCw, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { getTrees, updateTreeLocation, getTreeLocationHistory, getRecentLocationUpdates, undoTreeLocation, exportLocationHistory } from '../api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
});

const DEFAULT_CENTER = [11.678, 78.125];
const DEFAULT_ZOOM = 18;
const canvasRenderer = L.canvas({ padding: 0.5 });
const selectedIcon = L.divIcon({
  className: '',
  html: '<div style="width:38px;height:38px;background:#dc2626;border:4px solid white;border-radius:50%;box-shadow:0 0 0 5px #dc262640,0 3px 8px #0006;display:flex;align-items:center;justify-content:center;color:white;font-size:19px">📍</div>',
  iconSize: [38, 38], iconAnchor: [19, 19]
});
const valid = (v, min, max) => v !== '' && v != null && Number.isFinite(Number(v)) && Number(v) >= min && Number(v) <= max;
const validTree = t => t && valid(t.latitude, -90, 90) && valid(t.longitude, -180, 180);
const pos = t => ({ lat: Number(t.latitude), lng: Number(t.longitude) });
const dateText = d => d ? new Date(d).toLocaleString() : 'Unknown date';
const distance = (a, b) => {
  const r = n => n * Math.PI / 180;
  const x = Math.sin(r(b.lat-a.lat)/2)**2 + Math.cos(r(a.lat))*Math.cos(r(b.lat))*Math.sin(r(b.lng-a.lng)/2)**2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1-x));
};

const PanToSelection = memo(function PanToSelection({ treeId, position }) {
  const map = useMap();
  const previous = useRef(null);
  useEffect(() => {
    if (!treeId || !position || previous.current === treeId) return;
    previous.current = treeId;
    map.panTo([position.lat, position.lng], { animate: false });
  }, [treeId, position, map]);
  return null;
});

const ClickPlacement = memo(function ClickPlacement({ enabled, onPlace }) {
  useMapEvents({ click(e) { if (enabled) onPlace({ lat: e.latlng.lat, lng: e.latlng.lng }); } });
  return null;
});

const MapResizeHandler = memo(function MapResizeHandler({ sidebarOpen }) {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize({ pan: false }), 280);
    return () => window.clearTimeout(timer);
  }, [sidebarOpen, map]);
  return null;
});

// Supercluster queries only the current map bounds. It does not create a React
// Marker for every tree in the database.
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
    return new Supercluster({ radius: 55, maxZoom: 19, minZoom: 15, minPoints: 2 }).load(features);
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
    return (
      <CircleMarker
        key={tree.tree_id}
        center={[lat, lng]}
        radius={6}
        renderer={canvasRenderer}
        pathOptions={{ color: '#ffffff', weight: 2, fillColor: '#16a34a', fillOpacity: 0.96 }}
        eventHandlers={{ click: () => onSelect(tree) }}
      >
        <Popup>
          <strong>{tree.tree_id}</strong><br />
          {tree.common_name}<br />
          {tree.botanical_name}<br />
          {tree.area}
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
  const [history, setHistory] = useState([]);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [undoing, setUndoing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const original = validTree(selectedTree) ? pos(selectedTree) : null;
  const shown = newPosition || original;
  const changed = Boolean(selectedTree && newPosition && (!original ||
    Math.abs(newPosition.lat-original.lat)>1e-10 || Math.abs(newPosition.lng-original.lng)>1e-10));
  const moved = original && newPosition ? distance(original, newPosition) : null;

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchText.trim().toLowerCase()), 180);
    return () => clearTimeout(t);
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
    try { const r = await getTreeLocationHistory(id, { limit:50, offset:0 }); setHistory(r.data.history || []); }
    catch (e) { setError(e.response?.data?.error || 'Unable to load location history.'); }
    finally { setHistoryLoading(false); }
  }, []);

  useEffect(() => { if (role === 'admin') loadRecent(); }, [role, loadRecent]);

  const filtered = useMemo(() => !search ? trees : trees.filter(t =>
    [t.tree_id,t.common_name,t.botanical_name,t.area,t.family,t.tamil_name]
      .some(v => String(v || '').toLowerCase().includes(search))), [trees, search]);
  const located = useMemo(() => trees.filter(validTree), [trees]);
  const TREE_ROW_HEIGHT = 92;
  const TREE_OVERSCAN = 8;
  const treeListHeight = treeListRef.current?.clientHeight || 520;
  const firstTreeIndex = Math.max(0, Math.floor(treeListScrollTop / TREE_ROW_HEIGHT) - TREE_OVERSCAN);
  const lastTreeIndex = Math.min(filtered.length, Math.ceil((treeListScrollTop + treeListHeight) / TREE_ROW_HEIGHT) + TREE_OVERSCAN);
  const renderedTrees = filtered.slice(firstTreeIndex, lastTreeIndex);
  useEffect(() => {
    if (treeListRef.current) treeListRef.current.scrollTop = 0;
    setTreeListScrollTop(0);
  }, [search]);

  const applyPosition = useCallback(p => {
    setNewPosition(p); setLatDraft(p.lat.toFixed(8)); setLngDraft(p.lng.toFixed(8));
    setError(''); setMessage('');
  }, []);

  const mayDiscard = useCallback(() => !changed || window.confirm('Discard the unsaved location correction?'), [changed]);

  const selectTree = useCallback(tree => {
    if (selectedTree?.tree_id === tree.tree_id || !mayDiscard()) return;
    setSelectedTree(tree); setNewPosition(null);
    setLatDraft(validTree(tree) ? Number(tree.latitude).toFixed(8) : '');
    setLngDraft(validTree(tree) ? Number(tree.longitude).toFixed(8) : '');
    setReason(''); setError(''); setMessage(''); setPanel('trees');
    loadHistory(tree.tree_id);
  }, [selectedTree, mayDiscard, loadHistory]);

  const cancelSelection = () => {
    if (!mayDiscard()) return;
    setSelectedTree(null); setNewPosition(null); setLatDraft(''); setLngDraft('');
    setReason(''); setHistory([]); setError(''); setMessage('');
  };

  const discard = () => {
    setNewPosition(null);
    setLatDraft(original ? original.lat.toFixed(8) : '');
    setLngDraft(original ? original.lng.toFixed(8) : '');
    setReason(''); setError(''); setMessage('Unsaved correction discarded.');
  };

  const applyManual = () => {
    const lat=Number(latDraft), lng=Number(lngDraft);
    if (!latDraft.trim() || !lngDraft.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError('Enter valid latitude (-90 to 90) and longitude (-180 to 180).'); return;
    }
    applyPosition({ lat, lng }); setMessage('Coordinates applied. Save to commit this correction.');
  };

  const save = async () => {
    if (!selectedTree || !newPosition || saving) return;
    setSaving(true); setError(''); setMessage('');
    try {
      const r = await updateTreeLocation(selectedTree.tree_id, { latitude:newPosition.lat, longitude:newPosition.lng, reason:reason.trim() });
      const updated = r.data.tree || { ...selectedTree, latitude:newPosition.lat, longitude:newPosition.lng };
      setTrees(prev => prev.map(t => t.tree_id===selectedTree.tree_id ? { ...t, ...updated } : t));
      setSelectedTree(prev => ({ ...prev, ...updated }));
      setNewPosition(null); setLatDraft(Number(updated.latitude).toFixed(8)); setLngDraft(Number(updated.longitude).toFixed(8));
      setReason(''); setMessage(`Location updated successfully for ${selectedTree.tree_id}.`);
      await Promise.all([loadHistory(selectedTree.tree_id), loadRecent()]);
    } catch (e) {
      console.error('Location update failed', e.response?.status, e.response?.data || e.message);
      setError(e.response?.data?.error || `Update failed (${e.response?.status || 'Network error'}).`);
    } finally { setSaving(false); }
  };

  const undo = async () => {
    if (!selectedTree || undoing || !window.confirm(`Undo the latest saved location correction for ${selectedTree.tree_id}?`)) return;
    setUndoing(true); setError(''); setMessage('');
    try {
      const r = await undoTreeLocation(selectedTree.tree_id);
      const restored = r.data.tree;
      setTrees(prev => prev.map(t => t.tree_id===selectedTree.tree_id ? { ...t, ...restored } : t));
      setSelectedTree(prev => ({ ...prev, ...restored }));
      setNewPosition(null); setLatDraft(Number(restored.latitude).toFixed(8)); setLngDraft(Number(restored.longitude).toFixed(8));
      setReason(''); setMessage('Previous saved location restored. The undo was recorded in history.');
      await Promise.all([loadHistory(selectedTree.tree_id), loadRecent()]);
    } catch (e) { setError(e.response?.data?.error || 'Unable to undo the latest correction.'); }
    finally { setUndoing(false); }
  };

  const exportCsv = async () => {
    setExporting(true);
    try {
      const r=await exportLocationHistory();
      const url=URL.createObjectURL(new Blob([r.data], { type:'text/csv;charset=utf-8' }));
      const a=document.createElement('a'); a.href=url; a.download='greenatlas-location-history.csv';
      document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    } catch (e) { setError(e.response?.data?.error || 'Could not export history.'); }
    finally { setExporting(false); }
  };

  const chooseRecent = item => {
    const tree=trees.find(t => t.tree_id===item.tree_id);
    if (tree) selectTree(tree);
  };

  useEffect(() => {
    if (!changed) return;
    const warn=e => { e.preventDefault(); e.returnValue=''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [changed]);

  if (role !== 'admin') return <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 p-6"><AlertCircle size={44} className="text-red-500"/><h2 className="text-xl font-bold">Access Denied</h2><p className="text-gray-500 text-sm">Only administrators can edit tree locations.</p><button onClick={()=>navigate('/login')} className="btn-primary px-5 py-2">Login as Administrator</button></div>;
  if (loading) return <div className="h-[70vh] flex items-center justify-center gap-3"><Loader2 className="animate-spin"/>Loading tree locations...</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <style>{`.tree-cluster-count{background:transparent;border:0;box-shadow:none;color:white;font-weight:700;font-size:11px;padding:0}.tree-cluster-count:before{display:none}`}</style>
      <header className="shrink-0 px-4 py-3 border-b bg-white dark:bg-gray-900 dark:border-gray-700">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h1 className="text-xl font-bold text-gray-900 dark:text-white">Tree Location Management</h1><p className="text-xs text-gray-500 mt-1">GreenAtlas / Admin / Location Management</p></div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-800">{located.length} Located</span>
            <span className="px-3 py-1.5 rounded-full bg-orange-100 text-orange-800">{trees.length-located.length} Missing coordinates</span>
            <button onClick={exportCsv} disabled={exporting} className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm dark:border-gray-600 dark:text-white disabled:opacity-50">{exporting?<Loader2 size={15} className="animate-spin"/>:<Download size={15}/>}Export history</button>
            <button onClick={()=>navigate('/admin')} className="px-3 py-2 rounded-lg border text-sm dark:border-gray-600 dark:text-white">Back to Admin</button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 flex-col md:flex-row">
        <aside
          className={`relative shrink-0 bg-white dark:bg-gray-900 border-r dark:border-gray-700 flex flex-col min-h-0 transition-[width] duration-200 ease-out ${
            sidebarOpen ? 'w-full md:w-80 lg:w-96' : 'w-full h-11 md:w-12 md:h-auto'
          }`}
        >
          {sidebarOpen ? (
            <>
              <div className="flex items-center border-b dark:border-gray-700">
                <div className="grid grid-cols-3 flex-1">
                  {[['trees','Trees',Search],['recent','Recent',Clock3],['history','History',History]].map(([key,label,Icon])=>(
                    <button key={key} onClick={()=>setPanel(key)} className={`flex items-center justify-center gap-1 px-2 py-3 text-xs font-semibold ${panel===key?'text-green-700 border-b-2 border-green-600 bg-green-50 dark:bg-green-950':'text-gray-500'}`}>
                      <Icon size={14}/>{label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  title="Collapse sidebar"
                  aria-label="Collapse sidebar"
                  className="h-10 w-10 shrink-0 mx-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300"
                >
                  <PanelLeftClose size={18}/>
                </button>
              </div>
              {panel==='trees' && <>
                <div className="p-4 border-b dark:border-gray-700">
                  <h2 className="font-semibold text-sm mb-3 dark:text-white">Select a Tree</h2>
                  <div className="relative">
                    <Search size={17} className="absolute left-3 top-3 text-gray-400"/>
                    <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Search ID, name or area..." className="w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-800 dark:text-white dark:border-gray-700"/>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">{filtered.length} matching trees · {located.length} located</p>
                </div>
                <div
                  ref={treeListRef}
                  className="flex-1 min-h-0 overflow-y-auto relative"
                  onScroll={e=>setTreeListScrollTop(e.currentTarget.scrollTop)}
                >
                  <div style={{ height: filtered.length * TREE_ROW_HEIGHT, position: 'relative' }}>
                    {renderedTrees.map((t, offset) => {
                      const index = firstTreeIndex + offset;
                      const ok=validTree(t), active=selectedTree?.tree_id===t.tree_id;
                      return (
                        <button
                          key={t.tree_id}
                          onClick={()=>selectTree(t)}
                          style={{ position:'absolute', top:index*TREE_ROW_HEIGHT, left:0, right:0, height:TREE_ROW_HEIGHT }}
                          className={`w-full text-left px-4 py-3 border-b dark:border-gray-800 ${active?'bg-green-50 border-l-4 border-l-green-600 dark:bg-green-950':'hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="font-semibold text-sm text-gray-900 dark:text-white">{t.tree_id}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{t.common_name||'Unknown tree'}</p>
                              <p className="text-xs text-gray-400 truncate">{t.area||'Area not specified'}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${ok?'bg-green-100 text-green-700':'bg-orange-100 text-orange-700'}`}>{ok?'Located':'Missing'}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {!filtered.length&&<p className="text-center text-sm text-gray-400 py-10">No trees found.</p>}
                </div>
              </>}
              {panel==='recent' && <div className="flex-1 overflow-y-auto p-3"><div className="flex justify-between items-center mb-3"><p className="text-sm font-semibold dark:text-white">Latest 20 location events</p><button onClick={loadRecent} title="Refresh" className="text-gray-500"><RefreshCw size={15}/></button></div>{recentLoading?<Loader2 className="animate-spin m-5"/>:recent.length===0?<p className="text-sm text-gray-400 text-center py-8">No saved corrections yet.</p>:recent.map(item=><button key={item.id} onClick={()=>chooseRecent(item)} className="w-full text-left p-3 mb-2 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"><div className="flex justify-between gap-2"><strong className="text-sm dark:text-white">{item.tree_id}</strong><span className={`text-[10px] px-2 py-1 rounded-full ${item.action==='UNDO'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'}`}>{item.action}</span></div><p className="text-xs text-gray-500 mt-1">{item.common_name||'Tree'} · {dateText(item.created_at)}</p><p className="text-[11px] text-gray-400 mt-1 font-mono">{Number(item.new_latitude).toFixed(6)}, {Number(item.new_longitude).toFixed(6)}</p></button>)}</div>}
              {panel==='history' && <div className="flex-1 overflow-y-auto p-3"><p className="text-sm font-semibold dark:text-white mb-3">{selectedTree?`History · ${selectedTree.tree_id}`:'Select a tree to view its history'}</p>{historyLoading?<Loader2 className="animate-spin m-5"/>:history.length===0?<p className="text-sm text-gray-400 text-center py-8">No location history available.</p>:history.map(h=><div key={h.id} className="p-3 mb-2 rounded-lg border dark:border-gray-700"><div className="flex justify-between gap-2"><span className={`text-[10px] font-semibold px-2 py-1 rounded-full ${h.action==='UNDO'?'bg-orange-100 text-orange-700':'bg-green-100 text-green-700'}`}>{h.action}</span><span className="text-[10px] text-gray-400">{dateText(h.created_at)}</span></div><p className="text-xs text-gray-500 mt-2">From</p><p className="font-mono text-xs dark:text-gray-200">{h.old_latitude==null?'Not set':`${Number(h.old_latitude).toFixed(6)}, ${Number(h.old_longitude).toFixed(6)}`}</p><p className="text-xs text-gray-500 mt-2">To</p><p className="font-mono text-xs dark:text-gray-200">{Number(h.new_latitude).toFixed(6)}, {Number(h.new_longitude).toFixed(6)}</p><p className="text-[11px] text-gray-400 mt-2">By: {h.changed_by||'Unknown admin'}</p>{h.reason&&<p className="text-xs text-gray-500 mt-1">Reason: {h.reason}</p>}{h.action==='UPDATE'&&h.reversed_by_id&&<p className="text-[11px] text-orange-600 mt-1">This correction was undone.</p>}</div>)}</div>}
            </>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              title="Expand sidebar"
              aria-label="Expand sidebar"
              className="w-full h-11 md:h-full md:min-h-0 flex md:flex-col items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:bg-green-50 dark:hover:bg-gray-800"
            >
              <PanelLeftOpen size={19}/>
              <span className="text-[10px] md:[writing-mode:vertical-rl] md:rotate-180">Trees &amp; History</span>
            </button>
          )}
        </aside>

        <main className="flex-1 min-w-0 min-h-[400px] flex flex-col relative">
          <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
            <div className="flex gap-2"><button onClick={()=>setMode('drag')} disabled={!selectedTree} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${mode==='drag'?'bg-green-700 text-white':'bg-gray-100 dark:bg-gray-800 dark:text-white'} disabled:opacity-40`}><Move size={16}/>Drag Marker</button><button onClick={()=>setMode('place')} disabled={!selectedTree} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${mode==='place'?'bg-green-700 text-white':'bg-gray-100 dark:bg-gray-800 dark:text-white'} disabled:opacity-40`}><MousePointer2 size={16}/>Place Marker</button></div>
            <div className="flex flex-wrap gap-2">{changed&&<button onClick={discard} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-100 text-orange-800 text-sm"><RotateCcw size={15}/>Discard</button>}{selectedTree&&<button onClick={undo} disabled={undoing||saving} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm disabled:opacity-50">{undoing?<Loader2 size={15} className="animate-spin"/>:<History size={15}/>}Undo last saved</button>}{selectedTree&&<button onClick={cancelSelection} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 dark:text-white text-sm"><X size={15}/>Deselect</button>}<button onClick={save} disabled={!changed||saving} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-700 hover:bg-green-800 text-white text-sm font-semibold disabled:opacity-40">{saving?<Loader2 size={16} className="animate-spin"/>:<Save size={16}/>} {saving?'Saving...':'Save Location'}</button></div>
          </div>
          {selectedTree&&<div className="shrink-0 px-4 py-2 bg-green-50 dark:bg-green-950 text-green-800 dark:text-green-200 text-xs">{mode==='drag'?'Drag the selected marker to the correct tree position.':'Click the correct position on the satellite map.'} Zoom remains unchanged while selecting, dragging, placing and saving.</div>}
          {(error||message)&&<div className={`shrink-0 px-4 py-2 text-sm ${error?'bg-red-100 text-red-800':'bg-blue-50 text-blue-800'}`}>{error||message}</div>}
          <div className="flex-1 min-h-0 relative">
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} minZoom={16} maxZoom={22} zoomSnap={0.25} className="h-full w-full" style={{height:'100%',width:'100%'}}>
              <LayersControl position="topright"><LayersControl.BaseLayer checked name="Satellite"><TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" attribution="Tiles © Esri" maxNativeZoom={19} maxZoom={22} updateWhenIdle updateWhenZooming={false} keepBuffer={2}/></LayersControl.BaseLayer><LayersControl.BaseLayer name="Street"><TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap contributors" maxZoom={19} updateWhenIdle updateWhenZooming={false} keepBuffer={2}/></LayersControl.BaseLayer></LayersControl>
              <MapResizeHandler sidebarOpen={sidebarOpen}/><PanToSelection treeId={selectedTree?.tree_id} position={original}/><ClickPlacement enabled={Boolean(selectedTree&&mode==='place')} onPlace={applyPosition}/>
              <ClusterLayer trees={located} selectedTreeId={selectedTree?.tree_id} onSelect={selectTree}/>
              {selectedTree&&shown&&<Marker position={[shown.lat,shown.lng]} icon={selectedIcon} draggable={mode==='drag'} eventHandlers={{dragend:e=>{const p=e.target.getLatLng();applyPosition({lat:p.lat,lng:p.lng});}}}><Popup><strong>{selectedTree.tree_id}</strong><br/>{selectedTree.common_name}<br/><span className="text-red-600 font-semibold">Selected tree</span></Popup></Marker>}
            </MapContainer>
            {!selectedTree&&<div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-[1000] bg-white dark:bg-gray-900 shadow-lg rounded-xl px-5 py-3 text-sm text-gray-600 dark:text-gray-200 text-center"><MapPin size={18} className="inline mr-2 text-green-700"/>Select a tree from the sidebar to edit its location.</div>}
          </div>
          {selectedTree&&<div className="shrink-0 p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-700 max-h-[38vh] overflow-y-auto">
            <div className="flex flex-wrap justify-between items-start gap-3"><div><h3 className="font-semibold text-sm dark:text-white">{selectedTree.tree_id} — {selectedTree.common_name}</h3><p className="text-xs text-gray-500 mt-1">{selectedTree.botanical_name||'Botanical name unavailable'}</p></div><div className="flex flex-wrap gap-4 text-xs"><div><p className="text-gray-400 mb-1">Latitude</p><p className="font-mono font-semibold dark:text-white">{shown?shown.lat.toFixed(8):'Not set'}</p></div><div><p className="text-gray-400 mb-1">Longitude</p><p className="font-mono font-semibold dark:text-white">{shown?shown.lng.toFixed(8):'Not set'}</p></div><div><p className="text-gray-400 mb-1">Status</p><p className={`font-semibold ${changed?'text-orange-600':'text-green-600'}`}>{changed?'Unsaved changes':'Original location'}</p></div>{changed&&moved!=null&&<div><p className="text-gray-400 mb-1">Movement</p><p className="font-semibold dark:text-white">{moved.toFixed(1)} m</p></div>}</div></div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 mt-4"><label className="text-xs text-gray-500">Latitude<input type="number" step="0.00000001" value={latDraft} onChange={e=>setLatDraft(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono dark:bg-gray-800 dark:border-gray-700 dark:text-white"/></label><label className="text-xs text-gray-500">Longitude<input type="number" step="0.00000001" value={lngDraft} onChange={e=>setLngDraft(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono dark:bg-gray-800 dark:border-gray-700 dark:text-white"/></label><button onClick={applyManual} className="self-end flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm dark:border-gray-600 dark:text-white"><Crosshair size={15}/>Apply</button></div>
            {changed&&moved>50&&<div className="mt-3 flex gap-2 rounded-lg bg-amber-50 text-amber-800 p-2 text-xs"><AlertTriangle size={15} className="shrink-0"/>This correction moves the tree more than 50 metres. Verify the marker before saving.</div>}
            <label className="block text-xs text-gray-500 mt-3">Correction reason (optional)<input value={reason} onChange={e=>setReason(e.target.value)} maxLength={500} placeholder="e.g. Verified against satellite imagery" className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-gray-800 dark:border-gray-700 dark:text-white"/></label>
          </div>}
        </main>
      </div>
    </div>
  );
}
