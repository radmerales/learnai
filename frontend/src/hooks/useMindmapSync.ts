import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  createMindmap,
  deleteMindmap,
  getMindmap,
  listMindmaps,
} from "../api/mindmaps"
import type { MindmapResource, MindmapSummary } from "../api/types"
import type { Link, Node } from "../graph"
import { errorMessage } from "../errors"
import { readRememberedId, rememberId, summarize } from "../mindmapLibrary"
import {
  UNTITLED_MINDMAP,
  emptyMindmap,
  fromMindmapDocument,
  toMindmapDocument,
} from "../persistence"
import { useMindmapAutosave } from "./useMindmapAutosave"

type Options = {
  nodes: Node[]
  links: Link[]
  onLoad: (nodes: Node[], links: Link[]) => void
}

/**
 * Connects graph state to the HTTP API.
 *
 * React state (useState) drives rendering. Refs (useRef) hold values that
 * async callbacks need to read later, such as "which map is open right now" —
 * changing a ref does not tell React to re-render, which is exactly what we
 * want for bookkeeping values.
 *
 * The flow is:
 *   1. On mount, ask the API for the map list.
 *   2. Load one map (or create an empty one) and copy it into graph state.
 *   3. Every edit changes `document`; useMindmapAutosave sends it after a pause.
 *   4. Map switches flush the current save before loading the next map.
 */
export function useMindmapSync({ nodes, links, onLoad }: Options) {
  const [summaries, setSummaries] = useState<MindmapSummary[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [title, setTitleState] = useState(UNTITLED_MINDMAP)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const onLoadRef = useRef(onLoad)
  const currentIdRef = useRef<string | null>(null)
  const summariesRef = useRef<MindmapSummary[]>([])

  // Keep refs in sync after each render. Effects run after React commits the
  // UI, so event handlers and timers can read the newest values.
  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  useEffect(() => {
    summariesRef.current = summaries
  }, [summaries])

  // Convert the graph into the JSON document shape the API understands.
  // useMemo avoids rebuilding the object when unrelated state changes.
  const document = useMemo(
    () => toMindmapDocument(title, nodes, links),
    [title, nodes, links],
  )
  const documentJson = useMemo(() => JSON.stringify(document), [document])

  const handleSaved = useCallback((resource: MindmapResource) => {
    setSummaries((previous) =>
      previous.map((item) => (item.id === resource.id ? summarize(resource) : item)),
    )
  }, [])

  const autosave = useMindmapAutosave({
    currentId,
    document,
    documentJson,
    loading,
    onSaved: handleSaved,
  })
  const { markSaved, flush, cancelPending, retry } = autosave

  /**
   * React state updates are asynchronous. `applyResource` therefore updates
   * both the React state (for rendering) and the currentIdRef (for immediate
   * use by save/switch logic).
   */
  const applyResource = useCallback(
    (resource: MindmapResource) => {
      const loaded = fromMindmapDocument(resource)
      onLoadRef.current(loaded.nodes, loaded.links)

      const normalized = toMindmapDocument(resource.title, loaded.nodes, loaded.links)
      currentIdRef.current = resource.id
      setCurrentId(resource.id)
      setTitleState(resource.title)
      markSaved(resource.id, JSON.stringify(normalized))
      rememberId(resource.id)
    },
    [markSaved],
  )

  /**
   * First load: use the map remembered in localStorage, otherwise the most
   * recently updated map, otherwise create a brand-new empty map. If the list
   * request fails, do not create anything — that would duplicate maps whenever
   * the backend is briefly unavailable.
   *
   * `await` pauses only this function, not the whole browser. React keeps the
   * UI responsive while the request is in flight.
   */
  const loadLibrary = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      if (currentIdRef.current) {
        const flushed = await flush()
        if (!flushed) {
          setLoadError("Could not save the current map before reloading.")
          return
        }
      }

      const list = await listMindmaps()
      setSummaries(list)

      const remembered = readRememberedId()
      const target = list.find((item) => item.id === remembered) ?? list[0] ?? null

      if (target) {
        applyResource(await getMindmap(target.id))
      } else {
        const created = await createMindmap(emptyMindmap())
        applyResource(created)
        setSummaries([summarize(created)])
      }
    } catch (error) {
      setLoadError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [applyResource, flush])

  // The empty dependency array would normally mean "run once after mount".
  // StrictMode intentionally runs effects twice in development, so the ref
  // guard prevents two simultaneous "load or create" requests.
  const bootedRef = useRef(false)
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    void loadLibrary()
  }, [loadLibrary])

  const openMap = useCallback(
    async (id: string) => {
      if (id === currentIdRef.current) return
      setLoading(true)
      setLoadError(null)

      try {
        // Switching maps without flushing could cancel the pending debounce
        // timer and lose the user's last edit.
        const flushed = await flush()
        if (!flushed) {
          setLoadError("Could not save the current map before switching.")
          return
        }
        applyResource(await getMindmap(id))
      } catch (error) {
        setLoadError(errorMessage(error))
      } finally {
        setLoading(false)
      }
    },
    [applyResource, flush],
  )

  const newMap = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const flushed = await flush()
      if (!flushed) {
        setLoadError("Could not save the current map before creating a new one.")
        return
      }

      const created = await createMindmap(emptyMindmap())
      applyResource(created)
      setSummaries((previous) => [
        summarize(created),
        ...previous.filter((item) => item.id !== created.id),
      ])
    } catch (error) {
      setLoadError(errorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [applyResource, flush])

  const deleteMap = useCallback(
    async (id: string) => {
      const deletingCurrent = currentIdRef.current === id
      // Stop a pending debounce from saving a map we are about to delete.
      if (deletingCurrent) cancelPending()

      setLoading(true)
      setLoadError(null)

      try {
        await deleteMindmap(id)
        const remaining = summariesRef.current.filter((item) => item.id !== id)
        setSummaries(remaining)

        if (!deletingCurrent) return

        currentIdRef.current = null
        setCurrentId(null)
        rememberId(null)

        if (remaining.length > 0) {
          applyResource(await getMindmap(remaining[0].id))
        } else {
          const created = await createMindmap(emptyMindmap())
          applyResource(created)
          setSummaries([summarize(created)])
        }
      } catch (error) {
        setLoadError(errorMessage(error))
      } finally {
        setLoading(false)
      }
    },
    [applyResource, cancelPending],
  )

  /**
   * The title is part of the saved document too. Updating the summary list
   * immediately makes the map picker show the new name before the debounce
   * fires the next save.
   */
  const setTitle = useCallback((next: string) => {
    setTitleState(next)
    const id = currentIdRef.current
    if (!id) return
    setSummaries((previous) =>
      previous.map((item) => (item.id === id ? { ...item, title: next } : item)),
    )
  }, [])

  return {
    title,
    setTitle,
    summaries,
    currentId,
    loading,
    loadError,
    saveStatus: autosave.saveStatus,
    saveError: autosave.saveError,
    openMap,
    newMap,
    deleteMap,
    retrySave: retry,
    reload: loadLibrary,
  }
}
