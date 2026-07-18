{/*
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { getTree, getTreeQR, getNearbyTrees, getTrees, getTreeImages, addTreeImage, deleteTreeImage } from '../api';
import ImageUpload from '../components/ImageUpload';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const primaryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});
const sameSpeciesIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34],
});

export default function TreeDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const isAdmin  = localStorage.getItem('role') === 'admin';

  const [tree, setTree]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [qr, setQr]                   = useState(null);
  const [nearby, setNearby]           = useState([]);
  const [sameSpecies, setSameSpecies] = useState([]);
  const [imgFailed, setImgFailed]     = useState(false);
  const [images, setImages]           = useState([]);
  const [lightbox, setLightbox]       = useState(null);

  useEffect(() => {
    setLoading(true);
    setImgFailed(false);

    getTree(id)
      .then(r => {
        const t = r.data;
        setTree(t);
        if (t.botanical_name) {
          getTrees({ search: t.botanical_name }).then(res => {
            setSameSpecies(res.data.filter(x => x.tree_id !== id));
          });
        }
      })
      .catch(() => setTree(null))
      .finally(() => setLoading(false));

    getTreeQR(id).then(r => setQr(r.data.qr)).catch(() => setQr(null));
    getNearbyTrees(id, 100).then(r => setNearby(r.data)).catch(() => setNearby([]));
    getTreeImages(id).then(r => setImages(r.data)).catch(() => setImages([]));
  }, [id]);

  const handleAddImage = async (url, caption = '') => {
    try {
      const res = await addTreeImage(id, { image_url: url, caption, is_primary: images.length === 0 });
      setImages(prev => [...prev, res.data]);
    } catch { alert('Failed to add image'); }
  };

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await deleteTreeImage(id, imgId);
      setImages(prev => prev.filter(i => i.id !== imgId));
    } catch { alert('Failed to delete image'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Loading…</p>
    </div>
  );

  if (!tree) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Tree not found</p>
      <button className="btn-primary" onClick={() => navigate('/trees')}>Back to Trees</button>
    </div>
  );

  // Derive primary image
  const primaryImage = images.find(i => i.is_primary)?.image_url
    || images[0]?.image_url
    || (!imgFailed && tree.image_link ? tree.image_link : null)
    || tree.image_url
    || null;

  const ecologyItems = [
    { title: '🌿 Ecological Importance', content: tree.ecological_importance   },
    { title: '💊 Medicinal Uses',        content: tree.medicinal_uses          },
    { title: '💼 Economic Uses',         content: tree.economic_uses           },
    { title: '🌍 Environmental Benefits',content: tree.environmental_benefits  },
    { title: '🦋 Wildlife Supported',    content: tree.wildlife_supported      },
    { title: '🎭 Cultural Significance', content: tree.cultural_significance   },
  ].filter(i => i.content);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header card ── *}
      <div className="card overflow-hidden">
        <div className="md:flex">
          {/* Image *}
          <div className="md:w-64 h-56 md:h-auto flex-shrink-0 bg-forest-50
                          flex items-center justify-center text-7xl overflow-hidden">
            {primaryImage && !imgFailed
              ? <img src={primaryImage} onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover" alt={tree.common_name} />
              : <span>🌳</span>}
          </div>

          {/* Info *}
          <div className="p-6 flex flex-col gap-3 flex-1">
            <div className="flex flex-wrap gap-2">
              <span className="badge" style={{ background: '#d9edcf', color: '#2d5a27' }}>
                {tree.area}
              </span>
              {tree.native_exotic && (
                <span className="badge" style={{
                  background: tree.native_exotic === 'Native' ? '#d1fae5' : '#fef3c7',
                  color:      tree.native_exotic === 'Native' ? '#065f46' : '#92400e'
                }}>
                  {tree.native_exotic}
                </span>
              )}
              {tree.conservation_status && (
                <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  {tree.conservation_status}
                </span>
              )}
            </div>

            <div>
              <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
                {tree.common_name}
              </h1>
              {tree.tamil_name && (
                <p className="text-gray-500 dark:text-gray-400 mt-0.5">{tree.tamil_name}</p>
              )}
              <p className="italic text-gray-400 text-sm mt-1">{tree.botanical_name}</p>
            </div>

            {tree.general_description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-4">
                {tree.general_description}
              </p>
            )}

            {/* Quick stats *}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-1">
              {[
                { label: 'Tree ID',  value: tree.tree_id },
                { label: 'Age',      value: tree.age ? `~${tree.age} yrs` : '—' },
                { label: 'Height',   value: tree.avg_height  ?? '—' },
                { label: 'Family',   value: tree.family      ?? '—' },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg p-3"
                  style={{ background: '#f0f7ee' }}>
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="font-semibold text-sm text-gray-800 mt-0.5 truncate">{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Ecology & Uses ── *}
      {ecologyItems.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          {ecologyItems.map(({ title, content }) => (
            <div key={title} className="card p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{content}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Taxonomy ── *}
      {(tree.kingdom || tree.family || tree.genus) && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">🔬 Taxonomy</h2>
          <div className="flex flex-wrap gap-2 text-sm">
            {[
              ['Kingdom', tree.kingdom], ['Division', tree.division],
              ['Class', tree.class],     ['Order', tree.order],
              ['Family', tree.family],   ['Genus', tree.genus],
              ['Species', tree.species],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} className="flex items-center gap-1">
                <span className="text-gray-400 text-xs">{label}:</span>
                <span className="font-medium text-gray-700 dark:text-gray-200">{value}</span>
                <span className="text-gray-200 dark:text-gray-700 ml-1">›</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Map ── *}
      {tree.latitude && tree.longitude && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">📍 Location</h2>
          </div>
          <div style={{ height: 320 }}>
            <MapContainer
              center={[tree.latitude, tree.longitude]}
              zoom={19}
              style={{ height: '100%', width: '100%' }}
              maxZoom={22}
            >
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="Street">
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="© OpenStreetMap contributors"
                    maxNativeZoom={19} maxZoom={22}
                  />
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="Satellite">
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="© Esri"
                    maxNativeZoom={19} maxZoom={22}
                  />
                </LayersControl.BaseLayer>
              </LayersControl>

              <Marker position={[tree.latitude, tree.longitude]} icon={primaryIcon}>
                <Popup><strong>{tree.common_name}</strong><br />{tree.tree_id}</Popup>
              </Marker>

              {sameSpecies.map(t => t.latitude && t.longitude && (
                <Marker key={t.tree_id} position={[t.latitude, t.longitude]} icon={sameSpeciesIcon}>
                  <Popup>
                    <Link to={`/trees/${t.tree_id}`} style={{ color: '#2d5a27', fontWeight: 600 }}>
                      {t.common_name}
                    </Link>
                    <br />{t.tree_id}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
          <div className="px-5 py-2 text-xs text-gray-400 border-t border-gray-100 dark:border-gray-800">
            🔴 This tree &nbsp;|&nbsp; 🟢 Same species on campus ({sameSpecies.length})
          </div>
        </div>
      )}

      {/* ── Nearby Trees ── *}
      {nearby.length > 0 && (
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
            🌲 Nearby Trees ({nearby.length} within 100m)
          </h2>
          <div className="space-y-2">
            {nearby.map(t => (
              <Link key={t.tree_id} to={`/trees/${t.tree_id}`}
                className="flex items-center justify-between p-3 rounded-lg
                           hover:bg-forest-50 dark:hover:bg-forest-950 transition-colors">
                <div>
                  <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{t.common_name}</p>
                  <p className="text-xs italic text-gray-400">{t.botanical_name}</p>
                </div>
                <span className="text-xs text-gray-400">{t.tree_id}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* ── Image Gallery ── *}
      <div className="card p-5">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">📷 Gallery</h2>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {images.map((img, i) => (
              <div key={img.id} className="relative group rounded-lg overflow-hidden"
                style={{ aspectRatio: '4/3' }}>
                <img src={img.image_url} alt={img.caption || ''}
                  className="w-full h-full object-cover cursor-pointer
                             group-hover:scale-105 transition-transform duration-200"
                  onClick={() => setLightbox(i)} />
                {img.is_primary && (
                  <span className="absolute top-2 left-2 badge text-xs"
                    style={{ background: '#2d5a27', color: '#fff' }}>Primary</span>
                )}
                {isAdmin && (
                  <button onClick={() => handleDeleteImage(img.id)}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full
                               w-6 h-6 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">No photos uploaded yet.</p>
        )}

        {isAdmin && (
          <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Add photo</p>
            <ImageUpload label="Upload image" onUploaded={url => handleAddImage(url)} />
          </div>
        )}
      </div>

      {/* ── QR Code ── *}
      {qr && (
        <div className="card p-5 flex flex-col sm:flex-row items-center gap-6">
          <img src={qr} alt="QR Code" className="w-36 h-36 rounded-lg" />
          <div>
            <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-1">QR Code</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Scan to open this tree's page. Place on the physical tree tag.
            </p>
            {isAdmin && (
              <a href={qr} download={`${tree.tree_id}-qr.png`}>
                <button className="btn-primary text-sm">⬇ Download QR</button>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Lightbox ── *}
      {lightbox !== null && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}>
          <div className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
            <img src={images[lightbox].image_url} alt=""
              className="w-full max-h-[80vh] object-contain rounded-xl" />
            <div className="flex items-center justify-between mt-3">
              <button onClick={() => setLightbox(i => Math.max(0, i - 1))}
                disabled={lightbox === 0}
                className="btn-secondary text-white border-white/30 disabled:opacity-30">← Prev</button>
              <span className="text-white text-sm">{lightbox + 1} / {images.length}</span>
              <button onClick={() => setLightbox(i => Math.min(images.length - 1, i + 1))}
                disabled={lightbox === images.length - 1}
                className="btn-secondary text-white border-white/30 disabled:opacity-30">Next →</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
*/}

