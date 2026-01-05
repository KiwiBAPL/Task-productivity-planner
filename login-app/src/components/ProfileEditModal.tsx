import { useState, useEffect } from 'react'
import { updateProfile } from '../lib/auth'

interface ProfileEditModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  currentFirstName: string
  currentLastName: string
}

function ProfileEditModal({
  isOpen,
  onClose,
  onComplete,
  currentFirstName,
  currentLastName,
}: ProfileEditModalProps) {
  const [firstName, setFirstName] = useState(currentFirstName)
  const [lastName, setLastName] = useState(currentLastName)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // Update form when modal opens or current values change
  useEffect(() => {
    if (isOpen) {
      setFirstName(currentFirstName)
      setLastName(currentLastName)
      setError('')
      setIsLoading(false)
    }
  }, [isOpen, currentFirstName, currentLastName])

  // Close modal on Escape key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await updateProfile(firstName, lastName)

      if (result.success) {
        onComplete()
        onClose()
      } else {
        setError(result.error?.message || 'An error occurred while updating your profile')
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" />

      {/* Modal content */}
      <div className="relative w-full max-w-md">
        <div className="glass-panel p-8">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full glass-control hover:bg-white/10 transition-all"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5 text-auro-text-secondary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

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
            <h2 className="text-2xl font-semibold mb-2 tracking-tight">Edit Profile</h2>
            <p className="text-auro-text-secondary text-sm">Update your name information</p>
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
                htmlFor="edit-first-name"
                className="block text-sm font-medium text-auro-text-secondary mb-2"
              >
                First Name
              </label>
              <input
                id="edit-first-name"
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
                htmlFor="edit-last-name"
                className="block text-sm font-medium text-auro-text-secondary mb-2"
              >
                Last Name
              </label>
              <input
                id="edit-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Enter your last name"
                className="input-field w-full"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn-accent w-full mt-6"
              disabled={isLoading || !firstName.trim() || !lastName.trim()}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ProfileEditModal

