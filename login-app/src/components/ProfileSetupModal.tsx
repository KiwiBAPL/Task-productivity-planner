import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { updateProfile, type AvatarData } from '../lib/auth'
import { AvatarIcon, type AvatarPreset } from './avatars/PresetAvatars'
import AvatarSelectionModal from './AvatarSelectionModal'

interface ProfileSetupModalProps {
  isOpen: boolean
  onComplete: () => void
}

function ProfileSetupModal({ isOpen, onComplete }: ProfileSetupModalProps) {
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [selectedPreset, setSelectedPreset] = useState<AvatarPreset | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Close modal on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        // Don't allow closing without completing profile
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFirstName('')
      setLastName('')
      setSelectedPreset(null)
      setUploadedFile(null)
      setPreviewUrl(null)
      setError('')
      setIsLoading(false)
      setIsAvatarModalOpen(false)
    }
  }, [isOpen])

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  function handleAvatarSelect(type: 'preset' | 'upload', preset?: AvatarPreset, file?: File) {
    if (type === 'preset' && preset) {
      setSelectedPreset(preset)
      setUploadedFile(null)
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      setPreviewUrl(null)
    } else if (type === 'upload' && file) {
      setSelectedPreset(null)
      setUploadedFile(file)
      // Create preview URL
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      let avatarData: AvatarData | undefined

      if (selectedPreset) {
        avatarData = {
          type: 'preset',
          preset: selectedPreset,
        }
      } else if (uploadedFile) {
        avatarData = {
          type: 'upload',
          file: uploadedFile,
        }
      }

      const result = await updateProfile(firstName, lastName, avatarData)

      if (result.success) {
        // Clean up preview URL
        if (previewUrl) {
          URL.revokeObjectURL(previewUrl)
        }
        onComplete()
      } else {
        setError(result.error?.message || 'An error occurred while updating your profile')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in"
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal content */}
      <div className="relative w-full max-w-md">
        <div className="glass-panel p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mb-3">
              <div className="inline-flex items-center justify-center w-16 h-16 glass-card rounded-xl">
                <svg
                  className="w-8 h-8 text-auro-accent"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.75}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
            </div>
            <h2 className="text-2xl font-semibold mb-2 tracking-tight">
              Complete your profile
            </h2>
            <p className="text-auro-text-secondary text-sm">
              We need a few details to get started
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-auro-danger/10 border border-auro-danger/20">
              <p className="text-sm text-auro-danger text-center">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="first-name"
                className="block text-sm font-medium text-auro-text-secondary mb-2"
              >
                First Name
              </label>
              <input
                id="first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Enter your first name"
                className="input-field w-full"
                required
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <label
                htmlFor="last-name"
                className="block text-sm font-medium text-auro-text-secondary mb-2"
              >
                Last Name
              </label>
              <input
                id="last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                className="input-field w-full"
                required
                disabled={isLoading}
              />
            </div>

            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-medium text-auro-text-secondary mb-2">
                Avatar (Optional)
              </label>
              
              {/* Selected Avatar Preview */}
              {(selectedPreset || previewUrl) && (
                <div className="mb-3 flex justify-center">
                  <div className="glass-card p-3 rounded-xl">
                    {selectedPreset && <AvatarIcon preset={selectedPreset} size={64} />}
                    {previewUrl && !selectedPreset && (
                      <img
                        src={previewUrl}
                        alt="Avatar preview"
                        className="w-16 h-16 rounded-xl object-cover"
                      />
                    )}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => setIsAvatarModalOpen(true)}
                disabled={isLoading}
                className="btn-secondary w-full"
              >
                {selectedPreset || previewUrl ? 'Change Avatar' : 'Choose Avatar'}
              </button>
            </div>

            <button
              type="submit"
              className="btn-accent w-full mt-6"
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
            >
              {isLoading ? 'Saving...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>

      {/* Avatar Selection Modal */}
      <AvatarSelectionModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        onSelect={handleAvatarSelect}
        currentPreset={selectedPreset}
        currentPreviewUrl={previewUrl}
      />
    </div>
  )
}

export default ProfileSetupModal

