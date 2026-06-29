import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTrees, getAreas, addTree, updateTree, deleteTree, changePassword,
         getTreeQR, exportCSV, exportPDF, getDetailedStats, getSpecies,
         addSpecies, updateSpecies, deleteSpecies } from '../api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
         ResponsiveContainer, Legend } from 'recharts';
import ImageUpload from '../components/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion'
import { useDarkMode } from '../context/DarkModeContext'

const COLORS = ['#1b5e20','#2e7d32','#388e3c','#43a047','#4caf50',
                '#66bb6a','#81c784','#a5d6a7','#c8e6c9','#e8f5e9'];
const EMPTY  = { tree_id:'', botanical_name:'', common_name:'', family:'',
                 area:'', latitude:'', longitude:'', age:'', notes:'', image_link:'' };
const SPECIES_EMPTY = {
  species_id:'', common_name:'', tamil_name:'', kingdom:'', division:'',
  class:'', order:'', family:'', genus:'', species:'', origin:'', native_exotic:'',
  avg_height:'', lifespan:'', growth_rate:'', flowering_season:'', fruiting_season:'',
  pollination_method:'', wildlife_supported:'', ecological_importance:'',
  medicinal_uses:'', economic_uses:'', environmental_benefits:'', cultural_significance:'',
  interesting_facts:'', conservation_status:'', general_description:''
};

/* ── Shared UI primitives ── */
{/*
const Label = ({ children }) => (
  <label className="block text-xs font-medium mb-1"
    style={{ color: dark ? '#8b949e' : '#6b7280' }}>
    {children}
  </label>
);

const Input = ({ dark: _dark, ...props }) => (
  <input className="input mb-3" {...props}
    style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
);

const Textarea = ({ dark: _dark, ...props }) => (
  <textarea className="input mb-3 resize-y" style={{ height: 72, background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} {...props} />
);
*/}

const Btn = ({ color = 'primary', children, ...props }) => (
  <button
    className={color === 'primary' ? 'btn-primary text-sm'
             : color === 'danger'  ? 'bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
             :                       'bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'}
    {...props}
  >
    {children}
  </button>
);

