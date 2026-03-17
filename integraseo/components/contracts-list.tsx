"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { Edit, Trash2, FileText, ChevronLeft, Plus, X, AlertCircle } from "lucide-react"
import { NotesPanel } from "@/components/notes-panel"
import { VisitsPanel } from "@/components/visits-panel"
import type { ValueItem } from "@/lib/types"

function getStatusColor(status: string) {
  switch (status) {
    case "active":    return "bg-green-500"
    case "completed": return "bg-blue-500"
    case "pending":   return "bg-yellow-500"
    default:          return "bg-gray-500"
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case "active":    return "Activo"
    case "completed": return "Completado"
    case "pending":   return "Pendiente"
    default:          return status
  }
}

export function ContractsList() {
  const contracts     = useStore((s) => s.contracts)
  const addContract   = useStore((s) => s.addContract)
  const updateContract = useStore((s) => s.updateContract)
  const deleteContract = useStore((s) => s.deleteContract)
  const addWorker     = useStore((s) => s.addWorker)
  const deleteWorker  = useStore((s) => s.deleteWorker)

  const [search, setSearch]               = useState("")
  const [selectedId, setSelectedId]       = useState<string | null>(null)
  const [activeTab, setActiveTab]         = useState("info")
  const [modalOpen, setModalOpen]         = useState(false)
  const [editingId, setEditingId]         = useState<string | null>(null)
  const [valueItems, setValueItems]       = useState<ValueItem[]>([])
  const [valueInput, setValueInput]       = useState("")
  const [valueError, setValueError]       = useState(false)
  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [workerForm, setWorkerForm]       = useState({ name: "", position: "", phone: "" })

  // Confirm dialogs
  const [deleteContractOpen, setDeleteContractOpen] = useState(false)
  const [deleteWorkerOpen, setDeleteWorkerOpen]     = useState(false)
  const [workerToDelete, setWorkerToDelete]         = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "", client: "", location: "",
    status: "active" as "active" | "completed" | "pending",
  })

  const selected = contracts.find((c) => c.id === selectedId)

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: "", client: "", location: "", status: "active" })
    setValueItems([])
    setValueInput("")
    setValueError(false)
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const c = contracts.find((c) => c.id === id)
    if (!c) return
    setEditingId(id)
    setForm({ name: c.name, client: c.client, location: c.location || "", status: c.status })
    setValueItems(c.valueItems || [])
    setValueInput("")
    setValueError(false)
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
      setValueError(false)
    } else {
      setValueError(true)
    }
  }

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedId) return
    await addWorker(selectedId, workerForm)
    setWorkerModalOpen(false)
    setWorkerForm({ name: "", position: "", phone: "" })
  }

  const handleDeleteContract = async () => {
    if (!selectedId) return
    await deleteContract(selectedId)
    setSelectedId(null)
  }

  const handleDeleteWorker = async () => {
    if (!selectedId || !workerToDelete) return
    await deleteWorker(selectedId, workerToDelete)
    setWorkerToDelete(null)
  }

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.client.toLowerCase().includes(q)
  })

  const FormBody = () => (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2"><Label>Nombre del Contrato</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
      <div className="space-y-2"><Label>Cliente</Label><Input value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} required /></div>
      <div className="space-y-2"><Label>Ubicación</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
      <div className="space-y-2">
        <Label>Valor Agregado</Label>
        <div className="space-y-1">
          {valueItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-muted/50 px-2 py-1 rounded-md">
              <span className="flex-1">{item.quantity} {item.type}</span>
              <button type="button" onClick={() => setValueItems(valueItems.filter((_, j) => j !== i))}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={valueInput}
              onChange={(e) => { setValueInput(e.target.value); setValueError(false) }}
              placeholder="ej: 1 jardinero"
              className={valueError ? "border-destructive focus-visible:ring-destructive/50" : ""}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addValueItem() } }}
            />
            {valueError && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="h-3 w-3" /> Formato correcto: "1 jardinero"
              </p>
            )}
          </div>
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
  )

  // ── Detail view ──────────────────────────────────────────────────────────
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
          {[
            { id: "info",    label: "Información" },
            { id: "notes",   label: "Notas"       },
            { id: "workers", label: "Operarios"   },
            { id: "visits",  label: "Visitas"     },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
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
                  {selected.valueItems?.length
                    ? selected.valueItems.map((v, i) => <p key={i}>{v.quantity} {v.type}</p>)
                    : <span>No especificado</span>}
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Estado</span>
                <Badge className={getStatusColor(selected.status)}>{getStatusLabel(selected.status)}</Badge>
              </div>
              <div className="pt-4 border-t border-border">
                <Button
                  variant="destructive" size="sm" className="w-full"
                  onClick={() => setDeleteContractOpen(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" /> Eliminar Contrato
                </Button>
              </div>
            </div>
          )}

          {activeTab === "notes"   && <NotesPanel contractId={selected.id} />}

          {activeTab === "workers" && (
            <div className="space-y-3">
              <Button size="sm" className="w-full" onClick={() => setWorkerModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Añadir Operario
              </Button>
              {!selected.workers?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="font-medium">No hay operarios</p>
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
                      <Button
                        variant="ghost" size="icon"
                        onClick={() => { setWorkerToDelete(w.id); setDeleteWorkerOpen(true) }}
                      >
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

        {/* Confirm: delete contract */}
        <ConfirmDialog
          open={deleteContractOpen}
          onOpenChange={setDeleteContractOpen}
          title="Eliminar Contrato"
          description={`¿Estás seguro de que deseas eliminar "${selected.name}"? Esta acción no se puede deshacer y se perderán todas sus notas, operarios y visitas.`}
          confirmLabel="Eliminar"
          destructive
          onConfirm={handleDeleteContract}
        />

        {/* Confirm: delete worker */}
        <ConfirmDialog
          open={deleteWorkerOpen}
          onOpenChange={setDeleteWorkerOpen}
          title="Eliminar Operario"
          description="¿Estás seguro de que deseas eliminar este operario del contrato?"
          confirmLabel="Eliminar"
          destructive
          onConfirm={handleDeleteWorker}
        />

        {/* Add worker modal */}
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
            <DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
            <FormBody />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ── List view ─────────────────────────────────────────────────────────────
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
              const initials  = contract.name.substring(0, 2).toUpperCase()
              const lastNote  = contract.notes?.length
                ? contract.notes[contract.notes.length - 1].content
                : contract.client
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

      {/* New contract modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Contrato</DialogTitle></DialogHeader>
          <FormBody />
        </DialogContent>
      </Dialog>
    </div>
  )
}
