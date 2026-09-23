import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ============================================================
// O2 MOLECULE — travels from LEFT → CENTER → continues upward
// ============================================================
function O2Molecule({ delay = 0, lane = 0 }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{
        left: 0,
        top: '50%',
        marginTop: lane,
        width: 48,
        height: 28
      }}
      initial={{
        opacity: 0,
        x: -90,
        scale: 0.45,
        rotate: -20
      }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        x: [-90, -35, 0, 35, 70],
        y: [0, 0, -8, -35, -75],
        scale: [0.45, 0.85, 1.15, 1, 0.65],
        rotate: [-20, 0, 180, 250, 320]
      }}
      transition={{
        duration: 3.2,
        delay,
        repeat: Infinity,
        repeatDelay: 0.8,
        ease: 'easeInOut',
        times: [0, 0.3, 0.48, 0.7, 1]
      }}
    >
      {/* O2 left atom */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity
        }}
        style={{
          position: 'absolute',
          width: 20,
          height: 20,
          borderRadius: '50%',
          left: 1,
          top: 4,
          background:
            'radial-gradient(circle at 30% 25%, #e8ffe8, #66bb6a 45%, #2e7d32)',
          boxShadow:
            '0 0 8px rgba(76,175,80,0.8), 0 0 18px rgba(76,175,80,0.35)'
        }}
      />

      {/* Bond */}
      <div
        style={{
          position: 'absolute',
          width: 15,
          height: 4,
          left: 17,
          top: 12,
          borderRadius: 10,
          background:
            'linear-gradient(90deg, #81c784, #c8e6c9, #81c784)',
          boxShadow:
            '0 0 5px rgba(129,199,132,0.8)'
        }}
      />

      {/* O2 right atom */}
      <motion.div
        animate={{
          scale: [1, 1.15, 1]
        }}
        transition={{
          duration: 0.8,
          delay: 0.15,
          repeat: Infinity
        }}
        style={{
          position: 'absolute',
          width: 20,
          height: 20,
          borderRadius: '50%',
          right: 1,
          top: 4,
          background:
            'radial-gradient(circle at 30% 25%, #e8ffe8, #66bb6a 45%, #2e7d32)',
          boxShadow:
            '0 0 8px rgba(76,175,80,0.8), 0 0 18px rgba(76,175,80,0.35)'
        }}
      />
    </motion.div>
  )
}


// ============================================================
// CO2 MOLECULE — travels from RIGHT → CENTER
// ============================================================
function CO2Molecule({ delay = 0, lane = 0 }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-20"
      style={{
        right: 0,
        top: '50%',
        marginTop: lane,
        width: 64,
        height: 28
      }}
      initial={{
        opacity: 0,
        x: 90,
        scale: 0.45,
        rotate: 20
      }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        x: [90, 45, 5, -5, -5],
        y: [0, 0, 0, -4, -12],
        scale: [0.45, 0.8, 1.1, 1.15, 0.15],
        rotate: [20, 0, -180, -260, -360]
      }}
      transition={{
        duration: 3.2,
        delay,
        repeat: Infinity,
        repeatDelay: 0.8,
        ease: 'easeInOut',
        times: [0, 0.3, 0.46, 0.55, 1]
      }}
    >
      {/* Oxygen atom */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity
        }}
        style={{
          position: 'absolute',
          width: 18,
          height: 18,
          borderRadius: '50%',
          left: 0,
          top: 5,
          background:
            'radial-gradient(circle at 30% 25%, #d9ecff, #42a5f5 50%, #1565c0)',
          boxShadow:
            '0 0 8px rgba(66,165,245,0.8), 0 0 16px rgba(66,165,245,0.35)'
        }}
      />

      {/* Bond */}
      <div
        style={{
          position: 'absolute',
          width: 11,
          height: 3,
          left: 17,
          top: 13,
          borderRadius: 10,
          background: '#90caf9'
        }}
      />

      {/* Carbon atom */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 0.8,
          delay: 0.1,
          repeat: Infinity
        }}
        style={{
          position: 'absolute',
          width: 23,
          height: 23,
          borderRadius: '50%',
          left: 27,
          top: 2,
          background:
            'radial-gradient(circle at 30% 25%, #ffc1d5, #ec407a 48%, #ad1457)',
          boxShadow:
            '0 0 9px rgba(233,30,99,0.8), 0 0 18px rgba(233,30,99,0.3)'
        }}
      />

      {/* Bond */}
      <div
        style={{
          position: 'absolute',
          width: 11,
          height: 3,
          left: 50,
          top: 13,
          borderRadius: 10,
          background: '#90caf9'
        }}
      />

      {/* Oxygen atom */}
      <motion.div
        animate={{
          scale: [1, 1.1, 1]
        }}
        transition={{
          duration: 0.8,
          delay: 0.2,
          repeat: Infinity
        }}
        style={{
          position: 'absolute',
          width: 18,
          height: 18,
          borderRadius: '50%',
          right: 0,
          top: 5,
          background:
            'radial-gradient(circle at 30% 25%, #d9ecff, #42a5f5 50%, #1565c0)',
          boxShadow:
            '0 0 8px rgba(66,165,245,0.8), 0 0 16px rgba(66,165,245,0.35)'
        }}
      />
    </motion.div>
  )
}


