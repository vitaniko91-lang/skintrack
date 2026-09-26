export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-extrabold lowercase tracking-[-0.03em] ${className}`} style={{ fontStretch: '125%' }}>
      skintrack<sup className="ml-1 align-super text-[0.25em] font-medium">®</sup>
    </span>
  )
}
