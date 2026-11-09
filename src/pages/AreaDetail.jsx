import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { getTrees, getAreaInfo, updateAreaInfo } from '../api';
import ImageUpload from '../components/ImageUpload';
import { useDarkMode } from '../context/DarkModeContext';
import { createStylizedPin, getSpeciesColor, getBotanicalMonogram } from '../utils/mapPins';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function AreaDetail() {
  const [dark] = useDarkMode();
  const { area } = useParams();
  const navigate = useNavigate();

  const [trees, setTrees] = useState([]);
  const [areaInfo, setAreaInfo] = useState({ description: '', navigation_notes: '', image_url: '', area_code: '' });
  const [loading, setLoading] = useState(true);
  const [selectedTree, setSelectedTree] = useState(null);
  const [search, setSearch] = useState('');
  const [floraFilter, setFloraFilter] = useState('all'); // 'all' | 'tree' | 'plant'

  // Edit area modal
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ description: '', navigation_notes: '', image_url: '' });
  const [saving, setSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  const isAdmin = localStorage.getItem('role') === 'admin';

  useEffect(() => {
    Promise.all([
      getTrees({ area }),
      getAreaInfo(area).catch(() => ({ data: {} }))
    ]).then(([treesRes, infoRes]) => {
      setTrees(treesRes.data);
      if (infoRes.data) {
        setAreaInfo(infoRes.data);
        setEditForm({
          description: infoRes.data.description || '',
          navigation_notes: infoRes.data.navigation_notes || '',
          image_url: infoRes.data.image_url || '',
        });
      }
    }).finally(() => setLoading(false));
  }, [area]);

  const handleSaveInfo = async () => {
    setSaving(true);
    setEditMsg('');
    try {
      await updateAreaInfo(area, editForm);
      setAreaInfo(prev => ({ ...prev, ...editForm }));
      setEditMsg('✅ Area information updated');
      setTimeout(() => { setEditing(false); setEditMsg(''); }, 1500);
    } catch {
      setEditMsg('❌ Failed to update');
    } finally {
      setSaving(false);
    }
  };

  // Filter trees by search and flora_type
  const filteredTrees = trees.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      t.common_name?.toLowerCase().includes(q) ||
      t.botanical_name?.toLowerCase().includes(q) ||
      t.tree_id?.toLowerCase().includes(q) ||
      t.family?.toLowerCase().includes(q);
    const matchFlora = floraFilter === 'all' || (t.flora_type || 'tree') === floraFilter;
    return matchSearch && matchFlora;
  });

  const validTrees = filteredTrees.filter(t =>
    t.latitude && t.longitude && !isNaN(t.latitude) && !isNaN(t.longitude)
  );

  const center = validTrees.length > 0
    ? [
        validTrees.reduce((s, t) => s + parseFloat(t.latitude), 0) / validTrees.length,
        validTrees.reduce((s, t) => s + parseFloat(t.longitude), 0) / validTrees.length,
      ]
    : [13.0827, 80.2707];

  const speciesCount = new Set(trees.map(t => t.botanical_name).filter(Boolean)).size;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">🌿</div>
          <p className="text-gray-500 dark:text-gray-400">Loading {area}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/areas')}
            className="text-xs font-semibold text-forest-600 dark:text-forest-400 hover:underline flex items-center gap-1 mb-1"
          >
            ← Back to All Areas
          </button>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span>📍</span> {area}
            {areaInfo.area_code && (
              <span className="text-sm font-mono font-bold px-2 py-0.5 rounded bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300">
                {areaInfo.area_code}
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {trees.length} total flora ({speciesCount} distinct species)
          </p>
        </div>

        {isAdmin && (
          <button onClick={() => setEditing(!editing)} className="btn-primary text-xs px-3 py-2">
            {editing ? 'Close Editor' : '✏️ Edit Area Info'}
          </button>
        )}
      </div>

      {/* Admin Edit Area Metadata Panel */}
      {editing && (
        <div className="card p-5 border border-forest-500 space-y-4">
          <h3 className="font-semibold text-sm text-forest-700 dark:text-forest-300">Edit Area Information</h3>
          {editMsg && <div className="text-xs font-semibold">{editMsg}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Area Image URL</label>
              <input
                className="input text-xs"
                value={editForm.image_url}
                onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://..."
              />
              <div className="mt-2">
                <ImageUpload label="Upload New Area Photo" onUploaded={url => setEditForm(f => ({ ...f, image_url: url }))} />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Directions & Navigation Notes</label>
              <textarea
                className="input text-xs h-24 resize-y"
                value={editForm.navigation_notes}
                onChange={e => setEditForm(f => ({ ...f, navigation_notes: e.target.value }))}
                placeholder="Directions from main gates or nearby buildings..."
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400">Area Description</label>
            <textarea
              className="input text-xs h-20 resize-y"
              value={editForm.description}
              onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Ecology, canopy, surroundings..."
            />
          </div>
          <div className="flex gap-2">
            <button disabled={saving} onClick={handleSaveInfo} className="btn-primary text-xs px-4 py-2">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            <button onClick={() => setEditing(false)} className="px-3 py-2 text-xs rounded-lg border text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar for Map + List */}
      <div className="card p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <input
          className="input flex-1 min-w-48 text-xs py-1.5"
          placeholder="Filter trees in this area..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Tree / Plant Filter Toggle */}
        <div className="flex gap-1 p-1 rounded-lg bg-gray-100 dark:bg-gray-800">
          {[
            ['all', 'All'],
            ['tree', '🌳 Trees'],
            ['plant', '🌿 Plants']
          ].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFloraFilter(val)}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${
                floraFilter === val
                  ? 'bg-forest-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="text-gray-400">
          Showing {validTrees.length} mapped markers
        </span>
      </div>

      {/* Map Section */}
      <div className="card overflow-hidden h-[420px] relative rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
        <MapContainer
          center={center}
          zoom={18}
          zoomSnap={0.5}
          zoomDelta={0.5}
          wheelPxPerZoomLevel={120}
          className="w-full h-full"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="🗺️ Street Map">
              <TileLayer
                attribution="&copy; OpenStreetMap"
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="🛰️ Satellite View">
              <TileLayer
                attribution="&copy; Esri World Imagery"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {validTrees.map(tree => {
            const isPlant = (tree.flora_type || 'tree') === 'plant';
            const color = getSpeciesColor(tree.botanical_name || tree.common_name);
            const monogram = getBotanicalMonogram(tree.botanical_name, tree.common_name);
            const isSelected = selectedTree?.tree_id === tree.tree_id;

            return (
              <Marker
                key={tree.tree_id}
                position={[parseFloat(tree.latitude), parseFloat(tree.longitude)]}
                icon={createStylizedPin({
                  color,
                  label: monogram,
                  isPlant,
                  isSelected
                })}
                eventHandlers={{
                  click: () => setSelectedTree(tree)
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[160px] text-xs">
                    <p className="font-bold text-gray-900">{tree.common_name}</p>
                    <p className="italic text-gray-500 mb-1">{tree.botanical_name}</p>
                    <p className="font-mono text-forest-600 font-semibold mb-2">ID: {tree.tree_id}</p>
                    <Link
                      to={`/trees/${tree.tree_id}`}
                      className="inline-block px-2.5 py-1 rounded bg-forest-600 text-white font-semibold hover:bg-forest-700"
                    >
                      View Details →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {/* Trees Grid / Table */}
      <div className="card overflow-x-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-800 dark:text-gray-200">
          Flora in {area} ({filteredTrees.length})
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: 'var(--color-forest-500)' }}>
              {['Tree ID', 'Common Name', 'Botanical Name', 'Type', 'Family', 'Details'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredTrees.map(t => (
              <tr
                key={t.tree_id}
                className="hover:bg-forest-50/50 dark:hover:bg-[#21262d] transition-colors"
                style={{ background: dark ? '#1c2128' : '#fff' }}
              >
                <td className="px-4 py-3 font-mono font-bold text-xs text-forest-600 dark:text-forest-400">
                  {t.tree_id}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{t.common_name}</td>
                <td className="px-4 py-3 italic text-gray-500">{t.botanical_name}</td>
                <td className="px-4 py-3 text-xs">
                  <span className="px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300">
                    {(t.flora_type || 'tree') === 'plant' ? '🌿 Plant' : '🌳 Tree'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{t.family}</td>
                <td className="px-4 py-3">
                  <Link to={`/trees/${t.tree_id}`} className="text-xs font-semibold text-forest-600 hover:underline">
                    View →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
