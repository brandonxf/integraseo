"use client"

import { useEffect, useState } from "react"
import { FileText, Calendar, Bell, Users, UserPlus } from "lucide-react"
import { ContractsList } from "@/components/contracts-list"
import { CalendarPanel } from "@/components/calendar-panel"
import { RemindersPanel } from "@/components/reminders-panel"
import { BrigadasPanel } from "@/components/brigadas-panel"
import { SupernumerariosPanel } from "@/components/supernumerarios-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { useStore } from "@/lib/store"

type View = "contracts" | "calendar" | "reminders" | "brigadas" | "supernumerarios"

const NAV_ITEMS: { id: View; label: string; short: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "contracts",        label: "Contratos",       short: "Contratos",  Icon: FileText  },
  { id: "calendar",         label: "Calendario",      short: "Calendario", Icon: Calendar  },
  { id: "reminders",        label: "Recordatorios",   short: "Recordat.",  Icon: Bell      },
  { id: "brigadas",         label: "Brigadas",        short: "Brigadas",   Icon: Users     },
  { id: "supernumerarios",  label: "Supernumerarios", short: "Supern.",    Icon: UserPlus  },
]

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("contracts")
  const [prevView, setPrevView] = useState<View>("contracts")
  const loadAll = useStore((s) => s.loadAll)
  const loading = useStore((s) => s.loading)

  useEffect(() => { loadAll() }, [loadAll])

  const navigate = (id: View) => {
    setPrevView(currentView)
    setCurrentView(id)
  }

  const currentItem = NAV_ITEMS.find((n) => n.id === currentView)!

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between px-5 py-4
        bg-gradient-to-r from-primary/90 to-primary
        dark:from-primary/70 dark:to-primary/80
        shadow-lg shadow-primary/20">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
            <currentItem.Icon className="h-4 w-4 text-white" />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-white leading-none tracking-tight">
              {currentItem.label}
            </h1>
            <p className="text-[11px] text-white/60 mt-0.5 leading-none">Integraseo</p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      {/* ── Content ────────────────────────────────────── */}
      <main className="flex-1 overflow-hidden relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-3">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando datos...</p>
          </div>
        ) : (
          <div key={currentView} className="h-full animate-fade-up">
            {currentView === "contracts"       && <ContractsList />}
            {currentView === "calendar"        && <CalendarPanel />}
            {currentView === "reminders"       && <RemindersPanel />}
            {currentView === "brigadas"        && <BrigadasPanel />}
            {currentView === "supernumerarios" && <SupernumerariosPanel />}
          </div>
        )}
      </main>

      {/* ── Navbar (floating pill — untouched) ─────────── */}
      <div className="shrink-0 flex justify-center pb-4 pt-2 px-4 bg-background">
        <nav className="flex items-center gap-1 bg-card border border-border rounded-2xl px-2 py-2 shadow-lg shadow-black/10 dark:shadow-black/40">
          {NAV_ITEMS.map(({ id, label, short, Icon }) => {
            const active = currentView === id
            return (
              <button
                key={id}
                onClick={() => navigate(id)}
                title={label}
                className={[
                  "relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
                ].join(" ")}
              >
                <Icon className={`h-5 w-5 transition-transform duration-200 ${active ? "scale-110" : ""}`} />
                <span className={`text-[9px] font-semibold leading-none tracking-wide ${active ? "opacity-100" : "opacity-60"}`}>
                  {short}
                </span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
