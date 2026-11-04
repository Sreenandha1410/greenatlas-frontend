import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

function LivingTreeCanvas() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    let width = 0
    let height = 0
    let raf = 0
    let start = performance.now()
    let nodes = []
    let leaves = []
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const random = (min, max) => min + Math.random() * (max - min)

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.clientWidth
      height = canvas.clientHeight
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      nodes = Array.from({ length: Math.min(90, Math.floor(width * height / 13000)) }, () => ({
        x: random(0, width), y: random(0, height), r: random(.5, 1.7),
        vx: random(-.12, .12), vy: random(-.1, .1), a: random(.12, .45)
      }))
      leaves = Array.from({ length: 38 }, () => ({
        x: random(0, width), y: random(0, height), s: random(3, 7),
        speed: random(.12, .35), drift: random(-.2, .2), phase: random(0, 6.28), a: random(.25, .65)
      }))
    }

    const draw = (now) => {
      const t = (now - start) / 1000
      const grow = reducedMotion ? 1 : Math.min(1, Math.max(0, (t - .25) / 3.1))
      const wind = reducedMotion ? 0 : Math.sin(t * 1.25) * 5 + Math.sin(t * 2.1) * 1.8
      ctx.clearRect(0, 0, width, height)

      // Subtle connected-node background.
      nodes.forEach((p, i) => {
        p.x += p.vx; p.y += p.vy
        if (p.x < 0 || p.x > width) p.vx *= -1
        if (p.y < 0 || p.y > height) p.vy *= -1
        for (let j = i + 1; j < nodes.length; j++) {
          const q = nodes[j]
          const d = Math.hypot(p.x - q.x, p.y - q.y)
          if (d < 115) {
            ctx.strokeStyle = `rgba(55,150,75,${(1 - d / 115) * .12})`
            ctx.lineWidth = .7
            ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
          }
        }
        ctx.fillStyle = `rgba(65,220,95,${p.a})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()
      })

      // Floating leaves.
      leaves.forEach((leaf) => {
        leaf.y += leaf.speed
        leaf.x += leaf.drift + Math.sin(t + leaf.phase) * .25
        if (leaf.y > height + 15) { leaf.y = -15; leaf.x = random(0, width) }
        ctx.save(); ctx.translate(leaf.x, leaf.y); ctx.rotate(Math.sin(t + leaf.phase) * .5)
        ctx.fillStyle = `rgba(133,190,65,${leaf.a})`
        ctx.beginPath(); ctx.ellipse(0, 0, leaf.s, leaf.s * .48, 0, 0, Math.PI * 2); ctx.fill()
        ctx.restore()
      })

      const cx = width / 2
      const ground = height * .78
      const scale = .08 + grow * .92
      ctx.save()
      ctx.translate(cx, ground)
      ctx.scale(scale, scale)

      // Ground glow and expanding discovery rings.
      const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 190)
      glow.addColorStop(0, 'rgba(117,190,54,.22)')
      glow.addColorStop(1, 'rgba(45,110,30,0)')
      ctx.fillStyle = glow; ctx.beginPath(); ctx.ellipse(0, 0, 205, 35, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = 'rgba(105,190,70,.45)'; ctx.lineWidth = 1
      for (let i = 0; i < 3; i++) {
        ctx.beginPath(); ctx.ellipse(0, 10, 90 + i * 43 + Math.sin(t + i) * 3, 12 + i * 5, 0, 0, Math.PI * 2); ctx.stroke()
      }

      // Soil mound.
      ctx.fillStyle = '#25351b'
      ctx.beginPath(); ctx.moveTo(-85, 0); ctx.quadraticCurveTo(-42, -23, 0, -19); ctx.quadraticCurveTo(48, -24, 86, 0); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = 'rgba(160,190,83,.65)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.moveTo(-75, -3); ctx.quadraticCurveTo(0, -30, 76, -3); ctx.stroke()

      // Trunk and branches sway gently at the upper canopy.
      ctx.lineCap = 'round'
      ctx.strokeStyle = '#8c8150'; ctx.lineWidth = 9
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.quadraticCurveTo(-wind * .15, -90, wind * .35, -190); ctx.stroke()
      const branches = [
        [-2,-105,-58,-164,-115,-190], [0,-128,58,-177,112,-195],
        [0,-150,-38,-213,-72,-229], [4,-153,42,-217,77,-235],
        [-1,-88,-88,-125,-145,-139], [1,-94,88,-129,145,-145]
      ]
      branches.forEach(([x1,y1,x2,y2,x3,y3], idx) => {
        ctx.strokeStyle = '#887b4b'; ctx.lineWidth = idx < 2 ? 5 : 3.2
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(x2 + wind * .35, y2, x3 + wind, y3); ctx.stroke()
      })

      // Dense, softly lit canopy clusters.
      const clusters = [
        [-105,-190,54],[-65,-224,58],[-10,-238,63],[52,-224,59],[105,-188,52],
        [-135,-153,40],[-75,-170,50],[-15,-183,56],[55,-173,50],[132,-151,39],
        [-90,-130,42],[-28,-145,48],[38,-143,47],[92,-128,40]
      ]
      clusters.forEach(([x,y,r], idx) => {
        const sway = wind * (Math.abs(x) / 145) * .7
        const g = ctx.createRadialGradient(x + sway - 12, y - 12, 2, x + sway, y, r)
        g.addColorStop(0, idx % 3 === 0 ? '#a4c85b' : '#668f36')
        g.addColorStop(.65, '#355d27')
        g.addColorStop(1, 'rgba(24,54,24,.05)')
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x + sway, y, r, 0, Math.PI * 2); ctx.fill()
      })
      for (let i = 0; i < 260; i++) {
        const a = i * 2.399
        const rr = Math.sqrt((i + .5) / 260)
        const x = Math.cos(a) * 143 * rr
        const y = -184 + Math.sin(a) * 94 * rr
        const sway = wind * Math.min(1, Math.abs(x) / 125)
        const flicker = .55 + .35 * Math.sin(t * 2 + i)
        ctx.fillStyle = `rgba(${i % 4 === 0 ? '160,195,82' : '79,132,48'},${flicker})`
        ctx.beginPath(); ctx.ellipse(x + sway, y, random(1.2, 2.7), random(1, 2), a, 0, Math.PI * 2); ctx.fill()
      }
      ctx.restore()
      raf = requestAnimationFrame(draw)
    }

    resize()
    const observer = new ResizeObserver(resize)
    observer.observe(canvas)
    raf = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(raf); observer.disconnect() }
  }, [])

  return <canvas ref={canvasRef} className="ga-tree-canvas" aria-hidden="true" />
}

export default function QRScanAnimation({ tree, onDone }) {
  const commonName = tree?.common_name || 'Indian Cork Tree / Maramalli'
  const botanicalName = tree?.botanical_name || [tree?.genus, tree?.species].filter(Boolean).join(' ') || 'Millingtonia hortensis'
  const oxygen = tree?.o2_produced_daily ?? '0.170'
  const carbon = tree?.co2_absorbed_daily ?? '0.425'

  return (
    <motion.div className="ga-intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <LivingTreeCanvas />
      <div className="ga-vignette" />
      <motion.header className="ga-heading" initial={{ y: -18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: .25 }}>
        <span>YOU ARE LOOKING AT</span>
        <h1>{commonName}</h1>
        <i>{botanicalName}</i>
        <div className="ga-flourish">⌁　❧　⌁</div>
      </motion.header>

      <motion.section className="ga-stat ga-stat-left" initial={{ x: -35, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: .65 }}>
        <div className="ga-molecule ga-o2"><b /><b /></div>
        <strong>O₂</strong><h2>~{oxygen} kg/day</h2><small>kg / day</small><p>Oxygen Produced</p>
      </motion.section>
      <motion.section className="ga-stat ga-stat-right" initial={{ x: 35, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: .8 }}>
        <div className="ga-molecule ga-co2"><b /><b /><b /></div>
        <strong>CO₂</strong><h2>~{carbon} kg/day</h2><small>kg / day</small><p>CO₂ Absorbed</p>
      </motion.section>

      <motion.button className="ga-explore" onClick={() => onDone?.()} initial={{ y: 18, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1.1 }}>
        Explore this Tree <span>→</span>
      </motion.button>
      <footer className="ga-footer">✿　Green Atlas · Sona College of Technology</footer>

      <style>{`
        .ga-intro{position:fixed;inset:0;z-index:9999;overflow:hidden;background:radial-gradient(ellipse at 50% 55%,#102817 0%,#06190f 48%,#020d08 100%);color:#f1f5e9;font-family:Arial,sans-serif}
        .ga-tree-canvas{position:absolute;inset:0;width:100%;height:100%}.ga-vignette{position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at center,transparent 35%,rgba(0,8,4,.34) 100%)}
        .ga-heading{position:absolute;top:7%;left:50%;width:min(90%,850px);transform:translateX(-50%);text-align:center}.ga-heading span{color:#83c875;font-size:clamp(12px,1.3vw,18px);font-weight:700;letter-spacing:2px}.ga-heading h1{font-family:Georgia,serif;font-size:clamp(25px,3vw,43px);margin:12px 0 8px;font-weight:600;text-shadow:0 2px 15px #000}.ga-heading i{font-family:Georgia,serif;color:#8dbd68;font-size:clamp(15px,1.7vw,23px)}.ga-flourish{color:#7da95c;margin-top:8px;font-size:18px}
        .ga-stat{position:absolute;top:34%;width:clamp(190px,19vw,310px);height:clamp(235px,31vh,310px);box-sizing:border-box;border-radius:27px;background:linear-gradient(145deg,rgba(21,62,35,.58),rgba(5,27,19,.7));backdrop-filter:blur(8px);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:inset 0 0 22px rgba(100,160,80,.08),0 10px 35px rgba(0,0,0,.2)}.ga-stat-left{left:11.3%;border:1px solid rgba(124,190,72,.65)}.ga-stat-right{right:11.3%;border:1px solid rgba(63,174,180,.65)}.ga-stat strong{font: bold clamp(32px,3vw,45px) Georgia,serif;margin-top:12px}.ga-stat h2{font:700 clamp(16px,1.6vw,23px) Georgia,serif;margin:10px 0}.ga-stat small{color:#a7b9a2;font-size:15px}.ga-stat p{font-size:15px;margin:12px 0 0}.ga-stat-left strong{color:#e8f5e6}.ga-stat-right strong{color:#9bd9df}
        .ga-molecule{height:45px;display:flex;align-items:center;justify-content:center;position:relative}.ga-molecule b{display:block;width:33px;height:33px;border-radius:50%;background:radial-gradient(circle at 32% 28%,#b5f2b5,#35b95c 58%,#087b36);box-shadow:0 0 16px rgba(62,200,98,.3);margin:0 -2px}.ga-co2 b{background:radial-gradient(circle at 30% 25%,#c1eaff,#319cc7 60%,#17628c)}.ga-co2 b:nth-child(2){width:43px;height:43px;background:radial-gradient(circle at 30% 25%,#ffc1ec,#d34a9f 60%,#87316c)}
        .ga-explore{position:absolute;left:50%;bottom:13.5%;transform:translateX(-50%);border:1px solid rgba(142,197,96,.85);border-radius:40px;padding:17px 42px;background:linear-gradient(110deg,#164c29,#286b31);color:#f6fff1;font-size:18px;font-weight:700;box-shadow:0 0 20px rgba(103,170,67,.22);cursor:pointer;transition:transform .2s,filter .2s}.ga-explore:hover{filter:brightness(1.15);transform:translateX(-50%) scale(1.04)}.ga-explore span{margin-left:12px}.ga-footer{position:absolute;bottom:7.7%;left:0;width:100%;text-align:center;color:#86b96c;font-size:15px;letter-spacing:.2px}
        @media(max-width:700px){.ga-heading{top:5%}.ga-heading h1{font-size:25px}.ga-stat{top:auto;bottom:24%;width:42%;height:170px;border-radius:18px}.ga-stat-left{left:4%}.ga-stat-right{right:4%}.ga-stat strong{font-size:29px}.ga-stat h2{font-size:14px}.ga-stat p{font-size:11px}.ga-stat small{font-size:11px}.ga-molecule b{width:23px;height:23px}.ga-co2 b:nth-child(2){width:30px;height:30px}.ga-explore{bottom:10%;padding:13px 25px;font-size:15px}.ga-footer{bottom:4%;font-size:11px}}
        @media(prefers-reduced-motion:reduce){.ga-explore{transition:none}}
      `}</style>
    </motion.div>
  )
}
