"use client"

import type React from "react"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash2, Plus, Users, Phone, Mail } from "lucide-react"

export function WorkersPanel() {
  const workers = useStore((state) => state.workers)
  const contracts = useStore((state) => state.contracts)
  const addWorker = useStore((state) => state.addWorker)
  const updateWorker = useStore((state) => state.updateWorker)
  const deleteWorker = useStore((state) => state.deleteWorker)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingWorkerId, setEditingWorkerId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    contractIds: [] as string[],
  })

  const handleOpenDialog = (workerId?: string) => {
    if (workerId) {
      const worker = workers.find((w) => w.id === workerId)
      if (worker) {
        setFormData({
          name: worker.name,
          phone: worker.phone,
          email: worker.email,
          contractIds: worker.contractIds,
        })
        setEditingWorkerId(workerId)
      }
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        contractIds: [],
      })
      setEditingWorkerId(null)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingWorkerId) {
      updateWorker(editingWorkerId, formData)
    } else {
      addWorker(formData)
    }

    setIsDialogOpen(false)
  }

  const toggleContract = (contractId: string) => {
    setFormData((prev) => ({
      ...prev,
      contractIds: prev.contractIds.includes(contractId)
        ? prev.contractIds.filter((id) => id !== contractId)
        : [...prev.contractIds, contractId],
    }))
  }

  const getContractNames = (contractIds: string[]) => {
    return contractIds
      .map((id) => contracts.find((c) => c.id === id)?.name)
      .filter(Boolean)
      .join(", ")
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Operarios</h2>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Operario
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {workers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay operarios</h3>
            <p className="text-muted-foreground">Añade tu primer operario para comenzar</p>
          </div>
        ) : (
          <div className="space-y-3">
            {workers.map((worker) => (
              <Card key={worker.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{worker.name}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{worker.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span>{worker.email}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(worker.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar este operario?")) {
                          deleteWorker(worker.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {worker.contractIds.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm font-medium mb-2">Contratos asignados:</p>
                    <div className="flex flex-wrap gap-2">
                      {worker.contractIds.map((contractId) => {
                        const contract = contracts.find((c) => c.id === contractId)
                        return contract ? (
                          <Badge key={contractId} variant="secondary">
                            {contract.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingWorkerId ? "Editar Operario" : "Nuevo Operario"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Contratos asignados</Label>
              {contracts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No hay contratos disponibles</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-md p-3">
                  {contracts.map((contract) => (
                    <div key={contract.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={contract.id}
                        checked={formData.contractIds.includes(contract.id)}
                        onCheckedChange={() => toggleContract(contract.id)}
                      />
                      <label htmlFor={contract.id} className="text-sm cursor-pointer flex-1">
                        {contract.name}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingWorkerId ? "Guardar" : "Crear"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
