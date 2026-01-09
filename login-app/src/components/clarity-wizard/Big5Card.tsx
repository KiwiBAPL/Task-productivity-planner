import { useState, useCallback } from 'react'
import { useAutosave } from '../../hooks/useAutosave'
import { saveBig5Bucket, saveBig5OKR, type Big5BucketWithOKRs, type Big5OKR, type MetricType } from '../../lib/big5'

interface Big5CardProps {
  bucket: Big5BucketWithOKRs
  journeyId: string
  onUpdate: (bucket: Big5BucketWithOKRs) => void
}

export default function Big5Card({ bucket, journeyId, onUpdate }: Big5CardProps) {
  const [localBucket, setLocalBucket] = useState(bucket)
  const [saveError, setSaveError] = useState<string>('')

  // Calculate completion status
  const isComplete =
    localBucket.title.trim().length > 0 &&
    localBucket.statement.trim().length >= 10 &&
    localBucket.okrs.length === 3 &&
    localBucket.okrs.every((okr) => okr.description.trim().length > 0)

  // Autosave bucket fields
  const { save: autosaveBucket } = useAutosave<{ title: string; statement: string }>(
    async ({ title, statement }) => {
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
          setSaveError(result.error || 'Failed to save bucket')
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
          setSaveError(result.error || 'Failed to update bucket')
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
        {isComplete && (
          <div className="flex items-center gap-2 text-auro-success">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-xs font-medium">Complete</span>
          </div>
        )}
      </div>

      {/* Error Display */}
      {saveError && (
        <div className="mb-4 p-3 rounded-xl bg-auro-danger/10 border border-auro-danger/30">
          <p className="text-xs text-auro-danger">{saveError}</p>
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
        <h3 className="text-sm font-semibold text-auro-text-primary mb-4">
          Key Results (3 required)
        </h3>

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
    </div>
  )
}
