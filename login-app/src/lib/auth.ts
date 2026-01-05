import { z } from 'zod'
import { supabase } from './supabase'
import type { AvatarPreset } from '../components/avatars/PresetAvatars'

// Password validation schema
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Email validation schema
export const emailSchema = z.string().email('Invalid email address')

// Sign up schema
export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

export interface AuthError {
  message: string
  field?: string
}

export interface AuthResult {
  success: boolean
  error?: AuthError
  data?: any
}

/**
 * Sign up a new user with email and password
 */
export async function signUp(
  email: string,
  password: string,
  confirmPassword: string
): Promise<AuthResult> {
  try {
    // Validate input
    const validationResult = signUpSchema.safeParse({
      email,
      password,
      confirmPassword,
    })

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0]
      return {
        success: false,
        error: {
          message: firstError.message,
          field: firstError.path[0] as string,
        },
      }
    }

    // Attempt sign up with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      },
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
        },
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Validate email
    const emailValidation = emailSchema.safeParse(email)
    if (!emailValidation.success) {
      return {
        success: false,
        error: {
          message: 'Invalid email address',
          field: 'email',
        },
      }
    }

    if (!password) {
      return {
        success: false,
        error: {
          message: 'Password is required',
          field: 'password',
        },
      }
    }

    // Attempt sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
        },
      }
    }

    return {
      success: true,
      data,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<AuthResult> {
  try {
    const { error } = await supabase.auth.signOut()

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

/**
 * Get the current user session
 */
export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  
  if (error) {
    console.error('Error getting session:', error)
    return null
  }
  
  return data.session
}

/**
 * Get the current user
 */
export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Error getting user:', error)
    return null
  }
  
  return data.user
}

/**
 * Check if the current user's profile needs to be completed
 */
export async function needsProfileSetup(): Promise<boolean> {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return false
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error checking profile:', error)
      return false
    }

    // Profile needs setup if first_name or last_name is null or empty
    return !data?.first_name || !data?.last_name
  } catch (error) {
    console.error('Error checking profile setup:', error)
    return false
  }
}

export interface AvatarData {
  type: 'preset' | 'upload'
  preset?: AvatarPreset
  file?: File
}

/**
 * Update the current user's profile with first name, last name, and avatar
 */
export async function updateProfile(
  firstName: string,
  lastName: string,
  avatar?: AvatarData
): Promise<AuthResult> {
  try {
    // Validate input
    if (!firstName || !firstName.trim()) {
      return {
        success: false,
        error: {
          message: 'First name is required',
          field: 'firstName',
        },
      }
    }

    if (!lastName || !lastName.trim()) {
      return {
        success: false,
        error: {
          message: 'Last name is required',
          field: 'lastName',
        },
      }
    }

    const user = await getCurrentUser()
    if (!user) {
      return {
        success: false,
        error: {
          message: 'User not authenticated',
        },
      }
    }

    let avatarUrl: string | null = null
    let avatarType: 'preset' | 'upload' | null = null
    let avatarPreset: string | null = null

    // Handle avatar
    if (avatar) {
      avatarType = avatar.type

      if (avatar.type === 'preset' && avatar.preset) {
        avatarPreset = avatar.preset
      } else if (avatar.type === 'upload' && avatar.file) {
        // Upload file to Supabase storage
        // Path format: avatars/{user_id}/{filename}
        const fileExt = avatar.file.name.split('.').pop()
        const fileName = `${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Upload file
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, avatar.file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          return {
            success: false,
            error: {
              message: `Failed to upload avatar: ${uploadError.message}`,
            },
          }
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = urlData.publicUrl
      }
    }

    // Update profile
    const updateData: {
      first_name: string
      last_name: string
      updated_at: string
      avatar_type?: string | null
      avatar_preset?: string | null
      avatar_url?: string | null
    } = {
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      updated_at: new Date().toISOString(),
    }

    if (avatar) {
      updateData.avatar_type = avatarType
      updateData.avatar_preset = avatarPreset
      updateData.avatar_url = avatarUrl
    }

    const { error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    if (error) {
      return {
        success: false,
        error: {
          message: error.message,
        },
      }
    }

    return {
      success: true,
    }
  } catch (error) {
    return {
      success: false,
      error: {
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    }
  }
}

