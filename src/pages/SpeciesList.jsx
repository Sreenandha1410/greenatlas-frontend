import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSpecies } from '../api';
import { useDarkMode } from '../context/DarkModeContext';

export default function SpeciesList() {
  const [dark] = useDarkMode();
  const navigate = useNavigate();
  const [species, setSpecies]       = useState([]);
  const [search, setSearch]         = useState('');
  const [floraFilter, setFloraFilter] = useState('all');
  const [originFilter, setOriginFilter] = useState('');

  useEffect(() => { getSpecies().then(r => setSpecies(r.data)); }, []);

  const origins = [...new Set(species.map(s => s.native_exotic).filter(Boolean))].sort();

  const filtered = species.filter(s => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      s.common_name?.toLowerCase().includes(q) ||
      s.species?.toLowerCase().includes(q) ||
      s.species_id?.toLowerCase().includes(q) ||
      s.family?.toLowerCase().includes(q) ||
      s.genus?.toLowerCase().includes(q);
    const matchFlora  = floraFilter === 'all' || s.flora_type === floraFilter;
    const matchOrigin = !originFilter || s.native_exotic === originFilter;
    return matchSearch && matchFlora && matchOrigin;
  });

  const hasFilters = search || floraFilter !== 'all' || originFilter;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold mb-6"
        style={{ color: dark ? '#e6edf3' : '#111827' }}>
        Species
      </h1>

      {/* Filter bar */}
      <div className="card-clay p-4 mb-6 flex flex-wrap gap-3 items-center">
        <input className="input flex-1 min-w-48 text-sm" placeholder="Search species…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />

        {/* Flora type toggle */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: dark ? '#21262d' : '#f3f4f6' }}>
          {[['all','All'],['tree','🌳 Trees'],['plant','🌿 Plants']].map(([v, l]) => (
            <button key={v} onClick={() => setFloraFilter(v)}
              className="text-xs px-3 py-1.5 rounded-md font-medium transition-colors"
              style={{
                background: floraFilter === v
                  ? 'var(--color-forest-500)'
                  : 'transparent',
                color: floraFilter === v ? 'white' : (dark ? '#8b949e' : '#6b7280'),
              }}>
              {l}
            </button>
          ))}
        </div>

        {/* Origin filter */}
        <select className="input text-sm w-36" value={originFilter}
          onChange={e => setOriginFilter(e.target.value)}
          style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}>
          <option value="">All Origins</option>
          {origins.map(o => <option key={o}>{o}</option>)}
        </select>

        {hasFilters && (
          <button className="text-xs text-red-500 hover:text-red-700 font-medium"
            onClick={() => { setSearch(''); setFloraFilter('all'); setOriginFilter(''); }}>
            ✕ Clear
          </button>
        )}

        <span className="text-xs ml-auto" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
          {filtered.length} of {species.length} species
        </span>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ background: 'var(--color-forest-500)' }}>
              {['', 'Common Name', 'Botanical Name', 'Family', 'Type', 'Origin'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(sp => (
              <tr key={sp.species_id}
                onClick={() => navigate(`/species/${sp.species_id}`)}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}
                onMouseEnter={e => e.currentTarget.style.background = dark ? '#21262d' : '#f0f7ee'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <td className="px-4 py-3">
                  {sp.image_url
                    ? <img src={sp.image_url} className="w-10 h-10 rounded-lg object-cover" alt="" />
                    : <div className="w-10 h-10 rounded-lg bg-forest-100 dark:bg-forest-900
                                      flex items-center justify-center text-lg">🌿</div>}
                </td>
                <td className="px-4 py-3 font-medium" style={{ color: dark ? '#e6edf3' : '#111827' }}>
                  {sp.common_name}
                </td>
                <td className="px-4 py-3 italic text-gray-400">{sp.genus} {sp.species}</td>
                <td className="px-4 py-3 text-gray-500">{sp.family}</td>
                <td className="px-4 py-3">
                  <span className="text-base" title={sp.flora_type === 'tree' ? 'Tree' : 'Plant/Shrub'}>
                    {sp.flora_type === 'tree' ? '🌳' : '🌿'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${sp.native_exotic === 'Native'
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'}`}>
                    {sp.native_exotic || '—'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="text-center py-16 text-gray-400">No species match your filters.</p>
        )}
      </div>
    </div>
  );
}
