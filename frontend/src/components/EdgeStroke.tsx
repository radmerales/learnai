export function EdgeStroke({ path, selected = false }: { path: string; selected?: boolean }) {
  return (
    <path
      d={path}
      fill="none"
      stroke={selected ? "#000000" : "#3f3e3e"}
      strokeWidth={selected ? 3.25 : 2.25}
      strokeLinecap="round"
      strokeDasharray="6 5"
    />
  )
}
