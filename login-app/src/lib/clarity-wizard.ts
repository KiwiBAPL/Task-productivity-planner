import { supabase } from './supabase'
import { getCurrentUser } from './auth'

export interface ClarityJourney {
  id: string
  user_id: string
  name: string | null
  period_start: string
  period_end: string
  cover_image_url: string | null
  wheel_done: boolean
  swot_done: boolean
  vision_done: boolean
  big5_done: boolean
  status: 'draft' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface JourneyResult {
  success: boolean
  data?: ClarityJourney | ClarityJourney[]
  error?: string
}

/**
 * Get the current active journey for the user (draft or completed, not archived)
 */
export async function getActiveJourney(userId?: string): Promise<JourneyResult> {
  try {
    console.log('getActiveJourney called with userId:', userId)
    
    // If userId not provided, get it from current user
    let userIdToUse = userId
    if (!userIdToUse) {
      const user = await getCurrentUser()
      userIdToUse = user?.id
    }
    
    if (!userIdToUse) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    console.log('Querying clarity_journeys for user:', userIdToUse)
    
    // Add timeout to prevent hanging
    const queryPromise = supabase
      .from('clarity_journeys')
      .select('*')
      .eq('user_id', userIdToUse)
      .in('status', ['draft', 'completed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: { message: 'Query timeout after 8 seconds', code: 'TIMEOUT' },
        })
      }, 8000)
    })

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    console.log('Supabase query result:', { data, error })

    if (error) {
      console.error('Supabase error:', error)
      // If table doesn't exist, return empty result instead of error
      if (error.code === 'PGRST116' || error.code === 'TIMEOUT' || error.message.includes('does not exist')) {
        return {
          success: true,
          data: undefined,
        }
      }
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data || undefined,
    }
  } catch (error) {
    console.error('Exception in getActiveJourney:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get all past journeys (archived or completed) for the user
 */
export async function getPastJourneys(userId?: string): Promise<JourneyResult> {
  try {
    console.log('getPastJourneys called with userId:', userId)
    
    // If userId not provided, get it from current user
    let userIdToUse = userId
    if (!userIdToUse) {
      const user = await getCurrentUser()
      userIdToUse = user?.id
    }
    
    if (!userIdToUse) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    console.log('Querying past journeys for user:', userIdToUse)
    
    // Add timeout to prevent hanging
    const queryPromise = supabase
      .from('clarity_journeys')
      .select('*')
      .eq('user_id', userIdToUse)
      .eq('status', 'archived')
      .order('created_at', { ascending: false })

    const timeoutPromise = new Promise<{ data: null; error: { message: string; code: string } }>((resolve) => {
      setTimeout(() => {
        resolve({
          data: null,
          error: { message: 'Query timeout after 8 seconds', code: 'TIMEOUT' },
        })
      }, 8000)
    })

    const { data, error } = await Promise.race([queryPromise, timeoutPromise])

    console.log('Past journeys query result:', { data, error })

    if (error) {
      console.error('Supabase error (past journeys):', error)
      // If table doesn't exist, return empty array instead of error
      if (error.code === 'PGRST116' || error.code === 'TIMEOUT' || error.message.includes('does not exist')) {
        return {
          success: true,
          data: [],
        }
      }
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Exception in getPastJourneys:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get a specific journey by ID
 */
export async function getJourneyById(journeyId: string): Promise<JourneyResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('clarity_journeys')
      .select('*')
      .eq('id', journeyId)
      .eq('user_id', user.id)
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Create a new journey
 */
export async function createJourney(
  periodStart: string,
  periodEnd: string,
  name?: string
): Promise<JourneyResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Check if user already has an active journey
    const activeJourney = await getActiveJourney()
    if (activeJourney.success && activeJourney.data) {
      return {
        success: false,
        error: 'You already have an active journey. Please close it before creating a new one.',
      }
    }

    const { data, error } = await supabase
      .from('clarity_journeys')
      .insert({
        user_id: user.id,
        name: name || null,
        period_start: periodStart,
        period_end: periodEnd,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Update a journey
 */
export async function updateJourney(
  journeyId: string,
  updates: Partial<Pick<ClarityJourney, 'name' | 'period_start' | 'period_end' | 'cover_image_url' | 'wheel_done' | 'swot_done' | 'vision_done' | 'big5_done' | 'status'>>
): Promise<JourneyResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('clarity_journeys')
      .update(updates)
      .eq('id', journeyId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Archive (close) a journey
 */
export async function archiveJourney(journeyId: string): Promise<JourneyResult> {
  return updateJourney(journeyId, { status: 'archived' })
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  })
}

/**
 * Calculate months between two dates
 */
export function calculateMonths(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return 0
  }
  if (end < start) {
    return 0
  }
  // Inclusive month count: Jan 1 to Dec 31 => 12 months, Jan 1 to Jan 1 => 1 month
  const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1
  return Math.max(1, months)
}

/**
 * Get the next step in the journey - simple linear flow
 * Flow: Period → Tools → Wheel of Life → SWOT → Vision Board → Big 5 → Summary
 */
export function getNextStep(journey: ClarityJourney, currentStep?: string): string {
  const { id, status } = journey
  
  // If journey is completed/archived, go to summary
  if (status === 'completed' || status === 'archived') {
    return `/clarity-wizard/${id}/summary`
  }
  
  // Simple linear progression based on current step
  switch (currentStep) {
    case 'period':
      return `/clarity-wizard/${id}/tools`
    case 'tools':
      return `/clarity-wizard/${id}/wheel-of-life`
    case 'wheel-of-life':
      return `/clarity-wizard/${id}/swot`
    case 'swot':
      return `/clarity-wizard/${id}/vision-board`
    case 'vision-board':
      return `/clarity-wizard/${id}/big-5`
    case 'big-5':
      return `/clarity-wizard/${id}/summary`
    default:
      // Default to tools if unknown step
      return `/clarity-wizard/${id}/tools`
  }
}


/**
 * Get the previous step in the journey - simple linear flow
 * Used for Back button navigation
 */
export function getPreviousStep(journey: ClarityJourney, currentStep: string): string {
  const { id } = journey
  
  switch (currentStep) {
    case 'tools':
      return `/clarity-wizard/${id}/period`
    case 'wheel-of-life':
      return `/clarity-wizard/${id}/tools`
    case 'swot':
      return `/clarity-wizard/${id}/wheel-of-life`
    case 'vision-board':
      return `/clarity-wizard/${id}/swot`
    case 'big-5':
      return `/clarity-wizard/${id}/vision-board`
    default:
      return `/clarity-wizard/${id}/period`
  }
}



