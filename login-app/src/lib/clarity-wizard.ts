import { supabase } from './supabase'
import { getCurrentUser } from './auth'

export interface ClarityJourney {
  id: string
  user_id: string
  name: string | null
  period_start: string
  period_end: string
  cover_image_url: string | null
  tools_wheel_of_life: boolean
  tools_swot: boolean
  tools_vision_board: boolean
  tools_done: boolean
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
  updates: Partial<Pick<ClarityJourney, 'name' | 'period_start' | 'period_end' | 'cover_image_url' | 'tools_wheel_of_life' | 'tools_swot' | 'tools_vision_board' | 'tools_done' | 'wheel_done' | 'swot_done' | 'vision_done' | 'big5_done' | 'status'>>
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
 * Get the next step in the journey based on completion flags
 * Order: Tools → Wheel → SWOT → Vision → Big 5 → Summary
 */
export function getNextStep(journey: ClarityJourney): string {
  const { id, tools_done, wheel_done, swot_done, vision_done, big5_done, status } = journey
  
  // If journey is completed, go to summary
  if (status === 'completed' || status === 'archived') {
    return `/clarity-wizard/${id}/summary`
  }
  
  // Follow the fixed order
  if (!tools_done) {
    return `/clarity-wizard/${id}/tools`
  }
  
  if (journey.tools_wheel_of_life && !wheel_done) {
    return `/clarity-wizard/${id}/wheel-of-life`
  }
  
  if (journey.tools_swot && !swot_done) {
    return `/clarity-wizard/${id}/swot`
  }
  
  if (journey.tools_vision_board && !vision_done) {
    return `/clarity-wizard/${id}/vision-board`
  }
  
  if (!big5_done) {
    return `/clarity-wizard/${id}/big-5`
  }
  
  // All steps complete, go to summary
  return `/clarity-wizard/${id}/summary`
}

/**
 * Get the name of the next step for display purposes
 */
export function getNextStepName(journey: ClarityJourney): string {
  const { tools_done, wheel_done, swot_done, vision_done, big5_done, status } = journey
  
  if (status === 'completed' || status === 'archived') {
    return 'Summary'
  }
  
  if (!tools_done) {
    return 'Tool Selection'
  }
  
  if (journey.tools_wheel_of_life && !wheel_done) {
    return 'Wheel of Life'
  }
  
  if (journey.tools_swot && !swot_done) {
    return 'SWOT Analysis'
  }
  
  if (journey.tools_vision_board && !vision_done) {
    return 'Vision Board'
  }
  
  if (!big5_done) {
    return 'Big 5 & OKRs'
  }
  
  return 'Summary'
}

/**
 * Mark a step as complete
 * For Big 5, this also sets the journey status to 'completed'
 */
export async function markStepComplete(
  journeyId: string,
  step: 'tools' | 'wheel' | 'swot' | 'vision' | 'big5'
): Promise<JourneyResult> {
  const updates: Partial<Pick<ClarityJourney, 'tools_done' | 'wheel_done' | 'swot_done' | 'vision_done' | 'big5_done' | 'status'>> = {}
  
  switch (step) {
    case 'tools':
      updates.tools_done = true
      break
    case 'wheel':
      updates.wheel_done = true
      break
    case 'swot':
      updates.swot_done = true
      break
    case 'vision':
      updates.vision_done = true
      break
    case 'big5':
      updates.big5_done = true
      updates.status = 'completed'
      break
  }
  
  return updateJourney(journeyId, updates)
}

