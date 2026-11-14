import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTrees, getAreas, addTree, updateTree, deleteTree, changePassword,
  getTreeQR, exportCSV, exportPDF, getDetailedStats, getSpecies,
  addSpecies, updateSpecies, deleteSpecies, getComplaints, updateComplaintStatus,
  addArea, deleteArea, updateAreaInfo, exportTable,
  getBoards, getBoardStats, getMissingBoards,
  addBoard, updateBoard, updateBoardStatus, deleteBoard, exportBoards
} from '../api';
import BoardsPanel from '../components/BoardsPanel';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
  ResponsiveContainer, Legend
} from 'recharts';
import ImageUpload from '../components/ImageUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { useDarkMode } from '../context/DarkModeContext';

const COLORS = [
  '#1b5e20', '#2e7d32', '#388e3c', '#43a047', '#4caf50',
  '#66bb6a', '#81c784', '#a5d6a7', '#c8e6c9', '#e8f5e9'
];

const EMPTY = {
  tree_id: '',
  botanical_name: '',
  common_name: '',
  family: '',
  area: '',
  latitude: '',
  longitude: '',
  age: '',
  notes: '',
  image_link: '',
  flora_type: 'tree'
};

const SPECIES_EMPTY = {
  species_id: '',
  common_name: '',
  tamil_name: '',
  kingdom: 'Plantae',
  division: '',
  class: '',
  order_name: '',
  family: '',
  genus: '',
  species: '',
  origin: '',
  native_exotic: 'Native',
  avg_height: '',
  lifespan: '',
  growth_rate: '',
  flowering_season: '',
  fruiting_season: '',
  pollination_method: '',
  wildlife_supported: '',
  ecological_importance: '',
  medicinal_uses: '',
  economic_uses: '',
  environmental_benefits: '',
  cultural_significance: '',
  interesting_facts: '',
  conservation_status: 'Least Concern',
  general_description: '',
  flora_type: 'tree'
};

const AREA_EMPTY = {
  area: '',
  area_code: '',
  description: '',
  image_url: '',
  navigation_notes: ''
};

const Btn = ({ color = 'primary', children, ...props }) => (
  <button
    className={
      color === 'primary'
        ? 'btn-primary text-sm'
        : color === 'danger'
        ? 'bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
        : 'bg-gray-400 hover:bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
    }
    {...props}
  >
    {children}
  </button>
);

const Flash = ({ msg }) => {
  if (!msg) return null;
  const ok = msg.startsWith('✅');
  return (
    <div
      className={`px-4 py-3 rounded-lg mb-4 text-sm font-medium ${
        ok
          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
          : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
      }`}
    >
      {msg}
    </div>
  );
};

