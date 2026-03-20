"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { MapPin, Navigation, Search, X, Loader2 } from "lucide-react"

// ── Types ──────────────────────────────────────────────────────────────────────
interface GeoContract {
  id: string
  name: string
  client: string
  status: string
  location: string
  color: string
  lat: number
  lng: number
}

const STATUS_DOT: Record<string, string> = {
  active:    "bg-emerald-500",
  pending:   "bg-amber-500",
  completed: "bg-slate-400",
}

const STATUS_LABEL: Record<string, string> = {
  active: "Activo", pending: "Pendiente", completed: "Completado",
}

const FALLBACK_COLORS = ["#8b5cf6","#0ea5e9","#10b981","#f97316","#ec4899","#6366f1"]

// ── Geocode a location string → {lat,lng} via Nominatim (OSM) ─────────────────
async function geocode(location: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
    const res  = await fetch(url, { headers: { "Accept-Language": "es" } })
    const data = await res.json()
    if (data.length === 0) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

// ── LeafletMap — renders only on client ───────────────────────────────────────
function LeafletMap({ contracts, selected, onSelect }: {
  contracts: GeoContract[]
  selected: string | null
  onSelect: (id: string) => void
}) {
  const mapRef    = useRef<HTMLDivElement>(null)
  const leafletRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])

  useEffect(() => {
    if (!mapRef.current || leafletRef.current) return

    // Dynamically import Leaflet (SSR-safe)
    import("leaflet").then((L) => {
      // Fix default icon paths
      // @ts-expect-error leaflet icon fix
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
        iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
        shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
      })

      const center = contracts.length > 0
        ? [contracts[0].lat, contracts[0].lng] as [number, number]
        : [4.6097, -74.0817] as [number, number] // Bogotá default

      const map = L.map(mapRef.current!, { zoomControl: true, scrollWheelZoom: true })
      leafletRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map)

      // Add markers
      contracts.forEach((c) => {
        const colorHex = c.color.startsWith("bg-")
          ? FALLBACK_COLORS[0]
          : c.color

        const icon = L.divIcon({
          className: "",
          html: `
            <div style="
              width:36px;height:36px;border-radius:50% 50% 50% 0;
              background:${colorHex};
              transform:rotate(-45deg);
              border:3px solid white;
              box-shadow:0 2px 8px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="
                transform:rotate(45deg);
                color:white;font-size:11px;font-weight:700;
                font-family:system-ui,sans-serif;
              ">${c.name.substring(0,2).toUpperCase()}</span>
            </div>`,
          iconSize:   [36, 36],
          iconAnchor: [18, 36],
          popupAnchor:[0, -38],
        })

        const marker = L.marker([c.lat, c.lng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:system-ui,sans-serif;min-width:160px;">
              <p style="font-weight:700;font-size:13px;margin:0 0 2px">${c.name}</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 4px">${c.client}</p>
              <p style="color:#6b7280;font-size:11px;margin:0">${c.location}</p>
            </div>
          `, { maxWidth: 220 })

        marker.on("click", () => onSelect(c.id))
        markersRef.current.push({ id: c.id, marker })
      })

      // Fit bounds
      if (contracts.length > 1) {
        const bounds = L.latLngBounds(contracts.map(c => [c.lat, c.lng]))
        map.fitBounds(bounds, { padding: [40, 40] })
      } else if (contracts.length === 1) {
        map.setView([contracts[0].lat, contracts[0].lng], 14)
      } else {
        map.setView(center, 11)
      }
    })

    return () => {
      leafletRef.current?.remove()
      leafletRef.current = null
      markersRef.current = []
    }
  }, []) // only once on mount

  // Pan to selected
  useEffect(() => {
    if (!selected || !leafletRef.current) return
    const entry = markersRef.current.find(m => m.id === selected)
    if (entry) {
      leafletRef.current.panTo(entry.marker.getLatLng(), { animate: true })
      entry.marker.openPopup()
    }
  }, [selected])

  return (
    <>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
      <div ref={mapRef} className="w-full h-full" />
    </>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────────
export function MapPanel() {
  const contracts = useStore((s) => s.contracts)
  const [geoContracts, setGeoContracts] = useState<GeoContract[]>([])
  const [loading, setLoading]           = useState(true)
  const [failed, setFailed]             = useState<string[]>([])
  const [search, setSearch]             = useState("")
  const [selected, setSelected]         = useState<string | null>(null)

  const withLocation = useMemo(() =>
    contracts.filter(c => c.location?.trim()),
    [contracts]
  )

  // Geocode all contracts with location
  useEffect(() => {
    if (withLocation.length === 0) { setLoading(false); return }

    const COLORS_HEX: Record<string,string> = {
      "bg-violet-500":"#8b5cf6","bg-sky-500":"#0ea5e9","bg-emerald-500":"#10b981",
      "bg-orange-500":"#f97316","bg-pink-500":"#ec4899","bg-indigo-500":"#6366f1",
      "bg-red-500":"#ef4444","bg-amber-500":"#f59e0b","bg-teal-500":"#14b8a6","bg-lime-500":"#84cc16",
    }

    let cancelled = false
    const run = async () => {
      setLoading(true)
      const results: GeoContract[] = []
      const failedList: string[]   = []

      for (let i = 0; i < withLocation.length; i++) {
        if (cancelled) return
        const c    = withLocation[i]
        const geo  = await geocode(c.location!)
        const hex  = COLORS_HEX[c.color || ""] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]
        if (geo) {
          results.push({ id: c.id, name: c.name, client: c.client, status: c.status, location: c.location!, color: hex, ...geo })
        } else {
          failedList.push(c.name)
        }
        if (!cancelled) setGeoContracts([...results])
      }
      if (!cancelled) { setFailed(failedList); setLoading(false) }
    }
    run()
    return () => { cancelled = true }
  }, [withLocation.length])

  const filteredList = useMemo(() => {
    const q = search.toLowerCase()
    return geoContracts.filter(c =>
      !q || c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q) || c.client.toLowerCase().includes(q)
    )
  }, [geoContracts, search])

  // ── Empty: no contracts with location
  if (!loading && withLocation.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-16 text-center px-6">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <MapPin className="h-7 w-7 text-muted-foreground/40" />
        </div>
        <p className="font-semibold">Sin ubicaciones</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
          Añade una dirección en el campo "Ubicación" de tus contratos para verlos en el mapa
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">

      {/* MAP — takes most of the space */}
      <div className="relative" style={{ height: "55%" }}>
        {loading && geoContracts.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/30 gap-3 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Localizando contratos...</p>
          </div>
        ) : (
          <LeafletMap
            contracts={filteredList.length > 0 ? filteredList : geoContracts}
            selected={selected}
            onSelect={setSelected}
          />
        )}

        {/* Loading overlay while geocoding more */}
        {loading && geoContracts.length > 0 && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000]
            bg-white dark:bg-zinc-900 rounded-full px-3 py-1.5 shadow-md
            flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" />
            Localizando {geoContracts.length}/{withLocation.length}...
          </div>
        )}
      </div>

      {/* CONTRACT LIST below the map */}
      <div className="flex-1 overflow-hidden flex flex-col border-t border-border">

        {/* Search */}
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filtrar contratos..."
              className="w-full h-8 pl-8 pr-7 text-[12px] rounded-xl bg-muted/50 border border-border/60
                focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all
                placeholder:text-muted-foreground/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/40">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable list */}
        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {failed.length > 0 && (
            <p className="text-[10px] text-muted-foreground/50 px-1 pb-1">
              No se pudo localizar: {failed.join(", ")}
            </p>
          )}
          {(filteredList.length > 0 ? filteredList : geoContracts).map((c) => (
            <button
              key={c.id}
              onClick={() => setSelected(s => s === c.id ? null : c.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all
                ${selected === c.id
                  ? "bg-primary/8 border border-primary/20"
                  : "bg-card border border-border/60 hover:border-border hover:shadow-sm"
                }`}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ backgroundColor: c.color }}>
                <span className="text-[10px] font-bold text-white">{c.name.substring(0,2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-foreground truncate">{c.name}</p>
                <p className="text-[10px] text-muted-foreground truncate">{c.location}</p>
              </div>
              <span className={`w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[c.status] ?? "bg-slate-400"}`} />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
