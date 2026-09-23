import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================
// REALISTIC O2 MOLECULE — subtle 3D scientific visualization
// ============================================================
function O2Molecule({ delay = 0, lane = 0 }) {
  const atomStyle = {
    position: 'absolute',
    width: 23,
    height: 23,
    borderRadius: '50%',
    background:
      'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.98) 0%, rgba(220,255,224,0.92) 10%, rgba(104,180,108,0.98) 34%, rgba(45,105,48,1) 72%, rgba(12,42,15,1) 100%)',
    border: '1px solid rgba(218,255,221,0.55)',
    boxShadow:
      'inset -5px -6px 9px rgba(0,25,4,0.42), inset 3px 3px 5px rgba(255,255,255,0.28), 0 5px 12px rgba(0,0,0,0.28), 0 0 12px rgba(91,190,99,0.22)'
  }

  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{
        left: 0,
        top: '50%',
        marginTop: lane,
        width: 58,
        height: 30,
        filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.2))'
      }}
      initial={{ opacity: 0, x: -95, scale: 0.58, rotate: -8 }}
      animate={{
        opacity: [0, 0.95, 1, 0.95, 0],
        x: [-95, -42, 0, 34, 72],
        y: [0, 0, -5, -30, -70],
        scale: [0.58, 0.88, 1, 0.94, 0.68],
        rotate: [-8, -2, 3, 10, 18]
      }}
      transition={{
        duration: 3.8,
        delay,
        repeat: Infinity,
        repeatDelay: 0.55,
        ease: 'easeInOut',
        times: [0, 0.27, 0.48, 0.72, 1]
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 20,
          height: 6,
          left: 19,
          top: 12,
          borderRadius: 8,
          background:
            'linear-gradient(180deg, rgba(229,255,231,0.95), rgba(91,155,95,0.92) 48%, rgba(28,72,31,0.95))',
          border: '1px solid rgba(207,255,210,0.35)',
          boxShadow: '0 2px 5px rgba(0,0,0,0.35)'
        }}
      />

      <motion.div
        animate={{ y: [0, -0.6, 0], scale: [1, 1.035, 1] }}
        transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
        style={{ ...atomStyle, left: 0, top: 3 }}
      />

      <motion.div
        animate={{ y: [0, 0.6, 0], scale: [1, 1.035, 1] }}
        transition={{ duration: 1.7, delay: 0.18, repeat: Infinity, ease: 'easeInOut' }}
        style={{ ...atomStyle, right: 0, top: 3 }}
      />
    </motion.div>
  )
}