/* ── Explorer Toolbar Component ── */
function ExplorerToolbar({
  search,
  onSearchChange,
  sortField,
  onSortFieldChange,
  sortOrder,
  onToggleSortOrder,
  viewMode,
  onViewModeChange,
  sortOptions = [],
  newOnly,
  onToggleNewOnly,
  count,
  dark
}) {
  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-[#161b22] border-b border-gray-200 dark:border-[#30363d] rounded-t-xl">
      <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-sm">
        <input
          className="input text-sm w-full py-1.5"
          placeholder="Filter items..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          style={iStyle}
        />
        {search && (
          <button
            onClick={() => onSearchChange('')}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
          <span>Sort:</span>
          <select
            className="input text-xs py-1.5 px-2 rounded-lg"
            style={iStyle}
            value={sortField}
            onChange={e => onSortFieldChange(e.target.value)}
          >
            {sortOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={onToggleSortOrder}
            title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
            className="px-2 py-1.5 rounded-lg border border-gray-300 dark:border-[#30363d] bg-white dark:bg-[#1c2128] text-xs font-semibold hover:bg-gray-100 dark:hover:bg-[#21262d] transition-colors"
          >
            {sortOrder === 'asc' ? '▲ Asc' : '▼ Desc'}
          </button>
        </div>

        {onToggleNewOnly && (
          <button
            onClick={onToggleNewOnly}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
              newOnly
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white dark:bg-[#1c2128] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-[#30363d] hover:bg-gray-100 dark:hover:bg-[#21262d]'
            }`}
          >
            ✨ Newest Only
          </button>
        )}

        <div className="flex items-center border border-gray-300 dark:border-[#30363d] rounded-lg overflow-hidden">
          <button
            onClick={() => onViewModeChange('list')}
            title="List view"
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-forest-600 text-white'
                : 'bg-white dark:bg-[#1c2128] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262d]'
            }`}
          >
            📋 List
          </button>
          <button
            onClick={() => onViewModeChange('tiles')}
            title="Tiles view"
            className={`px-2.5 py-1.5 text-xs font-medium transition-colors ${
              viewMode === 'tiles'
                ? 'bg-forest-600 text-white'
                : 'bg-white dark:bg-[#1c2128] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#21262d]'
            }`}
          >
            🔲 Tiles
          </button>
        </div>

        <span className="text-xs text-gray-400 ml-1">
          {count} items
        </span>
      </div>
    </div>
  );
}

/* ── TreeForm (With Step 1 Dark Theme Legibility Fix) ── */
function TreeForm({
  initial = EMPTY,
  onSubmit,
  submitLabel,
  onCancel,
  areas = [],
  speciesList = [],
  trees = [],
  dark = false
}) {
  const [form, setForm] = useState(initial);
  const [manualIdEdit, setManualIdEdit] = useState(Boolean(initial.tree_id));
  const isEditing = Boolean(initial.tree_id);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };
  const lStyle = { color: dark ? '#8b949e' : '#6b7280' };

  const botanicalOptions = speciesList.map(s => {
    const bot = `${s.genus || ''} ${s.species || ''}`.trim();
    return {
      botanical_name: bot || s.common_name,
      common_name: s.common_name,
      family: s.family,
      species_id: s.species_id,
      flora_type: s.flora_type || 'tree'
    };
  });

  const handleBotanicalChange = (selectedBotName) => {
    const matched = botanicalOptions.find(b => b.botanical_name === selectedBotName);
    const newCommonName = matched ? matched.common_name : form.common_name;
    const newFamily = matched ? matched.family : form.family;
    const newFloraType = matched?.flora_type || form.flora_type || 'tree';

    let newTreeId = form.tree_id;
    if (!isEditing && !manualIdEdit) {
      newTreeId = computeAutoTreeId(selectedBotName, form.area, matched?.species_id);
    }

    setForm(f => ({
      ...f,
      botanical_name: selectedBotName,
      common_name: newCommonName,
      family: newFamily,
      flora_type: newFloraType,
      tree_id: newTreeId
    }));
  };

  const handleAreaChange = (selectedArea) => {
    let newTreeId = form.tree_id;
    if (!isEditing && !manualIdEdit) {
      const matched = botanicalOptions.find(b => b.botanical_name === form.botanical_name);
      newTreeId = computeAutoTreeId(form.botanical_name, selectedArea, matched?.species_id);
    }

    setForm(f => ({
      ...f,
      area: selectedArea,
      tree_id: newTreeId
    }));
  };

  const computeAutoTreeId = (botName, areaName, specId) => {
    if (!areaName || !botName) return '';

    const areaObj = areas.find(a => a.area === areaName);
    const areaCode = (areaObj?.area_code || areaName.substring(0, 3)).toUpperCase().trim();

    let speciesCode = specId;
    if (!speciesCode) {
      const sp = speciesList.find(s => {
        const full = `${s.genus || ''} ${s.species || ''}`.trim();
        return full === botName || s.common_name === botName;
      });
      speciesCode = sp?.species_id || '';
    }
    speciesCode = (speciesCode || 'X').trim();

    const count = trees.filter(
      t => t.area === areaName && t.botanical_name === botName
    ).length;
    const nextSeq = String(count + 1).padStart(3, '0');

    return `${areaCode}${speciesCode}${nextSeq}`;
  };

  return (
    <div>
      {/* Step 1: Dark Mode Hardened */}
      <div
        className="p-4 rounded-xl border mb-5 transition-colors"
        style={{
          background: dark ? '#161b22' : '#f0fdf4',
          borderColor: dark ? '#30363d' : '#bbf7d0'
        }}
      >
        <p className="text-xs font-bold uppercase tracking-wider mb-3 text-forest-700 dark:text-forest-300">
          Step 1: Select Botanical Name & Campus Area (Auto-assigns ID, Family & Common Name)
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={lStyle}>
              Botanical Name <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              style={iStyle}
              value={form.botanical_name ?? ''}
              onChange={e => handleBotanicalChange(e.target.value)}
            >
              <option value="">-- Choose Botanical Name --</option>
              {botanicalOptions.map(opt => (
                <option key={opt.species_id || opt.botanical_name} value={opt.botanical_name}>
                  {opt.botanical_name} ({opt.common_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-1" style={lStyle}>
              Campus Area <span className="text-red-500">*</span>
            </label>
            <select
              className="input"
              style={iStyle}
              value={form.area ?? ''}
              onChange={e => handleAreaChange(e.target.value)}
            >
              <option value="">-- Choose Campus Area --</option>
              {areas.map(a => (
                <option key={a.area} value={a.area}>
                  {a.area} {a.area_code ? `(${a.area_code})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Step 2: Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-medium" style={lStyle}>
              Tree ID <span className="text-red-500">*</span>
            </label>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setManualIdEdit(!manualIdEdit)}
                className="text-[11px] text-forest-600 dark:text-forest-400 hover:underline"
              >
                {manualIdEdit ? 'Auto-generate' : 'Edit manually'}
              </button>
            )}
          </div>
          <input
            className="input mb-3 font-mono font-semibold"
            style={{
              ...iStyle,
              background: !manualIdEdit && !isEditing ? (dark ? '#0d1117' : '#f0fdf4') : iStyle.background
            }}
            value={form.tree_id ?? ''}
            onChange={e => {
              setManualIdEdit(true);
              set('tree_id', e.target.value);
            }}
            readOnly={!manualIdEdit && !isEditing}
            placeholder="e.g. CAIA9001"
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>
            Common Name
          </label>
          <input
            className="input mb-3"
            style={iStyle}
            value={form.common_name ?? ''}
            onChange={e => set('common_name', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>
            Family
          </label>
          <input
            className="input mb-3"
            style={iStyle}
            value={form.family ?? ''}
            onChange={e => set('family', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>
            Flora Type
          </label>
          <select
            className="input mb-3"
            style={iStyle}
            value={form.flora_type || 'tree'}
            onChange={e => set('flora_type', e.target.value)}
          >
            <option value="tree">🌳 Tree</option>
            <option value="plant">🌿 Plant / Shrub</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>
            Age (years)
          </label>
          <input
            className="input mb-3"
            style={iStyle}
            type="number"
            value={form.age ?? ''}
            onChange={e => set('age', e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>
              Latitude
            </label>
            <input
              className="input mb-3"
              style={iStyle}
              value={form.latitude ?? ''}
              onChange={e => set('latitude', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>
              Longitude
            </label>
            <input
              className="input mb-3"
              style={iStyle}
              value={form.longitude ?? ''}
              onChange={e => set('longitude', e.target.value)}
            />
          </div>
        </div>
      </div>

      <label className="block text-xs font-medium mb-1" style={lStyle}>
        Image
      </label>
      <ImageUpload label="Upload Image" onUploaded={v => set('image_link', v)} />
      {form.image_link && (
        <div className="flex items-center gap-2 mb-2">
          <img src={form.image_link} className="w-20 h-12 object-cover rounded-lg" alt="" />
          <span className="text-xs" style={{ color: '#8b949e' }}>or paste URL:</span>
        </div>
      )}
      <input
        className="input mb-3"
        style={iStyle}
        placeholder="...or paste image URL directly"
        value={form.image_link ?? ''}
        onChange={e => set('image_link', e.target.value)}
      />

      <label className="block text-xs font-medium mb-1" style={lStyle}>
        Notes
      </label>
      <textarea
        className="input mb-3 resize-y"
        style={{ ...iStyle, height: 72 }}
        value={form.notes ?? ''}
        onChange={e => set('notes', e.target.value)}
      />

      <div className="flex gap-3 mt-4">
        <Btn color="primary" onClick={() => onSubmit(form)}>
          {submitLabel}
        </Btn>
        {onCancel && (
          <Btn color="gray" onClick={onCancel}>
            Cancel
          </Btn>
        )}
      </div>
    </div>
  );
}

/* ── SpeciesForm ── */
function SpeciesForm({ initial = SPECIES_EMPTY, onSubmit, submitLabel, onCancel, dark = false }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };
  const lStyle = { color: dark ? '#8b949e' : '#6b7280' };

  const field = (key, label, multiline = false, disabled = false) => (
    <div key={key}>
      <label className="block text-xs font-medium mb-1" style={lStyle}>{label}</label>
      {multiline ? (
        <textarea
          className="input mb-3 resize-y"
          style={{ ...iStyle, height: 70 }}
          value={form[key] || ''}
          onChange={e => set(key, e.target.value)}
          disabled={disabled}
        />
      ) : (
        <input
          className="input mb-3"
          style={{ ...iStyle, opacity: disabled ? 0.6 : 1 }}
          value={form[key] || ''}
          onChange={e => set(key, e.target.value)}
          disabled={disabled}
        />
      )}
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        {field('species_id', 'Species ID', false, Boolean(initial.species_id))}
        {field('common_name', 'Common Name')}
        {field('tamil_name', 'Tamil Name')}
        {field('genus', 'Genus')}
        {field('species', 'Species Epithet')}
        {field('family', 'Family')}

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Kingdom</label>
          <input
            className="input mb-3"
            style={{ ...iStyle, opacity: 0.7 }}
            value={form.kingdom || 'Plantae'}
            readOnly
            disabled
          />
        </div>

        {field('division', 'Division')}
        {field('class', 'Class')}
        {field('order_name', 'Order')}
        {field('origin', 'Origin')}

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Native / Exotic</label>
          <select
            className="input mb-3"
            style={iStyle}
            value={form.native_exotic || 'Native'}
            onChange={e => set('native_exotic', e.target.value)}
          >
            <option value="Native">Native</option>
            <option value="Exotic">Exotic</option>
          </select>
        </div>

        {field('avg_height', 'Avg Height')}
        {field('lifespan', 'Lifespan')}
        {field('growth_rate', 'Growth Rate')}
        {field('flowering_season', 'Flowering Season')}
        {field('fruiting_season', 'Fruiting Season')}
        {field('pollination_method', 'Pollination Method')}

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Conservation Status</label>
          <select
            className="input mb-3"
            style={iStyle}
            value={form.conservation_status || 'Least Concern'}
            onChange={e => set('conservation_status', e.target.value)}
          >
            <option value="Least Concern">Least Concern (LC)</option>
            <option value="Near Threatened">Near Threatened (NT)</option>
            <option value="Vulnerable">Vulnerable (VU)</option>
            <option value="Endangered">Endangered (EN)</option>
            <option value="Critically Endangered">Critically Endangered (CR)</option>
            <option value="Extinct in the Wild">Extinct in the Wild (EW)</option>
            <option value="Data Deficient">Data Deficient (DD)</option>
            <option value="Not Evaluated">Not Evaluated (NE)</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium mb-1" style={lStyle}>Flora Type</label>
          <select
            className="input mb-3"
            style={iStyle}
            value={form.flora_type || 'tree'}
            onChange={e => set('flora_type', e.target.value)}
          >
            <option value="tree">🌳 Tree</option>
            <option value="plant">🌿 Plant / Shrub</option>
          </select>
        </div>
      </div>

      {field('wildlife_supported', 'Wildlife Supported', true)}
      {field('ecological_importance', 'Ecological Importance', true)}
      {field('medicinal_uses', 'Medicinal Uses', true)}
      {field('economic_uses', 'Economic Uses', true)}
      {field('environmental_benefits', 'Environmental Benefits', true)}
      {field('cultural_significance', 'Cultural Significance', true)}
      {field('interesting_facts', 'Interesting Facts', true)}
      {field('general_description', 'General Description', true)}

      <div className="flex gap-3 mt-4">
        <Btn color="primary" onClick={() => onSubmit(form)}>{submitLabel}</Btn>
        {onCancel && <Btn color="gray" onClick={onCancel}>Cancel</Btn>}
      </div>
    </div>
  );
}

/* ── AreaPanel (Subpage to Manage & Add Campus Areas with Explorer View) ── */
function AreaPanel({ areas = [], onRefresh, dark = false }) {
  const [form, setForm] = useState(AREA_EMPTY);
  const [adding, setAdding] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('area');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('list');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };
  const lStyle = { color: dark ? '#8b949e' : '#6b7280' };

  const handleAdd = async () => {
    if (!form.area.trim() || !form.area_code.trim()) {
      flash('❌ Area name and Area code are required');
      return;
    }
    try {
      await addArea(form);
      setForm(AREA_EMPTY);
      setAdding(false);
      onRefresh();
      flash('✅ Area added successfully');
    } catch (err) {
      flash(`❌ ${err.response?.data?.error || 'Failed to add area'}`);
    }
  };

  const handleUpdate = async () => {
    try {
      await updateAreaInfo(editingArea.area, editingArea);
      setEditingArea(null);
      onRefresh();
      flash('✅ Area metadata updated');
    } catch {
      flash('❌ Failed to update area');
    }
  };

  const handleDelete = async (areaName) => {
    if (!window.confirm(`Delete area "${areaName}"? Trees located here will lose their assigned area.`)) {
      return;
    }
    try {
      await deleteArea(areaName);
      onRefresh();
      flash('🗑️ Area deleted');
    } catch {
      flash('❌ Failed to delete area');
    }
  };

  let processed = areas.filter(a =>
    !search ||
    a.area?.toLowerCase().includes(search.toLowerCase()) ||
    a.area_code?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  processed.sort((a, b) => {
    let valA = (a[sortField] || '').toString().toLowerCase();
    let valB = (b[sortField] || '').toString().toLowerCase();
    const cmp = valA.localeCompare(valB);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return (
    <div>
      <Flash msg={msg} />

      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
          Campus Areas Management
        </h2>
        <Btn color="primary" onClick={() => { setAdding(!adding); setEditingArea(null); }}>
          {adding ? 'Cancel' : '+ Add New Area'}
        </Btn>
      </div>

      {adding && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-forest-700 dark:text-forest-300 mb-4">
            Add New Campus Area
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium mb-1" style={lStyle}>
                Area Name (e.g. Canteen) <span className="text-red-500">*</span>
              </label>
              <input
                className="input"
                style={iStyle}
                value={form.area}
                onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                placeholder="e.g. Canteen"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={lStyle}>
                Area Code (e.g. CAI) <span className="text-red-500">*</span>
              </label>
              <input
                className="input font-mono uppercase"
                style={iStyle}
                value={form.area_code}
                onChange={e => setForm(f => ({ ...f, area_code: e.target.value.toUpperCase() }))}
                placeholder="e.g. CAI"
                maxLength={6}
              />
            </div>
          </div>

          <label className="block text-xs font-medium mb-1" style={lStyle}>Area Image</label>
          <ImageUpload label="Upload Area Photo" onUploaded={url => setForm(f => ({ ...f, image_url: url }))} />
          {form.image_url && (
            <div className="flex items-center gap-2 my-2">
              <img src={form.image_url} className="w-20 h-12 object-cover rounded-lg" alt="" />
              <span className="text-xs text-gray-400">or paste URL below:</span>
            </div>
          )}
          <input
            className="input mb-3"
            style={iStyle}
            placeholder="...or paste image URL directly"
            value={form.image_url}
            onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
          />

          <label className="block text-xs font-medium mb-1" style={lStyle}>Description</label>
          <textarea
            className="input mb-3 resize-y"
            style={{ ...iStyle, height: 60 }}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Describe landmarks, flora composition or key points..."
          />

          <label className="block text-xs font-medium mb-1" style={lStyle}>Navigation Notes</label>
          <textarea
            className="input mb-4 resize-y"
            style={{ ...iStyle, height: 60 }}
            value={form.navigation_notes}
            onChange={e => setForm(f => ({ ...f, navigation_notes: e.target.value }))}
            placeholder="Directions from main gate or nearest landmark..."
          />

          <div className="flex gap-3">
            <Btn color="primary" onClick={handleAdd}>Save Area</Btn>
            <Btn color="gray" onClick={() => setAdding(false)}>Cancel</Btn>
          </div>
        </div>
      )}

      {/* Explorer Controls */}
      <div className="card overflow-hidden">
        <ExplorerToolbar
          search={search}
          onSearchChange={setSearch}
          sortField={sortField}
          onSortFieldChange={setSortField}
          sortOrder={sortOrder}
          onToggleSortOrder={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOptions={[
            { value: 'area', label: 'Area Name' },
            { value: 'area_code', label: 'Area Code' }
          ]}
          count={processed.length}
          dark={dark}
        />

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[650px]">
              <thead>
                <tr style={{ background: 'var(--color-forest-500)' }}>
                  {['Area Name', 'Code', 'Photo', 'Description', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {processed.map(a => (
                  <Fragment key={a.area}>
                    <tr
                      className="transition-colors"
                      style={{
                        background: dark ? '#1c2128' : '#fff',
                        borderBottom: `1px solid ${dark ? '#30363d' : '#f3f4f6'}`
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? '#21262d' : '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = dark ? '#1c2128' : '#fff'}
                    >
                      <td className="px-4 py-3 font-semibold" style={{ color: dark ? '#e6edf3' : '#111827' }}>
                        {a.area}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-forest-600 dark:text-forest-400">
                        {a.area_code || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {a.image_url ? (
                          <img src={a.image_url} alt={a.area} className="w-12 h-8 object-cover rounded" />
                        ) : (
                          <span className="text-xs text-gray-400">No image</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                        {a.description || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <Btn
                            color="primary"
                            onClick={() => setEditingArea(editingArea?.area === a.area ? null : { ...a })}
                          >
                            {editingArea?.area === a.area ? 'Close' : 'Edit'}
                          </Btn>
                          <Btn color="danger" onClick={() => handleDelete(a.area)}>Delete</Btn>
                        </div>
                      </td>
                    </tr>

                    {editingArea?.area === a.area && (
                      <tr key={`edit-area-${a.area}`}>
                        <td
                          colSpan={5}
                          className="px-6 py-4"
                          style={{
                            background: dark ? '#161b22' : '#f9fdf9',
                            borderLeft: '4px solid var(--color-forest-500)',
                            borderBottom: '2px solid var(--color-forest-500)'
                          }}
                        >
                          <h4 className="font-semibold mb-3 text-forest-700 dark:text-forest-300">
                            Edit Metadata: {a.area}
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                            <div>
                              <label className="block text-xs font-medium mb-1" style={lStyle}>Image URL</label>
                              <input
                                className="input"
                                style={iStyle}
                                value={editingArea.image_url || ''}
                                onChange={e => setEditingArea({ ...editingArea, image_url: e.target.value })}
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium mb-1" style={lStyle}>Navigation Notes</label>
                              <input
                                className="input"
                                style={iStyle}
                                value={editingArea.navigation_notes || ''}
                                onChange={e => setEditingArea({ ...editingArea, navigation_notes: e.target.value })}
                              />
                            </div>
                          </div>
                          <label className="block text-xs font-medium mb-1" style={lStyle}>Description</label>
                          <textarea
                            className="input mb-3 resize-y"
                            style={{ ...iStyle, height: 60 }}
                            value={editingArea.description || ''}
                            onChange={e => setEditingArea({ ...editingArea, description: e.target.value })}
                          />
                          <div className="flex gap-3">
                            <Btn color="primary" onClick={handleUpdate}>Save Changes</Btn>
                            <Btn color="gray" onClick={() => setEditingArea(null)}>Cancel</Btn>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tiles View */
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {processed.map(a => (
              <div
                key={a.area}
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  background: dark ? '#1c2128' : '#ffffff',
                  borderColor: dark ? '#30363d' : '#e5e7eb'
                }}
              >
                <div>
                  <div className="h-28 overflow-hidden rounded-lg mb-3 relative bg-forest-900/10">
                    {a.image_url ? (
                      <img src={a.image_url} alt={a.area} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📍</div>
                    )}
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono font-bold bg-black/60 text-white">
                      {a.area_code || '—'}
                    </span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-gray-100">{a.area}</h4>
                  <p className="text-xs text-gray-500 line-clamp-2 mt-1">{a.description || 'No description'}</p>
                </div>
                <div className="flex gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Btn color="primary" onClick={() => setEditingArea(a)}>Edit</Btn>
                  <Btn color="danger" onClick={() => handleDelete(a.area)}>Delete</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── SpeciesPanel (With Explorer View) ── */
function SpeciesPanel({ dark = false }) {
  const [species, setSpecies] = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState('common_name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [viewMode, setViewMode] = useState('list');

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  useEffect(() => {
    getSpecies().then(r => setSpecies(r.data));
  }, []);

  const handleAdd = async (form) => {
    try {
      const res = await addSpecies(form);
      setSpecies(prev => [...prev, res.data]);
      setAdding(false);
      flash('✅ Species added');
    } catch {
      flash('❌ Failed to add species');
    }
  };

  const handleEdit = async (form) => {
    try {
      const res = await updateSpecies(editId, form);
      setSpecies(prev => prev.map(s => s.species_id === editId ? res.data : s));
      setEditId(null);
      flash('✅ Species updated');
    } catch {
      flash('❌ Failed to update species');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(`Delete species ${id}?`)) return;
    try {
      await deleteSpecies(id);
      setSpecies(prev => prev.filter(s => s.species_id !== id));
      flash('🗑️ Species deleted');
    } catch {
      flash('❌ Failed to delete species');
    }
  };

  let processed = species.filter(s =>
    !search ||
    s.common_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.species?.toLowerCase().includes(search.toLowerCase()) ||
    s.species_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.family?.toLowerCase().includes(search.toLowerCase()) ||
    s.genus?.toLowerCase().includes(search.toLowerCase())
  );

  processed.sort((a, b) => {
    let valA = (a[sortField] || '').toString().toLowerCase();
    let valB = (b[sortField] || '').toString().toLowerCase();
    const cmp = valA.localeCompare(valB);
    return sortOrder === 'asc' ? cmp : -cmp;
  });

  return (
    <div>
      <Flash msg={msg} />
      <div className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-bold text-lg text-gray-900 dark:text-gray-100">
          Manage Botanical Species
        </h2>
        <Btn color="primary" onClick={() => setAdding(!adding)}>
          {adding ? 'Cancel' : '+ Add Species'}
        </Btn>
      </div>

      {adding && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-forest-700 dark:text-forest-300 mb-4">Add New Species</h3>
          <SpeciesForm
            submitLabel="Add Species"
            onSubmit={handleAdd}
            onCancel={() => setAdding(false)}
            dark={dark}
          />
        </div>
      )}

      <div className="card overflow-hidden">
        <ExplorerToolbar
          search={search}
          onSearchChange={setSearch}
          sortField={sortField}
          onSortFieldChange={setSortField}
          sortOrder={sortOrder}
          onToggleSortOrder={() => setSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          sortOptions={[
            { value: 'common_name', label: 'Common Name' },
            { value: 'species_id', label: 'Species ID' },
            { value: 'family', label: 'Family' },
            { value: 'genus', label: 'Genus' },
            { value: 'native_exotic', label: 'Native / Exotic' }
          ]}
          count={processed.length}
          dark={dark}
        />

        {viewMode === 'list' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr style={{ background: 'var(--color-forest-500)' }}>
                  {['ID', 'Common Name', 'Botanical Name', 'Family', 'Type', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {processed.map(s => (
                  <Fragment key={s.species_id}>
                    <tr
                      key={s.species_id}
                      className="transition-colors"
                      style={{
                        background: dark ? '#1c2128' : '#fff',
                        borderBottom: `1px solid ${dark ? '#30363d' : '#f3f4f6'}`
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = dark ? '#21262d' : '#f9fafb'}
                      onMouseLeave={e => e.currentTarget.style.background = dark ? '#1c2128' : '#fff'}
                    >
                      <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: '#8b949e' }}>{s.species_id}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: dark ? '#e6edf3' : '#111827' }}>{s.common_name}</td>
                      <td className="px-4 py-3 italic" style={{ color: '#8b949e' }}>{s.genus} {s.species}</td>
                      <td className="px-4 py-3" style={{ color: dark ? '#8b949e' : '#6b7280' }}>{s.family}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className="badge px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-700 dark:text-forest-300">
                          {s.flora_type === 'plant' ? '🌿 Plant' : '🌳 Tree'}
                        </span>
                      </td>
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
                        <td
                          colSpan={6}
                          className="px-6 py-4"
                          style={{
                            background: dark ? '#161b22' : '#f9fdf9',
                            borderLeft: '4px solid var(--color-forest-500)',
                            borderBottom: '2px solid var(--color-forest-500)'
                          }}
                        >
                          <h3 className="font-semibold mb-4" style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}>
                            Edit: {s.common_name}
                          </h3>
                          <SpeciesForm
                            initial={s}
                            submitLabel="Save Changes"
                            onSubmit={handleEdit}
                            onCancel={() => setEditId(null)}
                            dark={dark}
                          />
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Tiles View */
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {processed.map(s => (
              <div
                key={s.species_id}
                className="p-4 rounded-xl border flex flex-col justify-between"
                style={{
                  background: dark ? '#1c2128' : '#ffffff',
                  borderColor: dark ? '#30363d' : '#e5e7eb'
                }}
              >
                <div>
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
                <div className="flex gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <Btn color="primary" onClick={() => setEditId(s.species_id)}>Edit</Btn>
                  <Btn color="danger" onClick={() => handleDelete(s.species_id)}>Delete</Btn>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── ExportPanel (Complete 8-Table Database Export Center) ── */
/* ── ExportPanel (Complete 8-Table Database Export Center) ── */
function ExportPanel({ trees = [], speciesList = [], areas = [], complaints = [], dark }) {
  const [targetTable, setTargetTable] = useState('trees');
  const [format, setFormat] = useState('csv');
  const [downloading, setDownloading] = useState(false);
  const [exportError, setExportError] = useState('');

  const tableOptions = [
    {
      key: 'trees',
      name: 'Campus Trees',
      count: trees.length,
      desc: 'All trees inventory, GPS coordinates, area, family, age, and notes.'
    },
    {
      key: 'species',
      name: 'Species Taxonomy',
      count: speciesList.length,
      desc: 'Botanical taxonomy, families, origins, ecological facts, and medical uses.'
    },
    {
      key: 'areas',
      name: 'Campus Areas',
      count: areas.length,
      desc: 'Campus zone names, area codes, descriptions, and directions/navigation notes.'
    },
    {
      key: 'complaints',
      name: 'Maintenance Reports',
      count: complaints.length,
      desc: 'Student/staff issues, tree damages, hazard complaints, and resolutions.'
    },
    {
      key: 'tree_images',
      name: 'Tree Images Gallery',
      desc: 'Image URLs, captions, primary badges, and photo associations.'
    },
    {
      key: 'tree_location_history',
      name: 'Location Audit Log',
      desc: 'Full coordinate changes history, admin logs, previous coordinates, and undo events.'
    },
    {
      key: 'page_views',
      name: 'Page Views Analytics',
      desc: 'Aggregated website traffic timestamps, routes, and visitor analytics.'
    },
    {
      key: 'users',
      name: 'Admin Accounts',
      desc: 'Administrator usernames, assigned roles, and creation timestamps.'
    }
  ];

  const exportTableData = async () => {
    setDownloading(true);
    setExportError('');

    try {
      if (targetTable === 'trees' && format === 'pdf') {
        await exportPDF();
        setDownloading(false);
        return;
      }

      await exportTable(targetTable, format);
    } catch (err) {
      console.error('Export error:', err);
      setExportError(err.message || 'Failed to export table. Ensure you are logged in as admin.');
    } finally {
      setDownloading(false);
    }
  };

  const selectedTableObj = tableOptions.find(t => t.key === targetTable);

  return (
    <div className="card p-6 max-w-4xl space-y-6">
      <div>
        <h2 className="font-bold text-xl text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <span>📁</span> Database Export Center
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Select any of the 8 database tables and export format to generate instant backups or reporting spreadsheets.
        </p>
      </div>

      {exportError && (
        <div className="p-3 rounded-lg text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900">
          ❌ {exportError}
        </div>
      )}

      {/* 1. Select Table (All 8 Tables) */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">
          Step 1: Select Database Table ({tableOptions.length} Tables Available)
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {tableOptions.map(t => (
            <div
              key={t.key}
              onClick={() => {
                setTargetTable(t.key);
                setExportError('');
              }}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                targetTable === t.key
                  ? 'border-forest-500 bg-forest-50/50 dark:bg-forest-950/30 ring-2 ring-forest-500/20'
                  : 'border-gray-200 dark:border-[#30363d] hover:border-gray-300 dark:hover:border-gray-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-gray-900 dark:text-gray-100">{t.name}</span>
                  {t.count !== undefined && (
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                      {t.count}
                    </span>
                  )}
                </div>
                <code className="text-[10px] text-forest-600 dark:text-forest-400 block mt-0.5">
                  {t.key}
                </code>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Select Format */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider mb-3 text-gray-500 dark:text-gray-400">
          Step 2: Choose File Format
        </label>
        <div className="flex gap-4 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
            <input
              type="radio"
              name="format"
              value="csv"
              checked={format === 'csv'}
              onChange={() => setFormat('csv')}
              className="accent-forest-600"
            />
            <span>CSV (Excel / Spreadsheets)</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
            <input
              type="radio"
              name="format"
              value="json"
              checked={format === 'json'}
              onChange={() => setFormat('json')}
              className="accent-forest-600"
            />
            <span>JSON (Structured Format)</span>
          </label>
          {targetTable === 'trees' && (
            <label className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
              <input
                type="radio"
                name="format"
                value="pdf"
                checked={format === 'pdf'}
                onChange={() => setFormat('pdf')}
                className="accent-forest-600"
              />
              <span>PDF Document</span>
            </label>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between flex-wrap gap-3">
        <span className="text-xs text-gray-400">
          Exporting table: <strong className="text-forest-600 dark:text-forest-400 font-mono font-semibold">{targetTable}</strong> ({selectedTableObj?.name}) as <strong className="text-forest-600 dark:text-forest-400 uppercase">{format}</strong>
        </span>
        <button
          disabled={downloading}
          onClick={exportTableData}
          className="btn-primary flex items-center gap-2 px-5 py-2.5 text-sm font-semibold"
        >
          {downloading ? 'Preparing Export...' : `⬇ Export ${targetTable.toUpperCase()} (${format.toUpperCase()})`}
        </button>
      </div>
    </div>
  );
}

/* ── StatsPanel ── */
function StatsPanel({ dark = false }) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    getDetailedStats()
      .then(r => setStats(r.data))
      .catch(() => setStats({ error: true }));
  }, []);

  if (!stats) return <p style={{ color: '#8b949e' }}>Loading statistics…</p>;
  if (stats.error) return <p style={{ color: '#ef4444' }}>Failed to load statistics.</p>;

  const headingStyle = { color: dark ? '#7dc070' : 'var(--color-forest-600)' };
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={headingStyle}>Native vs Exotic Species</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.nativeExotic || []}
                dataKey="count"
                nameKey="native_exotic"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ native_exotic, percent }) => `${native_exotic} ${(percent * 100).toFixed(0)}%`}
              >
                {(stats.nativeExotic || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-semibold mb-4" style={headingStyle}>Conservation Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.conservation || []}
                dataKey="count"
                nameKey="conservation_status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label={({ conservation_status, percent }) => `${conservation_status} ${(percent * 100).toFixed(0)}%`}
              >
                {(stats.conservation || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-semibold mb-4" style={headingStyle}>Trees per Area</h3>
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: 600 }}>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={stats.byArea || []} layout="vertical" margin={{ left: 160, right: 20 }}>
                <XAxis type="number" />
                <YAxis type="category" dataKey="area" width={155} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3d7a32" radius={[0, 4, 4, 0]} />
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
              <BarChart data={stats.byFamily || []} margin={{ bottom: 60 }}>
                <XAxis dataKey="family" angle={-35} textAnchor="end" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#1b5e20" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── ComplaintPanel ── */
function ComplaintPanel({ dark }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [updating, setUpdating] = useState(null);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const res = await getComplaints();
      setComplaints(res.data);
    } catch (err) {
      console.error('Failed to load complaints', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadComplaints();
  }, []);

  const updateStatus = async (id, status, admin_notes) => {
    try {
      setUpdating(id);
      await updateComplaintStatus(id, { status, admin_notes });
      await loadComplaints();
    } catch (err) {
      console.error('Failed to update complaint status', err);
    } finally {
      setUpdating(null);
    }
  };

  const filtered = filter === 'All'
    ? complaints
    : complaints.filter(c => c.status === filter);

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-500">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800 pb-3 flex-wrap">
        {['All', 'Pending', 'In Progress', 'Resolved'].map(tab => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filter === tab
                ? 'bg-forest-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-gray-400">
            No reports found.
          </div>
        ) : (
          filtered.map(complaint => (
            <div
              key={complaint.id}
              className="card p-5 flex flex-col md:flex-row gap-5"
            >
              {complaint.image_url && (
                <img
                  src={complaint.image_url}
                  alt="Issue"
                  className="w-full md:w-36 h-36 object-cover rounded-xl"
                />
              )}

              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    {complaint.issue_type}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      complaint.status === 'Resolved'
                        ? 'bg-green-100 text-green-700'
                        : complaint.status === 'In Progress'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {complaint.status}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {complaint.description}
                </p>

                <div className="text-xs text-gray-400 flex flex-wrap gap-4 pt-1">
                  {complaint.tree_id && <span>Tree ID: {complaint.tree_id}</span>}
                  {complaint.area && <span>Area: {complaint.area}</span>}
                  {complaint.user_email && <span>By: {complaint.user_email}</span>}
                </div>

                <div className="pt-3 flex gap-2 flex-wrap items-center">
                  <button
                    disabled={updating === complaint.id}
                    onClick={() =>
                      updateStatus(
                        complaint.id,
                        'In Progress',
                        complaint.admin_notes
                      )
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                  >
                    Set In Progress
                  </button>

                  <button
                    disabled={updating === complaint.id}
                    onClick={() =>
                      updateStatus(
                        complaint.id,
                        'Resolved',
                        complaint.admin_notes
                      )
                    }
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    ✓ Resolved
                  </button>

                  <span className="text-xs text-gray-400 ml-auto">
                    {new Date(complaint.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── ChangePassword ── */
function ChangePassword({ dark = false }) {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [msg, setMsg] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const iStyle = {
    background: dark ? '#1c2128' : '#fff',
    color: dark ? '#e6edf3' : '#111827',
    border: `1px solid ${dark ? '#30363d' : '#d1d5db'}`
  };
  const lStyle = { color: dark ? '#8b949e' : '#6b7280' };

  const handleSubmit = async () => {
    if (form.newPassword !== form.confirm) {
      setMsg('❌ New passwords do not match');
      return;
    }
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
      <input
        className="input mb-3"
        style={iStyle}
        type="password"
        value={form.currentPassword}
        onChange={e => set('currentPassword', e.target.value)}
      />
      <label className="block text-xs font-medium mb-1" style={lStyle}>New Password</label>
      <input
        className="input mb-3"
        style={iStyle}
        type="password"
        value={form.newPassword}
        onChange={e => set('newPassword', e.target.value)}
      />
      <label className="block text-xs font-medium mb-1" style={lStyle}>Confirm New Password</label>
      <input
        className="input mb-4"
        style={iStyle}
        type="password"
        value={form.confirm}
        onChange={e => set('confirm', e.target.value)}
      />
      <Btn color="primary" onClick={handleSubmit}>Update Password</Btn>
    </div>
  );
}

/* ── Dashboard Overview (No Redundant Quick Actions) ── */
function DashboardOverview({ trees, speciesList, areas, complaints, onNavigateTab, dark }) {
  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;

  const cards = [
    {
      title: 'Total Trees',
      count: trees.length,
      icon: '🌳',
      desc: 'Catalogued on campus',
      actionTab: 'list'
    },
    {
      title: 'Botanical Species',
      count: speciesList.length,
      icon: '🍃',
      desc: 'Registered taxonomy',
      actionTab: 'species'
    },
    {
      title: 'Campus Areas',
      count: areas.length,
      icon: '📍',
      desc: 'Mapped zones',
      actionTab: 'areas'
    },
    {
      title: 'Reports & Issues',
      count: complaints.length,
      badge: pendingComplaints > 0 ? `${pendingComplaints} Pending` : null,
      icon: '⚠️',
      desc: 'Maintenance inquiries',
      actionTab: 'complaints'
    }
  ];

  return (
    <div className="space-y-8">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(c => (
          <div
            key={c.title}
            onClick={() => onNavigateTab(c.actionTab)}
            className="card p-5 cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-forest-500 hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{c.icon}</span>
              {c.badge && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300">
                  {c.badge}
                </span>
              )}
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{c.count}</div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-0.5">{c.title}</div>
            <div className="text-xs text-gray-400 mt-1">{c.desc}</div>
          </div>
        ))}
      </div>

      {/* Embedded High-Level Visual Statistics */}
      <div>
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span>📊</span> Campus Flora Analytics
        </h3>
        <StatsPanel dark={dark} />
      </div>
    </div>
  );
}

/* ── Admin (Main Dashboard Component) ── */
const TABS = [
  { key: 'dashboard',   label: '📊 Dashboard' },
  { key: 'list',        label: '🌳 Manage Trees' },
  { key: 'add',         label: '➕ Add Tree' },
  { key: 'species',     label: '🍃 Species' },
  { key: 'areas',       label: '📍 Areas' },
  { key: 'boards',      label: '🪧 Boards' },
  { key: 'export',      label: '📁 Export Data' },
  { key: 'complaints',  label: '🌿 Reports' },
  { key: 'password',    label: '🔐 Security' }
];

export default function Admin() {
  const [dark] = useDarkMode();
  const navigate = useNavigate();
  const role = localStorage.getItem('role');

  const [trees, setTrees] = useState([]);
  const [areas, setAreas] = useState([]);
  const [speciesList, setSpeciesList] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [tab, setTab] = useState('dashboard');
  const [editId, setEditId] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);

  // Manage Trees Explorer State
  const [treeSearch, setTreeSearch] = useState('');
  const [treeSortField, setTreeSortField] = useState('tree_id');
  const [treeSortOrder, setTreeSortOrder] = useState('desc');
  const [treeViewMode, setTreeViewMode] = useState('list');
  const [treeNewOnly, setTreeNewOnly] = useState(false);

  const loadData = () => {
    return Promise.all([
      getTrees(),
      getAreas(),
      getSpecies(),
      getComplaints()
    ])
      .then(([t, a, s, c]) => {
        setTrees(t.data);
        setAreas(a.data);
        setSpeciesList(s.data);
        setComplaints(c.data);
      })
      .catch(err => {
        console.error('Failed to load dashboard data:', err);
      });
  };

  useEffect(() => {
    if (role !== 'admin') return;
    loadData().finally(() => setLoading(false));
  }, [role]);

  if (role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-xl font-semibold text-gray-700 dark:text-gray-200">Access Denied</p>
        <Btn color="primary" onClick={() => navigate('/login')}>Go to Login</Btn>
      </div>
    );
  }

  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 3000); };

  const handleAddTree = async (form) => {
    try {
      const res = await addTree(form);
      setTrees(prev => [res.data, ...prev]);
      setTab('list');
      flash('✅ Tree added successfully');
    } catch {
      flash('❌ Failed to add tree');
    }
  };

  const handleEditTree = async (form) => {
    try {
      const res = await updateTree(form.tree_id, form);
      setTrees(prev => prev.map(t => t.tree_id === form.tree_id ? res.data : t));
      setEditId(null);
      flash('✅ Tree updated successfully');
    } catch {
      flash('❌ Failed to update tree');
    }
  };

  const handleDeleteTree = async (id) => {
    if (!window.confirm(`Delete tree ${id}?`)) return;
    try {
      await deleteTree(id);
      setTrees(prev => prev.filter(t => t.tree_id !== id));
      flash('🗑️ Tree deleted');
    } catch {
      flash('❌ Failed to delete tree');
    }
  };

  const previewQR = async (tree_id, common_name) => {
    try {
      const res = await getTreeQR(tree_id);
      setQrModal({ qr: res.data.qr, tree_id, common_name });
    } catch {
      flash('❌ Failed to generate QR');
    }
  };

  // Trees Explorer Filter & Sort
  let processedTrees = trees.filter(t => {
    const q = treeSearch.toLowerCase();
    const match = !q || [t.common_name, t.botanical_name, t.area, t.tree_id]
      .some(v => v?.toLowerCase().includes(q));
    return match;
  });

  if (treeNewOnly) {
    processedTrees = processedTrees.slice(0, 15);
  }

  processedTrees.sort((a, b) => {
    let valA = (a[treeSortField] || '').toString().toLowerCase();
    let valB = (b[treeSortField] || '').toString().toLowerCase();
    const cmp = valA.localeCompare(valB, undefined, { numeric: true });
    return treeSortOrder === 'asc' ? cmp : -cmp;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
            <span>🌿</span> Green Atlas Dashboard
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Administrative console for flora mapping, species taxonomy, and campus zone management.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/map-editor')}
          className="btn-primary flex items-center gap-2 shadow-sm"
        >
          📍 Edit Map Coordinates
        </button>
      </div>

      <Flash msg={msg} />

      {/* Pill Navigation Bar */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-gray-800/80 rounded-xl mb-8 overflow-x-auto">
        {TABS.map(({ key, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setEditId(null);
              }}
              className={`px-4 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all duration-150 ${
                active
                  ? 'bg-white dark:bg-gray-900 text-forest-700 dark:text-forest-300 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {loading && <p className="text-gray-400 py-8 text-center">Loading dashboard data...</p>}

          {/* 1. DASHBOARD OVERVIEW */}
          {!loading && tab === 'dashboard' && (
            <DashboardOverview
              trees={trees}
              speciesList={speciesList}
              areas={areas}
              complaints={complaints}
              onNavigateTab={setTab}
              dark={dark}
            />
          )}

          {/* 2. MANAGE TREES WITH EXPLORER CONTROLS */}
          {!loading && tab === 'list' && (
            <div className="card overflow-hidden">
              <ExplorerToolbar
                search={treeSearch}
                onSearchChange={setTreeSearch}
                sortField={treeSortField}
                onSortFieldChange={setTreeSortField}
                sortOrder={treeSortOrder}
                onToggleSortOrder={() => setTreeSortOrder(o => (o === 'asc' ? 'desc' : 'asc'))}
                viewMode={treeViewMode}
                onViewModeChange={setTreeViewMode}
                newOnly={treeNewOnly}
                onToggleNewOnly={() => setTreeNewOnly(n => !n)}
                sortOptions={[
                  { value: 'tree_id', label: 'Tree ID (Newest First)' },
                  { value: 'common_name', label: 'Common Name' },
                  { value: 'botanical_name', label: 'Botanical Name' },
                  { value: 'area', label: 'Campus Area' },
                  { value: 'family', label: 'Family' },
                  { value: 'age', label: 'Age' }
                ]}
                count={processedTrees.length}
                dark={dark}
              />

              {treeViewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--color-forest-500)' }}>
                        {['Tree ID', 'Common Name', 'Botanical Name', 'Area', 'Actions'].map(h => (
                          <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {processedTrees.map(tree => (
                        <Fragment key={tree.tree_id}>
                          <tr
                            key={tree.tree_id}
                            className="transition-colors"
                            style={{
                              borderBottom: `1px solid ${dark ? '#30363d' : '#f3f4f6'}`,
                              background: dark ? '#1c2128' : '#ffffff'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = dark ? '#21262d' : '#f9fafb'}
                            onMouseLeave={e => e.currentTarget.style.background = dark ? '#1c2128' : '#ffffff'}
                          >
                            <td className="px-4 py-3 text-xs font-mono font-bold" style={{ color: '#8b949e' }}>
                              {tree.tree_id}
                            </td>
                            <td className="px-4 py-3 font-medium" style={{ color: dark ? '#e6edf3' : '#111827' }}>
                              {tree.common_name}
                            </td>
                            <td className="px-4 py-3 italic" style={{ color: '#8b949e' }}>
                              {tree.botanical_name}
                            </td>
                            <td className="px-4 py-3" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                              {tree.area}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-2">
                                <Btn
                                  color="primary"
                                  onClick={() => setEditId(editId === tree.tree_id ? null : tree.tree_id)}
                                >
                                  {editId === tree.tree_id ? 'Close' : 'Edit'}
                                </Btn>
                                <Btn color="danger" onClick={() => handleDeleteTree(tree.tree_id)}>
                                  Delete
                                </Btn>
                                <button
                                  onClick={() => previewQR(tree.tree_id, tree.common_name)}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-colors"
                                  style={{ background: '#0369a1' }}
                                >
                                  QR
                                </button>
                              </div>
                            </td>
                          </tr>

                          {editId === tree.tree_id && (
                            <tr key={`edit-${tree.tree_id}`}>
                              <td
                                colSpan={5}
                                className="px-6 py-4"
                                style={{
                                  background: dark ? '#161b22' : '#f9fdf9',
                                  borderLeft: '4px solid var(--color-forest-500)',
                                  borderBottom: '2px solid var(--color-forest-500)'
                                }}
                              >
                                <h3
                                  className="font-semibold mb-4"
                                  style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}
                                >
                                  Edit Tree: {tree.common_name} ({tree.tree_id})
                                </h3>
                                <TreeForm
                                  initial={tree}
                                  submitLabel="Save Changes"
                                  onSubmit={handleEditTree}
                                  onCancel={() => setEditId(null)}
                                  areas={areas}
                                  speciesList={speciesList}
                                  trees={trees}
                                  dark={dark}
                                />
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Tiles View */
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {processedTrees.map(tree => (
                    <div
                      key={tree.tree_id}
                      className="p-4 rounded-xl border flex flex-col justify-between"
                      style={{
                        background: dark ? '#1c2128' : '#ffffff',
                        borderColor: dark ? '#30363d' : '#e5e7eb'
                      }}
                    >
                      <div>
                        <div className="h-32 overflow-hidden rounded-lg mb-3 relative bg-forest-900/10">
                          {tree.image_link ? (
                            <img src={tree.image_link} alt={tree.common_name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">🌿</div>
                          )}
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-xs font-mono font-bold bg-black/60 text-white">
                            {tree.tree_id}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-gray-100">{tree.common_name}</h4>
                        <p className="text-xs italic text-gray-500">{tree.botanical_name}</p>
                        <p className="text-xs text-gray-400 mt-2">Area: <strong>{tree.area}</strong></p>
                      </div>
                      <div className="flex gap-2 mt-4 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <Btn color="primary" onClick={() => setEditId(tree.tree_id)}>Edit</Btn>
                        <Btn color="danger" onClick={() => handleDeleteTree(tree.tree_id)}>Delete</Btn>
                        <button
                          onClick={() => previewQR(tree.tree_id, tree.common_name)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white"
                          style={{ background: '#0369a1' }}
                        >
                          QR
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. ADD NEW TREE */}
          {!loading && tab === 'add' && (
            <div className="card p-6">
              <h2
                className="font-bold text-lg mb-2"
                style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}
              >
                Add New Tree
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Select botanical name and campus area. Tree ID, family, and common name are automatically calculated.
              </p>
              <TreeForm
                submitLabel="Add Tree"
                onSubmit={handleAddTree}
                areas={areas}
                speciesList={speciesList}
                trees={trees}
                dark={dark}
              />
            </div>
          )}

          {/* 4. MANAGE SPECIES */}
          {!loading && tab === 'species' && <SpeciesPanel dark={dark} />}

          {/* 5. MANAGE AREAS */}
          {!loading && tab === 'areas' && (
            <AreaPanel areas={areas} onRefresh={loadData} dark={dark} />
          )}

          {/* 5.5. BOARD MANAGEMENT */}
          {!loading && tab === 'boards' && (
            <BoardsPanel trees={trees} dark={dark} />
          )}
          
          {/* 6. EXPORT DATA (Dedicated Subpage for All 8 Tables) */}
          {!loading && tab === 'export' && (
            <ExportPanel
              trees={trees}
              speciesList={speciesList}
              areas={areas}
              complaints={complaints}
              dark={dark}
            />
          )}

          {/* 7. REPORTS & COMPLAINTS */}
          {!loading && tab === 'complaints' && <ComplaintPanel dark={dark} />}

          {/* 8. PASSWORD CHANGE */}
          {!loading && tab === 'password' && (
            <div className="card p-6">
              <h2
                className="font-semibold mb-4"
                style={{ color: dark ? '#7dc070' : 'var(--color-forest-600)' }}
              >
                Change Admin Password
              </h2>
              <ChangePassword dark={dark} />
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* QR Modal */}
      {qrModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setQrModal(null)}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-2xl p-8 text-center shadow-2xl min-w-64 max-w-sm"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-gray-900 dark:text-gray-100">
              {qrModal.common_name}
            </h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">Tree ID: {qrModal.tree_id}</p>
            <img src={qrModal.qr} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg shadow-sm" />
            <div className="flex gap-3 justify-center mt-6">
              <a href={qrModal.qr} download={`${qrModal.tree_id}-qr.png`}>
                <Btn color="primary">Download</Btn>
              </a>
              <Btn color="gray" onClick={() => setQrModal(null)}>
                Close
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
