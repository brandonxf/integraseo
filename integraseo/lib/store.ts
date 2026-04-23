import { create } from "zustand"
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore"
import { db } from "./firebase"
import type {
  Contract, CalendarEvent, Reminder, BrigadaServices,
  Supernumerario, ContractNote, ContractWorker, Visit, HistoryEntry,
} from "./types"

// uid actual — se inyecta desde el componente AuthWrapper
let currentUid: string | null = null
export function setCurrentUid(uid: string | null) { currentUid = uid }

// Paths con namespace por usuario
function col(path: string) {
  if (!currentUid) throw new Error("No autenticado")
  return collection(db, "users", currentUid, path)
}
function d(path: string, id: string) {
  if (!currentUid) throw new Error("No autenticado")
  return doc(db, "users", currentUid, path, id)
}

interface AppState {
  contracts: Contract[]
  events: CalendarEvent[]
  reminders: Reminder[]
  loading: boolean
  addHistory: (entry: Omit<HistoryEntry, "id">) => Promise<void>
  getHistory: (contractId: string) => Promise<HistoryEntry[]>
  loadAll: () => Promise<void>
  clearData: () => void
  addContract: (data: Omit<Contract, "id">) => Promise<void>
  updateContract: (id: string, data: Partial<Omit<Contract, "id">>) => Promise<void>
  deleteContract: (id: string) => Promise<void>
  getContract: (id: string) => Contract | undefined
  addNote: (contractId: string, note: Omit<ContractNote, "id">) => Promise<void>
  updateNote: (contractId: string, noteId: string, data: Partial<ContractNote>) => Promise<void>
  deleteNote: (contractId: string, noteId: string) => Promise<void>
  addWorker: (contractId: string, worker: Omit<ContractWorker, "id">) => Promise<void>
  deleteWorker: (contractId: string, workerId: string) => Promise<void>
  addVisit: (contractId: string, visit: Omit<Visit, "id">) => Promise<void>
  deleteVisit: (contractId: string, visitId: string) => Promise<void>
  addEvent: (event: Omit<CalendarEvent, "id">) => Promise<void>
  deleteEvent: (id: string) => Promise<void>
  addReminder: (reminder: Omit<Reminder, "id">) => Promise<void>
  updateReminder: (id: string, data: Partial<Reminder>) => Promise<void>
  deleteReminder: (id: string) => Promise<void>
  toggleReminder: (id: string) => Promise<void>
  getBrigadaServices: (contractId: string) => Promise<BrigadaServices>
  getAllBrigadaServices: () => Promise<Record<string, BrigadaServices>>
  updateBrigadaServices: (contractId: string, services: Partial<BrigadaServices>) => Promise<void>
  getSupernumerarios: (contractId: string) => Promise<Supernumerario[]>
  addSupernumerario: (contractId: string, sup: Omit<Supernumerario, "createdAt">) => Promise<void>
  updateSupernumerario: (contractId: string, index: number, sup: Partial<Supernumerario>) => Promise<void>
  deleteSupernumerario: (contractId: string, index: number) => Promise<void>
  getAllSupernumerarios: () => Promise<Array<Supernumerario & { contractName: string; contractDocId: string; index: number }>>
}

