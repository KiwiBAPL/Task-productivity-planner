import { useState, useCallback } from 'react'
import { useAutosave } from '../../hooks/useAutosave'
import { saveBig5Bucket, saveBig5OKR, deleteBig5Bucket, type Big5BucketWithOKRs, type Big5OKR, type MetricType } from '../../lib/big5'

interface Big5CardProps {
  bucket: Big5BucketWithOKRs
  journeyId: string
  onUpdate: (bucket: Big5BucketWithOKRs) => void
  onDelete: (bucket: Big5BucketWithOKRs) => void
  showValidationErrors?: boolean
}

export default function Big5Card({ bucket, journeyId, onUpdate, onDelete, showValidationErrors = false }: Big5CardProps) {
  const [localBucket, setLocalBucket] = useState(bucket)
  const [saveError, setSaveError] = useState<string>('')
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Check if bucket is created (has title or statement)
  const isCreated = localBucket.title.trim().length > 0 || localBucket.statement.trim().length > 0
  
  // Check if bucket has at least one OKR with description
  const hasAtLeastOneOKR = localBucket.okrs.length >= 1 && localBucket.okrs.some((okr) => okr.description.trim().length > 0)

  // Calculate completion status
  const isComplete =
    localBucket.title.trim().length > 0 &&
    localBucket.statement.trim().length > 0 &&
    hasAtLeastOneOKR

  // Check if bucket needs OKRs (created but missing OKRs)
  const needsOKRs = isCreated && !hasAtLeastOneOKR

  // Autosave bucket fields
  const { save: autosaveBucket } = useAutosave<{ title: string; statement: string }>(
    async ({ title, statement }) => {
      // Don't autosave if there's no OKR (enforce business rule)
      const hasAtLeastOneOKR = localBucket.okrs.some((okr) => okr.description.trim().length > 0)
      if (!hasAtLeastOneOKR) {
        // Don't save to database until at least one OKR is added
        return
      }

      if (!localBucket.id) {
        // First save - create bucket
        const result = await saveBig5Bucket(journeyId, {
          order_index: localBucket.order_index,
          title,
          statement,
        })
        if (result.success && result.data) {
          const savedBucket = result.data as Big5BucketWithOKRs
          setLocalBucket((prev) => ({ ...prev, id: savedBucket.id }))
          onUpdate({ ...localBucket, id: savedBucket.id, title, statement })
        } else {
          // Only show critical errors, not validation errors from autosave
          if (result.error && !result.error.includes('cannot be empty')) {
            setSaveError(result.error || 'Failed to save bucket')
          }
        }
      } else {
        // Update existing bucket
        const result = await saveBig5Bucket(journeyId, {
          id: localBucket.id,
          order_index: localBucket.order_index,
          title,
          statement,
        })
        if (result.success) {
          onUpdate({ ...localBucket, title, statement })
        } else {
          // Only show critical errors, not validation errors from autosave
          if (result.error && !result.error.includes('cannot be empty')) {
            setSaveError(result.error || 'Failed to update bucket')
          }
        }
      }
    },
    { debounceMs: 500 }
  )

  // Autosave OKR fields
  const { save: autosaveOKR } = useAutosave<{
    okrIndex: number
    okr: Big5OKR
  }>(
    async ({ okrIndex, okr }) => {
      if (!localBucket.id) {
        // Cannot save OKR without bucket ID
        return
      }

      const result = await saveBig5OKR(localBucket.id, okr)
      if (result.success && result.data) {
        const savedOKR = result.data as Big5OKR
        const updatedOKRs = [...localBucket.okrs]
        updatedOKRs[okrIndex] = savedOKR
        const updatedBucket = { ...localBucket, okrs: updatedOKRs }
        setLocalBucket(updatedBucket)
        onUpdate(updatedBucket)
      } else {
        setSaveError(result.error || 'Failed to save OKR')
      }
    },
    { debounceMs: 300 }
  )

  const handleTitleChange = useCallback(
    (value: string) => {
      setLocalBucket((prev) => ({ ...prev, title: value }))
      autosaveBucket({ title: value, statement: localBucket.statement })
    },
    [autosaveBucket, localBucket.statement]
  )

  const handleStatementChange = useCallback(
    (value: string) => {
      setLocalBucket((prev) => ({ ...prev, statement: value }))
      autosaveBucket({ title: localBucket.title, statement: value })
    },
    [autosaveBucket, localBucket.title]
  )

  const handleOKRDescriptionChange = useCallback(
    (index: number, value: string) => {
      const updatedOKRs = [...localBucket.okrs]
      updatedOKRs[index] = { ...updatedOKRs[index], description: value }
      setLocalBucket((prev) => ({ ...prev, okrs: updatedOKRs }))
      autosaveOKR({ okrIndex: index, okr: updatedOKRs[index] })
    },
    [localBucket.okrs, autosaveOKR]
  )

  const handleOKRMetricTypeChange = useCallback(
    (index: number, value: MetricType) => {
      const updatedOKRs = [...localBucket.okrs]
      updatedOKRs[index] = {
        ...updatedOKRs[index],
        metric_type: value,
        // Reset target values when changing type
        target_value_number: null,
        target_value_text: null,
      }
      setLocalBucket((prev) => ({ ...prev, okrs: updatedOKRs }))
      autosaveOKR({ okrIndex: index, okr: updatedOKRs[index] })
    },
    [localBucket.okrs, autosaveOKR]
  )

  const handleOKRTargetChange = useCallback(
    (index: number, type: 'number' | 'text', value: number | string | null) => {
      const updatedOKRs = [...localBucket.okrs]
      if (type === 'number') {
        updatedOKRs[index] = {
          ...updatedOKRs[index],
          target_value_number: value as number | null,
        }
      } else {
        updatedOKRs[index] = {
          ...updatedOKRs[index],
          target_value_text: value as string | null,
        }
      }
      setLocalBucket((prev) => ({ ...prev, okrs: updatedOKRs }))
      autosaveOKR({ okrIndex: index, okr: updatedOKRs[index] })
    },
    [localBucket.okrs, autosaveOKR]
  )

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true)
    setSaveError('')
    setSaveSuccess(false)

    try {
      // Validate that bucket has title and statement
      if (localBucket.title.trim().length === 0 && localBucket.statement.trim().length === 0) {
        setSaveError('Please add a title or statement before saving.')
        setIsSaving(false)
        return
      }

      // Validate that at least one OKR has a description
      const hasAtLeastOneOKR = localBucket.okrs.some((okr) => okr.description.trim().length > 0)
      if (!hasAtLeastOneOKR) {
        setSaveError('At least one key result (OKR) must be completed before saving.')
        setIsSaving(false)
        return
      }

      // Ensure bucket is saved first
      if (!localBucket.id) {
        // Create bucket if it doesn't exist

        const bucketResult = await saveBig5Bucket(journeyId, {
          order_index: localBucket.order_index,
          title: localBucket.title,
          statement: localBucket.statement,
        })

        if (!bucketResult.success || !bucketResult.data) {
          setSaveError(bucketResult.error || 'Failed to save outcome')
          setIsSaving(false)
          return
        }

        const savedBucket = bucketResult.data as Big5BucketWithOKRs
        const updatedBucket = { ...localBucket, id: savedBucket.id }
        setLocalBucket(updatedBucket)
        onUpdate(updatedBucket)

        // Save OKRs with the new bucket ID
        const okrPromises = updatedBucket.okrs
          .filter((okr) => okr.description.trim().length > 0)
          .map((okr) => saveBig5OKR(savedBucket.id!, okr))

        const okrResults = await Promise.allSettled(okrPromises)
        const failedOKRs = okrResults.filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
        
        if (failedOKRs.length > 0) {
          setSaveError('Some key results failed to save. Please try again.')
          setIsSaving(false)
          return
        }
      } else {
        // Update existing bucket
        const bucketResult = await saveBig5Bucket(journeyId, {
          id: localBucket.id,
          order_index: localBucket.order_index,
          title: localBucket.title,
          statement: localBucket.statement,
        })

        if (!bucketResult.success) {
          setSaveError(bucketResult.error || 'Failed to save outcome')
          setIsSaving(false)
          return
        }

        // Save all OKRs that have descriptions
        const okrPromises = localBucket.okrs
          .filter((okr) => okr.description.trim().length > 0)
          .map((okr) => saveBig5OKR(localBucket.id!, okr))

        const okrResults = await Promise.allSettled(okrPromises)
        const failedOKRs = okrResults.filter((result) => result.status === 'rejected' || (result.status === 'fulfilled' && !result.value.success))
        
        if (failedOKRs.length > 0) {
          setSaveError('Some key results failed to save. Please try again.')
          setIsSaving(false)
          return
        }
      }

      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }, [localBucket, journeyId, onUpdate])

  // Handle delete
  const handleDelete = useCallback(async () => {
    // Confirm deletion
    if (!confirm('Are you sure you want to remove this Big 5 outcome? This action cannot be undone.')) {
      return
    }

    setIsDeleting(true)
    setSaveError('')

    try {
      // If bucket has an ID, delete from database
      if (localBucket.id) {
        const result = await deleteBig5Bucket(localBucket.id)
        if (!result.success) {
          setSaveError(result.error || 'Failed to delete outcome')
          setIsDeleting(false)
          return
        }
      }

      // Notify parent to remove from list
      onDelete(localBucket)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to delete outcome')
      setIsDeleting(false)
    }
  }, [localBucket, onDelete])

  return (
    <div className="glass-card p-6 rounded-2xl border border-auro-stroke-subtle">
      {/* Card Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
            <span className="text-sm font-semibold text-auro-accent">
              {localBucket.order_index + 1}
            </span>
          </div>
          <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">
            {localBucket.order_index + 1} of 5
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isComplete && (
            <div className="flex items-center gap-2 text-auro-success">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-xs font-medium">Complete</span>
            </div>
          )}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-full glass-control text-auro-text-secondary hover:text-auro-danger hover:bg-auro-danger/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Remove this Big 5 outcome"
          >
            {isDeleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-xs">Removing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="text-xs">Remove</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display - Only show critical errors, not validation errors */}
      {saveError && (
        <div className="mb-4 p-3 rounded-xl bg-auro-danger/10 border border-auro-danger/30">
          <p className="text-xs text-auro-danger">{saveError}</p>
        </div>
      )}

      {/* Warning: Needs OKR - Only show when validation errors should be displayed */}
      {showValidationErrors && needsOKRs && (
        <div className="mb-4 p-3 rounded-xl bg-auro-warning/10 border border-auro-warning/30">
          <p className="text-xs text-auro-warning">
            This outcome requires at least one key result (OKR) before you can complete your journey.
          </p>
        </div>
      )}

      {/* Title Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-auro-text-primary mb-2">
          Outcome Title
        </label>
        <input
          type="text"
          value={localBucket.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="e.g., Career Growth, Health & Fitness"
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-auro-stroke-subtle text-auro-text-primary placeholder-auro-text-tertiary focus:border-auro-stroke-strong focus:outline-none transition-colors"
        />
      </div>

      {/* Statement Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-auro-text-primary mb-2">
          Outcome Statement
        </label>
        <textarea
          value={localBucket.statement}
          onChange={(e) => handleStatementChange(e.target.value)}
          placeholder="[Who] will [change] so that [benefit]"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-auro-stroke-subtle text-auro-text-primary placeholder-auro-text-tertiary focus:border-auro-stroke-strong focus:outline-none transition-colors resize-none"
        />
        <p className="mt-2 text-xs text-auro-text-tertiary">
          Template: [Who] will [change] so that [benefit]
        </p>
      </div>

      {/* Divider */}
      <div className="border-t border-auro-divider mb-6" />

      {/* OKRs Section */}
      <div>
        <h3 className="text-sm font-semibold text-auro-text-primary mb-2">
          Key Results
        </h3>
        <p className="text-xs text-auro-text-tertiary mb-4">
          At least one key result (OKR) is required. You can add up to 3 key results per outcome.
        </p>

        <div className="space-y-6">
          {localBucket.okrs.map((okr, index) => (
            <div key={index} className="space-y-3">
              {/* OKR Header */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-auro-text-tertiary">KR {index + 1}</span>
              </div>

              {/* Description */}
              <textarea
                value={okr.description}
                onChange={(e) => handleOKRDescriptionChange(index, e.target.value)}
                placeholder="Describe the key result..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-auro-stroke-subtle text-sm text-auro-text-primary placeholder-auro-text-tertiary focus:border-auro-stroke-strong focus:outline-none transition-colors resize-none"
              />

              {/* Metric Type & Target Value */}
              <div className="grid grid-cols-2 gap-3">
                {/* Metric Type */}
                <div>
                  <label className="block text-xs text-auro-text-secondary mb-1">Metric Type</label>
                  <select
                    value={okr.metric_type}
                    onChange={(e) => handleOKRMetricTypeChange(index, e.target.value as MetricType)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-auro-stroke-subtle text-sm text-auro-text-primary focus:border-auro-stroke-strong focus:outline-none transition-colors"
                  >
                    <option value="percentage">Percentage</option>
                    <option value="number">Numeric</option>
                    <option value="boolean">Binary (Yes/No)</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Target Value */}
                <div>
                  <label className="block text-xs text-auro-text-secondary mb-1">Target Value</label>
                  {okr.metric_type === 'percentage' && (
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={okr.target_value_number || ''}
                        onChange={(e) =>
                          handleOKRTargetChange(
                            index,
                            'number',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="0-100"
                        className="w-full px-3 py-2 pr-8 rounded-lg bg-white/5 border border-auro-stroke-subtle text-sm text-auro-text-primary placeholder-auro-text-tertiary focus:border-auro-stroke-strong focus:outline-none transition-colors"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-auro-text-tertiary">
                        %
                      </span>
                    </div>
                  )}
                  {okr.metric_type === 'number' && (
                    <input
                      type="number"
                      value={okr.target_value_number || ''}
                      onChange={(e) =>
                        handleOKRTargetChange(
                          index,
                          'number',
                          e.target.value ? parseFloat(e.target.value) : null
                        )
                      }
                      placeholder="Enter number"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-auro-stroke-subtle text-sm text-auro-text-primary placeholder-auro-text-tertiary focus:border-auro-stroke-strong focus:outline-none transition-colors"
                    />
                  )}
                  {okr.metric_type === 'boolean' && (
                    <div className="flex items-center h-[38px]">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={okr.target_value_text === 'Yes'}
                          onChange={(e) =>
                            handleOKRTargetChange(index, 'text', e.target.checked ? 'Yes' : 'No')
                          }
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-white/10 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-auro-accent/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-auro-accent"></div>
                        <span className="ml-3 text-sm text-auro-text-primary">
                          {okr.target_value_text === 'Yes' ? 'Yes' : 'No'}
                        </span>
                      </label>
                    </div>
                  )}
                  {okr.metric_type === 'other' && (
                    <input
                      type="text"
                      value={okr.target_value_text || ''}
                      onChange={(e) => handleOKRTargetChange(index, 'text', e.target.value)}
                      placeholder="Enter target"
                      className="w-full px-3 py-2 rounded-lg bg-white/5 border border-auro-stroke-subtle text-sm text-auro-text-primary placeholder-auro-text-tertiary focus:border-auro-stroke-strong focus:outline-none transition-colors"
                    />
                  )}
                </div>
              </div>

              {/* Divider between OKRs */}
              {index < 2 && <div className="border-t border-auro-divider/50 pt-3" />}
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 pt-6 border-t border-auro-divider">
        {/* Error message above save button */}
        {saveError && saveError.includes('key result') && (
          <div className="mb-4 p-3 rounded-xl bg-auro-danger/10 border border-auro-danger/30">
            <p className="text-xs text-auro-danger">{saveError}</p>
          </div>
        )}
        <button
          onClick={handleSave}
          disabled={isSaving || isDeleting}
          className="w-full px-6 py-3 rounded-full glass-control text-auro-text-primary font-medium hover:bg-white/8 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving...</span>
            </>
          ) : saveSuccess ? (
            <>
              <svg className="w-4 h-4 text-auro-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-auro-success">Saved</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span>Save</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
