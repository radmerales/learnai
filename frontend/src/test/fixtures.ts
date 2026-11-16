import type { Link, Node } from "../graph"

/** Small reusable objects so each test only states the fields it cares about. */
export function makeNode(overrides: Partial<Node> = {}): Node {
  return {
    id: "n1",
    label: "Node 1",
    blocks: [""],
    questions: [],
    status: "todo",
    x: 100,
    y: 100,
    width: 140,
    ...overrides,
  }
}

export function makeLink(overrides: Partial<Link> = {}): Link {
  return {
    id: "l1",
    from: "n1",
    to: "n2",
    fromSide: "right",
    toSide: "left",
    ...overrides,
  }
}
