import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================================
// CINEMATIC LIVING ECOSYSTEM BACKGROUND (Canvas 2D)
// ============================================================================
function AmbientForestBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0, raf = 0
    let particles = []
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const rand = (min, max) => min + Math.random() * (max - min)

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles = Array.from({ length: Math.min(75, Math.max(32, Math.floor((w * h) / 16000))) }, () => ({
        x: rand(0, w),
        y: rand(0, h),
        vx: rand(-0.25, 0.25),
        vy: rand(-0.35, -0.05),
        r: rand(0.9, 2.4),
        color: Math.random() > 0.4 ? 'rgba(74, 255, 140, ' : 'rgba(56, 189, 248, ',
        baseAlpha: rand(0.18, 0.65),
        phase: rand(0, Math.PI * 2)
      }))
    }

    function render(time) {
      ctx.clearRect(0, 0, w, h)

      const bgGrad = ctx.createRadialGradient(w * 0.5, h * 0.45, 20, w * 0.5, h * 0.45, Math.max(w, h) * 0.75)
      bgGrad.addColorStop(0, 'rgba(6, 38, 20, 0.55)')
      bgGrad.addColorStop(0.45, 'rgba(3, 20, 10, 0.78)')
      bgGrad.addColorStop(1, 'rgba(1, 8, 4, 0.98)')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      particles.forEach((p, i) => {
        if (!reduced) {
          p.x += p.vx
          p.y += p.vy
          if (p.x < 0) p.x = w
          if (p.x > w) p.x = 0
          if (p.y < 0) p.y = h
          if (p.y > h) p.y = 0
        }

        const pulse = reduced ? 1 : 0.7 + Math.sin(time * 0.002 + p.phase) * 0.3
        const alpha = p.baseAlpha * pulse

        ctx.beginPath()
        ctx.fillStyle = `${p.color}${alpha})`
        ctx.shadowColor = p.color.includes('74') ? '#34d399' : '#38bdf8'
        ctx.shadowBlur = 6
        ctx.arc(p.x, p.y, p.r * pulse, 0, Math.PI * 2)
        ctx.fill()

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j]
          const dist = Math.hypot(p.x - q.x, p.y - q.y)
          if (dist < 85) {
            ctx.strokeStyle = `rgba(52, 211, 153, ${(1 - dist / 85) * 0.1})`
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(q.x, q.y)
            ctx.stroke()
          }
        }
      })
      ctx.shadowBlur = 0

      raf = requestAnimationFrame(render)
    }

    resize()
    raf = requestAnimationFrame(render)
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full pointer-events-none z-0" />
}

