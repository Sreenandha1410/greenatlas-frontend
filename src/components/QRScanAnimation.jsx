import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Lightweight particle-network background and particle-formed tree.
// Uses Canvas 2D; no new dependency is required.
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

      network = Array.from({ length: Math.min(115, Math.max(55, Math.floor(w * h / 12500))) }, () => ({
        x: rand(0, w), y: rand(0, h), vx: rand(-.13, .13), vy: rand(-.1, .1),
        r: rand(.7, 2), phase: rand(0, 6.28), alpha: rand(.15, .65)
      }))

      const cx = w / 2
      const ground = h * .77
      const rx = Math.min(w * .30, 225)
      const ry = Math.min(h * .27, 185)
      tree = []

      // Canopy particles distributed inside an irregular ellipse.
      const canopyCount = Math.min(360, Math.max(150, Math.floor(w * h / 5200)))
      for (let i = 0; i < canopyCount; i++) {
        const a = rand(0, Math.PI * 2), r = Math.sqrt(Math.random())
        const x = cx + Math.cos(a) * rx * r * rand(.86, 1.08)
        const y = ground - ry + Math.sin(a) * ry * r * rand(.86, 1.08)
        tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(.7, 2), alpha: rand(.25, .9) })
      }

      // Trunk, branches and roots.
      for (let i = 0; i < 115; i++) {
        const t = i / 114, spread = 4 + t * 19
        const x = cx + rand(-spread, spread), y = ground - t * h * .29
        tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(.8, 1.8), alpha: rand(.35, .9) })
      }
      for (const side of [-1, 1]) {
        for (let i = 0; i < 38; i++) {
          const t = i / 37, x = cx + side * t * rx * .72
          const y = ground + t * 9
          tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(.6, 1.5), alpha: rand(.25, .7) })
        }
      }
      ;[[-.72,-.78],[-.48,-.98],[-.18,-1.08],[.18,-1.08],[.48,-.98],[.72,-.78],[-.9,-.48],[.9,-.48]].forEach(([dx,dy]) => {
        for (let i = 0; i < 25; i++) {
          const t = i / 24, x = cx + dx * rx * t, y = ground - ry * .1 + dy * ry * t
          tree.push({ x, y, ox: x, oy: y, phase: rand(0, 6.28), size: rand(.7, 1.5), alpha: rand(.25, .8) })
        }
      })
    }

    function frame(time) {
      ctx.clearRect(0, 0, w, h)
      const bg = ctx.createRadialGradient(w*.5,h*.55,5,w*.5,h*.55,Math.max(w,h)*.65)
      bg.addColorStop(0,'rgba(13,75,29,.28)')
      bg.addColorStop(.6,'rgba(4,35,15,.16)')
      bg.addColorStop(1,'rgba(1,8,5,0)')
      ctx.fillStyle = bg
      ctx.fillRect(0,0,w,h)

      if (!reduced) network.forEach(p => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > w) p.vx *= -1
        if (p.y < 0 || p.y > h) p.vy *= -1
      })

      for (let i=0;i<network.length;i++) for (let j=i+1;j<network.length;j++) {
        const a=network[i], b=network[j], d=Math.hypot(a.x-b.x,a.y-b.y)
        if (d<125) {
          ctx.strokeStyle=`rgba(55,190,82,${(1-d/125)*.13})`
          ctx.lineWidth=.65; ctx.beginPath(); ctx.moveTo(a.x,a.y); ctx.lineTo(b.x,b.y); ctx.stroke()
        }
      }
      network.forEach(p => {
        const pulse = reduced ? 1 : .65 + Math.sin(time*.0015+p.phase)*.35
        ctx.beginPath(); ctx.fillStyle=`rgba(68,255,105,${p.alpha*pulse})`
        ctx.shadowColor='#32ff65'; ctx.shadowBlur=9
        ctx.arc(p.x,p.y,p.r*pulse,0,Math.PI*2); ctx.fill()
      })
      ctx.shadowBlur=0

      const sway = reduced ? 0 : Math.sin(time*.00055)*2
      tree.forEach((p,i) => {
        const drift = reduced ? 0 : Math.sin(time*.0008+p.phase)*1.5
        p.x=p.ox+sway*(p.oy<h*.55?.7:.25)+drift
        p.y=p.oy+(reduced?0:Math.cos(time*.0007+p.phase)*1.1)
        // Connect nearby points to give the tree a delicate particle-mesh structure.
        for (let j=i+1;j<tree.length;j++) {
          const q=tree[j], d=Math.hypot(p.x-q.ox,p.y-q.oy)
          if (d<21) {
            ctx.strokeStyle=`rgba(72,224,100,${(1-d/21)*.11})`
            ctx.lineWidth=.5; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.ox,q.oy); ctx.stroke()
          }
        }
      })
      tree.forEach((p,i) => {
        const shimmer = reduced ? .75 : .55+(Math.sin(time*.0018+p.phase)+1)*.22
        ctx.beginPath(); ctx.fillStyle=`rgba(115,255,128,${p.alpha*shimmer})`
        ctx.shadowColor='#39ff64'; ctx.shadowBlur=i%4===0?12:6
        ctx.arc(p.x,p.y,p.size*(i%7===0?1.2:1),0,Math.PI*2); ctx.fill()
      })
      ctx.shadowBlur=0

      const floor=ctx.createRadialGradient(w*.5,h*.78,2,w*.5,h*.78,Math.min(w*.3,250))
      floor.addColorStop(0,'rgba(55,255,100,.12)'); floor.addColorStop(1,'rgba(55,255,100,0)')
      ctx.fillStyle=floor; ctx.fillRect(w*.15,h*.58,w*.7,h*.35)

      if (!reduced) raf=requestAnimationFrame(frame)
    }

    resize()
    raf=requestAnimationFrame(frame)
    window.addEventListener('resize',resize)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize',resize) }
  }, [])

  return <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full pointer-events-none" />
}

