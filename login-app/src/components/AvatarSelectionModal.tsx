import { useState, useEffect, useRef } from 'react'
import { AvatarIcon, AVATAR_PRESETS, type AvatarPreset } from './avatars/PresetAvatars'

interface AvatarSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (type: 'preset' | 'upload', preset?: AvatarPreset, file?: File) => void
  currentPreset?: AvatarPreset | null
  currentPreviewUrl?: string | null
}

function AvatarSelectionModal({
  isOpen,
  onClose,
  onSelect,
  currentPreset,
  currentPreviewUrl,
}: AvatarSelectionModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<AvatarPreset | null>(currentPreset || null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentPreviewUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPreset(currentPreset || null)
      setUploadedFile(null)
      setPreviewUrl(currentPreviewUrl || null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }, [isOpen, currentPreset, currentPreviewUrl])

  // Clean up preview URL
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl !== currentPreviewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl, currentPreviewUrl])

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

  function handlePresetSelect(preset: AvatarPreset) {
    setSelectedPreset(preset)
    setUploadedFile(null)
    if (previewUrl && previewUrl !== currentPreviewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return
      }

      setUploadedFile(file)
      setSelectedPreset(null)

      // Create preview URL
      if (previewUrl && previewUrl !== currentPreviewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleConfirm() {
    if (selectedPreset) {
      onSelect('preset', selectedPreset)
    } else if (uploadedFile && previewUrl) {
      onSelect('upload', undefined, uploadedFile)
    }
    onClose()
  }

  function handleCancel() {
    // Reset to initial state
    setSelectedPreset(currentPreset || null)
    setUploadedFile(null)
    if (previewUrl && previewUrl !== currentPreviewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(currentPreviewUrl || null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  if (!isOpen) return null

  const hasSelection = selectedPreset || uploadedFile

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 animate-fade-in">
      {/* Blurred backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleCancel} />

      {/* Modal content */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="glass-panel p-8 max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold mb-2 tracking-tight">Choose an Avatar</h2>
            <p className="text-auro-text-secondary text-sm">Select a preset avatar or upload your own image</p>
          </div>

          {/* Selected Preview */}
          {(selectedPreset || previewUrl) && (
            <div className="mb-6 flex justify-center">
              <div className="glass-card p-4 rounded-xl">
                {selectedPreset && <AvatarIcon preset={selectedPreset} size={100} />}
                {previewUrl && !selectedPreset && (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="rounded-xl object-cover"
                    style={{ width: '100px', height: '100px' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Preset Avatars Grid */}
          <div className="mb-6">
            <p className="text-sm font-medium text-auro-text-secondary mb-3">Preset Avatars</p>
            <div className="grid grid-cols-5 gap-3 max-h-64 overflow-y-auto">
              {AVATAR_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePresetSelect(preset)}
                  className={`
                    glass-card p-3 rounded-lg transition-all duration-150 flex items-center justify-center
                    ${selectedPreset === preset
                      ? 'ring-2 ring-auro-accent border-auro-accent scale-105'
                      : 'hover:border-auro-accent/50'
                    }
                  `}
                  title={preset.charAt(0).toUpperCase() + preset.slice(1)}
                >
                  <AvatarIcon preset={preset} size={56} />
                </button>
              ))}
            </div>
          </div>

          {/* Upload Option */}
          <div className="mb-6">
            <p className="text-sm font-medium text-auro-text-secondary mb-3">Upload Your Own Image</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleUploadClick}
              className={`
                btn-secondary w-full
                ${uploadedFile ? 'border-auro-accent ring-2 ring-auro-accent/30' : ''}
              `}
            >
              {previewUrl && !selectedPreset ? 'Change Image' : 'Upload Image'}
            </button>
            {uploadedFile && (
              <p className="text-xs text-auro-text-tertiary mt-2 text-center truncate">
                {uploadedFile.name}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleCancel}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="btn-accent flex-1"
              disabled={!hasSelection}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarSelectionModal

