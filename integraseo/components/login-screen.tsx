"use client"
import { useState } from "react"
import { Eye, EyeOff, LogIn, UserPlus, Chrome } from "lucide-react"
import { useAuthStore } from "@/lib/auth-store"

type Mode = "login" | "register"

export function LoginScreen() {
  const { loginEmail, registerEmail, loginGoogle, loading } = useAuthStore()
  const [mode, setMode] = useState<Mode>("login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    try {
      if (mode === "login") {
        await loginEmail(email, password)
      } else {
        if (!name.trim()) { setError("Ingresa tu nombre"); return }
        await registerEmail(email, password, name.trim())
      }
    } catch (err: any) {
      const msg: Record<string, string> = {
        "auth/user-not-found":        "No existe una cuenta con ese correo",
        "auth/wrong-password":        "Contraseña incorrecta",
        "auth/email-already-in-use":  "Ese correo ya está registrado",
        "auth/weak-password":         "La contraseña debe tener al menos 6 caracteres",
        "auth/invalid-email":         "Correo inválido",
        "auth/invalid-credential":    "Correo o contraseña incorrectos",
        "auth/popup-closed-by-user":  "Ventana cerrada. Intenta de nuevo.",
      }
      setError(msg[err.code] ?? err.message ?? "Error desconocido")
    }
  }

  const handleGoogle = async () => {
    setError("")
    try { await loginGoogle() }
    catch (err: any) {
      if (err.code !== "auth/popup-closed-by-user") setError("Error al iniciar con Google")
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#07105e] px-4">
      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-white tracking-tight">Integraseo</h1>
        <p className="text-blue-200 text-sm mt-1">Gestión de contratos y brigadas</p>
      </div>

      <div className="w-full max-w-sm bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6">
        {/* Tabs */}
        <div className="flex rounded-xl bg-gray-100 dark:bg-gray-800 p-1 mb-6">
          {(["login", "register"] as Mode[]).map(m => (
            <button key={m} onClick={() => { setMode(m); setError("") }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-white dark:bg-gray-700 text-[#07105e] dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              }`}>
              {m === "login" ? "Ingresar" : "Registrarse"}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Nombre completo
              </label>
              <input
                value={name} onChange={e => setName(e.target.value)}
                placeholder="Tu nombre"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#07105e]"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Correo electrónico
            </label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com" required
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#07105e]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"} value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === "register" ? "Mínimo 6 caracteres" : "••••••••"} required
                className="w-full px-4 py-2.5 pr-11 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#07105e]"
              />
              <button type="button" onClick={() => setShowPass(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2.5 text-red-700 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#07105e] hover:bg-[#0d1a7a] text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : mode === "login" ? (
              <><LogIn size={16} /> Ingresar</>
            ) : (
              <><UserPlus size={16} /> Crear cuenta</>
            )}
          </button>
        </form>

        {/* Divisor */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
          <span className="text-xs text-gray-400">o continúa con</span>
          <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
        </div>

        <button onClick={handleGoogle} disabled={loading}
          className="w-full py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center gap-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60">
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Google
        </button>
      </div>

      <p className="text-blue-300 text-xs mt-6 text-center">
        Tus datos están protegidos y son privados para tu cuenta
      </p>
    </div>
  )
}
