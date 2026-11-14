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
import { useEffect, useCallback } from 'react'
import { recordView } from './api'
import About from './pages/About';
import GoToTop from './components/GoToTop'
import LocationEditorPage from './pages/LocationEditorPage';

function getSafeDeviceInfo() {
  const ua = navigator.userAgent || '';
  let device_type = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device_type = 'tablet';
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|windows phone/i.test(ua)) {
    device_type = 'mobile';
  }

  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/mac os x|macintosh/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';

  return { device_type, os, browser };
}

function ScrollToTop() {
  const { pathname } = useLocation();

  // Scroll to top on every navigation
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Record 1 visit per visitor session (NOT on every internal route click)
  useEffect(() => {
    const sessionKey = 'ga_visit_logged';
    if (!sessionStorage.getItem(sessionKey)) {
      sessionStorage.setItem(sessionKey, '1');

      const isQR = pathname.startsWith('/trees/') || window.location.search.includes('qr');
      const source = isQR ? 'qr' : 'web';
      const { device_type, os, browser } = getSafeDeviceInfo();

      recordView({
        path: pathname,
        source,
        device_type,
        os,
        browser,
      }).catch(() => {});
    }
  }, []);

  return null;
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
          <Route path="/about" element={<PageTransition><About /></PageTransition>} />
          <Route path="/admin/map-editor" element={<LocationEditorPage />}/>
        </Routes>
      </AnimatePresence>
      <GoToTop /> 
    </>
  )
}
