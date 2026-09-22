import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function FloatingParticle({ emoji, delay, x, duration }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 0, x: 0, scale: 0.5 }}
      animate={{
        opacity: [0, 1, 1, 0],
        y: [-10, -60, -120, -180],
        x: [0, x * 0.3, x * 0.7, x],
        scale: [0.5, 1, 0.9, 0.5],
      }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: 1.5, ease: 'easeOut' }}
      className="absolute text-2xl select-none pointer-events-none"
      style={{ bottom: 60, left: '50%' }}>
      {emoji}
    </motion.div>
  )
}

export default function QRScanAnimation({ tree, onDone }) {
  const [phase, setPhase] = useState(0)
  // phase 0 = welcome flash, 1 = stats animation, 2 = done

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)
    const t2 = setTimeout(() => setPhase(2), 4200)
    const t3 = setTimeout(() => onDone?.(), 4600)
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
  }, [])

  // Approximate O2 and CO2 values from tree data
  const o2 = tree?.avg_height
    ? `~${Math.round(parseFloat(tree.avg_height) * 4.5)} kg/yr`
    : '~100 kg/yr'
  const co2 = tree?.avg_height
    ? `~${Math.round(parseFloat(tree.avg_height) * 12)} kg/yr`
    : '~250 kg/yr'

  return (
    <AnimatePresence>
      {phase < 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-center overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0a1f0a 0%, #1a3618 40%, #0d2b0d 100%)' }}>

          {/* Animated radial glow */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute rounded-full"
            style={{
              width: 400, height: 400,
              background: 'radial-gradient(circle, rgba(82,160,67,0.25) 0%, transparent 70%)',
            }} />

          {/* Tree emoji with pulse */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={phase >= 1 ? { scale: 1, rotate: 0 } : { scale: 0, rotate: -20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.1 }}
            className="text-8xl mb-6 relative z-10">
            🌳
          </motion.div>

          {/* Tree name */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl font-bold text-white text-center mb-1 px-6 relative z-10"
            style={{ fontFamily: 'Cinzel, serif' }}>
            {tree?.common_name || 'Green Atlas'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="italic text-sm mb-8 relative z-10"
            style={{ color: '#81c784' }}>
            {tree?.botanical_name}
          </motion.p>

          {/* O2 and CO2 cards */}
          <div className="flex gap-4 relative z-10 mb-6">

            {/* O2 Card */}
            <motion.div
              initial={{ opacity: 0, x: -40, scale: 0.8 }}
              animate={phase >= 1 ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center px-6 py-4 rounded-2xl"
              style={{
                background: 'rgba(82,160,67,0.15)',
                border: '1.5px solid rgba(82,160,67,0.4)',
                backdropFilter: 'blur(12px)',
                minWidth: 130,
              }}>
              {/* Animated O2 molecule */}
              <div className="relative mb-2" style={{ width: 56, height: 40 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute"
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #81c784, #4caf50)',
                    left: 0, top: 9,
                    boxShadow: '0 0 10px rgba(76,175,80,0.6)'
                  }} />
                <motion.div
                  animate={{ scaleX: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  style={{
                    position: 'absolute', height: 2,
                    background: 'rgba(129,199,132,0.8)',
                    width: 14, left: 21, top: 19,
                  }} />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.15 }}
                  className="absolute"
                  style={{
                    width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #81c784, #4caf50)',
                    right: 0, top: 9,
                    boxShadow: '0 0 10px rgba(76,175,80,0.6)'
                  }} />
              </div>
              <span className="text-2xl font-black" style={{ color: '#81c784', letterSpacing: 2 }}>O₂</span>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="text-sm font-bold mt-1" style={{ color: '#c8e6c9' }}>
                {o2}
              </motion.span>
              <span className="text-xs mt-0.5" style={{ color: '#81c784aa' }}>Oxygen Produced</span>
            </motion.div>

            {/* CO2 Card */}
            <motion.div
              initial={{ opacity: 0, x: 40, scale: 0.8 }}
              animate={phase >= 1 ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex flex-col items-center px-6 py-4 rounded-2xl"
              style={{
                background: 'rgba(30,100,180,0.15)',
                border: '1.5px solid rgba(100,160,255,0.35)',
                backdropFilter: 'blur(12px)',
                minWidth: 130,
              }}>
              {/* Animated CO2 molecule */}
              <div className="relative mb-2" style={{ width: 72, height: 40 }}>
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  style={{
                    position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #90caf9, #42a5f5)',
                    left: 0, top: 11,
                    boxShadow: '0 0 8px rgba(66,165,245,0.6)'
                  }} />
                <motion.div style={{ position: 'absolute', height: 2, background: 'rgba(144,202,249,0.7)', width: 10, left: 17, top: 19 }} />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.2 }}
                  style={{
                    position: 'absolute', width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f48fb1, #e91e63)',
                    left: 25, top: 9,
                    boxShadow: '0 0 10px rgba(233,30,99,0.5)'
                  }} />
                <motion.div style={{ position: 'absolute', height: 2, background: 'rgba(144,202,249,0.7)', width: 10, left: 46, top: 19 }} />
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.1 }}
                  style={{
                    position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #90caf9, #42a5f5)',
                    right: 0, top: 11,
                    boxShadow: '0 0 8px rgba(66,165,245,0.6)'
                  }} />
              </div>
              <span className="text-2xl font-black" style={{ color: '#90caf9', letterSpacing: 2 }}>CO₂</span>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.3, duration: 0.4 }}
                className="text-sm font-bold mt-1" style={{ color: '#bbdefb' }}>
                {co2}
              </motion.span>
              <span className="text-xs mt-0.5" style={{ color: '#90caf9aa' }}>CO₂ Absorbed</span>
            </motion.div>
          </div>

          {/* Floating particles */}
          {phase >= 1 && (
            <>
              <FloatingParticle emoji="🍃" delay={0}   x={-60} duration={2.5} />
              <FloatingParticle emoji="💨" delay={0.4} x={40}  duration={2.2} />
              <FloatingParticle emoji="🌿" delay={0.8} x={-30} duration={2.8} />
              <FloatingParticle emoji="✨" delay={0.2} x={70}  duration={2.0} />
              <FloatingParticle emoji="🌱" delay={1.0} x={-80} duration={3.0} />
            </>
          )}

          {/* Powered by Green Atlas */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={phase >= 1 ? { opacity: 1 } : {}}
            transition={{ delay: 1.5 }}
            className="absolute bottom-8 flex items-center gap-2 relative z-10">
            <img src="/favicon.png" alt="" className="w-5 h-5 object-contain opacity-70" />
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Green Atlas · Sona College of Technology</span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
