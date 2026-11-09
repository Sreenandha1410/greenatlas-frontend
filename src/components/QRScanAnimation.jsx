import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// PARTICLE TREE BACKGROUND (Canvas 2D - lightweight & high-performance)
// ============================================================================
function ParticleTreeBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let w = 0, h = 0, raf = 0
    let network = [], tree = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rand = (a, b) => a + Math.random() * (b - a)

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      // Ambient spore network
      network = Array.from({ length: Math.min(100, Math.max(45, Math.floor((w * h) / 14000))) }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.15, 0.15),
        vy: rand(-0.12, 0.12),
        r: rand(0.8, 2.2),
        phase: rand(0, 6.28),
        alpha: rand(0.2, 0.7)
      }))

      const cx = w / 2
      const ground = h * 0.76
      const rx = Math.min(w * 0.32, 230)
      const ry = Math.min(h * 0.28, 190)
      tree = []

      // Canopy particles
      const canopyCount = Math.min(320, Math.max(140, Math.floor((w * h) / 5500)))
      for (let i = 0; i < canopyCount; i++) {
        const a = rand(0, Math.PI * 2)
        const r = Math.sqrt(Math.random())
        const x = cx + Math.cos(a) * rx * r * rand(0.85, 1.1)
        const y = ground - ry + Math.sin(a) * ry * r * rand(0.85, 1.1)
        tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(0.8, 2.2), alpha: rand(0.3, 0.95) })
      }

      // Trunk
      for (let i = 0; i < 95; i++) {
        const t = i / 94
        const spread = 4 + t * 18
        const x = cx + rand(-spread, spread)
        const y = ground - t * h * 0.28
        tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(0.9, 2), alpha: rand(0.4, 0.95) })
      }

      // Roots
      for (const side of [-1, 1]) {
        for (let i = 0; i < 32; i++) {
          const t = i / 31
          const x = cx + side * t * rx * 0.68
          const y = ground + t * 10
          tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(0.7, 1.6), alpha: rand(0.3, 0.75) })
        }
      }

      // Branch lines
      ;[
        [-0.72, -0.76],
        [-0.45, -0.96],
        [-0.18, -1.05],
        [0.18, -1.05],
        [0.45, -0.96],
        [0.72, -0.76]
      ].forEach(([dx, dy]) => {
        for (let i = 0; i < 22; i++) {
          const t = i / 21
          const x = cx + dx * rx * t
          const y = ground - ry * 0.12 + dy * ry * t
          tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(0.7, 1.6), alpha: rand(0.3, 0.8) })
        }
      })
    }

    function frame(time) {
      ctx.clearRect(0, 0, w, h)

      // Forest dark radial ambience
      const bg = ctx.createRadialGradient(w * 0.5, h * 0.52, 10, w * 0.5, h * 0.52, Math.max(w, h) * 0.7)
      bg.addColorStop(0, 'rgba(10, 52, 24, 0.35)')
      bg.addColorStop(0.55, 'rgba(4, 25, 12, 0.22)')
      bg.addColorStop(1, 'rgba(1, 6, 4, 0)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, w, h)

      if (!reduced) {
        network.forEach(p => {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0 || p.x > w) p.vx *= -1
          if (p.y < 0 || p.y > h) p.vy *= -1
        })
      }

      // Constellation lines
      for (let i = 0; i < network.length; i++) {
        for (let j = i + 1; j < network.length; j++) {
          const a = network[i]
          const b = network[j]
          const d = Math.hypot(a.x - b.x, a.y - b.y)
          if (d < 110) {
            ctx.strokeStyle = `rgba(60, 205, 95, ${(1 - d / 110) * 0.14})`
            ctx.lineWidth = 0.6
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      network.forEach(p => {
        const pulse = reduced ? 1 : 0.65 + Math.sin(time * 0.0016 + p.phase) * 0.35
        ctx.beginPath()
        ctx.fillStyle = `rgba(74, 255, 115, ${p.alpha * pulse})`
        ctx.shadowColor = '#39ff68'
        ctx.shadowBlur = 8
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowBlur = 0

      // Living tree mesh sway
      const sway = reduced ? 0 : Math.sin(time * 0.0006) * 2.2
      tree.forEach((p, i) => {
        const drift = reduced ? 0 : Math.sin(time * 0.00085 + p.phase) * 1.6
        p.x = p.ox + sway * (p.oy < h * 0.55 ? 0.75 : 0.25) + drift
        p.y = p.oy + (reduced ? 0 : Math.cos(time * 0.00075 + p.phase) * 1.2)

        for (let j = i + 1; j < tree.length; j++) {
          const q = tree[j]
          const d = Math.hypot(p.x - q.ox, p.y - q.oy)
          if (d < 20) {
            ctx.strokeStyle = `rgba(80, 235, 110, ${(1 - d / 20) * 0.12})`
            ctx.lineWidth = 0.55
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.ox, q.oy)
            ctx.stroke()
          }
        }
      })

      tree.forEach((p, i) => {
        const shimmer = reduced ? 0.8 : 0.55 + (Math.sin(time * 0.002 + p.phase) + 1) * 0.22
        ctx.beginPath()
        ctx.fillStyle = `rgba(125, 255, 140, ${p.alpha * shimmer})`
        ctx.shadowColor = '#45ff72'
        ctx.shadowBlur = i % 4 === 0 ? 12 : 5
        ctx.arc(p.x, p.y, p.size * (i % 7 === 0 ? 1.25 : 1), 0, Math.PI * 2)
        ctx.fill()
      })
      ctx.shadowBlur = 0

      if (!reduced) raf = requestAnimationFrame(frame)
    }

    resize()
    raf = requestAnimationFrame(frame)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full pointer-events-none" />
}

// ============================================================================
// MOLECULE MODELS (Vibrant 3D-feel Atoms)
// ============================================================================
export function O2VisualMolecule({ size = 'normal', glow = true }) {
  const isLarge = size === 'large'
  const atomSize = isLarge ? 28 : 20
  const bondWidth = isLarge ? 14 : 10

  return (
    <div className="relative flex items-center justify-center select-none" style={{ height: isLarge ? 50 : 38 }}>
      {/* Glow aura */}
      {glow && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.45, 0.8, 0.45] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: isLarge ? 85 : 62,
            height: isLarge ? 55 : 42,
            background: 'radial-gradient(ellipse, rgba(74,255,125,0.45) 0%, transparent 70%)',
            filter: 'blur(8px)'
          }}
        />
      )}

      {/* Oxygen Atom Left */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: atomSize,
          height: atomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #b8ffd2 20%, #46df75 50%, #0d6e2e 90%)',
          boxShadow: '0 0 16px rgba(70,223,117,0.7), inset -3px -4px 6px rgba(0,35,12,0.6)',
          border: '1px solid rgba(220,255,230,0.85)'
        }}
      />

      {/* Double Covalent Bond (O = O) */}
      <div className="flex flex-col gap-1 mx-0.5 z-10">
        <div
          style={{
            width: bondWidth,
            height: 3,
            borderRadius: 3,
            background: 'linear-gradient(90deg, #b8ffd2, #46df75)',
            boxShadow: '0 0 6px rgba(70,223,117,0.8)'
          }}
        />
        <div
          style={{
            width: bondWidth,
            height: 3,
            borderRadius: 3,
            background: 'linear-gradient(90deg, #b8ffd2, #46df75)',
            boxShadow: '0 0 6px rgba(70,223,117,0.8)'
          }}
        />
      </div>

      {/* Oxygen Atom Right */}
      <motion.div
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 2.4, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: atomSize,
          height: atomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #b8ffd2 20%, #46df75 50%, #0d6e2e 90%)',
          boxShadow: '0 0 16px rgba(70,223,117,0.7), inset -3px -4px 6px rgba(0,35,12,0.6)',
          border: '1px solid rgba(220,255,230,0.85)'
        }}
      />
    </div>
  )
}

