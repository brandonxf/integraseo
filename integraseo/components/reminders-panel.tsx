"use client"

import type React from "react"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit } from "lucide-react"

export function RemindersPanel() {
  const contracts = useStore((state) => state.contracts)
  const reminders = useStore((state) => state.reminders)
  const addReminder = useStore((state) => state.addReminder)
  const updateReminder = useStore((state) => state.updateReminder)
  const deleteReminder = useStore((state) => state.deleteReminder)
  const toggleReminder = useStore((state) => state.toggleReminder)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterContractId, setFilterContractId] = useState("")
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    description: "",
    contractId: "",
  })

  const today = new Date().toISOString().split("T")[0]
  const nowTime = new Date().toTimeString().slice(0, 5)

  const openAdd = () => {
    setEditingId(null)
    setFormData({ title: "", date: today, time: nowTime, description: "", contractId: "" })
    setIsDialogOpen(true)
  }

  const openEdit = (id: string) => {
    const r = reminders.find((r) => r.id === id)
    if (!r) return
    setEditingId(id)
    setFormData({
      title: r.title,
      date: r.date,
      time: r.time,
      description: r.description || "",
      contractId: r.contractId || "",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const contractName = contracts.find((c) => c.id === formData.contractId)?.name || undefined
    if (editingId) {
      await updateReminder(editingId, { ...formData, contractName })
    } else {
      await addReminder({ ...formData, contractName, completed: false })
    }
    setIsDialogOpen(false)
  }

  const sorted = [...reminders]
    .filter((r) => !filterContractId || r.contractId === filterContractId)
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recordatorios</h2>
          <Button size="sm" onClick={openAdd}>
            <Plus className="h-4 w-4 mr-1" /> Nuevo
          </Button>
        </div>
        <Select value={filterContractId} onValueChange={setFilterContractId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Filtrar por contrato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {contracts.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <p className="font-medium">No hay recordatorios</p>
            <p className="text-sm">Añade recordatorios para no olvidar tareas importantes</p>
          </div>
        ) : (
          <div className="space-y-3">
            {sorted.map((reminder) => (
              <Card key={reminder.id} className={`p-4 ${reminder.completed ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => toggleReminder(reminder.id)}
                      className={`mt-0.5 w-5 h-5 rounded-full border-2 flex-shrink-0 ${reminder.completed ? "bg-primary border-primary" : "border-muted-foreground"}`}
                    />
                    <div className="flex-1">
                      <p className={`font-medium ${reminder.completed ? "line-through" : ""}`}>{reminder.title}</p>
                      <p className="text-sm text-muted-foreground">{reminder.date} {reminder.time}</p>
                      {reminder.contractName && (
                        <p className="text-xs text-muted-foreground">Contrato: {reminder.contractName}</p>
                      )}
                      {reminder.description && (
                        <p className="text-sm mt-1">{reminder.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(reminder.id)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Recordatorio" : "Nuevo Recordatorio"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Contrato (opcional)</Label>
              <Select value={formData.contractId} onValueChange={(v) => setFormData({ ...formData, contractId: v })}>
                <SelectTrigger><SelectValue placeholder="Sin contrato" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin contrato</SelectItem>
                  {contracts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
              <Button type="submit">{editingId ? "Guardar" : "Crear"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
