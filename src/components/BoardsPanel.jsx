import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import {
  getBoards, getBoardStats, getMissingBoards, bulkAddBoards,
  addBoard, updateBoard, updateBoardStatus, updateBoardDates,
  deleteBoard, exportBoards
} from '../api';

const DEFAULT_CENTER = [11.678, 78.125];
const DEFAULT_ZOOM = 18;
const DOMAIN = 'https://sonagreenatlas.in';

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

/* ── Bulk Import Modal (z-[9999] so it stays above the map) ── */
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
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-lg rounded-2xl shadow-2xl p-6 ${dark ? 'bg-gray-900' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg" style={lStyle}>⚡ Bulk Add Boards</h2>
          <span className="text-xs bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-semibold">
            {parsedIds.length} Tree IDs detected
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Paste Tree IDs (separated by newlines, commas, or spaces). Boards will be created with status <strong>Need to Fix</strong>. Existing boards are safely skipped.
        </p>

        <textarea
          rows={8}
          className={inpClass}
          placeholder="e.g.&#10;1YBB3001&#10;1YBB3002&#10;or: 1YBB3001, 1YBB3002"
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

/* ── Add / Edit Board Modal (z-[9999] so it stays above the map) ── */
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
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-start justify-center overflow-y-auto p-4" onClick={onClose}>
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

        {/* Group selection */}
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

        {/* Form fields */}
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
          <textarea rows={2} className={inp} value={form.location_description} onChange={e => set('location_description', e.target.value)} placeholder="e.g. Near main gate, left walkway" />
        </div>
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1" style={lStyle}>Notes</label>
          <textarea rows={2} className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Condition, maintenance notes..." />
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

/* ── Interactive Map View Component ── */
function BoardsMapView({
  trees = [],
  boards = [],
  onSelectTree,
  selectedTree,
  onQuickStatusChange,
  onOpenAdd,
  onOpenEdit,
  onOpenPrint,
  dark
}) {
  const [mapLayer, setMapLayer] = useState('satellite'); // 'satellite' | 'street'
  const [floraFilter, setFloraFilter] = useState(''); // '' | 'tree' | 'plant'
  const [statusFilter, setStatusFilter] = useState('');
  const [mapSearch, setMapSearch] = useState('');

  // Quick lookup dictionary for boards by tree_id
  const { boardMapByPrimary, boardMapByMember } = useMemo(() => {
    const primary = {};
    const member = {};
    boards.forEach(b => {
      if (b.primary_tree_id) primary[b.primary_tree_id] = b;
      if (Array.isArray(b.group_tree_ids)) {
        b.group_tree_ids.forEach(id => { member[id] = b; });
      }
    });
    return { boardMapByPrimary: primary, boardMapByMember: member };
  }, [boards]);

  // Trees lookup by ID
  const treesMap = useMemo(() => {
    const map = {};
    trees.forEach(t => { map[t.tree_id] = t; });
    return map;
  }, [trees]);

  // Filtered trees on the map
  const displayTrees = useMemo(() => {
    const q = mapSearch.toLowerCase().trim();
    return trees.filter(t => {
      const lat = Number(t.latitude);
      const lng = Number(t.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;

      // Flora filter
      if (floraFilter && (t.flora_type || 'tree') !== floraFilter) return false;

      // Board Status filter
      const b = boardMapByPrimary[t.tree_id] || boardMapByMember[t.tree_id];
      const boardStatus = b ? b.status : 'None';
      if (statusFilter && boardStatus !== statusFilter) return false;

      // Search match
      if (q) {
        const match =
          t.tree_id.toLowerCase().includes(q) ||
          (t.common_name || '').toLowerCase().includes(q) ||
          (t.botanical_name || '').toLowerCase().includes(q) ||
          (t.area || '').toLowerCase().includes(q) ||
          (b?.board_id || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [trees, floraFilter, statusFilter, mapSearch, boardMapByPrimary, boardMapByMember]);

  // Group Board Polylines (Graph links connecting primary tree to its group member trees)
  const groupLines = useMemo(() => {
    const lines = [];
    boards.forEach(b => {
      if (b.board_type === 'group' && Array.isArray(b.group_tree_ids) && b.group_tree_ids.length > 0) {
        const pTree = treesMap[b.primary_tree_id];
        if (pTree && Number.isFinite(Number(pTree.latitude)) && Number.isFinite(Number(pTree.longitude))) {
          const pPos = [Number(pTree.latitude), Number(pTree.longitude)];
          b.group_tree_ids.forEach(mId => {
            const mTree = treesMap[mId];
            if (mTree && Number.isFinite(Number(mTree.latitude)) && Number.isFinite(Number(mTree.longitude))) {
              const mPos = [Number(mTree.latitude), Number(mTree.longitude)];
              lines.push({
                key: `${b.id}-${pTree.tree_id}-${mTree.tree_id}`,
                positions: [pPos, mPos],
                board: b,
              });
            }
          });
        }
      }
    });
    return lines;
  }, [boards, treesMap]);

  // Selected tree's associated board
  const selectedBoard = selectedTree
    ? (boardMapByPrimary[selectedTree.tree_id] || boardMapByMember[selectedTree.tree_id] || null)
    : null;

  const isPrimary = selectedBoard && selectedBoard.primary_tree_id === selectedTree?.tree_id;

  // Steady click selection — DOES NOT reset or jerk the map zoom/center
  const handleSelect = (tree) => {
    onSelectTree(tree);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-md">
      {/* ── Floating Map Header Controls ── */}
      <div className="absolute top-3 left-3 right-3 z-[1000] flex flex-wrap gap-2 items-center pointer-events-none">
        {/* Search Bar */}
        <div className="pointer-events-auto flex-1 min-w-[200px] max-w-sm">
          <input
            className="w-full px-3.5 py-2 rounded-xl text-xs font-medium bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="🔍 Search Area, Tree ID, Species, Common Name…"
            value={mapSearch}
            onChange={e => setMapSearch(e.target.value)}
          />
        </div>

        {/* Status Filter */}
        <div className="pointer-events-auto">
          <select
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Board Statuses</option>
            <option value="Board Fixed">🟢 Board Fixed</option>
            <option value="Need to Fix">🟡 Need to Fix</option>
            <option value="Requires Maintenance">🔴 Maintenance</option>
            <option value="None">⚪ No Board Yet</option>
          </select>
        </div>

        {/* Flora Filter (Tree / Plant) */}
        <div className="pointer-events-auto flex items-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold">
          <button
            onClick={() => setFloraFilter('')}
            className={`px-2.5 py-1 rounded-lg transition-all ${floraFilter === '' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
            All
          </button>
          <button
            onClick={() => setFloraFilter('tree')}
            className={`px-2.5 py-1 rounded-lg transition-all ${floraFilter === 'tree' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
            🌳 Trees
          </button>
          <button
            onClick={() => setFloraFilter('plant')}
            className={`px-2.5 py-1 rounded-lg transition-all ${floraFilter === 'plant' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
            🌿 Plants
          </button>
        </div>

        {/* Satellite vs Street Toggle */}
        <div className="pointer-events-auto ml-auto flex items-center bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-1 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold">
          <button
            onClick={() => setMapLayer('street')}
            className={`px-2.5 py-1 rounded-lg transition-all ${mapLayer === 'street' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
            🗺️ Street
          </button>
          <button
            onClick={() => setMapLayer('satellite')}
            className={`px-2.5 py-1 rounded-lg transition-all ${mapLayer === 'satellite' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 dark:text-gray-400'}`}>
            🛰️ Satellite
          </button>
        </div>
      </div>

      {/* ── Map Canvas (Rock-steady, does not jump on selection) ── */}
      <div className="h-[600px] w-full">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={DEFAULT_ZOOM}
          minZoom={15}
          maxZoom={22}
          zoomSnap={0.5}
          zoomDelta={0.5}
          className="h-full w-full"
        >
          {/* Tile Layer */}
          {mapLayer === 'satellite' ? (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution="© Esri, Maxar"
              maxNativeZoom={19}
              maxZoom={22}
            />
          ) : (
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap"
              maxNativeZoom={19}
              maxZoom={22}
            />
          )}

          {/* Group Boards Graph Lines */}
          {groupLines.map(line => {
            const isLineActive = selectedBoard && selectedBoard.id === line.board.id;
            return (
              <Polyline
                key={line.key}
                positions={line.positions}
                pathOptions={{
                  color: isLineActive ? '#3b82f6' : (line.board.status === 'Board Fixed' ? '#10b981' : '#f59e0b'),
                  weight: isLineActive ? 3.5 : 2,
                  dashArray: '4, 6',
                  opacity: isLineActive ? 0.95 : 0.7,
                }}
              />
            );
          })}

          {/* Tree Markers */}
          {displayTrees.map(t => {
            const b = boardMapByPrimary[t.tree_id] || boardMapByMember[t.tree_id];
            const isSelected = selectedTree?.tree_id === t.tree_id;
            const isGroupPrimary = b && b.board_type === 'group' && b.primary_tree_id === t.tree_id;
            const isGroupMember = b && b.board_type === 'group' && b.primary_tree_id !== t.tree_id;

            // Pin styling based on board status and primary role
            let fillColor = '#94a3b8'; // Slate for unboarded
            let strokeColor = '#475569';
            let radius = 6;
            let fillOpacity = 0.55;

            if (b) {
              if (isGroupPrimary) {
                // ⭐ Prominent Purple/Violet for the PRIMARY tree of a group board
                fillColor = '#8b5cf6';
                strokeColor = '#ffffff';
                radius = 9.5;
                fillOpacity = 1;
              } else if (isGroupMember) {
                // Member tree connected to group board
                radius = 7;
                if (b.status === 'Board Fixed') {
                  fillColor = '#10b981';
                  strokeColor = '#047857';
                  fillOpacity = 0.85;
                } else if (b.status === 'Need to Fix') {
                  fillColor = '#f59e0b';
                  strokeColor = '#b45309';
                  fillOpacity = 0.85;
                } else {
                  fillColor = '#ef4444';
                  strokeColor = '#b91c1c';
                  fillOpacity = 0.85;
                }
              } else {
                // Individual board tree
                radius = 7;
                if (b.status === 'Board Fixed') {
                  fillColor = '#10b981';
                  strokeColor = '#047857';
                  fillOpacity = 0.95;
                } else if (b.status === 'Need to Fix') {
                  fillColor = '#f59e0b';
                  strokeColor = '#b45309';
                  fillOpacity = 0.95;
                } else {
                  fillColor = '#ef4444';
                  strokeColor = '#b91c1c';
                  fillOpacity = 0.95;
                }
              }
            }

            if (isSelected) {
              fillColor = '#2563eb'; // Vibrant Blue highlight when selected
              strokeColor = '#ffffff';
              radius = 11;
              fillOpacity = 1;
            }

            return (
              <CircleMarker
                key={t.tree_id}
                center={[Number(t.latitude), Number(t.longitude)]}
                radius={radius}
                pathOptions={{
                  fillColor,
                  color: strokeColor,
                  weight: (isSelected || isGroupPrimary) ? 2.5 : 1.5,
                  fillOpacity,
                }}
                eventHandlers={{
                  click: () => handleSelect(t),
                }}
              >
                <Tooltip direction="top" offset={[0, -5]} opacity={0.9}>
                  <div className="text-xs font-sans">
                    <span className="font-mono font-bold text-green-700">{t.tree_id}</span>: {t.common_name}
                    {isGroupPrimary && (
                      <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300">
                        ⭐ Primary Tree (Holds Group Board ×{b.group_count})
                      </div>
                    )}
                    {isGroupMember && (
                      <div className="text-[10px] text-gray-500">
                        Group Member of {b.primary_tree_id}
                      </div>
                    )}
                    {b && !isGroupPrimary && !isGroupMember && (
                      <div className="text-[10px] text-gray-500">{b.board_id} • {b.status}</div>
                    )}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}
        </MapContainer>
      </div>

      {/* ── Map Legend ── */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/90 dark:bg-gray-900/90 backdrop-blur-md px-3 py-2 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 text-[11px] font-medium flex flex-wrap gap-3 items-center">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-purple-600 inline-block border-2 border-white shadow-sm"></span> Primary Group Tree (QR Board)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span> Fixed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span> Need to Fix
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span> Maintenance
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block border border-dashed border-slate-600"></span> No Board
        </span>
        <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400">
          <span className="w-4 border-t-2 border-dashed border-emerald-500 inline-block"></span> Group Graph
        </span>
      </div>

      {/* ── Interactive Detail Card (Direct Status Update with Date Autofill) ── */}
      {selectedTree && (
        <div className="absolute bottom-3 right-3 left-3 md:left-auto md:max-w-md z-[1000] bg-white/95 dark:bg-gray-900/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 text-xs">
          <div className="flex justify-between items-start gap-2 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-green-700 dark:text-green-400">
                  {selectedTree.tree_id}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedTree.flora_type === 'plant' ? 'bg-emerald-100 text-emerald-800' : 'bg-green-100 text-green-800'}`}>
                  {selectedTree.flora_type === 'plant' ? '🌿 Plant' : '🌳 Tree'}
                </span>
                {selectedBoard && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_COLOR[selectedBoard.status]}`}>
                    {STATUS_DOT[selectedBoard.status]} {selectedBoard.status}
                  </span>
                )}
              </div>
              <h4 className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-0.5">
                {selectedTree.common_name}
              </h4>
              <p className="italic text-gray-500 text-[11px]">{selectedTree.botanical_name}</p>
            </div>
            <button
              onClick={() => onSelectTree(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          </div>

          <div className="text-[11px] text-gray-500 space-y-0.5 mb-3">
            <div>📍 Area: <strong>{selectedTree.area || '—'}</strong></div>
            {selectedBoard && (
              <>
                <div>
                  🪧 Board ID: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{selectedBoard.board_id}</span>{' '}
                  {selectedBoard.board_type === 'group' ? (
                    <span className="font-semibold text-purple-700 dark:text-purple-400">
                      (Group ×{selectedBoard.group_count} • {isPrimary ? 'Primary Board Carrier' : 'Member'})
                    </span>
                  ) : (
                    '(Individual)'
                  )}
                </div>
                {selectedBoard.installed_date && <div>📅 Installed: {selectedBoard.installed_date.slice(0, 10)}</div>}
                {selectedBoard.last_checked && <div>🔍 Checked: {selectedBoard.last_checked.slice(0, 10)}</div>}
              </>
            )}
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
            {selectedBoard ? (
              <>
                {/* Direct One-Click Status Update with Today's Date Autofill */}
                {selectedBoard.status !== 'Board Fixed' ? (
                  <button
                    onClick={() => onQuickStatusChange(selectedBoard.id, 'Board Fixed', true)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm flex items-center justify-center gap-1 transition-all"
                  >
                    <span>✅</span> Mark as Fixed (Autofill Today)
                  </button>
                ) : (
                  <button
                    onClick={() => onQuickStatusChange(selectedBoard.id, 'Requires Maintenance', false)}
                    className="flex-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 transition-all"
                  >
                    <span>⚠️</span> Flag Maintenance
                  </button>
                )}

                <button
                  onClick={() => onOpenPrint(selectedBoard)}
                  title="Print Preview"
                  className="p-1.5 rounded-lg text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PrintIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onOpenEdit(selectedBoard)}
                  title="Edit Board"
                  className="p-1.5 rounded-lg text-white bg-amber-500 hover:bg-amber-600"
                >
                  <EditIcon className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={() => onOpenAdd(selectedTree)}
                className="w-full px-3 py-2 rounded-lg text-xs font-bold text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all"
              >
                ➕ Create Board for this Tree
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── BoardsPanel (Main) ── */
export default function BoardsPanel({ trees = [], dark = false }) {
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map'
  const [boards, setBoards] = useState([]);
  const [stats, setStats] = useState(null);
  const [missing, setMissing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [showMissing, setShowMissing] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [mapSelectedTree, setMapSelectedTree] = useState(null);

  // Filters for Table
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterFlora, setFilterFlora] = useState('');

  // Modal
  const [modal, setModal] = useState(null);

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

  // Instant smooth status change with optional Date Autofill
  const handleQuickStatus = async (id, status, autoDate = false) => {
    const today = new Date().toISOString().slice(0, 10);
    const updates = { status };
    if (autoDate && status === 'Board Fixed') {
      updates.installed_date = today;
      updates.last_checked = today;
    }

    // Optimistic UI update
    setBoards(bs => bs.map(b => b.id === id ? { ...b, ...updates } : b));
    try {
      if (autoDate) {
        await updateBoard(id, updates);
      } else {
        await updateBoardStatus(id, status);
      }
      const sRes = await getBoardStats();
      setStats(sRes.data);
    } catch {
      setMsg('Status update failed.');
      load(true);
    }
  };

  const handleQuickDate = async (id, field, value) => {
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
      {/* Header with Table / Map View Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-bold text-xl" style={lStyle}>🪧 Board Management</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Maintain physical aluminum identification boards and field status.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {/* Table / Map View Toggle Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-900 text-forest-700 dark:text-forest-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              📋 Table View
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'map' ? 'bg-white dark:bg-gray-900 text-forest-700 dark:text-forest-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}
            >
              🗺️ Map View
            </button>
          </div>

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

      {/* ── VIEW SWITCH: MAP VIEW vs TABLE VIEW ── */}
      {viewMode === 'map' ? (
        <BoardsMapView
          trees={trees}
          boards={boards}
          selectedTree={mapSelectedTree}
          onSelectTree={setMapSelectedTree}
          onQuickStatusChange={handleQuickStatus}
          onOpenAdd={openAdd}
          onOpenEdit={openEdit}
          onOpenPrint={openPrintPreview}
          dark={dark}
        />
      ) : (
        <>
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
                        
                        {/* Status Dropdown */}
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

                        {/* Action Buttons */}
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
        </>
      )}

      {/* Missing Boards Explorer */}
      {showMissing && (
        <div className={`mt-6 rounded-xl border p-4 ${dark ? 'bg-gray-800/50 border-gray-700' : 'bg-amber-50/70 border-amber-200'}`}>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <h3 className="font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2">
              ⚠️ Trees Without Boards
              <span className="text-xs font-semibold bg-amber-200 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 px-2 py-0.5 rounded-full">
                {missing.length} unboarded
              </span>
            </h3>
          </div>

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
                {missing.length === 0 ? (
                  <tr><td colSpan={6} className="py-4 text-center text-gray-400 text-xs">No unboarded trees 🎉</td></tr>
                ) : missing.map(t => (
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
                      <button onClick={() => openAdd(t)}
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
      )}

      {/* Add / Edit Board Modal (Rendered with z-[9999] so it's always above the map) */}
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
