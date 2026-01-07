import { useCallback, useRef, useState } from 'react'

interface UseAutosaveOptions {
  debounceMs?: number
  onSuccess?: () => void
  onError?: (error: Error) => void
}

interface UseAutosaveReturn<T> {
  save: (data: T) => void
  saveImmediate: (data: T) => Promise<void>
  isSaving: boolean
  lastSaved: Date | null
  error: string | null
}

/**
 * A reusable autosave hook with debouncing
 * 
 * @param saveFunction - Async function that performs the save
 * @param options - Configuration options
 * @returns Object with save methods, loading state, and status
 */
export function useAutosave<T>(
  saveFunction: (data: T) => Promise<void>,
  options: UseAutosaveOptions = {}
): UseAutosaveReturn<T> {
  const { debounceMs = 300, onSuccess, onError } = options
  
  const [isSaving, setIsSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pendingDataRef = useRef<T | null>(null)
  const saveFunctionRef = useRef(saveFunction)
  
  // Keep save function ref up to date
  saveFunctionRef.current = saveFunction

  const performSave = useCallback(async (data: T) => {
    setIsSaving(true)
    setError(null)
    
    try {
      await saveFunctionRef.current(data)
      setLastSaved(new Date())
      onSuccess?.()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    } finally {
      setIsSaving(false)
    }
  }, [onSuccess, onError])

  const save = useCallback((data: T) => {
    // Store the pending data
    pendingDataRef.current = data
    
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    // Set up debounced save
    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current !== null) {
        performSave(pendingDataRef.current)
        pendingDataRef.current = null
      }
    }, debounceMs)
  }, [debounceMs, performSave])

  const saveImmediate = useCallback(async (data: T) => {
    // Clear any pending debounced save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    pendingDataRef.current = null
    
    // Perform save immediately
    await performSave(data)
  }, [performSave])

  return {
    save,
    saveImmediate,
    isSaving,
    lastSaved,
    error,
  }
}

export default useAutosave

