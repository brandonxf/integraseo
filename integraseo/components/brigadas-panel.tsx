"use client"

import { useEffect, useState, useCallback, useMemo, memo } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { RotateCcw, Leaf, Sparkles, ChevronDown } from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import { useToast } from "@/lib/toast"
import type { BrigadaServices, Contract } from "@/lib/types"

interface BrigadaState { [id: string]: BrigadaServices }

// Número de contratos a mostrar inicialmente
const INITIAL_VISIBLE_COUNT = 20
// Incremento al cargar más
const LOAD_MORE_COUNT = 20

// Componente memoizado para cada item de brigada
const BrigadaItem = memo(function BrigadaItem({
  contract,
  services,
  onToggle,
}: {
  contract: Contract
  services: BrigadaServices
  onToggle: (id: string, svc: "jardineria" | "aseo", val: boolean) => void
}) {
  const anyChecked = services.jardineria || services.aseo

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        anyChecked ? "bg-primary/5 border-primary/30" : "bg-card border-border"
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-tight truncate">{contract.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{contract.client}</p>
        </div>
        {anyChecked && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0 ml-2">
            {[services.jardineria && "Jard.", services.aseo && "Aseo"].filter(Boolean).join(" · ")}
          </span>
        )}
      </div>
      <div className="flex gap-3">
        {[
          { key: "jardineria" as const, label: "Jardinería", Icon: Leaf, color: "text-emerald-600 dark:text-emerald-400" },
          { key: "aseo" as const, label: "Aseo", Icon: Sparkles, color: "text-sky-600 dark:text-sky-400" },
        ].map(({ key, label, Icon, color }) => (
          <button
            key={key}
            onClick={() => onToggle(contract.id, key, !services[key])}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-all ${
              services[key]
                ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                : "bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}
          >
            <Icon className={`h-4 w-4 ${services[key] ? "text-primary-foreground" : color}`} />
            {label}
          </button>
        ))}
      </div>
    </div>
  )
})

export function BrigadasPanel({ search = "" }: { search?: string }) {
  const { contracts, getAllBrigadaServices, updateBrigadaServices } = useStore()
  const [brigadas, setBrigadas] = useState<BrigadaState>({})
  const [loading, setLoading] = useState(true)
  const [resetOpen, setResetOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT)
  const toast = useToast()

  // Carga inicial de brigadas - solo UNA llamada a Firestore
  useEffect(() => {
    let mounted = true
    const load = async () => {
      if (contracts.length === 0) {
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const allServices = await getAllBrigadaServices()
        if (mounted) {
          setBrigadas(allServices)
        }
      } catch (error) {
        console.error("Error cargando brigadas:", error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }
    load()
    return () => { mounted = false }
  }, [contracts.length, getAllBrigadaServices])

  // Memoizar el filtrado para evitar recalcular en cada render
  const filtered = useMemo(() => {
    if (!search) return contracts
    const q = search.toLowerCase()
    return contracts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.client.toLowerCase().includes(q)
    )
  }, [contracts, search])

  // Contratos visibles (paginación)
  const visibleContracts = useMemo(() => {
    return filtered.slice(0, visibleCount)
  }, [filtered, visibleCount])

  // Verificar si hay más contratos para cargar
  const hasMore = filtered.length > visibleCount

  // Resetear contador visible cuando cambia el filtro
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE_COUNT)
  }, [search])

  const toggle = useCallback(
    async (id: string, svc: "jardineria" | "aseo", val: boolean) => {
      const cur = brigadas[id] || { jardineria: false, aseo: false }
      const upd = { ...cur, [svc]: val }
      // Actualización optimista
      setBrigadas((p) => ({ ...p, [id]: upd }))
      try {
        await updateBrigadaServices(id, upd)
        toast.success(
          val
            ? `${svc === "jardineria" ? "Jardinería" : "Aseo"} marcado`
            : `${svc === "jardineria" ? "Jardinería" : "Aseo"} desmarcado`
        )
      } catch {
        // Revertir en caso de error
        setBrigadas((p) => ({ ...p, [id]: cur }))
        toast.error("Error al actualizar brigada")
      }
    },
    [brigadas, updateBrigadaServices, toast]
  )

  const handleReset = useCallback(async () => {
    setResetting(true)
    try {
      // Actualizar todas en paralelo
      await Promise.all(
        contracts.map((c) =>
          updateBrigadaServices(c.id, { jardineria: false, aseo: false })
        )
      )
      const r: BrigadaState = {}
      contracts.forEach((c) => {
        r[c.id] = { jardineria: false, aseo: false }
      })
      setBrigadas(r)
      toast.success("Verificaciones limpiadas")
    } catch {
      toast.error("Error al limpiar verificaciones")
    } finally {
      setResetting(false)
      setResetOpen(false)
    }
  }, [contracts, updateBrigadaServices, toast])

  // Memoizar conteo de verificados
  const checkedCount = useMemo(() => {
    return Object.values(brigadas).filter((b) => b.jardineria || b.aseo).length
  }, [brigadas])

  const progress = contracts.length ? (checkedCount / contracts.length) * 100 : 0

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex justify-end">
          <button
            onClick={() => setResetOpen(true)}
            title="Limpiar verificaciones"
            className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
        {!loading && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground shrink-0">
              {checkedCount}/{contracts.length}
            </p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
            Cargando brigadas...
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            illustration="workers"
            title={search ? "Sin coincidencias" : "Sin contratos"}
            description={
              search
                ? "Intenta otra búsqueda"
                : "Los contratos con brigadas aparecerán aquí"
            }
          />
        ) : (
          <>
            {visibleContracts.map((c) => (
              <BrigadaItem
                key={c.id}
                contract={c}
                services={brigadas[c.id] || { jardineria: false, aseo: false }}
                onToggle={toggle}
              />
            ))}
            {/* Botón "Cargar más" */}
            {hasMore && (
              <button
                onClick={() => setVisibleCount((prev) => prev + LOAD_MORE_COUNT)}
                className="w-full py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-dashed border-border rounded-2xl hover:bg-muted/50"
              >
                <ChevronDown className="h-4 w-4" />
                Cargar más ({filtered.length - visibleCount} restantes)
              </button>
            )}
          </>
        )}
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limpiar Verificaciones</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Limpiar todas las verificaciones de jardinería y aseo? Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setResetOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleReset}
              disabled={resetting}
            >
              {resetting ? "Limpiando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
