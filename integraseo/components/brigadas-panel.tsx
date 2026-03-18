"use client"

import { useEffect, useState, useCallback } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Search, RotateCcw, Leaf, Sparkles } from "lucide-react"
import { useToast } from "@/lib/toast"
import type { BrigadaServices } from "@/lib/types"

interface BrigadaState { [id: string]: BrigadaServices }

export function BrigadasPanel({ search = "" }: { search?: string }) {
  const { contracts, getBrigadaServices, updateBrigadaServices } = useStore()
  const [brigadas, setBrigadas]         = useState<BrigadaState>({})
  const [loading, setLoading]           = useState(true)
  const [resetOpen, setResetOpen]       = useState(false)
  const [resetting, setResetting]       = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const r: BrigadaState = {}
    for (const c of contracts) r[c.id] = await getBrigadaServices(c.id)
    setBrigadas(r); setLoading(false)
  }, [contracts, getBrigadaServices])

  useEffect(() => { if(contracts.length>0) load(); else setLoading(false) }, [contracts, load])

  const toggle = async (id:string, svc:"jardineria"|"aseo", val:boolean) => {
    const cur = brigadas[id]||{jardineria:false,aseo:false}
    const upd = {...cur,[svc]:val}
    setBrigadas(p=>({...p,[id]:upd}))
    try {
      await updateBrigadaServices(id,upd)
      toast.success(val ? `${svc === "jardineria" ? "Jardinería" : "Aseo"} marcado` : `${svc === "jardineria" ? "Jardinería" : "Aseo"} desmarcado`)
    } catch { toast.error("Error al actualizar brigada") }
  }

  const handleReset = async () => {
    setResetting(true)
    for (const c of contracts) await updateBrigadaServices(c.id,{jardineria:false,aseo:false})
    const r:BrigadaState={}
    for (const c of contracts) r[c.id]={jardineria:false,aseo:false}
    setBrigadas(r); setResetting(false); setResetOpen(false)
    toast.success("Verificaciones limpiadas")
  }

  const filtered = contracts.filter(c=>{
    const q=search.toLowerCase(); return !q||c.name.toLowerCase().includes(q)||c.client.toLowerCase().includes(q)
  })

  const checkedCount = Object.values(brigadas).filter(b=>b.jardineria||b.aseo).length

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="shrink-0 px-4 pt-4 pb-3 space-y-3">
        <div className="flex justify-end">
          <button onClick={()=>setResetOpen(true)} title="Limpiar verificaciones"
            className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center
              hover:bg-muted text-muted-foreground hover:text-foreground transition-colors ml-auto">
            <RotateCcw className="h-4 w-4"/>
          </button>
        </div>
        {!loading&&(
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all duration-500"
                style={{width:`${contracts.length?checkedCount/contracts.length*100:0}%`}}/>
            </div>
            <p className="text-xs text-muted-foreground shrink-0">{checkedCount}/{contracts.length}</p>
          </div>
        )}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Cargando brigadas...</div>
        ) : filtered.length===0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
              <span className="text-2xl">🌿</span>
            </div>
            <p className="text-sm font-medium">{search?"Sin coincidencias":"Sin contratos"}</p>
          </div>
        ) : filtered.map(c=>{
          const s = brigadas[c.id]||{jardineria:false,aseo:false}
          const anyChecked = s.jardineria||s.aseo
          return (
            <div key={c.id} className={`p-4 rounded-2xl border transition-all
              ${anyChecked?"bg-primary/5 border-primary/30":"bg-card border-border"}`}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold leading-tight">{c.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.client}</p>
                </div>
                {anyChecked&&(
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                    {[s.jardineria&&"Jard.",s.aseo&&"Aseo"].filter(Boolean).join(" · ")}
                  </span>
                )}
              </div>
              <div className="flex gap-3">
                {[
                  { key:"jardineria" as const, label:"Jardinería", Icon:Leaf,     color:"text-emerald-600 dark:text-emerald-400" },
                  { key:"aseo"       as const, label:"Aseo",       Icon:Sparkles, color:"text-sky-600 dark:text-sky-400" },
                ].map(({key,label,Icon,color})=>(
                  <button key={key} onClick={()=>toggle(c.id,key,!s[key])}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl border text-sm font-semibold transition-all
                      ${s[key]
                        ?"bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                        :"bg-background border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                    <Icon className={`h-4 w-4 ${s[key]?"text-primary-foreground":color}`}/>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="">
          <DialogHeader><DialogTitle>Limpiar Verificaciones</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">¿Limpiar todas las verificaciones de jardinería y aseo? Esta acción no se puede deshacer.</p>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1" onClick={()=>setResetOpen(false)}>Cancelar</Button>
            <Button variant="destructive" className="flex-1" onClick={handleReset} disabled={resetting}>
              {resetting?"Limpiando...":"Confirmar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
