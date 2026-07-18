import { motion } from 'framer-motion'
import { useDarkMode } from '../context/DarkModeContext'
import JoinNaturesClub from '../components/JoinNaturesClub'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: 'easeOut' }
})

const people = [
  {
    name: 'Dr. S R R Senthilkumar',
    role: 'Principal of Sona College of Technology & Professor of Civil Engineering',
    tag: 'Principal',
    photo: '/photos/principal.png',
    initials: 'SS',
    accent: '#1a4d2e',
    credential: 'PhD',
  },
  {
    name: 'Dr. Sanjivi Arul',
    role: 'Project Advisor',
    tag: 'Mentor',
    photo: '/photos/advisor.png',
    initials: 'SA',
    accent: '#2d5a27',
    credential: null,
  },
  {
    name: 'Mr. Anandhavel J',
    role: 'Horticulturalist',
    tag: 'Chief Gardener',
    photo: '/photos/anandhavel.png',
    initials: 'AJ',
    accent: '#3a6b30',
    credential: null,
  },
  {
    name: 'Dr. M. Renuga',
    role: 'HOD, Department of Humanities and Languages',
    tag: 'Staff Coordinator',
    photo: '/photos/renuga.png',
    initials: 'MR',
    accent: '#1a6b4d',
    credential: null,
  },
  {
    name: 'Ms. Shibi B',
    role: 'Assistant Professor, Department of Computer Science and Engineering',
    tag: 'Staff Coordinator',
    photo: '/photos/shibi.png',
    initials: 'SB',
    accent: '#2d6b5a',
    credential: null,
  },
  {
    name: 'Tumili M',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/tumili.png',
    initials: 'TM',
    accent: '#3d7a35',
    credential: null,
  },
  {
    name: 'Deepak P',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/deepak.png',
    initials: 'DP',
    accent: '#4d9a43',
    credential: null,
  },
  {
    name: 'Sreenandha S',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/sreenandha.png',
    initials: 'SS',
    accent: '#5dba51',
    credential: null,
  },
  {
    name: 'Kiruthi Varshni S',
    role: 'III Year · B.E Computer Science and Design',
    tag: 'Dev Team',
    photo: '/photos/kiruthi.png',
    initials: 'KV',
    accent: '#6dca61',
    credential: null,
  },
]

function PhotoCard({ person, dark }) {
  return (
    <div className="relative flex-shrink-0" style={{ width: 165, height: 200 }}>
      {/* 3D background layers */}
      <div className="absolute" style={{
        inset: 0, borderRadius: 20,
        background: `linear-gradient(135deg, ${person.accent}44, ${person.accent}18)`,
        transform: 'rotate(6deg) scale(0.97)',
        filter: 'blur(2px)',
      }} />
      <div className="absolute" style={{
        inset: 0, borderRadius: 20,
        background: `linear-gradient(135deg, ${person.accent}28, transparent)`,
        transform: 'rotate(3deg) scale(0.99)',
        border: `1.5px solid ${person.accent}44`,
      }} />
      {/* Photo */}
      <div className="absolute inset-0 overflow-hidden flex items-center justify-center"
        style={{
          borderRadius: 16,
          background: dark ? '#1c2128' : '#f0f7ee',
          border: `2px solid ${person.accent}55`,
          boxShadow: `0 16px 48px ${person.accent}28, 0 4px 12px rgba(0,0,0,0.2)`,
        }}>
        <img
          src={person.photo}
          alt={person.name}
          onError={e => {
            e.target.style.display = 'none'
            e.target.nextSibling.style.display = 'flex'
          }}
          className="w-full h-full object-cover object-top"
          style={{ borderRadius: 14 }}
        />
        <div style={{
          display: 'none', width: '100%', height: '100%',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 40, fontWeight: 700,
          color: person.accent, fontFamily: 'Cinzel, serif',
        }}>
          {person.initials}
        </div>
      </div>
    </div>
  )
}

function PersonCard({ person, index, dark }) {
  return (
    <motion.div {...fadeUp(0.07 * index)}
      className="flex flex-col md:flex-row items-center gap-8 md:gap-10 py-6"
      style={{ borderBottom: `1px solid ${dark ? '#21262d' : '#e5f0e5'}` }}>

      {/* Photo always on LEFT */}
      <PhotoCard person={person} dark={dark} />

      {/* Text */}
      <div className="flex-1 text-center md:text-left">
        <span className="inline-block text-xs font-bold tracking-[0.18em] uppercase mb-3 px-3 py-1 rounded-full"
          style={{
            background: `${person.accent}15`,
            color: person.accent,
            border: `1px solid ${person.accent}30`,
          }}>
          {person.tag}
        </span>

        <h3 className="text-xl md:text-2xl font-bold mb-1"
          style={{ fontFamily: 'Cinzel, serif', color: dark ? '#e6edf3' : '#111827' }}>
          {person.name}
          {person.credential && (
            <span className="ml-2 text-sm font-normal" style={{ color: person.accent }}>
              {person.credential}
            </span>
          )}
        </h3>

        <p className="text-sm" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
          {person.role}
        </p>

        <div className="mt-4 h-0.5 w-10 rounded-full mx-auto md:mx-0"
          style={{ background: `linear-gradient(90deg, ${person.accent}, transparent)` }} />
      </div>
    </motion.div>
  )
}

