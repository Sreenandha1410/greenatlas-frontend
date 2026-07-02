import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDarkMode } from '../context/DarkModeContext'
import { useState } from 'react'

const links = [
  { to: '/',        label: 'Home'    },
  { to: '/trees',   label: 'Trees'   },
  { to: '/species', label: 'Species' },
  { to: '/areas',   label: 'Areas'   },
  { to: '/map',     label: 'Map'     },
  { to: '/gallery', label: 'Gallery' },
]

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [open, setOpen] = useState(false)
  const [showThemeModal, setShowThemeModal] = useState(false)  // ← NEW

  const isLoggedIn = !!localStorage.getItem('token')
  const role       = localStorage.getItem('role')

  const handleAuth = () => {
    if (isLoggedIn) {
      localStorage.removeItem('token')
      localStorage.removeItem('role')
      navigate('/')
    } else {
      navigate('/login')
    }
  }

  return (
    <nav className="sticky top-0 z-50 shadow-md"
      style={{ background: 'linear-gradient(90deg, #1a3618, #2e5e25)' }}>
      <div className="max-w-screen-2xl mx-auto px-6 flex items-center justify-between h-16">

        <Link to="/" className="flex items-center gap-2.5">
          <img
            src="/images/logo.png"
            alt="Green Atlas Logo"
            className="h-10 w-10 object-contain"
          />
          <span className="text-white text-lg font-bold tracking-wide"
            style={{ fontFamily: 'Fraunces, serif' }}>
            Green Atlas
          </span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link to={to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === to
                    ? 'bg-white/20 text-white'
                    : 'text-green-100 hover:bg-white/10 hover:text-white'}`}>
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">

          {/* Theme button */}
          <button onClick={() => setShowThemeModal(true)}
            className="p-2 rounded-lg text-green-100 hover:bg-white/10 transition-colors text-sm font-medium"
            aria-label="Choose theme">
            🎨 Theme
          </button>

          {isLoggedIn && role === 'admin' && (
            <Link to="/admin"
              className="hidden md:block text-sm px-3 py-1.5 rounded-lg font-medium
                         text-green-100 hover:bg-white/10 transition-colors">
              Admin
            </Link>
          )}

          <button onClick={handleAuth}
            className="hidden md:block btn-primary text-sm !py-1.5">
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>

          <button onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-white" aria-label="Menu">
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden px-4 pb-4 space-y-1"
          style={{ background: '#1a3618' }}>
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
              style={{ color: '#ffffff', fontWeight: 500 }}>
              {label}
            </Link>
          ))}
          {isLoggedIn && role === 'admin' && (
            <Link to="/admin" onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg hover:bg-white/10 text-sm"
              style={{ color: '#ffffff', fontWeight: 500 }}>
              Admin Panel
            </Link>
          )}
          <button onClick={() => { handleAuth(); setOpen(false); }}
            className="block w-full text-left mt-2 btn-primary text-sm text-center">
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
        </div>
      )}

      {/* Theme Modal */}
      {showThemeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
             onClick={() => setShowThemeModal(false)}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-2xl w-72"
               onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-5">
              Choose theme
            </h3>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="theme" value="light"
                  checked={!dark}
                  onChange={() => setDark(false)}
                  className="w-5 h-5 accent-green-600" />
                <span className="text-gray-800 dark:text-gray-200 text-base">Light</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="radio" name="theme" value="dark"
                  checked={dark}
                  onChange={() => setDark(true)}
                  className="w-5 h-5 accent-green-600" />
                <span className="text-gray-800 dark:text-gray-200 text-base">Dark</span>
              </label>
            </div>
            <div className="flex justify-end mt-6">
              <button onClick={() => setShowThemeModal(false)}
                className="px-4 py-2 text-green-700 font-semibold hover:bg-green-50 rounded-lg transition-colors">
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
