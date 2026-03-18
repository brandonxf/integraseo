"use client"

import { useState } from "react"
import { useStore } from "@/lib/store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { NotesPanel } from "@/components/notes-panel"
import { VisitsPanel } from "@/components/visits-panel"
import {
  Edit, Trash2, FileText, ChevronLeft, Plus, X,
  AlertCircle, MapPin, Briefcase, CheckCircle2, Clock, XCircle, FileDown,
  LayoutList, LayoutGrid
} from "lucide-react"
import { EmptyState } from "@/components/empty-state"
import type { ValueItem } from "@/lib/types"
import { generateContractPDF } from "@/lib/generate-pdf"
import { useToast } from "@/lib/toast"
import { HistoryPanel } from "@/components/history-panel"

const CONTRACT_COLORS = [
  { label: "Violeta",  value: "bg-violet-500",  hex: "#8b5cf6" },
  { label: "Cielo",    value: "bg-sky-500",      hex: "#0ea5e9" },
  { label: "Verde",    value: "bg-emerald-500",  hex: "#10b981" },
  { label: "Naranja",  value: "bg-orange-500",   hex: "#f97316" },
  { label: "Rosa",     value: "bg-pink-500",     hex: "#ec4899" },
  { label: "Índigo",   value: "bg-indigo-500",   hex: "#6366f1" },
  { label: "Rojo",     value: "bg-red-500",      hex: "#ef4444" },
  { label: "Ámbar",    value: "bg-amber-500",    hex: "#f59e0b" },
  { label: "Teal",     value: "bg-teal-500",     hex: "#14b8a6" },
  { label: "Lima",     value: "bg-lime-500",     hex: "#84cc16" },
]