export function CO2VisualMolecule({ size = 'normal', glow = true }) {
  const isLarge = size === 'large'
  const oAtomSize = isLarge ? 22 : 16
  const cAtomSize = isLarge ? 30 : 22
  const bondWidth = isLarge ? 11 : 8

  return (
    <div className="relative flex items-center justify-center select-none" style={{ height: isLarge ? 50 : 38 }}>
      {/* Glow aura */}
      {glow && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: isLarge ? 95 : 72,
            height: isLarge ? 55 : 42,
            background: 'radial-gradient(ellipse, rgba(80,180,255,0.35) 0%, rgba(244,114,182,0.2) 50%, transparent 75%)',
            filter: 'blur(8px)'
          }}
        />
      )}

      {/* Oxygen Atom (Left) */}
      <motion.div
        animate={{ y: [0, 2, 0] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: oAtomSize,
          height: oAtomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #cae8ff 22%, #38bdf8 55%, #0369a1 95%)',
          boxShadow: '0 0 14px rgba(56,189,248,0.7), inset -3px -3px 5px rgba(2,30,60,0.6)',
          border: '1px solid rgba(215,240,255,0.85)'
        }}
      />

      {/* Double Bond Left (O = C) */}
      <div className="flex flex-col gap-1 mx-0.5 z-10">
        <div
          style={{
            width: bondWidth,
            height: 2.5,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #38bdf8, #f472b6)',
            boxShadow: '0 0 5px rgba(56,189,248,0.8)'
          }}
        />
        <div
          style={{
            width: bondWidth,
            height: 2.5,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #38bdf8, #f472b6)',
            boxShadow: '0 0 5px rgba(56,189,248,0.8)'
          }}
        />
      </div>

      {/* Central Carbon Atom */}
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: cAtomSize,
          height: cAtomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #fff0f6 0%, #fbcfe8 20%, #f43f5e 55%, #881337 92%)',
          boxShadow: '0 0 18px rgba(244,63,94,0.75), inset -3px -4px 6px rgba(50,0,15,0.7)',
          border: '1px solid rgba(254,205,211,0.9)'
        }}
      />

      {/* Double Bond Right (C = O) */}
      <div className="flex flex-col gap-1 mx-0.5 z-10">
        <div
          style={{
            width: bondWidth,
            height: 2.5,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #f472b6, #38bdf8)',
            boxShadow: '0 0 5px rgba(56,189,248,0.8)'
          }}
        />
        <div
          style={{
            width: bondWidth,
            height: 2.5,
            borderRadius: 2,
            background: 'linear-gradient(90deg, #f472b6, #38bdf8)',
            boxShadow: '0 0 5px rgba(56,189,248,0.8)'
          }}
        />
      </div>

      {/* Oxygen Atom (Right) */}
      <motion.div
        animate={{ y: [0, -2, 0] }}
        transition={{ duration: 2.6, delay: 0.15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: oAtomSize,
          height: oAtomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #cae8ff 22%, #38bdf8 55%, #0369a1 95%)',
          boxShadow: '0 0 14px rgba(56,189,248,0.7), inset -3px -3px 5px rgba(2,30,60,0.6)',
          border: '1px solid rgba(215,240,255,0.85)'
        }}
      />
    </div>
  )
}

