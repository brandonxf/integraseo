"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import { useStore } from "@/lib/store"
import { MapPin, Search, X, Loader2, RefreshCw, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import mapboxgl from "mapbox-gl"
import "mapbox-gl/dist/mapbox-gl.css"

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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ""

interface GeoContract {
  id: string; name: string; client: string; status: string
  location: string; color: string; lat: number; lng: number
}

/* ─── Geocodificación con Mapbox ─── */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address?.trim()) return null
  if (!MAPBOX_TOKEN) {
    console.warn("[MapPanel] Mapbox token no configurado")
    return null
  }
  try {
    const query = encodeURIComponent(`${address}, Colombia`)
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=co&limit=1&types=address,place,locality`
    )
    const data = await res.json()
    if (data.features && data.features.length > 0) {
      const [lng, lat] = data.features[0].center
      return { lat, lng }
    }
    return null
  } catch (e) {
    console.error("[MapPanel] Geocode error:", e)
    return null
  }
}

/* ─── API de mapa con Mapbox ─── */

export function MapPanel() {
  const contracts = useStore((s) => s.contracts)
  const [geoContracts, setGeoContracts] = useState<GeoContract[]>([])
  const [loading, setLoading] = useState(true)
  const [mapReady, setMapReady] = useState(false)
  const [search, setSearch] = useState("")
  const [selected, setSelected] = useState<string | null>(null)
  const [failedGeocoding, setFailedGeocoding] = useState<{id: string, name: string, location: string, reason: string}[]>([])
  const [showHiddenList, setShowHiddenList] = useState(false)

  const mapRef = useRef<HTMLDivElement>(null)
  const mapboxMap = useRef<mapboxgl.Map | null>(null)
  const markers = useRef<Record<string, mapboxgl.Marker>>({})
  const geocodeCache = useRef<Record<string, { lat: number; lng: number } | null>>({})
  const processedIds = useRef<Set<string>>(new Set())
  const processedLocations = useRef<Record<string, string>>({})

  // Contratos con ubicación
  const withLocation = useMemo(() => {
    return contracts.filter(c => c.location?.trim())
  }, [contracts])

  const contractsWithoutLocation = useMemo(() => {
    return contracts.filter(c => !c.location?.trim())
  }, [contracts])

  // Inicializar mapa
  useEffect(() => {
    let mounted = true

    const initMap = async () => {
      if (!mapRef.current || !MAPBOX_TOKEN) return

      mapboxgl.accessToken = MAPBOX_TOKEN

      const map = new mapboxgl.Map({
        container: mapRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [-74.7813, 10.9685],
        zoom: 12,
      })

      map.addControl(new mapboxgl.NavigationControl(), "top-right")

      map.on("load", () => {
        if (!mounted) return
        mapboxMap.current = map
        setLoading(false)
        setMapReady(true)
      })
    }

    initMap()

    return () => {
      mounted = false
      if (mapboxMap.current) {
        mapboxMap.current.remove()
        mapboxMap.current = null
      }
    }
  }, [])

  // Procesar contratos cuando cambian
  useEffect(() => {
    if (!mapReady) return

    const processContracts = async () => {
      const failed: {id: string, name: string, location: string, reason: string}[] = []
      const map = mapboxMap.current
      if (!map) return

      const currentIdSet = new Set(withLocation.map(c => c.id))

      // Eliminar markers de contratos que ya no existen
      for (const id of Object.keys(markers.current)) {
        if (!currentIdSet.has(id)) {
          markers.current[id].remove()
          delete markers.current[id]
          processedIds.current.delete(id)
          delete processedLocations.current[id]
        }
      }

      // Limpiar geoContracts de contratos eliminados
      setGeoContracts(prev => prev.filter(c => currentIdSet.has(c.id)))

      // Procesar contratos
      for (let i = 0; i < withLocation.length; i++) {
        const contract = withLocation[i]
        const currentLocation = contract.location!.trim().toLowerCase()
        const previousLocation = processedLocations.current[contract.id]
        
        // Verificar si es un contrato nuevo o si la ubicación cambió
        const isNew = !processedIds.current.has(contract.id)
        const locationChanged = previousLocation && previousLocation !== currentLocation
        
        if (!isNew && !locationChanged) continue
        
        // Si la ubicación cambió, eliminar el marker anterior
        if (locationChanged && markers.current[contract.id]) {
          markers.current[contract.id].remove()
          delete markers.current[contract.id]
          // Limpiar el cache para esta ubicación anterior
          delete geocodeCache.current[previousLocation]
        }
        
        processedIds.current.add(contract.id)
        processedLocations.current[contract.id] = currentLocation

        let geo = geocodeCache.current[currentLocation]

        // Si el contrato tiene coordenadas exactas del mini mapa Y la ubicación no cambió (o es nuevo), usarlas
        // Solo usamos coordenadas guardadas si no hubo cambio de ubicación, para evitar usar coordenadas antiguas
        if (contract.coordinates && !locationChanged) {
          geo = contract.coordinates
          geocodeCache.current[currentLocation] = geo
        } else if (geo === undefined) {
          geo = await geocodeAddress(contract.location!)
          geocodeCache.current[currentLocation] = geo
        }

        if (geo) {
          const hex = COLORS_HEX[contract.color ?? ""] ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length]
          const initials = contract.name.substring(0, 2).toUpperCase()

          const el = document.createElement("div")
          el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="52" viewBox="0 0 44 52">
            <defs><filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.3"/></filter></defs>
            <path d="M22 2C13.16 2 6 9.16 6 18c0 12 16 32 16 32s16-20 16-32C38 9.16 30.84 2 22 2z" fill="${hex}" filter="url(#s)"/>
            <circle cx="22" cy="18" r="11" fill="white" opacity="0.25"/>
            <text x="22" y="23" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" font-weight="700" fill="white">${initials}</text>
          </svg>`
          el.style.cursor = "pointer"

          const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
            .setHTML(`<div style="font-family:system-ui,sans-serif;padding:2px;min-width:160px;">
              <p style="font-weight:700;font-size:13px;margin:0 0 3px;color:#111">${contract.name}</p>
              <p style="color:#6b7280;font-size:11px;margin:0 0 2px">${contract.client}</p>
              <p style="color:#9ca3af;font-size:11px;margin:0">${contract.location}</p>
            </div>`)

          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([geo.lng, geo.lat])
            .setPopup(popup)
            .addTo(map)

          el.addEventListener("click", () => setSelected(contract.id))
          markers.current[contract.id] = marker

          setGeoContracts(prev => {
            const existingIndex = prev.findIndex(c => c.id === contract.id)
            const newContract = {
              id: contract.id,
              name: contract.name,
              client: contract.client,
              status: contract.status,
              location: contract.location!,
              color: hex,
              lat: geo.lat,
              lng: geo.lng,
            }
            if (existingIndex >= 0) {
              // Actualizar existente
              const updated = [...prev]
              updated[existingIndex] = newContract
              return updated
            }
            return [...prev, newContract]
          })
        } else {
          // Geocodificación falló
          failed.push({
            id: contract.id,
            name: contract.name,
            location: contract.location!,
            reason: "No se encontró la dirección en el mapa"
          })
        }
      }

      setFailedGeocoding(failed)
    }

    processContracts()
  }, [mapReady, withLocation.length])

  // Pan al seleccionado
  useEffect(() => {
    if (!selected || !mapboxMap.current) return
    const marker = markers.current[selected]
    if (marker) {
      mapboxMap.current.flyTo({ center: marker.getLngLat(), zoom: 15, animate: true })
      marker.togglePopup()
    }
  }, [selected])

  // Refrescar
  const handleRefresh = useCallback(() => {
    geocodeCache.current = {}
    processedIds.current.clear()
    processedLocations.current = {}
    Object.values(markers.current).forEach(m => m.remove())
    markers.current = {}
    setGeoContracts([])
    setFailedGeocoding([])
    window.location.reload()
  }, [])

  const filteredList = useMemo(() => {
    const q = search.toLowerCase()
    return geoContracts.filter(c =>
      !q || c.name.toLowerCase().includes(q) ||
      c.location.toLowerCase().includes(q) ||
      c.client.toLowerCase().includes(q)
    )
  }, [geoContracts, search])

  const hasContractsWithLocation = withLocation.length > 0
  const isEmptyState = !loading && !hasContractsWithLocation

  return (
    <div className="flex flex-col h-full">
      {/* MAPA */}
      <div className="relative shrink-0" style={{ height: hasContractsWithLocation || loading ? "52%" : "0%" }}>
        {hasContractsWithLocation || loading ? (
          <>
            <div ref={mapRef} className="w-full h-full" />

            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/60 backdrop-blur-sm gap-3 z-10">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground">Inicializando mapa...</p>
              </div>
            )}

            {hasContractsWithLocation && (
              <button
                onClick={handleRefresh}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full
                  bg-white dark:bg-zinc-900 shadow-lg border border-border
                  flex items-center justify-center text-muted-foreground
                  hover:text-foreground hover:bg-muted transition-all"
                title="Actualizar ubicaciones"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </>
        ) : null}
      </div>

      {/* Estado vacío */}
      {isEmptyState && (
        <div className="flex-1 flex flex-col items-center justify-center py-16 text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <MapPin className="h-7 w-7 text-muted-foreground/40" />
          </div>
          <p className="font-semibold">Sin ubicaciones</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-[220px] leading-relaxed">
            Añade una dirección en el campo "Ubicación" de tus contratos para verlos en el mapa
          </p>
        </div>
      )}

      {/* LISTA */}
      {hasContractsWithLocation && (
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
            {filteredList.length === 0 && (
              <p className="text-center text-sm text-muted-foreground py-4">
                {geoContracts.length === 0 ? "Procesando ubicaciones..." : "Sin resultados"}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Contratos no visibles en el mapa */}
      {(failedGeocoding.length > 0 || contractsWithoutLocation.length > 0) && (
        <div className="shrink-0 border-t border-border">
          <button
            onClick={() => setShowHiddenList(!showHiddenList)}
            className="w-full px-4 py-2 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              No visibles en el mapa ({failedGeocoding.length + contractsWithoutLocation.length})
            </p>
            {showHiddenList ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showHiddenList && (
            <div className="max-h-32 overflow-y-auto px-4 py-2 space-y-2 bg-muted/20">
              {/* Sin ubicación */}
              {contractsWithoutLocation.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-[11px]">
                  <div className="w-4 h-4 rounded-full bg-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-white">{c.name.substring(0,1).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-muted-foreground">Sin dirección configurada</p>
                  </div>
                </div>
              ))}
              {/* Falló geocodificación */}
              {failedGeocoding.map((c) => (
                <div key={c.id} className="flex items-start gap-2 text-[11px]">
                  <div className="w-4 h-4 rounded-full bg-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[8px] font-bold text-white">!</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{c.name}</p>
                    <p className="text-muted-foreground truncate" title={c.location}>{c.location}</p>
                    <p className="text-orange-600 text-[10px]">{c.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
