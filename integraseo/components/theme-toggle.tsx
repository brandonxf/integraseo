"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="w-8 h-8"/>
  return (
    <button
      onClick={() => setTheme(resolvedTheme==="dark"?"light":"dark")}
      aria-label="Cambiar tema"
      className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors backdrop-blur-sm"
    >
      {resolvedTheme==="dark"
        ? <Sun className="h-4 w-4 text-white"/>
        : <Moon className="h-4 w-4 text-white"/>
      }
    </button>
  )
}
