"use client"

import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import { switchTheme } from "@/lib/theme-transition"

export function ModeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Ganti tema terang atau gelap"
      onClick={(e) => switchTheme(resolvedTheme === "dark" ? "light" : "dark", setTheme, e.clientX, e.clientY)}
    >
      {/* Each icon spins in when it becomes visible after the switch. */}
      <SunIcon className="hidden dark:block motion-safe:animate-in motion-safe:spin-in-90 motion-safe:duration-500" />
      <MoonIcon className="dark:hidden motion-safe:animate-in motion-safe:spin-in-90 motion-safe:duration-500" />
    </Button>
  )
}
