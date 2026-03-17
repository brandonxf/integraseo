"use client"

import { useEffect, useState, useCallback } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import type { BrigadaServices } from "@/lib/types"

interface BrigadaState {
  [contractId: string]: BrigadaServices
}

export function BrigadasPanel() {
  const { contracts, getBrigadaServices, updateBrigadaServices } = useStore()
  const [brigadas, setBrigadas] = useState<BrigadaState>({})
  const [loading, setLoading] = useState(true)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [search, setSearch] = useState("")

  const loadBrigadas = useCallback(async () => {
    setLoading(true)
    const result: BrigadaState = {}
    for (const contract of contracts) {
      result[contract.id] = await getBrigadaServices(contract.id)
    }
    setBrigadas(result)
    setLoading(false)
  }, [contracts, getBrigadaServices])

  useEffect(() => {
    if (contracts.length > 0) loadBrigadas()
    else setLoading(false)
  }, [contracts, loadBrigadas])

  const handleToggle = async (contractId: string, service: "jardineria" | "aseo", value: boolean) => {
    const current = brigadas[contractId] || { jardineria: false, aseo: false }
    const updated = { ...current, [service]: value }
    setBrigadas((prev) => ({ ...prev, [contractId]: updated }))
    await updateBrigadaServices(contractId, updated)
  }

  const handleReset = async () => {
    setResetting(true)
    for (const contract of contracts) {
      await updateBrigadaServices(contract.id, { jardineria: false, aseo: false })
    }
    const result: BrigadaState = {}
    for (const contract of contracts) {
      result[contract.id] = { jardineria: false, aseo: false }
    }
    setBrigadas(result)
    setResetting(false)
    setResetDialogOpen(false)
  }

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.client.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Brigadas</h2>
          <Button variant="outline" size="sm" onClick={() => setResetDialogOpen(true)}>
            Limpiar verificaciones
          </Button>
        </div>
        <input
          type="search"
          placeholder="Buscar contrato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">Cargando brigadas...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <p className="font-medium">{search ? "No hay contratos que coincidan" : "No hay contratos"}</p>
            <p className="text-sm">{search ? "Prueba otra búsqueda" : "Añade contratos para ver las brigadas"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((contract) => {
              const services = brigadas[contract.id] || { jardineria: false, aseo: false }
              return (
                <Card key={contract.id} className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold">{contract.name}</h3>
                    <p className="text-sm text-muted-foreground">{contract.client}</p>
                  </div>
                  <div className="flex gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={services.jardineria}
                        onCheckedChange={(v) => handleToggle(contract.id, "jardineria", !!v)}
                      />
                      <span className="text-sm">Jardinería</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        checked={services.aseo}
                        onCheckedChange={(v) => handleToggle(contract.id, "aseo", !!v)}
                      />
                      <span className="text-sm">Aseo</span>
                    </label>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Limpiar verificaciones</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro de que deseas limpiar todas las verificaciones? Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setResetDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleReset} disabled={resetting}>
              {resetting ? "Limpiando..." : "Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
