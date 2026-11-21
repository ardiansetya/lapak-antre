/**
 * Switch theme with a circular reveal from (x, y), using the View Transitions API.
 * Falls back to an instant switch where the API is missing or reduced motion is on.
 */
export function switchTheme(next: "light" | "dark", setTheme: (theme: string) => void, x?: number, y?: number) {
  const root = document.documentElement
  const apply = () => {
    // Set the class now so the "new" snapshot already shows the new theme; next-themes persists it.
    root.classList.toggle("dark", next === "dark")
    root.style.colorScheme = next
    setTheme(next)
  }
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return apply()

  const cx = x ?? innerWidth / 2
  const cy = y ?? innerHeight / 2
  const radius = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy))
  const transition = document.startViewTransition(apply)
  transition.ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${cx}px ${cy}px)`, `circle(${radius}px at ${cx}px ${cy}px)`] },
      { duration: 600, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", pseudoElement: "::view-transition-new(root)" },
    )
  })
}
