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
  { id: "contracts",       label: "Contratos",      short: "Contratos",  Icon: FileText  },
  { id: "calendar",        label: "Calendario",     short: "Calendario", Icon: Calendar  },
  { id: "reminders",       label: "Recordatorios",  short: "Recordat.",  Icon: Bell      },
  { id: "brigadas",        label: "Brigadas",       short: "Brigadas",   Icon: Users     },
  { id: "supernumerarios", label: "Supernumerarios",short: "Supern.",    Icon: UserPlus  },
]

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("contracts")
  const loadAll = useStore((state) => state.loadAll)
  const loading = useStore((state) => state.loading)

  useEffect(() => { loadAll() }, [loadAll])

  return (
    <div className="flex h-screen flex-col bg-background">

      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
        <h1 className="text-xl font-semibold text-foreground">
          {NAV_ITEMS.find((n) => n.id === currentView)?.label ?? "Integraseo"}
        </h1>
        <ThemeToggle />
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            {currentView === "contracts"       && <ContractsList />}
            {currentView === "calendar"        && <CalendarPanel />}
            {currentView === "reminders"       && <RemindersPanel />}
            {currentView === "brigadas"        && <BrigadasPanel />}
            {currentView === "supernumerarios" && <SupernumerariosPanel />}
          </>
        )}
      </main>

      {/* Bottom Navigation — floating pill */}
      <div className="shrink-0 flex justify-center pb-4 pt-2 px-4 bg-background">
        <nav className="flex items-center gap-1 bg-card border border-border rounded-2xl px-2 py-2 shadow-lg shadow-black/10 dark:shadow-black/40">
          {NAV_ITEMS.map(({ id, label, short, Icon }) => {
            const active = currentView === id
            return (
              <button
                key={id}
                onClick={() => setCurrentView(id)}
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
