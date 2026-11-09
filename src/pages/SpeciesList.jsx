import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getSpecies } from '../api';
import { useDarkMode } from '../context/DarkModeContext';

export default function SpeciesList() {
  const [dark] = useDarkMode();
  const navigate = useNavigate();
  const [species, setSpecies] = useState([]);
  const [search, setSearch] = useState('');
  const [floraFilter, setFloraFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('');
  const [sortField, setSortField] = useState('common_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('list');
  const [newOnly, setNewOnly] = useState(false);

  useEffect(() => {
    getSpecies().then(r => setSpecies(r.data));
  }, []);

  const origins = [...new Set(species.map(s => s.native_exotic).filter(Boolean))].sort();

  let filtered = species.filter(s => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.common_name?.toLowerCase().includes(q) ||
      s.species?.toLowerCase().includes(q) ||
      s.species_id?.toLowerCase().includes(q) ||
      s.family?.toLowerCase().includes(q) ||
      s.genus?.toLowerCase().includes(q);
    const matchFlora = floraFilter === 'all' || s.flora_type === floraFilter;
    const matchOrigin = !originFilter || s.native_exotic === originFilter;
    return matchSearch && matchFlora && matchOrigin;
  });

  if (newOnly) {
    filtered = filtered.slice(0, 15);
  }

  filtered.sort((a, b) => {
    let valA = (a[sortField] || '').toString().toLowerCase();
    let valB = (b[sortField] || '').toString().toLowerCase();
    const cmp = valA.localeCompare(valB, undefined, { numeric: true });
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-6" style={{ color: dark ? '#e6edf3' : '#111827' }}>
        Species Taxonomy
      </h1>

      {/* Filter and Explorer Bar */}
      <div className="card p-4 mb-6 space-y-3">
        <div className="flex flex-wrap gap-3 items-center">
          <input
            className="input flex-1 min-w-48 text-sm"
            placeholder="Search species…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={iStyle}
          />

          <div className="flex gap-1 p-1 rounded-lg" style={{ background: dark ? '#21262d' : '#f3f4f6' }}>
            {[['all', 'All'], ['tree', '🌳 Trees'], ['plant', '🌿 Plants']].map(([v, l]) => (
              <button
                key={v}
                onClick={() => setFloraFilter(v)}
                className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
                style={{
                  background: floraFilter === v ? 'var(--color-forest-500)' : 'transparent',
                  color: floraFilter === v ? 'white' : (dark ? '#8b949e' : '#6b7280')
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <select
            className="input text-sm w-36"
            value={originFilter}
            onChange={e => setOriginFilter(e.target.value)}
            style={iStyle}
          >
            <option value="">All Origins</option>
            {origins.map(o => <option key={o} value={o}>{o}</option>)}
          </select>

          {(search || floraFilter !== 'all' || originFilter || newOnly) && (
            <button
              className="text-xs text-red-500 hover:text-red-700 font-medium"
              onClick={() => {
                setSearch('');
                setFloraFilter('all');
                setOriginFilter('');
                setNewOnly(false);
              }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* Windows Explorer Controls */}
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
                <option value="common_name">Common Name</option>
                <option value="species_id">Species ID</option>
                <option value="genus">Botanical (Genus)</option>
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
                onClick={() => setViewMode('list')}
                className={`px-2.5 py-1 font-medium ${
                  viewMode === 'list' ? 'bg-forest-600 text-white' : 'bg-transparent text-gray-500'
                }`}
              >
                📋 List
              </button>
              <button
                onClick={() => setViewMode('tiles')}
                className={`px-2.5 py-1 font-medium ${
                  viewMode === 'tiles' ? 'bg-forest-600 text-white' : 'bg-transparent text-gray-500'
                }`}
              >
                🔲 Tiles
              </button>
            </div>

            <span className="text-gray-400">
              {filtered.length} of {species.length} species
            </span>
          </div>
        </div>
      </div>

      {/* Content Rendering */}
      {viewMode === 'list' ? (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr style={{ background: 'var(--color-forest-500)' }}>
                {['ID', 'Common Name', 'Botanical Name', 'Family', 'Type', 'Origin'].map(h => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(s => (
                <tr
                  key={s.species_id}
                  onClick={() => navigate(`/species/${encodeURIComponent(s.species_id || s.common_name)}`)}
                  className="cursor-pointer transition-colors hover:bg-forest-50/50 dark:hover:bg-[#21262d]"
                  style={{ background: dark ? '#1c2128' : '#ffffff' }}
                >
                  <td className="px-4 py-3 text-xs font-mono font-bold text-gray-400">{s.species_id}</td>
                  <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">{s.common_name}</td>
                  <td className="px-4 py-3 italic text-gray-500">{s.genus} {s.species}</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{s.family}</td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300">
                      {s.flora_type === 'plant' ? '🌿 Plant' : '🌳 Tree'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{s.native_exotic || 'Native'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* Tiles View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map(s => (
            <div
              key={s.species_id}
              onClick={() => navigate(`/species/${encodeURIComponent(s.species_id || s.common_name)}`)}
              className="card p-4 cursor-pointer hover:shadow-md transition-all border hover:border-forest-500"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-xs font-bold text-forest-600 dark:text-forest-400">
                  {s.species_id}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500">
                  {s.native_exotic || 'Native'}
                </span>
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100">{s.common_name}</h4>
              <p className="text-xs italic text-gray-500">{s.genus} {s.species}</p>
              <p className="text-xs text-gray-400 mt-2">Family: {s.family}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
