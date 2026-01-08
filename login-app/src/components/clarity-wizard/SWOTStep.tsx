import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAutosave } from '../../hooks/useAutosave'
import {
  getSWOTEntries,
  saveSWOTEntry,
  deleteSWOTEntry,
  type SWOTEntry,
  type SWOTType,
} from '../../lib/swot'
import { getJourneyById, getNextStep, getPreviousStep, type ClarityJourney } from '../../lib/clarity-wizard'
import SWOTVisualization from './SWOTVisualization'

const SWOT_QUADRANTS: { type: SWOTType; label: string; icon: JSX.Element }[] = [
  {
    type: 'strength',
    label: 'Strengths',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    type: 'weakness',
    label: 'Weaknesses',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
  {
    type: 'opportunity',
    label: 'Opportunities',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    type: 'threat',
    label: 'Threats',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
]

export default function SWOTStep() {
  const { journeyId } = useParams<{ journeyId: string }>()
  const navigate = useNavigate()

  const [journey, setJourney] = useState<ClarityJourney | null>(null)
  const [entries, setEntries] = useState<SWOTEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [inputValues, setInputValues] = useState<Record<SWOTType, string>>({
    strength: '',
    weakness: '',
    opportunity: '',
    threat: '',
  })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState<string>('')

  // Load journey and entries on mount
  useEffect(() => {
    async function loadData() {
      if (!journeyId) {
        setError('Journey ID is required')
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        // Load journey
        const journeyResult = await getJourneyById(journeyId)
        if (!journeyResult.success || !journeyResult.data) {
          setError(journeyResult.error || 'Journey not found')
          setIsLoading(false)
          return
        }
        setJourney(journeyResult.data as ClarityJourney)

        // Load existing entries
        const entriesResult = await getSWOTEntries(journeyId)
        if (entriesResult.success && entriesResult.data) {
          setEntries(entriesResult.data as SWOTEntry[])
        }
      } catch (err) {
        console.error('Error loading data:', err)
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [journeyId])

  // Autosave hook for saving entries
  const { save: autosaveEntry, saveImmediate } = useAutosave<SWOTEntry>(
    async (entry) => {
      if (!journeyId) return

      const result = await saveSWOTEntry(journeyId, {
        type: entry.type,
        content: entry.content,
        notes: entry.notes,
        id: entry.id,
      })

      if (result.success && result.data) {
        const savedEntry = result.data as SWOTEntry
        setEntries((prev) => {
          if (entry.id) {
            // Update existing
            return prev.map((e) => (e.id === entry.id ? savedEntry : e))
          } else {
            // Add new
            return [...prev, savedEntry]
          }
        })
      } else {
        throw new Error(result.error || 'Failed to save entry')
      }
    },
    { debounceMs: 300 }
  )

  const handleAddEntry = useCallback(
    async (type: SWOTType) => {
      const content = inputValues[type].trim()
      if (!content) return

      const newEntry: SWOTEntry = {
        type,
        content,
        notes: null,
      }

      // Save immediately for new entries
      await saveImmediate(newEntry)
      setInputValues((prev) => ({ ...prev, [type]: '' }))
    },
    [inputValues, saveImmediate]
  )

  const handleEditStart = useCallback((entry: SWOTEntry) => {
    setEditingId(entry.id || null)
    setEditingValue(entry.content)
  }, [])

  const handleEditSave = useCallback(
    async (entry: SWOTEntry) => {
      if (!editingValue.trim()) {
        setEditingId(null)
        return
      }

      const updatedEntry: SWOTEntry = {
        ...entry,
        content: editingValue.trim(),
      }

      await saveImmediate(updatedEntry)
      setEditingId(null)
    },
    [editingValue, saveImmediate]
  )

  const handleEditCancel = useCallback(() => {
    setEditingId(null)
    setEditingValue('')
  }, [])

  const handleNotesChange = useCallback(
    (entry: SWOTEntry, newNotes: string) => {
      const updatedEntry: SWOTEntry = {
        ...entry,
        notes: newNotes,
      }
      autosaveEntry(updatedEntry)
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? updatedEntry : e)))
    },
    [autosaveEntry]
  )

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      const result = await deleteSWOTEntry(entryId)
      if (result.success) {
        setEntries((prev) => prev.filter((e) => e.id !== entryId))
      } else {
        setError(result.error || 'Failed to delete entry')
      }
    },
    []
  )

  const toggleNotes = useCallback((entryId: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId)
      } else {
        next.add(entryId)
      }
      return next
    })
  }, [])

  const getEntriesByType = useCallback(
    (type: SWOTType) => {
      return entries.filter((e) => e.type === type)
    },
    [entries]
  )

  async function handleNext() {
    if (!journeyId || !journey) return

    setIsSubmitting(true)
    setError('')

    try {
      // Ensure all entries without IDs are saved
      const unsavedEntries = entries.filter((e) => !e.id)
      for (const entry of unsavedEntries) {
        const result = await saveSWOTEntry(journeyId, {
          type: entry.type,
          content: entry.content,
          notes: entry.notes,
        })
        if (!result.success) {
          throw new Error(`Failed to save ${entry.content}`)
        }
      }

      // Navigate to next step in linear flow
      const nextRoute = getNextStep(journey, 'swot')
      navigate(nextRoute)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to proceed')
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleBack() {
    if (journeyId && journey) {
      const prevRoute = getPreviousStep(journey, 'swot')
      navigate(prevRoute)
    } else {
      navigate('/clarity-wizard')
    }
  }

  if (isLoading) {
    return (
      <div className="relative w-full min-h-screen overflow-hidden">
        <div className="absolute inset-0 bg-auro-bg0">
          <div className="absolute inset-0 gradient-radial-top-left" />
          <div className="absolute inset-0 gradient-radial-mid-left" />
        </div>
        <div className="relative z-10 container mx-auto px-6 py-12 flex items-center justify-center min-h-screen">
          <div className="text-auro-text-secondary">Loading...</div>
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
        <div className="glass-panel p-8 rounded-3xl max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-full bg-auro-accent-soft flex items-center justify-center">
                <svg className="w-4 h-4 text-auro-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h7M4 10h7M4 14h7M4 18h7M15 6h5M15 10h5M15 14h5M15 18h5M11 3v18M3 12h18" />
                  <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span className="text-xs font-medium text-auro-text-tertiary uppercase tracking-wider">
                Step 4: SWOT Analysis
              </span>
            </div>
            <h1 className="text-3xl font-semibold text-auro-text-primary mb-2">
              Holistic self-view
            </h1>
            <p className="text-auro-text-secondary">
              Identify your strengths, weaknesses, opportunities, and threats to inform your Big 5 and Vision Board.
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="glass-card p-4 rounded-xl border border-auro-danger/30 bg-auro-danger/10 mb-6">
              <p className="text-sm text-auro-danger">{error}</p>
            </div>
          )}

          {/* SWOT Visualization */}
          <SWOTVisualization 
            entries={entries} 
            onNext={handleNext}
            isSubmitting={isSubmitting}
          />

          {/* 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {SWOT_QUADRANTS.map((quadrant) => {
              const quadrantEntries = getEntriesByType(quadrant.type)

              return (
                <div key={quadrant.type} className="glass-card p-6 rounded-2xl">
                  {/* Quadrant Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-auro-accent-soft flex items-center justify-center text-auro-accent">
                      {quadrant.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-auro-text-primary">{quadrant.label}</h3>
                  </div>

                  {/* Input for new entry */}
                  <div className="mb-4">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={inputValues[quadrant.type]}
                        onChange={(e) =>
                          setInputValues((prev) => ({ ...prev, [quadrant.type]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && inputValues[quadrant.type].trim()) {
                            handleAddEntry(quadrant.type)
                          }
                        }}
                        placeholder={`Add a ${quadrant.label.toLowerCase().slice(0, -1)}...`}
                        className="flex-1 input-field rounded-xl px-4 py-2"
                      />
                      <button
                        onClick={() => handleAddEntry(quadrant.type)}
                        disabled={!inputValues[quadrant.type].trim()}
                        className="px-4 py-2 rounded-xl glass-control text-auro-text-primary hover:bg-white/8 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Entries list */}
                  <div className="max-h-[400px] overflow-y-auto pr-2">
                    {quadrantEntries.length === 0 ? (
                      <p className="text-sm text-auro-text-tertiary italic py-2">No entries yet</p>
                    ) : (
                      <ul className="space-y-2">
                        {quadrantEntries.map((entry) => {
                          const isEditing = editingId === entry.id
                          const entryNotesExpanded = expandedNotes.has(entry.id || '')

                          return (
                            <li key={entry.id} className="group">
                              {isEditing ? (
                                <div className="glass-control p-3 rounded-xl space-y-2">
                                  <input
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleEditSave(entry)
                                      } else if (e.key === 'Escape') {
                                        handleEditCancel()
                                      }
                                    }}
                                    onBlur={() => handleEditSave(entry)}
                                    className="w-full input-field rounded-lg px-3 py-2"
                                    autoFocus
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleEditSave(entry)}
                                      className="px-3 py-1 text-xs rounded-lg bg-auro-accent text-white hover:bg-auro-accent/80 transition-colors"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={handleEditCancel}
                                      className="px-3 py-1 text-xs rounded-lg glass-control text-auro-text-secondary hover:bg-white/8 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-start gap-2 group/item hover:bg-white/[0.03] rounded-lg px-2 py-1.5 transition-colors">
                                  <span className="text-auro-text-tertiary mt-0.5 flex-shrink-0 text-base leading-none">•</span>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-auro-text-primary leading-relaxed">
                                      {entry.content}
                                    </p>
                                    {entry.notes && !entryNotesExpanded && (
                                      <button
                                        onClick={() => entry.id && toggleNotes(entry.id)}
                                        className="mt-1 text-xs text-auro-text-tertiary hover:text-auro-text-secondary transition-colors"
                                      >
                                        Show notes
                                      </button>
                                    )}
                                    {entryNotesExpanded && (
                                      <div className="mt-2">
                                        <textarea
                                          value={entry.notes || ''}
                                          onChange={(e) => handleNotesChange(entry, e.target.value)}
                                          onBlur={() => handleNotesChange(entry, entry.notes || '')}
                                          placeholder="Add notes about this item..."
                                          className="w-full input-field rounded-xl min-h-[60px] resize-none text-sm"
                                        />
                                        <button
                                          onClick={() => entry.id && toggleNotes(entry.id)}
                                          className="mt-1 text-xs text-auro-text-tertiary hover:text-auro-text-secondary transition-colors"
                                        >
                                          Hide notes
                                        </button>
                                      </div>
                                    )}
                                    {!entry.notes && !entryNotesExpanded && (
                                      <button
                                        onClick={() => entry.id && toggleNotes(entry.id)}
                                        className="mt-1 text-xs text-auro-text-tertiary hover:text-auro-text-secondary transition-colors opacity-0 group-hover/item:opacity-100 transition-opacity"
                                      >
                                        Add notes
                                      </button>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => handleEditStart(entry)}
                                      className="p-1 rounded-lg glass-control text-auro-text-tertiary hover:text-auro-text-primary hover:bg-white/8 transition-colors"
                                      title="Edit"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => entry.id && handleDeleteEntry(entry.id)}
                                      className="p-1 rounded-lg glass-control text-auro-text-tertiary hover:text-auro-danger hover:bg-auro-danger/10 transition-colors"
                                      title="Delete"
                                    >
                                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-auro-divider">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-full glass-control text-auro-text-primary hover:bg-white/8 transition-colors disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              disabled={isSubmitting}
              className="px-8 py-3 rounded-full bg-white text-[#0B0C10] font-medium hover:bg-[#8B5CF6] hover:text-[#F4F6FF] transition-all shadow-[0_10px_26px_-16px_rgba(0,0,0,0.55)] hover:shadow-[0_0_22px_0_rgba(139,92,246,0.30)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Saving...' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

