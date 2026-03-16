"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ContractDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractId?: string | null
}

export function ContractDialog({ open, onOpenChange, contractId }: ContractDialogProps) {
  const addContract = useStore((state) => state.addContract)
  const updateContract = useStore((state) => state.updateContract)
  const getContract = useStore((state) => state.getContract)

  const [formData, setFormData] = useState({
    name: "",
    client: "",
    startDate: "",
    endDate: "",
    status: "pending" as "active" | "completed" | "pending",
    description: "",
  })

  useEffect(() => {
    if (contractId) {
      const contract = getContract(contractId)
      if (contract) {
        setFormData({
          name: contract.name,
          client: contract.client,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          description: contract.description,
        })
      }
    } else {
      setFormData({
        name: "",
        client: "",
        startDate: "",
        endDate: "",
        status: "pending",
        description: "",
      })
    }
  }, [contractId, getContract, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (contractId) {
      updateContract(contractId, formData)
    } else {
      addContract({ ...formData, workers: [] })
    }

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{contractId ? "Editar Contrato" : "Nuevo Contrato"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Contrato</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
            <Input
              id="client"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Fecha de Inicio</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endDate">Fecha de Fin</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              value={formData.status}
              onValueChange={(value: "active" | "completed" | "pending") => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{contractId ? "Guardar" : "Crear"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
