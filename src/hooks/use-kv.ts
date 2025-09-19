import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

// Lightweight replacement for `@github/spark/hooks` useKV.
// Persists to localStorage and mirrors the tuple signature:
//   [value, setValue, deleteValue]
// - setValue supports both a value or updater function.
// - deleteValue removes the key and resets to initial.
export function useKV<T>(key: string, initial: T): [T, (next: T | ((curr: T) => T)) => void, () => void] {
  const storageKey = useMemo(() => `kv:${key}`, [key])
  const initialRef = useRef(initial)

  const read = useCallback((): T => {
    if (typeof window === 'undefined') return initialRef.current
    try {
      const raw = window.localStorage.getItem(storageKey)
      if (raw == null) return initialRef.current
      return JSON.parse(raw) as T
    } catch {
      return initialRef.current
    }
  }, [storageKey])

  const [value, setValueState] = useState<T>(read)

  // Keep state in sync if key changes externally (rare but safe)
  useEffect(() => {
    setValueState(read())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const setValue = useCallback(
    (next: T | ((curr: T) => T)) => {
      setValueState((curr) => {
        const nextVal = typeof next === 'function' ? (next as (c: T) => T)(curr) : next
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(storageKey, JSON.stringify(nextVal))
          } catch {
            // ignore storage write errors
          }
        }
        return nextVal
      })
    },
    [storageKey]
  )

  const del = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(storageKey)
      } catch {
        // ignore
      }
    }
    setValueState(initialRef.current)
  }, [storageKey])

  return [value, setValue, del]
}

