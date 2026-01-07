import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import ClarityWizardHome from './components/clarity-wizard/ClarityWizardHome'
import PastJourneyView from './components/clarity-wizard/PastJourneyView'
import DefinePeriodStep from './components/clarity-wizard/DefinePeriodStep'
import { getCurrentUser, needsProfileSetup } from './lib/auth'
import { supabase } from './lib/supabase'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const user = await getCurrentUser()
      if (user) {
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
      async (_event: string, session: any) => {
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
        <Route
          path="/clarity-wizard"
          element={
            isAuthenticated && !needsSetup ? (
              <ClarityWizardHome />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/new/period"
          element={
            isAuthenticated && !needsSetup ? (
              <DefinePeriodStep />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/:journeyId/view"
          element={
            isAuthenticated && !needsSetup ? (
              <PastJourneyView />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/:journeyId/tools"
          element={
            isAuthenticated && !needsSetup ? (
              <div className="relative w-full min-h-screen overflow-hidden">
                <div className="absolute inset-0 bg-auro-bg0">
                  <div className="absolute inset-0 gradient-radial-top-left" />
                  <div className="absolute inset-0 gradient-radial-mid-left" />
                </div>
                <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-screen">
                  <div className="glass-panel p-8 rounded-3xl text-center">
                    <h2 className="text-xl font-semibold text-auro-text-primary mb-2">Tool Selection Step</h2>
                    <p className="text-auro-text-secondary">Coming soon in Step 5</p>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        {/* Additional routes will be added as components are created:
            - /clarity-wizard/:journeyId/wheel-of-life
            - /clarity-wizard/:journeyId/swot
            - /clarity-wizard/:journeyId/vision-board
            - /clarity-wizard/:journeyId/big-5
            - /clarity-wizard/:journeyId/summary
        */}
      </Routes>
    </BrowserRouter>
  )
}

export default App

