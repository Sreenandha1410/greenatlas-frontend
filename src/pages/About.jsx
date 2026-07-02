import { motion } from 'framer-motion'
import { useDarkMode } from '../context/DarkModeContext'

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.55, delay, ease: 'easeOut' }
})

export function AboutContent({ dark }) {
  return (
    <div className="max-w-4xl mx-auto px-4 py-16">

      {/* Header */}
      <motion.div {...fadeUp(0)} className="text-center mb-12">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase mb-4"
          style={{ background: 'rgba(82,160,67,0.15)', border: '1px solid rgba(82,160,67,0.3)', color: '#52a043' }}>
          About Us
        </span>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-3"
          style={{ color: dark ? '#e6edf3' : '#111827' }}>
          Green Atlas
        </h1>
        <p className="text-lg italic"
          style={{ color: dark ? '#7dc070' : '#2d5a27', fontFamily: 'Cormorant Garamond, serif' }}>
          "Nurturing Nature. Inspiring Sustainability."
        </p>
      </motion.div>

      {/* About paragraphs */}
      <motion.div {...fadeUp(0.1)}
        className="rounded-2xl p-8 mb-10"
        style={{ background: dark ? '#161b22' : '#f0f7ee' }}>
        <p className="leading-relaxed mb-4" style={{ color: dark ? '#c9d1d9' : '#374151' }}>
          Green Atlas is an innovative digital platform developed by the students of the{' '}
          <strong>Department of Computer Science and Design, Sona College of Technology</strong>,
          under the guidance of <strong>Dr. Sanjivi Arul</strong> and with the valuable support of{' '}
          <strong>Mr. Anandhavelu</strong>, Chief Gardener. The project was created to digitally
          document, preserve, and promote the rich biodiversity of the Sona College campus while
          supporting the environmental initiatives of <strong>The Nature's Club</strong>.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: dark ? '#c9d1d9' : '#374151' }}>
          Designed as a comprehensive digital atlas of the campus flora, Green Atlas enables
          students, faculty, visitors, and nature enthusiasts to explore the diverse collection of
          trees and plants spread across the entire campus. Through an intuitive and interactive
          interface, users can easily navigate the campus map, locate plant species, and access
          detailed botanical information, making nature exploration both engaging and educational.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: dark ? '#c9d1d9' : '#374151' }}>
          The platform serves as a bridge between technology and environmental conservation by
          transforming traditional campus biodiversity records into a modern digital experience.
          Each plant profile provides carefully curated information, including its common and
          scientific names, botanical classification, ecological importance, and other educational
          insights, encouraging users to develop a deeper understanding and appreciation of the
          natural environment.
        </p>
        <p className="leading-relaxed mb-4" style={{ color: dark ? '#c9d1d9' : '#374151' }}>
          Green Atlas also features an interactive campus map that allows users to visually explore
          plant locations, discover species across different areas of the campus, and learn about
          the unique green spaces that contribute to Sona College's ecological landscape. By making
          biodiversity information easily accessible, the platform promotes environmental awareness,
          supports academic learning, and encourages responsible stewardship of nature.
        </p>
        <p className="leading-relaxed" style={{ color: dark ? '#c9d1d9' : '#374151' }}>
          More than a digital mapping application, Green Atlas represents a commitment to
          sustainability, innovation, and knowledge sharing. It demonstrates how technology can be
          effectively utilized to preserve biodiversity, inspire environmental responsibility, and
          create meaningful learning experiences for present and future generations. Through this
          initiative, the development team envisions fostering a greener, smarter, and more
          environmentally conscious campus community.
        </p>
      </motion.div>

      {/* Team section */}
      <div className="grid md:grid-cols-2 gap-6">

        {/* Advisors */}
        <motion.div {...fadeUp(0.2)}
          className="rounded-2xl p-6"
          style={{ background: dark ? '#161b22' : '#fff', border: `1px solid ${dark ? '#30363d' : '#d1fae5'}` }}>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"
            style={{ color: dark ? '#7dc070' : '#2d5a27' }}>
            Project Advisors
          </h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: '#2d5a27' }}>SA</div>
              <div>
                <p className="font-semibold" style={{ color: dark ? '#e6edf3' : '#111827' }}>Dr. Sanjivi Arul</p>
                <p className="text-xs" style={{ color: dark ? '#8b949e' : '#6b7280' }}>Project Advisor</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ background: '#2d5a27' }}>AJ</div>
              <div>
                <p className="font-semibold" style={{ color: dark ? '#e6edf3' : '#111827' }}>Mr. Anandhavel J</p>
                <p className="text-xs" style={{ color: dark ? '#8b949e' : '#6b7280' }}>Horticulturist</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Development Team */}
        <motion.div {...fadeUp(0.3)}
          className="rounded-2xl p-6"
          style={{ background: dark ? '#161b22' : '#fff', border: `1px solid ${dark ? '#30363d' : '#d1fae5'}` }}>
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2"
            style={{ color: dark ? '#7dc070' : '#2d5a27' }}>
            Development Team
          </h3>
          <div className="space-y-3">
            {['Tumili M', 'Deepak P', 'Sreenandha S', 'Kiruthi Varshni S'].map((name, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs"
                  style={{ background: ['#2d5a27','#3d7a35','#4d9a43','#5dba51'][i] }}>
                  {name.split(' ').map(w => w[0]).join('')}
                </div>
                <p className="text-sm font-medium" style={{ color: dark ? '#e6edf3' : '#111827' }}>{name}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Department */}
      <motion.div {...fadeUp(0.4)}
        className="mt-6 rounded-2xl p-6 text-center"
        style={{ background: dark ? '#161b22' : '#f0f7ee', border: `1px solid ${dark ? '#30363d' : '#d1fae5'}` }}>
        <p className="text-sm" style={{ color: dark ? '#8b949e' : '#6b7280' }}>
          Department of Computer Science and Design
        </p>
        <p className="font-semibold mt-1" style={{ color: dark ? '#e6edf3' : '#111827' }}>
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
    </div>
  )
}
