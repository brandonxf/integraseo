"use client"

import { useEffect, useState, useCallback } from "react"
import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Download } from "lucide-react"
import type { Supernumerario } from "@/lib/types"

interface SupEntry extends Supernumerario {
  contractName: string
  contractDocId: string
  index: number
}

export function SupernumerariosPanel() {
  const { contracts, getAllSupernumerarios, addSupernumerario, updateSupernumerario, deleteSupernumerario } = useStore()
  const [entries, setEntries] = useState<SupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [editing, setEditing] = useState<SupEntry | null>(null)
  const [deleting, setDeleting] = useState<SupEntry | null>(null)

  const today = new Date().toISOString().split("T")[0]

  const [form, setForm] = useState({ fecha: today, nombre: "", trabajo: "", contratoId: "" })

  const loadData = useCallback(async () => {
    setLoading(true)
    const all = await getAllSupernumerarios()
    setEntries(all)
    setLoading(false)
  }, [getAllSupernumerarios])

  useEffect(() => {
    if (contracts.length > 0) loadData()
    else { setLoading(false) }
  }, [contracts, loadData])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contratoId) return
    await addSupernumerario(form.contratoId, {
      fecha: form.fecha,
      nombre: form.nombre,
      trabajo: form.trabajo,
      contratoId: form.contratoId,
    })
    setAddOpen(false)
    setForm({ fecha: today, nombre: "", trabajo: "", contratoId: "" })
    await loadData()
  }

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editing) return
    await updateSupernumerario(editing.contractDocId, editing.index, {
      fecha: form.fecha,
      nombre: form.nombre,
      trabajo: form.trabajo,
    })
    setEditOpen(false)
    setEditing(null)
    await loadData()
  }

  const openEdit = (entry: SupEntry) => {
    setEditing(entry)
    setForm({ fecha: entry.fecha, nombre: entry.nombre, trabajo: entry.trabajo, contratoId: entry.contratoId })
    setEditOpen(true)
  }

  const openDelete = (entry: SupEntry) => {
    setDeleting(entry)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleting) return
    await deleteSupernumerario(deleting.contractDocId, deleting.index)
    setDeleteConfirmOpen(false)
    setDeleting(null)
    await loadData()
  }

  const exportToExcel = async () => {
    if (typeof window === "undefined") return
    const script = document.createElement("script")
    script.src = "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"
    script.onload = () => {
      // @ts-expect-error XLSX is loaded globally
      const XLSX = window.XLSX
      const data = entries.map((e) => ({
        Fecha: e.fecha,
        "Nombre del Operario": e.nombre,
        "Trabajo Realizado": e.trabajo,
        Contrato: e.contractName,
      }))
      const ws = XLSX.utils.json_to_sheet(data)
      ws["!cols"] = [{ wch: 15 }, { wch: 25 }, { wch: 40 }, { wch: 20 }]
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Supernumerarios")
      XLSX.writeFile(wb, `Supernumerarios_${new Date().toLocaleDateString("es-ES").replace(/\//g, "-")}.xlsx`)
    }
    document.head.appendChild(script)
  }

  const filtered = entries.filter((e) => {
    const q = search.toLowerCase()
    return !q || e.nombre.toLowerCase().includes(q) || e.contractName.toLowerCase().includes(q) || e.trabajo.toLowerCase().includes(q)
  })

  const FormFields = ({ onSubmit, submitLabel }: { onSubmit: (e: React.FormEvent) => void; submitLabel: string }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Fecha</Label>
        <Input type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} required />
      </div>
      <div className="space-y-2">
        <Label>Nombre del Supernumerario</Label>
        <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" required />
      </div>
      <div className="space-y-2">
        <Label>Trabajo Realizado</Label>
        <Textarea value={form.trabajo} onChange={(e) => setForm({ ...form, trabajo: e.target.value })} placeholder="Descripción del trabajo" required />
      </div>
      {!editing && (
        <div className="space-y-2">
          <Label>Contrato</Label>
          <Select value={form.contratoId} onValueChange={(v) => setForm({ ...form, contratoId: v })}>
            <SelectTrigger><SelectValue placeholder="Seleccionar contrato" /></SelectTrigger>
            <SelectContent>
              {contracts.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => { setAddOpen(false); setEditOpen(false) }}>Cancelar</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Supernumerarios</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel} disabled={entries.length === 0}>
              <Download className="h-4 w-4 mr-1" /> Excel
            </Button>
            <Button size="sm" onClick={() => { setForm({ fecha: today, nombre: "", trabajo: "", contratoId: "" }); setAddOpen(true) }}>
              <Plus className="h-4 w-4 mr-1" /> Nuevo
            </Button>
          </div>
        </div>
        <input
          type="search"
          placeholder="Buscar supernumerario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">Cargando...</div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <p className="font-medium">{search ? "No hay coincidencias" : "No hay supernumerarios"}</p>
            <p className="text-sm">{search ? "Prueba otra búsqueda" : "Añade el primer supernumerario"}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((entry, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-semibold">{entry.nombre}</p>
                    <p className="text-sm text-muted-foreground">{entry.fecha}</p>
                    <p className="text-sm text-muted-foreground">Contrato: {entry.contractName}</p>
                    <p className="text-sm mt-1">{entry.trabajo}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(entry)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(entry)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Nuevo Supernumerario</DialogTitle></DialogHeader>
          <FormFields onSubmit={handleAdd} submitLabel="Guardar" />
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Editar Supernumerario</DialogTitle></DialogHeader>
          <FormFields onSubmit={handleEdit} submitLabel="Guardar Cambios" />
        </DialogContent>
      </Dialog>

      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>¿Eliminar Supernumerario?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer.</p>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete}>Eliminar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
