"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useStore } from "@/lib/store"
import { MapPin, Search, X, Loader2 } from "lucide-react"

/* ─── Colores ────────────────────────────────────────── */
const STATUS_DOT: Record<string, string> = {
  active:    "#10b981",
  pending:   "#f59e0b",
  completed: "#94a3b8",
}
const COLORS_HEX: Record<string, string> = {
  "bg-violet-500":"#8b5cf6","bg-sky-500":"#0ea5e9","bg-emerald-500":"#10b981",
  "bg-orange-500":"#f97316","bg-pink-500":"#ec4899","bg-indigo-500":"#6366f1",
  "bg-red-500":"#ef4444","bg-amber-500":"#f59e0b","bg-teal-500":"#14b8a6","bg-lime-500":"#84cc16",
}
const FALLBACK_COLORS = ["#8b5cf6","#0ea5e9","#10b981","#f97316","#ec4899","#6366f1"]

interface GeoContract {
  id: string; name: string; client: string; status: string
  location: string; color: string; lat: number; lng: number
}

/* ─── Geocodificación con Nominatim (OpenStreetMap) ─── */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = encodeURIComponent(`${address}, Colombia`)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=co`,
      { headers: { "Accept-Language": "es", "User-Agent": "Integraseo/1.0" } }
    )
    const data = await res.json()
    if (data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    }
    return null
  } catch {
    return null
  }
}

/* ─── SVG del pin personalizado ─────────────────────── */
function pinSvg(hex: string, initials: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
      <defs>
        <filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/></filter>
      </defs>
      <path d="M22 2C13.16 2 6 9.16 6 18c0 12 16 32 16 32s16-20 16-32C38 9.16 30.84 2 22 2z"
        fill="${hex}" filter="url(#s)"/>
      <circle cx="22" cy="18" r="11" fill="white" opacity="0.25"/>
      <text x="22" y="23" text-anchor="middle" font-family="system-ui,sans-serif"
        font-size="11" font-weight="700" fill="white">${initials}</text>
    </svg>
  `)}`
}

export function MapPanel() {
  const contracts = useStore((s) => s.contracts)
  const [geoContracts, setGeoContracts] = useState<GeoContract[]>([])
  const [loading, setLoading]           = useState(true)
  const [geocodingCount, setGeocodingCount] = useState(0)
  const [failed, setFailed]             = useState<string[]>([])
  const [search, setSearch]             = useState("")
  const [selected, setSelected]         = useState<string | null>(null)

  const mapRef     = useRef<HTMLDivElement>(null)
  const leafletMap = useRef<any>(null)
  const markers    = useRef<Record<string, any>>({})

  const withLocation = useMemo(() =>
    contracts.filter(c => c.location?.trim()),
    [contracts]
  )

  /* ── Inicializar mapa + geocodificar ─────────────────── */
  useEffect(() => {
    if (withLocation.length === 0) { setLoading(false); return }
    let cancelled = false

    const run = async () => {
      // Importar Leaflet dinámicamente (solo cliente)
      const L = (await import("leaflet")).default


      if (cancelled || !mapRef.current) return

      // Evitar doble inicialización
      if (leafletMap.current) {
        leafletMap.current.remove()
        leafletMap.current = null
      }

      const map = L.map(mapRef.current, {
        center: [4.6097, -74.0817],
        zoom: 6,
        zoomControl: true,
        attributionControl: false,
      })

      // Tile layer OpenStreetMap — gratuito, sin API key
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map)

      leafletMap.current = map

      const results: GeoContract[] = []
      const failedList: string[]   = []
      const points: [number, number][] = []

      for (let i = 0; i < withLocation.length; i++) {
        if (cancelled) return
        const c   = withLocation[i]
        const hex = COLORS_HEX[c.color ?? ""] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
        const geo = await geocodeAddress(c.location!)
        setGeocodingCount(i + 1)

        if (geo) {
          const gc: GeoContract = {
            id: c.id, name: c.name, client: c.client,
            status: c.status, location: c.location!, color: hex,
            lat: geo.lat, lng: geo.lng,
          }
          results.push(gc)
          points.push([geo.lat, geo.lng])

          const initials = c.name.substring(0, 2).toUpperCase()
          const icon = L.icon({
            iconUrl: pinSvg(hex, initials),
            iconSize: [44, 52],
            iconAnchor: [22, 52],
            popupAnchor: [0, -52],
          })

          const marker = L.marker([geo.lat, geo.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family:system-ui,sans-serif;padding:2px;min-width:160px;">
                <p style="font-weight:700;font-size:13px;margin:0 0 3px;color:#111">${c.name}</p>
                <p style="color:#6b7280;font-size:11px;margin:0 0 2px">${c.client}</p>
                <p style="color:#9ca3af;font-size:11px;margin:0">${c.location}</p>
              </div>`)

          marker.on("click", () => setSelected(gc.id))
          markers.current[c.id] = marker

          if (!cancelled) setGeoContracts([...results])
        } else {
          failedList.push(c.name)
        }
      }

      if (!cancelled) {
        setFailed(failedList)
        setLoading(false)
        if (points.length > 1) map.fitBounds(points as any, { padding: [40, 40] })
        else if (points.length === 1) map.setView(points[0], 14)
      }
    }

    run()
    return () => {
      cancelled = true
      if (leafletMap.current) { leafletMap.current.remove(); leafletMap.current = null }
      markers.current = {}
    }
  }, [withLocation.length])

  /* ── Pan al seleccionado ─────────────────────────────── */
  useEffect(() => {
    if (!selected || !leafletMap.current) return
    const marker = markers.current[selected]
    if (marker) {
      leafletMap.current.panTo(marker.getLatLng(), { animate: true })
      leafletMap.current.setZoom(15)
      marker.openPopup()
    }
  }, [selected])

  const filteredList = useMemo(() => {
    const q = search.toLowerCase()
    return geoContracts.filter(c =>
      !q || c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.client.toLowerCase().includes(q)
    )
  }, [geoContracts, search])

  /* ── Sin ubicaciones ─────────────────────────────────── */
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
      {/* MAPA */}
      <div className="relative shrink-0" style={{ height: "52%" }}>
        <div ref={mapRef} className="w-full h-full" />

        {loading && geoContracts.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/60 backdrop-blur-sm gap-3 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">Localizando contratos...</p>
          </div>
        )}

        {loading && geoContracts.length > 0 && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10
            bg-white dark:bg-zinc-900 rounded-full px-3 py-1.5 shadow-lg
            flex items-center gap-2 text-xs font-medium text-muted-foreground border border-border">
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            {geocodingCount} / {withLocation.length} ubicaciones
          </div>
        )}
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-hidden flex flex-col border-t border-border">
        <div className="shrink-0 px-4 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Filtrar por contrato o dirección..."
              className="w-full h-8 pl-8 pr-7 text-[12px] rounded-xl bg-muted/50 border border-border/60
                focus:outline-none focus:ring-1 focus:ring-primary/30 transition-all
                placeholder:text-muted-foreground/40"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                <X className="h-3 w-3 text-muted-foreground/40" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-1.5">
          {failed.length > 0 && (
            <p className="text-[10px] text-muted-foreground/50 px-1 pb-1">
              No localizado: {failed.join(", ")}
            </p>
          )}
          {filteredList.map((c) => (
            <button key={c.id}
              onClick={() => setSelected(s => s === c.id ? null : c.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all
                ${selected === c.id
                  ? "bg-primary/8 border border-primary/25 shadow-sm"
                  : "bg-card border border-border/70 hover:border-border hover:shadow-sm"
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
              <div className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_DOT[c.status] ?? "#94a3b8" }} />
            </button>
          ))}
          {filteredList.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground py-4">Sin resultados</p>
          )}
        </div>
      </div>
    </div>
  )
}
