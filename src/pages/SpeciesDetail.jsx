import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getSpeciesOne, getTrees } from '../api';
import TaxonomyTree from '../components/TaxonomyTree'
import { useDarkMode } from '../context/DarkModeContext'
import { motion } from 'framer-motion'

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

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function SpeciesDetail() {
  const [dark] = useDarkMode()
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [species, setSpecies] = useState(null);
  const [trees, setTrees]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSpeciesOne(id)
      .then(r => {
        setSpecies(r.data);
        const botName = `${r.data.genus} ${r.data.species}`;
        return getTrees({ search: botName });
      })
      .then(r => setTrees(r.data))
      .catch(() => setSpecies(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Loading…</p>
    </div>
  );

  if (!species) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Species not found</p>
      <button className="btn-primary" onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const mapCenter = trees.length > 0
    ? [trees[0].latitude, trees[0].longitude]
    : [11.678, 78.125];

  const ecologyItems = [
    { label: '🦋 Wildlife Supported',     value: species.wildlife_supported      },
    { label: '🌱 Ecological Importance',  value: species.ecological_importance   },
    { label: '💊 Medicinal Uses',         value: species.medicinal_uses          },
    { label: '💰 Economic Uses',          value: species.economic_uses           },
    { label: '🌬️ Environmental Benefits', value: species.environmental_benefits  },
    { label: '🎭 Cultural Significance',  value: species.cultural_significance   },
    { label: '✨ Interesting Facts',      value: species.interesting_facts       },
  ].filter(i => i.value);

  const quickStats = [
    { label: 'Family',      value: species.family            },
    { label: 'Avg Height',  value: species.avg_height        },
    { label: 'Lifespan',    value: species.lifespan          },
    { label: 'Growth Rate', value: species.growth_rate       },
    { label: 'Flowering',   value: species.flowering_season  },
    { label: 'Fruiting',    value: species.fruiting_season   },
    { label: 'Pollination', value: species.pollination_method},
  ].filter(i => i.value);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      <button onClick={() => navigate(-1)}
        className="text-forest-600 dark:text-forest-300 text-sm font-medium hover:underline">
        ← Back
      </button>

      {/* ── Header ── */}
      <div className="card overflow-hidden">
        <div className="md:flex gap-6 p-6">
          {/* Image */}
          <div className="flex-shrink-0 w-full md:w-56 h-48 rounded-xl overflow-hidden
                          bg-forest-50 dark:bg-forest-950 flex items-center justify-center text-6xl mb-4 md:mb-0">
            {species.image_url
              ? <img src={species.image_url} alt={species.common_name}
                  className="w-full h-full object-cover" />
              : '🌿'}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap gap-2 mb-3">
              {species.native_exotic && (
                <span className="badge" style={{
                  background: species.native_exotic === 'Native' ? '#d1fae5' : '#fef3c7',
                  color:      species.native_exotic === 'Native' ? '#065f46' : '#92400e'
                }}>{species.native_exotic}</span>
              )}
              {species.conservation_status && (
                <span className="badge" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  {species.conservation_status}
                </span>
              )}
            </div>

            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              {species.common_name}
            </h1>
            {species.tamil_name && (
              <p className="text-gray-500 dark:text-gray-400 mt-0.5">Tamil: {species.tamil_name}</p>
            )}
            <p className="italic text-gray-400 text-sm mt-1 mb-3">
              {species.genus} {species.species}
            </p>
            {species.general_description && (
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {species.general_description}
              </p>
            )}
          </div>
        </div>

        {/* Quick stats */}
        {quickStats.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 px-6 pb-6">
            {quickStats.map(({ label, value }) => (
              <div key={label} className="rounded-lg p-3"
                style={{ background: dark ? '#21262d' : '#f0f7ee' }}>
                <p className="text-xs" style={{ color: '#8b949e' }}>{label}</p>
                <p className="font-semibold text-sm mt-0.5"
                  style={{ color: dark ? '#e6edf3' : '#1f2937' }}>{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Ecology & Uses ── */}
      {ecologyItems.length > 0 && (
        <div>
          <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Ecology & Uses</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {ecologyItems.map(({ label, value }) => (
              <div key={label} className="card p-5">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-2 text-sm">{label}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {(species.kingdom || species.family || species.genus) && (
        <RevealSection>
          <div className="card p-6">
            <h2 className="font-display text-2xl font-bold mb-6"
              style={{ color: dark ? '#e6edf3' : '#111827' }}>🔬 Taxonomy</h2>
            <TaxonomyTree tree={species} dark={dark} />
          </div>
        </RevealSection>
      )}

      {/* ── On Campus ── */}
      {trees.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-800">
            <h2 className="font-semibold text-gray-800 dark:text-gray-100">
              📍 On Campus ({trees.length} trees)
            </h2>
          </div>

          {/* Map */}
          <div style={{ height: 280 }}>
            <MapContainer center={mapCenter} zoom={16}
              style={{ height: '100%', width: '100%' }} maxZoom={22}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={22} maxNativeZoom={19}
                attribution="© OpenStreetMap contributors"
              />
              {trees.map(t => t.latitude && t.longitude && (
                <Marker key={t.tree_id} position={[t.latitude, t.longitude]}>
                  <Popup>
                    <strong>{t.common_name}</strong><br />{t.area}<br />
                    <Link to={`/trees/${t.tree_id}`} style={{ color: '#2d5a27', fontWeight: 600 }}>
                      View →
                    </Link>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* Tree list */}
          <div className="divide-y divide-gray-100 dark:divide-gray-800 max-h-72 overflow-y-auto">
            {trees.map(t => (
              <Link key={t.tree_id} to={`/trees/${t.tree_id}`}
                className="flex items-center justify-between px-5 py-3
                           hover:bg-forest-50 dark:hover:bg-forest-950 transition-colors">
                <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                  {t.tree_id}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{t.area}</span>
                <span className="text-sm text-forest-600 dark:text-forest-300">View →</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}