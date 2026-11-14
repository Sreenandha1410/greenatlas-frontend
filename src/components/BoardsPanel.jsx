import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  getBoards, getBoardStats, getMissingBoards, bulkAddBoards,
  addBoard, updateBoard, updateBoardStatus, updateBoardDates,
  deleteBoard, exportBoards
} from '../api';

const STATUS_OPTIONS = ['Need to Fix', 'Board Fixed', 'Requires Maintenance'];
const STATUS_COLOR = {
  'Need to Fix':          'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
  'Board Fixed':          'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700',
  'Requires Maintenance': 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-300 dark:border-rose-700',
};
const STATUS_DOT = {
  'Need to Fix':          '🟡',
  'Board Fixed':          '🟢',
  'Requires Maintenance': '🔴',
};

const DOMAIN = 'https://sonagreenatlas.in';

const EMPTY_FORM = {
  primary_tree_id: '',
  board_type: 'individual',
  status: 'Need to Fix',
  group_tree_ids: [],
  group_count: 1,
  location_description: '',
  area: '',
  installed_date: '',
  last_checked: '',
  installed_by: '',
  notes: '',
};

/* ── SVG Icons ── */
function PrintIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4H7v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  );
}

function EditIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

/* ── Stat Card ── */
function StatCard({ icon, label, value, color }) {
  return (
    <div className={`card p-4 border-l-4 ${color}`}>
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-bold mt-1">{value ?? 0}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

/* ── Print Preview ── */
function openPrintPreview(board) {
  const treeId = board.primary_tree_id;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(`${DOMAIN}/trees/${treeId}`)}`;
  const isGroup = board.board_type === 'group';

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Board Preview — ${board.board_id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&family=Noto+Serif+Tamil&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', sans-serif; background: #f0fdf4; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .board { background: white; border: 3px solid #15803d; border-radius: 16px; width: 480px; padding: 28px 32px; box-shadow: 0 8px 32px rgba(21,128,61,0.15); }
    .header { display: flex; align-items: center; gap: 10px; border-bottom: 2px solid #dcfce7; padding-bottom: 14px; margin-bottom: 18px; }
    .logo { font-size: 28px; }
    .brand { font-size: 11px; font-weight: 700; color: #15803d; letter-spacing: 1.5px; text-transform: uppercase; }
    .sub-brand { font-size: 10px; color: #86efac; }
    .content { display: flex; gap: 20px; align-items: flex-start; }
    .info { flex: 1; }
    .common-name { font-size: 22px; font-weight: 900; color: #14532d; line-height: 1.2; }
    .botanical { font-size: 13px; font-style: italic; color: #4b5563; margin-top: 5px; }
    .group-badge { display: inline-block; margin-top: 10px; background: #dcfce7; color: #15803d; border-radius: 20px; padding: 3px 12px; font-size: 12px; font-weight: 700; }
    .area { font-size: 11px; color: #9ca3af; margin-top: 10px; }
    .qr-block { text-align: center; }
    .qr-block img { width: 110px; height: 110px; border: 2px solid #d1fae5; border-radius: 8px; }
    .tree-id { font-size: 10px; font-family: monospace; color: #6b7280; margin-top: 4px; }
    .footer { border-top: 2px solid #dcfce7; margin-top: 18px; padding-top: 12px; display: flex; justify-content: space-between; align-items: center; }
    .scan-text { font-size: 11px; color: #15803d; font-weight: 600; }
    .board-id { font-size: 10px; font-family: monospace; color: #d1d5db; }
    @media print {
      body { background: white; padding: 0; }
      .board { box-shadow: none; border: 2px solid #15803d; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div>
    <div class="board">
      <div class="header">
        <div class="logo">🌿</div>
        <div>
          <div class="brand">Green Atlas</div>
          <div class="sub-brand">Sona College of Technology, Salem</div>
        </div>
      </div>
      <div class="content">
        <div class="info">
          <div class="common-name">${board.common_name || '—'}</div>
          <div class="botanical">${board.botanical_name || '—'}</div>
          ${isGroup ? `<div class="group-badge">× ${board.group_count} trees</div>` : ''}
          ${board.area ? `<div class="area">📍 ${board.area}</div>` : ''}
        </div>
        <div class="qr-block">
          <img src="${qrUrl}" alt="QR Code"/>
          <div class="tree-id">${treeId}</div>
        </div>
      </div>
      <div class="footer">
        <div class="scan-text">📱 Scan to explore this tree</div>
        <div class="board-id">${board.board_id}</div>
      </div>
    </div>
    <div class="no-print" style="text-align:center;margin-top:16px;">
      <button onclick="window.print()" style="background:#15803d;color:white;border:none;padding:10px 28px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">
        🖨️ Print Board
      </button>
    </div>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
}

/* ── Bulk Import Modal ── */
function BulkModal({ onClose, onBulkImport, dark }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const parsedIds = useMemo(() => {
    return input
      .split(/[\n,;\s]+/)
      .map(s => s.trim())
      .filter(Boolean);
  }, [input]);

  const handleImport = async () => {
    if (!parsedIds.length) {
      setMsg('Please enter or paste at least one Tree ID.');
      return;
    }
    setLoading(true);
    setMsg('');
    try {
      const res = await onBulkImport(parsedIds);
      setMsg(`Success! Created ${res.created} board(s), skipped ${res.skipped} existing.`);
      setTimeout(() => { onClose(); }, 1200);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Bulk import failed.');
    } finally {
      setLoading(false);
    }
  };

  const lStyle = { color: dark ? '#7dc070' : '#15803d' };
  const inpClass = `w-full px-3 py-2 rounded-lg border font-mono text-sm ${dark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-green-500`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 ${dark ? 'bg-gray-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg" style={lStyle}>⚡ Bulk Add Boards</h2>
          <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">
            {parsedIds.length} Tree IDs detected
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Paste your 150+ Tree IDs below (separated by newlines, commas, or spaces). All boards will be created with status <strong>Need to Fix</strong> and empty dates. Existing boards will be safely skipped.
        </p>

        <textarea
          rows={8}
          className={inpClass}
          placeholder="e.g.&#10;T-001&#10;T-002&#10;T-003&#10;or: T-001, T-002, T-003"
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        {msg && (
          <div className={`mt-2 p-2 rounded text-xs font-semibold ${msg.includes('Success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {msg}
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-semibold ${dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
            Cancel
          </button>
          <button onClick={handleImport} disabled={loading || !parsedIds.length}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-50">
            {loading ? 'Creating Boards…' : `Create ${parsedIds.length} Boards`}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Add / Edit Board Modal ── */
function BoardModal({ board, trees, existingTreeIds = new Set(), onClose, onSave, dark }) {
  const [form, setForm] = useState(board ? {
    primary_tree_id: board.primary_tree_id,
    board_type: board.board_type,
    status: board.status,
    group_tree_ids: board.group_tree_ids || [],
    group_count: board.group_count || 1,
    location_description: board.location_description || '',
    area: board.area || '',
    installed_date: board.installed_date ? board.installed_date.slice(0, 10) : '',
    last_checked: board.last_checked ? board.last_checked.slice(0, 10) : '',
    installed_by: board.installed_by || '',
    notes: board.notes || '',
  } : { ...EMPTY_FORM });

  const [treeSearch, setTreeSearch] = useState('');
  const [msg, setMsg] = useState('');
  const [saving, setSaving] = useState(false);

  // Available trees for dropdown: exclude trees that already have a board (unless currently editing this board)
  const availableTrees = useMemo(() => {
    return trees.filter(t => {
      if (board && t.tree_id === board.primary_tree_id) return true;
      return !existingTreeIds.has(t.tree_id);
    });
  }, [trees, existingTreeIds, board]);

  const selectedTree = trees.find(t => t.tree_id === form.primary_tree_id);
  const sameSpeciesTrees = form.primary_tree_id && selectedTree
    ? availableTrees.filter(t => t.botanical_name === selectedTree.botanical_name && t.tree_id !== form.primary_tree_id)
    : [];

  const iS = s => (s || '').toLowerCase();
  const filteredTrees = treeSearch.length > 0
    ? availableTrees.filter(t =>
        iS(t.tree_id).includes(iS(treeSearch)) ||
        iS(t.common_name).includes(iS(treeSearch)) ||
        iS(t.area).includes(iS(treeSearch))
      ).slice(0, 15)
    : [];

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handlePrimarySelect = (tree) => {
    setForm(f => ({
      ...f,
      primary_tree_id: tree.tree_id,
      area: tree.area || f.area,
      group_tree_ids: [],
      group_count: 1,
    }));
    setTreeSearch('');
  };

  const toggleGroupTree = (tree_id) => {
    setForm(f => {
      const ids = f.group_tree_ids.includes(tree_id)
        ? f.group_tree_ids.filter(id => id !== tree_id)
        : [...f.group_tree_ids, tree_id];
      return { ...f, group_tree_ids: ids, group_count: ids.length + 1 };
    });
  };

  const handleSave = async () => {
    if (!form.primary_tree_id) { setMsg('Primary tree ID is required.'); return; }
    setSaving(true); setMsg('');
    try {
      await onSave(form);
      onClose();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const lStyle = { color: dark ? '#7dc070' : '#15803d' };
  const inp = `w-full px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-green-500`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl p-6 my-4 ${dark ? 'bg-gray-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        <h2 className="font-bold text-lg mb-4" style={lStyle}>
          {board ? '✏️ Edit Board' : '➕ Add New Board'}
        </h2>

        {/* Board Type */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={lStyle}>Board Type</label>
          <div className="flex gap-2">
            {['individual', 'group'].map(t => (
              <button key={t} onClick={() => set('board_type', t)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${form.board_type === t ? 'bg-green-600 text-white' : (dark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')}`}>
                {t === 'individual' ? '🪵 Individual' : '🌳 Group'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {form.board_type === 'group' ? 'One board covers multiple trees of the same species.' : 'One board for one tree.'}
          </p>
        </div>

        {/* Primary Tree Search */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={lStyle}>Primary Tree *</label>
          {selectedTree ? (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${dark ? 'bg-gray-800 border-gray-700' : 'bg-green-50 border-green-200'}`}>
              <span className="text-sm font-mono font-bold text-green-700 dark:text-green-400">{selectedTree.tree_id}</span>
              <span className="text-sm font-medium">{selectedTree.common_name}</span>
              <span className="text-xs text-gray-400">{selectedTree.area}</span>
              <button onClick={() => set('primary_tree_id', '')} className="ml-auto text-red-400 hover:text-red-600 text-xs font-semibold">✕ Change</button>
            </div>
          ) : (
            <div className="relative">
              <input className={inp} placeholder="Search unboarded trees by ID, common name, or area..."
                value={treeSearch} onChange={e => setTreeSearch(e.target.value)} />
              {filteredTrees.length > 0 && (
                <div className={`absolute z-10 w-full mt-1 rounded-lg shadow-lg border overflow-hidden max-h-56 overflow-y-auto ${dark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                  {filteredTrees.map(t => (
                    <button key={t.tree_id} onClick={() => handlePrimarySelect(t)}
                      className={`w-full text-left px-3 py-2 text-sm flex gap-2 items-center hover:bg-green-50 dark:hover:bg-gray-700 transition-colors`}>
                      <span className="font-mono font-bold text-green-700 dark:text-green-400">{t.tree_id}</span>
                      <span className="text-gray-700 dark:text-gray-300 font-medium">{t.common_name}</span>
                      <span className="text-xs text-gray-400 ml-auto">{t.area}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Group tree selection */}
        {form.board_type === 'group' && selectedTree && (
          <div className="mb-4">
            <label className="block text-xs font-medium mb-1" style={lStyle}>
              Include Additional Trees (same species) — {form.group_count} total selected
            </label>
            {sameSpeciesTrees.length === 0 ? (
              <p className="text-xs text-gray-400 italic">No other unboarded trees of this species found.</p>
            ) : (
              <div className={`max-h-40 overflow-y-auto rounded-lg border p-2 space-y-1 ${dark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                {sameSpeciesTrees.map(t => (
                  <label key={t.tree_id} className="flex items-center gap-2 cursor-pointer hover:bg-green-50 dark:hover:bg-gray-700 px-2 py-1 rounded">
                    <input type="checkbox" checked={form.group_tree_ids.includes(t.tree_id)} onChange={() => toggleGroupTree(t.tree_id)} />
                    <span className="font-mono text-xs text-green-700 dark:text-green-400">{t.tree_id}</span>
                    <span className="text-sm">{t.common_name}</span>
                    <span className="text-xs text-gray-400 ml-auto">{t.area}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Fields Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>Status</label>
            <select className={inp} value={form.status} onChange={e => set('status', e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>Area</label>
            <input className={inp} value={form.area} onChange={e => set('area', e.target.value)} placeholder="Campus area" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>Installed Date</label>
            <input type="date" className={inp} value={form.installed_date} onChange={e => set('installed_date', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>Last Checked</label>
            <input type="date" className={inp} value={form.last_checked} onChange={e => set('last_checked', e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1" style={lStyle}>Installed By</label>
            <input className={inp} value={form.installed_by} onChange={e => set('installed_by', e.target.value)} placeholder="Name / Team" />
          </div>
          {form.board_type === 'group' && (
            <div>
              <label className="block text-xs font-medium mb-1" style={lStyle}>Group Count</label>
              <input type="number" className={inp} value={form.group_count} readOnly />
            </div>
          )}
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={lStyle}>Location Description</label>
          <textarea rows={2} className={inp} value={form.location_description} onChange={e => set('location_description', e.target.value)} placeholder="e.g. Near main gate, left side walkway" />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={lStyle}>Notes</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Condition, screws replaced, etc." />
        </div>

        {msg && <p className="text-sm text-red-500 mb-3">{msg}</p>}

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className={`px-4 py-2 rounded-lg text-sm font-semibold ${dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>Cancel</button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 disabled:opacity-60">
            {saving ? 'Saving…' : (board ? 'Save Changes' : 'Add Board')}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Missing Boards Section with Tree/Plant Filter ── */
function MissingBoards({ missing, onAddBoard, dark }) {
  const [search, setSearch] = useState('');
  const [floraFilter, setFloraFilter] = useState('tree'); // Default to 'tree' since boards are mainly for trees

  const filtered = useMemo(() => {
    return missing.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || t.tree_id.toLowerCase().includes(q) || (t.common_name || '').toLowerCase().includes(q) || (t.area || '').toLowerCase().includes(q);
      const matchFlora = !floraFilter || (t.flora_type || 'tree') === floraFilter;
      return matchSearch && matchFlora;
    });
  }, [missing, search, floraFilter]);

  return (
    <div className={`mt-6 rounded-xl border p-4 ${dark ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50/70 border-amber-200'}`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
          ⚠️ Trees Without Boards
          <span className="text-xs font-semibold bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
            {filtered.length} of {missing.length}
          </span>
        </h3>

        {/* Tree / Plant Filter Pill Toggle */}
        <div className="flex items-center gap-1 bg-amber-100/80 dark:bg-gray-800 p-1 rounded-lg text-xs font-semibold">
          <button
            onClick={() => setFloraFilter('tree')}
            className={`px-3 py-1 rounded-md transition-all ${floraFilter === 'tree' ? 'bg-green-700 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
            🌳 Trees Only
          </button>
          <button
            onClick={() => setFloraFilter('plant')}
            className={`px-3 py-1 rounded-md transition-all ${floraFilter === 'plant' ? 'bg-green-700 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
            🌿 Plants Only
          </button>
          <button
            onClick={() => setFloraFilter('')}
            className={`px-3 py-1 rounded-md transition-all ${floraFilter === '' ? 'bg-green-700 text-white shadow-sm' : 'text-gray-600 dark:text-gray-300'}`}>
            All Flora
          </button>
        </div>
      </div>

      <input
        className={`w-full max-w-xs px-3 py-1.5 rounded-lg border text-sm mb-3 ${dark ? 'bg-gray-800 border-gray-600 text-gray-100' : 'bg-white border-amber-300'} focus:outline-none`}
        placeholder="Filter by ID, name, or area…" value={search} onChange={e => setSearch(e.target.value)}
      />

      <div className="overflow-x-auto max-h-96 overflow-y-auto">
        <table className="w-full text-sm min-w-[550px]">
          <thead>
            <tr className={`text-left text-xs font-semibold ${dark ? 'text-gray-400' : 'text-gray-500'}`}>
              <th className="pb-2">Tree ID</th>
              <th className="pb-2">Common Name</th>
              <th className="pb-2">Botanical Name</th>
              <th className="pb-2">Type</th>
              <th className="pb-2">Area</th>
              <th className="pb-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="py-4 text-center text-gray-400 text-xs">No unboarded trees in this filter category 🎉</td></tr>
            ) : filtered.map(t => (
              <tr key={t.tree_id} className={`border-t ${dark ? 'border-gray-700' : 'border-amber-100'}`}>
                <td className="py-2 font-mono text-xs font-bold text-green-700 dark:text-green-400">{t.tree_id}</td>
                <td className="py-2 font-medium">{t.common_name}</td>
                <td className="py-2 italic text-xs text-gray-400">{t.botanical_name}</td>
                <td className="py-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${t.flora_type === 'plant' ? 'bg-emerald-100 text-emerald-800' : 'bg-green-100 text-green-800'}`}>
                    {t.flora_type === 'plant' ? '🌿 Plant' : '🌳 Tree'}
                  </span>
                </td>
                <td className="py-2 text-xs text-gray-500">{t.area}</td>
                <td className="py-2 text-right">
                  <button onClick={() => onAddBoard(t)}
                    className="px-3 py-1 rounded-md text-xs font-semibold text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all">
                    + Add Board
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── BoardsPanel (Main) ── */
export default function BoardsPanel({ trees = [], dark = false }) {
  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);
  const [missing, setMissing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showMissing, setShowMissing] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFlora, setFilterFlora] = useState('');

  // Modal
  const [modal, setModal] = useState(null); // null | { mode: 'add'|'edit', board?: {} }

  // Set of all tree IDs that already have a board
  const existingBoardTreeIds = useMemo(() => {
    const set = new Set();
    boards.forEach(b => {
      if (b.primary_tree_id) set.add(b.primary_tree_id);
      if (Array.isArray(b.group_tree_ids)) {
        b.group_tree_ids.forEach(id => set.add(id));
      }
    });
    return set;
  }, [boards]);

  // Initial data loader
  const load = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        getBoards({
          status: filterStatus || undefined,
          type: filterType || undefined,
          search: search || undefined,
          flora_type: filterFlora || undefined,
        }),
        getBoardStats()
      ]);
      setBoards(bRes.data);
      setStats(sRes.data);
    } catch (err) {
      setMsg('Failed to load boards data.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, [filterStatus, filterType, search, filterFlora]);

  useEffect(() => { load(); }, [load]);

  const loadMissing = async () => {
    try {
      const res = await getMissingBoards();
      setMissing(res.data);
    } catch {
      setMissing([]);
    }
  };

  const toggleMissing = () => {
    if (!showMissing) loadMissing();
    setShowMissing(v => !v);
  };

  const handleSave = async (form) => {
    if (modal.mode === 'add') {
      await addBoard(form);
    } else {
      await updateBoard(modal.board.id, form);
    }
    load(true);
    if (showMissing) loadMissing();
  };

  const handleDelete = async (board) => {
    if (!confirm(`Delete board ${board.board_id}?`)) return;
    // Optimistic removal
    setBoards(bs => bs.filter(b => b.id !== board.id));
    try {
      await deleteBoard(board.id);
      load(true);
      if (showMissing) loadMissing();
    } catch {
      setMsg('Delete failed.');
      load(true);
    }
  };

  // Instant smooth status change (NO RELOAD / NO FLICKER)
  const handleQuickStatus = async (id, status) => {
    // 1. Optimistic UI update instantly
    setBoards(bs => bs.map(b => b.id === id ? { ...b, status } : b));
    try {
      await updateBoardStatus(id, status);
      // 2. Background stats sync without full page reload
      const sRes = await getBoardStats();
      setStats(sRes.data);
    } catch {
      setMsg('Status update failed.');
      load(true);
    }
  };

  // Instant smooth inline date change (NO RELOAD / NO FLICKER)
  const handleQuickDate = async (id, field, value) => {
    // 1. Optimistic UI update
    setBoards(bs => bs.map(b => b.id === id ? { ...b, [field]: value } : b));
    try {
      await updateBoardDates(id, { [field]: value });
    } catch {
      setMsg('Failed to update date.');
      load(true);
    }
  };

  const handleBulkImport = async (treeIds) => {
    const res = await bulkAddBoards(treeIds);
    load(true);
    if (showMissing) loadMissing();
    return res.data;
  };

  const handleExport = async () => {
    try { await exportBoards(); }
    catch { setMsg('Export failed.'); }
  };

  const openAdd = (tree = null) => {
    if (tree) {
      setModal({
        mode: 'add',
        board: {
          primary_tree_id: tree.tree_id,
          area: tree.area || '',
          board_type: 'individual',
          status: 'Need to Fix',
          group_tree_ids: [],
          group_count: 1,
        }
      });
    } else {
      setModal({ mode: 'add' });
    }
  };

  const openEdit = (board) => setModal({ mode: 'edit', board });

  const lStyle = { color: dark ? '#7dc070' : '#15803d' };
  const inp = `px-3 py-2 rounded-lg border text-sm ${dark ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-green-500`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl" style={lStyle}>🪧 Board Management</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Maintain physical aluminum identification boards and field status.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => setBulkOpen(true)}
            className="px-3 py-2 rounded-lg text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition-all">
            <span>⚡</span> Bulk Add
          </button>
          <button onClick={toggleMissing}
            className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${showMissing ? 'bg-amber-600 text-white' : (dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100')}`}>
            ⚠️ Missing Boards
          </button>
          <button onClick={handleExport}
            className={`px-3 py-2 rounded-lg text-sm font-semibold ${dark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            📥 Export CSV
          </button>
          <button onClick={() => openAdd()}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all">
            ➕ Add Board
          </button>
        </div>
      </div>

      {msg && (
        <div className={`px-4 py-2 rounded-lg text-sm font-medium ${msg.includes('failed') || msg.includes('Failed') ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'}`}>
          {msg}
        </div>
      )}

      {/* KPI Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard icon="🪧" label="Total Boards" value={stats.total} color="border-l-blue-500" />
          <StatCard icon="🟢" label="Board Fixed" value={stats.fixed} color="border-l-green-500" />
          <StatCard icon="🟡" label="Need to Fix" value={stats.need_fix} color="border-l-yellow-500" />
          <StatCard icon="🔴" label="Maintenance" value={stats.maintenance} color="border-l-red-500" />
          <StatCard icon="🪵" label="Individual" value={stats.individual} color="border-l-stone-400" />
          <StatCard icon="🌳" label="Group" value={stats.group_boards} color="border-l-emerald-600" />
        </div>
      )}

      {/* Filter Bar with Flora Type */}
      <div className="flex flex-wrap gap-2 items-center">
        <input className={`${inp} flex-1 min-w-48`} placeholder="🔍 Search board ID, tree ID, name, area…"
          value={search} onChange={e => setSearch(e.target.value)} />
        <select className={inp} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_DOT[s]} {s}</option>)}
        </select>
        <select className={inp} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          <option value="individual">🪵 Individual</option>
          <option value="group">🌳 Group</option>
        </select>
        <select className={inp} value={filterFlora} onChange={e => setFilterFlora(e.target.value)}>
          <option value="">All Flora</option>
          <option value="tree">🌳 Trees Only</option>
          <option value="plant">🌿 Plants Only</option>
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 text-center text-gray-400 text-sm">Loading boards…</div>
          ) : boards.length === 0 ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              No boards found. <button onClick={() => openAdd()} className="text-green-600 font-semibold hover:underline">Add the first one →</button>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[950px]">
              <thead>
                <tr className={`text-left text-xs font-semibold uppercase tracking-wide ${dark ? 'bg-gray-800/80 text-gray-400' : 'bg-gray-50 text-gray-500'}`}>
                  <th className="px-4 py-3">Board ID</th>
                  <th className="px-4 py-3">Tree ID</th>
                  <th className="px-4 py-3">Common Name</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Area</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Installed Date</th>
                  <th className="px-4 py-3">Last Checked</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {boards.map(b => (
                  <tr key={b.id} className={`border-t transition-colors ${dark ? 'border-gray-800 hover:bg-gray-800/40' : 'border-gray-100 hover:bg-gray-50'}`}>
                    <td className="px-4 py-3 font-mono text-xs font-bold text-green-700 dark:text-green-400 whitespace-nowrap">{b.board_id}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{b.primary_tree_id}</td>
                    <td className="px-4 py-3 font-medium whitespace-nowrap">{b.common_name || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.board_type === 'group' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300'}`}>
                        {b.board_type === 'group' ? `🌳 Group ×${b.group_count}` : '🪵 Individual'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">{b.area || '—'}</td>
                    
                    {/* Status Dropdown (Smooth Instant Update) */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={b.status}
                        onChange={e => handleQuickStatus(b.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-2.5 py-1 cursor-pointer focus:outline-none transition-colors ${STATUS_COLOR[b.status]}`}
                      >
                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_DOT[s]} {s}</option>)}
                      </select>
                    </td>

                    {/* Inline Installed Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="date"
                        className={`text-xs px-2 py-1 rounded border ${dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'} focus:outline-none focus:ring-1 focus:ring-green-500`}
                        value={b.installed_date ? b.installed_date.slice(0, 10) : ''}
                        onChange={e => handleQuickDate(b.id, 'installed_date', e.target.value)}
                      />
                    </td>

                    {/* Inline Last Checked Date */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="date"
                        className={`text-xs px-2 py-1 rounded border ${dark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'} focus:outline-none focus:ring-1 focus:ring-green-500`}
                        value={b.last_checked ? b.last_checked.slice(0, 10) : ''}
                        onChange={e => handleQuickDate(b.id, 'last_checked', e.target.value)}
                      />
                    </td>

                    {/* Action Buttons: Strictly Horizontal with Modern SVG Icons */}
                    <td className="px-4 py-3 whitespace-nowrap min-w-[130px] text-right">
                      <div className="inline-flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openPrintPreview(b)}
                          title="Print Board Preview"
                          className="p-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all"
                        >
                          <PrintIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openEdit(b)}
                          title="Edit Board Details"
                          className="p-1.5 rounded-lg text-white bg-amber-500 hover:bg-amber-600 shadow-sm transition-all"
                        >
                          <EditIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(b)}
                          title="Delete Board"
                          className="p-1.5 rounded-lg text-white bg-rose-500 hover:bg-rose-600 shadow-sm transition-all"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {!loading && boards.length > 0 && (
          <div className={`px-4 py-2 text-xs text-gray-400 border-t ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
            Showing {boards.length} board{boards.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Missing Boards Explorer */}
      {showMissing && (
        <MissingBoards
          missing={missing}
          onAddBoard={tree => openAdd(tree)}
          dark={dark}
        />
      )}

      {/* Add / Edit Board Modal */}
      {modal && (
        <BoardModal
          board={modal.board || null}
          trees={trees}
          existingTreeIds={existingBoardTreeIds}
          onClose={() => setModal(null)}
          onSave={handleSave}
          dark={dark}
        />
      )}

      {/* Bulk Add Modal */}
      {bulkOpen && (
        <BulkModal
          onClose={() => setBulkOpen(false)}
          onBulkImport={handleBulkImport}
          dark={dark}
        />
      )}
    </div>
  );
}
