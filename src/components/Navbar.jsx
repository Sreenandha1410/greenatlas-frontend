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

{/*
export default function Navbar() {
  const { pathname } = useLocation()
  const [dark, setDark] = useDarkMode()
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-forest-500 dark:bg-forest-900 shadow-md">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

        {/* Logo *}
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">🌳</span>
          <span className="font-display text-white text-lg font-semibold tracking-wide">
            Campus Trees
          </span>
        </Link>

        {/* Desktop links *}
        <ul className="hidden md:flex items-center gap-1">
          {links.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors
                  ${pathname === to
                    ? 'bg-white/20 text-white'
                    : 'text-forest-100 hover:bg-white/10 hover:text-white'}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Dark mode *}
          <button
            onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-forest-100 hover:bg-white/10 transition-colors"
            aria-label="Toggle dark mode"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Login *}
          <Link to="/login" className="hidden md:block btn-primary text-sm !py-1.5">
            Login
          </Link>

          {/* Mobile hamburger *}
          <button
            onClick={() => setOpen(!open)}
            className="md:hidden p-2 text-white"
            aria-label="Menu"
          >
            {open ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu *}
      {open && (
        <div className="md:hidden bg-forest-600 dark:bg-forest-900 px-4 pb-4 space-y-1">
          {links.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-md text-forest-100 hover:bg-white/10"
            >
              {label}
            </Link>
          ))}
          <Link to="/login" onClick={() => setOpen(false)}
            className="block mt-2 btn-primary text-center text-sm">
            Login
          </Link>
        </div>
      )}
    </nav>
  )
}
*/}

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate     = useNavigate()
  const [dark, setDark] = useDarkMode()
  const [open, setOpen] = useState(false)

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
          <span className="text-2xl">🌳</span>
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
          <button onClick={() => setDark(!dark)}
            className="p-2 rounded-lg text-green-100 hover:bg-white/10 transition-colors"
            aria-label="Toggle dark mode">
            {dark ? '☀️' : '🌙'}
          </button>

          {/* Show admin link only when logged in as admin */}
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

      {open && (
        <div className="md:hidden px-4 pb-4 space-y-1"
          style={{ background: '#1a3618' }}>
          {links.map(({ to, label }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-green-100 hover:bg-white/10 text-sm">
              {label}
            </Link>
          ))}
          {isLoggedIn && role === 'admin' && (
            <Link to="/admin" onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-green-100 hover:bg-white/10 text-sm">
              Admin Panel
            </Link>
          )}
          <button onClick={() => { handleAuth(); setOpen(false); }}
            className="block w-full text-left mt-2 btn-primary text-sm text-center">
            {isLoggedIn ? 'Logout' : 'Login'}
          </button>
        </div>
      )}
    </nav>
  )
}