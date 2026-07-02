import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TABS = [
  { key: 'photos', label: '📷 Photos'    },
  { key: 'videos', label: '🎥 Videos'    },
  { key: '360',    label: '🌐 360° View' },
];

export default function Gallery() {
  const [images, setImages]   = useState([]);
  const [failed, setFailed]   = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('photos');

  useEffect(() => {
    axios.get(`${BASE}/trees/gallery`)
      .then(r => setImages(r.data))
      .finally(() => setLoading(false));
  }, []);

  const visible = images.filter(img => !failed[img.image_url]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
        Campus Gallery
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">
        Visual documentation of campus flora
      </p>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
              ${tab === key
                ? 'border-forest-500 text-forest-600 dark:text-forest-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Photos */}
      {tab === 'photos' && (
        loading
          ? <p className="text-gray-400">Loading…</p>
          : visible.length === 0
            ? (
              <div className="card p-16 text-center">
                <div className="text-5xl mb-4">📷</div>
                <h3 className="font-semibold text-forest-600 dark:text-forest-300 text-lg mb-2">
                  No Photos Yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Upload tree images from the Admin panel to see them here.
                </p>
              </div>
            )
            : (
              <>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {visible.length} photos
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {visible.map((img, i) => (
                    <Link key={i} to={`/trees/${img.tree_id}`}
                      className="card overflow-hidden hover:shadow-md hover:-translate-y-1
                                 transition-all duration-200 group">
                      <div className="h-48 overflow-hidden">
                        <img src={img.image_url} alt={img.caption || img.common_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={() => setFailed(f => ({ ...f, [img.image_url]: true }))} />
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                          {img.common_name}
                        </p>
                        <p className="text-xs italic text-gray-400 truncate">{img.botanical_name}</p>
                        {img.caption && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {img.caption}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">📍 {img.area}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )
      )}

      {/* Placeholder tabs */}
      {(tab === 'videos' || tab === '360') && (
        <div className="card p-16 text-center">
          <div className="text-5xl mb-4">{tab === 'videos' ? '🎥' : '🌐'}</div>
          <h3 className="font-semibold text-forest-600 dark:text-forest-300 text-lg mb-2">
            {tab === 'videos' ? 'Videos Coming Soon' : '360° View Coming Soon'}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {tab === 'videos'
              ? 'Short video clips of trees, seasonal changes, and campus nature walks will be added here.'
              : 'Immersive 360° photographs of key campus areas will be available here.'}
          </p>
        </div>
      )}
    </div>
  );
}
