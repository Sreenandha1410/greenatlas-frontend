import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, LayersControl } from 'react-leaflet';
import { motion } from 'framer-motion';
import L from 'leaflet';
import { getSpeciesOne, getTrees } from '../api';
import { useDarkMode } from '../context/DarkModeContext';
import { createStylizedPin, getSpeciesColor, getBotanicalMonogram } from '../utils/mapPins';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export default function SpeciesDetail() {
  const [dark] = useDarkMode();
  const { name } = useParams();
  const navigate = useNavigate();

  const [species, setSpecies] = useState(null);
  const [trees, setTrees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSpeciesOne(name),
      getTrees()
    ]).then(([sRes, tRes]) => {
      setSpecies(sRes.data);
      const bot = `${sRes.data.genus || ''} ${sRes.data.species || ''}`.trim().toLowerCase();
      const com = (sRes.data.common_name || '').toLowerCase();
      const specId = (sRes.data.species_id || '').toLowerCase();

      const matched = tRes.data.filter(t => {
        const tBot = (t.botanical_name || '').toLowerCase();
        const tCom = (t.common_name || '').toLowerCase();
        return (bot && tBot.includes(bot)) || (com && tCom === com) || (specId && t.tree_id?.toLowerCase().includes(specId));
      });
      setTrees(matched);
    }).catch(err => {
      console.error('Failed to load species detail:', err);
    }).finally(() => setLoading(false));
  }, [name]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="text-4xl mb-2 animate-bounce">🍃</div>
          <p className="text-gray-500">Loading species data...</p>
        </div>
      </div>
    );
  }

  if (!species) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4">Species Not Found</h2>
        <button onClick={() => navigate('/species')} className="btn-primary">
          Back to Species Catalog
        </button>
      </div>
    );
  }

  const validTrees = trees.filter(t => t.latitude && t.longitude && !isNaN(t.latitude) && !isNaN(t.longitude));
  const center = validTrees.length > 0
    ? [
        validTrees.reduce((s, t) => s + parseFloat(t.latitude), 0) / validTrees.length,
        validTrees.reduce((s, t) => s + parseFloat(t.longitude), 0) / validTrees.length
      ]
    : [13.0827, 80.2707];

  const pinColor = getSpeciesColor(species.genus + ' ' + species.species);
  const monogram = getBotanicalMonogram(`${species.genus} ${species.species}`, species.common_name);
  const isPlant = species.flora_type === 'plant';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Back button & Title */}
      <div>
        <button
          onClick={() => navigate('/species')}
          className="text-xs font-semibold text-forest-600 dark:text-forest-400 hover:underline flex items-center gap-1 mb-2"
        >
          ← Back to Species List
        </button>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-extrabold text-gray-900 dark:text-gray-100">
              {species.common_name}
            </h1>
            <p className="text-lg italic text-forest-700 dark:text-forest-300 font-serif">
              {species.genus} {species.species}
            </p>
          </div>
          <span className="text-sm font-mono font-bold px-3 py-1 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300">
            ID: {species.species_id}
          </span>
        </div>
      </div>

      {/* Campus Distribution Map with Satellite View */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <span>🗺️</span> Campus Distribution ({validTrees.length} Recorded Locations)
          </h3>
          <span className="text-xs text-gray-400">
            Switch between Street & Satellite layers in top-right
          </span>
        </div>

        <div className="h-[380px] rounded-xl overflow-hidden relative border border-gray-200 dark:border-gray-800">
          <MapContainer
            center={center}
            zoom={17}
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

            {validTrees.map(t => (
              <Marker
                key={t.tree_id}
                position={[parseFloat(t.latitude), parseFloat(t.longitude)]}
                icon={createStylizedPin({
                  color: pinColor,
                  label: monogram,
                  isPlant
                })}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <p className="font-bold">{t.common_name}</p>
                    <p className="font-mono text-forest-600 font-semibold mb-1">{t.tree_id}</p>
                    <p className="text-gray-500 mb-2">Area: {t.area}</p>
                    <Link to={`/trees/${t.tree_id}`} className="font-semibold text-forest-600 hover:underline">
                      View Tree →
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>

      {/* Botanical Info Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Taxonomy & Origin</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Family:</strong> {species.family || '—'}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Order:</strong> {species.order || '—'}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Origin:</strong> {species.origin || '—'} ({species.native_exotic || 'Native'})</p>
          <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Conservation Status:</strong> {species.conservation_status || 'Least Concern'}</p>
        </div>

        <div className="card p-6 space-y-3">
          <h3 className="font-bold text-gray-900 dark:text-gray-100 border-b pb-2">Ecological & Cultural Impact</h3>
          <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Wildlife Supported:</strong> {species.wildlife_supported || '—'}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Medicinal Uses:</strong> {species.medicinal_uses || '—'}</p>
          <p className="text-xs text-gray-600 dark:text-gray-400"><strong>Ecological Importance:</strong> {species.ecological_importance || '—'}</p>
        </div>
      </div>
    </div>
  );
}
