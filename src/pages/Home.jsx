
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getStats, getViewCount } from '../api'
import { useDarkMode } from '../context/DarkModeContext'
import { TeamSection } from './About'
import JoinNaturesClub from '../components/JoinNaturesClub'
import ComplaintDashboard from '../components/ComplaintDashboard'

export default function Home() {
  const [stats, setStats] = useState({
    trees: 0,
    species: 0,
    areas: 0
  })
  const [views, setViews] = useState(0)
  const [search, setSearch] = useState('')
  const [showReport, setShowReport] = useState(false)

  const navigate = useNavigate()
  const [dark] = useDarkMode()

  useEffect(() => {
    getStats().then(r => setStats(r.data))
    getViewCount()
      .then(r => setViews(r.data.count))
      .catch(() => {})
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()

    if (search.trim()) {
      navigate(`/trees?search=${encodeURIComponent(search.trim())}`)
    }
  }

  const statCards = [
    { label: 'Trees Mapped', value: stats.trees, icon: '🌳', suffix: '+' },
    { label: 'Species', value: stats.species, icon: '🍃', suffix: '' },
    { label: 'Campus Areas', value: stats.areas, icon: '📍', suffix: '' }
  ]

  const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, delay, ease: 'easeOut' }
  })

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(160deg, #0a140a 0%, #1a3618 40%, #2d5a27 100%)'
      }}
    >
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-4 overflow-hidden">

        {/* Ambient Background */}
        <div
          className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #52a043, transparent)'
          }}
        />

        <div
          className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7dc070, transparent)'
          }}
        />

        <div className="relative z-10 text-center max-w-3xl">
          {/* College Name */}
          <motion.div {...fadeUp(0)}>
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
              style={{
                background: 'rgba(82,160,67,0.2)',
                border: '1px solid rgba(82,160,67,0.4)',
                color: '#7dc070'
              }}
            >
              🌿 Sona College of Technology, Salem
            </span>
          </motion.div>

          {/* Title */}
          <motion.h1
            {...fadeUp(0.1)}
            className="text-6xl md:text-7xl font-bold text-white mb-4 leading-tight"
            style={{
              fontFamily: 'Cinzel, serif',
              letterSpacing: '-0.01em'
            }}
          >
            Green Atlas
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            {...fadeUp(0.2)}
            className="text-lg md:text-xl mb-2 font-light"
            style={{
              color: '#a5d6a7',
              fontFamily: 'Cormorant Garamond, serif',
              fontStyle: 'italic'
            }}
          >
            A living record of every tree on campus
          </motion.p>

          <motion.p
            {...fadeUp(0.3)}
            className="text-sm mb-10 max-w-lg mx-auto leading-relaxed"
            style={{ color: 'rgba(165,214,167,0.7)' }}
          >
            Scan any QR code on a campus tree to explore its species, ecology,
            medicinal uses, and precise location — right from your phone.
          </motion.p>

          {/* Search Bar */}
          <motion.form
            {...fadeUp(0.4)}
            onSubmit={handleSearch}
            className="flex gap-2 max-w-lg mx-auto mb-10"
          >
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                🔍
              </span>

              <input
                className="w-full pl-9 pr-4 py-3 rounded-xl text-gray-900 font-medium text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  border: '1.5px solid rgba(255,255,255,0.6)',
                  backdropFilter: 'blur(12px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.2)'
                }}
                placeholder="Search trees by name, species, family…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="btn-primary px-5 py-3 text-sm whitespace-nowrap"
            >
              Search
            </button>
          </motion.form>

          {/* Main Buttons */}
          <motion.div
            {...fadeUp(0.5)}
            className="flex flex-wrap gap-3 justify-center"
          >
            <button
              onClick={() => navigate('/map')}
              className="btn-primary px-6 py-3"
            >
              🗺️ Open Map
            </button>

            <button
              onClick={() => navigate('/trees')}
              className="btn-secondary px-6 py-3"
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white'
              }}
            >
              Browse All Trees
            </button>

            <button
              onClick={() => setShowReport(true)}
              className="btn-secondary px-6 py-3"
              style={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white'
              }}
            >
              🌿 Report an Issue
            </button>
          </motion.div>
        </div>

        {/* Scroll Cue */}
        <motion.div
          className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-1"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
        >
          <span
            className="text-xs tracking-widest uppercase"
            style={{ color: 'rgba(165,214,167,0.5)' }}
          >
            Explore
          </span>
          <span style={{ color: 'rgba(165,214,167,0.5)' }}>↓</span>
        </motion.div>
      </section>

      {/* Statistics Section */}
      <section
        style={{
          background: dark ? '#0d1117' : 'var(--color-bark-100)'
        }}
        className="px-4 py-20"
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="font-display text-3xl font-bold mb-3"
              style={{ color: dark ? '#e6edf3' : '#111827' }}
            >
              The Campus in Numbers
            </h2>

            <p
              style={{ color: dark ? '#8b949e' : '#6b7280' }}
              className="max-w-md mx-auto"
            >
              Every tree tagged, mapped, and documented — from rare medicinal
              plants to century-old native species.
            </p>
          </motion.div>

          <div className="stats-grid grid grid-cols-3 gap-6">
            {statCards.map(({ label, value, icon, suffix }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="card-clay p-8 text-center"
              >
                <div className="text-4xl mb-3">{icon}</div>

                <div
                  className="font-display text-5xl font-bold mb-1"
                  style={{ color: 'var(--color-forest-400)' }}
                >
                  {value.toLocaleString()}{suffix}
                </div>

                <div
                  className="text-sm font-medium tracking-wide uppercase"
                  style={{ color: dark ? '#8b949e' : '#6b7280' }}
                >
                  {label}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section
        className="px-4 py-16"
        style={{ background: dark ? '#161b22' : '#f0f7ee' }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2
              className="font-display text-2xl font-bold mb-5"
              style={{
                color: dark ? '#7dc070' : 'var(--color-forest-600)'
              }}
            >
              Why Green Atlas?
            </h2>

            <p
              className="leading-relaxed text-base mb-4"
              style={{ color: dark ? '#8b949e' : '#4b5563' }}
            >
              Our campus is home to over a thousand trees spanning more than a
              hundred species — many with deep ecological, medicinal, and
              cultural significance. Green Atlas was built to make this living
              heritage visible and accessible to everyone on campus.
            </p>

            <p
              className="leading-relaxed text-sm"
              style={{ color: dark ? '#6e7681' : '#6b7280' }}
            >
              Each tree carries a QR code. Scan it to instantly access its full
              botanical profile, see where others of its kind grow on campus,
              and explore why it matters.
            </p>

            <TeamSection dark={dark} />
          </motion.div>
        </div>
      </section>

      {/* Join Nature's Club */}
      <JoinNaturesClub dark={dark} />

      {/* Report Issue Popup */}
      {showReport && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={() => setShowReport(false)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-gray-900 p-5 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowReport(false)}
              className="absolute right-4 top-3 text-2xl text-gray-500 hover:text-red-500"
              aria-label="Close report form"
            >
              &times;
            </button>

            <ComplaintDashboard
              selectedTree={null}
              onSuccess={() => setShowReport(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
