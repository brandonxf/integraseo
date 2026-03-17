"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Trash2, FileText, ChevronLeft, Plus, X } from "lucide-react"
import { NotesPanel } from "@/components/notes-panel"
import { VisitsPanel } from "@/components/visits-panel"
import type { ValueItem } from "@/lib/types"

function getStatusColor(status: string) {
  switch (status) {
    case "active": return "bg-green-500"
    case "completed": return "bg-blue-500"
    case "pending": return "bg-yellow-500"
    default: return "bg-gray-500"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active": return "Activo"
    case "completed": return "Completado"
    case "pending": return "Pendiente"
    default: return status
  }
}

export function ContractsList() {
  const contracts = useStore((state) => state.contracts)
  const addContract = useStore((state) => state.addContract)
  const updateContract = useStore((state) => state.updateContract)
  const deleteContract = useStore((state) => state.deleteContract)
  const addWorker = useStore((state) => state.addWorker)
  const deleteWorker = useStore((state) => state.deleteWorker)

  const [search, setSearch] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("info")
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [valueItems, setValueItems] = useState<ValueItem[]>([])
  const [valueInput, setValueInput] = useState("")
  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [workerForm, setWorkerForm] = useState({ name: "", position: "", phone: "" })

  const [form, setForm] = useState({
    name: "", client: "", location: "", status: "active" as "active" | "completed" | "pending",
  })

  const today = new Date().toISOString().split("T")[0]

  const selected = contracts.find((c) => c.id === selectedId)

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: "", client: "", location: "", status: "active" })
    setValueItems([])
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const c = contracts.find((c) => c.id === id)
    if (!c) return
    setEditingId(id)
    setForm({ name: c.name, client: c.client, location: c.location || "", status: c.status })
    setValueItems(c.valueItems || [])
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (editingId) {
      await updateContract(editingId, { ...form, valueItems })
    } else {
      await addContract({ ...form, valueItems, notes: [], workers: [], visits: [], createdAt: new Date().toISOString() })
    }
    setModalOpen(false)
  }

  const addValueItem = () => {
    const match = valueInput.trim().match(/^(\d+)\s+(.+)$/)
    if (match) {
      setValueItems([...valueItems, { quantity: parseInt(match[1]), type: match[2] }])
      setValueInput("")
    } else {
      alert('Formato: "1 jardinero"')
    }
  }

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    await addWorker(selectedId, workerForm)
    setWorkerModalOpen(false)
    setWorkerForm({ name: "", position: "", phone: "" })
  }

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.client.toLowerCase().includes(q)
  })

  // Detail view
  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => { setSelectedId(null); setActiveTab("info") }}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h2 className="font-semibold">{selected.name}</h2>
            <p className="text-sm text-muted-foreground">{selected.client}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => openEdit(selected.id)}>
            <Edit className="h-4 w-4" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {["info", "notes", "workers", "visits"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap transition-colors ${
                activeTab === tab ? "border-b-2 border-primary text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "info" ? "Información" : tab === "notes" ? "Notas" : tab === "workers" ? "Operarios" : "Visitas"}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === "info" && (
            <div className="space-y-3">
              <div className="flex justify-between"><span className="text-sm font-medium text-muted-foreground">Cliente</span><span className="text-sm">{selected.client}</span></div>
              <div className="flex justify-between"><span className="text-sm font-medium text-muted-foreground">Ubicación</span><span className="text-sm">{selected.location || "No especificada"}</span></div>
              <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-muted-foreground">Valor Agregado</span>
                <div className="text-right text-sm">
                  {selected.valueItems?.length ? selected.valueItems.map((v, i) => (
                    <p key={i}>{v.quantity} {v.type}</p>
                  )) : <span>No especificado</span>}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Estado</span>
                <Badge className={getStatusColor(selected.status)}>{getStatusLabel(selected.status)}</Badge>
              </div>
              <div className="pt-4 border-t border-border">
                <Button variant="destructive" size="sm" className="w-full" onClick={() => {
                  if (confirm("¿Eliminar este contrato? Esta acción no se puede deshacer.")) {
                    deleteContract(selected.id)
                    setSelectedId(null)
                  }
                }}>
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar Contrato
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notes" && <NotesPanel contractId={selected.id} />}

          {activeTab === "workers" && (
            <div className="space-y-3">
              <Button size="sm" className="w-full" onClick={() => setWorkerModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Añadir Operario
              </Button>
              {selected.workers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay operarios</p>
                  <p className="text-sm">Añade operarios a este contrato</p>
                </div>
              ) : (
                selected.workers.map((w) => (
                  <Card key={w.id} className="p-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{w.name}</p>
                        <p className="text-sm text-muted-foreground">{w.position}</p>
                        {w.phone && <p className="text-sm text-muted-foreground">{w.phone}</p>}
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => deleteWorker(selected.id, w.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {activeTab === "visits" && <VisitsPanel contractId={selected.id} />}
        </div>

        {/* Worker add modal */}
        <Dialog open={workerModalOpen} onOpenChange={setWorkerModalOpen}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Nuevo Operario</DialogTitle></DialogHeader>
            <form onSubmit={handleAddWorker} className="space-y-4">
              <div className="space-y-2"><Label>Nombre</Label><Input value={workerForm.name} onChange={(e) => setWorkerForm({ ...workerForm, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input value={workerForm.position} onChange={(e) => setWorkerForm({ ...workerForm, position: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Teléfono</Label><Input type="tel" value={workerForm.phone} onChange={(e) => setWorkerForm({ ...workerForm, phone: e.target.value })} /></div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setWorkerModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit contract modal */}
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingId ? "Editar Contrato" : "Nuevo Contrato"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Nombre del Contrato</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Cliente</Label><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required /></div>
              <div className="space-y-2"><Label>Ubicación</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Valor Agregado</Label>
                <div className="space-y-1">
                  {valueItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="flex-1">{item.quantity} {item.type}</span>
                      <button type="button" onClick={() => setValueItems(valueItems.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="ej: 1 jardinero" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValueItem() } }} />
                  <Button type="button" variant="outline" onClick={addValueItem}>+</Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "completed" | "pending" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Activo</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                    <SelectItem value="completed">Completado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
                <Button type="submit">Guardar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // List view
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Contratos</h2>
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
        </div>
        <input
          type="search"
          placeholder="Buscar contrato..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
            <FileText className="h-16 w-16 mb-4 opacity-40" />
            <p className="font-medium">{search ? "No hay coincidencias" : "No hay contratos"}</p>
            <p className="text-sm">{search ? "Prueba otra búsqueda" : "Añade tu primer contrato"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((contract) => {
              const initials = contract.name.substring(0, 2).toUpperCase()
              const lastNote = contract.notes?.length ? contract.notes[contract.notes.length - 1].content : contract.client
              return (
                <div
                  key={contract.id}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-accent/50 transition-colors"
                  onClick={() => setSelectedId(contract.id)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium truncate">{contract.name}</span>
                      <Badge className={`${getStatusColor(contract.status)} text-xs ml-2`}>{getStatusLabel(contract.status)}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{lastNote}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add contract FAB modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Contrato</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2"><Label>Nombre del Contrato</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Cliente</Label><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required /></div>
            <div className="space-y-2"><Label>Ubicación</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
            <div className="space-y-2">
              <Label>Valor Agregado</Label>
              <div className="space-y-1">
                {valueItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <span className="flex-1">{item.quantity} {item.type}</span>
                    <button type="button" onClick={() => setValueItems(valueItems.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input value={valueInput} onChange={(e) => setValueInput(e.target.value)} placeholder="ej: 1 jardinero" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValueItem() } }} />
                <Button type="button" variant="outline" onClick={addValueItem}>+</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as "active" | "completed" | "pending" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button type="submit">Guardar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