function AboutWriteup({ dark }) {
  const bold = (text) => (
    <strong style={{ color: dark ? '#c9d1d9' : '#374151' }}>{text}</strong>
  )
  return (
    <motion.div {...fadeUp(0.1)}
      className="rounded-2xl p-6 mb-8"
      style={{ background: dark ? '#161b22' : '#f0f7ee', border: `1px solid ${dark ? '#30363d' : '#d1fae5'}` }}>
      {[
        <p>Green Atlas is an innovative digital platform developed by the students of the {bold('Department of Computer Science and Design, Sona College of Technology')}, under the guidance of {bold('Dr. S R R Senthilkumar')}, The Principal, and {bold('Dr. Sanjivi Arul')}, Advisor Innovation — with the valuable support of {bold('Mr. Anandhavelu')}, Chief Gardener. The project was created to digitally document, preserve, and promote the rich biodiversity of the {bold('Sona campus')} while supporting the environmental initiatives of {bold("The Nature's Club")}.</p>,
        <p>Designed as a comprehensive digital atlas of the campus flora, Green Atlas enables students, faculty, visitors, and nature enthusiasts to explore the diverse collection of trees and plants spread across the entire campus. Through an intuitive and interactive interface, users can easily navigate the campus map, locate plant species, and access detailed botanical information, making nature exploration both engaging and educational.</p>,
        <p>The platform serves as a bridge between technology and environmental conservation by transforming traditional campus biodiversity records into a modern digital experience. Each plant profile provides carefully curated information — including its common and scientific names, botanical classification, ecological importance, and other educational insights — encouraging users to develop a deeper understanding and appreciation of the natural environment.</p>,
        <p>Green Atlas also features an interactive campus map that allows users to visually explore plant locations, discover species across different areas of the campus, and learn about the unique green spaces that contribute to Sona College's ecological landscape. By making biodiversity information easily accessible, the platform promotes environmental awareness, supports academic learning, and encourages responsible stewardship of nature.</p>,
        <p>More than a digital mapping application, Green Atlas represents a commitment to sustainability, innovation, and knowledge sharing. It demonstrates how technology can be effectively utilised to preserve biodiversity, inspire environmental responsibility, and create meaningful learning experiences for present and future generations. Through this initiative, the development team envisions fostering a greener, smarter, and more environmentally conscious campus community.</p>,
      ].map((para, i) => (
        <div key={i} className="leading-relaxed mb-4 text-sm last:mb-0"
          style={{ color: dark ? '#c9d1d9' : '#374151' }}>
          {para}
        </div>
      ))}
    </motion.div>
  )
}

export function AboutContent({ dark }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Header — centred title and tagline only */}
      <motion.div {...fadeUp(0)} className="text-center mb-8">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: 'rgba(82,160,67,0.12)', border: '1px solid rgba(82,160,67,0.3)', color: '#52a043' }}>
          About Us
        </span>
        <h1 className="text-4xl md:text-5xl font-bold mb-3"
          style={{ fontFamily: 'Cinzel, serif', color: dark ? '#e6edf3' : '#111827', letterSpacing: '-0.02em' }}>
          About Green Atlas
        </h1>
        <p className="text-lg italic"
          style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.2rem', color: dark ? '#7dc070' : '#2d5a27' }}>
          "Nurturing Nature. Inspiring Sustainability."
        </p>
      </motion.div>

      <AboutWriteup dark={dark} />

      {/* Meet the Team */}
      <motion.div {...fadeUp(0)} className="text-center mb-5">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ background: 'rgba(82,160,67,0.12)', border: '1px solid rgba(82,160,67,0.3)', color: '#52a043' }}>
          The People Behind It
        </span>
        <h2 className="text-3xl font-bold"
          style={{ fontFamily: 'Cinzel, serif', color: dark ? '#e6edf3' : '#111827' }}>
          Meet the Team
        </h2>
      </motion.div>

      <div>
        {people.map((person, i) => (
          <PersonCard key={person.name} person={person} index={i} dark={dark} />
        ))}
      </div>

      {/* Footer card */}
      <motion.div {...fadeUp(0.3)}
        className="mt-6 rounded-2xl p-5 text-center"
        style={{
          background: dark ? 'linear-gradient(135deg, #161b22, #1c2128)' : 'linear-gradient(135deg, #f0f7ee, #e8f5e9)',
          border: `1px solid ${dark ? '#30363d' : '#bbf7d0'}`,
        }}>
        <img src="/favicon.png" alt="Green Atlas" className="w-10 h-10 object-contain mx-auto mb-2" />
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

export default function About() {
  const [dark] = useDarkMode()
  return (
    <div className="min-h-screen" style={{ background: dark ? '#0d1117' : '#f9fafb' }}>
      <AboutContent dark={dark} />
      <JoinNaturesClub dark={dark} />
    </div>
  )
}
