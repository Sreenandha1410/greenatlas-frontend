import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useDarkMode } from '../context/DarkModeContext'

export default function TreeCard({ tree }) {
  const [dark] = useDarkMode()
  const imageUrl = tree.image_link || tree.image_url || null

  return (
    <Link to={`/trees/${tree.tree_id}`}>
      <motion.div
        whileHover={{ y: -4, scale: 1.02 }}
        transition={{ duration: 0.2 }}
        className="card overflow-hidden group cursor-pointer h-full flex flex-col"
        style={{
          background: dark ? '#1c2128' : '#ffffff',
          borderColor: dark ? '#30363d' : '#e8ede6'
        }}
      >
        <div
          className="h-44 overflow-hidden relative"
          style={{ background: dark ? '#161b22' : 'linear-gradient(135deg, #d9edcf, #f0f7ee)' }}
        >
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={tree.common_name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">🌿</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          <span
            className="absolute bottom-2 left-2 badge text-white text-xs"
            style={{ background: 'rgba(45,90,39,0.85)', backdropFilter: 'blur(8px)' }}
          >
            {tree.area}
          </span>
        </div>

        <div
          className="p-4 flex flex-col gap-1 flex-1"
          style={{ background: dark ? '#1c2128' : '#ffffff' }}
        >
          <p
            className="font-semibold truncate text-sm"
            style={{ color: dark ? '#e6edf3' : '#111827' }}
          >
            {tree.common_name}
          </p>
          <p className="text-xs italic truncate" style={{ color: '#8b949e' }}>
            {tree.botanical_name}
          </p>
          <div className="flex items-center justify-between mt-auto pt-2">
            <span className="text-xs" style={{ color: '#8b949e' }}>
              {tree.family}
            </span>
            <span
              className="text-xs font-mono"
              style={{ color: dark ? '#6e7681' : '#9ca3af' }}
            >
              {tree.tree_id}
            </span>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
