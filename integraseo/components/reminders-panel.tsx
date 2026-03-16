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
import { Badge } from "@/components/ui/badge"
import { Plus, Bell, Trash2, Edit, CheckCircle2, Circle } from "lucide-react"
import { format, isPast, isToday, isTomorrow } from "date-fns"
import { es } from "date-fns/locale"

export function RemindersPanel() {
  const contracts = useStore((state) => state.contracts)
  const reminders = useStore((state) => state.reminders)
  const addReminder = useStore((state) => state.addReminder)
  const updateReminder = useStore((state) => state.updateReminder)
  const deleteReminder = useStore((state) => state.deleteReminder)
  const toggleReminder = useStore((state) => state.toggleReminder)

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingReminderId, setEditingReminderId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all")
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    dueDate: "",
    contractId: "",
  })

  const handleOpenDialog = (reminderId?: string) => {
    if (reminderId) {
      const reminder = reminders.find((r) => r.id === reminderId)
      if (reminder) {
        setFormData({
          title: reminder.title,
          description: reminder.description,
          dueDate: reminder.dueDate,
          contractId: reminder.contractId || "",
        })
        setEditingReminderId(reminderId)
      }
    } else {
      setFormData({
        title: "",
        description: "",
        dueDate: "",
        contractId: "",
      })
      setEditingReminderId(null)
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingReminderId) {
      updateReminder(editingReminderId, {
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        contractId: formData.contractId || undefined,
      })
    } else {
      addReminder({
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        contractId: formData.contractId || undefined,
        completed: false,
      })
    }

    setIsDialogOpen(false)
  }

  const getDateBadge = (dueDate: string) => {
    const date = new Date(dueDate)
    if (isPast(date) && !isToday(date)) {
      return <Badge className="bg-red-500">Vencido</Badge>
    }
    if (isToday(date)) {
      return <Badge className="bg-orange-500">Hoy</Badge>
    }
    if (isTomorrow(date)) {
      return <Badge className="bg-yellow-500">Mañana</Badge>
    }
    return <Badge variant="secondary">{format(date, "dd/MM/yyyy", { locale: es })}</Badge>
  }

  const filteredReminders = reminders
    .filter((r) => {
      if (filter === "pending") return !r.completed
      if (filter === "completed") return r.completed
      return true
    })
    .sort((a, b) => {
      // Sort by completed status first, then by date
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  const pendingCount = reminders.filter((r) => !r.completed).length
  const overdueCount = reminders.filter(
    (r) => !r.completed && isPast(new Date(r.dueDate)) && !isToday(new Date(r.dueDate)),
  ).length

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Recordatorios</h2>
            <div className="flex gap-2 mt-1">
              <span className="text-sm text-muted-foreground">{pendingCount} pendientes</span>
              {overdueCount > 0 && <span className="text-sm text-red-500">{overdueCount} vencidos</span>}
            </div>
          </div>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("all")}
            className="flex-1"
          >
            Todos
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("pending")}
            className="flex-1"
          >
            Pendientes
          </Button>
          <Button
            variant={filter === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter("completed")}
            className="flex-1"
          >
            Completados
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredReminders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bell className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay recordatorios</h3>
            <p className="text-muted-foreground">
              {filter === "all"
                ? "Crea tu primer recordatorio"
                : filter === "pending"
                  ? "No tienes recordatorios pendientes"
                  : "No has completado ningún recordatorio"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReminders.map((reminder) => (
              <Card key={reminder.id} className={`p-4 ${reminder.completed ? "opacity-60" : ""}`}>
                <div className="flex items-start gap-3">
                  <button
                    onClick={() => toggleReminder(reminder.id)}
                    className="mt-1 text-primary hover:text-primary/80 transition-colors"
                  >
                    {reminder.completed ? (
                      <CheckCircle2 className="h-5 w-5 fill-current" />
                    ) : (
                      <Circle className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className={`font-semibold ${reminder.completed ? "line-through" : ""}`}>{reminder.title}</h3>
                      <div className="flex gap-1 flex-shrink-0">
                        {!reminder.completed && (
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(reminder.id)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm("¿Eliminar este recordatorio?")) {
                              deleteReminder(reminder.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mb-2">{reminder.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2 items-center">
                      {getDateBadge(reminder.dueDate)}
                      {reminder.contractId && (
                        <Badge variant="outline">
                          {contracts.find((c) => c.id === reminder.contractId)?.name || "Contrato"}
                        </Badge>
                      )}
                    </div>
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
            <DialogTitle>{editingReminderId ? "Editar Recordatorio" : "Nuevo Recordatorio"}</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
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

            <div className="space-y-2">
              <Label htmlFor="dueDate">Fecha de vencimiento</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contract">Contrato (opcional)</Label>
              <Select
                value={formData.contractId}
                onValueChange={(value) => setFormData({ ...formData, contractId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin contrato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin contrato</SelectItem>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">{editingReminderId ? "Guardar" : "Crear"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
