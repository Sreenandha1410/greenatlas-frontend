import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAreas, getTrees } from '../api';
import { useDarkMode } from '../context/DarkModeContext';

export default function AreaList() {
  const [dark] = useDarkMode();
  const [areas, setAreas] = useState([]);
  const [counts, setCounts] = useState({});
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('area');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('tiles');

  useEffect(() => {
    getAreas().then(r => setAreas(r.data));
    getTrees().then(r => {
      const c = {};
      r.data.forEach(t => {
        c[t.area] = (c[t.area] || 0) + 1;
      });
      setCounts(c);
    });
  }, []);

  let filtered = areas.filter(a =>
    !search ||
    a.area?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  filtered.sort((a, b) => {
    if (sortField === 'count') {
      const countA = counts[a.area] || 0;
      const countB = counts[b.area] || 0;
      return sortOrder === 'asc' ? countA - countB : countB - countA;
    }
    const valA = (a.area || '').toLowerCase();
    const valB = (b.area || '').toLowerCase();
    const cmp = valA.localeCompare(valB);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
          Campus Areas
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1 mb-6">
          Browse trees by mapped campus location
        </p>
      </motion.div>

      {/* Explorer Filter Bar */}
      <div className="card p-4 mb-8 flex flex-wrap items-center justify-between gap-3 text-xs">
        <input
          className="input flex-1 min-w-48 text-sm"
          placeholder="Filter campus areas..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={iStyle}
        />

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Sort by:</span>
            <select
              className="input text-xs py-1 px-2 rounded-lg"
              style={iStyle}
              value={sortField}
              onChange={e => setSortField(e.target.value)}
            >
              <option value="area">Area Name</option>
              <option value="count">Tree Count</option>
            </select>

            <button
              onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
              className="px-2 py-1 rounded-lg border border-gray-300 dark:border-[#30363d] font-semibold"
            >
              {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
            </button>
          </div>

          <div className="flex items-center border border-gray-300 dark:border-[#30363d] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('tiles')}
              className={`px-2.5 py-1 font-medium ${
                viewMode === 'tiles' ? 'bg-forest-600 text-white' : 'bg-transparent text-gray-500'
              }`}
            >
              🔲 Tiles
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 font-medium ${
                viewMode === 'list' ? 'bg-forest-600 text-white' : 'bg-transparent text-gray-500'
              }`}
            >
              📋 List
            </button>
          </div>
        </div>
      </div>

      {/* Results View */}
      {viewMode === 'tiles' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5">
          {filtered.map((a, i) => (
            <motion.div
              key={a.area}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
            >
              <Link
                to={`/areas/${encodeURIComponent(a.area)}`}
                className="group block rounded-2xl overflow-hidden cursor-pointer"
                style={{
                  boxShadow: dark
                    ? '6px 6px 16px rgba(0,0,0,0.4), -3px -3px 10px rgba(255,255,255,0.03)'
                    : '6px 6px 16px rgba(45,90,39,0.1), -3px -3px 10px rgba(255,255,255,0.9)',
                  border: `1.5px solid ${dark ? '#30363d' : 'rgba(255,255,255,0.8)'}`,
                  background: dark ? '#1c2128' : 'linear-gradient(145deg, #ffffff, #f2faf0)',
                  transition: 'all 0.25s'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'none'}
              >
                <div
                  className="h-32 overflow-hidden relative"
                  style={{ background: 'linear-gradient(135deg, #1a3618, #2d5a27)' }}
                >
                  {a.image_url ? (
                    <img
                      src={a.image_url}
                      alt={a.area}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl opacity-40">🌳</div>
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)' }}
                  />
                  <span
                    className="absolute bottom-2 right-2 text-xs text-white font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(45,90,39,0.75)', backdropFilter: 'blur(6px)' }}
                  >
                    {counts[a.area] || 0} trees
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="font-semibold text-sm truncate" style={{ color: dark ? '#e6edf3' : '#1f2937' }}>
                    {a.area}
                  </h3>
                  {a.description ? (
                    <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#8b949e' }}>{a.description}</p>
                  ) : (
                    <p className="text-xs mt-0.5 text-forest-500">Explore area →</p>
                  )}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-forest-500)' }}>
                {['Area Name', 'Tree Count', 'Description', 'Link'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(a => (
                <tr
                  key={a.area}
                  className="transition-colors hover:bg-forest-50/50 dark:hover:bg-[#21262d]"
                  style={{ background: dark ? '#1c2128' : '#fff' }}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{a.area}</td>
                  <td className="px-4 py-3 font-mono font-bold text-forest-600 dark:text-forest-400">
                    {counts[a.area] || 0} trees
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 max-w-sm truncate">{a.description || '—'}</td>
                  <td className="px-4 py-3">
                    <Link to={`/areas/${encodeURIComponent(a.area)}`} className="text-xs font-semibold text-forest-600 hover:underline">
                      View Area →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
