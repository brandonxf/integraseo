"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { ChevronLeft, ChevronRight } from "lucide-react"
import type { Visit } from "@/lib/types"

interface VisitsPanelProps {
  contractId: string
}

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric" })
}

export function VisitsPanel({ contractId }: VisitsPanelProps) {
  const { contracts, addVisit, deleteVisit } = useStore()
  const contract = contracts.find((c) => c.id === contractId)
  const visits: Visit[] = contract?.visits || []

  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [confirmVisitOpen, setConfirmVisitOpen] = useState(false)
  const [deleteVisitOpen, setDeleteVisitOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [visitToDelete, setVisitToDelete] = useState<string | null>(null)

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1) }
    else setCurrentMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1) }
    else setCurrentMonth(m => m + 1)
  }

  const firstDay = new Date(currentYear, currentMonth, 1).getDay()
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

  const hasVisit = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return visits.some((v) => v.date === dateStr)
  }

  const isToday = (day: number) =>
    day === now.getDate() && currentMonth === now.getMonth() && currentYear === now.getFullYear()

  const handleDayClick = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    setSelectedDate(dateStr)
    setConfirmVisitOpen(true)
  }

  const handleConfirmVisit = async () => {
    const nowTime = new Date()
    const time = nowTime.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
    await addVisit(contractId, {
      date: selectedDate,
      time,
      createdAt: nowTime.toISOString(),
      confirmedAt: nowTime.toISOString(),
      status: "confirmed",
      contractId,
      contractName: contract?.name || "",
    })
  }

  const handleDeleteVisit = (visitId: string) => {
    setVisitToDelete(visitId)
    setDeleteVisitOpen(true)
  }

  const confirmedVisits = [...visits]
    .filter((v) => v.status === "confirmed")
    .sort((a, b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime())

  const selectedDateFormatted = selectedDate
    ? new Date(selectedDate + "T00:00:00").toLocaleDateString("es-ES", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    : ""

  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="h-4 w-4" /></Button>
        <span className="font-semibold">{MONTHS[currentMonth]} {currentYear}</span>
        <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="h-4 w-4" /></Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground mb-1">
        {["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
          <button
            key={day}
            onClick={() => handleDayClick(day)}
            className={[
              "aspect-square flex items-center justify-center rounded-full text-sm transition-colors",
              isToday(day) ? "border-2 border-primary font-bold" : "",
              hasVisit(day) ? "bg-primary text-primary-foreground" : "hover:bg-accent",
            ].join(" ")}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Confirmed visits list */}
      <div className="mt-4">
        <h4 className="font-semibold text-sm mb-2">Visitas Confirmadas</h4>
        {confirmedVisits.length === 0 ? (
          <p className="text-sm text-muted-foreground">No hay visitas confirmadas</p>
        ) : (
          <div className="space-y-2">
            {confirmedVisits.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between p-2 rounded-md bg-accent/50 text-sm">
                <div>
                  <p className="font-medium">{formatDate(visit.date)} - {visit.time}</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmada el {new Date(visit.confirmedAt).toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDeleteVisit(visit.id)}
                >✕</Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm add visit dialog */}
      <Dialog open={confirmVisitOpen} onOpenChange={setConfirmVisitOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Confirmar Visita</DialogTitle></DialogHeader>
          <p className="text-sm">¿Desea confirmar la visita para el día <span className="font-semibold">{selectedDateFormatted}</span>?</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setConfirmVisitOpen(false)}>No</Button>
            <Button onClick={() => { handleConfirmVisit(); setConfirmVisitOpen(false) }}>Sí</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm delete visit dialog */}
      <ConfirmDialog
        open={deleteVisitOpen}
        onOpenChange={setDeleteVisitOpen}
        title="Eliminar visita"
        description="¿Estás seguro de que deseas eliminar esta visita? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={() => { if (visitToDelete) deleteVisit(contractId, visitToDelete) }}
      />
    </div>
  )
}
