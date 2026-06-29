{/*
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAreas, getTrees } from '../api';

export default function AreaList() {
  const [areas, setAreas]   = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    getAreas().then(r => setAreas(r.data));
    getTrees().then(r => {
      const c = {};
      r.data.forEach(t => { c[t.area] = (c[t.area] || 0) + 1; });
      setCounts(c);
    });
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
        Campus Areas
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mt-1 mb-8">Browse trees by location</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {areas.map(a => (
          <Link key={a.area} to={`/areas/${encodeURIComponent(a.area)}`}
            className="card p-5 text-center hover:shadow-md hover:-translate-y-1
                       transition-all duration-200 cursor-pointer">
            <div className="text-3xl mb-2">🌿</div>
            <h3 className="font-semibold text-forest-600 dark:text-forest-300 text-sm">
              {a.area}
            </h3>
            <p className="text-gray-400 text-xs mt-1">{counts[a.area] || 0} trees</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
*/}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAreas, getTrees } from '../api';
import { useDarkMode } from '../context/DarkModeContext'

export default function AreaList() {
  const [dark] = useDarkMode()
  const [areas, setAreas]   = useState([]);
  const [counts, setCounts] = useState({});

  useEffect(() => {
    getAreas().then(r => setAreas(r.data));
    getTrees().then(r => {
      const c = {};
      r.data.forEach(t => { c[t.area] = (c[t.area] || 0) + 1; });
      setCounts(c);
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}>
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
          Campus Areas
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-10">
          Browse trees by campus location
        </p>
      </motion.div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
        {areas.map((a, i) => (
          <motion.div key={a.area}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.04 }}>
            <Link to={`/areas/${encodeURIComponent(a.area)}`}
              className="group block rounded-2xl overflow-hidden cursor-pointer"
              style={{
                boxShadow: dark
                  ? '6px 6px 16px rgba(0,0,0,0.4), -3px -3px 10px rgba(255,255,255,0.03)'
                  : '6px 6px 16px rgba(45,90,39,0.1), -3px -3px 10px rgba(255,255,255,0.9)',
                border: `1.5px solid ${dark ? '#30363d' : 'rgba(255,255,255,0.8)'}`,
                background: dark ? '#1c2128' : 'linear-gradient(145deg, #ffffff, #f2faf0)',
                transition: 'all 0.25s',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'none'}>

              {/* Image or placeholder */}
              <div className="h-32 overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #1a3618, #2d5a27)' }}>
                {a.image_url
                  ? <img src={a.image_url} alt={a.area}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🌳</div>
                }
                <div className="absolute inset-0"
                  style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }} />
                <span className="absolute bottom-2 right-2 text-xs text-white font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(45,90,39,0.75)', backdropFilter: 'blur(6px)' }}>
                  {counts[a.area] || 0} trees
                </span>
              </div>

              {/* Label */}
              <div className="p-3">
                <h3 className="font-semibold text-sm truncate"
                  style={{ color: dark ? '#e6edf3' : '#1f2937' }}>{a.area}</h3>
                {a.description
                  ? <p className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: '#8b949e' }}>{a.description}</p>
                  : <p className="text-xs mt-0.5"
                      style={{ color: 'var(--color-forest-400)' }}>Explore area →</p>
                }
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}