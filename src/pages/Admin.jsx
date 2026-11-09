import { useState, useEffect, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getTrees, getAreas, addTree, updateTree, deleteTree, changePassword,
  getTreeQR, exportCSV, exportPDF, getDetailedStats, getSpecies,
  addSpecies, updateSpecies, deleteSpecies, getComplaints, updateComplaintStatus,
  addArea, deleteArea, updateAreaInfo
} from '../api';
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
  order: '',
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

/* ── TreeForm (With Auto-ID, Family & Common Name Assignment) ── */
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

  // Calculate botanical name options from species table
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

  // Auto-generation logic when botanical_name or area changes in "Add" mode
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

    // 1. Get Area Code
    const areaObj = areas.find(a => a.area === areaName);
    const areaCode = (areaObj?.area_code || areaName.substring(0, 3)).toUpperCase().trim();

    // 2. Get Species ID
    let speciesCode = specId;
    if (!speciesCode) {
      const sp = speciesList.find(s => {
        const full = `${s.genus || ''} ${s.species || ''}`.trim();
        return full === botName || s.common_name === botName;
      });
      speciesCode = sp?.species_id || '';
    }
    speciesCode = (speciesCode || 'X').trim();

    // 3. Count existing trees for this botanical name in this area
    const count = trees.filter(
      t => t.area === areaName && t.botanical_name === botName
    ).length;
    const nextSeq = String(count + 1).padStart(3, '0');

    return `${areaCode}${speciesCode}${nextSeq}`;
  };

  return (
    <div>
      {/* Step 1: Area & Botanical Name Selection */}
      <div className="bg-forest-50/50 dark:bg-forest-950/20 p-4 rounded-xl border border-forest-100 dark:border-forest-900/50 mb-5">
        <p className="text-xs font-semibold text-forest-700 dark:text-forest-400 mb-3 uppercase tracking-wider">
          Choose Basic Info...
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>
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
            <label className="block text-xs font-medium mb-1" style={lStyle}>
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

      {/* Step 2: Auto-Assigned & Details */}
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
              background: !manualIdEdit && !isEditing ? (dark ? '#161b22' : '#f0fdf4') : iStyle.background
            }}
            value={form.tree_id ?? ''}
            onChange={e => {
              setManualIdEdit(true);
              set('tree_id', e.target.value);
            }}
            readOnly={!manualIdEdit && !isEditing}
            placeholder=" "
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
        {field('order', 'Order')}
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

