export function EdgeStroke({ path }: { path: string }) {
  return (
    <path d={path} fill="none" stroke="#3f3e3e" strokeWidth={2.25} strokeLinecap="round" strokeDasharray="6 5" />
  )
}
