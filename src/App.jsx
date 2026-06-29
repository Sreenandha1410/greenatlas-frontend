import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import TreeList from './pages/TreeList';
import TreeDetail from './pages/TreeDetail';
import SpeciesList from './pages/SpeciesList';
import AreaList from './pages/AreaList';
import MapPage from './pages/MapPage';
import Login from './pages/Login';
import Admin from './pages/Admin';
import SpeciesDetail from './pages/SpeciesDetail';
import AreaDetail from './pages/AreaDetail';
import Gallery from './pages/Gallery';
import { AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import PageTransition from './components/PageTransition'
import { useEffect } from 'react'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  return null
}

export default function App() {
  const location = useLocation()
  return (
    <>
      <Navbar />
      <ScrollToTop />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/trees" element={<PageTransition><TreeList /></PageTransition>} />
          <Route path="/trees/:id" element={<PageTransition><TreeDetail /></PageTransition>} />
          <Route path="/species" element={<PageTransition><SpeciesList /></PageTransition>} />
          <Route path="/species/:id" element={<PageTransition><SpeciesDetail /></PageTransition>} />
          <Route path="/areas" element={<PageTransition><AreaList /></PageTransition>} />
          <Route path="/areas/:area" element={<PageTransition><AreaDetail /></PageTransition>} />
          <Route path="/map" element={<PageTransition><MapPage /></PageTransition>} />
          <Route path="/gallery" element={<PageTransition><Gallery /></PageTransition>} />
          <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
          <Route path="/admin" element={<PageTransition><Admin /></PageTransition>} />
        </Routes>
      </AnimatePresence>
    </>
  )
}