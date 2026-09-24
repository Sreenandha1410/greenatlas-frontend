import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet'
import L from 'leaflet'
import {
  getTree, getTreeQR, getNearbyTrees, getTrees, getTreeImages,
  addTreeImage, deleteTreeImage
} from '../api'
import ImageUpload from '../components/ImageUpload'
import TaxonomyTree from '../components/TaxonomyTree'
import { useDarkMode } from '../context/DarkModeContext'
import QRScanAnimation from '../components/QRScanAnimation'

delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png'
})

const markerIcon = color => new L.Icon({
  iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-${color}.png`,
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
})

const primaryIcon = markerIcon('red')
const sameSpeciesIcon = markerIcon('green')

function RevealSection({ children, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  )
}

function EcologyInfoCard({ number, title, content, dark }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.35 }}
      whileHover={{ y: -3 }}
      className="group relative rounded-2xl p-5 transition-all duration-300"
      style={{
        background: dark ? '#161b22' : '#f8fbf7',
        border: `1px solid ${dark ? '#30363d' : '#e1eadf'}`
      }}
    >
      <div className="absolute left-0 top-5 bottom-5 w-1 rounded-r-full" style={{ background: '#3f7d3a' }} />
      <div className="flex gap-4">
        <div
          className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: dark ? 'rgba(63,125,58,0.18)' : '#e7f2e4',
            color: dark ? '#9bd494' : '#356b31'
          }}
        >
          <span className="text-xs font-bold tracking-wider">{number}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-base mb-2" style={{ color: dark ? '#f0f6fc' : '#172016' }}>
            {title}
          </h3>
          <p className="text-sm leading-7" style={{ color: dark ? '#b8c2cc' : '#59665a' }}>
            {content}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default function TreeDetail() {
  const [dark] = useDarkMode()
  const { id } = useParams()
  const navigate = useNavigate()
  const isAdmin = localStorage.getItem('role') === 'admin'

  const [tree, setTree] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qr, setQr] = useState(null)
  const [nearby, setNearby] = useState([])
  const [sameSpecies, setSameSpecies] = useState([])
  const [imgFailed, setImgFailed] = useState(false)
  const [images, setImages] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [showQRAnim, setShowQRAnim] = useState(false)

  useEffect(() => {
    setLoading(true)
    setImgFailed(false)

    // QR scan opening animation
    const isQRScan =
      !document.referrer ||
      !document.referrer.includes(window.location.hostname)

    if (isQRScan) setShowQRAnim(true)

    getTree(id)
      .then(({ data: t }) => {
        setTree(t)

        if (t.botanical_name) {
          getTrees({ search: t.botanical_name })
            .then(({ data }) => setSameSpecies(data.filter(x => x.tree_id !== id)))
            .catch(() => setSameSpecies([]))
        }
      })
      .catch(() => setTree(null))
      .finally(() => setLoading(false))

    // QR code data
    getTreeQR(id)
      .then(({ data }) => setQr(data.qr))
      .catch(() => setQr(null))

    getNearbyTrees(id, 100)
      .then(({ data }) => setNearby(data))
      .catch(() => setNearby([]))

    getTreeImages(id)
      .then(({ data }) => setImages(data))
      .catch(() => setImages([]))
  }, [id])

  const handleAddImage = async url => {
    try {
      const { data } = await addTreeImage(id, {
        image_url: url,
        is_primary: images.length === 0
      })
      setImages(prev => [...prev, data])
    } catch {
      alert('Failed to add image')
    }
  }

  const handleDeleteImage = async imgId => {
    if (!window.confirm('Delete this image?')) return

    try {
      await deleteTreeImage(id, imgId)
      setImages(prev => prev.filter(i => i.id !== imgId))
    } catch {
      alert('Failed to delete image')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="text-4xl"
        >
          🌿
        </motion.div>
      </div>
    )
  }

  if (!tree) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-semibold text-gray-700">Tree not found</p>
        <button className="btn-primary" onClick={() => navigate('/trees')}>
          Back to Trees
        </button>
      </div>
    )
  }

  const heroImage =
    (!imgFailed && tree.image_link ? tree.image_link : null) ||
    tree.species_image_url ||
    null

  const ecologyItems = [
    ['Ecological Importance', tree.ecological_importance],
    ['Medicinal Uses', tree.medicinal_uses],
    ['Economic Uses', tree.economic_uses],
    ['Environmental Benefits', tree.environmental_benefits],
    ['Wildlife Supported', tree.wildlife_supported],
    ['Cultural Significance', tree.cultural_significance]
  ]
    .filter(([, content]) => content)
    .map(([title, content]) => ({ title, content }))

  return (
    <div>

      {showQRAnim && tree && (
        <QRScanAnimation
          tree={tree}
          onDone={() => setShowQRAnim(false)}
        />
      )}

      {/* Hero */}
      <div className="relative min-h-[45vh] flex flex-col justify-end overflow-hidden">
        <div className="absolute inset-0">
          {heroImage && !imgFailed ? (
            <img
              src={heroImage}
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
              alt=""
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-9xl"
              style={{ background: 'linear-gradient(135deg, #1a3618, #2d5a27)' }}
            >
              🌳
            </div>
          )}

          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%)'
            }}
          />
        </div>

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all"
          style={{
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.25)'
          }}
        >
          ← Back
        </button>

        <div className="relative z-10 max-w-5xl mx-auto px-4 pb-10 w-full">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-2 leading-tight">
              {tree.common_name}
            </h1>

            {tree.tamil_name && (
              <p
                className="text-gray-200 mb-1 font-bold"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.4rem' }}
              >
                {tree.tamil_name}
              </p>
            )}

            <p className="italic text-gray-300 mb-4" style={{ fontSize: '1.15rem' }}>
              {tree.botanical_name}
            </p>

            <div className="flex flex-wrap gap-2">
              <span
                className="badge text-white"
                style={{
                  background: 'rgba(45,90,39,0.7)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(82,160,67,0.4)'
                }}
              >
                {tree.area}
              </span>

              {[
                [tree.native_exotic, 'rgba(0,0,0,0.4)', 'rgba(255,255,255,0.2)'],
                [tree.conservation_status, 'rgba(180,40,40,0.6)', 'rgba(255,100,100,0.3)'],
                [tree.tree_id, 'rgba(0,0,0,0.4)', 'rgba(255,255,255,0.2)'],
                [tree.family, 'rgba(0,0,0,0.4)', 'rgba(255,255,255,0.2)']
              ].map(([value, background, border]) =>
                value ? (
                  <span
                    key={value}
                    className="badge text-white"
                    style={{
                      background,
                      backdropFilter: 'blur(8px)',
                      border: `1px solid ${border}`
                    }}
                  >
                    {value}
                  </span>
                ) : null
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Campus presence */}
      <RevealSection delay={0.05}>
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <div
            className="relative overflow-hidden rounded-2xl p-6"
            style={{
              background: dark
                ? 'linear-gradient(135deg, #142015, #1d2b1d)'
                : 'linear-gradient(135deg, #f1f8ef, #e7f2e4)',
              border: `1px solid ${dark ? '#304a30' : '#d5e6d0'}`,
              boxShadow: '0 8px 28px rgba(45,90,39,0.08)'
            }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ color: dark ? '#81c784' : '#356b31' }}
                >
                  On Sona Campus
                </p>
                <p
                  className="text-4xl font-bold mt-2"
                  style={{ color: dark ? '#ffffff' : '#172016' }}
                >
                  {sameSpecies.length + 1}
                </p>
                <p className="text-sm mt-1" style={{ color: dark ? '#9da7b0' : '#667064' }}>
                  Trees of this species recorded on campus
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  document.getElementById('campus-map')?.scrollIntoView({ behavior: 'smooth' })
                }
                className="self-start sm:self-center text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
                style={{
                  color: dark ? '#b7e3b1' : '#356b31',
                  background: dark ? 'rgba(129,199,132,0.12)' : '#ffffff',
                  border: `1px solid ${dark ? '#3c5d3c' : '#cfe1ca'}`
                }}
              >
                View on campus map →
              </button>
            </div>
          </div>
        </div>
      </RevealSection>

      {/* O₂ & CO₂ */}
      <div className="max-w-5xl mx-auto px-4 pt-5">
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              label: 'O₂ Produced',
              value: tree.o2_produced_daily,
              icon: '🌿',
              molecule: 'O₂',
              unitColor: dark ? '#86efac' : '#15803d',
              valueColor: dark ? '#bbf7d0' : '#166534',
              background: dark
                ? 'linear-gradient(135deg, rgba(22,101,52,0.25), rgba(34,197,94,0.08))'
                : 'linear-gradient(135deg, #f0fdf4, #dcfce7)',
              border: dark ? 'rgba(74,222,128,0.2)' : '#bbf7d0'
            },
            {
              label: 'CO₂ Absorbed',
              value: tree.co2_absorbed_daily,
              icon: '🌎',
              molecule: 'CO₂',
              unitColor: dark ? '#93c5fd' : '#1d4ed8',
              valueColor: dark ? '#bfdbfe' : '#1e40af',
              background: dark
                ? 'linear-gradient(135deg, rgba(30,64,175,0.25), rgba(59,130,246,0.08))'
                : 'linear-gradient(135deg, #eff6ff, #dbeafe)',
              border: dark ? 'rgba(96,165,250,0.2)' : '#bfdbfe'
            }
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 + i * 0.1 }}
              className="relative overflow-hidden rounded-2xl p-4"
              style={{
                background: item.background,
                border: `1px solid ${item.border}`,
                boxShadow: `0 6px 20px rgba(${i ? '59,130,246' : '34,197,94'},0.08)`
              }}
            >
              <div className="absolute -right-4 -top-5 text-6xl opacity-10">{item.molecule}</div>

              <div className="flex items-center gap-2 mb-2">
                <span
                  className="flex items-center justify-center w-8 h-8 rounded-full"
                  style={{ background: dark ? 'rgba(255,255,255,0.08)' : '#ffffff88' }}
                >
                  {item.icon}
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: item.unitColor }}>
                    {item.label}
                  </p>
                  <p className="text-[10px]" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                    Per day
                  </p>
                </div>
              </div>

              <p className="text-xl sm:text-2xl font-bold" style={{ color: item.valueColor }}>
                {item.value || '—'}
              </p>
              <p className="text-xs font-medium mt-0.5" style={{ color: item.unitColor }}>
                kg / day
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">

        {tree.general_description && (
          <RevealSection delay={0.05}>
            <div className="card p-6">
              <p
                className="leading-relaxed"
                style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: '1.1rem',
                  color: dark ? '#8b949e' : '#4b5563'
                }}
              >
                {tree.general_description}
              </p>
            </div>
          </RevealSection>
        )}

        {tree.interesting_facts && (
          <RevealSection delay={0.1}>
            <div
              className="relative overflow-hidden rounded-2xl p-6"
              style={{
                background: 'linear-gradient(135deg, #1a3618, #2d5a27)',
                boxShadow: '0 8px 32px rgba(45,90,39,0.3)'
              }}
            >
              <div className="absolute top-0 right-0 text-8xl opacity-10 leading-none">💡</div>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: '#81c784' }}>
                Did you know?
              </p>
              <p
                className="text-white leading-relaxed"
                style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem' }}
              >
                {tree.interesting_facts}
              </p>
            </div>
          </RevealSection>
        )}

        {/* Campus map */}
        {tree.latitude && tree.longitude && (
          <RevealSection>
            <div id="campus-map" className="card overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100">
                <h2 className="font-semibold" style={{ color: dark ? '#e6edf3' : '#1f2937' }}>
                  📍 Location on Campus
                </h2>
              </div>

              <div style={{ height: 320, position: 'relative', zIndex: 0 }}>
                <MapContainer
                  center={[tree.latitude, tree.longitude]}
                  zoom={19}
                  style={{ height: '100%', width: '100%' }}
                  maxZoom={22}
                >
                  <LayersControl position="topright">
                    <LayersControl.BaseLayer name="Street">
                      <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution="© OpenStreetMap contributors"
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

                  <Marker position={[tree.latitude, tree.longitude]} icon={primaryIcon}>
                    <Popup>
                      <strong>{tree.common_name}</strong><br />
                      {tree.tree_id}
                    </Popup>
                  </Marker>

                  {sameSpecies.map(t =>
                    t.latitude && t.longitude ? (
                      <Marker
                        key={t.tree_id}
                        position={[t.latitude, t.longitude]}
                        icon={sameSpeciesIcon}
                      >
                        <Popup>
                          <Link
                            to={`/trees/${t.tree_id}`}
                            style={{ color: '#2d5a27', fontWeight: 600 }}
                          >
                            {t.common_name}
                          </Link>
                          <br />
                          {t.tree_id}
                        </Popup>
                      </Marker>
                    ) : null
                  )}
                </MapContainer>
              </div>

              <div
                className="px-5 py-2 text-xs border-t border-gray-100"
                style={{ color: dark ? '#6e7681' : '#9ca3af' }}
              >
                🔴 This tree &nbsp;|&nbsp; 🟢 Same species ({sameSpecies.length + 1} of this species on campus)
              </div>
            </div>
          </RevealSection>
        )}

        {/* Nearby */}
        {nearby.length > 0 && (
          <RevealSection>
            <div className="card p-5">
              <h2 className="font-semibold mb-3" style={{ color: dark ? '#e6edf3' : '#1f2937' }}>
                🌲 Nearby Trees ({nearby.length})
              </h2>

              <div className="space-y-1">
                {nearby.map(t => (
                  <Link
                    key={t.tree_id}
                    to={`/trees/${t.tree_id}`}
                    className="flex items-center justify-between p-3 rounded-xl transition-colors"
                    style={{ color: dark ? '#e6edf3' : 'inherit' }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: dark ? '#e6edf3' : '#111827' }}>
                        {t.common_name}
                      </p>
                      <p className="text-xs italic" style={{ color: '#8b949e' }}>
                        {t.botanical_name}
                      </p>
                    </div>
                    <span className="text-xs" style={{ color: '#8b949e' }}>{t.tree_id}</span>
                  </Link>
                ))}
              </div>
            </div>
          </RevealSection>
        )}

        {/* Ecology & Uses */}
        {ecologyItems.length > 0 && (
          <RevealSection delay={0.05}>
            <section className="card overflow-hidden">
              <div
                className="px-6 pt-7 pb-6 border-b"
                style={{ borderColor: dark ? '#30363d' : '#e5e7eb' }}
              >
                <h2
                  className="font-display text-3xl font-bold"
                  style={{ color: dark ? '#e6edf3' : '#172016' }}
                >
                  Ecology & Uses
                </h2>
              </div>

              <div className="grid md:grid-cols-2">
                {[
                  ['Ecology', ['Ecological Importance', 'Environmental Benefits', 'Wildlife Supported'], 1],
                  ['Uses & Heritage', ['Medicinal Uses', 'Economic Uses', 'Cultural Significance'], 4]
                ].map(([heading, titles, start], column) => (
                  <div
                    key={heading}
                    className="p-6 space-y-4"
                    style={{
                      borderRight:
                        column === 0 && typeof window !== 'undefined' && window.innerWidth >= 768
                          ? `1px solid ${dark ? '#30363d' : '#e5e7eb'}`
                          : 'none'
                    }}
                  >
                    <p
                      className="text-xs font-bold uppercase tracking-widest mb-5"
                      style={{ color: dark ? '#81c784' : '#2d6a32' }}
                    >
                      {heading}
                    </p>

                    {ecologyItems
                      .filter(item => titles.includes(item.title))
                      .map((item, index) => (
                        <EcologyInfoCard
                          key={item.title}
                          number={String(index + start).padStart(2, '0')}
                          title={item.title}
                          content={item.content}
                          dark={dark}
                        />
                      ))}
                  </div>
                ))}
              </div>
            </section>
          </RevealSection>
        )}

        {/* Taxonomy */}
        {(tree.kingdom || tree.family || tree.genus) && (
          <RevealSection>
            <div className="card p-6">
              <h2
                className="font-display text-2xl font-bold mb-6"
                style={{ color: dark ? '#e6edf3' : '#111827' }}
              >
                🔬 Taxonomy
              </h2>
              <TaxonomyTree tree={tree} dark={dark} />
            </div>
          </RevealSection>
        )}

        {/* Gallery */}
        <RevealSection>
          <div className="card p-5">
            <h2 className="font-semibold mb-4" style={{ color: dark ? '#e6edf3' : '#1f2937' }}>
              📷 Gallery
            </h2>

            {images.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {images.map((img, i) => (
                  <div
                    key={img.id}
                    className="relative group rounded-xl overflow-hidden"
                    style={{ aspectRatio: '4/3' }}
                  >
                    <img
                      src={img.image_url}
                      alt=""
                      className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
                      onClick={() => setLightbox(i)}
                    />

                    {img.is_primary && (
                      <span
                        className="absolute top-2 left-2 badge text-white text-xs"
                        style={{
                          background: 'rgba(45,90,39,0.8)',
                          backdropFilter: 'blur(8px)'
                        }}
                      >
                        Primary
                      </span>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{
                          background: 'rgba(200,0,0,0.75)',
                          backdropFilter: 'blur(4px)'
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm mb-4" style={{ color: '#8b949e' }}>
                No photos uploaded yet.
              </p>
            )}

            {isAdmin && (
              <div
                className="pt-4"
                style={{ borderTop: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}
              >
                <p
                  className="text-sm font-medium mb-2"
                  style={{ color: dark ? '#8b949e' : '#4b5563' }}
                >
                  Add photo
                </p>
                <ImageUpload label="Upload image" onUploaded={handleAddImage} />
              </div>
            )}
          </div>
        </RevealSection>

        {/* =========================================================
            QR CODE — COMMENTED OUT FOR NOW
            Uncomment this entire block when you want the QR section.
            ========================================================= */}
        {/*
        {qr && (
          <RevealSection>
            <div className="card p-6 flex flex-col sm:flex-row items-center gap-6">
              <img
                src={qr}
                alt="QR Code"
                className="w-36 h-36 rounded-xl"
              />

              <div>
                <h2
                  className="font-semibold mb-1"
                  style={{ color: dark ? '#e6edf3' : '#1f2937' }}
                >
                  QR Code
                </h2>

                <p className="text-sm mb-4" style={{ color: '#8b949e' }}>
                  Scan to open this tree's detail page.
                </p>

                {isAdmin && (
                  <a href={qr} download={`${tree.tree_id}-qr.png`}>
                    <button className="btn-primary text-sm">
                      ⬇ Download QR
                    </button>
                  </a>
                )}
              </div>
            </div>
          </RevealSection>
        )}
        */}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {lightbox !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.9)' }}
            onClick={() => setLightbox(null)}
          >
            <div
              onClick={e => e.stopPropagation()}
              className="relative max-w-3xl w-full"
            >
              <img
                src={images[lightbox].image_url}
                alt=""
                className="w-full max-h-[80vh] object-contain rounded-2xl"
              />

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setLightbox(i => Math.max(0, i - 1))}
                  disabled={lightbox === 0}
                  className="btn-secondary text-white border-white/30 disabled:opacity-30"
                >
                  ← Prev
                </button>

                <span className="text-white text-sm">
                  {lightbox + 1} / {images.length}
                </span>

                <button
                  onClick={() => setLightbox(i => Math.min(images.length - 1, i + 1))}
                  disabled={lightbox === images.length - 1}
                  className="btn-secondary text-white border-white/30 disabled:opacity-30"
                >
                  Next →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
