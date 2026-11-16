import { useCallback, useEffect, useRef, useState } from "react"

import { saveMindmap } from "../api/mindmaps"
import type { MindmapDocument, MindmapResource } from "../api/types"
import { errorMessage } from "../errors"
import type { SaveStatus } from "../persistence"

/**
 * A React "hook" is a reusable function whose name starts with `use`. It can
 * keep state between renders. This hook owns autosaving:
 *
 * - Wait until the user pauses typing/dragging (debounce).
 * - Never run two PUT requests at once (a promise chain).
 * - Expose "unsaved / saving / saved / error" for the header.
 * - Try one last save when the browser tab closes.
 *
 * Only the latest document is sent; the server replaces the whole map on each
 * PUT, which keeps the API simple.
 */
const AUTOSAVE_DELAY_MS = 800

type Snapshot = {
  id: string | null
  /** JSON string used for cheap "has anything changed?" comparisons. */
  json: string
  document: MindmapDocument
}

type Options = {
  currentId: string | null
  document: MindmapDocument
  documentJson: string
  loading: boolean
  onSaved: (resource: MindmapResource) => void
}

export function useMindmapAutosave({
  currentId,
  document,
  documentJson,
  loading,
  onSaved,
}: Options) {
  // useState triggers a re-render; useRef stores bookkeeping values without
  // triggering renders. Refs are the equivalent of a small mutable box.
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [saveError, setSaveError] = useState<string | null>(null)

  const lastSavedRef = useRef<{ id: string; json: string } | null>(null)
  const saveChainRef = useRef<Promise<void>>(Promise.resolve())
  const timerRef = useRef<number | null>(null)
  const currentIdRef = useRef(currentId)
  const onSavedRef = useRef(onSaved)
  const latestRef = useRef<Snapshot>({ id: currentId, json: documentJson, document })

  // Effects run after React updates the screen. They keep refs pointing at the
  // newest props so timers and event listeners created earlier can read them.
  useEffect(() => {
    onSavedRef.current = onSaved
  }, [onSaved])

  useEffect(() => {
    currentIdRef.current = currentId
    latestRef.current = { id: currentId, json: documentJson, document }
  }, [currentId, document, documentJson])

  /**
   * Save one snapshot. Returning a Promise<boolean> lets callers such as
   * "switch map" wait for success before loading something else.
   */
  const saveSnapshot = useCallback((snapshot: Snapshot): Promise<boolean> => {
    const id = snapshot.id
    if (!id) return Promise.resolve(true)

    const run = async (): Promise<boolean> => {
      const saved = lastSavedRef.current
      if (saved && saved.id === id && saved.json === snapshot.json) return true

      if (currentIdRef.current === id) {
        setSaveStatus("saving")
        setSaveError(null)
      }

      try {
        const resource = await saveMindmap(id, snapshot.document)
        lastSavedRef.current = { id, json: snapshot.json }
        onSavedRef.current(resource)

        if (currentIdRef.current === id) {
          const latest = latestRef.current
          // If another edit arrived while this request was in flight, keep
          // showing "unsaved" until the newer document is saved.
          setSaveStatus(
            latest.id === id && latest.json !== snapshot.json ? "unsaved" : "saved",
          )
        }
        return true
      } catch (error) {
        if (currentIdRef.current === id) {
          setSaveStatus("error")
          setSaveError(errorMessage(error))
        }
        return false
      }
    }

    // Promise chaining acts like a queue. The next save starts only after the
    // previous one settles, so responses cannot arrive out of order.
    const result = saveChainRef.current.then(run, run)
    saveChainRef.current = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }, [])

  /** Save immediately; used before switching maps or creating a new one. */
  const flush = useCallback((): Promise<boolean> => {
    const snapshot = latestRef.current
    if (!snapshot.id) return Promise.resolve(true)
    return saveSnapshot(snapshot)
  }, [saveSnapshot])

  /**
   * Debounce = wait for quiet. Every document change restarts the timer, so a
   * drag or typing burst sends one request after the user stops instead of
   * hundreds of requests.
   */
  useEffect(() => {
    if (loading || !currentId) return

    const saved = lastSavedRef.current
    if (saved && saved.id === currentId && saved.json === documentJson) return

    setSaveStatus("unsaved")
    const timer = window.setTimeout(() => {
      const snapshot = latestRef.current
      if (snapshot.id === currentId) void saveSnapshot(snapshot)
    }, AUTOSAVE_DELAY_MS)
    timerRef.current = timer

    // Effect cleanup runs before the next effect or when the component
    // unmounts. Clearing the timer prevents an outdated save from firing.
    return () => {
      window.clearTimeout(timer)
      if (timerRef.current === timer) timerRef.current = null
    }
  }, [currentId, documentJson, loading, saveSnapshot])

  /**
   * `pagehide` fires when the tab is closed or navigated away. `keepalive`
   * asks the browser to let the request finish even though the page is going
   * away. It is best-effort, not a guarantee.
   */
  useEffect(() => {
    function handlePageHide() {
      const snapshot = latestRef.current
      if (!snapshot.id) return
      const saved = lastSavedRef.current
      if (saved && saved.id === snapshot.id && saved.json === snapshot.json) return
      saveMindmap(snapshot.id, snapshot.document, { keepalive: true }).catch(() => undefined)
    }

    window.addEventListener("pagehide", handlePageHide)
    return () => window.removeEventListener("pagehide", handlePageHide)
  }, [])

  /** Called after loading a map so the freshly loaded document is not saved. */
  const markSaved = useCallback((id: string | null, json: string) => {
    lastSavedRef.current = id ? { id, json } : null
    setSaveStatus(id ? "saved" : "idle")
    setSaveError(null)
  }, [])

  /** Stop a pending debounce, e.g. before deleting the current map. */
  const cancelPending = useCallback(() => {
    if (timerRef.current === null) return
    window.clearTimeout(timerRef.current)
    timerRef.current = null
  }, [])

  /** Manual retry button in the header. */
  const retry = useCallback(() => {
    void saveSnapshot(latestRef.current)
  }, [saveSnapshot])

  return {
    saveStatus,
    saveError,
    flush,
    markSaved,
    cancelPending,
    retry,
  }
}
