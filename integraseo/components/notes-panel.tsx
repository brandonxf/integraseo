"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, Plus, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function NotesPanel() {
  const contracts = useStore((state) => state.contracts)
  const notes = useStore((state) => state.notes)
  const addNote = useStore((state) => state.addNote)
  const updateNote = useStore((state) => state.updateNote)
  const deleteNote = useStore((state) => state.deleteNote)

  const [selectedContractId, setSelectedContractId] = useState<string>("all")
  const [isAdding, setIsAdding] = useState(false)
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null)
  const [noteContent, setNoteContent] = useState("")

  const filteredNotes = selectedContractId === "all" ? notes : notes.filter((n) => n.contractId === selectedContractId)

  const handleAddNote = () => {
    if (!noteContent.trim() || selectedContractId === "all") return

    addNote({
      contractId: selectedContractId,
      content: noteContent,
    })

    setNoteContent("")
    setIsAdding(false)
  }

  const handleUpdateNote = () => {
    if (!noteContent.trim() || !editingNoteId) return

    updateNote(editingNoteId, noteContent)
    setNoteContent("")
    setEditingNoteId(null)
  }

  const handleEdit = (note: { id: string; content: string }) => {
    setEditingNoteId(note.id)
    setNoteContent(note.content)
    setIsAdding(false)
  }

  const handleCancel = () => {
    setIsAdding(false)
    setEditingNoteId(null)
    setNoteContent("")
  }

  const getContractName = (contractId: string) => {
    const contract = contracts.find((c) => c.id === contractId)
    return contract ? contract.name : "Contrato desconocido"
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Notas</h2>
          <Button
            size="sm"
            onClick={() => {
              setIsAdding(true)
              setEditingNoteId(null)
              setNoteContent("")
            }}
            disabled={selectedContractId === "all" || isAdding || editingNoteId !== null}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nueva Nota
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Filtrar por contrato</label>
          <Select value={selectedContractId} onValueChange={setSelectedContractId}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los contratos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los contratos</SelectItem>
              {contracts.map((contract) => (
                <SelectItem key={contract.id} value={contract.id}>
                  {contract.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(isAdding || editingNoteId) && (
          <Card className="p-4 space-y-3">
            <Textarea
              placeholder="Escribe tu nota aquí..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button size="sm" onClick={editingNoteId ? handleUpdateNote : handleAddNote}>
                {editingNoteId ? "Guardar" : "Añadir"}
              </Button>
            </div>
          </Card>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filteredNotes.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay notas</h3>
            <p className="text-muted-foreground">
              {selectedContractId === "all"
                ? "Selecciona un contrato para añadir notas"
                : "Añade tu primera nota para este contrato"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes.map((note) => (
              <Card key={note.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{getContractName(note.contractId)}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(note.createdAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(note)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("¿Estás seguro de eliminar esta nota?")) {
                          deleteNote(note.id)
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                {note.updatedAt !== note.createdAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Editado: {format(new Date(note.updatedAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