// ============================================================
// COLLISION EFFECT
// ============================================================
function CollisionEffect() {
  return (
    <motion.div
      className="absolute pointer-events-none z-30"
      style={{
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }}
    >
      {/* Main collision flash */}
      <motion.div
        animate={{
          scale: [0, 0.8, 1.8, 2.5, 0],
          opacity: [0, 1, 0.9, 0.35, 0]
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          repeatDelay: 0.8,
          times: [0.42, 0.47, 0.51, 0.58, 0.7],
          ease: 'easeOut'
        }}
        style={{
          position: 'absolute',
          width: 70,
          height: 70,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(129,199,132,0.7) 20%, rgba(76,175,80,0.25) 50%, transparent 72%)'
        }}
      />

      {/* Ring */}
      <motion.div
        animate={{
          scale: [0.2, 1, 2.2],
          opacity: [0, 0.9, 0]
        }}
        transition={{
          duration: 3.2,
          repeat: Infinity,
          repeatDelay: 0.8,
          times: [0.45, 0.52, 0.7]
        }}
        style={{
          position: 'absolute',
          width: 45,
          height: 45,
          borderRadius: '50%',
          border: '2px solid rgba(129,199,132,0.9)',
          boxShadow:
            '0 0 20px rgba(76,175,80,0.7)'
        }}
      />

      {/* Collision sparks */}
      {[0, 1, 2, 3, 4, 5].map((i) => {

        const angle = i * 60

        return (
          <motion.div
            key={i}
            animate={{
              x: [
                0,
                Math.cos((angle * Math.PI) / 180) * 55
              ],
              y: [
                0,
                Math.sin((angle * Math.PI) / 180) * 55
              ],
              opacity: [0, 1, 0],
              scale: [0.3, 1, 0]
            }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              repeatDelay: 0.8,
              delay: 0.01 * i,
              times: [0.45, 0.55, 0.72]
            }}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: '#c8e6c9',
              boxShadow:
                '0 0 8px #81c784'
            }}
          />
        )
      })}
    </motion.div>
  )
}


// ============================================================
// EXTRA O2 — remains after CO2 absorption
// ============================================================
function ExtraOxygen({ delay = 0, x = 0 }) {
  return (
    <motion.div
      className="absolute pointer-events-none z-25"
      style={{
        left: `calc(50% + ${x}px)`,
        top: '50%'
      }}
      initial={{
        opacity: 0,
        x: 0,
        y: 0,
        scale: 0.4
      }}
      animate={{
        opacity: [0, 1, 1, 0],
        x: [0, x * 0.4, x * 0.8],
        y: [0, -45, -115],
        scale: [0.4, 1, 0.65]
      }}
      transition={{
        duration: 2.6,
        delay,
        repeat: Infinity,
        repeatDelay: 1.2,
        ease: 'easeOut'
      }}
    >
      <div
        style={{
          width: 15,
          height: 15,
          borderRadius: '50%',
          background:
            'radial-gradient(circle at 30% 25%, #e8ffe8, #66bb6a, #2e7d32)',
          boxShadow:
            '0 0 8px rgba(76,175,80,0.9), 0 0 18px rgba(76,175,80,0.45)'
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
