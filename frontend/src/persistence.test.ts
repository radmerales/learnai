import { describe, expect, it } from "vitest"

import {
  UNTITLED_MINDMAP,
  emptyMindmap,
  fromMindmapDocument,
  toMindmapDocument,
} from "./persistence"
import { makeLink, makeNode } from "./test/fixtures"

describe("mindmap persistence format", () => {
  it("nests Learn blocks and Quiz questions under each node", () => {
    const node = makeNode({
      blocks: ["# Respiration", "- ATP"],
      questions: [
        {
          id: "q1",
          prompt: "Where?",
          options: ["Cytosol", "Nucleus"],
          answerIndex: 0,
        },
      ],
    })

    const document = toMindmapDocument("Biology", [node], [])

    expect(document.schemaVersion).toBe(1)
    expect(document.nodes[0].learn.blocks).toEqual(["# Respiration", "- ATP"])
    expect(document.nodes[0].quiz.questions[0].answerIndex).toBe(0)
  })

  it("round-trips a map back into graph state", () => {
    const nodes = [makeNode(), makeNode({ id: "n2", label: "Node 2", x: 400 })]
    const links = [makeLink()]

    const document = toMindmapDocument("Review", nodes, links)
    const loaded = fromMindmapDocument(document)

    expect(loaded.nodes).toEqual(nodes)
    expect(loaded.links).toEqual(links)
  })

  it("falls back to an untitled name for blank titles", () => {
    expect(toMindmapDocument("   ", [], []).title).toBe(UNTITLED_MINDMAP)
  })

  it("starts a new empty map at schema version 1", () => {
    const document = emptyMindmap()

    expect(document.schemaVersion).toBe(1)
    expect(document.nodes).toEqual([])
    expect(document.links).toEqual([])
  })

  it("rejects documents from an unknown schema version", () => {
    const document = { ...emptyMindmap(), schemaVersion: 2 as 1 }

    expect(() => fromMindmapDocument(document)).toThrow("Unsupported mindmap schema version")
  })
})
