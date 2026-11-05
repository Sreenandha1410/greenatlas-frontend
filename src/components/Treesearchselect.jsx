import { useEffect, useId, useMemo, useRef, useState } from 'react'

/**
 * Searchable tree picker for the complaint form.
 * The user types the first few characters of the tree ID (e.g. "1YBB30")
 * or part of a location, and the matching trees appear instantly.
 *
 * Props
 *  trees     array of tree objects (the same list the old <select> used)
 *  value     the selected tree object, or null
 *  onChange  (tree | null) => void
 *  getId / getName / getLocation  optional accessors if your field names differ
 */
const norm = (s) => String(s ?? '').toLowerCase().replace(/[\s\-_/.,]/g, '')

const defaultGetId = (t) => t.tree_id ?? t.treeId ?? t.tag_id ?? t.code ?? t.id ?? ''
const defaultGetName = (t) => t.common_name ?? t.name ?? ''
const defaultGetLocation = (t) => {
  const loc = t.location ?? t.area ?? t.campus_area ?? t.location_name ?? ''
  return typeof loc === 'object' && loc ? (loc.name ?? loc.area ?? '') : loc
}

function Highlight({ text, query }) {
  const s = String(text ?? '')
  const q = query.trim().toLowerCase()
  const i = q ? s.toLowerCase().indexOf(q) : -1
  if (i < 0) return <>{s}</>
  return (
    <>
      {s.slice(0, i)}
      <mark className="rounded-sm bg-green-200/80 px-0.5 text-inherit dark:bg-green-500/30">{s.slice(i, i + q.length)}</mark>
      {s.slice(i + q.length)}
    </>
  )
}

export default function TreeSearchSelect({
  trees = [],
  value = null,
  onChange,
  getId = defaultGetId,
  getName = defaultGetName,
  getLocation = defaultGetLocation,
  label = 'Tree',
  placeholder = 'Type tree ID or location, e.g. 1YBB30',
  required = false,
  disabled = false,
  maxResults = 8,
}) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const boxRef = useRef(null)
  const inputRef = useRef(null)
  const listId = useId()

  // Prepare searchable text once per tree list
  const index = useMemo(
    () =>
      trees.map((t) => ({
        tree: t,
        id: String(getId(t)),
        idN: norm(getId(t)),
        name: getName(t),
        nameN: norm(getName(t)),
        botN: norm(t.botanical_name),
        loc: getLocation(t),
        locN: norm(getLocation(t)),
      })),
    [trees, getId, getName, getLocation]
  )

  const { results, total } = useMemo(() => {
    const q = norm(query)
    if (!q) return { results: [], total: 0 }
    const scored = []
    for (const r of index) {
      let score = null
      if (r.idN === q) score = 0
      else if (r.idN.startsWith(q)) score = 1
      else if (r.locN.startsWith(q)) score = 2
      else if (r.idN.includes(q)) score = 3
      else if (r.locN.includes(q)) score = 4
      else if (r.nameN.includes(q)) score = 5
      else if (r.botN.includes(q)) score = 6
      if (score !== null) scored.push({ ...r, score })
    }
    scored.sort((a, b) => a.score - b.score || a.id.localeCompare(b.id, undefined, { numeric: true }))
    return { results: scored.slice(0, maxResults), total: scored.length }
  }, [index, query, maxResults])

  useEffect(() => setActive(0), [query])

  // close when clicking outside
  useEffect(() => {
    const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('touchstart', onDown) }
  }, [])

  const choose = (r) => {
    onChange?.(r.tree)
    setQuery('')
    setOpen(false)
  }

  const clear = () => {
    onChange?.(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)) }
    else if (e.key === 'Enter') { if (open && results[active]) { e.preventDefault(); choose(results[active]) } }
    else if (e.key === 'Escape') setOpen(false)
  }

  const showEmpty = open && query.trim() && results.length === 0

  return (
    <div ref={boxRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
          {label}{required && <span className="text-red-500"> *</span>}
        </label>
      )}

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-green-600/40 bg-green-50 px-3 py-2.5 dark:border-green-500/40 dark:bg-green-900/20">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
              <span className="font-mono">{String(getId(value))}</span>
              {getName(value) && <span className="font-normal"> · {getName(value)}</span>}
            </p>
            {getLocation(value) && <p className="truncate text-xs text-gray-600 dark:text-gray-400">{getLocation(value)}</p>}
          </div>
          <button type="button" onClick={clear} disabled={disabled}
            className="shrink-0 rounded-lg px-2.5 py-1 text-xs font-semibold text-green-700 hover:bg-green-100 dark:text-green-300 dark:hover:bg-green-800/40">
            Change
          </button>
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            disabled={disabled}
            value={query}
            placeholder={placeholder}
            onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            aria-autocomplete="list"
            className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-base text-gray-900 outline-none placeholder:text-gray-400 focus:border-green-600 focus:ring-2 focus:ring-green-500/30 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          />
          {/* keeps native form validation working when required */}
          {required && <input tabIndex={-1} aria-hidden="true" required value="" onChange={() => {}} className="pointer-events-none absolute h-0 w-0 opacity-0" />}

          {open && (
            <div id={listId} role="listbox"
              className="absolute left-0 right-0 z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700 dark:bg-gray-900">
              {!query.trim() && (
                <p className="px-3 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                  Type the first few characters of the tree ID, or a location name.
                </p>
              )}

              {results.map((r, i) => (
                <button key={r.id + i} type="button" role="option" aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => choose(r)}
                  className={`flex w-full flex-col items-start px-3 py-2 text-left ${i === active ? 'bg-green-50 dark:bg-green-900/30' : ''}`}>
                  <span className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                    <Highlight text={r.id} query={query} />
                  </span>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    <Highlight text={r.name} query={query} />
                    {r.name && r.loc ? ' · ' : ''}
                    <Highlight text={r.loc} query={query} />
                  </span>
                </button>
              ))}

              {total > results.length && (
                <p className="border-t border-gray-100 px-3 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                  {total - results.length} more match{total - results.length > 1 ? 'es' : ''} · keep typing to narrow down
                </p>
              )}

              {showEmpty && (
                <p className="px-3 py-3 text-sm text-gray-600 dark:text-gray-300">
                  No tree matches “{query.trim()}”. Try the first few characters of the ID, or a location name.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
