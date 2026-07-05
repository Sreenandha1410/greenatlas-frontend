import { motion } from 'framer-motion'
import { useDarkMode } from '../context/DarkModeContext'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6, delay, ease: 'easeOut' }
})

/* ── Person data ── */
const people = [
  {
    name: 'Dr. S R R Senthilkumar',
    role: 'Principal',
    tag: 'Leadership',
    photo: '/photos/principal.png',
    initials: 'SS',
    accent: '#1a4d2e',
    bio: 'A visionary academic leader driving excellence in engineering and design education. Under his stewardship, Sona College has cultivated a culture of innovation, sustainability, and student-led impact — of which Green Atlas is a proud example.',
    tagline: 'Championing green campuses through technology and vision.',
  },
  {
    name: 'Dr. Sanjivi Arul',
    role: 'Project Advisor',
    tag: 'Advisor',
    photo: '/photos/advisor.png',
    initials: 'SA',
    accent: '#2d5a27',
    bio: 'Faculty of the Department of Computer Science and Design, Dr. Sanjivi Arul guided the Green Atlas team from concept to deployment — shaping its architecture, design philosophy, and commitment to environmental storytelling through code.',
    tagline: 'Where ecological insight meets elegant engineering.',
  },
  {
    name: 'Tumili M',
    role: 'Developer',
    tag: 'Dev Team',
    photo: '/photos/tumili.png',
    initials: 'TM',
    accent: '#3d7a35',
    bio: 'Passionate about building interfaces that feel alive. Tumili led frontend architecture, crafting the tree explorer, interactive maps, and the visual identity that makes Green Atlas recognisable at a glance.',
    tagline: 'Code that breathes life into data.',
  },
  {
    name: 'Deepak P',
    role: 'Developer',
    tag: 'Dev Team',
    photo: '/photos/deepak.png',
    initials: 'DP',
    accent: '#4d9a43',
    bio: 'Backend engineer at heart, Deepak built the API layer, database schema, and cloud integrations that power Green Atlas behind the scenes — ensuring every tree profile loads instantly and reliably.',
    tagline: 'Robust systems rooted in clean design.',
  },
  {
    name: 'Sreenandha S',
    role: 'Developer',
    tag: 'Dev Team',
    photo: '/photos/sreenandha.png',
    initials: 'SS',
    accent: '#5dba51',
    bio: 'Bridging design and development, Sreenandha shaped the species catalog, gallery module, and QR flow — turning complex botanical data into experiences that are intuitive for students and researchers alike.',
    tagline: 'Designing the space between nature and interface.',
  },
  {
    name: 'Kiruthi Varshni S',
    role: 'Developer',
    tag: 'Dev Team',
    photo: '/photos/kiruthi.png',
    initials: 'KV',
    accent: '#6dca61',
    bio: 'With a sharp eye for detail and user experience, Kiruthi refined the admin panel, access control, and content management tools — making it easy for campus staff to keep the atlas accurate and up to date.',
    tagline: 'Precision in every pixel and permission.',
  },
]

/* ── 3D Photo card ── */
function PhotoCard({ person, dark }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 220, height: 260 }}>
      {/* 3D layered background blobs */}
      <div className="absolute" style={{
        inset: 0,
        borderRadius: 24,
        background: `linear-gradient(135deg, ${person.accent}55, ${person.accent}22)`,
        transform: 'rotate(6deg) scale(0.97)',
        filter: 'blur(2px)',
      }} />
      <div className="absolute" style={{
        inset: 0,
        borderRadius: 24,
        background: `linear-gradient(135deg, ${person.accent}33, transparent)`,
        transform: 'rotate(3deg) scale(0.99)',
        border: `1.5px solid ${person.accent}55`,
      }} />

      {/* Main photo frame */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center"
        style={{
          borderRadius: 20,
          background: dark
            ? `linear-gradient(145deg, #1c2128, #0d1117)`
            : `linear-gradient(145deg, #e8f5e9, #f0f7ee)`,
          border: `2px solid ${person.accent}66`,
          boxShadow: `0 20px 60px ${person.accent}30, 0 4px 16px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.1)`,
        }}>
        <img
          src={person.photo}
          alt={person.name}
          onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          className="w-full h-full object-cover object-top"
          style={{ borderRadius: 18 }}
        />
        {/* Fallback avatar */}
        <div style={{
          display: 'none',
          width: '100%', height: '100%',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 48, fontWeight: 700,
          color: person.accent,
          fontFamily: 'Cinzel, serif',
          letterSpacing: 2,
        }}>
          {person.initials}
        </div>
      </div>

      {/* Role badge pinned to bottom */}
      <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-semibold whitespace-nowrap"
        style={{
          background: person.accent,
          color: '#fff',
          boxShadow: `0 4px 12px ${person.accent}55`,
          letterSpacing: '0.05em',
        }}>
        {person.tag}
      </div>
    </div>
  )
}

