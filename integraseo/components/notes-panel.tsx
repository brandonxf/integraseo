"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Edit, Trash2, Plus, StickyNote } from "lucide-react"
import type { ContractNote } from "@/lib/types"

interface NotesPanelProps { contractId: string }

export function NotesPanel({ contractId }: NotesPanelProps) {
  const contracts  = useStore((s) => s.contracts)
  const addNote    = useStore((s) => s.addNote)
  const updateNote = useStore((s) => s.updateNote)
  const deleteNote = useStore((s) => s.deleteNote)

  const contract = contracts.find((c) => c.id === contractId)
  const notes: ContractNote[] = [...(contract?.notes||[])].sort(
    (a,b) => new Date(b.date+"T"+b.time).getTime() - new Date(a.date+"T"+a.time).getTime()
  )

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`
  const timeStr  = now.toTimeString().slice(0,5)

  const [open, setOpen]           = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [form, setForm]           = useState({ date:todayStr, time:timeStr, content:"" })

  const openAdd  = () => { setEditingId(null); setForm({date:todayStr,time:timeStr,content:""}); setOpen(true) }
  const openEdit = (n:ContractNote) => { setEditingId(n.id); setForm({date:n.date,time:n.time,content:n.content}); setOpen(true) }

  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    if(editingId) await updateNote(contractId,editingId,form)
    else await addNote(contractId,form)
    setOpen(false)
  }

  return (
    <div className="space-y-3 animate-fade-up">
      <button onClick={openAdd}
        className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground
          flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors">
        <Plus className="h-4 w-4"/> Añadir Nota
      </button>

      {notes.length===0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
            <StickyNote className="h-6 w-6 opacity-40"/>
          </div>
          <p className="text-sm font-medium">Sin notas</p>
          <p className="text-xs mt-1">Añade una nota a este contrato</p>
        </div>
      ) : notes.map((note,i) => (
        <div key={note.id} className="p-3.5 rounded-xl bg-card border border-border group hover:border-primary/20 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-0.5"/>
              <span className="text-xs font-semibold text-muted-foreground">{note.date} · {note.time}</span>
            </div>
            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={()=>openEdit(note)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                <Edit className="h-3.5 w-3.5"/>
              </button>
              <button onClick={()=>deleteNote(contractId,note.id)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                <Trash2 className="h-3.5 w-3.5"/>
              </button>
            </div>
          </div>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{note.content}</p>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="">
          <DialogHeader><DialogTitle>{editingId?"Editar Nota":"Nueva Nota"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Fecha</Label>
                <Input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} required className="h-10"/>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Hora</Label>
                <Input type="time" value={form.time} onChange={e=>setForm({...form,time:e.target.value})} required className="h-10"/>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contenido</Label>
              <Textarea value={form.content} onChange={e=>setForm({...form,content:e.target.value})} rows={4} required/>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={()=>setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
