import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getTrees, getAreas } from '../api';
import { useDarkMode } from '../context/DarkModeContext';
import TreeCard from '../components/TreeCard';

function SpeciesGroupCard({ species, trees, dark }) {
  const [expanded, setExpanded] = useState(false);
  const representative = trees[0];

  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        background: dark ? '#1c2128' : '#ffffff',
        border: `1px solid ${dark ? '#30363d' : '#e5e7eb'}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}
    >
      <div className="relative cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div
          className="h-44 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #d9edcf, #f0f7ee)' }}
        >
          {representative.image_link || representative.image_url ? (
            <img
              src={representative.image_link || representative.image_url}
              alt={species}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🌿</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <p className="font-semibold text-sm truncate">{species}</p>
          <p className="text-xs italic opacity-75 truncate">{representative.botanical_name}</p>
        </div>
        <span
          className="absolute top-2 right-2 badge text-white text-xs"
          style={{ background: 'rgba(45,90,39,0.8)', backdropFilter: 'blur(8px)' }}
        >
          {trees.length} trees
        </span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
            style={{ borderTop: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}
          >
            <div
              className="space-y-1 max-h-48 overflow-y-auto"
              style={{ background: dark ? '#1c2128' : '#ffffff', padding: '0.75rem' }}
            >
              {trees.map(t => (
                <Link
                  key={t.tree_id}
                  to={`/trees/${t.tree_id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm"
                  style={{ color: dark ? '#e6edf3' : '#374151' }}
                >
                  <span className="font-medium">{t.tree_id}</span>
                  <span style={{ color: '#8b949e' }} className="text-xs">{t.area}</span>
                  <span style={{ color: 'var(--color-forest-400)' }} className="text-xs">→</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function TreeList() {
  const [dark] = useDarkMode();
  const [searchParams] = useSearchParams();
  const [trees, setTrees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [areaFilter, setAreaFilter] = useState(searchParams.get('area') || '');
  const [familyFilter, setFamilyFilter] = useState('');
  const [groupBy, setGroupBy] = useState('individual');
  const [sortField, setSortField] = useState('tree_id');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('tiles');
  const [newOnly, setNewOnly] = useState(false);

  useEffect(() => {
    getTrees().then(r => setTrees(r.data));
    getAreas().then(r => setAreas(r.data.map(a => a.area)));
  }, []);

  const families = [...new Set(trees.map(t => t.family).filter(Boolean))].sort();

  let filtered = trees.filter(t => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      t.common_name?.toLowerCase().includes(q) ||
      t.botanical_name?.toLowerCase().includes(q) ||
      t.tree_id?.toLowerCase().includes(q);
    const matchArea = !areaFilter || t.area === areaFilter;
    const matchFamily = !familyFilter || t.family === familyFilter;
    return matchSearch && matchArea && matchFamily;
  });

  if (newOnly) {
    filtered = filtered.slice(0, 20);
  }

  filtered.sort((a, b) => {
    let valA = (a[sortField] || '').toString().toLowerCase();
    let valB = (b[sortField] || '').toString().toLowerCase();
    const cmp = valA.localeCompare(valB, undefined, { numeric: true });
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const grouped = filtered.reduce((acc, t) => {
    const key = t.common_name || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Campus Trees Catalog
      </h1>

      {/* Explorer Filter & Sorting Bar */}
      <div className="card p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input flex-1 min-w-48 text-sm"
            placeholder="Search by name, ID or botanical..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={iStyle}
          />

          <select
            className="input text-sm w-44"
            value={areaFilter}
            onChange={e => setAreaFilter(e.target.value)}
            style={iStyle}
          >
            <option value="">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>

          <select
            className="input text-sm w-44"
            value={familyFilter}
            onChange={e => setFamilyFilter(e.target.value)}
            style={iStyle}
          >
            <option value="">All Families</option>
            {families.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {(search || areaFilter || familyFilter || newOnly) && (
            <button
              className="text-xs text-red-500 hover:text-red-700 font-medium"
              onClick={() => {
                setSearch('');
                setAreaFilter('');
                setFamilyFilter('');
                setNewOnly(false);
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Windows Explorer Style Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500">Sort by:</span>
              <select
                className="input text-xs py-1 px-2 rounded-lg"
                style={iStyle}
                value={sortField}
                onChange={e => setSortField(e.target.value)}
              >
                <option value="tree_id">Tree ID (Recent)</option>
                <option value="common_name">Common Name</option>
                <option value="botanical_name">Botanical Name</option>
                <option value="area">Campus Area</option>
                <option value="family">Family</option>
              </select>

              <button
                onClick={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
                className="px-2 py-1 rounded-lg border border-gray-300 dark:border-[#30363d] font-semibold"
              >
                {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
              </button>
            </div>

            <button
              onClick={() => setNewOnly(!newOnly)}
              className={`px-2.5 py-1 rounded-lg font-semibold border transition-colors ${
                newOnly
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#30363d]'
              }`}
            >
              ✨ New Additions
            </button>
          </div>

          <div className="flex items-center gap-3">
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

            <span className="text-gray-400">
              Showing {filtered.length} trees
            </span>
          </div>
        </div>
      </div>

      {/* Results View */}
      {viewMode === 'tiles' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map(tree => (
            <TreeCard key={tree.tree_id} tree={tree} />
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-forest-500)' }}>
                {['Tree ID', 'Common Name', 'Botanical Name', 'Area', 'Family'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(t => (
                <tr
                  key={t.tree_id}
                  className="transition-colors hover:bg-forest-50/50 dark:hover:bg-[#21262d]"
                  style={{ background: dark ? '#1c2128' : '#fff' }}
                >
                  <td className="px-4 py-3 font-mono font-bold text-xs text-forest-600 dark:text-forest-400">
                    <Link to={`/trees/${t.tree_id}`}>{t.tree_id}</Link>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                    <Link to={`/trees/${t.tree_id}`}>{t.common_name}</Link>
                  </td>
                  <td className="px-4 py-3 italic text-gray-500">{t.botanical_name}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{t.area}</td>
                  <td className="px-4 py-3 text-gray-500">{t.family}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
