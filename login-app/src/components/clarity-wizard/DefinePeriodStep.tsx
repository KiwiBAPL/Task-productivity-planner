import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAutosave } from '../../hooks/useAutosave'
import { createJourney, updateJourney, getActiveJourney, getJourneyById, getNextStep, type ClarityJourney } from '../../lib/clarity-wizard'
import { supabase } from '../../lib/supabase'
import { getCurrentUser } from '../../lib/auth'
import { SkeletonForm } from '../SkeletonLoader'

interface PeriodData {
  name: string
  periodStart: string
  periodEnd: string
}

const PRESET_MONTHS = [3, 6, 12] as const

function formatDateForInput(date: Date): string {
  return date.toISOString().split('T')[0]
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date)
  result.setMonth(result.getMonth() + months)
  return result
}

function calculateMonthsDiff(start: Date, end: Date): number {
  // Calculate based on actual days for accurate month representation
  const startTime = start.getTime()
  const endTime = end.getTime()
  const daysDiff = (endTime - startTime) / (1000 * 60 * 60 * 24)
  
  // Average days in a month (365.25 / 12)
  const avgDaysPerMonth = 30.4375
  const months = Math.round(daysDiff / avgDaysPerMonth)
  
  return Math.max(1, months)
}

export default function DefinePeriodStep() {
  const navigate = useNavigate()
  const { journeyId: urlJourneyId } = useParams<{ journeyId?: string }>()
  
  // Initialize with today and 12 months from now
  const today = useMemo(() => new Date(), [])
  const defaultStart = formatDateForInput(today)
  const defaultEnd = formatDateForInput(addMonths(today, 12))
  
  // Form state
  const [name, setName] = useState('')
  const [periodStart, setPeriodStart] = useState(defaultStart)
  const [periodEnd, setPeriodEnd] = useState(defaultEnd)
  
  // Journey state
  const [journeyId, setJourneyId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Image state
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageError, setImageError] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Validation state
  const [validationError, setValidationError] = useState<string>('')

  // Check for existing journey on mount
  useEffect(() => {
    async function loadExistingJourney() {
      setIsLoading(true)
      try {
        // If journeyId is in URL, load that specific journey
        if (urlJourneyId) {
          const result = await getJourneyById(urlJourneyId)
          if (result.success && result.data) {
            const loadedJourney = result.data as ClarityJourney
            console.log('📦 [DefinePeriodStep] Journey loaded from database:', loadedJourney.id)
            setJourneyId(loadedJourney.id)
            setName(loadedJourney.name || '')
            setPeriodStart(loadedJourney.period_start)
            setPeriodEnd(loadedJourney.period_end)
            setCoverImageUrl(loadedJourney.cover_image_url || null)
            setImagePreview(loadedJourney.cover_image_url || null)
          }
        } else {
          // Otherwise, check for active draft
          const result = await getActiveJourney()
          if (result.success && result.data) {
            const loadedJourney = result.data as ClarityJourney
            console.log('📦 [DefinePeriodStep] Active journey loaded from database:', loadedJourney.id)
            if (loadedJourney.status === 'draft') {
              setJourneyId(loadedJourney.id)
              setName(loadedJourney.name || '')
              setPeriodStart(loadedJourney.period_start)
              setPeriodEnd(loadedJourney.period_end)
              setCoverImageUrl(loadedJourney.cover_image_url || null)
              setImagePreview(loadedJourney.cover_image_url || null)
            }
          }
        }
      } catch (err) {
        console.error('Error loading journey:', err)
      } finally {
        setIsLoading(false)
      }
    }
    loadExistingJourney()
  }, [urlJourneyId])

  // Validate dates
  useEffect(() => {
    const start = new Date(periodStart)
    const end = new Date(periodEnd)
    
    if (end <= start) {
      setValidationError('End date must be after start date')
      return
    }
    
    const monthsDiff = calculateMonthsDiff(start, end)
    if (monthsDiff > 24) {
      setValidationError('Focus period cannot exceed 24 months')
      return
    }
    
    if (monthsDiff < 1) {
      setValidationError('Focus period must be at least 1 month')
      return
    }
    
    setValidationError('')
  }, [periodStart, periodEnd])

  // Autosave hook for updating existing journey
  const { save: autosave, isSaving } = useAutosave<PeriodData>(
    async (data) => {
      if (!journeyId) return
      
      const result = await updateJourney(journeyId, {
        name: data.name || null,
        period_start: data.periodStart,
        period_end: data.periodEnd,
      })
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save')
      }
    },
    { debounceMs: 500 }
  )

  // Trigger autosave when form data changes (only if we have a journey ID)
  useEffect(() => {
    if (journeyId && !validationError) {
      autosave({ name, periodStart, periodEnd })
    }
  }, [name, periodStart, periodEnd, journeyId, validationError, autosave])

  function handlePresetClick(months: number) {
    const start = new Date(periodStart)
    const newEnd = addMonths(start, months)
    setPeriodEnd(formatDateForInput(newEnd))
  }

  function getActivePreset(): number | null {
    const start = new Date(periodStart)
    const end = new Date(periodEnd)
    const months = calculateMonthsDiff(start, end)
    
    if (PRESET_MONTHS.includes(months as typeof PRESET_MONTHS[number])) {
      return months
    }
    return null
  }

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setImageError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      setImageError('Image must be smaller than 5MB')
      return
    }

    setImageError('')
    setIsUploadingImage(true)

    try {
      const user = await getCurrentUser()
      if (!user) {
        setImageError('User not authenticated')
        return
      }

      // Show preview immediately
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${journeyId || 'temp'}/${fileName}`

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('journey-covers')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('journey-covers')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      setCoverImageUrl(publicUrl)

      // If we have a journey ID, update it immediately
      if (journeyId) {
        const result = await updateJourney(journeyId, {
          cover_image_url: publicUrl,
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to save image URL')
        }
      }
    } catch (err) {
      console.error('Image upload error:', err)
      setImageError(err instanceof Error ? err.message : 'Failed to upload image')
      setImagePreview(coverImageUrl) // Revert to previous image
    } finally {
      setIsUploadingImage(false)
    }
  }

  function handleRemoveImage() {
    setImagePreview(null)
    setCoverImageUrl(null)
    setImageError('')
    
    // Update journey to remove image
    if (journeyId) {
      updateJourney(journeyId, {
        cover_image_url: null,
      })
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function handleContinue() {
    if (validationError) return
    
    setIsSubmitting(true)
    setError('')
    
    try {
      if (journeyId) {
        // Update existing journey and navigate to next step
        const result = await updateJourney(journeyId, {
          name: name || null,
          period_start: periodStart,
          period_end: periodEnd,
        })
        
        if (!result.success) {
          setError(result.error || 'Failed to save journey')
          return
        }
        
        const updatedJourney = result.data as ClarityJourney
        const nextRoute = getNextStep(updatedJourney)
        navigate(nextRoute)
      } else {
        // Create new journey and navigate to next step
        const result = await createJourney(periodStart, periodEnd, name || undefined)
        
        if (!result.success) {
          setError(result.error || 'Failed to create journey')
          return
        }
        
        const newJourney = result.data as ClarityJourney
        
        // If we have a cover image, update the journey with it
        if (coverImageUrl) {
          await updateJourney(newJourney.id, {
            cover_image_url: coverImageUrl,
          })
        }
        
        const nextRoute = getNextStep(newJourney)
        navigate(nextRoute)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCancel() {
    // If we have a journey, it's already saved as draft via autosave
    navigate('/clarity-wizard')
  }

  const monthsDuration = useMemo(() => {
    const start = new Date(periodStart)
    const end = new Date(periodEnd)
    return calculateMonthsDiff(start, end)
  }, [periodStart, periodEnd])

  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-auro-bg0">
          <div className="absolute inset-0 gradient-radial-top-left" />
          <div className="absolute inset-0 gradient-radial-mid-left" />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12">
          <SkeletonForm className="max-w-2xl mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-auro-bg0">
        <div className="absolute inset-0 gradient-radial-top-left" />
        <div className="absolute inset-0 gradient-radial-mid-left" />
      </div>

      <div className="relative z-10 container mx-auto px-6 py-12">
        <div className="glass-panel p-8 rounded-3xl max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
                <svg className="w-4 h-4 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">Step 1 of 3</span>
            </div>
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              Define your focus period
            </h1>
            <p className="text-auro-text-secondary">
              Choose how long you want to plan for. This helps structure your goals and milestones.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
              <p className="text-sm text-auro-danger">{error}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6 mb-8">
            {/* Period name (optional) */}
            <div>
              <label className="block text-sm font-medium text-auro-text-secondary mb-2">
                Name your journey <span className="text-auro-text-tertiary">(optional)</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 2026 Growth Plan, Q1-Q2 Focus..."
                className="w-full input-field rounded-xl"
              />
            </div>

            {/* Cover image (optional) */}
            <div>
              <label className="block text-sm font-medium text-auro-text-secondary mb-2">
                Cover image <span className="text-auro-text-tertiary">(optional)</span>
              </label>
              <div className="space-y-3">
                {imagePreview ? (
                  <div className="relative glass-card p-3 rounded-xl">
                    <div className="flex items-center gap-4">
                      <img
                        src={imagePreview}
                        alt="Journey cover"
                        className="w-24 h-24 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-auro-text-primary font-medium mb-1">
                          Cover image uploaded
                        </p>
                        <p className="text-xs text-auro-text-tertiary">
                          This image will appear on your journey card
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={isUploadingImage}
                        className="px-4 py-2 rounded-lg glass-control text-auro-text-secondary hover:text-auro-danger hover:bg-auro-danger/10 transition-colors text-sm disabled:opacity-50"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                      id="cover-image-input"
                    />
                    <label
                      htmlFor="cover-image-input"
                      className={`
                        block glass-card p-6 rounded-xl border-2 border-dashed border-auro-stroke-subtle
                        hover:border-auro-accent hover:bg-auro-accent/5 transition-all cursor-pointer
                        ${isUploadingImage ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <div className="flex flex-col items-center justify-center text-center">
                        <svg className="w-12 h-12 text-auro-text-tertiary mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                        </svg>
                        {isUploadingImage ? (
                          <p className="text-sm text-auro-text-secondary">Uploading...</p>
                        ) : (
                          <>
                            <p className="text-sm text-auro-text-primary font-medium mb-1">
                              Click to upload an image
                            </p>
                            <p className="text-xs text-auro-text-tertiary">
                              JPEG, PNG, GIF, or WebP (max 5MB)
                            </p>
                          </>
                        )}
                      </div>
                    </label>
                  </div>
                )}
                {imageError && (
                  <p className="text-sm text-auro-danger">{imageError}</p>
                )}
              </div>
            </div>

            {/* Preset duration buttons */}
            <div>
              <label className="block text-sm font-medium text-auro-text-secondary mb-3">
                Quick select duration
              </label>
              <div className="flex gap-3">
                {PRESET_MONTHS.map((months) => (
                  <button
                    key={months}
                    onClick={() => handlePresetClick(months)}
                    className={`
                      flex-1 py-3 rounded-xl text-sm font-medium transition-all
                      ${getActivePreset() === months
                        ? 'bg-auro-accent text-white shadow-glow-accent'
                        : 'glass-control text-auro-text-primary hover:bg-white/8'
                      }
                    `}
                  >
                    {months} months
                  </button>
                ))}
              </div>
            </div>

            {/* Date inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-auro-text-secondary mb-2">
                  Start date
                </label>
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="w-full input-field rounded-xl [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-auro-text-secondary mb-2">
                  End date
                </label>
                <input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                  min={periodStart}
                  className="w-full input-field rounded-xl [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Duration display */}
            <div className="glass-card p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-sm text-auro-text-secondary">Focus period duration</span>
                <span className={`text-lg font-semibold ${validationError ? 'text-auro-danger' : 'text-auro-text-primary'}`}>
                  {monthsDuration} {monthsDuration === 1 ? 'month' : 'months'}
                </span>
              </div>
              {validationError && (
                <p className="text-sm text-auro-danger mt-2">{validationError}</p>
              )}
            </div>
          </div>

          {/* Saving indicator */}
          {isSaving && (
            <div className="flex items-center gap-2 text-sm text-auro-text-tertiary mb-4">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Saving...</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-auro-divider">
            <button
              onClick={handleCancel}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <div className="flex items-center gap-4">
              <button
                onClick={handleContinue}
                disabled={isSubmitting || !!validationError}
                className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (journeyId ? 'Saving...' : 'Creating...') : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