/* ── AreaPanel (Subpage to Manage & Add Campus Areas) ── */
function AreaPanel({ areas = [], onRefresh, dark = false }) {
  const [form, setForm] = useState(AREA_EMPTY);
  const [adding, setAdding] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');

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

  const filtered = areas.filter(a =>
    !search ||
    a.area?.toLowerCase().includes(search.toLowerCase()) ||
    a.area_code?.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Flash msg={msg} />

      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <input
          className="input max-w-xs"
          placeholder="Search campus areas…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={iStyle}
        />
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
                Area Name <span className="text-red-500">*</span>
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
                Area Code <span className="text-red-500">*</span>
              </label>
              <input
                className="input font-mono uppercase"
                style={iStyle}
                value={form.area_code}
                onChange={e => setForm(f => ({ ...f, area_code: e.target.value.toUpperCase() }))}
                placeholder="eg. CAI"
                maxLength={3}
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

      {/* Areas Table */}
      <div className="card overflow-x-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-200">
          Campus Areas ({filtered.length})
        </div>
        <table className="w-full text-sm min-w-[650px]">
          <thead>
            <tr style={{ background: 'var(--color-forest-500)' }}>
              {['Area Name', 'Code', 'Photo', 'Description', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(a => (
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
    </div>
  );
}

/* ── SpeciesPanel ── */
function SpeciesPanel({ dark = false }) {
  const [species, setSpecies] = useState([]);
  const [editId, setEditId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState('');
  const [search, setSearch] = useState('');
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

  const filtered = species.filter(s =>
    !search ||
    s.common_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.species?.toLowerCase().includes(search.toLowerCase()) ||
    s.species_id?.toLowerCase().includes(search.toLowerCase()) ||
    s.family?.toLowerCase().includes(search.toLowerCase()) ||
    s.genus?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <Flash msg={msg} />
      <div className="flex items-center justify-between mb-4 gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search species…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
        />
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

      <div className="card overflow-x-auto">
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 font-semibold text-gray-700 dark:text-gray-200">
          All Species ({filtered.length})
        </div>
        <table className="w-full text-sm min-w-[600px]">
          <thead>
            <tr style={{ background: 'var(--color-forest-500)' }}>
              {['ID', 'Common Name', 'Botanical Name', 'Family', 'Actions'].map(h => (
                <th key={h} className="text-left px-4 py-3 font-medium text-white text-sm">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filtered.map(s => (
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
                    <td
                      colSpan={5}
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

/* ── Dashboard Overview Component (Modern Dashboard Landing) ── */
function DashboardOverview({ trees, speciesList, areas, complaints, onNavigateTab, dark }) {
  const pendingComplaints = complaints.filter(c => c.status === 'Pending').length;

  const cards = [
    {
      title: 'Total Trees',
      count: trees.length,
      icon: '🌳',
      desc: 'Catalogued on campus',
      actionTab: 'list',
      color: 'forest'
    },
    {
      title: 'Botanical Species',
      count: speciesList.length,
      icon: '🍃',
      desc: 'Registered taxonomy',
      actionTab: 'species',
      color: 'blue'
    },
    {
      title: 'Campus Areas',
      count: areas.length,
      icon: '📍',
      desc: 'Mapped zones',
      actionTab: 'areas',
      color: 'amber'
    },
    {
      title: 'Reports & Issues',
      count: complaints.length,
      badge: pendingComplaints > 0 ? `${pendingComplaints} Pending` : null,
      icon: '⚠️',
      desc: 'Maintenance inquiries',
      actionTab: 'complaints',
      color: 'rose'
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

      {/* Quick Actions Bar */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
          <span>⚡</span> Quick Management Actions
        </h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => onNavigateTab('add')}
            className="btn-primary flex items-center gap-2 text-sm px-4 py-2"
          >
            ➕ Add New Tree
          </button>
          <button
            onClick={() => onNavigateTab('areas')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-forest-100 text-forest-800 dark:bg-forest-900/40 dark:text-forest-200 hover:bg-forest-200 transition-colors"
          >
            📍 Add / Manage Areas
          </button>
          <button
            onClick={() => onNavigateTab('species')}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200 hover:bg-emerald-200 transition-colors"
          >
            🍃 Manage Species
          </button>
          <button
            onClick={exportCSV}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-sky-700 hover:bg-sky-800 transition-colors"
          >
            ⬇ Export CSV
          </button>
          <button
            onClick={exportPDF}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-rose-700 hover:bg-rose-800 transition-colors"
          >
            ⬇ Export PDF
          </button>
        </div>
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
  { key: 'dashboard',   label: '📊 Dashboard', desc: 'Overview & Analytics' },
  { key: 'list',        label: '🌳 Manage Trees', desc: 'Catalog & QR' },
  { key: 'add',         label: '➕ Add Tree', desc: 'Auto ID generator' },
  { key: 'species',     label: '🍃 Species', desc: 'Botanical database' },
  { key: 'areas',       label: '📍 Areas', desc: 'Campus zones' },
  { key: 'complaints',  label: '🌿 Reports', desc: 'Issue tracker' },
  { key: 'password',    label: '🔐 Security', desc: 'Password change' }
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
  const [treeSearch, setTreeSearch] = useState('');

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
      setTrees(prev => [...prev, res.data]);
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

  const filteredTrees = trees.filter(t => {
    const q = treeSearch.toLowerCase();
    return (
      !q ||
      [t.common_name, t.botanical_name, t.area, t.tree_id].some(v =>
        v?.toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Dashboard Top Header */}
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

      {/* Navigation Subpage Bar (Pill Tabs) */}
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

          {/* 2. MANAGE TREES */}
          {!loading && tab === 'list' && (
            <div className="card overflow-hidden">
              <div
                className="p-4 border-b flex items-center justify-between flex-wrap gap-3"
                style={{ borderColor: dark ? '#30363d' : '#f3f4f6' }}
              >
                <div>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">
                    All Trees ({filteredTrees.length})
                  </span>
                  <span className="text-xs text-gray-400 ml-2">
                    Click 'Edit' to alter tree info or generate QR
                  </span>
                </div>
                <div className="flex gap-2 flex-wrap items-center">
                  <input
                    className="input text-sm w-56"
                    placeholder="Search trees…"
                    value={treeSearch}
                    onChange={e => setTreeSearch(e.target.value)}
                    style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
                  />
                  <button
                    onClick={exportCSV}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white shadow-sm"
                    style={{ background: '#0369a1' }}
                  >
                    ⬇ CSV
                  </button>
                  <button
                    onClick={exportPDF}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium text-white shadow-sm"
                    style={{ background: '#be123c' }}
                  >
                    ⬇ PDF
                  </button>
                </div>
              </div>

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
                    {filteredTrees.map(tree => (
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
                Select the botanical name and campus area. Tree ID, family and common name will be automatically calculated.
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

          {/* 6. REPORTS & COMPLAINTS */}
          {!loading && tab === 'complaints' && <ComplaintPanel dark={dark} />}

          {/* 7. PASSWORD CHANGE */}
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
