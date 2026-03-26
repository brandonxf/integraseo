"use client"
import { useState, useRef, useEffect } from "react"
import { LogOut, User } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"

export function UserMenu() {
  const { profile, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  if (!profile) return null

  const initials = profile.displayName
    .split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full hover:opacity-80 transition-opacity"
        title={profile.displayName}
      >
        {profile.photoURL ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.photoURL} alt={profile.displayName}
            className="w-8 h-8 rounded-full object-cover ring-2 ring-white/30" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white/30">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 w-52 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50">
          {/* Info del usuario */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
            <p className="font-semibold text-gray-900 dark:text-white text-sm truncate">
              {profile.displayName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile.email}</p>
          </div>
          {/* Cerrar sesión */}
          <button
            onClick={() => { setOpen(false); logout() }}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <LogOut size={15} />
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
