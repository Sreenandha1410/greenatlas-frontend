{/*
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTrees, getAreas } from '../api'
import TreeCard from '../components/TreeCard'

export default function TreeList() {
  const [trees, setTrees]           = useState([])
  const [areas, setAreas]           = useState([])
  const [search, setSearch]         = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [familyFilter, setFamilyFilter] = useState('')
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  // Add after existing useSearchParams:
  const [searchParams] = useSearchParams()
  useEffect(() => {
    const q = searchParams.get('search')
    if (q) setSearch(q)
  }, [])
  const PER_PAGE = 24

  useEffect(() => {
    const areaFromUrl = searchParams.get('area')
    if (areaFromUrl) setAreaFilter(areaFromUrl)
  }, [])

  useEffect(() => {
    Promise.all([getTrees(), getAreas()])
      .then(([t, a]) => {
        setTrees(t.data)
        setAreas(a.data.map(a => a.area))
      })
      .finally(() => setLoading(false))
  }, [])

  // Reset page on filter change
  useEffect(() => { setPage(1) }, [search, areaFilter, familyFilter])

  const families = [...new Set(trees.map(t => t.family).filter(Boolean))].sort()

  const filteredTrees = trees.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || [
      t.common_name, t.botanical_name, t.area,
      t.family, t.tree_id, t.tamil_name
    ].some(v => v?.toLowerCase().includes(q))
    const matchArea   = !areaFilter   || t.area   === areaFilter
    const matchFamily = !familyFilter || t.family === familyFilter
    return matchSearch && matchArea && matchFamily
  })

  const totalPages = Math.ceil(filteredTrees.length / PER_PAGE)
  const paginated  = filteredTrees.slice((page - 1) * PER_PAGE, page * PER_PAGE)

  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page - 2 && i <= page + 2))
      pageNumbers.push(i)
    else if (pageNumbers[pageNumbers.length - 1] !== '...')
      pageNumbers.push('...')
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Loading trees…</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl font-bold text-gray-900 dark:text-gray-100">
          All Trees
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {filteredTrees.length} trees found
        </p>
      </div>

      {/* Filters *}
      <div className="card p-4 mb-6 flex flex-wrap gap-3">
        <input
          className="input flex-1 min-w-48"
          placeholder="Search by name, ID, area, family…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="input w-44" value={areaFilter}
          onChange={e => setAreaFilter(e.target.value)}>
          <option value="">All Areas</option>
          {areas.map(a => <option key={a}>{a}</option>)}
        </select>
        <select className="input w-44" value={familyFilter}
          onChange={e => setFamilyFilter(e.target.value)}>
          <option value="">All Families</option>
          {families.map(f => <option key={f}>{f}</option>)}
        </select>
        {(search || areaFilter || familyFilter) && (
          <button className="btn-secondary text-sm"
            onClick={() => { setSearch(''); setAreaFilter(''); setFamilyFilter('') }}>
            Clear
          </button>
        )}
      </div>

      {/* Grid *}
      {paginated.length === 0 ? (
        <div className="text-center py-24 text-gray-400">No trees match your search.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {paginated.map(tree => <TreeCard key={tree.tree_id} tree={tree} />)}
        </div>
      )}

      {/* Pagination *}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-10">
          <button onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1} className="btn-secondary px-3 py-1.5 text-sm">
            ←
          </button>
          {pageNumbers.map((p, i) =>
            p === '...' ? (
              <span key={i} className="px-2 text-gray-400">…</span>
            ) : (
              <button key={p} onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors
                  ${page === p
                    ? 'bg-forest-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 dark:text-gray-300'}`}>
                {p}
              </button>
            )
          )}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages} className="btn-secondary px-3 py-1.5 text-sm">
            →
          </button>
        </div>
      )}
    </div>
  )
}
*/}

import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getTrees, getAreas } from '../api'
import { useDarkMode } from '../context/DarkModeContext'

