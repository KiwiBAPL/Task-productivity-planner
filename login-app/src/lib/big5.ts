import { supabase } from './supabase'
import { getCurrentUser } from './auth'

export type MetricType = 'boolean' | 'number' | 'percentage' | 'other'

export interface Big5Bucket {
  id?: string
  journey_id?: string
  order_index: number // 0-4
  title: string
  statement: string
  created_at?: string
  updated_at?: string
}

export interface Big5OKR {
  id?: string
  bucket_id?: string
  order_index: number // 0-2
  description: string
  metric_type: MetricType
  target_value_number?: number | null
  target_value_text?: string | null
  created_at?: string
  updated_at?: string
}

export interface Big5BucketWithOKRs extends Big5Bucket {
  okrs: Big5OKR[]
}

export interface Big5Result {
  success: boolean
  data?: Big5Bucket | Big5Bucket[] | Big5BucketWithOKRs | Big5BucketWithOKRs[]
  error?: string
}

export interface OKRResult {
  success: boolean
  data?: Big5OKR | Big5OKR[]
  error?: string
}

/**
 * Get all Big 5 buckets with their OKRs for a journey
 */
export async function getBig5Buckets(journeyId: string): Promise<Big5Result> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Get buckets
    const { data: buckets, error: bucketsError } = await supabase
      .from('big5_buckets')
      .select('*')
      .eq('journey_id', journeyId)
      .order('order_index', { ascending: true })

    if (bucketsError) {
      return {
        success: false,
        error: bucketsError.message,
      }
    }

    if (!buckets || buckets.length === 0) {
      return {
        success: true,
        data: [],
      }
    }

    // Get all OKRs for these buckets
    const bucketIds = buckets.map((b) => b.id)
    const { data: okrs, error: okrsError } = await supabase
      .from('big5_okrs')
      .select('*')
      .in('bucket_id', bucketIds)
      .order('order_index', { ascending: true })

    if (okrsError) {
      return {
        success: false,
        error: okrsError.message,
      }
    }

    // Combine buckets with their OKRs
    const bucketsWithOKRs: Big5BucketWithOKRs[] = buckets.map((bucket) => ({
      ...bucket,
      okrs: okrs?.filter((okr) => okr.bucket_id === bucket.id) || [],
    }))

    return {
      success: true,
      data: bucketsWithOKRs,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Save or update a Big 5 bucket
 */
export async function saveBig5Bucket(
  journeyId: string,
  bucket: { order_index: number; title: string; statement: string; id?: string }
): Promise<Big5Result> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Validate order_index
    if (bucket.order_index < 0 || bucket.order_index > 4) {
      return {
        success: false,
        error: 'Order index must be between 0 and 4',
      }
    }

    // Validate title and statement
    if (!bucket.title || bucket.title.trim().length === 0) {
      return {
        success: false,
        error: 'Title cannot be empty',
      }
    }

    if (!bucket.statement || bucket.statement.trim().length < 10) {
      return {
        success: false,
        error: 'Statement must be at least 10 characters',
      }
    }

    if (bucket.id) {
      // Update existing bucket
      const { data, error } = await supabase
        .from('big5_buckets')
        .update({
          order_index: bucket.order_index,
          title: bucket.title.trim(),
          statement: bucket.statement.trim(),
        })
        .eq('id', bucket.id)
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
      // Insert new bucket
      const { data, error } = await supabase
        .from('big5_buckets')
        .insert({
          journey_id: journeyId,
          order_index: bucket.order_index,
          title: bucket.title.trim(),
          statement: bucket.statement.trim(),
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
 * Delete a Big 5 bucket (and cascade delete OKRs)
 */
export async function deleteBig5Bucket(bucketId: string): Promise<Big5Result> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { error } = await supabase
      .from('big5_buckets')
      .delete()
      .eq('id', bucketId)

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

/**
 * Save or update an OKR
 */
export async function saveBig5OKR(
  bucketId: string,
  okr: {
    order_index: number
    description: string
    metric_type: MetricType
    target_value_number?: number | null
    target_value_text?: string | null
    id?: string
  }
): Promise<OKRResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Validate description
    if (!okr.description || okr.description.trim().length === 0) {
      return {
        success: false,
        error: 'Description cannot be empty',
      }
    }

    if (okr.id) {
      // Update existing OKR
      const { data, error } = await supabase
        .from('big5_okrs')
        .update({
          order_index: okr.order_index,
          description: okr.description.trim(),
          metric_type: okr.metric_type,
          target_value_number: okr.target_value_number,
          target_value_text: okr.target_value_text,
        })
        .eq('id', okr.id)
        .eq('bucket_id', bucketId)
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
      // Insert new OKR
      const { data, error } = await supabase
        .from('big5_okrs')
        .insert({
          bucket_id: bucketId,
          order_index: okr.order_index,
          description: okr.description.trim(),
          metric_type: okr.metric_type,
          target_value_number: okr.target_value_number,
          target_value_text: okr.target_value_text,
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
 * Delete an OKR
 */
export async function deleteBig5OKR(okrId: string): Promise<OKRResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { error } = await supabase
      .from('big5_okrs')
      .delete()
      .eq('id', okrId)

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
