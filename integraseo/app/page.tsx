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
      <header className="shrink-0 flex items-center justify-between px-5 pt-5 pb-4 bg-background border-b border-border">
        <div className="flex flex-col">
          <p className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-1.5">
            Integraseo
          </p>
          <h1 className="text-[28px] font-extrabold text-foreground leading-none tracking-tight">
            {currentItem.label}
          </h1>
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