// ── Status pill ────────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; Icon: React.FC<{ className?: string }> }> = {
    active:    { label: "Activo",     cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", Icon: CheckCircle2 },
    pending:   { label: "Pendiente",  cls: "bg-amber-100  text-amber-700  dark:bg-amber-900/40  dark:text-amber-400",  Icon: Clock },
    completed: { label: "Completado", cls: "bg-sky-100    text-sky-700    dark:bg-sky-900/40    dark:text-sky-400",    Icon: XCircle },
  }
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground", Icon: Clock }
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${s.cls}`}>
      <s.Icon className="h-3 w-3" />{s.label}
    </span>
  )
}

// ── Contract form — OUTSIDE parent to prevent remount on keystroke ─────────────
interface ContractFormProps {
  form: { name: string; client: string; location: string; status: "active" | "completed" | "pending" }
  onChange: (field: string, value: string) => void
  valueItems: ValueItem[]
  valueInput: string
  valueError: boolean
  onValueInputChange: (v: string) => void
  onAddValueItem: () => void
  onRemoveValueItem: (i: number) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEditing: boolean
}

function ContractForm({
  form, onChange, valueItems, valueInput, valueError,
  onValueInputChange, onAddValueItem, onRemoveValueItem,
  onSubmit, onCancel, isEditing,
}: ContractFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-1">
      {([
        { id: "name",     label: "Nombre del Contrato", required: true  },
        { id: "client",   label: "Cliente",             required: true  },
        { id: "location", label: "Ubicación",           required: false },
      ] as const).map(({ id, label, required }) => (
        <div key={id} className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
          <Input
            value={form[id]}
            onChange={(e) => onChange(id, e.target.value)}
            required={required}
            className="h-10"
          />
        </div>
      ))}

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Valor Agregado</Label>
        <div className="space-y-1.5">
          {valueItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-sm bg-accent/60 px-3 py-1.5 rounded-lg">
              <span className="flex-1 font-medium">{item.quantity} {item.type}</span>
              <button type="button" onClick={() => onRemoveValueItem(i)}>
                <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive transition-colors" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              value={valueInput}
              onChange={(e) => onValueInputChange(e.target.value)}
              placeholder="ej: 1 jardinero"
              className={`h-10 ${valueError ? "border-destructive" : ""}`}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAddValueItem() } }}
            />
            {valueError && (
              <p className="flex items-center gap-1 text-xs text-destructive mt-1">
                <AlertCircle className="h-3 w-3" /> Formato: "1 jardinero"
              </p>
            )}
          </div>
          <Button type="button" variant="outline" onClick={onAddValueItem} className="h-10 px-3">+</Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Estado</Label>
        <Select value={form.status} onValueChange={(v) => onChange("status", v)}>
          <SelectTrigger className="h-10 w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="pending">Pendiente</SelectItem>
            <SelectItem value="completed">Completado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1">{isEditing ? "Actualizar" : "Guardar"}</Button>
      </div>
    </form>
  )
}

// ── Worker form — also outside ─────────────────────────────────────────────────
interface WorkerFormProps {
  form: { name: string; position: string; phone: string }
  onChange: (field: string, value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

function WorkerForm({ form, onChange, onSubmit, onCancel }: WorkerFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 mt-1">
      {([
        { id: "name",     label: "Nombre", type: "text", required: true  },
        { id: "position", label: "Cargo",  type: "text", required: true  },
        { id: "phone",    label: "Teléfono", type: "tel", required: false },
      ] as const).map(({ id, label, type, required }) => (
        <div key={id} className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
          <Input
            type={type}
            value={form[id]}
            onChange={(e) => onChange(id, e.target.value)}
            required={required}
            className="h-10"
          />
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>Cancelar</Button>
        <Button type="submit" className="flex-1">Guardar</Button>
      </div>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
export function ContractsList({ search = "" }: { search?: string }) {
  const contracts      = useStore((s) => s.contracts)
  const addContract    = useStore((s) => s.addContract)
  const updateContract = useStore((s) => s.updateContract)
  const deleteContract = useStore((s) => s.deleteContract)
  const addWorker      = useStore((s) => s.addWorker)
  const deleteWorker   = useStore((s) => s.deleteWorker)

  const toast = useToast()

  const [selectedId, setSelectedId]   = useState<string | null>(null)
  const [activeTab, setActiveTab]     = useState("info")
  const [modalOpen, setModalOpen]     = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [valueItems, setValueItems]   = useState<ValueItem[]>([])
  const [valueInput, setValueInput]   = useState("")
  const [valueError, setValueError]   = useState(false)
  const [workerModalOpen, setWorkerModalOpen] = useState(false)
  const [deleteContractOpen, setDeleteContractOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const [compact, setCompact]         = useState(false)
  const [colorPickerFor, setColorPickerFor] = useState<string | null>(null)
  const [deleteWorkerOpen, setDeleteWorkerOpen]     = useState(false)
  const [workerToDelete, setWorkerToDelete]         = useState<string | null>(null)

  const [form, setForm] = useState({
    name: "", client: "", location: "", status: "active" as "active" | "completed" | "pending",
  })
  const [workerForm, setWorkerForm] = useState({ name: "", position: "", phone: "" })

  const selected = contracts.find((c) => c.id === selectedId)

  const handleFormChange = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }))

  const handleWorkerChange = (field: string, value: string) =>
    setWorkerForm((prev) => ({ ...prev, [field]: value }))

  const openAdd = () => {
    setEditingId(null)
    setForm({ name: "", client: "", location: "", status: "active" })
    setValueItems([]); setValueInput(""); setValueError(false)
    setModalOpen(true)
  }

  const openEdit = (id: string) => {
    const c = contracts.find((c) => c.id === id); if (!c) return
    setEditingId(id)
    setForm({ name: c.name, client: c.client, location: c.location || "", status: c.status })
    setValueItems(c.valueItems || []); setValueInput(""); setValueError(false)
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        await updateContract(editingId, { ...form, valueItems })
        toast.success("Contrato actualizado correctamente")
      } else {
        await addContract({ ...form, valueItems, notes: [], workers: [], visits: [], createdAt: new Date().toISOString() })
        toast.success("Contrato creado correctamente")
      }
      setModalOpen(false)
    } catch {
      toast.error("Error al guardar el contrato")
    }
  }

  const addValueItem = () => {
    const match = valueInput.trim().match(/^(\d+)\s+(.+)$/)
    if (match) {
      setValueItems((prev) => [...prev, { quantity: parseInt(match[1]), type: match[2] }])
      setValueInput(""); setValueError(false)
    } else {
      setValueError(true)
    }
  }

  const handleAddWorker = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedId) return
    try {
      await addWorker(selectedId, workerForm)
      toast.success(`Operario "${workerForm.name}" añadido`)
      setWorkerModalOpen(false); setWorkerForm({ name: "", position: "", phone: "" })
    } catch {
      toast.error("Error al añadir el operario")
    }
  }

  const handleDeleteContract = async () => {
    if (!selectedId) return
    try {
      await deleteContract(selectedId)
      toast.success("Contrato eliminado")
      setSelectedId(null)
    } catch {
      toast.error("Error al eliminar el contrato")
    }
  }

  const handleDeleteWorker = async () => {
    if (!selectedId || !workerToDelete) return
    try {
      await deleteWorker(selectedId, workerToDelete)
      toast.success("Operario eliminado")
      setWorkerToDelete(null)
    } catch {
      toast.error("Error al eliminar el operario")
    }
  }

  const handleExportPDF = async () => {
    if (!selected) return
    setPdfLoading(true)
    try {
      await generateContractPDF(selected)
      toast.success("PDF descargado correctamente")
    } catch (e) {
      console.error("PDF error:", e)
      toast.error("Error al generar el PDF")
    } finally {
      setPdfLoading(false)
    }
  }

  const filtered = contracts.filter((c) => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || c.client.toLowerCase().includes(q)
  })

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (selected) {
    return (
      <div className="flex flex-col h-full">
        <div className="shrink-0 px-4 pt-4 pb-0">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => { setSelectedId(null); setActiveTab("info") }}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-base leading-tight truncate">{selected.name}</h2>
              <p className="text-xs text-muted-foreground truncate">{selected.client}</p>
            </div>
            <StatusPill status={selected.status} />
            <button
              onClick={() => openEdit(selected.id)}
              className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex border-b border-border">
            {[
              { id: "info",    label: "Info"      },
              { id: "notes",   label: "Notas"     },
              { id: "workers", label: "Operarios" },
              { id: "visits",   label: "Visitas"   },
              { id: "history",  label: "Historial" },
            ].map((t) => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${
                  activeTab === t.id
                    ? "border-b-2 border-primary text-primary"
                    : "text-muted-foreground hover:text-foreground"
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {activeTab === "info" && (
            <div className="space-y-3 animate-fade-up">
              {[
                { icon: Briefcase, label: "Cliente",    value: selected.client },
                { icon: MapPin,    label: "Ubicación",  value: selected.location || "No especificada" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">{label}</p>
                    <p className="text-sm font-medium mt-0.5">{value}</p>
                  </div>
                </div>
              ))}

              {selected.valueItems?.length > 0 && (
                <div className="p-3 rounded-xl bg-card border border-border">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">Valor Agregado</p>
                  <div className="flex flex-wrap gap-2">
                    {selected.valueItems.map((v, i) => (
                      <span key={i} className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        {v.quantity} {v.type}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={handleExportPDF}
                disabled={pdfLoading}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
                  flex items-center justify-center gap-2 shadow-sm shadow-primary/30
                  hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {pdfLoading
                  ? <><div className="w-4 h-4 border-2 border-white/60 border-t-white rounded-full animate-spin" /> Generando PDF...</>
                  : <><FileDown className="h-4 w-4" /> Descargar Reporte PDF</>
                }
              </button>

              {/* Color picker */}
              <div className="p-3 rounded-xl bg-card border border-border">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2.5">Color del contrato</p>
                <div className="flex flex-wrap gap-2">
                  {CONTRACT_COLORS.map((c) => {
                    const isSelected = (selected.color || "bg-violet-500") === c.value
                    return (
                      <button key={c.value}
                        onClick={async () => {
                          await updateContract(selected.id, { color: c.value })
                          toast.success(`Color: ${c.label}`)
                        }}
                        className={`w-7 h-7 rounded-full ${c.value} transition-all ${
                          isSelected ? "ring-2 ring-offset-2 ring-primary scale-110" : "hover:scale-110 opacity-70 hover:opacity-100"
                        }`}
                        title={c.label}
                      />
                    )
                  })}
                </div>
              </div>

              <button
                onClick={() => setDeleteContractOpen(true)}
                className="w-full py-2.5 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold
                  flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors"
              >
                <Trash2 className="h-4 w-4" /> Eliminar Contrato
              </button>
            </div>
          )}

          {activeTab === "notes"   && <NotesPanel contractId={selected.id} />}

          {activeTab === "workers" && (
            <div className="space-y-3 animate-fade-up">
              <button
                onClick={() => setWorkerModalOpen(true)}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-semibold text-muted-foreground
                  flex items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors"
              >
                <Plus className="h-4 w-4" /> Añadir Operario
              </button>
              {!selected.workers?.length ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-center">
                  <p className="text-sm font-medium">Sin operarios</p>
                  <p className="text-xs">Añade operarios a este contrato</p>
                </div>
              ) : (
                selected.workers.map((w) => (
                  <div key={w.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {w.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{w.name}</p>
                      <p className="text-xs text-muted-foreground">{w.position}{w.phone ? ` · ${w.phone}` : ""}</p>
                    </div>
                    <button
                      onClick={() => { setWorkerToDelete(w.id); setDeleteWorkerOpen(true) }}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "visits"  && <VisitsPanel contractId={selected.id} />}
          {activeTab === "history" && <HistoryPanel contractId={selected.id} />}
        </div>

        <ConfirmDialog open={deleteContractOpen} onOpenChange={setDeleteContractOpen}
          title="Eliminar Contrato" confirmLabel="Eliminar" destructive onConfirm={handleDeleteContract}
          description={`¿Eliminar "${selected.name}"? Se perderán todas sus notas, operarios y visitas.`} />
        <ConfirmDialog open={deleteWorkerOpen} onOpenChange={setDeleteWorkerOpen}
          title="Eliminar Operario" confirmLabel="Eliminar" destructive onConfirm={handleDeleteWorker}
          description="¿Eliminar este operario del contrato?" />

        <Dialog open={workerModalOpen} onOpenChange={setWorkerModalOpen}>
          <DialogContent className="">
            <DialogHeader><DialogTitle>Nuevo Operario</DialogTitle></DialogHeader>
            <WorkerForm
              form={workerForm}
              onChange={handleWorkerChange}
              onSubmit={handleAddWorker}
              onCancel={() => setWorkerModalOpen(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogContent className="max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Editar Contrato</DialogTitle></DialogHeader>
            <ContractForm
              form={form} onChange={handleFormChange}
              valueItems={valueItems} valueInput={valueInput} valueError={valueError}
              onValueInputChange={(v) => { setValueInput(v); setValueError(false) }}
              onAddValueItem={addValueItem}
              onRemoveValueItem={(i) => setValueItems((prev) => prev.filter((_, j) => j !== i))}
              onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} isEditing={true}
            />
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // ── List view ────────────────────────────────────────────────────────────────
  const activeContracts    = filtered.filter(c => c.status === "active")
  const pendingContracts   = filtered.filter(c => c.status === "pending")
  const completedContracts = filtered.filter(c => c.status === "completed")

  const FALLBACK_COLORS = ["bg-violet-500","bg-sky-500","bg-emerald-500","bg-orange-500","bg-pink-500","bg-indigo-500"]

  const ContractCard = ({ contract, index }: { contract: typeof contracts[0]; index: number }) => {
    const initials  = contract.name.substring(0, 2).toUpperCase()
    const lastNote  = contract.notes?.length ? contract.notes[contract.notes.length - 1].content : contract.client
    const color     = contract.color || FALLBACK_COLORS[index % FALLBACK_COLORS.length]

    if (compact) {
      return (
        <button onClick={() => setSelectedId(contract.id)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-card border border-border
            hover:border-primary/30 hover:bg-accent/30 active:scale-[0.99] transition-all text-left">
          <div className={`w-7 h-7 rounded-lg ${color} flex items-center justify-center text-[10px] font-bold text-white shrink-0`}>
            {initials}
          </div>
          <span className="text-sm font-medium flex-1 truncate">{contract.name}</span>
          <StatusPill status={contract.status} />
        </button>
      )
    }

    return (
      <button key={contract.id} onClick={() => setSelectedId(contract.id)}
        className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-card border border-border
          hover:border-primary/30 hover:shadow-md hover:shadow-primary/5
          active:scale-[0.99] transition-all text-left group"
      >
        <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-sm`}>
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-sm font-semibold truncate block">{contract.name}</span>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{lastNote}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <StatusPill status={contract.status} />
          {contract.workers?.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {contract.workers.length} operario{contract.workers.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </button>
    )
  }

  const SectionHeader = ({ label, count, color }: { label: string; count: number; color: string }) => (
    <div className="flex items-center gap-2 px-1 pt-2 pb-1">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-xs font-bold text-muted-foreground">· {count}</span>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="shrink-0 px-4 pt-4 pb-3 flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {filtered.length} contrato{filtered.length !== 1 ? "s" : ""}
        </p>
        <div className="flex items-center gap-1.5">
          {/* Compact/Expanded toggle */}
          <button onClick={() => setCompact(c => !c)}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              compact ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
            title={compact ? "Vista expandida" : "Vista compacta"}
          >
            {compact ? <LayoutList className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
          </button>
          <button
            onClick={openAdd}
            className="h-8 px-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
              flex items-center gap-1.5 shadow-sm shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filtered.length === 0 ? (
          <EmptyState
            illustration="contracts"
            title={search ? "Sin coincidencias" : "Sin contratos"}
            description={search ? "Intenta con otra búsqueda o limpia el filtro" : "Crea tu primer contrato para empezar a gestionar tu operación"}
            action={!search ? (
              <button onClick={openAdd}
                className="h-9 px-4 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
                  flex items-center gap-1.5 shadow-sm shadow-primary/30 hover:brightness-110 transition-all">
                <Plus className="h-4 w-4" /> Crear contrato
              </button>
            ) : undefined}
          />
        ) : (
          <div className={compact ? "space-y-1" : "space-y-2.5"}>
            {/* Activos */}
            {activeContracts.length > 0 && (
              <>
                <SectionHeader label="Activos" count={activeContracts.length} color="bg-emerald-500" />
                {activeContracts.map((c, i) => <ContractCard key={c.id} contract={c} index={i} />)}
              </>
            )}
            {/* Pendientes */}
            {pendingContracts.length > 0 && (
              <>
                <SectionHeader label="Pendientes" count={pendingContracts.length} color="bg-amber-500" />
                {pendingContracts.map((c, i) => <ContractCard key={c.id} contract={c} index={i} />)}
              </>
            )}
            {/* Completados */}
            {completedContracts.length > 0 && (
              <>
                <SectionHeader label="Completados" count={completedContracts.length} color="bg-sky-500" />
                {completedContracts.map((c, i) => <ContractCard key={c.id} contract={c} index={i} />)}
              </>
            )}
          </div>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nuevo Contrato</DialogTitle></DialogHeader>
          <ContractForm
            form={form} onChange={handleFormChange}
            valueItems={valueItems} valueInput={valueInput} valueError={valueError}
            onValueInputChange={(v) => { setValueInput(v); setValueError(false) }}
            onAddValueItem={addValueItem}
            onRemoveValueItem={(i) => setValueItems((prev) => prev.filter((_, j) => j !== i))}
            onSubmit={handleSubmit} onCancel={() => setModalOpen(false)} isEditing={false}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