// ============================================================
// REALISTIC CO2 MOLECULE — subtle 3D linear structure
// ============================================================
function CO2Molecule({ delay = 0, lane = 0 }) {
  const oxygenStyle = {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: '50%',
    background:
      'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.98) 0%, rgba(225,241,255,0.94) 11%, rgba(86,154,218,0.98) 38%, rgba(24,83,145,1) 74%, rgba(8,34,68,1) 100%)',
    border: '1px solid rgba(213,235,255,0.58)',
    boxShadow:
      'inset -5px -6px 8px rgba(0,20,48,0.42), inset 3px 3px 5px rgba(255,255,255,0.3), 0 5px 11px rgba(0,0,0,0.25), 0 0 11px rgba(72,142,215,0.18)'
  }

  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{
        right: 0,
        top: '50%',
        marginTop: lane,
        width: 70,
        height: 30,
        filter: 'drop-shadow(0 5px 7px rgba(0,0,0,0.2))'
      }}
      initial={{ opacity: 0, x: 95, scale: 0.58, rotate: 8 }}
      animate={{
        opacity: [0, 0.95, 1, 0.96, 0],
        x: [95, 45, 5, -7, -10],
        y: [0, 0, 1, -5, -13],
        scale: [0.58, 0.88, 1, 1.02, 0.18],
        rotate: [8, 3, 0, -5, -10]
      }}
      transition={{
        duration: 3.8,
        delay,
        repeat: Infinity,
        repeatDelay: 0.55,
        ease: 'easeInOut',
        times: [0, 0.27, 0.47, 0.57, 1]
      }}
    >
      <div
        style={{
          position: 'absolute',
          height: 5,
          width: 13,
          left: 17,
          top: 12,
          borderRadius: 5,
          background:
            'linear-gradient(180deg, rgba(230,243,255,0.95), rgba(91,139,188,0.92) 48%, rgba(23,56,89,0.95))',
          boxShadow: '0 2px 4px rgba(0,0,0,0.35)'
        }}
      />
      <div
        style={{
          position: 'absolute',
          height: 5,
          width: 13,
          left: 40,
          top: 12,
          borderRadius: 5,
          background:
            'linear-gradient(180deg, rgba(230,243,255,0.95), rgba(91,139,188,0.92) 48%, rgba(23,56,89,0.95))',
          boxShadow: '0 2px 4px rgba(0,0,0,0.35)'
        }}
      />

      <motion.div
        animate={{ scale: [1, 1.025, 1] }}
        transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
        style={{ ...oxygenStyle, left: 0, top: 5 }}
      />

      <motion.div
        animate={{ scale: [1, 1.04, 1], y: [0, 0.5, 0] }}
        transition={{ duration: 1.9, delay: 0.1, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          width: 25,
          height: 25,
          left: 22,
          top: 2,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 28% 20%, rgba(255,255,255,0.98) 0%, rgba(255,220,229,0.95) 10%, rgba(220,88,126,1) 36%, rgba(139,31,68,1) 73%, rgba(55,8,26,1) 100%)',
          border: '1px solid rgba(255,220,230,0.58)',
          boxShadow:
            'inset -6px -7px 10px rgba(45,0,18,0.44), inset 3px 3px 6px rgba(255,255,255,0.3), 0 5px 13px rgba(0,0,0,0.28), 0 0 11px rgba(218,76,120,0.16)'
        }}
      />

      <motion.div
        animate={{ scale: [1, 1.025, 1] }}
        transition={{ duration: 1.9, delay: 0.2, repeat: Infinity, ease: 'easeInOut' }}
        style={{ ...oxygenStyle, right: 0, top: 5 }}
      />
    </motion.div>
  )
}


// ============================================================
// REALISTIC COLLISION EFFECT — restrained energy transfer
// ============================================================
function CollisionEffect() {
  return (
    <motion.div
      className="absolute pointer-events-none z-30"
      style={{
        left: '50%',
        top: '50%',
        width: 1,
        height: 1,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <motion.div
        animate={{
          scale: [0.2, 0.7, 1.15, 1.45, 0.2],
          opacity: [0, 0.75, 0.45, 0.12, 0]
        }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          repeatDelay: 0.55,
          times: [0.42, 0.47, 0.52, 0.62, 0.78],
          ease: 'easeOut'
        }}
        style={{
          position: 'absolute',
          width: 90,
          height: 90,
          left: -45,
          top: -45,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(238,255,240,0.82) 0%, rgba(145,205,150,0.32) 16%, rgba(70,130,74,0.1) 42%, transparent 72%)',
          filter: 'blur(1px)'
        }}
      />

      <motion.div
        animate={{
          scale: [0.35, 0.8, 1.7],
          opacity: [0, 0.65, 0]
        }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          repeatDelay: 0.55,
          times: [0.45, 0.53, 0.72],
          ease: 'easeOut'
        }}
        style={{
          position: 'absolute',
          width: 48,
          height: 48,
          left: -24,
          top: -24,
          borderRadius: '50%',
          border: '1px solid rgba(173,221,176,0.65)',
          boxShadow: '0 0 16px rgba(103,166,108,0.25)'
        }}
      />

      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = i * 60
        const distance = 34 + (i % 2) * 12

        return (
          <motion.div
            key={i}
            animate={{
              x: [0, Math.cos((angle * Math.PI) / 180) * distance],
              y: [0, Math.sin((angle * Math.PI) / 180) * distance],
              opacity: [0, 0.72, 0],
              scale: [0.4, 0.8, 0]
            }}
            transition={{
              duration: 3.8,
              repeat: Infinity,
              repeatDelay: 0.55,
              delay: i * 0.015,
              times: [0.45, 0.56, 0.72],
              ease: 'easeOut'
            }}
            style={{
              position: 'absolute',
              width: 3,
              height: 3,
              borderRadius: '50%',
              background: 'rgba(210,239,213,0.9)',
              boxShadow: '0 0 5px rgba(142,202,147,0.5)'
            }}
          />
        )
      })}
    </motion.div>
  )
}


