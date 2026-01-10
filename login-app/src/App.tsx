import { useEffect, useState } from 'react'
// #region agent log
fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:1',message:'App.tsx loading',data:{},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
// #endregion
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
import { useToast } from './hooks/useToast'
// #region agent log
fetch('http://127.0.0.1:7242/ingest/2d17eab2-d1b0-4bfa-8292-fc3e189d183d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'App.tsx:16',message:'useToast import successful',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
// #endregion

// Create a context for the toast
import { createContext, useContext } from 'react'
import { ToastType } from './components/Toast'

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useAppToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useAppToast must be used within ToastProvider')
  }
  return context
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const { showToast, ToastContainer } = useToast()

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
    <ToastContext.Provider value={{ showToast }}>
      <BrowserRouter>
        <ToastContainer />
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
    </ToastContext.Provider>
  )
}

export default App

