"use client"

import type React from "react"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns"
import { es } from "date-fns/locale"

export function CalendarPanel() {
  const contracts = useStore((state) => state.contracts)
  const events = useStore((state) => state.events)
  const notes = useStore((state) => state.notes)
  const addEvent = useStore((state) => state.addEvent)
  const deleteEvent = useStore((state) => state.deleteEvent)

  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    contractId: "",
    type: "other" as "meeting" | "deadline" | "note" | "other",
  })

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const getEventsForDate = (date: Date) => {
    return events.filter((event) => isSameDay(new Date(event.date), date))
  }

  const getNotesForDate = (date: Date) => {
    return notes.filter((note) => isSameDay(new Date(note.createdAt), date))
  }

  const handleOpenDialog = (date?: Date) => {
    setFormData({
      title: "",
      date: date ? format(date, "yyyy-MM-dd") : "",
      contractId: "",
      type: "other",
    })
    setIsDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addEvent({
      title: formData.title,
      date: formData.date,
      contractId: formData.contractId || undefined,
      type: formData.type,
    })
    setIsDialogOpen(false)
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "meeting":
        return "bg-blue-500"
      case "deadline":
        return "bg-red-500"
      case "note":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "meeting":
        return "Reunión"
      case "deadline":
        return "Fecha límite"
      case "note":
        return "Nota"
      default:
        return "Otro"
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Calendario</h2>
          <Button size="sm" onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Evento
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h3 className="text-lg font-semibold capitalize">{format(currentDate, "MMMM yyyy", { locale: es })}</h3>
          <Button variant="outline" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-7 gap-2 mb-2">
          {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
            <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2">
          {/* Empty cells for days before month starts */}
          {Array.from({ length: (monthStart.getDay() + 6) % 7 }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {/* Days of the month */}
          {daysInMonth.map((day) => {
            const dayEvents = getEventsForDate(day)
            const dayNotes = getNotesForDate(day)
            const hasActivity = dayEvents.length > 0 || dayNotes.length > 0
            const isToday = isSameDay(day, new Date())
            const isSelected = selectedDate && isSameDay(day, selectedDate)

            return (
              <Card
                key={day.toISOString()}
                className={`aspect-square p-2 cursor-pointer transition-colors ${
                  isToday ? "border-primary" : ""
                } ${isSelected ? "bg-accent" : ""}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="flex flex-col h-full">
                  <span className={`text-sm font-medium ${isToday ? "text-primary" : ""}`}>{format(day, "d")}</span>
                  {hasActivity && (
                    <div className="flex-1 flex flex-col gap-1 mt-1">
                      {dayEvents.slice(0, 2).map((event) => (
                        <div key={event.id} className={`h-1 rounded-full ${getTypeColor(event.type)}`} />
                      ))}
                      {dayNotes.length > 0 && <div className="h-1 rounded-full bg-yellow-500" />}
                    </div>
                  )}
                </div>
              </Card>
            )
          })}
        </div>

        {/* Selected date details */}
        {selectedDate && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                {format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: es })}
              </h3>
              <Button size="sm" onClick={() => handleOpenDialog(selectedDate)}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Evento
              </Button>
            </div>

            {/* Events for selected date */}
            {getEventsForDate(selectedDate).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Eventos</h4>
                {getEventsForDate(selectedDate).map((event) => (
                  <Card key={event.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getTypeColor(event.type)}>{getTypeLabel(event.type)}</Badge>
                        </div>
                        <p className="font-medium">{event.title}</p>
                        {event.contractId && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {contracts.find((c) => c.id === event.contractId)?.name}
                          </p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (confirm("¿Eliminar este evento?")) {
                            deleteEvent(event.id)
                          }
                        }}
                      >
                        <span className="text-destructive">×</span>
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* Notes for selected date */}
            {getNotesForDate(selectedDate).length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Notas creadas este día</h4>
                {getNotesForDate(selectedDate).map((note) => (
                  <Card key={note.id} className="p-3">
                    <p className="text-sm text-muted-foreground mb-1">
                      {contracts.find((c) => c.id === note.contractId)?.name}
                    </p>
                    <p className="text-sm">{note.content.substring(0, 100)}...</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(note.createdAt), "HH:mm", { locale: es })}
                    </p>
                  </Card>
                ))}
              </div>
            )}

            {getEventsForDate(selectedDate).length === 0 && getNotesForDate(selectedDate).length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No hay eventos ni notas para este día</p>
              </div>
            )}
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Evento</DialogTitle>
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
              <Label htmlFor="date">Fecha</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <Select
                value={formData.type}
                onValueChange={(value: "meeting" | "deadline" | "note" | "other") =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Reunión</SelectItem>
                  <SelectItem value="deadline">Fecha límite</SelectItem>
                  <SelectItem value="note">Nota</SelectItem>
                  <SelectItem value="other">Otro</SelectItem>
                </SelectContent>
              </Select>
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
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
