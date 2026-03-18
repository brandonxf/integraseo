"use client"

import { useRef, useState, useEffect } from "react"
import { useStore } from "@/lib/store"
import { useToast } from "@/lib/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/confirm-dialog"
import { PenLine, RotateCcw, Check, Trash2, User, Calendar } from "lucide-react"

interface SignaturePanelProps {
  contractId: string
}

export function SignaturePanel({ contractId }: SignaturePanelProps) {
  const contracts      = useStore((s) => s.contracts)
  const updateContract = useStore((s) => s.updateContract)
  const toast          = useToast()

  const contract = contracts.find((c) => c.id === contractId)

  const [open, setOpen]           = useState(false)
  const [signerName, setSignerName] = useState("")
  const [isEmpty, setIsEmpty]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing   = useRef(false)
  const lastPos   = useRef<{ x: number; y: number } | null>(null)

  // Setup canvas when dialog opens
  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = "#07105e"
    ctx.lineWidth = 2.5
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    setIsEmpty(true)
  }, [open])

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ("touches" in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  const startDraw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    const canvas = canvasRef.current
    if (!canvas) return
    drawing.current = true
    lastPos.current = getPos(e, canvas)
    setIsEmpty(false)
  }

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const pos = getPos(e, canvas)
    if (lastPos.current) {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }
    lastPos.current = pos
  }

  const endDraw = () => { drawing.current = false; lastPos.current = null }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setIsEmpty(true)
  }

  const handleSave = async () => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    setSaving(true)
    try {
      const signature = canvas.toDataURL("image/png")
      await updateContract(contractId, {
        signature,
        signedAt: new Date().toISOString(),
        signedBy: signerName.trim() || "Firma del cliente",
      })
      toast.success("Firma guardada correctamente")
      setOpen(false)
      setSignerName("")
    } catch {
      toast.error("Error al guardar la firma")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      // Use Firestore deleteField directly — updateContract passes undefined which Firestore rejects
      const { doc, updateDoc, deleteField } = await import("firebase/firestore")
      const { db } = await import("@/lib/firebase")
      await updateDoc(doc(db, "contracts", contractId), {
        signature: deleteField(),
        signedAt:  deleteField(),
        signedBy:  deleteField(),
      })
      // Update local store state
      useStore.getState().loadAll()
      toast.success("Firma eliminada")
    } catch (e) {
      console.error("Error eliminando firma:", e)
      toast.error("Error al eliminar la firma")
    }
  }

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="space-y-4 animate-fade-up">
      {contract?.signature ? (
        /* ── Firma existente ── */
        <div className="space-y-3">
          <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
            {/* Info */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Contrato firmado</p>
                <p className="text-xs text-muted-foreground">La firma ha sido registrada</p>
              </div>
            </div>

            {/* Signature image */}
            <div className="rounded-xl border border-border bg-white p-3">
              <img
                src={contract.signature}
                alt="Firma del contrato"
                className="w-full max-h-32 object-contain"
              />
            </div>

            {/* Meta */}
            <div className="space-y-1.5">
              {contract.signedBy && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>{contract.signedBy}</span>
                </div>
              )}
              {contract.signedAt && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{fmtDate(contract.signedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => { setSignerName(contract.signedBy || ""); setOpen(true) }}
            className="w-full py-2.5 rounded-xl border-2 border-dashed border-border text-sm font-semibold
              text-muted-foreground flex items-center justify-center gap-2
              hover:border-primary hover:text-primary transition-colors"
          >
            <PenLine className="h-4 w-4" /> Volver a firmar
          </button>

          <button
            onClick={() => setDeleteOpen(true)}
            className="w-full py-2.5 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold
              flex items-center justify-center gap-2 hover:bg-destructive/5 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Eliminar firma
          </button>
        </div>
      ) : (
        /* ── Sin firma ── */
        <div className="flex flex-col items-center py-12 text-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-primary/8 border-2 border-dashed border-primary/30 flex items-center justify-center">
            <PenLine className="h-9 w-9 text-primary/50" />
          </div>
          <div>
            <p className="font-semibold text-foreground">Sin firma</p>
            <p className="text-sm text-muted-foreground mt-1 max-w-[200px] leading-relaxed">
              El cliente aún no ha firmado este contrato
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="h-10 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-semibold
              flex items-center gap-2 shadow-sm shadow-primary/30 hover:brightness-110 active:scale-95 transition-all"
          >
            <PenLine className="h-4 w-4" /> Capturar Firma
          </button>
        </div>
      )}

      {/* ── Signature Dialog ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Firma del Cliente</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Signer name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Nombre del firmante (opcional)
              </Label>
              <Input
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="Nombre completo del cliente"
                className="h-10"
              />
            </div>

            {/* Canvas */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Firma
                </Label>
                <button
                  onClick={clearCanvas}
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-3 w-3" /> Limpiar
                </button>
              </div>
              <div className="rounded-xl border-2 border-dashed border-border bg-white overflow-hidden">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={220}
                  className="w-full touch-none cursor-crosshair block"
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={endDraw}
                  onMouseLeave={endDraw}
                  onTouchStart={startDraw}
                  onTouchMove={draw}
                  onTouchEnd={endDraw}
                />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Firma dentro del recuadro con el dedo o el mouse
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setOpen(false)}>
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleSave}
                disabled={isEmpty || saving}
              >
                {saving ? "Guardando..." : "Guardar Firma"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Eliminar Firma"
        description="¿Estás seguro de eliminar la firma de este contrato? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
