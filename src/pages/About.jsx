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
    role: 'Principal & Professor of Civil Engineering',
    tag: 'Leadership',
    photo: '/photos/principal.png',
    initials: 'SS',
    accent: '#1a4d2e',
    credential: 'PhD',
    bio: 'Principal and Professor of Civil Engineering at Sona College of Technology. His visionary leadership and unwavering support made Green Atlas possible — championing the fusion of technology and environmental stewardship across the campus.',
    tagline: 'Nurturing a greener, smarter campus community.',
  },
  {
    name: 'Dr. Sanjivi Arul',
    role: 'Advisor Innovation · Project Advisor',
    tag: 'Advisor',
    photo: '/photos/advisor.png',
    initials: 'SA',
    accent: '#2d5a27',
    credential: null,
    bio: "Advisor Innovation at Sona College of Technology and the guiding force behind Green Atlas. Dr. Sanjivi Arul mentored the development team from ideation to deployment, shaping every aspect of the platform's design and purpose.",
    tagline: 'Where ecological insight meets elegant engineering.',
  },
  {
    name: 'Mr. Anandhavel J',
    role: 'Chief Gardener · Horticulturalist',
    tag: 'Horticulture',
    photo: '/photos/anandhavel.png',
    initials: 'AJ',
    accent: '#3a6b30',
    credential: null,
    bio: "The living encyclopedia of Sona's green spaces. Mr. Anandhavel's deep knowledge of every tree and plant on campus — their names, histories, and care — was the botanical backbone that made accurate documentation possible.",
    tagline: 'Every tree on this campus has a story I can tell.',
  },
  {
    name: 'Tumili M',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/tumili.png',
    initials: 'TM',
    accent: '#3d7a35',
    credential: null,
    bio: "A core member of the Green Atlas development team. Tumili contributed to building the platform's interactive features and user interface, helping transform biodiversity data into an engaging digital experience.",
    tagline: 'Code that breathes life into data.',
  },
  {
    name: 'Deepak P',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/deepak.png',
    initials: 'DP',
    accent: '#4d9a43',
    credential: null,
    bio: 'Part of the team that brought Green Atlas from concept to reality. Deepak worked on the technical foundations of the platform, ensuring the system reliably serves the entire tree inventory to every campus visitor.',
    tagline: 'Robust systems rooted in clean design.',
  },
  {
    name: 'Sreenandha S',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/sreenandha.png',
    initials: 'SS',
    accent: '#5dba51',
    credential: null,
    bio: 'A developer and designer on the Green Atlas team. Sreenandha helped craft the visual and functional experience, turning complex botanical information into something intuitive and accessible for all users.',
    tagline: 'Designing the space between nature and interface.',
  },
  {
    name: 'Kiruthi Varshni S',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/kiruthi.png',
    initials: 'KV',
    accent: '#6dca61',
    credential: null,
    bio: "An integral part of the Green Atlas development team. Kiruthi contributed to building and refining the platform's features, ensuring the atlas remains accurate, accessible, and useful to the entire college community.",
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
    <motion.div {...fadeUp(0.08 * index)}
      className="flex flex-col md:flex-row items-center gap-10 md:gap-16 py-14"
      style={{
        flexDirection: isEven ? undefined : undefined,
        borderBottom: `1px solid ${dark ? '#21262d' : '#d1fae5'}`,
      }}>

      {/* Photo alternates sides */}
      {isEven
        ? <PhotoCard person={person} dark={dark} />
        : null}

      {/* Text side */}
      <div className="flex-1 min-w-0" style={{ order: isEven ? 1 : 0 }}>
        {/* Eyebrow */}
        <span className="inline-block text-xs font-bold tracking-[0.2em] uppercase mb-3 px-3 py-1 rounded-full"
          style={{
            background: `${person.accent}18`,
            color: person.accent,
            border: `1px solid ${person.accent}33`,
          }}>
          {person.role}
        </span>

        {/* Name + credential */}
        <h3 className="text-2xl md:text-3xl font-bold mb-1 leading-tight"
          style={{
            fontFamily: 'Cinzel, serif',
            color: dark ? '#e6edf3' : '#111827',
            letterSpacing: '-0.01em',
          }}>
          {person.name}
          {person.credential && (
            <span className="ml-2 text-base font-normal"
              style={{ color: person.accent, fontFamily: 'inherit' }}>
              {person.credential}
            </span>
          )}
        </h3>

        {/* Tagline */}
        <p className="italic mb-4"
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

        {/* Decorative line */}
        <div className="mt-5 h-0.5 w-16 rounded-full"
          style={{ background: `linear-gradient(90deg, ${person.accent}, transparent)` }} />
      </div>

      {!isEven
        ? <PhotoCard person={person} dark={dark} />
        : null}
    </motion.div>
  )
}

