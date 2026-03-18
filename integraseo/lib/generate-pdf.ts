import type { Contract } from "./types"

function fmtDate(dateStr: string) {
  if (!dateStr) return "No especificada"
  return new Date(dateStr + "T00:00:00").toLocaleDateString("es-ES", {
    day: "2-digit", month: "long", year: "numeric"
  })
}

function fmtDateTime(isoStr: string) {
  if (!isoStr) return ""
  return new Date(isoStr).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit"
  })
}

function statusLabel(status: string) {
  return { active: "Activo", pending: "Pendiente", completed: "Completado" }[status] ?? status
}

// Colors
const NAVY   = [7, 16, 94] as [number,number,number]
const WHITE  = [255, 255, 255] as [number,number,number]
const LIGHT  = [245, 247, 255] as [number,number,number]
const GRAY   = [100, 110, 130] as [number,number,number]
const DARK   = [20, 25, 50] as [number,number,number]
const GREEN  = [16, 185, 129] as [number,number,number]
const AMBER  = [245, 158, 11] as [number,number,number]
const BLUE   = [59, 130, 246] as [number,number,number]
const BORDER = [220, 225, 240] as [number,number,number]

export async function generateContractPDF(contract: Contract) {
  const { jsPDF } = await import("jspdf")

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
  const W = 210, margin = 14
  let y = 0

  // ── Helpers ────────────────────────────────────────────────────────────────
  const col  = (r:number,g:number,b:number) => doc.setTextColor(r,g,b)
  const fill = (r:number,g:number,b:number) => doc.setFillColor(r,g,b)
  const draw = (r:number,g:number,b:number) => doc.setDrawColor(r,g,b)
  const fw   = (w: "normal"|"bold") => doc.setFont("helvetica", w)
  const fs   = (s: number) => doc.setFontSize(s)

  const text = (t:string, x:number, yy:number, opts?: Parameters<typeof doc.text>[3]) =>
    doc.text(t, x, yy, opts)

  const line = (x1:number,y1:number,x2:number,y2:number) => doc.line(x1,y1,x2,y2)

  const rect = (x:number, yy:number, w:number, h:number, style:"F"|"FD"|"D"="F") =>
    doc.rect(x, yy, w, h, style)

  function sectionTitle(title: string) {
    y += 6
    fill(...LIGHT); rect(margin, y, W - margin*2, 8, "F")
    fill(...NAVY);  rect(margin, y, 3, 8, "F")
    fw("bold"); fs(9); col(...NAVY)
    text(title.toUpperCase(), margin + 6, y + 5.5)
    y += 12
  }

  function infoRow(label: string, value: string, shade = false) {
    if (shade) { fill(249,250,255); rect(margin, y-1, W-margin*2, 7, "F") }
    fw("bold"); fs(8); col(...GRAY); text(label, margin + 2, y + 4)
    fw("normal"); fs(9); col(...DARK); text(value || "No especificado", margin + 45, y + 4)
    draw(...BORDER); line(margin, y+6, W-margin, y+6)
    y += 8
  }

  function checkPage(needed = 30) {
    if (y + needed > 275) { doc.addPage(); y = 20 }
  }

  // ══════════════════════════════════════════════════════════════════════════
  // PAGE 1 — HEADER
  // ══════════════════════════════════════════════════════════════════════════

  // Navy header bar
  fill(...NAVY); rect(0, 0, W, 40, "F")

  // White accent stripe
  fill(255, 255, 255)
  doc.setFillColor(255, 255, 255)
  rect(0, 33, W, 1, "F")

  // Logo / brand text
  fw("bold"); fs(18); col(...WHITE)
  text("INTEGRASEO", margin, 18)
  fw("normal"); fs(8); col(180, 190, 220)
  text("Sistema de Gestión de Contratos", margin, 25)

  // Report label top-right
  fw("bold"); fs(9); col(...WHITE)
  text("REPORTE DE CONTRATO", W - margin, 15, { align: "right" })
  fw("normal"); fs(7); col(180, 190, 220)
  const genDate = new Date().toLocaleDateString("es-ES", { day:"2-digit", month:"long", year:"numeric" })
  text(`Generado el ${genDate}`, W - margin, 21, { align: "right" })

  y = 50

  // ── Contract name + status badge ──
  fw("bold"); fs(20); col(...DARK)
  const nameLine = doc.splitTextToSize(contract.name, W - margin*2 - 35)
  text(nameLine, margin, y)
  y += nameLine.length * 9

  // Status badge
  const [sr,sg,sb] = contract.status === "active" ? GREEN : contract.status === "pending" ? AMBER : BLUE
  fill(sr,sg,sb)
  const badgeW = 30, badgeH = 7
  rect(margin, y, badgeW, badgeH, "F")
  fw("bold"); fs(7); col(...WHITE)
  text(statusLabel(contract.status).toUpperCase(), margin + badgeW/2, y + 5, { align: "center" })
  y += 12

  // Divider
  draw(...BORDER); line(margin, y, W-margin, y); y += 8

  // ── Información general ──
  sectionTitle("Información General")

  infoRow("Cliente",    contract.client, false)
  infoRow("Ubicación",  contract.location || "No especificada", true)
  infoRow("Estado",     statusLabel(contract.status), false)
  if (contract.createdAt) {
    infoRow("Creado el", fmtDate(contract.createdAt.split("T")[0]), true)
  }

  // ── Valor Agregado ──
  if (contract.valueItems?.length > 0) {
    sectionTitle("Valor Agregado")
    contract.valueItems.forEach((item, i) => {
      fill(i%2===0 ? 249 : 255, i%2===0 ? 250 : 255, 255)
      rect(margin, y-1, W-margin*2, 7, "F")
      fw("bold"); fs(11); col(...NAVY)
      text(String(item.quantity), margin + 6, y + 4)
      fw("normal"); fs(9); col(...DARK)
      text(item.type, margin + 18, y + 4)
      y += 8
    })
  }

  // ── Operarios ──
  if (contract.workers?.length > 0) {
    checkPage(20 + contract.workers.length * 10)
    sectionTitle("Operarios")

    // Table header
    fill(...NAVY); rect(margin, y, W-margin*2, 8, "F")
    fw("bold"); fs(8); col(...WHITE)
    text("NOMBRE", margin+4, y+5.5)
    text("CARGO", margin+65, y+5.5)
    text("TELÉFONO", margin+115, y+5.5)
    y += 8

    contract.workers.forEach((w, i) => {
      checkPage(10)
      if (i%2===0) { fill(...LIGHT); rect(margin, y, W-margin*2, 8, "F") }
      fw("normal"); fs(8.5); col(...DARK)
      text(w.name, margin+4, y+5.5)
      col(...GRAY)
      text(w.position, margin+65, y+5.5)
      text(w.phone || "—", margin+115, y+5.5)
      draw(...BORDER); line(margin, y+8, W-margin, y+8)
      y += 8
    })
    y += 4
  }

  // ── Visitas ──
  if (contract.visits?.length > 0) {
    const sortedVisits = [...contract.visits].sort(
      (a,b) => new Date(b.confirmedAt).getTime() - new Date(a.confirmedAt).getTime()
    )
    checkPage(20 + Math.min(sortedVisits.length, 8) * 9)
    sectionTitle("Visitas Confirmadas")

    fill(...NAVY); rect(margin, y, W-margin*2, 8, "F")
    fw("bold"); fs(8); col(...WHITE)
    text("FECHA", margin+4, y+5.5)
    text("HORA", margin+60, y+5.5)
    text("CONFIRMADA EL", margin+90, y+5.5)
    y += 8

    sortedVisits.forEach((v, i) => {
      checkPage(10)
      if (i%2===0) { fill(...LIGHT); rect(margin, y, W-margin*2, 8, "F") }
      fw("normal"); fs(8.5); col(...DARK)
      text(fmtDate(v.date), margin+4, y+5.5)
      col(...GRAY)
      text(v.time, margin+60, y+5.5)
      text(fmtDateTime(v.confirmedAt), margin+90, y+5.5)
      draw(...BORDER); line(margin, y+8, W-margin, y+8)
      y += 8
    })
    y += 4
  }

  // ── Notas ──
  if (contract.notes?.length > 0) {
    const sortedNotes = [...contract.notes].sort(
      (a,b) => new Date(b.date+"T"+b.time).getTime() - new Date(a.date+"T"+a.time).getTime()
    )
    checkPage(25)
    sectionTitle("Notas")

    sortedNotes.forEach((note, i) => {
      const lines = doc.splitTextToSize(note.content, W - margin*2 - 12)
      const cardH = 6 + lines.length * 5 + 4
      checkPage(cardH + 4)

      // Card background
      fill(i%2===0 ? 249 : 255, i%2===0 ? 250 : 255, 255)
      rect(margin, y, W-margin*2, cardH, "F")
      draw(...BORDER); rect(margin, y, W-margin*2, cardH, "D")

      // Left accent
      fill(...NAVY); rect(margin, y, 2.5, cardH, "F")

      // Date/time
      fw("bold"); fs(7.5); col(...GRAY)
      text(`${fmtDate(note.date)}  ·  ${note.time}`, margin+6, y+5)

      // Content
      fw("normal"); fs(8.5); col(...DARK)
      lines.forEach((line: string, li: number) => {
        text(line, margin+6, y+10+li*5)
      })
      y += cardH + 3
    })
  }

  // ══════════════════════════════════════════════════════════════════════════
  // FOOTER on every page
  // ══════════════════════════════════════════════════════════════════════════
  const totalPages = (doc as any).internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    fill(...NAVY); rect(0, 287, W, 10, "F")
    fw("normal"); fs(7); col(...WHITE)
    text("INTEGRASEO — Reporte Confidencial", margin, 293)
    text(`Pág. ${p} / ${totalPages}`, W-margin, 293, { align: "right" })
    text(genDate, W/2, 293, { align: "center" })
  }

  // ── Download ──
  const filename = `Contrato_${contract.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`
  doc.save(filename)
}
