"use client"

import { useMemo, useState } from "react"
import { useStore } from "@/lib/store"
import { MapPin, ExternalLink, Navigation, Search, X } from "lucide-react"

const STATUS_COLOR: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: "bg-emerald-50 dark:bg-emerald-950/30", text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500", label: "Activo" },
  pending:   { bg: "bg-amber-50 dark:bg-amber-950/30",     text: "text-amber-700 dark:text-amber-400",     dot: "bg-amber-500",   label: "Pendiente" },
  completed: { bg: "bg-slate-100 dark:bg-slate-800/40",    text: "text-slate-600 dark:text-slate-400",     dot: "bg-slate-400",   label: "Completado" },
}

export function MapPanel() {
  const contracts = useStore((s) => s.contracts)
  const [search, setSearch] = useState("")

  const withLocation = useMemo(() =>
    contracts.filter(c => c.location && c.location.trim().length > 0),
    [contracts]
  )

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return withLocation.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.location!.toLowerCase().includes(q) || c.client.toLowerCase().includes(q)
    )
  }, [withLocation, search])

  const openInMaps = (location: string) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
    window.open(url, "_blank")
  }

  const openRoute = (location: string) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(location)}`
    window.open(url, "_blank")
  }

  const openAllMaps = () => {
    // Open all locations in Google Maps My Maps format
    if (filtered.length === 1) {
      openInMaps(filtered[0].location!)
      return
    }
    const first = filtered[0]
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(first.location!)}`
    window.open(url, "_blank")
  }

  return (
    <div className="flex flex-col h-full">

      {/* Search bar */}
      <div className="shrink-0 px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por contrato o ubicación..."
            className="w-full h-9 pl-9 pr-8 text-sm rounded-xl bg-muted/50 border border-border/60
              focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40
              placeholder:text-muted-foreground/50 transition-all"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/50 hover:text-muted-foreground">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="shrink-0 px-4 pb-2 flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground/60 font-medium">
          {filtered.length} ubicación{filtered.length !== 1 ? "es" : ""}
          {contracts.length - withLocation.length > 0 && (
            <span className="ml-1">· {contracts.length - withLocation.length} sin ubicación</span>
          )}
        </p>
        {filtered.length > 0 && (
          <button
            onClick={openAllMaps}
            className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
          >
            <ExternalLink className="h-3 w-3" />
            Ver en Maps
          </button>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {withLocation.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <MapPin className="h-7 w-7 text-muted-foreground/40" />
            </div>
            <p className="font-semibold text-foreground">Sin ubicaciones</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
              Añade una ubicación a tus contratos para verlos aquí
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm font-medium text-muted-foreground">Sin coincidencias</p>
          </div>
        ) : (
          filtered.map((contract, i) => {
            const s = STATUS_COLOR[contract.status] ?? STATUS_COLOR.completed
            const COLORS = ["bg-violet-500","bg-sky-500","bg-emerald-500","bg-orange-500","bg-pink-500","bg-indigo-500"]
            const color  = contract.color || COLORS[i % COLORS.length]
            const initials = contract.name.substring(0, 2).toUpperCase()

            return (
              <div key={contract.id}
                className="bg-card border border-border/70 rounded-2xl overflow-hidden
                  hover:shadow-[0_2px_12px_rgba(0,0,0,0.06)] transition-all duration-150"
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 pt-3.5 pb-3">
                  <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                    <span className="text-[11px] font-semibold text-white">{initials}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-foreground truncate leading-tight">{contract.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{contract.client}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-1 rounded-lg ${s.bg} ${s.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                    {s.label}
                  </span>
                </div>

                {/* Location row */}
                <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-t border-border/50">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                  <p className="text-[12px] text-muted-foreground flex-1 truncate">{contract.location}</p>
                </div>

                {/* Actions */}
                <div className="flex border-t border-border/50">
                  <button
                    onClick={() => openInMaps(contract.location!)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium
                      text-primary hover:bg-primary/5 transition-colors border-r border-border/50"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Ver en mapa
                  </button>
                  <button
                    onClick={() => openRoute(contract.location!)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[12px] font-medium
                      text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <Navigation className="h-3.5 w-3.5" />
                    Cómo llegar
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