const Flash = ({ msg }) => {
  if (!msg) return null;
  const ok = msg.startsWith('✅');
  return (
    <div className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium
      ${ok ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
           : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'}`}>
      {msg}
    </div>
  );
};

/* ── AutoField ── */
function AutoField({ label, value, onChange, suggestions = [], dark = false }) {
  const [open, setOpen] = useState(false);
  const filtered = suggestions.filter(
    s => s?.toLowerCase().includes(value?.toLowerCase()) && s !== value
  );
  return (
    <div className="relative mb-3">
      <label className="block text-xs font-medium mb-1"
        style={{ color: dark ? '#8b949e' : '#6b7280' }}>{label}</label>
      <input className="input"
        style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} />
      {open && filtered.length > 0 && (
        <div className="absolute z-10 w-full rounded-lg shadow-lg max-h-40 overflow-y-auto mt-1"
          style={{ background: dark ? '#1c2128' : '#ffffff',
                   border: `1px solid ${dark ? '#30363d' : '#e5e7eb'}` }}>
          {filtered.map((s, i) => (
            <div key={i}
              className="px-3 py-2 text-sm cursor-pointer transition-colors"
              style={{ color: dark ? '#e6edf3' : '#374151' }}
              onMouseDown={() => { onChange(s); setOpen(false) }}
              onMouseEnter={e => e.currentTarget.style.background = dark ? '#21262d' : '#f0f7ee'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── TreeForm ── */
function TreeForm({ initial = EMPTY, onSubmit, submitLabel, onCancel, areas = [], trees = [], dark = false }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const iStyle = { background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }
  const lStyle = { color: dark ? '#8b949e' : '#6b7280' }
  const allNames    = [...new Set(trees.map(t => t.common_name).filter(Boolean))];
  const allBotNames = [...new Set(trees.map(t => t.botanical_name).filter(Boolean))];
  const allFamilies = [...new Set(trees.map(t => t.family).filter(Boolean))];

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4">
        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Tree ID</label>
          <input className="input mb-3" style={iStyle}
            value={form.tree_id ?? ''} onChange={e => set('tree_id', e.target.value)} />
        </div>
        <AutoField label="Common Name"    value={form.common_name}
          onChange={v => set('common_name', v)}    suggestions={allNames}    dark={dark} />
        <AutoField label="Botanical Name" value={form.botanical_name}
          onChange={v => set('botanical_name', v)} suggestions={allBotNames} dark={dark} />
        <AutoField label="Family"         value={form.family}
          onChange={v => set('family', v)}         suggestions={allFamilies} dark={dark} />
        <AutoField label="Area"           value={form.area}
          onChange={v => set('area', v)}           suggestions={areas}       dark={dark} />
        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Age (years)</label>
          <input className="input mb-3" style={iStyle} type="number"
            value={form.age ?? ''} onChange={e => set('age', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Latitude</label>
          <input className="input mb-3" style={iStyle}
            value={form.latitude ?? ''} onChange={e => set('latitude', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Longitude</label>
          <input className="input mb-3" style={iStyle}
            value={form.longitude ?? ''} onChange={e => set('longitude', e.target.value)} />
        </div>
      </div>

      <label className="block text-xs font-medium mb-1" style={lStyle}>Image</label>
      <ImageUpload label="Upload Image" onUploaded={v => set('image_link', v)} />
      {form.image_link && (
        <div className="flex items-center gap-2 mb-2">
          <img src={form.image_link} className="w-20 h-12 object-cover rounded-lg" alt="" />
          <span className="text-xs" style={{ color: '#8b949e' }}>or paste URL:</span>
        </div>
      )}
      <input className="input mb-3" style={iStyle}
        placeholder="...or paste image URL directly"
        value={form.image_link ?? ''} onChange={e => set('image_link', e.target.value)} />

      <label className="block text-xs font-medium mb-1" style={lStyle}>Notes</label>
      <textarea className="input mb-3 resize-y" style={{ ...iStyle, height: 72 }}
        value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} />

      <div className="flex gap-3 mt-2">
        <Btn color="primary" onClick={() => onSubmit(form)}>{submitLabel}</Btn>
        {onCancel && <Btn color="gray" onClick={onCancel}>Cancel</Btn>}
      </div>
    </div>
  )
}

/* ── SpeciesForm ── */
function SpeciesForm({ initial = SPECIES_EMPTY, onSubmit, submitLabel, onCancel, dark = false }) {
  const [form, setForm] = useState(initial)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const iStyle = { background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }
  const lStyle = { color: dark ? '#8b949e' : '#6b7280' }

  const field = (key, label, multiline = false) => (
    <div key={key}>
      <label className="block text-xs font-medium mb-1" style={lStyle}>{label}</label>
      {multiline
        ? <textarea className="input mb-3 resize-y" style={{ ...iStyle, height: 70 }}
            value={form[key] || ''} onChange={e => set(key, e.target.value)} />
        : <input className="input mb-3" style={iStyle}
            value={form[key] || ''} onChange={e => set(key, e.target.value)} />
      }
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 gap-x-4">
        {field('species_id',    'Species ID')}
        {field('common_name',   'Common Name')}
        {field('tamil_name',    'Tamil Name')}
        {field('genus',         'Genus')}
        {field('species',       'Species Epithet')}
        {field('family',        'Family')}
        {field('kingdom',       'Kingdom')}
        {field('division',      'Division')}
        {field('class',         'Class')}
        {field('order',         'Order')}
        {field('origin',        'Origin')}
        {field('native_exotic', 'Native/Exotic')}
        {field('avg_height',    'Avg Height')}
        {field('lifespan',      'Lifespan')}
        {field('growth_rate',   'Growth Rate')}
        {field('flowering_season',    'Flowering Season')}
        {field('fruiting_season',     'Fruiting Season')}
        {field('pollination_method',  'Pollination Method')}
        {field('conservation_status', 'Conservation Status')}
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1" style={lStyle}>Species Image</label>
          <ImageUpload label="Upload general species image" onUploaded={v => set('image_url', v)} />
          {form.image_url && (
            <img src={form.image_url} className="w-28 h-20 object-cover rounded-lg mt-2 mb-2" alt="" />
          )}
          <input className="input mb-3" style={iStyle}
            placeholder="...or paste image URL"
            value={form.image_url || ''} onChange={e => set('image_url', e.target.value)} />
        </div>
      </div>
      {field('general_description',    'General Description',    true)}
      {field('wildlife_supported',     'Wildlife Supported',     true)}
      {field('ecological_importance',  'Ecological Importance',  true)}
      {field('medicinal_uses',         'Medicinal Uses',         true)}
      {field('economic_uses',          'Economic Uses',          true)}
      {field('environmental_benefits', 'Environmental Benefits', true)}
      {field('cultural_significance',  'Cultural Significance',  true)}
      {field('interesting_facts',      'Interesting Facts',      true)}
      <div className="flex gap-3 mt-2">
        <Btn color="primary" onClick={() => onSubmit(form)}>{submitLabel}</Btn>
        {onCancel && <Btn color="gray" onClick={onCancel}>Cancel</Btn>}
      </div>
    </div>
  );
}

/* ── ChangePassword ── */
function ChangePassword({ dark = false }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg]   = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const iStyle = { background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }
  const lStyle = { color: dark ? '#8b949e' : '#6b7280' }

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirm)
      return setMsg('❌ New passwords do not match');
    if (form.newPassword.length < 6)
      return setMsg('❌ Password must be at least 6 characters');
    try {
      await changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword });
      setMsg('✅ Password changed successfully');
      setForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch {
      setMsg('❌ Current password is incorrect');
    }
    setTimeout(() => setMsg(''), 3000);
  };

  return (
    <div className="max-w-sm">
      <Flash msg={msg} />
      <label className="block text-xs font-medium mb-1" style={lStyle}>Current Password</label>
      <input className="input mb-3" style={iStyle} type="password"
        value={form.currentPassword} onChange={e => set('currentPassword', e.target.value)} />
      <label className="block text-xs font-medium mb-1" style={lStyle}>New Password</label>
      <input className="input mb-3" style={iStyle} type="password"
        value={form.newPassword} onChange={e => set('newPassword', e.target.value)} />
      <label className="block text-xs font-medium mb-1" style={lStyle}>Confirm New Password</label>
      <input className="input mb-3" style={iStyle} type="password"
        value={form.confirm} onChange={e => set('confirm', e.target.value)} />
      <Btn color="primary" onClick={handleSubmit}>Update Password</Btn>
    </div>
  );
}

/* ── StatsPanel ── */
function StatsPanel({ dark = false }) {
  const [stats, setStats] = useState(null);
  useEffect(() => { getDetailedStats().then(r => setStats(r.data)); }, []);

  if (!stats) return <p style={{ color: '#8b949e' }}>Loading statistics…</p>;

  const headingStyle = { color: dark ? '#7dc070' : 'var(--color-forest-600)' }
  return (
    <div className="space-y-6">

      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={headingStyle}>Native vs Exotic Species</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={stats.nativeExotic} dataKey="count" nameKey="native_exotic"
              cx="50%" cy="50%" outerRadius={90}
              label={({ native_exotic, percent }) => `${native_exotic} ${(percent*100).toFixed(0)}%`}>
              {stats.nativeExotic.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={headingStyle}>Trees per Area</h3>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 600 }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.byArea} layout="vertical" margin={{ left: 160, right: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="area" width={155} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3d7a32" radius={[0,4,4,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={headingStyle}>Top 10 Families</h3>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 500 }}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byFamily} margin={{ bottom: 60 }}>
                <XAxis dataKey="family" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[4,4,0,0]}>
                  {stats.byFamily.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={headingStyle}>Conservation Status</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={stats.conservation} dataKey="count" nameKey="conservation_status"
              cx="50%" cy="50%" outerRadius={90}
              label={({ conservation_status, percent }) => `${conservation_status} ${(percent*100).toFixed(0)}%`}>
              {stats.conservation.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

/* ── SpeciesPanel ── */
function SpeciesPanel({ dark = false }) {
  const [species, setSpecies] = useState([]);
  const [editId, setEditId]   = useState(null);
  const [adding, setAdding]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [search, setSearch]   = useState('');
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => { getSpecies().then(r => setSpecies(r.data)); }, []);

  const handleAdd = async (form) => {
    try {
      const res = await addSpecies(form);
      setSpecies(prev => [...prev, res.data]);
      setAdding(false);
      flash('✅ Species added');
    } catch { flash('❌ Failed to add species'); }
  };

  const handleEdit = async (form) => {
    try {
      const res = await updateSpecies(form.species_id, form);
      setSpecies(prev => prev.map(s => s.species_id === form.species_id ? res.data : s));
      setEditId(null);
      flash('✅ Species updated');
    } catch { flash('❌ Failed to update species'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete species ${id}?`)) return;
    try {
      await deleteSpecies(id);
      setSpecies(prev => prev.filter(s => s.species_id !== id));
      flash('🗑️ Species deleted');
    } catch { flash('❌ Failed to delete species'); }
  };

  const filtered = species.filter(s =>
    !search ||
    s.common_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.species?.toLowerCase().includes(search.toLowerCase()) ||
    s.species_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.family?.toLowerCase().includes(search.toLowerCase()) ||
    s.genus?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <Flash msg={msg} />
      <div className="flex items-center justify-between mb-4 gap-3">
        <input className="input max-w-xs" placeholder="Search species…"
          value={search} onChange={e => setSearch(e.target.value)}
          style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
        <Btn color="primary" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add Species'}
        </Btn>
      </div>

      {adding && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-forest-700 dark:text-forest-300 mb-4">Add New Species</h3>
          <SpeciesForm submitLabel="Add Species" onSubmit={handleAdd}
            onCancel={() => setAdding(false)} dark={dark} />
        </div>
      )}

      <div className="card overflow-x-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-200">
          All Species ({filtered.length})
        </div>
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ background: 'var(--color-forest-500)' }}>
              {['ID','Common Name','Botanical Name','Family','Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(s => (
              <React.Fragment key={s.species_id}>
                <tr key={s.species_id}
                  className="transition-colors"
                  style={{ background: dark ? '#1c2128' : '#fff', borderBottom: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}
                  onMouseEnter={e => e.currentTarget.style.background = dark ? '#21262d' : '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = dark ? '#1c2128' : '#fff'}>
                  <td className="px-4 py-3 text-xs" style={{ color: '#8b949e' }}>{s.species_id}</td>
                  <td className="px-4 py-3 font-medium" style={{ color: dark ? '#e6edf3' : '#111827' }}>{s.common_name}</td>
                  <td className="px-4 py-3 italic" style={{ color: '#8b949e' }}>{s.genus} {s.species}</td>
                  <td className="px-4 py-3" style={{ color: dark ? '#8b949e' : '#6b7280' }}>{s.family}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Btn color="primary" onClick={() => setEditId(editId === s.species_id ? null : s.species_id)}>
                        {editId === s.species_id ? 'Close' : 'Edit'}
                      </Btn>
                      <Btn color="danger" onClick={() => handleDelete(s.species_id)}>Delete</Btn>
                    </div>
                  </td>
                </tr>
                {editId === s.species_id && (
                  <tr key={`edit-${s.species_id}`}>
                    <td colSpan={5} className="px-6 py-4"
                      style={{
                        background: dark ? '#161b22' : '#f9fdf9',
                        borderLeft: '4px solid var(--color-forest-500)',
                        borderBottom: `2px solid var(--color-forest-500)`
                      }}>
                      <h3 className="font-semibold mb-4"
                        style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}>
                        Edit: {s.common_name}
                      </h3>
                      <SpeciesForm initial={s} submitLabel="Save Changes"
                        onSubmit={handleEdit} onCancel={() => setEditId(null)} dark={dark} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Admin (main) ── */
const TABS = [
  { key: 'list',     label: 'Manage Trees'    },
  { key: 'add',      label: 'Add New Tree'    },
  { key: 'species',  label: 'Manage Species'  },
  { key: 'stats',    label: 'Statistics'      },
  { key: 'password', label: 'Change Password' },
];

export default function Admin() {
  const [dark] = useDarkMode()
  const navigate  = useNavigate();
  const role      = localStorage.getItem('role');

  const [trees, setTrees]     = useState([]);
  const [areas, setAreas]     = useState([]);
  const [tab, setTab]         = useState('list');
  const [editId, setEditId]   = useState(null);
  const [msg, setMsg]         = useState('');
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);
  const [treeSearch, setTreeSearch] = useState('')

  const filteredTrees = trees.filter(t => {
    const q = treeSearch.toLowerCase()
    return !q || [t.common_name, t.botanical_name, t.area, t.tree_id]
      .some(v => v?.toLowerCase().includes(q))
  })

  useEffect(() => {
    if (role !== 'admin') return;
    Promise.all([getTrees(), getAreas()])
      .then(([t, a]) => {
        setTrees(t.data);
        setAreas(a.data.map(a => a.area));
      })
      .finally(() => setLoading(false));
  }, []);

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Access Denied</p>
        <Btn color="primary" onClick={() => navigate('/login')}>Go to Login</Btn>
      </div>
    );
  }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAdd = async (form) => {
    try {
      const res = await addTree(form);
      setTrees(prev => [...prev, res.data]);
      setTab('list');
      flash('✅ Tree added successfully');
    } catch { flash('❌ Failed to add tree'); }
  };

  const handleEdit = async (form) => {
    try {
      const res = await updateTree(form.tree_id, form);
      setTrees(prev => prev.map(t => t.tree_id === form.tree_id ? res.data : t));
      setEditId(null);
      flash('✅ Tree updated successfully');
    } catch { flash('❌ Failed to update tree'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete tree ${id}?`)) return;
    try {
      await deleteTree(id);
      setTrees(prev => prev.filter(t => t.tree_id !== id));
      flash('🗑️ Tree deleted');
    } catch { flash('❌ Failed to delete tree'); }
  };

  const previewQR = async (tree_id, common_name) => {
    try {
      const res = await getTreeQR(tree_id);
      setQrModal({ qr: res.data.qr, tree_id, common_name });
    } catch { flash('❌ Failed to generate QR'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Admin Panel
      </h1>

      <Flash msg={msg} />

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800 mb-6 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors
              ${tab === key
                ? 'border-forest-500 text-forest-600 dark:text-forest-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
            {label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}>

          {loading && <p className="text-gray-400">Loading…</p>}

          {/* Add Tree */}
          {!loading && tab === 'add' && (
            <div className="card p-6">
              <h2 className="font-semibold mb-4"
                style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}>
                Add New Tree
              </h2>
              <TreeForm submitLabel="Add Tree" onSubmit={handleAdd}
                areas={areas} trees={trees} dark={dark} />
            </div>
          )}

          {/* Species */}
          {!loading && tab === 'species' && <SpeciesPanel dark={dark} />}

          {/* Manage Trees */}
          {!loading && tab === 'list' && (
            <div className="card overflow-hidden">
              <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3"
                style={{ borderColor: dark ? '#30363d' : '#f3f4f6' }}>
                <span className="font-semibold"
                  style={{ color: dark ? '#e6edf3' : '#111827' }}>
                  All Trees ({filteredTrees.length})
                </span>
                <div className="flex gap-2 flex-wrap">
                  <input className="input text-sm w-52"
                    placeholder="Search trees…"
                    value={treeSearch} onChange={e => setTreeSearch(e.target.value)}
                    style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
                  <button onClick={exportCSV}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: '#0369a1' }}>⬇ CSV</button>
                  <button onClick={exportPDF}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white"
                    style={{ background: '#be123c' }}>⬇ PDF</button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ background: 'var(--color-forest-500)' }}>
                      {['ID','Common Name','Botanical Name','Area','Actions'].map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {filteredTrees.map(tree => (
                      <React.Fragment key={tree.tree_id}>
                        <tr key={tree.tree_id}
                          className="transition-colors"
                          style={{ borderBottom: `1px solid ${dark ? '#30363d' : '#f3f4f6'}`,
                                  background: dark ? '#1c2128' : '#ffffff' }}
                          onMouseEnter={e => e.currentTarget.style.background = dark ? '#21262d' : '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.background = dark ? '#1c2128' : '#ffffff'}>
                          <td className="px-4 py-3 text-xs" style={{ color: '#8b949e' }}>{tree.tree_id}</td>
                          <td className="px-4 py-3 font-medium" style={{ color: dark ? '#e6edf3' : '#111827' }}>{tree.common_name}</td>
                          <td className="px-4 py-3 italic" style={{ color: '#8b949e' }}>{tree.botanical_name}</td>
                          <td className="px-4 py-3" style={{ color: dark ? '#8b949e' : '#6b7280' }}>{tree.area}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <Btn color="primary" onClick={() => setEditId(editId === tree.tree_id ? null : tree.tree_id)}>
                                {editId === tree.tree_id ? 'Close' : 'Edit'}
                              </Btn>
                              <Btn color="danger" onClick={() => handleDelete(tree.tree_id)}>Delete</Btn>
                              <button onClick={() => previewQR(tree.tree_id, tree.common_name)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                                style={{ background: '#0369a1' }}>QR</button>
                            </div>
                          </td>
                        </tr>
                        {editId === tree.tree_id && (
                          <tr key={`edit-${tree.tree_id}`}>
                            <td colSpan={5} className="px-6 py-4"
                              style={{
                                background: dark ? '#161b22' : '#f9fdf9',
                                borderLeft: '4px solid var(--color-forest-500)',
                                borderBottom: `2px solid var(--color-forest-500)`
                              }}>
                              <h3 className="font-semibold mb-4"
                                style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}>
                                Edit: {tree.common_name}
                              </h3>
                              <TreeForm initial={tree} submitLabel="Save Changes"
                                onSubmit={handleEdit} onCancel={() => setEditId(null)}
                                areas={areas} trees={trees} dark={dark} />
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {!loading && tab === 'stats' && <StatsPanel dark={dark} />}
          {!loading && tab === 'password' && (
            <div className="card p-6">
              <h2 className="font-semibold mb-4"
                style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}>
                Change Password
              </h2>
              <ChangePassword dark={dark} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
             onClick={() => setQrModal(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-2xl min-w-64"
               onClick={e => e.stopPropagation()}>
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-100">
              {qrModal.common_name}
            </h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">Tree ID: {qrModal.tree_id}</p>
            <img src={qrModal.qr} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg" />
            <div className="flex gap-3 justify-center mt-6">
              <a href={qrModal.qr} download={`${qrModal.tree_id}-qr.png`}>
                <Btn color="primary">Download</Btn>
              </a>
              <Btn color="gray" onClick={() => setQrModal(null)}>Close</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}