// ============================================================================
// MOLECULAR CLASH DUEL ARENA (Dynamic Fight Based on Emission / Production)
// ============================================================================
function MolecularClashArena({ o2Value = 0, co2Value = 0, onClashComplete }) {
  const [clashStage, setClashStage] = useState('charging') // charging -> colliding -> winner_surge -> docking
  const co2Dominates = co2Value > o2Value
  const isEqual = Math.abs(co2Value - o2Value) < 0.001

  useEffect(() => {
    // Stage 1: Collide after 0.75s
    const t1 = setTimeout(() => setClashStage('colliding'), 750)
    // Stage 2: Winner surge after collision at 1.7s
    const t2 = setTimeout(() => setClashStage('winner_surge'), 1700)
    // Stage 3: Dock into respective cards at 2.9s
    const t3 = setTimeout(() => {
      setClashStage('docking')
      onClashComplete?.()
    }, 2900)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onClashComplete])

  return (
    <div className="relative w-full max-w-lg h-36 flex items-center justify-center pointer-events-none overflow-visible">
      {/* Central Collision Energy Flash */}
      <AnimatePresence>
        {(clashStage === 'colliding' || clashStage === 'winner_surge') && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: clashStage === 'winner_surge' ? [1.4, 2.2, 1.8] : [0.5, 1.6, 1.1],
              opacity: [0.95, 0.8, 0.4]
            }}
            exit={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="absolute rounded-full"
            style={{
              width: 140,
              height: 140,
              background: co2Dominates
                ? 'radial-gradient(circle, rgba(255,110,160,0.85) 0%, rgba(244,63,94,0.4) 40%, rgba(56,189,248,0.2) 65%, transparent 80%)'
                : 'radial-gradient(circle, rgba(140,255,170,0.95) 0%, rgba(74,222,128,0.5) 40%, rgba(56,189,248,0.2) 65%, transparent 80%)',
              filter: 'blur(10px)',
              boxShadow: co2Dominates
                ? '0 0 50px rgba(244,63,94,0.8)'
                : '0 0 50px rgba(74,222,128,0.85)'
            }}
          />
        )}
      </AnimatePresence>

      {/* Dynamic Shockwave Rings on Collision */}
      {clashStage === 'colliding' && (
        <>
          <motion.div
            initial={{ scale: 0.3, opacity: 0.9 }}
            animate={{ scale: 2.8, opacity: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="absolute rounded-full border-2"
            style={{
              width: 80,
              height: 80,
              borderColor: co2Dominates ? '#f43f5e' : '#4ade80'
            }}
          />
          <motion.div
            initial={{ scale: 0.1, opacity: 1 }}
            animate={{ scale: 3.5, opacity: 0 }}
            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
            className="absolute rounded-full border"
            style={{
              width: 90,
              height: 90,
              borderColor: '#38bdf8'
            }}
          />
        </>
      )}

      {/* Spark particles bursting out */}
      {clashStage === 'colliding' && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
            <motion.div
              key={deg}
              initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
              animate={{
                x: Math.cos((deg * Math.PI) / 180) * 85,
                y: Math.sin((deg * Math.PI) / 180) * 85,
                opacity: 0,
                scale: 0.2
              }}
              transition={{ duration: 0.65, ease: 'easeOut', delay: i * 0.01 }}
              className="absolute w-2 h-2 rounded-full"
              style={{
                background: i % 2 === 0 ? '#4ade80' : '#f43f5e',
                boxShadow: '0 0 8px currentColor'
              }}
            />
          ))}
        </div>
      )}

      {/* OXYGEN FIGHTER (Approaches from LEFT, battles in center, settles on left card) */}
      <motion.div
        className="absolute z-30"
        initial={{ x: -140, y: 0, scale: 0.85, opacity: 0 }}
        animate={
          clashStage === 'charging'
            ? { x: -45, y: -4, scale: 1.05, opacity: 1, rotate: 12 }
            : clashStage === 'colliding'
            ? {
                x: co2Dominates ? -18 : 6,
                y: [0, -8, 6, 0],
                scale: co2Dominates ? 0.92 : 1.35,
                opacity: 1,
                rotate: co2Dominates ? -15 : 25
              }
            : clashStage === 'winner_surge'
            ? {
                x: co2Dominates ? -55 : 12,
                y: co2Dominates ? 10 : -12,
                scale: co2Dominates ? 0.85 : 1.45,
                opacity: 1,
                rotate: co2Dominates ? -20 : 0
              }
            : {
                // Docking position above left card
                x: -95,
                y: 54,
                scale: 1,
                opacity: 1,
                rotate: 0
              }
        }
        transition={{
          duration: clashStage === 'docking' ? 0.75 : 0.45,
          ease: clashStage === 'docking' ? 'backOut' : 'easeInOut'
        }}
      >
        <O2VisualMolecule size={clashStage === 'winner_surge' && !co2Dominates ? 'large' : 'normal'} glow />
      </motion.div>

      {/* CO2 FIGHTER (Approaches from RIGHT, battles in center, settles on right card) */}
      <motion.div
        className="absolute z-30"
        initial={{ x: 140, y: 0, scale: 0.85, opacity: 0 }}
        animate={
          clashStage === 'charging'
            ? { x: 45, y: 4, scale: 1.05, opacity: 1, rotate: -12 }
            : clashStage === 'colliding'
            ? {
                x: co2Dominates ? -6 : 18,
                y: [0, 8, -6, 0],
                scale: co2Dominates ? 1.35 : 0.92,
                opacity: 1,
                rotate: co2Dominates ? 25 : -15
              }
            : clashStage === 'winner_surge'
            ? {
                x: co2Dominates ? -12 : 55,
                y: co2Dominates ? -12 : 10,
                scale: co2Dominates ? 1.45 : 0.85,
                opacity: 1,
                rotate: co2Dominates ? 0 : 20
              }
            : {
                // Docking position above right card
                x: 95,
                y: 54,
                scale: 1,
                opacity: 1,
                rotate: 0
              }
        }
        transition={{
          duration: clashStage === 'docking' ? 0.75 : 0.45,
          ease: clashStage === 'docking' ? 'backOut' : 'easeInOut'
        }}
      >
        <CO2VisualMolecule size={clashStage === 'winner_surge' && co2Dominates ? 'large' : 'normal'} glow />
      </motion.div>

      {/* Live Clash Status Banner in Center */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute -top-7 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.22em] backdrop-blur-md border shadow-lg flex items-center gap-1.5"
        style={{
          background: 'rgba(5, 20, 12, 0.82)',
          borderColor:
            clashStage === 'winner_surge'
              ? co2Dominates
                ? 'rgba(244,63,94,0.6)'
                : 'rgba(74,222,128,0.6)'
              : 'rgba(100,230,140,0.3)',
          color:
            clashStage === 'winner_surge'
              ? co2Dominates
                ? '#fda4af'
                : '#86efac'
              : '#bbf7d0'
        }}
      >
        {clashStage === 'charging' && <span>⚡ Molecular Encounter...</span>}
        {clashStage === 'colliding' && <span>⚔️ Photosynthetic Conversion Clash!</span>}
        {clashStage === 'winner_surge' && (
          <span>
            {isEqual
              ? '⚖️ Perfect Eco-Equilibrium!'
              : co2Dominates
              ? '🔥 Carbon Sequestration Engine Dominates!'
              : '🌿 High-Capacity Oxygen Yield Dominates!'}
          </span>
        )}
        {clashStage === 'docking' && <span>✨ Daily Ecological Telemetry Loaded</span>}
      </motion.div>
    </div>
  )
}

