import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import AppRouter from './routes/index'
import { Toaster } from './components/ui/sonner'

/**
 * HELIX Application Root
 * Wraps the entire app with the Redux Provider and renders the router.
 * The Phase 0 health-check page has been replaced with the full router.
 */
const ACCENT_PALETTES = {
  royal: { blue: '#3D6BC5', dark: '#2E56A8', light: '#5582D4' },
  cyan: { blue: '#0284C7', dark: '#0369A1', light: '#38BDF8' },
  indigo: { blue: '#4F46E5', dark: '#4338CA', light: '#818CF8' },
  teal: { blue: '#0D9488', dark: '#0F766E', light: '#2DD4BF' },
}

export function applyStoredAppearance() {
  const root = document.documentElement

  // 1. Theme mode (light / dark)
  const theme = localStorage.getItem('theme') || 'light'
  if (theme === 'dark') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  // 2. Accent palette
  const accentKey = localStorage.getItem('helix_accent') || 'royal'
  const palette = ACCENT_PALETTES[accentKey] || ACCENT_PALETTES.royal
  root.style.setProperty('--color-blue', palette.blue)
  root.style.setProperty('--color-blue-dark', palette.dark)
  root.style.setProperty('--color-blue-light', palette.light)

  // 3. Interface font scale / density
  const fontScale = localStorage.getItem('helix_font_scale') || '15px'
  if (['14px', '15px', '16px'].includes(fontScale)) {
    root.style.fontSize = fontScale
  }

  // 4. Reduced motion preference
  const reducedMotion = localStorage.getItem('helix_reduced_motion') === 'true'
  if (reducedMotion) {
    root.classList.add('reduce-motion')
  } else {
    root.classList.remove('reduce-motion')
  }
}

export default function App() {
  useEffect(() => {
    applyStoredAppearance()

    // Handle bfcache restoration: if user logged out and hit browser Back, redirect to login
    const handlePageShow = () => {
      if (!localStorage.getItem('helix_access_token')) {
        const publicPaths = ['/', '/login', '/forgot-password', '/reset-password', '/register/apply']
        if (!publicPaths.includes(window.location.pathname)) {
          window.location.replace('/login')
        }
      }
    }
    window.addEventListener('pageshow', handlePageShow)
    return () => window.removeEventListener('pageshow', handlePageShow)
  }, [])

  return (
    <Provider store={store}>
      <AppRouter />
      <Toaster position="top-right" richColors />
    </Provider>
  )
}
