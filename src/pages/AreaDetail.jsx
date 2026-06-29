{/*
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getTrees } from '../api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function AreaDetail() {
  const { area }   = useParams();
  const navigate   = useNavigate();
  const areaName   = decodeURIComponent(area);
  const [trees, setTrees]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getTrees({ area: areaName })
      .then(r => setTrees(r.data))
      .finally(() => setLoading(false));
  }, [areaName]);

  const center   = trees.length > 0 ? [trees[0].latitude, trees[0].longitude] : [11.678, 78.125];
  const families = [...new Set(trees.map(t => t.family).filter(Boolean))];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <button onClick={() => navigate(-1)}
        className="text-forest-600 dark:text-forest-300 text-sm font-medium hover:underline">
        ← Back
      </button>

      <div>
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
          {areaName}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {trees.length} trees · {families.length} families
        </p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <p className="text-gray-400">Loading…</p>
        </div>
      )}

      {!loading && trees.length > 0 && (
        <>
          {/* Map *}
          <div className="card overflow-hidden">
            <div style={{ height: 320 }}>
              <MapContainer center={center} zoom={18}
                style={{ height: '100%', width: '100%' }} maxZoom={22}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={22} maxNativeZoom={19}
                  attribution="© OpenStreetMap contributors"
                />
                {trees.map(t => t.latitude && t.longitude && (
                  <Marker key={t.tree_id} position={[t.latitude, t.longitude]}>
                    <Popup>
                      <strong>{t.common_name}</strong><br />
                      <em style={{ fontSize: '0.8rem', color: '#666' }}>{t.botanical_name}</em><br />
                      <Link to={`/trees/${t.tree_id}`}
                        style={{ color: '#2d5a27', fontWeight: 600, fontSize: '0.85rem' }}>
                        View →
                      </Link>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Tree list *}
          <div className="card overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
              <h2 className="font-semibold text-gray-800 dark:text-gray-100">
                Trees in this area
              </h2>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
              {trees.map(t => (
                <Link key={t.tree_id} to={`/trees/${t.tree_id}`}
                  className="flex items-center justify-between px-5 py-3
                             hover:bg-forest-50 dark:hover:bg-forest-950 transition-colors">
                  <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
                      {t.common_name}
                    </p>
                    <p className="text-xs italic text-gray-400">{t.botanical_name}</p>
                  </div>
                  <span className="text-sm text-forest-600 dark:text-forest-300">View →</span>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && trees.length === 0 && (
        <div className="text-center py-24 text-gray-400">No trees found in this area.</div>
      )}
    </div>
  );
}
*/}

