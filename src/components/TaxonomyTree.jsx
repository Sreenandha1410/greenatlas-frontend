import { motion } from 'framer-motion'

const colors = ['#1b5e20','#2e7d32','#388e3c','#43a047','#4caf50','#66bb6a','#81c784']

export default function TaxonomyTree({ tree, dark = false }) {
  const levels = [
    { rank: 'Kingdom',  value: tree.kingdom  },
    { rank: 'Division', value: tree.division },
    { rank: 'Class',    value: tree.class    },
    { rank: 'Order',    value: tree.order    },
    { rank: 'Family',   value: tree.family   },
    { rank: 'Genus',    value: tree.genus    },
    { rank: 'Species',  value: tree.species  },
  ].filter(l => l.value)

  return (
    <div className="relative pl-6">
      <div className="absolute left-3 top-3 bottom-3 w-0.5"
        style={{ background: 'linear-gradient(to bottom, #2d5a27, #c8e6c9)' }} />
      {levels.map((l, i) => (
        <motion.div key={l.rank}
          initial={{ opacity: 0, x: -16 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.35, delay: i * 0.07 }}
          className="relative flex items-center gap-3 mb-3">
          <div className="absolute -left-3 w-3 h-3 rounded-full border-2 border-white shadow-md"
            style={{ background: colors[i] }} />
          <div className="w-4 h-0.5 flex-shrink-0" style={{ background: colors[i] }} />
          <div className="flex items-center gap-3 px-4 py-2.5 flex-1"
            style={{
              background: dark ? `${colors[i]}22` : `linear-gradient(135deg, ${colors[i]}15, ${colors[i]}08)`,
              border: `1px solid ${colors[i]}30`,
              borderRadius: '0.75rem',
            }}>
            <span className="text-xs font-semibold tracking-widest uppercase w-16 flex-shrink-0"
              style={{ color: dark ? '#6e7681' : '#9ca3af' }}>
              {l.rank}
            </span>
            <span className="font-semibold text-sm"
              style={{
                color: dark ? '#e6edf3' : '#1f2937',
                fontStyle: i >= 5 ? 'italic' : 'normal'
              }}>
              {l.value}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  )
}