/* ── About write-up paragraphs ── */
function AboutWriteup({ dark }) {
  return (
    <motion.div {...fadeUp(0.1)}
      className="rounded-2xl p-8 mb-16"
      style={{ background: dark ? '#161b22' : '#f0f7ee', border: `1px solid ${dark ? '#30363d' : '#d1fae5'}` }}>
      <p className="text-xs font-bold tracking-[0.2em] uppercase mb-4"
        style={{ color: '#52a043' }}>
        About Green Atlas
      </p>
      <p className="text-lg italic mb-6 leading-snug"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: dark ? '#7dc070' : '#2d5a27', fontSize: '1.25rem' }}>
        "Nurturing Nature. Inspiring Sustainability."
      </p>
      {[
        <>Green Atlas is an innovative digital platform developed by the students of the <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>Department of Computer Science and Design, Sona College of Technology</strong>, under the guidance of <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>Dr. S R R Senthilkumar</strong>, The Principal, and <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>Dr. Sanjivi Arul</strong>, Advisor Innovation — with the valuable support of <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>Mr. Anandhavelu</strong>, Chief Gardener. The project was created to digitally document, preserve, and promote the rich biodiversity of the <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>Sona campus</strong> while supporting the environmental initiatives of <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>The Nature's Club</strong>.</>,
        'Designed as a comprehensive digital atlas of the campus flora, Green Atlas enables students, faculty, visitors, and nature enthusiasts to explore the diverse collection of trees and plants spread across the entire campus. Through an intuitive and interactive interface, users can easily navigate the campus map, locate plant species, and access detailed botanical information, making nature exploration both engaging and educational.',
        'The platform serves as a bridge between technology and environmental conservation by transforming traditional campus biodiversity records into a modern digital experience. Each plant profile provides carefully curated information — including its common and scientific names, botanical classification, ecological importance, and other educational insights — encouraging users to develop a deeper understanding and appreciation of the natural environment.',
        "Green Atlas also features an interactive campus map that allows users to visually explore plant locations, discover species across different areas of the campus, and learn about the unique green spaces that contribute to Sona College's ecological landscape. By making biodiversity information easily accessible, the platform promotes environmental awareness, supports academic learning, and encourages responsible stewardship of nature.",
        'More than a digital mapping application, Green Atlas represents a commitment to sustainability, innovation, and knowledge sharing. It demonstrates how technology can be effectively utilised to preserve biodiversity, inspire environmental responsibility, and create meaningful learning experiences for present and future generations. Through this initiative, the development team envisions fostering a greener, smarter, and more environmentally conscious campus community.',
      ].map((para, i) => (
        <p key={i} className="leading-relaxed mb-4 text-sm last:mb-0"
          style={{ color: dark ? '#c9d1d9' : '#374151' }}>
          {para}
        </p>
      ))}
    </motion.div>
  )
}

/* ── Exported section (used in Home too) ── */
export function AboutContent({ dark }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-20">

      {/* Page header */}
      <motion.div {...fadeUp(0)} className="text-center mb-12">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-5"
          style={{
            background: 'rgba(82,160,67,0.12)',
            border: '1px solid rgba(82,160,67,0.3)',
            color: '#52a043',
          }}>
          About Us
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight"
          style={{ fontFamily: 'Cinzel, serif', color: dark ? '#e6edf3' : '#111827', letterSpacing: '-0.02em' }}>
          Green Atlas
        </h1>
        <p className="text-base max-w-xl mx-auto"
          style={{ color: dark ? '#8b949e' : '#6b7280' }}>
          A living digital record of every tree on the Sona College campus —
          built by students, for the campus community.
        </p>
      </motion.div>

      {/* About write-up */}
      <AboutWriteup dark={dark} />

      {/* Team section header */}
      <motion.div {...fadeUp(0)} className="text-center mb-12">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
          style={{
            background: 'rgba(82,160,67,0.12)',
            border: '1px solid rgba(82,160,67,0.3)',
            color: '#52a043',
          }}>
          The People Behind It
        </span>
        <h2 className="text-3xl md:text-4xl font-bold"
          style={{ fontFamily: 'Cinzel, serif', color: dark ? '#e6edf3' : '#111827' }}>
          Meet the Team
        </h2>
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
