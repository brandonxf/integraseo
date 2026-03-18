"use client"

import { useStore } from "@/lib/store"
import { useMemo } from "react"
import {
  FileText, Users, CheckCircle2, Clock, XCircle,
  CalendarCheck, Bell, TrendingUp, Leaf, Sparkles,
  AlertCircle, ChevronRight
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"

// ── Helpers ────────────────────────────────────────────────────────────────────
function localToday() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}-${String(n.getDate()).padStart(2,"0")}`
}
function localMonth() {
  const n = new Date()
  return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,"0")}`
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, icon: Icon, color, accent
}: {
  label: string; value: number | string; sub?: string
  icon: React.FC<{className?:string}>; color: string; accent: string
}) {
  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 ${color} border border-border`}>
      <div className={`absolute -top-3 -right-3 w-16 h-16 rounded-full ${accent} opacity-20`} />
      <div className={`w-9 h-9 rounded-xl ${accent} flex items-center justify-center mb-3`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <p className="text-2xl font-extrabold text-foreground leading-none tracking-tight">{value}</p>
      <p className="text-xs font-semibold text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-muted-foreground w-8 text-right">{pct}%</span>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export function StatsPanel() {
  const contracts = useStore((s) => s.contracts)
  const reminders = useStore((s) => s.reminders)
  const events    = useStore((s) => s.events)

  const today = localToday()
  const month = localMonth()

  const stats = useMemo(() => {
    const active    = contracts.filter(c => c.status === "active").length
    const pending   = contracts.filter(c => c.status === "pending").length
    const completed = contracts.filter(c => c.status === "completed").length

    const totalWorkers = contracts.reduce((acc, c) => acc + (c.workers?.length || 0), 0)
    const totalNotes   = contracts.reduce((acc, c) => acc + (c.notes?.length || 0), 0)
    const totalVisits  = contracts.reduce((acc, c) => acc + (c.visits?.length || 0), 0)

    // Visits this month
    const visitsThisMonth = contracts.reduce((acc, c) => {
      return acc + (c.visits?.filter(v => v.date.startsWith(month)).length || 0)
    }, 0)

    // Reminders
    const pendingReminders  = reminders.filter(r => !r.completed).length
    const overdueReminders  = reminders.filter(r => !r.completed && r.date < today).length
    const completedReminders = reminders.filter(r => r.completed).length

    // Most active contracts (by notes + visits)
    const contractActivity = contracts.map(c => ({
      id: c.id,
      name: c.name,
      client: c.client,
      status: c.status,
      score: (c.notes?.length || 0) + (c.visits?.length || 0),
      workers: c.workers?.length || 0,
      notes: c.notes?.length || 0,
      visits: c.visits?.length || 0,
    })).sort((a, b) => b.score - a.score).slice(0, 4)

    // Workers distribution
    const workerDist = contracts
      .filter(c => (c.workers?.length || 0) > 0)
      .map(c => ({ name: c.name, count: c.workers?.length || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Events this month
    const eventsThisMonth = events.filter(e => e.date.startsWith(month)).length

    return {
      total: contracts.length, active, pending, completed,
      totalWorkers, totalNotes, totalVisits, visitsThisMonth,
      pendingReminders, overdueReminders, completedReminders,
      contractActivity, workerDist, eventsThisMonth,
    }
  }, [contracts, reminders, events, today, month])

  const statusItems = [
    { label: "Activos",     value: stats.active,    color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
    { label: "Pendientes",  value: stats.pending,   color: "bg-amber-500",   text: "text-amber-600 dark:text-amber-400" },
    { label: "Completados", value: stats.completed, color: "bg-sky-500",     text: "text-sky-600 dark:text-sky-400" },
  ]

  if (contracts.length === 0) {
    return (
      <EmptyState illustration="contracts" title="Sin datos aún" description="Crea contratos para ver las estadísticas de tu operación aquí" />
    )
  }

  return (
    <div className="px-4 pb-6 pt-4 space-y-5 animate-fade-up">

      {/* ── Resumen principal ── */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Contratos" value={stats.total} sub={`${stats.active} activos`}
          icon={FileText} color="bg-card" accent="bg-primary" />
        <StatCard label="Operarios" value={stats.totalWorkers} sub="en campo"
          icon={Users} color="bg-card" accent="bg-violet-500" />
        <StatCard label="Visitas este mes" value={stats.visitsThisMonth} sub={`${stats.totalVisits} en total`}
          icon={CalendarCheck} color="bg-card" accent="bg-emerald-500" />
        <StatCard label="Recordatorios" value={stats.pendingReminders} sub={stats.overdueReminders > 0 ? `${stats.overdueReminders} vencidos` : "al día"}
          icon={Bell} color="bg-card" accent={stats.overdueReminders > 0 ? "bg-red-500" : "bg-sky-500"} />
      </div>

      {/* ── Alerta de vencidos ── */}
      {stats.overdueReminders > 0 && (
        <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50">
          <div className="w-8 h-8 rounded-lg bg-red-500 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
              {stats.overdueReminders} recordatorio{stats.overdueReminders !== 1 ? "s" : ""} vencido{stats.overdueReminders !== 1 ? "s" : ""}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/60">Revisa la sección de Recordatorios</p>
          </div>
          <ChevronRight className="h-4 w-4 text-red-400" />
        </div>
      )}

      {/* ── Estado de contratos ── */}
      <div className="bg-card rounded-2xl border border-border p-4">
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
          Estado de Contratos
        </p>
        <div className="space-y-3">
          {statusItems.map(({ label, value, color, text }) => (
            <div key={label}>
              <div className="flex justify-between mb-1">
                <span className={`text-xs font-semibold ${text}`}>{label}</span>
                <span className="text-xs font-bold text-foreground">{value}</span>
              </div>
              <ProgressBar value={value} max={stats.total} color={color} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Contratos más activos ── */}
      {stats.contractActivity.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Contratos Más Activos
          </p>
          <div className="space-y-2.5">
            {stats.contractActivity.map((c, i) => {
              const COLORS = ["bg-violet-500","bg-sky-500","bg-emerald-500","bg-orange-500"]
              return (
                <div key={c.id} className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg ${COLORS[i]} flex items-center justify-center text-[11px] font-bold text-white shrink-0`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">{c.notes} notas · {c.visits} visitas · {c.workers} operarios</p>
                  </div>
                  <div className="shrink-0">
                    {c.status === "active"    && <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Activo</span>}
                    {c.status === "pending"   && <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Pendiente</span>}
                    {c.status === "completed" && <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400">Completado</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Distribución de operarios ── */}
      {stats.workerDist.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">
            Operarios por Contrato
          </p>
          <div className="space-y-2.5">
            {stats.workerDist.map(({ name, count }) => (
              <div key={name}>
                <div className="flex justify-between mb-1">
                  <span className="text-xs font-medium truncate flex-1 pr-2">{name}</span>
                  <span className="text-xs font-bold shrink-0">{count}</span>
                </div>
                <ProgressBar value={count} max={Math.max(...stats.workerDist.map(w => w.count))} color="bg-violet-500" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Resumen de actividad ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Notas",    value: stats.totalNotes,   icon: FileText,     color: "text-primary" },
          { label: "Eventos",  value: stats.eventsThisMonth, icon: CalendarCheck, color: "text-emerald-600 dark:text-emerald-400" },
          { label: "Completados", value: stats.completedReminders, icon: CheckCircle2, color: "text-sky-600 dark:text-sky-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-3 text-center">
            <Icon className={`h-5 w-5 mx-auto mb-1.5 ${color}`} />
            <p className="text-xl font-extrabold leading-none">{value}</p>
            <p className="text-[10px] text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Brigadas hint ── */}
      <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30">
        <div className="flex gap-1.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
            <Leaf className="h-4 w-4 text-white" />
          </div>
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            Brigadas en {stats.total} contrato{stats.total !== 1 ? "s" : ""}
          </p>
          <p className="text-[10px] text-emerald-700/60 dark:text-emerald-400/60">Jardinería y aseo activos</p>
        </div>
      </div>

    </div>
  )
}