// ============================================================================
// STAT CARD WITH DOCKED MOLECULE & LIVE COUNT-UP
// ============================================================================
function TelemetryStatCard({ type = 'o2', value, delay = 0, isDominant = false }) {
  const isCo2 = type === 'co2'
  const accent = isCo2 ? '#91caff' : '#8df09a'
  const borderGlow = isCo2 ? 'rgba(56,189,248,0.45)' : 'rgba(74,222,128,0.45)'
  const cardBg = isCo2
    ? 'linear-gradient(155deg, rgba(14,48,74,0.85) 0%, rgba(6,22,36,0.88) 100%)'
    : 'linear-gradient(155deg, rgba(16,64,32,0.85) 0%, rgba(7,30,17,0.88) 100%)'

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -4, scale: 1.02 }}
      className="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden rounded-[24px] px-3.5 py-4 text-center select-none"
      style={{
        background: cardBg,
        border: `1.5px solid ${borderGlow}`,
        boxShadow: `0 14px 40px ${isCo2 ? 'rgba(14,116,144,0.2)' : 'rgba(22,101,52,0.22)'}, inset 0 1px 1px rgba(255,255,255,0.12)`,
        backdropFilter: 'blur(16px)'
      }}
    >
      {/* Dominance Badge */}
      {isDominant && (
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: delay + 0.3 }}
          className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider"
          style={{
            background: isCo2 ? 'rgba(244,63,94,0.25)' : 'rgba(74,222,128,0.25)',
            border: `1px solid ${isCo2 ? 'rgba(251,113,133,0.5)' : 'rgba(134,239,172,0.5)'}`,
            color: isCo2 ? '#fecdd3' : '#bbf7d0'
          }}
        >
          {isCo2 ? '★ High Sink' : '★ Super Producer'}
        </motion.div>
      )}

      {/* Shimmer Light Sweeping Across Card */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg]"
        animate={{ x: ['0%', '520%'] }}
        transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut', delay }}
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)' }}
      />

      {/* Placeholder for docked molecule */}
      <div className="h-10 w-full flex items-center justify-center mb-1">
        {isCo2 ? <CO2VisualMolecule size="normal" glow={false} /> : <O2VisualMolecule size="normal" glow={false} />}
      </div>

      {/* Chemical Formula */}
      <p className="text-2xl font-black tracking-widest leading-none" style={{ color: accent }}>
        {isCo2 ? 'CO₂' : 'O₂'}
      </p>

      {/* Value */}
      <p className="mt-2 text-xl font-extrabold text-white tracking-tight">
        {value !== undefined && value !== null && value !== '' ? value : '—'}
      </p>

      {/* Unit */}
      <p className="text-[11px] font-semibold text-white/55 uppercase tracking-wider">kg / day</p>

      {/* Description */}
      <div
        className="mt-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
        style={{
          background: isCo2 ? 'rgba(56,189,248,0.15)' : 'rgba(74,222,128,0.15)',
          color: accent
        }}
      >
        {isCo2 ? 'CO₂ Absorbed' : 'Oxygen Produced'}
      </div>
    </motion.div>
  )
}

