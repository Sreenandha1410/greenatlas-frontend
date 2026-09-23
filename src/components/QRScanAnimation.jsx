import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Floating particles from LEFT side (O2)
function LeftParticle({ emoji, delay, duration, startY }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -80, y: startY }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [-80, -40, -10, 20],
        y: [startY, startY - 40, startY - 80, startY - 130],
      }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: 1.2, ease: 'easeOut' }}
      className="absolute left-0 text-xl select-none pointer-events-none">
      {emoji}
    </motion.div>
  )
}

// Floating particles from RIGHT side (CO2)
function RightParticle({ emoji, delay, duration, startY }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 80, y: startY }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [80, 40, 10, -20],
        y: [startY, startY - 40, startY - 80, startY - 130],
      }}
      transition={{ duration, delay, repeat: Infinity, repeatDelay: 1.2, ease: 'easeOut' }}
      className="absolute right-0 text-xl select-none pointer-events-none">
      {emoji}
    </motion.div>
  )
}

export default function QRScanAnimation({ tree, onDone }) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 800)
    return () => clearTimeout(t1)
  }, [])

  return (
    <AnimatePresence>
      {phase < 2 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-between overflow-hidden py-10 px-4"
          style={{ background: 'linear-gradient(160deg, #0a1f0a 0%, #1a3618 40%, #0d2b0d 100%)' }}>

          {/* Animated radial glow */}
          <motion.div
            animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 400, height: 400,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(82,160,67,0.25) 0%, transparent 70%)',
            }} />

          {/* TOP — Tree name */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-center relative z-10 mt-4">
            <p className="text-xs font-bold tracking-widest uppercase mb-2"
              style={{ color: '#81c784' }}>You are looking at</p>
            <h1 className="text-3xl font-bold text-white text-center mb-1"
              style={{ fontFamily: 'Cinzel, serif' }}>
              {tree?.common_name || 'Green Atlas'}
            </h1>
            <p className="italic text-sm" style={{ color: '#81c784' }}>
              {tree?.botanical_name}
            </p>
          </motion.div>

          {/* MIDDLE — O2 and CO2 cards side by side with particles */}
          <div className="relative flex gap-4 z-10 w-full max-w-sm mx-auto items-stretch">

            {/* Left side particles — O2 rising */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {phase >= 1 && (
                <>
                  <LeftParticle emoji="🍃" delay={0}   duration={2.5} startY={80} />
                  <LeftParticle emoji="💨" delay={0.6} duration={2.2} startY={50} />
                  <LeftParticle emoji="🌿" delay={1.2} duration={2.8} startY={100} />
                  <LeftParticle emoji="✨" delay={0.3} duration={2.0} startY={60} />
                </>
              )}
            </div>

            {/* Right side particles — CO2 absorbed */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {phase >= 1 && (
                <>
                  <RightParticle emoji="💨" delay={0.2} duration={2.3} startY={70} />
                  <RightParticle emoji="🌫️" delay={0.8} duration={2.6} startY={40} />
                  <RightParticle emoji="💙" delay={1.4} duration={2.1} startY={90} />
                  <RightParticle emoji="✨" delay={0.5} duration={1.9} startY={55} />
                </>
              )}
            </div>

            {/* O2 Card */}
            <motion.div
              initial={{ opacity: 0, x: -50, scale: 0.8 }}
              animate={phase >= 1 ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ delay: 0.7, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex-1 flex flex-col items-center px-4 py-5 rounded-2xl"
              style={{
                background: 'rgba(82,160,67,0.15)',
                border: '1.5px solid rgba(82,160,67,0.4)',
                backdropFilter: 'blur(12px)',
              }}>
              {/* O2 molecule animation */}
              <div className="relative mb-3" style={{ width: 56, height: 40 }}>
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: 'absolute', width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #81c784, #4caf50)',
                    left: 0, top: 9,
                    boxShadow: '0 0 12px rgba(76,175,80,0.7)'
                  }} />
                <motion.div
                  animate={{ scaleX: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                  style={{
                    position: 'absolute', height: 3,
                    background: 'rgba(129,199,132,0.9)',
                    width: 14, left: 21, top: 18,
                  }} />
                <motion.div
                  animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.15 }}
                  style={{
                    position: 'absolute', width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #81c784, #4caf50)',
                    right: 0, top: 9,
                    boxShadow: '0 0 12px rgba(76,175,80,0.7)'
                  }} />
              </div>
              <span className="text-2xl font-black mb-1" style={{ color: '#81c784', letterSpacing: 2 }}>O₂</span>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.1, duration: 0.4 }}
                className="text-base font-bold" style={{ color: '#c8e6c9' }}>
                {tree?.o2_produced || '~100 kg/yr'}
              </motion.span>
              <span className="text-xs mt-1 text-center" style={{ color: '#81c784aa' }}>
                Oxygen Produced
              </span>
            </motion.div>

            {/* CO2 Card */}
            <motion.div
              initial={{ opacity: 0, x: 50, scale: 0.8 }}
              animate={phase >= 1 ? { opacity: 1, x: 0, scale: 1 } : {}}
              transition={{ delay: 0.9, type: 'spring', stiffness: 200, damping: 18 }}
              className="flex-1 flex flex-col items-center px-4 py-5 rounded-2xl"
              style={{
                background: 'rgba(30,100,180,0.15)',
                border: '1.5px solid rgba(100,160,255,0.35)',
                backdropFilter: 'blur(12px)',
              }}>
              {/* CO2 molecule animation */}
              <div className="relative mb-3" style={{ width: 72, height: 40 }}>
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity }}
                  style={{
                    position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #90caf9, #42a5f5)',
                    left: 0, top: 11,
                    boxShadow: '0 0 10px rgba(66,165,245,0.7)'
                  }} />
                <motion.div style={{
                  position: 'absolute', height: 3,
                  background: 'rgba(144,202,249,0.8)',
                  width: 10, left: 17, top: 19
                }} />
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.2 }}
                  style={{
                    position: 'absolute', width: 22, height: 22, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f48fb1, #e91e63)',
                    left: 25, top: 9,
                    boxShadow: '0 0 10px rgba(233,30,99,0.6)'
                  }} />
                <motion.div style={{
                  position: 'absolute', height: 3,
                  background: 'rgba(144,202,249,0.8)',
                  width: 10, left: 46, top: 19
                }} />
                <motion.div
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 2.2, repeat: Infinity, delay: 0.1 }}
                  style={{
                    position: 'absolute', width: 18, height: 18, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #90caf9, #42a5f5)',
                    right: 0, top: 11,
                    boxShadow: '0 0 10px rgba(66,165,245,0.7)'
                  }} />
              </div>
              <span className="text-2xl font-black mb-1" style={{ color: '#90caf9', letterSpacing: 2 }}>CO₂</span>
              <motion.span
                initial={{ opacity: 0, y: 8 }}
                animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 1.3, duration: 0.4 }}
                className="text-base font-bold" style={{ color: '#bbdefb' }}>
                {tree?.co2_absorbed || '~250 kg/yr'}
              </motion.span>
              <span className="text-xs mt-1 text-center" style={{ color: '#90caf9aa' }}>
                CO₂ Absorbed
              </span>
            </motion.div>
          </div>

          {/* BOTTOM — Button + branding stacked cleanly */}
          <div className="relative z-10 flex flex-col items-center gap-4">
            {/* Explore button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.8, duration: 0.4 }}
              onClick={() => { setPhase(2); onDone?.() }}
              className="px-8 py-3 rounded-full text-sm font-bold text-white
                         flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
              style={{
                background: 'linear-gradient(135deg, #2d5a27, #4caf50)',
                boxShadow: '0 4px 20px rgba(76,175,80,0.4)',
                border: '1px solid rgba(129,199,132,0.4)',
              }}>
              <span>Explore this Tree</span>
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.2, repeat: Infinity }}>
                →
              </motion.span>
            </motion.button>

            {/* Branding */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={phase >= 1 ? { opacity: 1 } : {}}
              transition={{ delay: 2.0 }}
              className="flex items-center gap-2">
              <img src="/favicon.png" alt="" className="w-4 h-4 object-contain opacity-60" />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Green Atlas · Sona College of Technology
              </span>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