function Molecule({ co2 = false }) {
  return co2 ? (
    <motion.div className="relative h-12 w-20" animate={{ y:[0,3,0] }} transition={{ duration:3.4,repeat:Infinity }}>
      <i className="absolute left-0 top-4 h-6 w-6 rounded-full border border-blue-100/70 bg-[radial-gradient(circle_at_30%_25%,#eff8ff,#69b7ff_40%,#124c91)] shadow-[0_0_18px_rgba(73,164,255,.5)]"/>
      <i className="absolute left-[27px] top-[13px] h-8 w-8 rounded-full border border-pink-100/70 bg-[radial-gradient(circle_at_30%_25%,#fff0f5,#ed6b9a_40%,#8b1744)] shadow-[0_0_18px_rgba(236,72,153,.45)]"/>
      <i className="absolute right-0 top-4 h-6 w-6 rounded-full border border-blue-100/70 bg-[radial-gradient(circle_at_30%_25%,#eff8ff,#69b7ff_40%,#124c91)] shadow-[0_0_18px_rgba(73,164,255,.5)]"/>
      <i className="absolute left-5 top-[25px] h-1 w-3 bg-blue-200"/><i className="absolute right-5 top-[25px] h-1 w-3 bg-blue-200"/>
    </motion.div>
  ) : (
    <motion.div className="relative h-12 w-16" animate={{ y:[0,-3,0] }} transition={{ duration:3,repeat:Infinity }}>
      <i className="absolute left-1 top-3 h-7 w-7 rounded-full border border-green-100/70 bg-[radial-gradient(circle_at_30%_25%,#f0fff1,#79d783_35%,#17612a)] shadow-[0_0_22px_rgba(88,230,112,.55)]"/>
      <i className="absolute right-1 top-3 h-7 w-7 rounded-full border border-green-100/70 bg-[radial-gradient(circle_at_30%_25%,#f0fff1,#79d783_35%,#17612a)] shadow-[0_0_22px_rgba(88,230,112,.55)]"/>
      <i className="absolute left-7 top-[23px] h-1 w-3 bg-green-200"/>
    </motion.div>
  )
}

function StatCard({ co2, value, delay }) {
  const accent = co2 ? '#91caff' : '#8df09a'
  return (
    <motion.div initial={{opacity:0,y:24,scale:.94}} animate={{opacity:1,y:0,scale:1}}
      transition={{delay,duration:.65}} whileHover={{y:-5,scale:1.025}}
      className="relative flex min-w-0 flex-1 flex-col items-center overflow-hidden rounded-[26px] px-3 py-5 text-center"
      style={{
        background:co2?'linear-gradient(145deg,rgba(15,65,91,.82),rgba(8,31,49,.82))':'linear-gradient(145deg,rgba(17,75,35,.82),rgba(9,38,23,.82))',
        border:`1px solid ${co2?'rgba(103,184,255,.34)':'rgba(112,235,133,.36)'}`,
        boxShadow:`0 12px 42px ${co2?'rgba(45,139,220,.12)':'rgba(33,180,74,.12)'},inset 0 1px 0 rgba(255,255,255,.08)`,
        backdropFilter:'blur(14px)'
      }}>
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-18deg]"
        animate={{ x: ['0%', '520%'] }}
        transition={{ duration: 5.5, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut', delay }}
        style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.09), transparent)' }}
      />
      <Molecule co2={co2}/>
      <p className="mt-1 text-3xl font-black tracking-widest" style={{color:accent}}>{co2?'CO₂':'O₂'}</p>
      <p className="mt-2 text-lg font-bold text-white">{value || '—'}</p>
      <p className="mt-0.5 text-xs text-white/55">kg / day</p>
      <p className="mt-2 text-xs font-semibold" style={{color:accent}}>{co2?'CO₂ Absorbed':'Oxygen Produced'}</p>
    </motion.div>
  )
}

