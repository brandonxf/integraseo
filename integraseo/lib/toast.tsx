"use client"

import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from "react"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toasts: Toast[]
  success: (msg: string) => void
  error:   (msg: string) => void
  warning: (msg: string) => void
  info:    (msg: string) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const dismiss = useCallback((id: string) => {
    clearTimeout(timers.current[id])
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const add = useCallback((message: string, type: ToastType) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev.slice(-3), { id, message, type }]) // max 4 at once
    timers.current[id] = setTimeout(() => dismiss(id), 3200)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{
      toasts,
      success: (m) => add(m, "success"),
      error:   (m) => add(m, "error"),
      warning: (m) => add(m, "warning"),
      info:    (m) => add(m, "info"),
      dismiss,
    }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be inside ToastProvider")
  return ctx
}
