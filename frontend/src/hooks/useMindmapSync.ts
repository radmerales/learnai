import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import {
  createMindmap,
  deleteMindmap,
  getMindmap,
  listMindmaps,
  saveMindmap,
} from "../api/mindmaps"
import type { MindmapDocument, MindmapResource, MindmapSummary } from "../api/types"
import type { Link, Node } from "../graph"
import {
  UNTITLED_MINDMAP,
  emptyMindmap,
  fromMindmapDocument,
  toMindmapDocument,
  type SaveStatus,
} from "../persistence"

const LAST_MAP_KEY = "learnai.lastMindmapId"
const AUTOSAVE_DELAY_MS = 800

type Snapshot = {
  id: string | null
  json: string
  document: MindmapDocument
}

type Options = {
  nodes: Node[]
  links: Link[]
  onLoad: (nodes: Node[], links: Link[]) => void
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong"
}

function summarize(resource: MindmapResource): MindmapSummary {
  return {
    id: resource.id,
    title: resource.title,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
  }
}

function readRememberedId(): string | null {
  try {
    return window.localStorage.getItem(LAST_MAP_KEY)
  } catch {
    return null
  }
}

function rememberId(id: string | null) {
  try {
    if (id) {
      window.localStorage.setItem(LAST_MAP_KEY, id)
    } else {
      window.localStorage.removeItem(LAST_MAP_KEY)
    }
  } catch {
    // Private browsing or storage policies can disable localStorage.
  }
}

export function useMindmapSync({ nodes, links, onLoad }: Options) {
  const [summaries, setSummaries] = useState<MindmapSummary[]>([])
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [title, setTitleState] = useState(UNTITLED_MINDMAP)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [saveError, setSaveError] = useState<string | null>(null)

  const onLoadRef = useRef(onLoad)
  const currentIdRef = useRef<string | null>(null)
  const summariesRef = useRef<MindmapSummary[]>([])
  const lastSavedRef = useRef<{ id: string; json: string } | null>(null)
  const saveChainRef = useRef<Promise<void>>(Promise.resolve())
  const autosaveTimerRef = useRef<number | null>(null)

  const document = useMemo(
    () => toMindmapDocument(title, nodes, links),
    [title, nodes, links],
  )
  const documentJson = useMemo(() => JSON.stringify(document), [document])
  const latestRef = useRef<Snapshot>({
    id: currentId,
    json: documentJson,
    document,
  })

  useEffect(() => {
    onLoadRef.current = onLoad
  }, [onLoad])

  useEffect(() => {
    summariesRef.current = summaries
  }, [summaries])

  useEffect(() => {
    latestRef.current = { id: currentId, json: documentJson, document }
  }, [currentId, document, documentJson])

  const applyResource = useCallback((resource: MindmapResource) => {
    const loaded = fromMindmapDocument(resource)
    onLoadRef.current(loaded.nodes, loaded.links)

    const normalized = toMindmapDocument(resource.title, loaded.nodes, loaded.links)
    currentIdRef.current = resource.id
    setCurrentId(resource.id)
    setTitleState(resource.title)
    lastSavedRef.current = { id: resource.id, json: JSON.stringify(normalized) }
    setSaveStatus("saved")
    setSaveError(null)
    rememberId(resource.id)
  }, [])

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
        setSummaries((previous) =>
          previous.map((item) => (item.id === resource.id ? summarize(resource) : item)),
        )

        if (currentIdRef.current === id) {
          const latest = latestRef.current
          setSaveStatus(
            latest.id === id && latest.json !== snapshot.json ? "unsaved" : "saved",
          )
        }
        return true
      } catch (error) {
        if (currentIdRef.current === id) {
          setSaveStatus("error")
          setSaveError(messageOf(error))
        }
        return false
      }
    }

    const result = saveChainRef.current.then(run, run)
    saveChainRef.current = result.then(
      () => undefined,
      () => undefined,
    )
    return result
  }, [])

  const flushLatest = useCallback((): Promise<boolean> => {
    const snapshot = latestRef.current
    if (!snapshot.id) return Promise.resolve(true)
    return saveSnapshot(snapshot)
  }, [saveSnapshot])

  const loadLibrary = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      if (currentIdRef.current) {
        const flushed = await flushLatest()
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
      setLoadError(messageOf(error))
    } finally {
      setLoading(false)
    }
  }, [applyResource, flushLatest])

  const bootedRef = useRef(false)
  useEffect(() => {
    if (bootedRef.current) return
    bootedRef.current = true
    void loadLibrary()
  }, [loadLibrary])

  useEffect(() => {
    if (loading || !currentId) return

    const saved = lastSavedRef.current
    if (saved && saved.id === currentId && saved.json === documentJson) return

    setSaveStatus("unsaved")
    const timer = window.setTimeout(() => {
      const snapshot = latestRef.current
      if (snapshot.id === currentId) void saveSnapshot(snapshot)
    }, AUTOSAVE_DELAY_MS)
    autosaveTimerRef.current = timer

    return () => {
      window.clearTimeout(timer)
      if (autosaveTimerRef.current === timer) autosaveTimerRef.current = null
    }
  }, [currentId, documentJson, loading, saveSnapshot])

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

  const cancelPendingSave = useCallback(() => {
    if (autosaveTimerRef.current === null) return
    window.clearTimeout(autosaveTimerRef.current)
    autosaveTimerRef.current = null
  }, [])

  const openMap = useCallback(
    async (id: string) => {
      if (id === currentIdRef.current) return
      setLoading(true)
      setLoadError(null)

      try {
        const flushed = await flushLatest()
        if (!flushed) {
          setLoadError("Could not save the current map before switching.")
          return
        }
        applyResource(await getMindmap(id))
      } catch (error) {
        setLoadError(messageOf(error))
      } finally {
        setLoading(false)
      }
    },
    [applyResource, flushLatest],
  )

  const newMap = useCallback(async () => {
    setLoading(true)
    setLoadError(null)

    try {
      const flushed = await flushLatest()
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
      setLoadError(messageOf(error))
    } finally {
      setLoading(false)
    }
  }, [applyResource, flushLatest])

  const deleteMap = useCallback(
    async (id: string) => {
      const deletingCurrent = currentIdRef.current === id
      if (deletingCurrent) cancelPendingSave()

      setLoading(true)
      setLoadError(null)

      try {
        await deleteMindmap(id)
        const remaining = summariesRef.current.filter((item) => item.id !== id)
        setSummaries(remaining)

        if (!deletingCurrent) return

        currentIdRef.current = null
        setCurrentId(null)
        lastSavedRef.current = null
        rememberId(null)

        if (remaining.length > 0) {
          applyResource(await getMindmap(remaining[0].id))
        } else {
          const created = await createMindmap(emptyMindmap())
          applyResource(created)
          setSummaries([summarize(created)])
        }
      } catch (error) {
        setLoadError(messageOf(error))
      } finally {
        setLoading(false)
      }
    },
    [applyResource, cancelPendingSave],
  )

  const retrySave = useCallback(() => {
    void saveSnapshot(latestRef.current)
  }, [saveSnapshot])

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
    saveStatus,
    saveError,
    openMap,
    newMap,
    deleteMap,
    retrySave,
    reload: loadLibrary,
  }
}

export type MindmapSync = ReturnType<typeof useMindmapSync>