// ============================================================================
// MINI MOLECULES (Scattered floating around the boxes)
// ============================================================================
function MiniO2({ className = '', style = {} }) {
  return (
    <motion.div
      className={`pointer-events-none absolute flex items-center select-none ${className}`}
      style={style}
      animate={{
        y: [0, -7, 0],
        rotate: [-7, 7, -7],
        scale: [0.95, 1.06, 0.95]
      }}
      transition={{
        duration: 3.2 + Math.random(),
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
      <div className="mx-0.5 h-[1.5px] w-1.5 bg-emerald-200/90 shadow-[0_0_4px_#34d399]" />
      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
    </motion.div>
  )
}

function MiniCO2({ className = '', style = {} }) {
  return (
    <motion.div
      className={`pointer-events-none absolute flex items-center select-none ${className}`}
      style={style}
      animate={{
        y: [0, 7, 0],
        rotate: [7, -7, 7],
        scale: [0.95, 1.06, 0.95]
      }}
      transition={{
        duration: 3.4 + Math.random(),
        repeat: Infinity,
        ease: 'easeInOut'
      }}
    >
      <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
      <div className="mx-0.5 h-[1px] w-1 bg-sky-200" />
      <div className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_10px_#f43f5e]" />
      <div className="mx-0.5 h-[1px] w-1 bg-sky-200" />
      <div className="h-2 w-2 rounded-full bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
    </motion.div>
  )
}

// ============================================================================
// DETAILED 3D-FEEL MOLECULE MODELS (HERO ATOMS)
// ============================================================================
export function O2MoleculeModel({ scale = 1, glow = true }) {
  const atomSize = 22 * scale
  const bondWidth = 11 * scale

  return (
    <div className="relative flex items-center justify-center select-none" style={{ height: 40 * scale }}>
      {glow && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 75 * scale,
            height: 48 * scale,
            background: 'radial-gradient(ellipse, rgba(52,211,153,0.5) 0%, transparent 72%)',
            filter: 'blur(7px)'
          }}
        />
      )}

      {/* Left Oxygen Atom */}
      <motion.div
        animate={{ y: [0, -1.8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: atomSize,
          height: atomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #bbf7d0 22%, #22c55e 55%, #14532d 95%)',
          boxShadow: '0 0 16px rgba(34,197,94,0.7), inset -3px -3px 5px rgba(5,46,22,0.6)',
          border: '1px solid rgba(220,252,231,0.85)'
        }}
      />

      {/* Double Covalent Bond (O = O) */}
      <div className="flex flex-col gap-1 mx-0.5 z-10">
        <div style={{ width: bondWidth, height: 2.5 * scale, borderRadius: 2, background: 'linear-gradient(90deg, #86efac, #22c55e)', boxShadow: '0 0 5px #22c55e' }} />
        <div style={{ width: bondWidth, height: 2.5 * scale, borderRadius: 2, background: 'linear-gradient(90deg, #86efac, #22c55e)', boxShadow: '0 0 5px #22c55e' }} />
      </div>

      {/* Right Oxygen Atom */}
      <motion.div
        animate={{ y: [0, 1.8, 0] }}
        transition={{ duration: 2, delay: 0.15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: atomSize,
          height: atomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #bbf7d0 22%, #22c55e 55%, #14532d 95%)',
          boxShadow: '0 0 16px rgba(34,197,94,0.7), inset -3px -3px 5px rgba(5,46,22,0.6)',
          border: '1px solid rgba(220,252,231,0.85)'
        }}
      />
    </div>
  )
}

export function CO2MoleculeModel({ scale = 1, glow = true }) {
  const oAtomSize = 17 * scale
  const cAtomSize = 25 * scale
  const bondWidth = 9 * scale

  return (
    <div className="relative flex items-center justify-center select-none" style={{ height: 40 * scale }}>
      {glow && (
        <motion.div
          animate={{ scale: [1, 1.25, 1], opacity: [0.4, 0.75, 0.4] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 85 * scale,
            height: 48 * scale,
            background: 'radial-gradient(ellipse, rgba(56,189,248,0.4) 0%, rgba(244,63,94,0.3) 50%, transparent 75%)',
            filter: 'blur(7px)'
          }}
        />
      )}

      {/* Left Oxygen Atom */}
      <motion.div
        animate={{ y: [0, 1.8, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: oAtomSize,
          height: oAtomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #bae6fd 22%, #0284c7 60%, #082f49 95%)',
          boxShadow: '0 0 14px rgba(2,132,199,0.7), inset -2px -2px 4px rgba(8,47,73,0.6)',
          border: '1px solid rgba(224,242,254,0.85)'
        }}
      />

      {/* Double Bond Left */}
      <div className="flex flex-col gap-1 mx-0.5 z-10">
        <div style={{ width: bondWidth, height: 2 * scale, borderRadius: 2, background: 'linear-gradient(90deg, #38bdf8, #fb7185)' }} />
        <div style={{ width: bondWidth, height: 2 * scale, borderRadius: 2, background: 'linear-gradient(90deg, #38bdf8, #fb7185)' }} />
      </div>

      {/* Center Carbon Atom */}
      <motion.div
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: cAtomSize,
          height: cAtomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #fff1f2 0%, #fecdd3 20%, #e11d48 55%, #4c0519 95%)',
          boxShadow: '0 0 18px rgba(225,29,72,0.8), inset -3px -3px 5px rgba(76,5,25,0.7)',
          border: '1px solid rgba(255,228,230,0.9)'
        }}
      />

      {/* Double Bond Right */}
      <div className="flex flex-col gap-1 mx-0.5 z-10">
        <div style={{ width: bondWidth, height: 2 * scale, borderRadius: 2, background: 'linear-gradient(90deg, #fb7185, #38bdf8)' }} />
        <div style={{ width: bondWidth, height: 2 * scale, borderRadius: 2, background: 'linear-gradient(90deg, #fb7185, #38bdf8)' }} />
      </div>

      {/* Right Oxygen Atom */}
      <motion.div
        animate={{ y: [0, -1.8, 0] }}
        transition={{ duration: 2.2, delay: 0.15, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          width: oAtomSize,
          height: oAtomSize,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 25%, #ffffff 0%, #bae6fd 22%, #0284c7 60%, #082f49 95%)',
          boxShadow: '0 0 14px rgba(2,132,199,0.7), inset -2px -2px 4px rgba(8,47,73,0.6)',
          border: '1px solid rgba(224,242,254,0.85)'
        }}
      />
    </div>
  )
}

