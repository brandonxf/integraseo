"use client"

import type React from "react"
import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const WEEKDAYS = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"]

function fmt(dateStr: string) {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", { day:"2-digit", month:"long" })
}

export function CalendarPanel() {
  const events      = useStore((s) => s.events)
  const contracts   = useStore((s) => s.contracts)
  const addEvent    = useStore((s) => s.addEvent)
  const deleteEvent = useStore((s) => s.deleteEvent)

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear]   = useState(now.getFullYear())
  const [open, setOpen]   = useState(false)
  const [form, setForm]   = useState({ title:"", date:"", time:"", description:"" })

  const today   = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
  const prev    = () => { if(month===0){setMonth(11);setYear(y=>y-1)} else setMonth(m=>m-1) }
  const next    = () => { if(month===11){setMonth(0);setYear(y=>y+1)} else setMonth(m=>m+1) }
  const fDay    = new Date(year,month,1).getDay()
  const days    = new Date(year,month+1,0).getDate()
  const prevD   = new Date(year,month,0).getDate()
  const trail   = (fDay+days)%7===0?0:7-(fDay+days)%7

  const ds = (d:number) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
  const hasEvent = (d:number) => events.some(e=>e.date===ds(d))
  const hasNote  = (d:number) => contracts.some(c=>c.notes?.some(n=>n.date===ds(d)))

  const monthEvents = events
    .filter(e=>{ const [y,m]=e.date.split("-").map(Number); return y===year&&m===month+1 })
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))

  const handleSubmit = async (e:React.FormEvent) => { e.preventDefault(); await addEvent(form); setOpen(false) }

  return (
    <div className="flex flex-col h-full">
      {/* Calendar widget */}
      <div className="shrink-0 px-4 pt-4 pb-3">
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold tracking-tight">{MONTHS[month]} {year}</span>
            <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="px-3 py-2">
            {/* Weekday headers */}
            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map(d=>(
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({length:fDay},(_,i)=>(
                <div key={`p${i}`} className="aspect-square flex items-center justify-center text-[11px] text-muted-foreground/30">
                  {prevD-fDay+i+1}
                </div>
              ))}
              {Array.from({length:days},(_,i)=>{
                const d=i+1; const isToday=ds(d)===today; const ev=hasEvent(d); const nt=hasNote(d)
                return (
                  <div key={d} className={`aspect-square flex flex-col items-center justify-center relative rounded-lg text-[12px] font-medium transition-colors
                    ${isToday?"bg-primary text-primary-foreground shadow-sm":"hover:bg-muted"}`}>
                    {d}
                    {(ev||nt)&&(
                      <div className="absolute bottom-1 flex gap-0.5">
                        {ev&&<div className={`w-1 h-1 rounded-full ${isToday?"bg-white/60":"bg-primary"}`}/>}
                        {nt&&<div className={`w-1 h-1 rounded-full ${isToday?"bg-white/40":"bg-amber-400"}`}/>}
                      </div>
                    )}
                  </div>
                )
              })}
              {Array.from({length:trail},(_,i)=>(
                <div key={`n${i}`} className="aspect-square flex items-center justify-center text-[11px] text-muted-foreground/30">{i+1}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Events list */}
      <div className="shrink-0 px-4 mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Eventos · {MONTHS[month]}
        </h3>
        <button onClick={()=>{setForm({title:"",date:today,time:now.toTimeString().slice(0,5),description:""});setOpen(true)}}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
          <Plus className="h-3.5 w-3.5"/>Añadir
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
        {monthEvents.length===0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-3">
              <span className="text-xl">📅</span>
            </div>
            <p className="text-sm font-medium">Sin eventos este mes</p>
            <p className="text-xs mt-1">Toca "Añadir" para crear uno</p>
          </div>
        ) : monthEvents.map(ev=>(
          <div key={ev.id} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border group">
            <div className="text-center shrink-0 w-10">
              <p className="text-lg font-bold text-primary leading-none">{new Date(ev.date+"T00:00:00").getDate()}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{MONTHS[new Date(ev.date+"T00:00:00").getMonth()].slice(0,3)}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">{ev.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ev.time}{ev.description?` · ${ev.description}`:""}</p>
            </div>
            <button onClick={()=>deleteEvent(ev.id)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground
                hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
              <Trash2 className="h-3.5 w-3.5"/>
            </button>
          </div>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="">
          <DialogHeader><DialogTitle>Nuevo Evento</DialogTitle></DialogHeader>
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
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={()=>setOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1">Crear Evento</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
