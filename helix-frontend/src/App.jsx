import { useEffect } from 'react'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import AppRouter from './routes/index'
import { Toaster } from './components/ui/sonner'
import { applyStoredAppearance } from './lib/utils'

/**
 * HELIX Application Root
 * Wraps the entire app with the Redux Provider and renders the router.
 */
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