export default function QRScanAnimation({ tree, onDone }) {
  const [phase,setPhase]=useState(0)
  useEffect(()=>{const timer=setTimeout(()=>setPhase(1),650);return()=>clearTimeout(timer)},[])

  return (
    <AnimatePresence>
      {phase<2 && <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0,scale:1.02}}
        transition={{duration:.5}}
        className="fixed inset-0 z-[999] flex min-h-[100svh] flex-col items-center justify-between overflow-hidden px-4 py-8 sm:py-10"
        style={{background:'radial-gradient(ellipse at 50% 55%,#082b14 0%,#03150b 48%,#010805 100%)'}}>
        <ParticleTreeBackground/>

        {/* Animated atmosphere: scanning beam, orbiting fireflies and breathing rings. */}
        <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden="true">
          <motion.div
            className="absolute -left-1/3 top-0 h-full w-1/3"
            animate={{ x: ['0vw', '430vw'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear', repeatDelay: 1.8 }}
            style={{ background: 'linear-gradient(90deg, transparent, rgba(91,255,130,.045), rgba(135,255,157,.12), rgba(91,255,130,.045), transparent)', filter: 'blur(12px)' }}
          />
          <motion.div
            className="absolute left-1/2 top-[52%] h-[min(72vw,420px)] w-[min(72vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-300/[.09]"
            animate={{ scale: [0.88, 1.08, 0.88], opacity: [0.22, 0.55, 0.22] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute left-1/2 top-[52%] h-[min(54vw,310px)] w-[min(54vw,310px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-200/[.08]"
            animate={{ scale: [1.08, 0.9, 1.08], opacity: [0.12, 0.38, 0.12] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          />
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <motion.span
              key={i}
              className="absolute left-1/2 top-[52%] h-1.5 w-1.5 rounded-full bg-green-200"
              style={{ boxShadow: '0 0 12px 3px rgba(89,255,126,.55)' }}
              animate={{
                x: [0, Math.cos(i * Math.PI / 4) * (105 + (i % 3) * 28), 0],
                y: [0, Math.sin(i * Math.PI / 4) * (105 + (i % 3) * 28), 0],
                opacity: [0.15, 0.9, 0.15],
                scale: [0.55, 1.35, 0.55]
              }}
              transition={{ duration: 4.5 + (i % 3) * 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.22 }}
            />
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 z-[2]" style={{background:'linear-gradient(180deg,rgba(0,8,4,.25),transparent 35%,rgba(0,8,4,.38))'}}/>

        <motion.header initial={{opacity:0,y:-18}} animate={phase>=1?{opacity:1,y:0}:{}} transition={{delay:.2,duration:.7}}
          className="relative z-10 mt-2 w-full max-w-3xl text-center">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[.32em] text-green-300/90">Green Atlas · Living Intelligence</p>
          <p className="text-xs font-semibold uppercase tracking-[.24em] text-green-200/75">You are looking at</p>
          <h1 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-4xl" style={{fontFamily:'Fraunces,Georgia,serif',textShadow:'0 3px 28px rgba(80,255,120,.2)'}}>
            {tree?.common_name || 'Green Atlas'}
          </h1>
          <p className="mt-2 text-sm italic text-green-200/80 sm:text-base">{tree?.botanical_name}</p>
        </motion.header>

        <div className="relative z-10 flex w-full max-w-md flex-col items-center gap-5 sm:gap-7">
          <motion.div initial={{opacity:0,scale:.92}} animate={phase>=1?{opacity:1,scale:1}:{}} transition={{delay:.35,duration:.8}}
            className="rounded-full border border-green-300/15 bg-green-300/[.04] px-5 py-2 text-[10px] font-semibold uppercase tracking-[.24em] text-green-100/65 backdrop-blur-md">
            A living ecosystem in motion
          </motion.div>
          <div className="grid w-full grid-cols-2 gap-3 sm:gap-4">
            <StatCard value={tree?.o2_produced_daily} delay={.65}/>
            <StatCard co2 value={tree?.co2_absorbed_daily} delay={.85}/>
          </div>
          <motion.p initial={{opacity:0}} animate={phase>=1?{opacity:1}:{}} transition={{delay:1.2}}
            className="max-w-sm text-center text-xs leading-6 text-green-100/55 sm:text-sm">
            Every tree plays a part in sustaining the balance of our environment.
          </motion.p>
        </div>

        <motion.footer initial={{opacity:0,y:12}} animate={phase>=1?{opacity:1,y:0}:{}} transition={{delay:1.25}}
          className="relative z-10 flex flex-col items-center gap-4 pb-1">
          <motion.button type="button" onClick={()=>{setPhase(2);onDone?.()}}
            whileHover={{scale:1.045}} whileTap={{scale:.97}}
            className="flex items-center gap-3 rounded-full border border-green-200/30 px-8 py-3.5 text-sm font-bold text-white shadow-[0_8px_35px_rgba(34,197,94,.2)]"
            style={{background:'linear-gradient(135deg,#176b32,#269447)'}}>
            Explore this Tree
            <motion.span animate={{x:[0,4,0]}} transition={{duration:1.5,repeat:Infinity}}>→</motion.span>
          </motion.button>
          <p className="text-[10px] tracking-wide text-white/35">🌿 Green Atlas · Sona College of Technology</p>
        </motion.footer>
      </motion.div>}
    </AnimatePresence>
  )
}
