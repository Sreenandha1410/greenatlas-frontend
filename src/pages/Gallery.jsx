import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTrees } from '../api';

const TABS = [
  { key: 'photos', label: '📷 Photos'    },
  { key: 'videos', label: '🎥 Videos'    },
  { key: '360',    label: '🌐 360° View' },
];

export default function Gallery() {
  const [trees, setTrees]     = useState([]);
  const [failed, setFailed]   = useState({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('photos');

  useEffect(() => {
    getTrees().then(r => setTrees(r.data.filter(t => t.image_link)))
              .finally(() => setLoading(false));
  }, []);

  const visible = trees.filter(t => !failed[t.tree_id]);

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
          : <>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {visible.length} photos
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {visible.map(t => (
                  <Link key={t.tree_id} to={`/trees/${t.tree_id}`}
                    className="card overflow-hidden hover:shadow-md hover:-translate-y-1
                               transition-all duration-200 group">
                    <div className="h-48 overflow-hidden">
                      <img src={t.image_link} alt={t.common_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={() => setFailed(f => ({ ...f, [t.tree_id]: true }))} />
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                        {t.common_name}
                      </p>
                      <p className="text-xs italic text-gray-400 truncate">{t.botanical_name}</p>
                      <p className="text-xs text-gray-400 mt-1">📍 {t.area}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
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