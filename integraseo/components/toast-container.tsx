"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useToast, type Toast } from "@/lib/toast"
import { CheckCircle2, AlertTriangle, Info, XOctagon, X } from "lucide-react"

const CONFIG = {
  success: {
    Icon:       CheckCircle2,
    iconColor:  "text-emerald-500",
    border:     "border-emerald-200 dark:border-emerald-800",
    bar:        "bg-emerald-500",
    label:      "text-emerald-600 dark:text-emerald-400",
  },
  error: {
    Icon:       XOctagon,
    iconColor:  "text-red-500",
    border:     "border-red-200 dark:border-red-800",
    bar:        "bg-red-500",
    label:      "text-red-600 dark:text-red-400",
  },
  warning: {
    Icon:       AlertTriangle,
    iconColor:  "text-amber-500",
    border:     "border-amber-200 dark:border-amber-800",
    bar:        "bg-amber-500",
    label:      "text-amber-600 dark:text-amber-400",
  },
  info: {
    Icon:       Info,
    iconColor:  "text-sky-500",
    border:     "border-sky-200 dark:border-sky-800",
    bar:        "bg-sky-500",
    label:      "text-sky-600 dark:text-sky-400",
  },
}

const TYPE_LABEL = {
  success: "Éxito",
  error:   "Error",
  warning: "Aviso",
  info:    "Info",
}

function ToastItem({ toast }: { toast: Toast }) {
  const { dismiss } = useToast()
  const c = CONFIG[toast.type]

  return (
    <motion.div
      layout
      role="alert"
      initial={{ opacity: 0, y: 40, scale: 0.85 }}
      animate={{ opacity: 1, y: 0,  scale: 1    }}
      exit={{    opacity: 0, y: 16, scale: 0.92  }}
      transition={{ type: "spring", stiffness: 280, damping: 22 }}
      className={`
        relative w-full overflow-hidden rounded-xl
        bg-background border shadow-lg shadow-black/8
        flex items-start gap-3 p-4
        ${c.border}
      `}
    >
      {/* Colored left accent bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-[3px] ${c.bar} rounded-l-xl`} />

      {/* Icon */}
      <div className="shrink-0 mt-0.5 pl-1">
        <c.Icon className={`h-5 w-5 ${c.iconColor}`} strokeWidth={2} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={`text-[11px] font-bold uppercase tracking-widest mb-0.5 ${c.label}`}>
          {TYPE_LABEL[toast.type]}
        </p>
        <p className="text-sm font-medium text-foreground leading-snug">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={() => dismiss(toast.id)}
        className="shrink-0 mt-0.5 p-1 rounded-lg text-muted-foreground
          hover:text-foreground hover:bg-muted transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-4 w-4" />
      </button>

      {/* Progress bar */}
      <div
        className={`absolute bottom-0 left-0 h-[2px] ${c.bar} opacity-25`}
        style={{ animation: "toastProgress 3.2s linear forwards", width: "100%" }}
      />
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useToast()

  return (
    <div className="fixed bottom-[90px] left-0 right-0 z-[100] flex flex-col-reverse gap-2 px-4 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem toast={t} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
