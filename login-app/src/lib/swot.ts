import { supabase } from './supabase'
import { getCurrentUser } from './auth'

export type SWOTType = 'strength' | 'weakness' | 'opportunity' | 'threat'

export interface SWOTEntry {
  id?: string
  journey_id?: string
  type: SWOTType
  content: string
  notes?: string | null
  created_at?: string
  updated_at?: string
}

export interface SWOTResult {
  success: boolean
  data?: SWOTEntry | SWOTEntry[]
  error?: string
}

/**
 * Get all SWOT entries for a journey
 */
export async function getSWOTEntries(journeyId: string): Promise<SWOTResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('swot_entries')
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
 * Save or update a SWOT entry
 */
export async function saveSWOTEntry(
  journeyId: string,
  entry: { type: SWOTType; content: string; notes?: string | null; id?: string }
): Promise<SWOTResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Validate content
    if (!entry.content || entry.content.trim().length === 0) {
      return {
        success: false,
        error: 'Content cannot be empty',
      }
    }

    if (entry.id) {
      // Update existing entry
      const { data, error } = await supabase
        .from('swot_entries')
        .update({
          type: entry.type,
          content: entry.content.trim(),
          notes: entry.notes || null,
        })
        .eq('id', entry.id)
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
      // Insert new entry
      const { data, error } = await supabase
        .from('swot_entries')
        .insert({
          journey_id: journeyId,
          type: entry.type,
          content: entry.content.trim(),
          notes: entry.notes || null,
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
 * Delete a SWOT entry
 */
export async function deleteSWOTEntry(entryId: string): Promise<SWOTResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { error } = await supabase
      .from('swot_entries')
      .delete()
      .eq('id', entryId)

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


