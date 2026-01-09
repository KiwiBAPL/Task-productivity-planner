import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginScreen from './components/LoginScreen'
import Dashboard from './components/Dashboard'
import ClarityWizardHome from './components/clarity-wizard/ClarityWizardHome'
import PastJourneyView from './components/clarity-wizard/PastJourneyView'
import DefinePeriodStep from './components/clarity-wizard/DefinePeriodStep'
import ToolSelectionStep from './components/clarity-wizard/ToolSelectionStep'
import WheelOfLifeStep from './components/clarity-wizard/WheelOfLifeStep'
import SWOTStep from './components/clarity-wizard/SWOTStep'
import VisionBoardStep from './components/clarity-wizard/VisionBoardStep'
import Big5Step from './components/clarity-wizard/Big5Step'
import SummaryView from './components/clarity-wizard/SummaryView'
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
          path="/clarity-wizard/:journeyId/period"
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
              <ToolSelectionStep />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/:journeyId/wheel-of-life"
          element={
            isAuthenticated && !needsSetup ? (
              <WheelOfLifeStep />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/:journeyId/swot"
          element={
            isAuthenticated && !needsSetup ? (
              <SWOTStep />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/:journeyId/vision-board"
          element={
            isAuthenticated && !needsSetup ? (
              <VisionBoardStep />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/:journeyId/big-5"
          element={
            isAuthenticated && !needsSetup ? (
              <Big5Step />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/clarity-wizard/:journeyId/summary"
          element={
            isAuthenticated && !needsSetup ? (
              <SummaryView />
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

