"use client"

import { useToast, type Toast } from "@/lib/toast"
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react"

const CONFIG = {
  success: {
    Icon:      CheckCircle2,
    iconBg:    "bg-emerald-500",
    dot:       "bg-emerald-400",
    label:     "text-emerald-400",
  },
  error: {
    Icon:      XCircle,
    iconBg:    "bg-red-500",
    dot:       "bg-red-400",
    label:     "text-red-400",
  },
  warning: {
    Icon:      AlertTriangle,
    iconBg:    "bg-amber-500",
    dot:       "bg-amber-400",
    label:     "text-amber-400",
  },
  info: {
    Icon:      Info,
    iconBg:    "bg-sky-500",
    dot:       "bg-sky-400",
    label:     "text-sky-400",
  },
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToast()
  const c = CONFIG[toast.type]

  return (
    <div
      onClick={() => dismiss(toast.id)}
      className="group relative flex items-center gap-3 w-full cursor-pointer
        px-3.5 py-3 rounded-2xl
        bg-zinc-900 dark:bg-zinc-800
        border border-white/[0.08]
        shadow-[0_8px_32px_rgba(0,0,0,0.45)]
        overflow-hidden select-none"
      style={{ animation: "toastIn 0.2s cubic-bezier(0.34,1.56,0.64,1) forwards" }}
    >
      {/* Icon pill */}
      <div className={`shrink-0 w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center shadow-sm`}>
        <c.Icon className="h-4 w-4 text-white" strokeWidth={2.5} />
      </div>

      {/* Message */}
      <p className="flex-1 text-[13px] font-medium text-white/90 leading-snug tracking-tight">
        {toast.message}
      </p>

      {/* Dismiss dot */}
      <div className={`shrink-0 w-1.5 h-1.5 rounded-full ${c.dot} opacity-70 group-hover:opacity-100 transition-opacity`} />

      {/* Progress track */}
      <div
        className="absolute bottom-0 left-0 h-[2px] rounded-full opacity-30"
        style={{
          background: `var(--progress-color)`,
          animation: "toastProgress 3.2s linear forwards",
          width: "100%",
        }}
      />
      {/* Inline CSS var for progress color per type */}
      <style>{`
        [data-toast-type="${toast.type}"] { --progress-color: ${
          toast.type === "success" ? "#34d399" :
          toast.type === "error"   ? "#f87171" :
          toast.type === "warning" ? "#fbbf24" : "#38bdf8"
        }; }
      `}</style>
    </div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-[90px] left-0 right-0 z-[100] flex flex-col-reverse gap-2 px-5 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto" data-toast-type={t.type}>
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
