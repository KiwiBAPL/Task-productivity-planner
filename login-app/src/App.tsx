import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import { getSession, needsProfileSetup } from './lib/auth'
import { supabase } from './lib/supabase'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const session = await getSession()
      if (session) {
        setIsAuthenticated(true)
        const setupNeeded = await needsProfileSetup()
        setNeedsSetup(setupNeeded)
      } else {
        setIsAuthenticated(false)
      }
    }
    checkAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: string, session: any) => {
        if (session) {
          setIsAuthenticated(true)
          const setupNeeded = await needsProfileSetup()
          setNeedsSetup(setupNeeded)
        } else {
          setIsAuthenticated(false)
          setNeedsSetup(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (isAuthenticated === null) {
    // Loading state
    return (
      <div className="w-full min-h-screen bg-auro-bg0 flex items-center justify-center">
        <div className="text-auro-text-secondary">Loading...</div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthenticated && !needsSetup ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginScreen />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthenticated && !needsSetup ? (
              <Dashboard />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