import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import { getTree, getTreeQR, getNearbyTrees, getTrees, getTreeImages, addTreeImage, deleteTreeImage } from '../api'
import ImageUpload from '../components/ImageUpload'
import { useScrollReveal } from '../hooks/useScrollReveal'
import TaxonomyTree from '../components/TaxonomyTree'
import { useDarkMode } from '../context/DarkModeContext'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})
const primaryIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34],
})
const sameSpeciesIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25,41], iconAnchor: [12,41], popupAnchor: [1,-34],
})

function RevealSection({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}>
      {children}
    </motion.div>
  )
}
{/*}
function TaxonomyTree({ tree }) {
  const levels = [
    { rank: 'Kingdom', value: tree.kingdom },
    { rank: 'Division', value: tree.division },
    { rank: 'Class',    value: tree.class    },
    { rank: 'Order',    value: tree.order    },
    { rank: 'Family',   value: tree.family   },
    { rank: 'Genus',    value: tree.genus    },
    { rank: 'Species',  value: tree.species  },
  ].filter(l => l.value)

  const colors = ['#1b5e20','#2e7d32','#388e3c','#43a047','#4caf50','#66bb6a','#81c784']

  return (
    <div className="relative pl-6">
      {/* Vertical line *}
      <div className="absolute left-3 top-3 bottom-3 w-0.5"
        style={{ background: 'linear-gradient(to bottom, #2d5a27, #c8e6c9)' }} />

      {levels.map((l, i) => (
        <motion.div key={l.rank}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: i * 0.07 }}
          className="relative flex items-center gap-3 mb-3">
          {/* Dot *}
          <div className="absolute -left-3 w-3 h-3 rounded-full border-2 border-white shadow-md"
            style={{ background: colors[i] }} />
          {/* Horizontal connector *}
          <div className="w-4 h-0.5 flex-shrink-0" style={{ background: colors[i] }} />
          {/* Content *}
          <div className="flex items-center gap-3 card px-4 py-2.5 flex-1"
            style={{
              background: `linear-gradient(135deg, ${colors[i]}15, ${colors[i]}08)`,
              border: `1px solid ${colors[i]}30`,
              borderRadius: '0.75rem',
            }}>
            <span className="text-xs font-semibold tracking-widest uppercase text-gray-400 w-16 flex-shrink-0">
              {l.rank}
            </span>
            <span className="font-semibold text-sm text-gray-800"
              style={i >= 5 ? { fontStyle: 'italic' } : {}}>
              {l.value}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
*/}