// ============================================================
// EXTRA O2 — realistic oxygen atoms leaving the process
// ============================================================
function ExtraOxygen({ delay = 0, x = 0 }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-25"
      style={{
        left: `calc(50% + ${x}px)`,
        top: '50%',
        width: 17,
        height: 17
      }}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0.35 }}
      animate={{
        opacity: [0, 0.9, 0.75, 0],
        x: [0, x * 0.35, x * 0.75],
        y: [0, -38, -108],
        scale: [0.35, 0.82, 0.55]
      }}
      transition={{
        duration: 3,
        delay,
        repeat: Infinity,
        repeatDelay: 0.95,
        ease: 'easeOut'
      }}
    >
      <div
        style={{
          width: 17,
          height: 17,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 28% 22%, rgba(255,255,255,0.98), rgba(218,252,221,0.9) 12%, rgba(91,169,96,0.96) 40%, rgba(31,82,35,1) 78%, rgba(9,28,11,1))',
          border: '1px solid rgba(220,255,224,0.45)',
          boxShadow:
            'inset -4px -5px 7px rgba(0,20,3,0.42), inset 2px 2px 4px rgba(255,255,255,0.25), 0 4px 10px rgba(0,0,0,0.25)'
        }}
      />
    </motion.div>
  )
}


// ============================================================
// MAIN COMPONENT
// ============================================================
export default function QRScanAnimation({ tree, onDone }) {

  const [phase, setPhase] = useState(0)

  useEffect(() => {

    const t1 = setTimeout(
      () => setPhase(1),
      800
    )

    return () => clearTimeout(t1)

  }, [])


  return (

    <AnimatePresence>

      {phase < 2 && (

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{
            opacity: 0,
            scale: 1.05
          }}
          transition={{
            duration: 0.4
          }}
          className="fixed inset-0 z-[999] flex flex-col items-center justify-between overflow-hidden py-10 px-4"
          style={{
            background:
              'linear-gradient(160deg, #0a1f0a 0%, #1a3618 40%, #0d2b0d 100%)'
          }}
        >

          {/* =====================================================
              BACKGROUND GLOW
          ====================================================== */}

          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
            className="absolute rounded-full pointer-events-none"
            style={{
              width: 400,
              height: 400,
              top: '50%',
              left: '50%',
              transform:
                'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(82,160,67,0.25) 0%, transparent 70%)'
            }}
          />


          {/* =====================================================
              TOP — TREE NAME
          ====================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: -20
            }}
            animate={
              phase >= 1
                ? {
                    opacity: 1,
                    y: 0
                  }
                : {}
            }
            transition={{
              delay: 0.3,
              duration: 0.5
            }}
            className="text-center relative z-10 mt-4"
          >

            <p
              className="text-xs font-bold tracking-widest uppercase mb-2"
              style={{
                color: '#81c784'
              }}
            >
              You are looking at
            </p>


            <h1
              className="text-3xl font-bold text-white text-center mb-1"
              style={{
                fontFamily: 'Cinzel, serif'
              }}
            >
              {tree?.common_name || 'Green Atlas'}
            </h1>


            <p
              className="italic text-sm"
              style={{
                color: '#81c784'
              }}
            >
              {tree?.botanical_name}
            </p>

          </motion.div>


          {/* =====================================================
              MIDDLE — O2 + CO2 PROCESS
          ====================================================== */}

          <div className="relative flex gap-4 z-10 w-full max-w-sm mx-auto items-stretch">

            {/* =================================================
                ANIMATION FIELD
            ================================================== */}

            <div
              className="absolute pointer-events-none overflow-hidden"
              style={{
                left: -20,
                right: -20,
                top: -100,
                bottom: -100
              }}
            >

              {phase >= 1 && (

                <>

                  {/* O2 coming from LEFT */}
                  <O2Molecule
                    delay={0}
                    lane={-35}
                  />

                  <O2Molecule
                    delay={1.1}
                    lane={20}
                  />

                  <O2Molecule
                    delay={2.2}
                    lane={-5}
                  />


                  {/* CO2 coming from RIGHT */}
                  <CO2Molecule
                    delay={0.25}
                    lane={35}
                  />

                  <CO2Molecule
                    delay={1.35}
                    lane={-15}
                  />

                  <CO2Molecule
                    delay={2.45}
                    lane={5}
                  />


                  {/* Central collision */}
                  <CollisionEffect />


                  {/* Extra O2 remaining after CO2 absorption */}
                  <ExtraOxygen
                    delay={0.6}
                    x={-20}
                  />

                  <ExtraOxygen
                    delay={1.4}
                    x={15}
                  />

                  <ExtraOxygen
                    delay={2.3}
                    x={-8}
                  />

                  <ExtraOxygen
                    delay={3.1}
                    x={25}
                  />

                </>

              )}

            </div>


            {/* =================================================
                O2 CARD
            ================================================== */}

            <motion.div
              initial={{
                opacity: 0,
                x: -50,
                scale: 0.8
              }}
              animate={
                phase >= 1
                  ? {
                      opacity: 1,
                      x: 0,
                      scale: 1
                    }
                  : {}
              }
              transition={{
                delay: 0.7,
                type: 'spring',
                stiffness: 200,
                damping: 18
              }}
              className="flex-1 flex flex-col items-center px-4 py-5 rounded-2xl"
              style={{
                background:
                  'rgba(82,160,67,0.15)',
                border:
                  '1.5px solid rgba(82,160,67,0.4)',
                backdropFilter: 'blur(12px)'
              }}
            >

              {/* O2 molecule icon */}
              <div
                className="relative mb-3"
                style={{
                  width: 56,
                  height: 40
                }}
              >

                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity
                  }}
                  style={{
                    position: 'absolute',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #81c784, #4caf50)',
                    left: 0,
                    top: 9,
                    boxShadow:
                      '0 0 12px rgba(76,175,80,0.7)'
                  }}
                />


                <motion.div
                  animate={{
                    scaleX: [1, 1.3, 1]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.3
                  }}
                  style={{
                    position: 'absolute',
                    height: 3,
                    background:
                      'rgba(129,199,132,0.9)',
                    width: 14,
                    left: 21,
                    top: 18
                  }}
                />


                <motion.div
                  animate={{
                    scale: [1, 1.15, 1],
                    opacity: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: 0.15
                  }}
                  style={{
                    position: 'absolute',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #81c784, #4caf50)',
                    right: 0,
                    top: 9,
                    boxShadow:
                      '0 0 12px rgba(76,175,80,0.7)'
                  }}
                />

              </div>


              <span
                className="text-2xl font-black mb-1"
                style={{
                  color: '#81c784',
                  letterSpacing: 2
                }}
              >
                O₂
              </span>


              <motion.span
                initial={{
                  opacity: 0,
                  y: 8
                }}
                animate={
                  phase >= 1
                    ? {
                        opacity: 1,
                        y: 0
                      }
                    : {}
                }
                transition={{
                  delay: 1.1,
                  duration: 0.4
                }}
                className="text-base font-bold"
                style={{
                  color: '#c8e6c9'
                }}
              >
                {/* DAILY VALUE FROM NEON */}
                {tree?.o2_produced_daily || '—'}
              </motion.span>


              <span
                className="text-xs mt-1 text-center"
                style={{
                  color: '#81c784aa'
                }}
              >
                kg / day
              </span>


              <span
                className="text-xs mt-1 text-center"
                style={{
                  color: '#81c784aa'
                }}
              >
                Oxygen Produced
              </span>

            </motion.div>


            {/* =================================================
                CO2 CARD
            ================================================== */}

            <motion.div
              initial={{
                opacity: 0,
                x: 50,
                scale: 0.8
              }}
              animate={
                phase >= 1
                  ? {
                      opacity: 1,
                      x: 0,
                      scale: 1
                    }
                  : {}
              }
              transition={{
                delay: 0.9,
                type: 'spring',
                stiffness: 200,
                damping: 18
              }}
              className="flex-1 flex flex-col items-center px-4 py-5 rounded-2xl"
              style={{
                background:
                  'rgba(30,100,180,0.15)',
                border:
                  '1.5px solid rgba(100,160,255,0.35)',
                backdropFilter: 'blur(12px)'
              }}
            >

              {/* CO2 molecule icon */}
              <div
                className="relative mb-3"
                style={{
                  width: 72,
                  height: 40
                }}
              >

                <motion.div
                  animate={{
                    scale: [1, 1.12, 1]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity
                  }}
                  style={{
                    position: 'absolute',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #90caf9, #42a5f5)',
                    left: 0,
                    top: 11,
                    boxShadow:
                      '0 0 10px rgba(66,165,245,0.7)'
                  }}
                />


                <motion.div
                  style={{
                    position: 'absolute',
                    height: 3,
                    background:
                      'rgba(144,202,249,0.8)',
                    width: 10,
                    left: 17,
                    top: 19
                  }}
                />


                <motion.div
                  animate={{
                    scale: [1, 1.2, 1]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: 0.2
                  }}
                  style={{
                    position: 'absolute',
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #f48fb1, #e91e63)',
                    left: 25,
                    top: 9,
                    boxShadow:
                      '0 0 10px rgba(233,30,99,0.6)'
                  }}
                />


                <motion.div
                  style={{
                    position: 'absolute',
                    height: 3,
                    background:
                      'rgba(144,202,249,0.8)',
                    width: 10,
                    left: 46,
                    top: 19
                  }}
                />


                <motion.div
                  animate={{
                    scale: [1, 1.12, 1]
                  }}
                  transition={{
                    duration: 2.2,
                    repeat: Infinity,
                    delay: 0.1
                  }}
                  style={{
                    position: 'absolute',
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, #90caf9, #42a5f5)',
                    right: 0,
                    top: 11,
                    boxShadow:
                      '0 0 10px rgba(66,165,245,0.7)'
                  }}
                />

              </div>


              <span
                className="text-2xl font-black mb-1"
                style={{
                  color: '#90caf9',
                  letterSpacing: 2
                }}
              >
                CO₂
              </span>


              <motion.span
                initial={{
                  opacity: 0,
                  y: 8
                }}
                animate={
                  phase >= 1
                    ? {
                        opacity: 1,
                        y: 0
                      }
                    : {}
                }
                transition={{
                  delay: 1.3,
                  duration: 0.4
                }}
                className="text-base font-bold"
                style={{
                  color: '#bbdefb'
                }}
              >
                {/* DAILY VALUE FROM NEON */}
                {tree?.co2_absorbed_daily || '—'}
              </motion.span>


              <span
                className="text-xs mt-1 text-center"
                style={{
                  color: '#90caf9aa'
                }}
              >
                kg / day
              </span>


              <span
                className="text-xs mt-1 text-center"
                style={{
                  color: '#90caf9aa'
                }}
              >
                CO₂ Absorbed
              </span>

            </motion.div>

          </div>


          {/* =====================================================
              BOTTOM
          ====================================================== */}

          <div
            className="relative z-10 flex flex-col items-center gap-4"
          >

            {/* Explore button */}
            <motion.button
              initial={{
                opacity: 0,
                y: 10
              }}
              animate={
                phase >= 1
                  ? {
                      opacity: 1,
                      y: 0
                    }
                  : {}
              }
              transition={{
                delay: 1.8,
                duration: 0.4
              }}
              onClick={() => {
                setPhase(2)
                onDone?.()
              }}
              className="px-8 py-3 rounded-full text-sm font-bold text-white flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform"
              style={{
                background:
                  'linear-gradient(135deg, #2d5a27, #4caf50)',
                boxShadow:
                  '0 4px 20px rgba(76,175,80,0.4)',
                border:
                  '1px solid rgba(129,199,132,0.4)'
              }}
            >

              <span>
                Explore this Tree
              </span>


              <motion.span
                animate={{
                  x: [0, 4, 0]
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity
                }}
              >
                →
              </motion.span>

            </motion.button>


            {/* Branding */}
            <motion.div
              initial={{
                opacity: 0
              }}
              animate={
                phase >= 1
                  ? {
                      opacity: 1
                    }
                  : {}
              }
              transition={{
                delay: 2.0
              }}
              className="flex items-center gap-2"
            >

              <img
                src="/favicon.png"
                alt=""
                className="w-4 h-4 object-contain opacity-60"
              />


              <span
                className="text-xs"
                style={{
                  color:
                    'rgba(255,255,255,0.35)'
                }}
              >
                Green Atlas · Sona College of Technology
              </span>

            </motion.div>

          </div>

        </motion.div>

      )}

    </AnimatePresence>
  )
}
