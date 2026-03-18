"use client"

import { useEffect, useState } from "react"
import { FileText, Calendar, Bell, Users, UserPlus, Search } from "lucide-react"
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
  const [headerSearch, setHeaderSearch] = useState("")
  const showSearch = ["contracts","brigadas","supernumerarios","reminders"].includes(currentView)
  const loadAll = useStore((s) => s.loadAll)
  const loading = useStore((s) => s.loading)

  useEffect(() => { loadAll() }, [loadAll])

  const navigate = (id: View) => {
    setPrevView(currentView)
    setCurrentView(id)
    setHeaderSearch("")
  }

  const currentItem = NAV_ITEMS.find((n) => n.id === currentView)!

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">

      {/* ── Header ─────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3.5
        bg-[#07105e] dark:bg-[#070d3a]">
        <h1 className="text-[22px] font-bold text-white leading-none tracking-tight shrink-0">
          {currentItem.label}
        </h1>
        <div className="flex items-center gap-2 flex-1 justify-end max-w-[220px]">
          {showSearch && (
            <div className="relative flex-1">
              <input
                type="search"
                placeholder={`Buscar ${currentItem.label.toLowerCase()}`}
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                className="w-full h-9 pl-3 pr-9 text-sm rounded-lg
                  bg-white/10 border border-white/20 text-white placeholder:text-white/50
                  focus:outline-none focus:bg-white/15 focus:border-white/40 transition-colors"
              />
              <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
            </div>
          )}
          <ThemeToggle />
        </div>
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
            {currentView === "contracts"       && <ContractsList search={headerSearch} />}
            {currentView === "calendar"        && <CalendarPanel />}
            {currentView === "reminders"       && <RemindersPanel search={headerSearch} />}
            {currentView === "brigadas"        && <BrigadasPanel search={headerSearch} />}
            {currentView === "supernumerarios" && <SupernumerariosPanel search={headerSearch} />}
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
