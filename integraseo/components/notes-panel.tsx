"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Edit, Trash2, Plus, FileText } from "lucide-react"
import type { ContractNote } from "@/lib/types"

interface NotesPanelProps {
  contractId: string
}

export function NotesPanel({ contractId }: NotesPanelProps) {
  const contracts = useStore((state) => state.contracts)
  const addNote = useStore((state) => state.addNote)
  const updateNote = useStore((state) => state.updateNote)
  const deleteNote = useStore((state) => state.deleteNote)

  const contract = contracts.find((c) => c.id === contractId)
  const notes: ContractNote[] = [...(contract?.notes || [])].sort(
    (a, b) => new Date(b.date + "T" + b.time).getTime() - new Date(a.date + "T" + a.time).getTime()
  )

  const now = new Date()
  const todayStr = now.toISOString().split("T")[0]
  const timeStr = now.toTimeString().slice(0, 5)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ date: todayStr, time: timeStr, content: "" })
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const openAdd = () => {
    setEditingId(null)
    setForm({ date: todayStr, time: timeStr, content: "" })
    setModalOpen(true)
  }

  const openEdit = (note: ContractNote) => {
    setEditingId(note.id)
    setForm({ date: note.date, time: note.time, content: note.content })
    setModalOpen(true)
  }

  const openDelete = (id: string) => {
    setDeletingId(id)
    setConfirmOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateNote(contractId, editingId, form)
    } else {
      await addNote(contractId, form)
    }
    setModalOpen(false)
  }

  return (
    <div className="space-y-3">
      <Button size="sm" className="w-full" onClick={openAdd}>
        <Plus className="h-4 w-4 mr-2" /> Añadir Nota
      </Button>

      {notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mb-3 opacity-40" />
          <p className="font-medium">No hay notas</p>
          <p className="text-sm">Añade una nota para este contrato</p>
        </div>
      ) : (
        notes.map((note) => (
          <Card key={note.id} className="p-3">
            <div className="flex items-start justify-between mb-2">
              <p className="text-sm text-muted-foreground">{note.date} - {note.time}</p>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(note)}>
                  <Edit className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => openDelete(note.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            </div>
            <p className="text-sm whitespace-pre-wrap">{note.content}</p>
          </Card>
        ))
      )}

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Nota" : "Nueva Nota"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label>Hora</Label>
                <Input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Contenido</Label>
              <Textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} rows={4} required />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Eliminar nota"
        description="¿Estás seguro de que deseas eliminar esta nota? Esta acción no se puede deshacer."
        onConfirm={() => deletingId && deleteNote(contractId, deletingId)}
      />
    </div>
  )
}
