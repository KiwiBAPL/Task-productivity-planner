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
import ComingSoon from './components/ComingSoon'
import { getCurrentUser, needsProfileSetup } from './lib/auth'
import { supabase } from './lib/supabase'
import { useToast } from './hooks/useToast'

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
        {/* Coming Soon Pages */}
        <Route
          path="/notifications"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Notifications"
                description="Stay updated with real-time notifications about your tasks, team activity, and important updates."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/chat"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Chat"
                description="Collaborate with your team through integrated chat messaging and real-time communication."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/files"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Files"
                description="Manage and share documents, images, and files related to your projects and planning."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/team"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Team"
                description="Invite team members, manage permissions, and collaborate on shared planning spaces."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/analytics"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Analytics"
                description="Gain insights into your productivity, goal progress, and planning effectiveness with detailed analytics."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/help"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Help"
                description="Access documentation, tutorials, and support resources to get the most out of your planning space."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/settings"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Settings"
                description="Customize your experience with app preferences, notifications settings, and account management."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/integrations"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Integrations"
                description="Connect with your favorite tools and services to streamline your workflow."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                }
              />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/apps"
          element={
            isAuthenticated && !needsSetup ? (
              <ComingSoon
                title="Apps"
                description="Discover and install additional apps to extend your planning capabilities."
                icon={
                  <svg className="w-10 h-10 text-auro-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                }
              />
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

