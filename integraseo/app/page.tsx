"use client"

import { useEffect, useState } from "react"
import { FileText, Calendar, Bell, Users, UserPlus } from "lucide-react"
import { ContractsList } from "@/components/contracts-list"
import { CalendarPanel } from "@/components/calendar-panel"
import { RemindersPanel } from "@/components/reminders-panel"
import { BrigadasPanel } from "@/components/brigadas-panel"
import { SupernumerariosPanel } from "@/components/supernumerarios-panel"
import { useStore } from "@/lib/store"

type View = "contracts" | "calendar" | "reminders" | "brigadas" | "supernumerarios"

const NAV_ITEMS: { id: View; label: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "contracts", label: "Contratos", Icon: FileText },
  { id: "calendar", label: "Calendario", Icon: Calendar },
  { id: "reminders", label: "Recordatorios", Icon: Bell },
  { id: "brigadas", label: "Brigadas", Icon: Users },
  { id: "supernumerarios", label: "Supernumerarios", Icon: UserPlus },
]

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("contracts")
  const loadAll = useStore((state) => state.loadAll)
  const loading = useStore((state) => state.loading)

  useEffect(() => {
    loadAll()
  }, [loadAll])

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 shrink-0">
        <h1 className="text-xl font-semibold text-foreground">
          {NAV_ITEMS.find((n) => n.id === currentView)?.label ?? "Integraseo"}
        </h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p>Cargando datos...</p>
          </div>
        ) : (
          <>
            {currentView === "contracts" && <ContractsList />}
            {currentView === "calendar" && <CalendarPanel />}
            {currentView === "reminders" && <RemindersPanel />}
            {currentView === "brigadas" && <BrigadasPanel />}
            {currentView === "supernumerarios" && <SupernumerariosPanel />}
          </>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around border-t border-border bg-card px-1 py-1 shrink-0">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setCurrentView(id)}
            className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-lg transition-colors flex-1 ${
              currentView === id
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            }`}
          >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium leading-none">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