function TreeCard({ tree }) {
  return (
    <Link to={`/trees/${tree.tree_id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="card overflow-hidden group cursor-pointer h-full flex flex-col">
        <div className="h-44 overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #d9edcf, #f0f7ee)' }}>
          {tree.image_url
            ? <img src={tree.image_url} alt={tree.common_name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
            : <div className="w-full h-full flex items-center justify-center text-6xl">🌿</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          <span className="absolute bottom-2 left-2 badge text-white text-xs"
            style={{ background: 'rgba(45,90,39,0.75)', backdropFilter: 'blur(8px)' }}>
            {tree.area}
          </span>
        </div>
        <div className="p-4 flex flex-col gap-1 flex-1">
          <p className="font-semibold text-gray-900 truncate text-sm">{tree.common_name}</p>
          <p className="text-xs italic text-gray-400 truncate">{tree.botanical_name}</p>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-xs text-gray-400">{tree.family}</span>
            <span className="text-xs font-mono text-gray-300">{tree.tree_id}</span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}

function SpeciesGroupCard({ species, trees, dark }) {
  const [expanded, setExpanded] = useState(false)
  const representative = trees[0]

  return (
    <div className="overflow-hidden rounded-2xl"
      style={{ 
        background: dark ? '#1c2128' : '#ffffff',
        border: `1px solid ${dark ? '#30363d' : '#e5e7eb'}`,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
      }}>
      <div className="relative cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="h-44 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #d9edcf, #f0f7ee)' }}>
          {representative.image_url
            ? <img src={representative.image_url} alt={species}
                className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-6xl">🌿</div>}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
          <p className="font-semibold text-sm truncate">{species}</p>
          <p className="text-xs italic opacity-75 truncate">{representative.botanical_name}</p>
        </div>
        <span className="absolute top-2 right-2 badge text-white text-xs"
          style={{ background: 'rgba(45,90,39,0.8)', backdropFilter: 'blur(8px)' }}>
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
            style={{ borderTop: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}>
            <div className="p3 space-y-1 max-h-48 overflow-y-auto"
              style={{ 
                background: dark ? '#1c2128' : '#ffffff',
                padding: '0.75rem'
              }}>
              {trees.map(t => (
                <Link key={t.tree_id} to={`/trees/${t.tree_id}`}
                  className="flex items-center justify-between px-3 py-2 rounded-lg transition-colors text-sm"
                  style={{ color: dark ? '#e6edf3' : '#374151' }}>
                  <span className="font-medium">{t.tree_id}</span>
                  <span style={{ color: '#8b949e' }} className="text-xs">{t.area}</span>
                  <span style={{ color: 'var(--color-forest-400)' }} className="text-xs">→</span>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!expanded && (
        <div className="px-4 py-3" style={{ borderTop: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}>
          <button onClick={() => setExpanded(true)}
            className="text-xs font-medium w-full text-center"
            style={{ color: 'var(--color-forest-400)' }}>
            Show all {trees.length} trees ↓
          </button>
        </div>
      )}
    </div>
  )
}

export default function TreeList() {
  const [dark] = useDarkMode()
  const [trees, setTrees]           = useState([])
  const [areas, setAreas]           = useState([])
  const [search, setSearch]         = useState('')
  const [areaFilter, setAreaFilter] = useState('')
  const [familyFilter, setFamilyFilter] = useState('')
  const [groupBySpecies, setGroupBySpecies] = useState(true)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const [searchParams]              = useSearchParams()
  const PER_PAGE = 24

  useEffect(() => {
    const q = searchParams.get('area') || ''
    const s = searchParams.get('search') || ''
    if (q) setAreaFilter(q)
    if (s) setSearch(s)
  }, [])

  useEffect(() => {
    Promise.all([getTrees(), getAreas()])
      .then(([t, a]) => { setTrees(t.data); setAreas(a.data.map(a => a.area)) })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { setPage(1) }, [search, areaFilter, familyFilter, groupBySpecies])

  // Areas available for current family filter
  const availableAreas = [...new Set(
    trees
      .filter(t => !familyFilter || t.family === familyFilter)
      .map(t => t.area)
      .filter(Boolean)
  )].sort()

  // Families available for current area filter  
  const availableFamilies = [...new Set(
    trees
      .filter(t => !areaFilter || t.area === areaFilter)
      .map(t => t.family)
      .filter(Boolean)
  )].sort()

  const filtered = trees.filter(t => {
    const q = search.toLowerCase()
    const matchSearch = !q || [t.common_name, t.botanical_name, t.area, t.family, t.tree_id, t.tamil_name]
      .some(v => v?.toLowerCase().includes(q))
    return matchSearch && (!areaFilter || t.area === areaFilter) && (!familyFilter || t.family === familyFilter)
  })

  // Group by species
  const grouped = filtered.reduce((acc, t) => {
    const key = t.common_name || t.botanical_name
    if (!acc[key]) acc[key] = []
    acc[key].push(t)
    return acc
  }, {})

  const groupedEntries = Object.entries(grouped)
  const totalPages = Math.ceil((groupBySpecies ? groupedEntries.length : filtered.length) / PER_PAGE)

  const paginated = groupBySpecies
    ? groupedEntries.slice((page-1)*PER_PAGE, page*PER_PAGE)
    : filtered.slice((page-1)*PER_PAGE, page*PER_PAGE)

  const pageNumbers = []
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= page-2 && i <= page+2)) pageNumbers.push(i)
    else if (pageNumbers[pageNumbers.length-1] !== '...') pageNumbers.push('...')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex gap-8">

        {/* ── Left filter sidebar ── */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-5">
          <div className="card-clay p-4 sticky top-24">
            <h3 className="font-semibold mb-4 text-sm tracking-wide uppercase"
              style={{ color: dark ? '#8b949e' : '#374151' }}>Filters</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium block mb-1.5"
                  style={{ color: dark ? '#8b949e' : '#6b7280' }}>Area</label>
                <select className="input text-sm" value={areaFilter}
                  style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
                  onChange={e => setAreaFilter(e.target.value)}>
                  <option value="">All Areas</option>
                  {availableAreas.map(a => <option key={a}>{a}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium block mb-1.5"
                  style={{ color: dark ? '#8b949e' : '#6b7280' }}>Family</label>
                <select className="input text-sm" value={familyFilter}
                  style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
                  onChange={e => setFamilyFilter(e.target.value)}>
                  <option value="">All Families</option>
                  {availableFamilies.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div className="pt-2" style={{ borderTop: `1px solid ${dark ? '#30363d' : '#f3f4f6'}` }}>
                <label className="text-xs font-medium block mb-2"
                  style={{ color: dark ? '#8b949e' : '#6b7280' }}>View mode</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm"
                    style={{ color: dark ? '#e6edf3' : '#374151' }}>
                    <input type="radio" checked={groupBySpecies}
                      onChange={() => setGroupBySpecies(true)} className="accent-green-700" />
                    Group by species
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm"
                    style={{ color: dark ? '#e6edf3' : '#374151' }}>
                    <input type="radio" checked={!groupBySpecies}
                      onChange={() => setGroupBySpecies(false)} className="accent-green-700" />
                    Show all individually
                  </label>
                </div>
              </div>
              {(search || areaFilter || familyFilter) && (
                <button className="w-full text-xs text-red-500 hover:text-red-700 pt-2"
                  onClick={() => { setSearch(''); setAreaFilter(''); setFamilyFilter('') }}>
                  ✕ Clear all filters
                </button>
              )}
            </div>
          </div>
        </aside>

        {/* ── Main content ── */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-3xl font-bold"
                style={{ color: dark ? '#e6edf3' : '#111827' }}>All Trees</h1>
              <p className="text-sm mt-0.5" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
                {groupBySpecies
                  ? `${groupedEntries.length} species · ${filtered.length} trees`
                  : `${filtered.length} trees`}
              </p>
            </div>
            <input className="input w-64 text-sm" placeholder="Search trees…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }} />
          </div>

          {/* Mobile filters */}
          <div className="lg:hidden flex gap-2 mb-4 overflow-x-auto pb-1">
            <select className="input text-sm" value={areaFilter}
              style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
              onChange={e => setAreaFilter(e.target.value)}>
              <option value="">All Areas</option>
              {availableAreas.map(a => <option key={a}>{a}</option>)}
            </select>
            <select className="input text-sm" value={familyFilter}
              style={{ background: dark ? '#1c2128' : '#fff', color: dark ? '#e6edf3' : '#111827' }}
              onChange={e => setFamilyFilter(e.target.value)}>
              <option value="">All Families</option>
              {availableFamilies.map(f => <option key={f}>{f}</option>)}
            </select>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-32 text-gray-400">Loading…</div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-32 text-gray-400">No trees match your search.</div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={`${search}-${areaFilter}-${familyFilter}-${page}-${groupBySpecies}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {groupBySpecies
                  ? paginated.map(([species, trees]) =>
                      trees.length === 1
                        ? <TreeCard key={trees[0].tree_id} tree={trees[0]} />
                        : <SpeciesGroupCard key={species} species={species} trees={trees} dark={dark} />
                    )
                  : paginated.map(tree => <TreeCard key={tree.tree_id} tree={tree} />)
                }
              </motion.div>
            </AnimatePresence>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 mt-10">
              <button onClick={() => setPage(p => Math.max(1,p-1))} disabled={page===1}
                className="btn-secondary px-3 py-1.5 text-sm">←</button>
              {pageNumbers.map((p,i) =>
                p === '...' ? <span key={i} className="px-2 text-gray-400">…</span> :
                <button key={p} onClick={() => setPage(p)}
                  className="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
                  style={page === p
                    ? { background: 'var(--color-forest-500)', color: 'white' }
                    : { color: dark ? '#e6edf3' : '#4b5563',
                        background: dark ? '#1c2128' : 'transparent' }}>
                  {p}
                </button>
              )}
              <button onClick={() => setPage(p => Math.min(totalPages,p+1))} disabled={page===totalPages}
                className="btn-secondary px-3 py-1.5 text-sm">→</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}