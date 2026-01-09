import { supabase } from './supabase'
import { getCurrentUser } from './auth'
import { updateJourney } from './clarity-wizard'

export interface VisionBoardVersion {
  id?: string
  journey_id?: string
  title?: string | null
  created_at?: string
  is_current: boolean
  is_committed: boolean
}

export interface VisionBoardImage {
  id?: string
  version_id?: string
  storage_path: string
  caption?: string | null
  text_content?: string | null // HTML content for text elements
  position_index: number
  position_x?: number | null
  position_y?: number | null
  rotation?: number | null
  width?: number | null
  height?: number | null
  z_index?: number | null
  element_type?: 'image' | 'text' | 'decoration' | null
  created_at?: string
  preview_url?: string // Signed URL for display
}

export interface VisionBoardResult {
  success: boolean
  data?: VisionBoardVersion | VisionBoardVersion[] | VisionBoardImage | VisionBoardImage[] | string
  error?: string
}

/**
 * Get or create the current draft version for a journey
 */
export async function getVisionBoardVersion(journeyId: string): Promise<VisionBoardResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Try to get existing current version(s)
    // First, get all current versions to handle the case where multiple exist
    const { data: allCurrentVersions, error: fetchError } = await supabase
      .from('vision_board_versions')
      .select('*')
      .eq('journey_id', journeyId)
      .eq('is_current', true)
      .order('created_at', { ascending: false })

    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      }
    }

    // Handle multiple current versions: keep the most recent, mark others as not current
    if (allCurrentVersions && allCurrentVersions.length > 1) {
      const versionToKeep = allCurrentVersions[0] // Most recent (ordered by created_at DESC)
      const versionsToFix = allCurrentVersions.slice(1)

      // Mark other versions as not current
      const versionIdsToFix = versionsToFix.map(v => v.id).filter((id): id is string => !!id)
      if (versionIdsToFix.length > 0) {
        await supabase
          .from('vision_board_versions')
          .update({ is_current: false })
          .in('id', versionIdsToFix)
      }

      return {
        success: true,
        data: versionToKeep,
      }
    }

    // Single or no current version
    const existingVersion = allCurrentVersions && allCurrentVersions.length > 0 ? allCurrentVersions[0] : null

    if (existingVersion) {
      return {
        success: true,
        data: existingVersion,
      }
    }

    // Create new draft version if none exists
    const { data: newVersion, error: createError } = await supabase
      .from('vision_board_versions')
      .insert({
        journey_id: journeyId,
        title: null,
        is_current: true,
        is_committed: false,
      })
      .select()
      .single()

    if (createError) {
      return {
        success: false,
        error: createError.message,
      }
    }

    return {
      success: true,
      data: newVersion,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Commit a vision board version and update journey status
 */
export async function commitVisionBoardVersion(
  versionId: string,
  journeyId: string
): Promise<VisionBoardResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Mark version as committed
    const { data: committedVersion, error: commitError } = await supabase
      .from('vision_board_versions')
      .update({ is_committed: true })
      .eq('id', versionId)
      .select()
      .single()

    if (commitError) {
      return {
        success: false,
        error: commitError.message,
      }
    }

    // Update journey to mark vision board as done
    const journeyResult = await updateJourney(journeyId, { vision_done: true })
    if (!journeyResult.success) {
      return {
        success: false,
        error: journeyResult.error || 'Failed to update journey status',
      }
    }

    return {
      success: true,
      data: committedVersion,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get all images for a vision board version
 */
export async function getVisionBoardImages(versionId: string): Promise<VisionBoardResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('vision_board_images')
      .select('*')
      .eq('version_id', versionId)
      .order('position_index', { ascending: true })

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Generate signed URLs for image elements only
    const imagesWithUrls = await Promise.all(
      (data || []).map(async (image) => {
        let previewUrl: string | undefined
        if (image.element_type === 'image' || !image.element_type) {
          const urlResult = await getImageUrl(image.storage_path)
          previewUrl = urlResult.success ? (urlResult.data as string) : undefined
        }
        return {
          ...image,
          preview_url: previewUrl,
        }
      })
    )

    return {
      success: true,
      data: imagesWithUrls,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Upload an image to storage and create a database record
 */
export async function uploadVisionBoardImage(
  journeyId: string,
  versionId: string,
  file: File
): Promise<VisionBoardResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.',
      }
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File size exceeds 10MB limit.',
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${crypto.randomUUID()}.${fileExt}`
    const storagePath = `${user.id}/${journeyId}/${fileName}`

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('vision-board')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
      }
    }

    // Get current max position_index
    const { data: existingImages } = await supabase
      .from('vision_board_images')
      .select('position_index')
      .eq('version_id', versionId)
      .order('position_index', { ascending: false })
      .limit(1)

    const nextPosition = existingImages && existingImages.length > 0 
      ? existingImages[0].position_index + 1 
      : 0

    // Create database record
    const { data: imageRecord, error: dbError } = await supabase
      .from('vision_board_images')
      .insert({
        version_id: versionId,
        storage_path: storagePath,
        caption: null,
        position_index: nextPosition,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('vision-board').remove([storagePath])
      return {
        success: false,
        error: dbError.message,
      }
    }

    // Get signed URL for the uploaded image
    const urlResult = await getImageUrl(storagePath)
    const imageWithUrl = {
      ...imageRecord,
      preview_url: urlResult.success ? (urlResult.data as string) : undefined,
    }

    return {
      success: true,
      data: imageWithUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Update an image's caption, position, or layout properties
 */
export async function updateVisionBoardImage(
  imageId: string,
  updates: { 
    caption?: string | null
    text_content?: string | null
    position_index?: number
    position_x?: number | null
    position_y?: number | null
    rotation?: number | null
    width?: number | null
    height?: number | null
    z_index?: number | null
    element_type?: 'image' | 'text' | 'decoration' | null
  }
): Promise<VisionBoardResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    const { data, error } = await supabase
      .from('vision_board_images')
      .update(updates)
      .eq('id', imageId)
      .select()
      .single()

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    // Get signed URL (only for image elements)
    let previewUrl: string | undefined
    if (data.element_type === 'image' || !data.element_type) {
      const urlResult = await getImageUrl(data.storage_path)
      previewUrl = urlResult.success ? (urlResult.data as string) : undefined
    }

    const imageWithUrl = {
      ...data,
      preview_url: previewUrl,
    }

    return {
      success: true,
      data: imageWithUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Delete an image from storage and database
 */
export async function deleteVisionBoardImage(imageId: string): Promise<VisionBoardResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Get image record to get storage path and element type
    const { data: image, error: fetchError } = await supabase
      .from('vision_board_images')
      .select('storage_path, element_type')
      .eq('id', imageId)
      .single()

    if (fetchError) {
      return {
        success: false,
        error: fetchError.message,
      }
    }

    // Delete from database first
    const { error: dbError } = await supabase
      .from('vision_board_images')
      .delete()
      .eq('id', imageId)

    if (dbError) {
      return {
        success: false,
        error: dbError.message,
      }
    }

    // Delete from storage only for image elements (text elements don't have storage files)
    if (image.element_type === 'image' || !image.element_type) {
      const { error: storageError } = await supabase.storage
        .from('vision-board')
        .remove([image.storage_path])

      if (storageError) {
        console.error('Failed to delete storage file:', storageError)
        // Don't fail the whole operation if storage deletion fails
        // The database record is already deleted
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
 * Create a text element on the vision board
 */
export async function createVisionBoardText(
  _journeyId: string,
  versionId: string,
  textContent: string
): Promise<VisionBoardResult> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated',
      }
    }

    // Get current max position_index
    const { data: existingElements } = await supabase
      .from('vision_board_images')
      .select('position_index')
      .eq('version_id', versionId)
      .order('position_index', { ascending: false })
      .limit(1)

    const nextPosition = existingElements && existingElements.length > 0 
      ? existingElements[0].position_index + 1 
      : 0

    // Create database record for text element
    // For text elements, we use a placeholder storage_path since it's required by the schema
    // but not actually used for text elements
    const { data: textRecord, error: dbError } = await supabase
      .from('vision_board_images')
      .insert({
        version_id: versionId,
        storage_path: `text/${crypto.randomUUID()}.txt`, // Placeholder path
        text_content: textContent,
        caption: null,
        position_index: nextPosition,
        element_type: 'text',
      })
      .select()
      .single()

    if (dbError) {
      return {
        success: false,
        error: dbError.message,
      }
    }

    return {
      success: true,
      data: textRecord,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}

/**
 * Get a signed URL for an image in storage
 */
export async function getImageUrl(storagePath: string): Promise<VisionBoardResult> {
  try {
    const { data, error } = await supabase.storage
      .from('vision-board')
      .createSignedUrl(storagePath, 3600) // 1 hour expiry

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    return {
      success: true,
      data: data.signedUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'An unexpected error occurred',
    }
  }
}
