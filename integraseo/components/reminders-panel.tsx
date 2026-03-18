"use client"

import type React from "react"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, Edit, Bell } from "lucide-react"

export function RemindersPanel({ search = "" }: { search?: string }) {
  const contracts      = useStore((s) => s.contracts)
  const reminders      = useStore((s) => s.reminders)
  const addReminder    = useStore((s) => s.addReminder)
  const updateReminder = useStore((s) => s.updateReminder)
  const deleteReminder = useStore((s) => s.deleteReminder)
  const toggleReminder = useStore((s) => s.toggleReminder)

  const [open, setOpen]             = useState(false)
  const [editingId, setEditingId]   = useState<string|null>(null)
  const [filter, setFilter]         = useState("all")
  const now = new Date()
  const [form, setForm] = useState({ title:"", date:"", time:"", description:"", contractId:"" })

  const openAdd = () => {
    setEditingId(null)
    setForm({ title:"", date:`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`, time:now.toTimeString().slice(0,5), description:"", contractId:"" })
    setOpen(true)
  }
  const openEdit = (id:string) => {
    const r = reminders.find(r=>r.id===id); if(!r) return
    setEditingId(id)
    setForm({ title:r.title, date:r.date, time:r.time, description:r.description||"", contractId:r.contractId||"" })
    setOpen(true)
  }
  const handleSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    const contractName = contracts.find(c=>c.id===form.contractId)?.name
    if(editingId) await updateReminder(editingId, {...form, contractName})
    else await addReminder({...form, contractName, completed:false})
    setOpen(false)
  }

  const sorted = [...reminders]
    .filter(r=>(filter==="all"||r.contractId===filter) && (!search||r.title.toLowerCase().includes(search.toLowerCase())||r.description?.toLowerCase().includes(search.toLowerCase())))
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))

  const pending   = sorted.filter(r=>!r.completed)
  const completed = sorted.filter(r=>r.completed)

  const ReminderCard = ({r}:{r:typeof reminders[0]}) => (
    <div className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all group
      ${r.completed?"bg-muted/40 border-border/50 opacity-60":"bg-card border-border hover:border-primary/20 hover:shadow-sm hover:shadow-primary/5"}`}>
      <button onClick={()=>toggleReminder(r.id)} className="mt-0.5 shrink-0">
        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
          ${r.completed?"bg-primary border-primary":"border-muted-foreground/40 hover:border-primary"}`}>
          {r.completed&&<svg className="w-3 h-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
        </div>
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${r.completed?"line-through text-muted-foreground":""}`}>{r.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="text-xs text-muted-foreground">{r.date} · {r.time}</span>
          {r.contractName&&<span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{r.contractName}</span>}
        </div>
        {r.description&&<p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>}
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button onClick={()=>openEdit(r.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
          <Edit className="h-3.5 w-3.5"/>
        </button>
        <button onClick={()=>deleteReminder(r.id)}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
          <Trash2 className="h-3.5 w-3.5"/>
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-10 flex-1 rounded-xl"><SelectValue placeholder="Todos los contratos"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los contratos</SelectItem>
              {contracts.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <button onClick={openAdd}
            className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
              flex items-center gap-1.5 shadow-sm shadow-primary/30 hover:brightness-110 active:scale-95 transition-all shrink-0">
            <Plus className="h-4 w-4"/>Nuevo
          </button>
        </div>
        {sorted.length>0&&(
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{pending.length}</span> pendiente{pending.length!==1?"s":""}
            {completed.length>0&&<><span>·</span><span>{completed.length} completado{completed.length!==1?"s":""}</span></>}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {sorted.length===0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground/40"/>
            </div>
            <p className="font-semibold">Sin recordatorios</p>
            <p className="text-sm text-muted-foreground mt-1">Crea uno para no olvidar tareas</p>
          </div>
        ) : (
          <>
            {pending.map(r=><ReminderCard key={r.id} r={r}/>)}
            {completed.length>0&&(
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2 pb-1">Completados</p>
                {completed.map(r=><ReminderCard key={r.id} r={r}/>)}
              </>
            )}
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="">
          <DialogHeader><DialogTitle>{editingId?"Editar Recordatorio":"Nuevo Recordatorio"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Título</Label>
              <Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required className="h-10"/>
            </div>
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
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Descripción</Label>
              <Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={2}/>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contrato (opcional)</Label>
              <Select value={form.contractId||"none"} onValueChange={v=>setForm({...form,contractId:v==="none"?"":v})}>
                <SelectTrigger className="h-10 w-full"><SelectValue placeholder="Sin contrato"/></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin contrato</SelectItem>
                  {contracts.map(c=><SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={()=>setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1">{editingId?"Guardar":"Crear"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
