import { cn } from "@/lib/utils"

const SIZES = {
  sm: "h-8 w-6 text-lg rounded-[3px]",
  md: "h-12 w-9 text-3xl rounded-[4px]",
  lg: "h-20 w-14 text-6xl rounded-md",
  xl: "h-[clamp(5rem,13vw,11rem)] w-[clamp(3.5rem,9vw,7.5rem)] text-[clamp(3.5rem,10vw,8.5rem)] rounded-lg",
} as const

/**
 * A ticket code as split-flap tiles, like a station departure board.
 * Each character is keyed by its value, so a changed character remounts and flips in.
 */
export function FlapCode({
  code,
  size = "md",
  className,
}: {
  code: string
  size?: keyof typeof SIZES
  className?: string
}) {
  return (
    <span role="img" aria-label={`Nomor ${code}`} className={cn("inline-flex gap-[0.12em] [perspective:600px]", className)}>
      {[...code].map((char, i) => (
        <span
          key={`${i}-${char}`}
          aria-hidden
          style={{ "--i": i } as React.CSSProperties}
          className={cn(
            "animate-flap relative flex items-center justify-center bg-board font-mono font-semibold text-board-foreground ring-1 ring-white/12 shadow-[inset_0_-2px_0_rgb(0_0_0/0.35)]",
            // the hinge line across the middle of a flap
            "after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-black/55",
            char === "-" && "w-auto bg-transparent px-0.5 text-foreground/50 shadow-none after:hidden",
            SIZES[size],
          )}
        >
          {char}
        </span>
      ))}
    </span>
  )
}

/** Dashed tear line with punched notches, for ticket-stub cards. Place directly inside a Card. */
export function Perforation({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("relative h-0 border-t-2 border-dashed", className)}>
      <span className="absolute -top-3 -left-3 size-6 rounded-full bg-background" />
      <span className="absolute -top-3 -right-3 size-6 rounded-full bg-background" />
    </div>
  )
}
