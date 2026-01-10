import { useState, useEffect, useRef } from 'react'
import { TextEditor } from './TextEditor'
import { useFocusTrap, useFocusReturn } from '../../hooks/useFocusManagement'
import { useEscapeKey } from '../../hooks/useKeyboardShortcuts'

interface AddTextModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (htmlContent: string) => void
  initialText?: string
}

function AddTextModal({ isOpen, onClose, onConfirm, initialText }: AddTextModalProps) {
  const [textContent, setTextContent] = useState(initialText || '<p>Enter your text here...</p>')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = !!initialText
  const modalRef = useRef<HTMLDivElement>(null)

  // Focus management
  useFocusTrap(modalRef, { enabled: isOpen })
  useFocusReturn()
  useEscapeKey(onClose, { enabled: isOpen && !isSubmitting })

  // Reset text content when modal opens
  useEffect(() => {
    if (isOpen) {
      setTextContent(initialText || '<p>Enter your text here...</p>')
      setIsSubmitting(false)
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, initialText])

  function handleConfirm() {
    setIsSubmitting(true)
    onConfirm(textContent)
    // The parent component will handle closing the modal
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
      <div ref={modalRef} className="relative w-full max-w-2xl" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="glass-panel p-8">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full glass-control hover:bg-white/10 transition-all"
            aria-label="Close"
            disabled={isSubmitting}
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              </div>
            </div>
            <h2 id="modal-title" className="text-2xl font-semibold mb-2 tracking-tight">
              {isEditing ? 'Edit Text' : 'Add Text to Vision Board'}
            </h2>
            <p className="text-auro-text-secondary text-sm">
              {isEditing 
                ? 'Update your text content and formatting.' 
                : 'Create and format your text. It will appear as a draggable tile on your board.'}
            </p>
          </div>

          {/* Text Editor */}
          <div className="mb-6">
            <TextEditor
              value={textContent}
              onChange={setTextContent}
              placeholder="Enter your text here..."
              className="min-h-[200px]"
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Cancel and close dialog"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="flex-1 px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={isSubmitting ? (isEditing ? 'Updating text' : 'Adding text') : (isEditing ? 'Update text element' : 'Add text to board')}
              aria-busy={isSubmitting}
            >
              {isSubmitting 
                ? (isEditing ? 'Updating...' : 'Adding...') 
                : (isEditing ? 'Update' : 'Add to Board')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddTextModal
