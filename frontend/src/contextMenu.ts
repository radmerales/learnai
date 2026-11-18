export type ContextMenuItem = {
  label: string
  onSelect?: () => void
  danger?: boolean
  checked?: boolean
  submenu?: ContextMenuItem[]
}

export type ContextMenuState = {
  label: string
  x: number
  y: number
  items: ContextMenuItem[]
}
