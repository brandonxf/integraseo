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
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Trash2 } from "lucide-react"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const WEEKDAYS = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"]

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function CalendarPanel() {
  const events = useStore((state) => state.events)
  const contracts = useStore((state) => state.contracts)
  const addEvent = useStore((state) => state.addEvent)
  const deleteEvent = useStore((state) => state.deleteEvent)

  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ title: "", date: "", time: "", description: "" })

  const today = now.toISOString().split("T")[0]

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1) }
    else setCurrentMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1) }
    else setCurrentMonth((m) => m + 1)
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate()
  const totalCells = firstDay + daysInMonth
  const trailingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7)

  const dateStr = (day: number) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`

  const hasNotes = (day: number) => {
    const d = dateStr(day)
    return contracts.some((c) => c.notes?.some((n) => n.date === d))
  }

  const monthEvents = events
    .filter((e) => {
      const [y, m] = e.date.split("-").map(Number)
      return y === currentYear && m === currentMonth + 1
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))

  const openModal = () => {
    setForm({ title: "", date: today, time: new Date().toTimeString().slice(0, 5), description: "" })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await addEvent(form)
    setModalOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
            <h2 className="text-lg font-semibold w-44 text-center">{MONTHS[currentMonth]} {currentYear}</h2>
            <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <Button size="sm" onClick={openModal}><Plus className="h-4 w-4 mr-1" /> Evento</Button>
        </div>

        {/* Weekdays header */}
        <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
          {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: firstDay }, (_, i) => (
            <div key={`p-${i}`} className="aspect-square flex items-center justify-center text-xs text-muted-foreground/40">
              {prevMonthDays - firstDay + i + 1}
            </div>
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1
            const isToday = dateStr(day) === today
            const note = hasNotes(day)
            return (
              <div
                key={day}
                className={`aspect-square flex flex-col items-center justify-center text-xs rounded-md relative ${
                  isToday ? "bg-primary text-primary-foreground font-bold" : "hover:bg-accent"
                }`}
              >
                {day}
                {note && <div className="absolute bottom-0.5 w-1 h-1 rounded-full bg-yellow-400" />}
              </div>
            )
          })}
          {Array.from({ length: trailingCells }, (_, i) => (
            <div key={`n-${i}`} className="aspect-square flex items-center justify-center text-xs text-muted-foreground/40">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Events list */}
      <div className="flex-1 overflow-y-auto p-4">
        {monthEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <CalendarIcon className="h-10 w-10 mb-2 opacity-40" />
            <p>No hay eventos este mes</p>
            <p className="text-sm">Añade eventos al calendario</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthEvents.map((event) => (
              <Card key={event.id} className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{event.title}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(event.date)} - {event.time}</p>
                    {event.description && <p className="text-sm mt-1">{event.description}</p>}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteEvent(event.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo Evento</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Fecha</Label><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Hora</Label><Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required /></div>
            </div>
            <div className="space-y-2"><Label>Descripción</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Crear</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
