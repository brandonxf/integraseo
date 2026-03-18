"use client"

import { useToast, type Toast } from "@/lib/toast"
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react"

const CONFIG = {
  success: {
    icon: CheckCircle2,
    bar:  "bg-emerald-500",
    bg:   "bg-white dark:bg-zinc-900",
    text: "text-emerald-700 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
    iconColor: "text-emerald-500",
  },
  error: {
    icon: XCircle,
    bar:  "bg-red-500",
    bg:   "bg-white dark:bg-zinc-900",
    text: "text-red-700 dark:text-red-400",
    border: "border-red-200 dark:border-red-800",
    iconColor: "text-red-500",
  },
  warning: {
    icon: AlertTriangle,
    bar:  "bg-amber-400",
    bg:   "bg-white dark:bg-zinc-900",
    text: "text-amber-700 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    bar:  "bg-sky-500",
    bg:   "bg-white dark:bg-zinc-900",
    text: "text-sky-700 dark:text-sky-400",
    border: "border-sky-200 dark:border-sky-800",
    iconColor: "text-sky-500",
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToast()
  const c = CONFIG[toast.type]
  const Icon = c.icon

  return (
    <div
      onClick={() => dismiss(toast.id)}
      className={`
        relative flex items-center gap-3 w-full max-w-sm mx-auto
        px-4 py-3 rounded-2xl border shadow-lg shadow-black/10
        cursor-pointer overflow-hidden
        ${c.bg} ${c.border}
        animate-[toastIn_0.25s_ease-out_forwards]
      `}
      style={{ animation: "toastIn 0.25s ease-out forwards" }}
    >
      {/* Left color bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${c.bar}`} />

      {/* Icon */}
      <div className={`shrink-0 ml-1 ${c.iconColor}`}>
        <Icon className="h-5 w-5" />
      </div>

      {/* Message */}
      <p className={`flex-1 text-sm font-medium leading-snug ${c.text}`}>
        {toast.message}
      </p>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); dismiss(toast.id) }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress bar */}
      <div className={`absolute bottom-0 left-0 h-0.5 ${c.bar} opacity-40`}
        style={{ animation: "toastProgress 3.2s linear forwards", width: "100%" }} />
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-[90px] left-0 right-0 z-[100] flex flex-col-reverse gap-2 px-4 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