// ============================================================================
// MAIN QR SCAN ANIMATION COMPONENT
// ============================================================================
export default function QRScanAnimation({ tree, onDone }) {
  const [phase, setPhase] = useState(0) // 0: init scan -> 1: clash duel -> 2: reveal cards -> 3: complete / exit
  const [clashFinished, setClashFinished] = useState(false)

  // Safe numerical parsing for duel comparison
  const { o2Num, co2Num, co2Dominates, o2Dominates } = useMemo(() => {
    const o2Raw = parseFloat(String(tree?.o2_produced_daily || '0').replace(/[^0-9.]/g, '')) || 0
    const co2Raw = parseFloat(String(tree?.co2_absorbed_daily || '0').replace(/[^0-9.]/g, '')) || 0
    return {
      o2Num: o2Raw,
      co2Num: co2Raw,
      co2Dominates: co2Raw > o2Raw,
      o2Dominates: o2Raw > co2Raw
    }
  }, [tree])

  // Sequence orchestration
  useEffect(() => {
    // Phase 1: Start molecule duel after radar intro (500ms)
    const t1 = setTimeout(() => setPhase(1), 500)
    return () => clearTimeout(t1)
  }, [])

  const handleClashComplete = () => {
    setClashFinished(true)
    setPhase(2) // Reveal the stat cards smoothly
  }

  const handleExit = () => {
    setPhase(3)
    onDone?.()
  }

  return (
    <AnimatePresence>
      {phase < 3 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.45 }}
          className="fixed inset-0 z-[999] flex min-h-[100svh] flex-col items-center justify-between overflow-x-hidden overflow-y-auto px-4 py-6 sm:py-8"
          style={{
            background: 'radial-gradient(ellipse at 50% 50%, #082813 0%, #031409 50%, #010804 100%)'
          }}
        >
          {/* Canvas Living Tree & Particle Spores Background */}
          <ParticleTreeBackground />

          {/* Top Bar: Live Scanner Status & Instant Skip Button */}
          <header className="relative z-30 w-full max-w-2xl flex items-center justify-between px-2 pt-1">
            <div className="flex items-center gap-2 rounded-full border border-green-300/20 bg-green-950/60 px-3.5 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
              </span>
              <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-green-200">
                Green Atlas · Live Plant Telemetry
              </span>
            </div>

            {/* User-requested instant "Skip" button */}
            <motion.button
              type="button"
              onClick={handleExit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-md transition-colors hover:bg-white/20"
            >
              <span>Skip</span>
              <span className="text-white/60">✕</span>
            </motion.button>
          </header>

          {/* Holographic Radar Rings in Background */}
          <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
            <motion.div
              className="absolute left-1/2 top-[48%] h-[min(70vw,400px)] w-[min(70vw,400px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-400/10"
              animate={{ scale: [0.88, 1.1, 0.88], opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute left-1/2 top-[48%] h-[min(52vw,300px)] w-[min(52vw,300px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-300/10"
              animate={{ scale: [1.08, 0.92, 1.08], opacity: [0.15, 0.4, 0.15] }}
              transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />
          </div>

          {/* Middle Content Stack: Tree Identity & Molecule Clash */}
          <main className="relative z-20 flex w-full max-w-lg flex-col items-center gap-4 my-auto py-2">
            {/* Tree Branding Header */}
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="w-full text-center"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-green-300/90">
                You are looking at
              </p>
              <h1
                className="mt-1 text-3xl font-black text-white sm:text-4xl tracking-tight"
                style={{
                  fontFamily: 'Fraunces, Georgia, serif',
                  textShadow: '0 4px 28px rgba(74,255,125,0.28)'
                }}
              >
                {tree?.common_name || 'Living Specimen'}
              </h1>
              <p className="mt-1 text-sm italic text-green-200/80 sm:text-base font-light">
                {tree?.botanical_name || 'Flora Species'}
              </p>
            </motion.div>

            {/* Molecule Fight Arena: CO2 vs O2 Duel */}
            <div className="w-full flex justify-center py-1">
              <MolecularClashArena
                o2Value={o2Num}
                co2Value={co2Num}
                onClashComplete={handleClashComplete}
              />
            </div>

            {/* Telemetry Stat Cards: Reveal after/during clash */}
            <div className="w-full grid grid-cols-2 gap-3 sm:gap-4 mt-1">
              <TelemetryStatCard
                type="o2"
                value={tree?.o2_produced_daily}
                delay={phase >= 2 ? 0.05 : 0.8}
                isDominant={o2Dominates}
              />
              <TelemetryStatCard
                type="co2"
                value={tree?.co2_absorbed_daily}
                delay={phase >= 2 ? 0.15 : 0.95}
                isDominant={co2Dominates}
              />
            </div>

            {/* Environmental Synthesis Insight */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="text-center max-w-sm px-2"
            >
              <p className="text-xs leading-relaxed text-green-100/60">
                {co2Dominates
                  ? 'Active Carbon Sink: This tree actively filters heavy urban carbon, scrubbing the atmosphere daily.'
                  : 'Vitality Generator: High rate of photosynthetic oxygen production, sustaining fresh campus airflow.'}
              </p>
            </motion.div>
          </main>

          {/* Footer Controls: Explore Button & Campus Attribution */}
          <footer className="relative z-30 flex flex-col items-center gap-3.5 pb-2 pt-2">
            <motion.button
              type="button"
              onClick={handleExit}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="group flex items-center gap-3 rounded-full border border-green-200/40 px-9 py-3.5 text-sm font-bold text-white shadow-[0_10px_35px_rgba(34,197,94,0.3)] transition-all"
              style={{
                background: 'linear-gradient(135deg, #15803d 0%, #22c55e 100%)'
              }}
            >
              <span>Explore this Tree</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
                className="text-base"
              >
                →
              </motion.span>
            </motion.button>

            <p className="text-[11px] font-medium tracking-wide text-white/40">
              🌿 Green Atlas · Sona College of Technology
            </p>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
