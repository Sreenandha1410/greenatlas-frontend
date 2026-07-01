import { Link } from 'react-router-dom'

export default function TreeCard({ tree, dark }) {
  return (
    <Link to={`/trees/${tree.tree_id}`}
      className="card overflow-hidden hover:shadow-md hover:-translate-y-0.5
                 transition-all duration-200 group flex flex-col">
      <div className="h-40 bg-forest-50 dark:bg-forest-950 flex items-center
                      justify-center overflow-hidden text-5xl">
        {tree.image_link ? (
           <img src={tree.image_link} alt={tree.common_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : '🌿'}
      </div>
      <TreeCard key={trees[0].tree_id} tree={trees[0]} dark={dark} />
      <TreeCard key={tree.tree_id} tree={tree} dark={dark} />
      <div className="p-4 flex flex-col gap-1 flex-1"
        style={{ background: dark ? '#1c2128' : '#fff' }}>
        <p className="font-semibold truncate text-sm"
          style={{ color: dark ? '#e6edf3' : '#111827' }}>{tree.common_name}</p>
        <p className="text-xs italic truncate" style={{ color: '#8b949e' }}>{tree.botanical_name}</p>
        <div className="flex items-center justify-between mt-auto pt-2">
          <span className="text-xs" style={{ color: '#8b949e' }}>{tree.family}</span>
          <span className="text-xs font-mono" style={{ color: dark ? '#6e7681' : '#d1d5db' }}>
            {tree.tree_id}
          </span>
        </div>
      </div>
    </Link>
  )
}