// ============================================================================
// MAIN COMPONENT: QRScanAnimation (Active Floating Boxes & Fluid Motion)
// ============================================================================
export default function QRScanAnimation({ tree, onDone }) {
  // Stages: 'charging' -> 'clashing' -> 'winner_surge' -> 'docked'
  const [stage, setStage] = useState('charging')
  const hasTriggeredRef = useRef(false)

  // Parse telemetry values cleanly
  const { o2Raw, co2Raw, o2Display, co2Display, co2Dominates, o2Dominates, isEqual } = useMemo(() => {
    const o2 = parseFloat(String(tree?.o2_produced_daily || '0').replace(/[^0-9.]/g, '')) || 0
    const co2 = parseFloat(String(tree?.co2_absorbed_daily || '0').replace(/[^0-9.]/g, '')) || 0
    return {
      o2Raw: o2,
      co2Raw: co2,
      o2Display: tree?.o2_produced_daily || (o2 > 0 ? `~${o2} kg/day` : '—'),
      co2Display: tree?.co2_absorbed_daily || (co2 > 0 ? `~${co2} kg/day` : '—'),
      co2Dominates: co2 > o2,
      o2Dominates: o2 > co2,
      isEqual: Math.abs(co2 - o2) < 0.001
    }
  }, [tree])

  // Single deterministic duel sequence
  useEffect(() => {
    if (hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    const t1 = setTimeout(() => setStage('clashing'), 600)
    const t2 = setTimeout(() => setStage('winner_surge'), 1450)
    // Docking starts at 2.45s: molecules glide directly into top of cards!
    const t3 = setTimeout(() => setStage('docked'), 2450)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  const handleExit = () => {
    onDone?.()
  }

  const isDocked = stage === 'docked'

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.35 }}
        className="fixed inset-0 z-[999] flex h-[100dvh] w-full flex-col justify-between overflow-hidden px-4 py-4 sm:px-6 sm:py-6"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, #062312 0%, #031309 55%, #010804 100%)'
        }}
      >
        {/* Background Ambient Particles & Spores */}
        <AmbientForestBackground />

        {/* TOP BAR: Live Indicator & Instant Skip Button */}
        <header className="relative z-30 mx-auto flex w-full max-w-xl items-center justify-between">
          <div className="flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-950/70 px-3.5 py-1 backdrop-blur-md shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-200">
              Green Atlas · Live Plant Telemetry
            </span>
          </div>

          <motion.button
            type="button"
            onClick={handleExit}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 shadow-sm"
          >
            <span>Skip</span>
            <span className="text-white/60 text-xs">✕</span>
          </motion.button>
        </header>

        {/* CENTER CORE: Tree Header, Unified Clash & Docking Arena */}
        <main className="relative z-20 mx-auto my-auto flex w-full max-w-md flex-col items-center gap-2 text-center">
          {/* Tree Name & Identity */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-emerald-300/85">
              You are looking at
            </p>
            <h1
              className="mt-0.5 text-2xl font-black text-white sm:text-3xl tracking-tight leading-snug"
              style={{
                fontFamily: 'Fraunces, Georgia, serif',
                textShadow: '0 3px 20px rgba(52,211,153,0.3)'
              }}
            >
              {tree?.common_name || 'Green Atlas Specimen'}
            </h1>
            <p className="text-xs italic text-emerald-200/75 font-light">
              {tree?.botanical_name || 'Botanical Flora'}
            </p>
          </motion.div>

          {/* Duel Status / HUD Banner */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-full border border-white/20 bg-black/75 px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md"
            style={{
              color: stage === 'winner_surge'
                ? (co2Dominates ? '#fecdd3' : '#a7f3d0')
                : stage === 'docked'
                ? '#a7f3d0'
                : '#e2e8f0',
              borderColor: stage === 'winner_surge'
                ? (co2Dominates ? 'rgba(244,63,94,0.5)' : 'rgba(52,211,153,0.5)')
                : 'rgba(52,211,153,0.3)'
            }}
          >
            {stage === 'charging' && <span>⚡ Analyzing Gas Exchange...</span>}
            {stage === 'clashing' && <span>⚔️ Photosynthetic Clash!</span>}
            {stage === 'winner_surge' && (
              <span>
                {isEqual
                  ? '⚖️ Equal Gas Equilibrium'
                  : co2Dominates
                  ? '🔥 Carbon Sequestration Dominates'
                  : '🌿 High-Oxygen Engine Dominates'}
              </span>
            )}
            {stage === 'docked' && <span>✨ Daily Ecological Telemetry Loaded</span>}
          </motion.div>

          {/* UNIFIED ARENA: Cards with Active Floating Motion */}
          <div className="relative w-full mt-2">
            {/* Impact Flash & Shockwaves */}
            {(stage === 'clashing' || stage === 'winner_surge') && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                <motion.div
                  initial={{ scale: 0.2, opacity: 0 }}
                  animate={{
                    scale: stage === 'winner_surge' ? [1.2, 1.7, 1.1] : [0.4, 1.4, 0.9],
                    opacity: [0.95, 0.7, 0.2]
                  }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                  className="rounded-full blur-lg"
                  style={{
                    width: 120,
                    height: 120,
                    background: co2Dominates
                      ? 'radial-gradient(circle, rgba(244,63,94,0.85) 0%, rgba(56,189,248,0.3) 50%, transparent 75%)'
                      : 'radial-gradient(circle, rgba(74,222,128,0.9) 0%, rgba(56,189,248,0.3) 50%, transparent 75%)'
                  }}
                />
                {stage === 'clashing' && (
                  <motion.div
                    initial={{ scale: 0.3, opacity: 1 }}
                    animate={{ scale: 2.6, opacity: 0 }}
                    transition={{ duration: 0.75, ease: 'easeOut' }}
                    className="absolute rounded-full border-2"
                    style={{
                      width: 70,
                      height: 70,
                      borderColor: co2Dominates ? '#f43f5e' : '#34d399'
                    }}
                  />
                )}
              </div>
            )}

            {/* Scattered Mini O2 Molecules near Left Box */}
            <MiniO2 className="-left-4 -top-3" />
            <MiniO2 className="-left-2 bottom-3" />
            <MiniO2 className="left-1/4 -top-4 opacity-80" />

            {/* Scattered Mini CO2 Molecules near Right Box */}
            <MiniCO2 className="-right-4 -top-3" />
            <MiniCO2 className="-right-2 bottom-3" />
            <MiniCO2 className="right-1/4 -top-4 opacity-80" />

            {/* THE TWO STAT CARDS (With Active Floating / Levitation Movements) */}
            <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
              {/* LEFT O2 CARD - Active Floating Motion */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={
                  isDocked
                    ? {
                        opacity: 1,
                        y: [0, -5, 0], // Active gentle levitation float
                        rotate: [-0.6, 0.6, -0.6] // Subtle anti-gravity tilt
                      }
                    : { opacity: 1, y: 0 }
                }
                transition={
                  isDocked
                    ? {
                        y: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' },
                        opacity: { duration: 0.5 }
                      }
                    : { duration: 0.6, delay: 0.2 }
                }
                whileHover={{ y: -6, scale: 1.025 }}
                className="relative flex flex-col items-center justify-between rounded-[22px] p-3.5 pt-1 text-center overflow-hidden border backdrop-blur-md cursor-pointer select-none"
                style={{
                  background: 'linear-gradient(155deg, rgba(16,64,32,0.88), rgba(7,30,17,0.92))',
                  borderColor: 'rgba(52,211,153,0.45)',
                  boxShadow: '0 12px 32px rgba(16,64,32,0.35)',
                  minHeight: 185
                }}
              >
                {o2Dominates && (
                  <span className="absolute top-2 right-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-emerald-200">
                    ★ High Yield
                  </span>
                )}

                {/* Docking Target Slot for O2 */}
                <div className="h-12 w-full flex items-center justify-center">
                  {isDocked && (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <O2MoleculeModel scale={0.78} glow />
                    </motion.div>
                  )}
                </div>

                <p className="text-xl font-black tracking-widest text-[#8df09a] mt-0.5">O₂</p>
                <p className="text-base sm:text-lg font-extrabold text-white leading-tight mt-0.5">
                  {o2Display}
                </p>
                <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">KG / DAY</p>

                <div className="mt-2 w-full rounded-full bg-emerald-500/15 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8df09a]">
                  Oxygen Produced
                </div>
              </motion.div>

              {/* RIGHT CO2 CARD - Active Floating Motion (Counter-phase) */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={
                  isDocked
                    ? {
                        opacity: 1,
                        y: [0, 5, 0], // Active counter levitation float
                        rotate: [0.6, -0.6, 0.6] // Subtle complementary tilt
                      }
                    : { opacity: 1, y: 0 }
                }
                transition={
                  isDocked
                    ? {
                        y: { duration: 4.2, repeat: Infinity, ease: 'easeInOut' },
                        rotate: { duration: 4.8, repeat: Infinity, ease: 'easeInOut' },
                        opacity: { duration: 0.5 }
                      }
                    : { duration: 0.6, delay: 0.25 }
                }
                whileHover={{ y: -6, scale: 1.025 }}
                className="relative flex flex-col items-center justify-between rounded-[22px] p-3.5 pt-1 text-center overflow-hidden border backdrop-blur-md cursor-pointer select-none"
                style={{
                  background: 'linear-gradient(155deg, rgba(14,48,74,0.88), rgba(6,22,36,0.92))',
                  borderColor: 'rgba(56,189,248,0.45)',
                  boxShadow: '0 12px 32px rgba(14,48,74,0.35)',
                  minHeight: 185
                }}
              >
                {co2Dominates && (
                  <span className="absolute top-2 right-2 rounded-full border border-rose-400/50 bg-rose-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-rose-200">
                    ★ High Sink
                  </span>
                )}

                {/* Docking Target Slot for CO2 */}
                <div className="h-12 w-full flex items-center justify-center">
                  {isDocked && (
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.4 }}
                    >
                      <CO2MoleculeModel scale={0.78} glow />
                    </motion.div>
                  )}
                </div>

                <p className="text-xl font-black tracking-widest text-[#91caff] mt-0.5">CO₂</p>
                <p className="text-base sm:text-lg font-extrabold text-white leading-tight mt-0.5">
                  {co2Display}
                </p>
                <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">KG / DAY</p>

                <div className="mt-2 w-full rounded-full bg-sky-500/15 py-1 text-[9px] font-bold uppercase tracking-wider text-[#91caff]">
                  CO₂ Absorbed
                </div>
              </motion.div>
            </div>

            {/* THE TWO HERO FIGHTERS (Animated smoothly across duel & dock) */}
            {!isDocked && (
              <div className="absolute inset-0 pointer-events-none z-30">
                {/* O2 FIGHTER (Left) */}
                <motion.div
                  className="absolute"
                  style={{ top: 20, left: '50%' }}
                  initial={{ x: -140, y: -45, opacity: 0 }}
                  animate={
                    stage === 'charging'
                      ? { x: -45, y: -45, opacity: 1, scale: 1, rotate: 10 }
                      : stage === 'clashing'
                      ? {
                          x: co2Dominates ? -15 : 6,
                          y: -45,
                          opacity: 1,
                          scale: co2Dominates ? 0.95 : 1.25,
                          rotate: co2Dominates ? -15 : 22
                        }
                      : {
                          // Winner surge
                          x: co2Dominates ? -50 : 10,
                          y: co2Dominates ? -38 : -52,
                          opacity: 1,
                          scale: co2Dominates ? 0.82 : 1.35,
                          rotate: co2Dominates ? -20 : 0
                        }
                  }
                  transition={{
                    duration: 0.45,
                    ease: 'easeInOut'
                  }}
                >
                  <div className="-translate-x-1/2 -translate-y-1/2">
                    <O2MoleculeModel scale={stage === 'winner_surge' && !co2Dominates ? 1.15 : 0.9} glow />
                  </div>
                </motion.div>

                {/* CO2 FIGHTER (Right) */}
                <motion.div
                  className="absolute"
                  style={{ top: 20, left: '50%' }}
                  initial={{ x: 140, y: -45, opacity: 0 }}
                  animate={
                    stage === 'charging'
                      ? { x: 45, y: -45, opacity: 1, scale: 1, rotate: -10 }
                      : stage === 'clashing'
                      ? {
                          x: co2Dominates ? -6 : 15,
                          y: -45,
                          opacity: 1,
                          scale: co2Dominates ? 1.25 : 0.95,
                          rotate: co2Dominates ? 22 : -15
                        }
                      : {
                          // Winner surge
                          x: co2Dominates ? -10 : 50,
                          y: co2Dominates ? -52 : -38,
                          opacity: 1,
                          scale: co2Dominates ? 1.35 : 0.82,
                          rotate: co2Dominates ? 0 : 20
                        }
                  }
                  transition={{
                    duration: 0.45,
                    ease: 'easeInOut'
                  }}
                >
                  <div className="-translate-x-1/2 -translate-y-1/2">
                    <CO2MoleculeModel scale={stage === 'winner_surge' && co2Dominates ? 1.15 : 0.9} glow />
                  </div>
                </motion.div>
              </div>
            )}
          </div>

          {/* Environmental Summary Insight */}
          <p className="text-[11px] leading-relaxed text-emerald-100/60 max-w-xs mt-1">
            {co2Dominates
              ? 'Active Carbon Sink: This tree actively filters heavy urban carbon, scrubbing the atmosphere daily.'
              : 'Vitality Generator: High rate of photosynthetic oxygen production, sustaining fresh campus airflow.'}
          </p>
        </main>

        {/* FOOTER: Fully Visible Explore Button & College Credit */}
        <footer className="relative z-30 mx-auto flex w-full max-w-sm flex-col items-center gap-2 pb-1">
          <motion.button
            type="button"
            onClick={handleExit}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex w-full items-center justify-center gap-2.5 rounded-full border border-emerald-300/40 py-3 text-sm font-bold text-white shadow-[0_8px_28px_rgba(16,185,129,0.32)] transition-all"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
            }}
          >
            <span>Explore this Tree</span>
            <span className="text-base">→</span>
          </motion.button>

          <p className="text-[10px] font-medium tracking-wide text-white/40">
            🌿 Green Atlas · Sona College of Technology
          </p>
        </footer>
      </motion.div>
    </AnimatePresence>
  )
}