/* ── Single person card ── */
function PersonCard({ person, index, dark }) {
  const isEven = index % 2 === 0

  return (
    <motion.div {...fadeUp(0.1 * index)}
      className="flex flex-col md:flex-row items-center gap-10 md:gap-16 py-12"
      style={{
        flexDirection: isEven ? undefined : 'row-reverse',
        borderBottom: `1px solid ${dark ? '#21262d' : '#d1fae5'}`,
      }}>

      <PhotoCard person={person} dark={dark} />

      {/* Text side */}
      <div className="flex-1 min-w-0">
        {/* Eyebrow */}
        <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-3 px-3 py-1 rounded-full"
          style={{
            background: `${person.accent}18`,
            color: person.accent,
            border: `1px solid ${person.accent}33`,
          }}>
          {person.role}
        </span>

        {/* Name */}
        <h3 className="text-2xl md:text-3xl font-bold mb-1 leading-tight"
          style={{
            fontFamily: 'Cinzel, serif',
            color: dark ? '#e6edf3' : '#111827',
            letterSpacing: '-0.01em',
          }}>
          {person.name}
        </h3>

        {/* Tagline */}
        <p className="text-sm italic mb-4"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: '1.05rem',
            color: person.accent,
            opacity: 0.85,
          }}>
          "{person.tagline}"
        </p>

        {/* Bio */}
        <p className="text-sm leading-relaxed"
          style={{ color: dark ? '#8b949e' : '#4b5563', maxWidth: 480 }}>
          {person.bio}
        </p>

        {/* Decorative line accent */}
        <div className="mt-5 h-0.5 w-16 rounded-full"
          style={{ background: `linear-gradient(90deg, ${person.accent}, transparent)` }} />
      </div>
    </motion.div>
  )
}

/* ── Exported section (used in Home too) ── */
export function AboutContent({ dark }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">

      {/* Header */}
      <motion.div {...fadeUp(0)} className="text-center mb-16">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
          style={{
            background: 'rgba(82,160,67,0.12)',
            border: '1px solid rgba(82,160,67,0.3)',
            color: '#52a043',
          }}>
          The People Behind Green Atlas
        </span>

        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          style={{ fontFamily: 'Cinzel, serif', color: dark ? '#e6edf3' : '#111827', letterSpacing: '-0.02em' }}>
          Meet the Team
        </h1>

        <p className="text-base leading-relaxed max-w-xl mx-auto"
          style={{ color: dark ? '#8b949e' : '#6b7280' }}>
          Green Atlas is the work of students and faculty from the{' '}
          <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>
            Department of Computer Science and Design, Sona College of Technology
          </strong>
          {' '}— built in association with{' '}
          <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>The Nature's Club</strong>.
        </p>
      </motion.div>

      {/* Person cards */}
      <div>
        {people.map((person, i) => (
          <PersonCard key={person.name} person={person} index={i} dark={dark} />
        ))}
      </div>

      {/* Footer institution badge */}
      <motion.div {...fadeUp(0.4)}
        className="mt-16 rounded-2xl p-8 text-center"
        style={{
          background: dark
            ? 'linear-gradient(135deg, #161b22, #1c2128)'
            : 'linear-gradient(135deg, #f0f7ee, #e8f5e9)',
          border: `1px solid ${dark ? '#30363d' : '#bbf7d0'}`,
        }}>
        <div className="text-3xl mb-3">🌿</div>
        <p className="text-xs font-bold tracking-[0.2em] uppercase mb-1"
          style={{ color: '#52a043' }}>
          Department of Computer Science and Design
        </p>
        <p className="font-bold text-lg"
          style={{ fontFamily: 'Cinzel, serif', color: dark ? '#e6edf3' : '#111827' }}>
          Sona College of Technology, Salem
        </p>
        <p className="text-xs mt-2" style={{ color: dark ? '#6e7681' : '#9ca3af' }}>
          In association with The Nature's Club
        </p>
      </motion.div>
    </div>
  )
}

/* ── Standalone page ── */
export default function About() {
  const [dark] = useDarkMode()
  return (
    <div className="min-h-screen" style={{ background: dark ? '#0d1117' : '#f9fafb' }}>
      <AboutContent dark={dark} />
    </div>
  )
}
