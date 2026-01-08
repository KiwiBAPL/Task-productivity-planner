import { useState, useEffect } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { getCurrentUser, clearUserCache } from '../lib/auth'

interface UseAuthReturn {
  userId: string | null
  user: User | null
  isLoading: boolean
  error: string | null
}

/**
 * Centralized authentication hook that provides user data and loading state.
 * Uses getCurrentUser() pattern proven to work in Dashboard component.
 * Includes auth state listener for reactive updates.
 */
export function useAuth(): UseAuthReturn {
  const [userId, setUserId] = useState<string | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true

    // Safety timeout to avoid indefinite loading if Supabase hangs
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn('useAuth: safety timeout reached, forcing loading=false')
        setIsLoading(false)
      }
    }, 8000)

    // Initial load
    async function loadUser() {
      try {
        const currentUser = await getCurrentUser()
        if (currentUser) {
          if (!isMounted) return
          setUser(currentUser)
          setUserId(currentUser.id)
        } else {
          if (!isMounted) return
          setUser(null)
          setUserId(null)
        }
        if (isMounted) {
          setError(null)
        }
      } catch (err) {
        console.error('Error loading user in useAuth:', err)
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Failed to load user')
        setUser(null)
        setUserId(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event)
        
        // Clear cache on auth state changes to ensure fresh data
        clearUserCache()
        
        if (!isMounted) return

        if (session?.user) {
          setUser(session.user)
          setUserId(session.user.id)
          setError(null)
        } else {
          setUser(null)
          setUserId(null)
        }
        
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
      isMounted = false
      clearTimeout(safetyTimeout)
    }
  }, [])

  return { userId, user, isLoading, error }
}

