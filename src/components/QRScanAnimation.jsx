import { useEffect, useRef, useState, useMemo } from 'react'

export default function QRScanAnimation({ tree, onDone }) {
  const canvasRef = useRef(null)
  const [stage, setStage] = useState('initial') // 'initial' -> 'charging' -> 'clashing' -> 'winner_surge' -> 'docked'
  const hasTriggeredRef = useRef(false)

  // Parse values cleanly
  const { o2Display, co2Display, co2Dominates, o2Dominates } = useMemo(() => {
    const o2Raw = parseFloat(String(tree?.o2_produced_daily || '0').replace(/[^0-9.]/g, '')) || 0
    const co2Raw = parseFloat(String(tree?.co2_absorbed_daily || '0').replace(/[^0-9.]/g, '')) || 0
    return {
      o2Display: tree?.o2_produced_daily ? (String(tree.o2_produced_daily).includes('kg') ? tree.o2_produced_daily : `~${tree.o2_produced_daily} kg/day`) : (o2Raw > 0 ? `~${o2Raw} kg/day` : '—'),
      co2Display: tree?.co2_absorbed_daily ? (String(tree.co2_absorbed_daily).includes('kg') ? tree.co2_absorbed_daily : `~${tree.co2_absorbed_daily} kg/day`) : (co2Raw > 0 ? `~${co2Raw} kg/day` : '—'),
      co2Dominates: co2Raw > o2Raw,
      o2Dominates: o2Raw > co2Raw
    }
  }, [tree])

  // Canvas Ambient Background
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = 0, h = 0, raf = 0
    let particles = []
    const rand = (min, max) => min + Math.random() * (max - min)

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr
      canvas.height = h * dpr
      canvas.style.width = w + 'px'
      canvas.style.height = h + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      particles = Array.from({ length: Math.min(75, Math.max(30, Math.floor((w * h) / 16000))) }, () => ({
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
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h

        const pulse = 0.7 + Math.sin(time * 0.002 + p.phase) * 0.3
        ctx.beginPath()
        ctx.fillStyle = `${p.color}${p.baseAlpha * pulse})`
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

    window.addEventListener('resize', resize)
    resize()
    raf = requestAnimationFrame(render)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  // Exact Single Duel Sequence
  useEffect(() => {
    if (hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    // Step 1: Charge toward center
    const t1 = setTimeout(() => setStage('charging'), 350)
    // Step 2: Clash impact burst
    const t2 = setTimeout(() => setStage('clashing'), 900)
    // Step 3: Winner surge
    const t3 = setTimeout(() => setStage('winner_surge'), 1450)
    // Step 4: Docking into cards
    const t4 = setTimeout(() => setStage('docked'), 2350)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      clearTimeout(t4)
    }
  }, [])

  const isDocked = stage === 'docked'

  // Dynamic Fighter Styles matching the preview
  const o2Style = useMemo(() => {
    if (stage === 'initial') {
      return {
        top: '15px',
        left: '18%',
        transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
        opacity: 1,
        transition: 'none'
      }
    }
    if (stage === 'charging') {
      return {
        top: '15px',
        left: '45%',
        transform: 'translate(-50%, -50%) scale(1.1) rotate(15deg)',
        opacity: 1,
        transition: 'all 0.55s cubic-bezier(0.2, 0.9, 0.3, 1)'
      }
    }
    if (stage === 'clashing') {
      return {
        top: '15px',
        left: '45%',
        transform: 'translate(-50%, -50%) scale(1.1) rotate(15deg)',
        opacity: 1,
        transition: 'all 0.2s ease-out'
      }
    }
    if (stage === 'winner_surge') {
      return {
        top: '15px',
        left: co2Dominates ? '38%' : '48%',
        transform: co2Dominates ? 'translate(-50%, -50%) scale(0.8) rotate(-20deg)' : 'translate(-50%, -50%) scale(1.35) rotate(0deg)',
        opacity: 1,
        transition: 'all 0.45s ease-out'
      }
    }
    // Docked
    return {
      top: '32px',
      left: '25%',
      transform: 'translate(-50%, -50%) scale(0.85) rotate(0deg)',
      opacity: 1,
      transition: 'all 0.85s cubic-bezier(0.16, 1, 0.3, 1)'
    }
  }, [stage, co2Dominates])

  const co2Style = useMemo(() => {
    if (stage === 'initial') {
      return {
        top: '15px',
        left: '82%',
        transform: 'translate(-50%, -50%) scale(1) rotate(0deg)',
        opacity: 1,
        transition: 'none'
      }
    }
    if (stage === 'charging') {
      return {
        top: '15px',
        left: '55%',
        transform: 'translate(-50%, -50%) scale(1.1) rotate(-15deg)',
        opacity: 1,
        transition: 'all 0.55s cubic-bezier(0.2, 0.9, 0.3, 1)'
      }
    }
    if (stage === 'clashing') {
      return {
        top: '15px',
        left: '55%',
        transform: 'translate(-50%, -50%) scale(1.1) rotate(-15deg)',
        opacity: 1,
        transition: 'all 0.2s ease-out'
      }
    }
    if (stage === 'winner_surge') {
      return {
        top: '15px',
        left: co2Dominates ? '52%' : '62%',
        transform: co2Dominates ? 'translate(-50%, -50%) scale(1.35) rotate(0deg)' : 'translate(-50%, -50%) scale(0.8) rotate(20deg)',
        opacity: 1,
        transition: 'all 0.45s ease-out'
      }
    }
    // Docked
    return {
      top: '32px',
      left: '75%',
      transform: 'translate(-50%, -50%) scale(0.85) rotate(0deg)',
      opacity: 1,
      transition: 'all 0.85s cubic-bezier(0.16, 1, 0.3, 1)'
    }
  }, [stage, co2Dominates])

  return (
    <div
      className="fixed inset-0 z-[999] flex h-[100dvh] w-full flex-col justify-between overflow-hidden p-4 sm:p-6 text-white select-none"
      style={{ background: 'radial-gradient(ellipse at 50% 50%, #062312 0%, #031309 55%, #010804 100%)' }}
    >
      {/* Styles identical to the preview */}
      <style>{`
        @keyframes floatGentle {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-7px) rotate(4deg); }
        }
        .float-anim {
          animation: floatGentle 3.5s infinite ease-in-out;
        }
        .float-anim-alt {
          animation: floatGentle 4.2s infinite ease-in-out reverse;
        }
        @keyframes boxLevitateO2 {
          0%, 100% { transform: translateY(0px) rotate(-0.5deg); }
          50% { transform: translateY(-5px) rotate(0.5deg); }
        }
        @keyframes boxLevitateCO2 {
          0%, 100% { transform: translateY(0px) rotate(0.5deg); }
          50% { transform: translateY(5px) rotate(-0.5deg); }
        }
        .active-card-o2 {
          animation: boxLevitateO2 4s infinite ease-in-out;
        }
        .active-card-co2 {
          animation: boxLevitateCO2 4.4s infinite ease-in-out;
        }
        .atom-o2 {
          background: radial-gradient(circle at 30% 25%, #ffffff 0%, #bbf7d0 22%, #22c55e 55%, #14532d 95%);
          box-shadow: 0 0 16px rgba(34,197,94,0.7), inset -3px -3px 5px rgba(5,46,22,0.6);
          border: 1px solid rgba(220,252,231,0.85);
        }
        .atom-co2-c {
          background: radial-gradient(circle at 30% 25%, #fff1f2 0%, #fecdd3 20%, #e11d48 55%, #4c0519 95%);
          box-shadow: 0 0 18px rgba(225,29,72,0.8), inset -3px -3px 5px rgba(76,5,25,0.7);
          border: 1px solid rgba(255,228,230,0.9);
        }
        .atom-co2-o {
          background: radial-gradient(circle at 30% 25%, #ffffff 0%, #bae6fd 22%, #0284c7 60%, #082f49 95%);
          box-shadow: 0 0 14px rgba(2,132,199,0.7), inset -2px -2px 4px rgba(8,47,73,0.6);
          border: 1px solid rgba(224,242,254,0.85);
        }
      `}</style>

      {/* Ambient Forest Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-0" />

      {/* ==============================================================
           TOP BAR: Live Indicator & Instant Skip
      ============================================================== */}
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

        <button
          type="button"
          onClick={onDone}
          className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-semibold text-white/90 backdrop-blur-md transition-all hover:bg-white/20 active:scale-95 shadow-sm"
        >
          <span>Skip</span>
          <span className="text-white/60 text-xs">✕</span>
        </button>
      </header>

      {/* ==============================================================
           CENTER CORE: Identity, Fight & Active Floating Cards
      ============================================================== */}
      <main className="relative z-20 mx-auto my-auto flex w-full max-w-md flex-col items-center gap-2 text-center">
        {/* Tree Identity Header */}
        <div className="w-full">
          <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-emerald-300/85">
            You are looking at
          </p>
          <h1
            className="mt-0.5 text-2xl font-black text-white sm:text-3xl tracking-tight leading-snug drop-shadow-[0_3px_20px_rgba(52,211,153,0.3)]"
            style={{ fontFamily: 'Fraunces, Georgia, serif' }}
          >
            {tree?.common_name || 'Indian Beech / Pungamaram'}
          </h1>
          <p className="text-xs italic text-emerald-200/75 font-light">
            {tree?.botanical_name || 'Millettia pinnata'}
          </p>
        </div>

        {/* Status HUD Banner */}
        <div
          className="rounded-full border border-white/20 bg-black/75 px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg backdrop-blur-md transition-all duration-300"
          style={{
            borderColor: stage === 'winner_surge'
              ? (co2Dominates ? 'rgba(244,63,94,0.5)' : 'rgba(52,211,153,0.5)')
              : 'rgba(52,211,153,0.3)',
            color: stage === 'winner_surge'
              ? (co2Dominates ? '#fecdd3' : '#a7f3d0')
              : '#a7f3d0'
          }}
        >
          {(stage === 'initial' || stage === 'charging') && '⚡ Analyzing Gas Exchange...'}
          {stage === 'clashing' && '⚔️ Photosynthetic Clash!'}
          {stage === 'winner_surge' && (co2Dominates ? '🔥 Carbon Sequestration Dominates' : '🌿 High-Oxygen Engine Dominates')}
          {stage === 'docked' && '✨ Daily Ecological Telemetry Loaded'}
        </div>

        {/* The Unified Stage Container */}
        <div className="relative w-full mt-2">
          {/* Shockwave Flash (bursts only upon clash) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <div
              className="rounded-full transition-all duration-500 blur-lg"
              style={{
                width: 120,
                height: 120,
                background: co2Dominates
                  ? 'radial-gradient(circle, rgba(244,63,94,0.85) 0%, rgba(56,189,248,0.3) 50%, transparent 75%)'
                  : 'radial-gradient(circle, rgba(74,222,128,0.9) 0%, rgba(56,189,248,0.3) 50%, transparent 75%)',
                transform: (stage === 'clashing' || stage === 'winner_surge') ? 'scale(1.4)' : 'scale(0)',
                opacity: (stage === 'clashing' || stage === 'winner_surge') ? 0.9 : 0
              }}
            />
            <div
              className="absolute rounded-full border-2 transition-all duration-700"
              style={{
                width: 70,
                height: 70,
                borderColor: co2Dominates ? '#f43f5e' : '#34d399',
                transform: stage === 'clashing' ? 'scale(2.5)' : 'scale(0)',
                opacity: stage === 'clashing' ? 0.8 : 0
              }}
            />
          </div>

          {/* Mini O2 Molecules floating near O2 box */}
          <div className="float-anim pointer-events-none absolute -left-4 -top-3 flex items-center opacity-90 z-20">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <div className="mx-0.5 h-[1.5px] w-1.5 bg-emerald-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>
          <div className="float-anim-alt pointer-events-none absolute -left-2 bottom-3 flex items-center opacity-75 z-20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <div className="mx-0.5 h-[1px] w-1 bg-emerald-200" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          </div>
          <div className="float-anim pointer-events-none absolute left-1/4 -top-3.5 flex items-center opacity-70 z-20">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
            <div className="mx-0.5 h-[1px] w-1 bg-emerald-200" />
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_5px_#34d399]" />
          </div>

          {/* Mini CO2 Molecules floating near CO2 box */}
          <div className="float-anim-alt pointer-events-none absolute -right-4 -top-3 flex items-center opacity-90 z-20">
            <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
            <div className="mx-0.5 h-[1px] w-1 bg-sky-200" />
            <div className="w-3 h-3 rounded-full bg-rose-500 shadow-[0_0_8px_#f43f5e]" />
            <div className="mx-0.5 h-[1px] w-1 bg-sky-200" />
            <div className="w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_6px_#38bdf8]" />
          </div>
          <div className="float-anim pointer-events-none absolute -right-2 bottom-3 flex items-center opacity-75 z-20">
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]" />
            <div className="mx-0.5 h-[1px] w-1 bg-sky-200" />
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]" />
            <div className="mx-0.5 h-[1px] w-1 bg-sky-200" />
            <div className="w-1.5 h-1.5 rounded-full bg-sky-400 shadow-[0_0_5px_#38bdf8]" />
          </div>

          {/* The Two Main Telemetry Cards (With Active Floating Motion once docked) */}
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
            {/* O2 CARD */}
            <div
              className={`relative flex flex-col items-center justify-between rounded-[22px] p-3.5 pt-1 text-center overflow-hidden border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                isDocked ? 'active-card-o2' : ''
              }`}
              style={{
                background: 'linear-gradient(155deg, rgba(16,64,32,0.88), rgba(7,30,17,0.92))',
                borderColor: 'rgba(52,211,153,0.45)',
                boxShadow: '0 12px 32px rgba(16,64,32,0.35)',
                minHeight: '185px'
              }}
            >
              {o2Dominates && (
                <div className="absolute top-2 right-2 rounded-full border border-emerald-400/50 bg-emerald-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-emerald-200">
                  ★ High Yield
                </div>
              )}

              {/* Empty slot where O2 molecule lands */}
              <div className="h-12 w-full flex items-center justify-center" />

              <p className="text-xl font-black tracking-widest text-[#8df09a] mt-0.5">O₂</p>
              <p className="text-base sm:text-lg font-extrabold text-white leading-tight mt-0.5">
                {o2Display}
              </p>
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">KG / DAY</p>

              <div className="mt-2 w-full rounded-full bg-emerald-500/15 py-1 text-[9px] font-bold uppercase tracking-wider text-[#8df09a]">
                Oxygen Produced
              </div>
            </div>

            {/* CO2 CARD */}
            <div
              className={`relative flex flex-col items-center justify-between rounded-[22px] p-3.5 pt-1 text-center overflow-hidden border backdrop-blur-md transition-all duration-300 hover:scale-[1.02] cursor-pointer ${
                isDocked ? 'active-card-co2' : ''
              }`}
              style={{
                background: 'linear-gradient(155deg, rgba(14,48,74,0.88), rgba(6,22,36,0.92))',
                borderColor: 'rgba(56,189,248,0.45)',
                boxShadow: '0 12px 32px rgba(14,48,74,0.35)',
                minHeight: '185px'
              }}
            >
              {co2Dominates && (
                <div className="absolute top-2 right-2 rounded-full border border-rose-400/50 bg-rose-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase text-rose-200">
                  ★ High Sink
                </div>
              )}

              {/* Empty slot where CO2 molecule lands */}
              <div className="h-12 w-full flex items-center justify-center" />

              <p className="text-xl font-black tracking-widest text-[#91caff] mt-0.5">CO₂</p>
              <p className="text-base sm:text-lg font-extrabold text-white leading-tight mt-0.5">
                {co2Display}
              </p>
              <p className="text-[9px] font-semibold text-white/50 uppercase tracking-wider">KG / DAY</p>

              <div className="mt-2 w-full rounded-full bg-sky-500/15 py-1 text-[9px] font-bold uppercase tracking-wider text-[#91caff]">
                CO₂ Absorbed
              </div>
            </div>
          </div>

          {/* THE TWO HERO FIGHTERS (Smoothly animate from Center Fight -> Directly into Card Slots!) */}
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* O2 Hero Fighter */}
            <div className="absolute select-none" style={o2Style}>
              <div className="flex items-center">
                <div className="w-4 h-4 rounded-full atom-o2" />
                <div className="flex flex-col gap-0.5 mx-0.5 z-10">
                  <div className="w-2 h-[2px] rounded-full bg-emerald-300 shadow-[0_0_5px_#22c55e]" />
                  <div className="w-2 h-[2px] rounded-full bg-emerald-300 shadow-[0_0_5px_#22c55e]" />
                </div>
                <div className="w-4 h-4 rounded-full atom-o2" />
              </div>
            </div>

            {/* CO2 Hero Fighter */}
            <div className="absolute select-none" style={co2Style}>
              <div className="flex items-center">
                <div className="w-3.5 h-3.5 rounded-full atom-co2-o" />
                <div className="flex flex-col gap-0.5 mx-0.5 z-10">
                  <div className="w-1.5 h-[2px] rounded-full bg-sky-300" />
                  <div className="w-1.5 h-[2px] rounded-full bg-sky-300" />
                </div>
                <div className="w-5 h-5 rounded-full atom-co2-c" />
                <div className="flex flex-col gap-0.5 mx-0.5 z-10">
                  <div className="w-1.5 h-[2px] rounded-full bg-sky-300" />
                  <div className="w-1.5 h-[2px] rounded-full bg-sky-300" />
                </div>
                <div className="w-3.5 h-3.5 rounded-full atom-co2-o" />
              </div>
            </div>
          </div>
        </div>

        {/* Environmental Summary Insight */}
        <p className="text-[11px] leading-relaxed text-emerald-100/60 max-w-xs mt-1">
          {co2Dominates
            ? 'Active Carbon Sink: This tree actively filters heavy urban carbon, scrubbing the atmosphere daily.'
            : 'Vitality Generator: High rate of photosynthetic oxygen production, sustaining fresh campus airflow.'}
        </p>
      </main>

      {/* ==============================================================
           FOOTER: Explore Button & Controls
      ============================================================== */}
      <footer className="relative z-30 mx-auto flex w-full max-w-sm flex-col items-center gap-2 pb-1">
        <button
          type="button"
          onClick={onDone}
          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-emerald-300/40 py-3 text-sm font-bold text-white shadow-[0_8px_28px_rgba(16,185,129,0.32)] transition-all hover:scale-[1.03] active:scale-[0.97]"
          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}
        >
          <span>Explore this Tree</span>
          <span className="text-base">→</span>
        </button>

        <p className="text-[10px] font-medium tracking-wide text-white/40">
          🌿 Green Atlas · Sona College of Technology
        </p>
      </footer>
    </div>
  )
}
