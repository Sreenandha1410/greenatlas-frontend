import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GoToTop() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          whileHover={{ scale: 1.1 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full shadow-lg
           flex items-center justify-center text-white
           text-3xl font-extrabold leading-none
           hover:scale-110 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #2d5a27, #4caf50)',
            boxShadow: '0 4px 20px rgba(45,90,39,0.5)'
          }}>
          ⬆
        </motion.button>
      )}
    </AnimatePresence>
  )
}
