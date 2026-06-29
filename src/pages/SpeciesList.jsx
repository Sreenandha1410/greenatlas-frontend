import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchBar from '../components/SearchBar';
import { getSpecies } from '../api';
import { useDarkMode } from '../context/DarkModeContext'

const wrap = { maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const th = { background: '#2d5a27', color: '#fff', padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.9rem' };
const td = { padding: '0.75rem 1rem', borderBottom: '1px solid #f0f0f0', fontSize: '0.9rem' };

export default function SpeciesList() {
  const [dark] = useDarkMode()
  const navigate = useNavigate();
  const [species, setSpecies] = useState([]);
  const [search, setSearch]   = useState('');

  useEffect(() => { getSpecies().then(r => setSpecies(r.data)); }, []);

  const filtered = species.filter(s =>
    !search ||
    s.common_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.species?.toLowerCase().includes(search.toLowerCase()) ||
    s.species_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.family?.toLowerCase().includes(search.toLowerCase()) ||
    s.genus?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Species
      </h1>
      <input className="input max-w-md mb-6" placeholder="Search species…"
        value={search} onChange={e => setSearch(e.target.value)}
        style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />

      <div className="card overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ background: 'var(--color-forest-500)' }}>
              {['', 'Common Name', 'Botanical Name', 'Family', 'Origin'].map(h => (
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
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                  {sp.common_name}
                </td>
                <td className="px-4 py-3 italic text-gray-400">{sp.genus} {sp.species}</td>
                <td className="px-4 py-3 text-gray-500">{sp.family}</td>
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
      </div>
    </div>
  );
}