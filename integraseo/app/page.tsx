"use client"

import { useEffect, useState, useRef } from "react"
import { FileText, Calendar, Bell, Users, UserPlus, Search, BarChart2, Menu, X } from "lucide-react"
import { ContractsList } from "@/components/contracts-list"
import { CalendarPanel } from "@/components/calendar-panel"
import { RemindersPanel } from "@/components/reminders-panel"
import { BrigadasPanel } from "@/components/brigadas-panel"
import { SupernumerariosPanel } from "@/components/supernumerarios-panel"
import { ThemeToggle } from "@/components/theme-toggle"
import { StatsPanel } from "@/components/stats-panel"
import { useStore } from "@/lib/store"
import { ContractListSkeleton, StatsSkeleton } from "@/components/skeleton"
import { AnimatePresence, motion } from "framer-motion"

type View = "contracts" | "calendar" | "reminders" | "brigadas" | "supernumerarios" | "stats"

// Items shown directly in the navbar pill
const MAIN_NAV: { id: View; label: string; short: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "contracts",       label: "Contratos",       short: "Contratos",  Icon: FileText  },
  { id: "calendar",        label: "Calendario",      short: "Calendario", Icon: Calendar  },
  { id: "brigadas",        label: "Brigadas",         short: "Brigadas",   Icon: Users     },
  { id: "supernumerarios", label: "Supernumerarios",  short: "Supern.",    Icon: UserPlus  },
]

// Items hidden in the hamburger menu
const MENU_NAV: { id: View; label: string; description: string; Icon: React.FC<{ className?: string }> }[] = [
  { id: "stats",     label: "Estadísticas",   description: "Dashboard y métricas", Icon: BarChart2 },
  { id: "reminders", label: "Recordatorios",  description: "Tareas y alertas",     Icon: Bell      },
]

const ALL_NAV = [...MAIN_NAV, ...MENU_NAV]

export default function Home() {
  const [currentView, setCurrentView]     = useState<View>("contracts")
  const [menuOpen, setMenuOpen]           = useState(false)
  const [headerSearch, setHeaderSearch]   = useState("")
  const showSearch = ["contracts","brigadas","supernumerarios","reminders"].includes(currentView)
  const menuRef = useRef<HTMLDivElement>(null)

  const reminders = useStore((s) => s.reminders)
  const loadAll = useStore((s) => s.loadAll)
  const loading = useStore((s) => s.loading)
  const pendingCount = reminders.filter(r => !r.completed).length
  useEffect(() => { loadAll() }, [loadAll])

  const navigate = (id: View) => {
    setCurrentView(id)
    setHeaderSearch("")
    setMenuOpen(false)
  }

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [menuOpen])

  const currentItem = ALL_NAV.find((n) => n.id === currentView)!
  const isMenuView  = MENU_NAV.some((n) => n.id === currentView)

  return (
    <div className="flex flex-col bg-background overflow-hidden" style={{ height: "100dvh" }}>

      {/* ── Header ─────────────────────────────────────── */}
      <header className="shrink-0 flex items-center justify-between gap-3 px-4 py-3.5 bg-[#07105e] dark:bg-[#070d3a]">
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
          <div className="h-full overflow-hidden">
            {(currentView === "contracts" || currentView === "brigadas" || currentView === "supernumerarios" || currentView === "reminders") && <ContractListSkeleton />}
            {currentView === "stats" && <StatsSkeleton />}
            {(currentView === "calendar") && <ContractListSkeleton />}
          </div>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentView}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{    opacity: 0, x: -24 }}
              transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="h-full overflow-hidden"
            >
              {currentView === "stats"           && <StatsPanel />}
              {currentView === "contracts"       && <ContractsList search={headerSearch} />}
              {currentView === "calendar"        && <CalendarPanel />}
              {currentView === "reminders"       && <RemindersPanel search={headerSearch} />}
              {currentView === "brigadas"        && <BrigadasPanel search={headerSearch} />}
              {currentView === "supernumerarios" && <SupernumerariosPanel search={headerSearch} />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* ── Navbar ─────────────────────────────────────── */}
      <div className="shrink-0 flex justify-center pb-4 pt-2 px-4 bg-background">
        <div ref={menuRef} className="relative w-full max-w-sm">

          {/* ── Hamburger menu panel ── */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0,  scale: 1    }}
                exit={{   opacity: 0, y: 8,   scale: 0.96 }}
                transition={{ type: "spring", stiffness: 320, damping: 26 }}
                className="absolute bottom-[calc(100%+10px)] right-0
                  w-56 bg-card border border-border rounded-2xl
                  shadow-xl shadow-black/15 dark:shadow-black/40
                  overflow-hidden z-50"
              >
                {/* Header del menú */}
                <div className="px-4 pt-3 pb-2 border-b border-border">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Más secciones
                  </p>
                </div>

                {/* Items */}
                <div className="p-1.5 space-y-0.5">
                  {MENU_NAV.map(({ id, label, description, Icon }) => {
                    const active = currentView === id
                    return (
                      <button
                        key={id}
                        onClick={() => navigate(id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                          active
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted text-foreground"
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          active ? "bg-white/20" : "bg-muted"
                        }`}>
                          <Icon className={`h-4 w-4 ${active ? "text-primary-foreground" : "text-muted-foreground"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-semibold leading-none ${active ? "text-primary-foreground" : ""}`}>
                            {label}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${active ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                            {description}
                          </p>
                        </div>
                        {active && (
                          <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground/80 shrink-0" />
                        )}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Pill navbar ── */}
          <nav className="flex items-center gap-1 bg-card border border-border rounded-2xl px-2 py-2 shadow-lg shadow-black/10 dark:shadow-black/40">

            {/* Main nav items */}
            {MAIN_NAV.map(({ id, label, short, Icon }) => {
              const active = currentView === id
              return (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  title={label}
                  className={[
                    "flex-1 flex flex-col items-center justify-center gap-1 rounded-xl py-2 transition-all duration-200",
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

            {/* Separator */}
            <div className="w-px h-8 bg-border mx-0.5 shrink-0" />

            {/* Hamburger button */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              title="Más"
              className={[
                "flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-all duration-200 relative shrink-0",
                menuOpen || isMenuView
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/30 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
              ].join(" ")}
            >
              {/* Badge: pending reminders */}
              {pendingCount > 0 && !menuOpen && !isMenuView && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full
                  bg-red-500 text-white text-[9px] font-bold flex items-center justify-center
                  shadow-sm z-10">
                  {pendingCount > 9 ? "9+" : pendingCount}
                </span>
              )}
              {/* Active dot indicator when a menu section is selected */}
              {isMenuView && !menuOpen && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-primary-foreground" />
              )}
              {menuOpen
                ? <X className="h-5 w-5" />
                : <Menu className="h-5 w-5" />
              }
              <span className={`text-[9px] font-semibold leading-none tracking-wide ${menuOpen || isMenuView ? "opacity-100" : "opacity-60"}`}>
                Más
              </span>
            </button>

          </nav>
        </div>
      </div>
    </div>
  )
}
