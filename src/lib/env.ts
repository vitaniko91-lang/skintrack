export function prefersReducedMotion(search = window.location.search): boolean {
  if (new URLSearchParams(search).has('static')) return true
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
}

export function canUseWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}