export default function TreeDetail() {
  const [dark] = useDarkMode()
  const { id }   = useParams()
  const navigate = useNavigate()
  const isAdmin  = localStorage.getItem('role') === 'admin'

  const [tree, setTree]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [qr, setQr]                   = useState(null)
  const [nearby, setNearby]           = useState([])
  const [sameSpecies, setSameSpecies] = useState([])
  const [imgFailed, setImgFailed]     = useState(false)
  const [images, setImages]           = useState([])
  const [lightbox, setLightbox]       = useState(null)

  useEffect(() => {
    setLoading(true); setImgFailed(false)
    getTree(id)
      .then(r => {
        const t = r.data; setTree(t)
        if (t.botanical_name)
          getTrees({ search: t.botanical_name }).then(res =>
            setSameSpecies(res.data.filter(x => x.tree_id !== id)))
      })
      .catch(() => setTree(null))
      .finally(() => setLoading(false))
    getTreeQR(id).then(r => setQr(r.data.qr)).catch(() => setQr(null))
    getNearbyTrees(id, 100).then(r => setNearby(r.data)).catch(() => setNearby([]))
    getTreeImages(id).then(r => setImages(r.data)).catch(() => setImages([]))
  }, [id])

  const handleAddImage = async (url) => {
    try {
      const res = await addTreeImage(id, { image_url: url, is_primary: images.length === 0 })
      setImages(prev => [...prev, res.data])
    } catch { alert('Failed to add image') }
  }

  const handleDeleteImage = async (imgId) => {
    if (!window.confirm('Delete this image?')) return
    try {
      await deleteTreeImage(id, imgId)
      setImages(prev => prev.filter(i => i.id !== imgId))
    } catch { alert('Failed to delete image') }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
        className="text-4xl">🌿</motion.div>
    </div>
  )

  if (!tree) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-xl font-semibold text-gray-700">Tree not found</p>
      <button className="btn-primary" onClick={() => navigate('/trees')}>Back to Trees</button>
    </div>
  )

  const heroImage = (!imgFailed && tree.image_link ? tree.image_link : null)
  || tree.species_image_url
  || null

  const ecologyItems = [
    { title: '🌿 Ecological Importance', content: tree.ecological_importance  },
    { title: '💊 Medicinal Uses',        content: tree.medicinal_uses         },
    { title: '💼 Economic Uses',         content: tree.economic_uses          },
    { title: '🌍 Environmental Benefits',content: tree.environmental_benefits },
    { title: '🦋 Wildlife Supported',   content: tree.wildlife_supported     },
    { title: '🎭 Cultural Significance', content: tree.cultural_significance  },
  ].filter(i => i.content)

  return (
    <div>
      {/* ── Hero ── */}
      <div className="relative min-h-[70vh] flex flex-col justify-end overflow-hidden">
        {/* Background image */}
        <div className="absolute inset-0">
          {heroImage && !imgFailed
            ? <img src={heroImage} onError={() => setImgFailed(true)}
                className="w-full h-full object-cover" alt="" />
            : <div className="w-full h-full flex items-center justify-center text-9xl"
                style={{ background: 'linear-gradient(135deg, #1a3618, #2d5a27)' }}>🌳</div>
          }
          <div className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)' }} />
        </div>

        {/* Back button */}
        <button onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)' }}>
          ← Back
        </button>

        {/* Hero content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 pb-10 w-full">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}>

            <h1 className="font-display text-5xl md:text-6xl font-bold text-white mb-2 leading-tight">
              {tree.common_name}
            </h1>
            {tree.tamil_name && (
              <p className="text-gray-300 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', fontStyle: 'italic' }}>
                {tree.tamil_name}
              </p>
            )}
            <p className="italic text-gray-300 text-sm mb-4">{tree.botanical_name}</p>

            {/* Badges below name */}
            <div className="flex flex-wrap gap-2">
              <span className="badge text-white"
                style={{ background: 'rgba(45,90,39,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(82,160,67,0.4)' }}>
                📍 {tree.area}
              </span>
              {tree.native_exotic && (
                <span className="badge text-white"
                  style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  {tree.native_exotic}
                </span>
              )}
              {tree.conservation_status && (
                <span className="badge text-white"
                  style={{ background: 'rgba(180,40,40,0.6)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,100,100,0.3)' }}>
                  {tree.conservation_status}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {/* Quick stats */}
        <RevealSection>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Tree ID',  value: tree.tree_id,                        icon: '🔖' },
              { label: 'Age',      value: tree.age ? `~${tree.age} yrs` : '—', icon: '⏳' },
              { label: 'Height',   value: tree.avg_height ?? '—',               icon: '📏' },
              { label: 'Family',   value: tree.family ?? '—',                   icon: '🌿' },
            ].map(({ label, value, icon }) => (
              <div key={label} className="card-clay p-4 text-center">
                <div className="text-2xl mb-1">{icon}</div>
                <p className="font-bold text-sm" style={{ color: dark ? '#e6edf3' : '#111827' }}>{value}</p>
                <p className="text-xs mt-0.5" style={{ color: dark ? '#8b949e' : '#6b7280' }}>{label}</p>
              </div>
            ))}
          </div>
        </RevealSection>

        {/* Description */}
        {tree.general_description && (
          <RevealSection delay={0.05}>
            <div className="card p-6">
              <p className="leading-relaxed" style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '1.1rem',
                color: dark ? '#8b949e' : '#4b5563'
              }}>
                {tree.general_description}
              </p>
            </div>
          </RevealSection>
        )}

        {/* Did you know */}
        {tree.interesting_facts && (
          <RevealSection delay={0.1}>
            <div className="relative overflow-hidden rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, #1a3618, #2d5a27)',
                boxShadow: '0 8px 32px rgba(45,90,39,0.3)'
              }}>
              <div className="absolute top-0 right-0 text-8xl opacity-10 leading-none">💡</div>
              <p className="text-xs font-bold tracking-widest uppercase mb-2"
                style={{ color: '#81c784' }}>Did you know?</p>
              <p className="text-white leading-relaxed"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem' }}>
                {tree.interesting_facts}
              </p>
            </div>
          </RevealSection>
        )}

        {/* Ecology & Uses */}
        {ecologyItems.length > 0 && (
  <RevealSection delay={0.05}>
    <h2 className="font-display text-2xl font-bold mb-6"
      style={{ color: dark ? '#e6edf3' : '#111827' }}>🌿 Ecology & Uses</h2>
    <div className="space-y-4">
      {ecologyItems.map(({ title, content }, i) => {
        const palettes = [
          { bg: '#1b5e20', light: '#e8f5e9' },
          { bg: '#1565c0', light: '#e3f2fd' },
          { bg: '#6a1b9a', light: '#f3e5f5' },
          { bg: '#e65100', light: '#fff3e0' },
          { bg: '#006064', light: '#e0f7fa' },
          { bg: '#880e4f', light: '#fce4ec' },
        ]
        const { bg, light } = palettes[i % palettes.length]
        return (
          <motion.div key={title}
            initial={{ opacity: 0, x: i % 2 === 0 ? -24 : 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: i * 0.08 }}
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: dark ? '#161b22' : '#fff',
              border: `1px solid ${bg}25`,
              boxShadow: `0 4px 20px ${bg}12`
            }}>
            {/* Left accent bar */}
            <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl"
              style={{ background: `linear-gradient(to bottom, ${bg}, ${bg}88)` }} />
            {/* Watermark emoji */}
            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-7xl opacity-[0.06] select-none pointer-events-none">
              {title.split(' ')[0]}
            </div>
            {/* Content */}
            <div className="pl-5">
              <span className="inline-block text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full mb-3"
                style={{ background: dark ? `${bg}25` : light, color: bg }}>
                {title}
              </span>
              <p className="text-sm leading-relaxed"
                style={{ color: dark ? '#c9d1d9' : '#374151' }}>
                {content}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  </RevealSection>
)}

        {/* Taxonomy */}
        {(tree.kingdom || tree.family || tree.genus) && (
          <RevealSection>
            <div className="card p-6">
              <h2 className="font-display text-2xl font-bold mb-6"
                style={{ color: dark ? '#e6edf3' : '#111827' }}>🔬 Taxonomy</h2>
              <TaxonomyTree tree={tree} dark={dark} />
            </div>
          </RevealSection>
        )}

        {/* Map */}
        {tree.latitude && tree.longitude && (
          <RevealSection>
            <div className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="font-semibold"
                  style={{ color: dark ? '#e6edf3' : '#1f2937' }}>📍 Location on Campus</h2>
              </div>
              <div style={{ height: 320, position: 'relative', zIndex: 0 }}>
                <MapContainer center={[tree.latitude, tree.longitude]} zoom={19}
                  style={{ height: '100%', width: '100%' }} maxZoom={22}>
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer checked name="Street">
                      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors" maxNativeZoom={19} maxZoom={22} />
                    </LayersControl.BaseLayer>
                    <LayersControl.BaseLayer name="Satellite">
                      <TileLayer url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        attribution="© Esri" maxNativeZoom={19} maxZoom={22} />
                    </LayersControl.BaseLayer>
                  </LayersControl>
                  <Marker position={[tree.latitude, tree.longitude]} icon={primaryIcon}>
                    <Popup><strong>{tree.common_name}</strong><br />{tree.tree_id}</Popup>
                  </Marker>
                  {sameSpecies.map(t => t.latitude && t.longitude && (
                    <Marker key={t.tree_id} position={[t.latitude, t.longitude]} icon={sameSpeciesIcon}>
                      <Popup>
                        <Link to={`/trees/${t.tree_id}`} style={{ color: '#2d5a27', fontWeight: 600 }}>
                          {t.common_name}
                        </Link><br />{t.tree_id}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
              <div className="px-5 py-2 text-xs border-t border-gray-100"
                style={{ color: dark ? '#6e7681' : '#9ca3af' }}>
                🔴 This tree &nbsp;|&nbsp; 🟢 Same species ({sameSpecies.length} on campus)
              </div>
            </div>
          </RevealSection>
        )}

        {/* Nearby */}
        {nearby.length > 0 && (
          <RevealSection>
            <div className="card p-5">
              <h2 className="font-semibold mb-3"
                style={{ color: dark ? '#e6edf3' : '#1f2937' }}>
                🌲 Nearby Trees ({nearby.length})
              </h2>
              <div className="space-y-1">
                {nearby.map(t => (
                  <Link key={t.tree_id} to={`/trees/${t.tree_id}`}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors"
                    style={{ color: dark ? '#e6edf3' : 'inherit' }}>
                    <div>
                      <p className="font-medium text-sm"
                        style={{ color: dark ? '#e6edf3' : '#111827' }}>{t.common_name}</p>
                      <p className="text-xs italic" style={{ color: '#8b949e' }}>{t.botanical_name}</p>
                    </div>
                    <span className="text-xs" style={{ color: '#8b949e' }}>{t.tree_id}</span>
                  </Link>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* Gallery */}
        <RevealSection>
          <div className="card p-5">
            <h2 className="font-semibold mb-4"
              style={{ color: dark ? '#e6edf3' : '#1f2937' }}>📷 Gallery</h2>
            {images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {images.map((img, i) => (
                  <div key={img.id} className="relative group rounded-xl overflow-hidden"
                    style={{ aspectRatio: '4/3' }}>
                    <img src={img.image_url} alt=""
                      className="w-full h-full object-cover cursor-pointer
                                group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setLightbox(i)} />
                    {img.is_primary && (
                      <span className="absolute top-2 left-2 badge text-white text-xs"
                        style={{ background: 'rgba(45,90,39,0.8)', backdropFilter: 'blur(8px)' }}>
                        Primary
                      </span>
                    )}
                    {isAdmin && (
                      <button onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs
                                  opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ background: 'rgba(200,0,0,0.75)', backdropFilter: 'blur(4px)' }}>
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm mb-4" style={{ color: '#8b949e' }}>No photos uploaded yet.</p>
            )}
            {isAdmin && (
              <div className="pt-4" style={{ borderTop: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}>
                <p className="text-sm font-medium mb-2"
                  style={{ color: dark ? '#8b949e' : '#4b5563' }}>Add photo</p>
                <ImageUpload label="Upload image" onUploaded={url => handleAddImage(url)} />
              </div>
            )}
          </div>
        </RevealSection>

        {/* QR */}
        {qr && (
          <RevealSection>
            <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
              <img src={qr} alt="QR Code" className="w-36 h-36 rounded-xl" />
              <div>
                <h2 className="font-semibold mb-1"
                  style={{ color: dark ? '#e6edf3' : '#1f2937' }}>QR Code</h2>
                <p className="text-sm mb-4" style={{ color: '#8b949e' }}>
                  Scan to open this tree's detail page.
                </p>
                {isAdmin && (
                  <a href={qr} download={`${tree.tree_id}-qr.png`}>
                    <button className="btn-primary text-sm">⬇ Download QR</button>
                  </a>
                )}
              </div>
            </div>
          </RevealSection>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setLightbox(null)}>
            <div onClick={e => e.stopPropagation()} className="relative max-w-3xl w-full">
              <img src={images[lightbox].image_url} alt=""
                className="w-full max-h-[80vh] object-contain rounded-2xl" />
              <div className="flex items-center justify-between mt-4">
                <button onClick={() => setLightbox(i => Math.max(0, i-1))}
                  disabled={lightbox === 0}
                  className="btn-secondary text-white border-white/30 disabled:opacity-30">← Prev</button>
                <span className="text-white text-sm">{lightbox+1} / {images.length}</span>
                <button onClick={() => setLightbox(i => Math.min(images.length-1, i+1))}
                  disabled={lightbox === images.length-1}
                  className="btn-secondary text-white border-white/30 disabled:opacity-30">Next →</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
