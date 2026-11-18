export type ContextMenuItem = {
  label: string
  onSelect: () => void
  danger?: boolean
  checked?: boolean
}

export type ContextMenuState = {
  label: string
  x: number
  y: number
  items: ContextMenuItem[]
}
