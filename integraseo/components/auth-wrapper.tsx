"use client"
import { useEffect, useRef } from "react"
import { useAuthStore } from "@/lib/auth-store"
import { useStore, setCurrentUid } from "@/lib/store"
import { LoginScreen } from "./login-screen"

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const { init, user, initialized } = useAuthStore()
  const loadAll = useStore(s => s.loadAll)
  const clearData = useStore(s => s.clearData)
  const prevUid = useRef<string | null>(null)

  // Inicializar listener de Auth una sola vez
  useEffect(() => {
    const unsub = init()
    return unsub
  }, [])

  // Cuando cambia el usuario: actualizar uid en store y recargar datos
  useEffect(() => {
    if (!initialized) return
    const uid = user?.uid ?? null
    if (uid === prevUid.current) return
    prevUid.current = uid
    setCurrentUid(uid)
    if (uid) {
      loadAll()
    } else {
      clearData()
    }
  }, [user, initialized])

  // Splash mientras verifica sesión
  if (!initialized) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#07105e]">
        <h1 className="text-2xl font-extrabold text-white mb-4">Integraseo</h1>
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen />

  return <>{children}</>
}
