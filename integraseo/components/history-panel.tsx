"use client"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { FileText, StickyNote, Users, CalendarCheck, Trash2, Edit, Clock } from "lucide-react"
import type { HistoryEntry } from "@/lib/types"

interface HistoryPanelProps {
  contractId: string
}

function fmtTimestamp(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffH   = Math.floor(diffMs / 3600000)
  const diffD   = Math.floor(diffMs / 86400000)

  if (diffMin < 1)  return "Ahora mismo"
  if (diffMin < 60) return `Hace ${diffMin} min`
  if (diffH < 24)   return `Hace ${diffH}h`
  if (diffD === 1)  return "Ayer"
  if (diffD < 7)    return `Hace ${diffD} días`
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })
}

function fmtFull(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  })
}

function EntryIcon({ action, category }: { action: string; category: string }) {
  const cls = "h-4 w-4"
  if (action.includes("eliminado") || action.includes("eliminada")) return <Trash2 className={`${cls} text-red-500`} />
  if (action.includes("editado")   || action.includes("editada"))   return <Edit  className={`${cls} text-amber-500`} />
  if (category === "note")   return <StickyNote      className={`${cls} text-yellow-500`} />
  if (category === "worker") return <Users           className={`${cls} text-violet-500`} />
  if (category === "visit")  return <CalendarCheck   className={`${cls} text-emerald-500`} />
  return                            <FileText        className={`${cls} text-primary`} />
}

function entryColor(action: string) {
  if (action.includes("eliminado") || action.includes("eliminada")) return "bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30"
  if (action.includes("editado")   || action.includes("editada"))   return "bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30"
  if (action.includes("creado")    || action.includes("añadido") || action.includes("confirmada")) return "bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30"
  return "bg-card border-border"
}

export function HistoryPanel({ contractId }: HistoryPanelProps) {
  const getHistory = useStore((s) => s.getHistory)
  const [entries, setEntries] = useState<HistoryEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    getHistory(contractId).then((h) => {
      setEntries(h)
      setLoading(false)
    })
  }, [contractId, getHistory])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
        <span className="text-sm">Cargando historial...</span>
      </div>
    )
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground animate-fade-up">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
          <Clock className="h-7 w-7 opacity-40" />
        </div>
        <p className="text-sm font-semibold">Sin historial aún</p>
        <p className="text-xs mt-1">Las acciones sobre este contrato<br/>quedarán registradas aquí</p>
      </div>
    )
  }

  // Group entries by date
  const groups: Record<string, HistoryEntry[]> = {}
  entries.forEach((e) => {
    const day = e.timestamp.split("T")[0]
    if (!groups[day]) groups[day] = []
    groups[day].push(e)
  })

  return (
    <div className="space-y-4 animate-fade-up pb-4">
      {Object.entries(groups).map(([day, items]) => (
        <div key={day}>
          {/* Date separator */}
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide px-2">
              {new Date(day + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })}
            </span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Entries */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

            <div className="space-y-2">
              {items.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 pl-1">
                  {/* Timeline dot */}
                  <div className={`relative z-10 w-8 h-8 rounded-full border-2 border-background flex items-center justify-center shrink-0 shadow-sm ${entryColor(entry.action)}`}>
                    <EntryIcon action={entry.action} category={entry.category} />
                  </div>

                  {/* Card */}
                  <div className={`flex-1 p-3 rounded-xl border mb-1 ${entryColor(entry.action)}`}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-tight">{entry.action}</p>
                      <span
                        className="text-[10px] text-muted-foreground shrink-0 mt-0.5 cursor-default"
                        title={fmtFull(entry.timestamp)}
                      >
                        {fmtTimestamp(entry.timestamp)}
                      </span>
                    </div>
                    {entry.detail && (
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{entry.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <p className="text-center text-xs text-muted-foreground pt-2">
        {entries.length} evento{entries.length !== 1 ? "s" : ""} registrado{entries.length !== 1 ? "s" : ""}
      </p>
    </div>
  )
}