export const useStore = create<AppState>((set, get) => ({
  contracts: [],
  events: [],
  reminders: [],
  loading: false,

  clearData: () => set({ contracts: [], events: [], reminders: [] }),

  addHistory: async (entry) => {
    try { await addDoc(col("history"), { ...entry, id: Date.now().toString() }) }
    catch (e) { console.warn("History write failed:", e) }
  },

  getHistory: async (contractId) => {
    try {
      const snap = await getDocs(col("history"))
      return snap.docs
        .map(d => ({ id: d.id, ...d.data() } as HistoryEntry))
        .filter(h => h.contractId === contractId)
        .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    } catch { return [] }
  },

  loadAll: async () => {
    if (!currentUid) return
    set({ loading: true })
    try {
      const [contractsSnap, eventsSnap, remindersSnap] = await Promise.all([
        getDocs(col("contracts")),
        getDocs(col("events")),
        getDocs(col("recordatorios")),
      ])
      const contracts: Contract[] = contractsSnap.docs.map((d) => ({
        id: d.id, name: d.data().name || "", client: d.data().client || "",
        location: d.data().location || "", valueItems: d.data().valueItems || [],
        status: d.data().status || "active", notes: d.data().notes || [],
        workers: d.data().workers || [], visits: d.data().visits || [],
        createdAt: d.data().createdAt || "", color: d.data().color || undefined,
        signature: d.data().signature || undefined, signedAt: d.data().signedAt || undefined,
        signedBy: d.data().signedBy || undefined,
      }))
      const events: CalendarEvent[] = eventsSnap.docs.map((d) => ({
        id: d.id, title: d.data().title || "", date: d.data().date || "",
        time: d.data().time || "", description: d.data().description || "",
      }))
      const reminders: Reminder[] = remindersSnap.docs.map((d) => ({
        id: d.id, title: d.data().title || "", date: d.data().date || "",
        time: d.data().time || "", description: d.data().description || "",
        contractId: d.data().contractId || undefined, contractName: d.data().contractName || undefined,
        completed: d.data().completed || false,
      }))
      set({ contracts, events, reminders, loading: false })
    } catch (e) {
      console.error("Error loading data:", e)
      set({ loading: false })
    }
  },

  addContract: async (data) => {
    const docRef = await addDoc(col("contracts"), data)
    set((s) => ({ contracts: [...s.contracts, { id: docRef.id, ...data }] }))
    await get().addHistory({ contractId: docRef.id, action: "Contrato creado", detail: `"${data.name}" para ${data.client}`, category: "contract", timestamp: new Date().toISOString() })
  },

  updateContract: async (id, data) => {
    const prev = get().contracts.find(c => c.id === id)
    await updateDoc(d("contracts", id), data as Record<string, unknown>)
    set((s) => ({ contracts: s.contracts.map((c) => (c.id === id ? { ...c, ...data } : c)) }))
    const details: string[] = []
    if (data.status && prev?.status !== data.status) details.push(`Estado: "${prev?.status ?? ""}" → "${data.status}"`)
    if (data.name && prev?.name !== data.name) details.push(`Nombre actualizado`)
    if (data.client && prev?.client !== data.client) details.push(`Cliente actualizado`)
    if (data.location !== undefined && prev?.location !== data.location) details.push(`Ubicación actualizada`)
    if (data.signature && !prev?.signature) details.push(`Firma digital añadida`)
    await get().addHistory({ contractId: id, action: details.some(x => x.includes("Firma")) ? "Firma actualizada" : "Contrato editado", detail: details.length ? details.join(" · ") : "Campos actualizados", category: "contract", timestamp: new Date().toISOString() })
  },

  deleteContract: async (id) => {
    const c = get().contracts.find(c => c.id === id)
    await get().addHistory({ contractId: id, action: "Contrato eliminado", detail: c ? `"${c.name}"` : id, category: "contract", timestamp: new Date().toISOString() })
    await deleteDoc(d("contracts", id))
    set((s) => ({ contracts: s.contracts.filter((c) => c.id !== id) }))
  },

  getContract: (id) => get().contracts.find((c) => c.id === id),

  addNote: async (contractId, note) => {
    const newNote = { ...note, id: Date.now().toString() }
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updatedNotes = [...(contract.notes || []), newNote]
    await updateDoc(d("contracts", contractId), { notes: updatedNotes })
    set((s) => ({ contracts: s.contracts.map((c) => c.id === contractId ? { ...c, notes: updatedNotes } : c) }))
    await get().addHistory({ contractId, action: "Nota añadida", detail: note.content.slice(0, 80), category: "note", timestamp: new Date().toISOString() })
  },

  updateNote: async (contractId, noteId, data) => {
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updatedNotes = contract.notes.map((n) => (n.id === noteId ? { ...n, ...data } : n))
    await updateDoc(d("contracts", contractId), { notes: updatedNotes })
    set((s) => ({ contracts: s.contracts.map((c) => c.id === contractId ? { ...c, notes: updatedNotes } : c) }))
  },

  deleteNote: async (contractId, noteId) => {
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updatedNotes = contract.notes.filter((n) => n.id !== noteId)
    await updateDoc(d("contracts", contractId), { notes: updatedNotes })
    set((s) => ({ contracts: s.contracts.map((c) => c.id === contractId ? { ...c, notes: updatedNotes } : c) }))
    await get().addHistory({ contractId, action: "Nota eliminada", detail: "Nota borrada del contrato", category: "note", timestamp: new Date().toISOString() })
  },

  addWorker: async (contractId, worker) => {
    const newWorker = { ...worker, id: Date.now().toString() }
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updatedWorkers = [...(contract.workers || []), newWorker]
    await updateDoc(d("contracts", contractId), { workers: updatedWorkers })
    set((s) => ({ contracts: s.contracts.map((c) => c.id === contractId ? { ...c, workers: updatedWorkers } : c) }))
    await get().addHistory({ contractId, action: "Operario añadido", detail: `${worker.name} — ${worker.position}`, category: "worker", timestamp: new Date().toISOString() })
  },

  deleteWorker: async (contractId, workerId) => {
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updatedWorkers = contract.workers.filter((w) => w.id !== workerId)
    await updateDoc(d("contracts", contractId), { workers: updatedWorkers })
    set((s) => ({ contracts: s.contracts.map((c) => c.id === contractId ? { ...c, workers: updatedWorkers } : c) }))
    await get().addHistory({ contractId, action: "Operario eliminado", detail: "Operario removido", category: "worker", timestamp: new Date().toISOString() })
  },

  addVisit: async (contractId, visit) => {
    const newVisit = { ...visit, id: Date.now().toString() }
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updatedVisits = [...(contract.visits || []), newVisit]
    await updateDoc(d("contracts", contractId), { visits: updatedVisits })
    set((s) => ({ contracts: s.contracts.map((c) => c.id === contractId ? { ...c, visits: updatedVisits } : c) }))
    await get().addHistory({ contractId, action: "Visita confirmada", detail: `Fecha: ${visit.date} a las ${visit.time}`, category: "visit", timestamp: new Date().toISOString() })
  },

  deleteVisit: async (contractId, visitId) => {
    const contract = get().contracts.find((c) => c.id === contractId)
    if (!contract) return
    const updatedVisits = contract.visits.filter((v) => v.id !== visitId)
    await updateDoc(d("contracts", contractId), { visits: updatedVisits })
    set((s) => ({ contracts: s.contracts.map((c) => c.id === contractId ? { ...c, visits: updatedVisits } : c) }))
  },

  addEvent: async (event) => {
    const docRef = await addDoc(col("events"), event)
    set((s) => ({ events: [...s.events, { id: docRef.id, ...event }] }))
  },

  deleteEvent: async (id) => {
    await deleteDoc(d("events", id))
    set((s) => ({ events: s.events.filter((e) => e.id !== id) }))
  },

  addReminder: async (reminder) => {
    const docRef = await addDoc(col("recordatorios"), reminder)
    set((s) => ({ reminders: [...s.reminders, { id: docRef.id, ...reminder }] }))
  },

  updateReminder: async (id, data) => {
    await updateDoc(d("recordatorios", id), data as Record<string, unknown>)
    set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, ...data } : r)) }))
  },

  deleteReminder: async (id) => {
    await deleteDoc(d("recordatorios", id))
    set((s) => ({ reminders: s.reminders.filter((r) => r.id !== id) }))
  },

  toggleReminder: async (id) => {
    const reminder = get().reminders.find((r) => r.id === id)
    if (!reminder) return
    const newVal = !reminder.completed
    await updateDoc(d("recordatorios", id), { completed: newVal })
    set((s) => ({ reminders: s.reminders.map((r) => (r.id === id ? { ...r, completed: newVal } : r)) }))
  },

  getBrigadaServices: async (contractId) => {
    try {
      const snap = await getDoc(d("brigadas", contractId))
      if (snap.exists()) return snap.data() as BrigadaServices
      return { jardineria: false, aseo: false }
    } catch { return { jardineria: false, aseo: false } }
  },

  getAllBrigadaServices: async () => {
    try {
      const snap = await getDocs(col("brigadas"))
      const result: Record<string, BrigadaServices> = {}
      snap.docs.forEach((doc) => {
        result[doc.id] = doc.data() as BrigadaServices
      })
      return result
    } catch { return {} }
  },

  updateBrigadaServices: async (contractId, services) => {
    await setDoc(d("brigadas", contractId), { ...services, updatedAt: new Date().toISOString() }, { merge: true })
  },

  getSupernumerarios: async (contractId) => {
    try {
      const snap = await getDoc(d("supernumerarios", contractId))
      if (snap.exists()) return snap.data().supernumerarios || []
      return []
    } catch { return [] }
  },

  addSupernumerario: async (contractId, sup) => {
    const snap = await getDoc(d("supernumerarios", contractId))
    const current: Supernumerario[] = snap.exists() ? snap.data().supernumerarios || [] : []
    const newSup = { ...sup, createdAt: new Date().toISOString() }
    await setDoc(d("supernumerarios", contractId), { supernumerarios: [...current, newSup] }, { merge: true })
  },

  updateSupernumerario: async (contractId, index, data) => {
    const snap = await getDoc(d("supernumerarios", contractId))
    if (!snap.exists()) return
    const sups: Supernumerario[] = snap.data().supernumerarios || []
    sups[index] = { ...sups[index], ...data, updatedAt: new Date().toISOString() }
    await setDoc(d("supernumerarios", contractId), { supernumerarios: sups }, { merge: true })
  },

  deleteSupernumerario: async (contractId, index) => {
    const snap = await getDoc(d("supernumerarios", contractId))
    if (!snap.exists()) return
    const sups: Supernumerario[] = snap.data().supernumerarios || []
    sups.splice(index, 1)
    await setDoc(d("supernumerarios", contractId), { supernumerarios: sups }, { merge: true })
  },

  getAllSupernumerarios: async () => {
    const contracts = get().contracts
    const result: Array<Supernumerario & { contractName: string; contractDocId: string; index: number }> = []
    for (const contract of contracts) {
      const snap = await getDoc(d("supernumerarios", contract.id))
      if (snap.exists()) {
        const sups: Supernumerario[] = snap.data().supernumerarios || []
        sups.forEach((sup, index) => { result.push({ ...sup, contractName: contract.name, contractDocId: contract.id, index }) })
      }
    }
    return result
  },
}))
