type Props = {
  size?: number
  strokeWidth?: number
}

export function TrashIcon({ size = 16, strokeWidth = 1.5 }: Props) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="square"
    >
      <path d="M3 4.5h10M6 4.5V3h4v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5M6.5 7v3.5M9.5 7v3.5" />
    </svg>
  )
}
