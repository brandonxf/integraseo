"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react"
import type { Visit } from "@/lib/types"

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"]
const DAYS   = ["Do","Lu","Ma","Mi","Ju","Vi","Sa"]

function fmtDate(d:string) {
  return new Date(d+"T00:00:00").toLocaleDateString("es-ES",{day:"2-digit",month:"short",year:"numeric"})
}

export function VisitsPanel({ contractId }: { contractId:string }) {
  const { contracts, addVisit, deleteVisit } = useStore()
  const contract  = contracts.find(c=>c.id===contractId)
  const visits:Visit[] = contract?.visits||[]

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth())
  const [year, setYear]   = useState(now.getFullYear())
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")

  const prev = () => { if(month===0){setMonth(11);setYear(y=>y-1)} else setMonth(m=>m-1) }
  const next = () => { if(month===11){setMonth(0);setYear(y=>y+1)} else setMonth(m=>m+1) }

  const fDay  = new Date(year,month,1).getDay()
  const days  = new Date(year,month+1,0).getDate()
  const trail = (fDay+days)%7===0?0:7-(fDay+days)%7

  const ds = (d:number) => `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`
  const hasVisit = (d:number) => visits.some(v=>v.date===ds(d))
  const isToday  = (d:number) => ds(d)===now.toISOString().split("T")[0]

  const confirmVisit = async () => {
    const t = new Date(); const time = t.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})
    await addVisit(contractId,{
      date:selectedDate, time, createdAt:t.toISOString(), confirmedAt:t.toISOString(),
      status:"confirmed", contractId, contractName:contract?.name||""
    })
    setConfirmOpen(false)
  }

  const confirmed = [...visits].filter(v=>v.status==="confirmed")
    .sort((a,b)=>new Date(b.confirmedAt).getTime()-new Date(a.confirmedAt).getTime())

  const selectedFmt = selectedDate
    ? new Date(selectedDate+"T00:00:00").toLocaleDateString("es-ES",{weekday:"long",day:"numeric",month:"long"})
    : ""

  return (
    <div className="space-y-4 animate-fade-up">
      {/* Calendar */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronLeft className="h-4 w-4"/>
          </button>
          <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
          <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors">
            <ChevronRight className="h-4 w-4"/>
          </button>
        </div>
        <div className="px-3 py-2">
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d=><div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({length:fDay},(_,i)=><div key={`p${i}`}/>)}
            {Array.from({length:days},(_,i)=>{
              const d=i+1; const visit=hasVisit(d); const today=isToday(d)
              return (
                <button key={d} onClick={()=>{setSelectedDate(ds(d));setConfirmOpen(true)}}
                  className={`aspect-square flex items-center justify-center text-[12px] font-medium rounded-lg transition-all
                    ${visit?"bg-primary text-primary-foreground shadow-sm":today?"ring-2 ring-primary text-primary":"hover:bg-muted"}`}>
                  {d}
                </button>
              )
            })}
            {Array.from({length:trail},(_,i)=><div key={`n${i}`}/>)}
          </div>
        </div>
        <div className="px-4 py-2 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground">Toca un día para confirmar visita · <span className="font-semibold text-primary">{visits.length} visita{visits.length!==1?"s":""}</span></p>
        </div>
      </div>

      {/* Confirmed list */}
      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historial de Visitas</p>
        {confirmed.length===0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
            <span className="text-3xl mb-2">📋</span>
            <p className="text-sm font-medium">Sin visitas confirmadas</p>
          </div>
        ) : (
          <div className="space-y-2">
            {confirmed.map(v=>(
              <div key={v.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border group">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-primary">{new Date(v.date+"T00:00:00").getDate()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{fmtDate(v.date)} · {v.time}</p>
                  <p className="text-xs text-muted-foreground">
                    Confirmada el {new Date(v.confirmedAt).toLocaleDateString("es-ES",{day:"2-digit",month:"short"})}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                  ✓ Confirmada
                </span>
                <button onClick={()=>deleteVisit(contractId,v.id)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground
                    hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
                  <Trash2 className="h-3.5 w-3.5"/>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="">
          <DialogHeader><DialogTitle>Confirmar Visita</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Confirmar visita para el <span className="font-semibold text-foreground capitalize">{selectedFmt}</span>?</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={()=>setConfirmOpen(false)}>No</Button>
            <Button className="flex-1" onClick={confirmVisit}>Confirmar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