import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { getTrees, getAreaInfo, updateAreaInfo } from '../api';
import ImageUpload from '../components/ImageUpload';
import { useDarkMode } from '../context/DarkModeContext'

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const dotIcon = (color = '#2d5a27') => L.divIcon({
  className: '',
  html: `<div style="width:12px;height:12px;background:${color};border:2.5px solid white;border-radius:50%;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
  iconSize: [12, 12], iconAnchor: [6, 6],
})

export default function AreaDetail() {
  const [dark] = useDarkMode()
  const { area } = useParams();
  const navigate = useNavigate();
  const areaName = decodeURIComponent(area);
  const isAdmin  = localStorage.getItem('role') === 'admin';

  const [trees, setTrees]       = useState([]);
  const [areaInfo, setAreaInfo] = useState({});
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({ image_url: '', description: '', navigation_notes: '' });
  const [saving, setSaving]     = useState(false);
  const [treeSearch, setTreeSearch] = useState('');

  useEffect(() => {
    Promise.all([
      getTrees({ area: areaName }),
      getAreaInfo(areaName).catch(() => ({ data: {} })),
    ]).then(([t, a]) => {
      setTrees(t.data);
      setAreaInfo(a.data || {});
      setEditForm({
        image_url:        a.data?.image_url        || '',
        description:      a.data?.description      || '',
        navigation_notes: a.data?.navigation_notes || '',
      });
    }).finally(() => setLoading(false));
  }, [areaName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAreaInfo(areaName, editForm);
      setAreaInfo(editForm);
      setEditing(false);
    } catch { alert('Failed to save'); }
    finally { setSaving(false); }
  };

  const center   = trees.length > 0 ? [trees[0].latitude, trees[0].longitude] : [11.678, 78.125];
  const families = [...new Set(trees.map(t => t.family).filter(Boolean))];
  const filteredTrees = trees.filter(t =>
    !treeSearch || t.common_name?.toLowerCase().includes(treeSearch.toLowerCase())
      || t.botanical_name?.toLowerCase().includes(treeSearch.toLowerCase())
  );

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative h-64 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #1a3618, #2d5a27)' }}>
        {areaInfo.image_url && (
          <img src={areaInfo.image_url} alt={areaName}
            className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75), rgba(0,0,0,0.2))' }} />

        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5
                     rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                   border: '1px solid rgba(255,255,255,0.25)' }}>
          ← Back
        </button>

        {isAdmin && (
          <button onClick={() => setEditing(!editing)}
            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-lg text-sm font-medium text-white"
            style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                     border: '1px solid rgba(255,255,255,0.25)' }}>
            {editing ? '✕ Cancel' : '✏️ Edit Area'}
          </button>
        )}

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 z-10">
          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-bold text-white mb-1">
            {areaName}
          </motion.h1>
          <p className="text-gray-300 text-sm">
            {trees.length} trees · {families.length} families
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Admin edit panel ── */}
        {isAdmin && editing && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
            className="card p-6 space-y-4"
            style={{ borderLeft: '4px solid var(--color-forest-500)' }}>
            <h3 className="font-semibold text-gray-800">Edit Area Info</h3>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Area Image</label>
              <ImageUpload label="Upload area photo" onUploaded={url => setEditForm(f => ({ ...f, image_url: url }))} />
              {editForm.image_url && (
                <img src={editForm.image_url} alt=""
                  className="w-40 h-24 object-cover rounded-lg mt-2" />
              )}
              <input className="input mt-2 text-sm" placeholder="…or paste image URL"
                value={editForm.image_url}
                onChange={e => setEditForm(f => ({ ...f, image_url: e.target.value }))}
                style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Description</label>
              <textarea className="input resize-y text-sm" style={{ height: 80, background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
                placeholder="Brief description of this campus area…"
                value={editForm.description}
                onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500 block mb-1">Navigation / How to reach</label>
              <textarea className="input resize-y text-sm" style={{ height: 72, background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
                placeholder="e.g. Located near the main gate, turn left at the library…"
                value={editForm.navigation_notes}
                onChange={e => setEditForm(f => ({ ...f, navigation_notes: e.target.value }))} />
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
              {saving ? 'Saving…' : '✓ Save Changes'}
            </button>
          </motion.div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24 text-gray-400">Loading…</div>
        )}

        {!loading && (
          <>
            {/* Description */}
            {areaInfo.description && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                className="card p-6">
                <p className="text-gray-600 leading-relaxed"
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem' }}>
                  {areaInfo.description}
                </p>
              </motion.div>
            )}

            {/* Navigation notes */}
            {areaInfo.navigation_notes && (
              <motion.div
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="rounded-2xl p-5 flex gap-4"
                style={{ background: 'linear-gradient(135deg, #f0f7ee, #e8f5e9)',
                         border: '1px solid rgba(45,90,39,0.15)' }}>
                <span className="text-2xl flex-shrink-0">🧭</span>
                <div>
                  <p className="font-semibold text-sm mb-1" style={{ color: 'var(--color-forest-600)' }}>
                    How to reach
                  </p>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {areaInfo.navigation_notes}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Map */}
            {trees.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="card overflow-hidden">
                <div style={{ height: 340, position: 'relative', zIndex: 0 }}>
                  <MapContainer center={center} zoom={18}
                    style={{ height: '100%', width: '100%' }} maxZoom={22}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      maxZoom={22} maxNativeZoom={19}
                      attribution="© OpenStreetMap contributors"
                    />
                    {trees.map(t => t.latitude && t.longitude && (
                      <Marker key={t.tree_id} position={[t.latitude, t.longitude]}
                        icon={dotIcon('#2d5a27')}>
                        <Popup>
                          <strong style={{ fontSize: '0.88rem' }}>{t.common_name}</strong><br />
                          <em style={{ fontSize: '0.78rem', color: '#888' }}>{t.botanical_name}</em><br />
                          <Link to={`/trees/${t.tree_id}`}
                            style={{ color: '#2d5a27', fontWeight: 600, fontSize: '0.82rem' }}>
                            View →
                          </Link>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>
              </motion.div>
            )}

            {/* Tree list */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800
                              flex items-center justify-between gap-3">
                <h2 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
                  Trees in this area
                </h2>
                <input className="input text-sm w-48"
                  placeholder="Search trees…"
                  value={treeSearch}
                  onChange={e => setTreeSearch(e.target.value)}
                  style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
              </div>
              <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-96 overflow-y-auto">
                {filteredTrees.length === 0 ? (
                  <p className="px-5 py-8 text-center text-gray-400 text-sm">No trees match.</p>
                ) : filteredTrees.map(t => (
                  <Link key={t.tree_id} to={`/trees/${t.tree_id}`}
                    className="flex items-center gap-3 px-5 py-3
                               hover:bg-forest-50 dark:hover:bg-forest-950 transition-colors group">
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0"
                      style={{ background: '#f0f7ee' }}>
                      {t.image_url
                        ? <img src={t.image_url} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-sm">🌿</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                        {t.common_name}
                      </p>
                      <p className="text-xs italic text-gray-400 truncate">{t.botanical_name}</p>
                    </div>
                    <span className="text-xs text-gray-300 group-hover:text-forest-500 transition-colors">
                      {t.tree_id} →
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>

            {trees.length === 0 && (
              <div className="text-center py-24 text-gray-400">No trees found in this area.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}