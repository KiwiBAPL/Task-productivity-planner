import { supabase } from './supabase'
import { getCurrentUser } from './auth'

export interface WheelOfLifeArea {
  id?: string
  journey_id?: string
  label: string
  score: number // 1-10
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface WheelOfLifeResult {
  success: boolean
  data?: WheelOfLifeArea | WheelOfLifeArea[]
  error?: string
}

/**
 * Get all wheel of life areas for a journey
 */
export async function getWheelOfLifeAreas(journeyId: string): Promise<WheelOfLifeResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('wheel_of_life_areas')
      .select('*')
      .eq('journey_id', journeyId)
      .order('created_at', { ascending: true })

    if (error) {
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
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Save or update a wheel of life area
 */
export async function saveWheelOfLifeArea(
  journeyId: string,
  area: { label: string; score: number; notes?: string; id?: string }
): Promise<WheelOfLifeResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Validate score
    if (area.score < 1 || area.score > 10) {
      return {
        success: false,
        error: 'Score must be between 1 and 10',
      }
    }

    if (area.id) {
      // Update existing area
      const { data, error } = await supabase
        .from('wheel_of_life_areas')
        .update({
          label: area.label,
          score: area.score,
          notes: area.notes || null,
        })
        .eq('id', area.id)
        .eq('journey_id', journeyId)
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
    } else {
      // Insert new area
      const { data, error } = await supabase
        .from('wheel_of_life_areas')
        .insert({
          journey_id: journeyId,
          label: area.label,
          score: area.score,
          notes: area.notes || null,
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
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a wheel of life area
 */
export async function deleteWheelOfLifeArea(areaId: string): Promise<WheelOfLifeResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { error } = await supabase
      .from('wheel_of_life_areas')
      .delete()
      .eq('id', areaId)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}


