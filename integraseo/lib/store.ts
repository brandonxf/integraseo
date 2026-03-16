import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { Contract, Note, Worker, CalendarEvent, Reminder } from "./types"

interface AppState {
  contracts: Contract[]
  notes: Note[]
  workers: Worker[]
  events: CalendarEvent[]
  reminders: Reminder[]

  // Contract actions
  addContract: (contract: Omit<Contract, "id">) => void
  updateContract: (id: string, contract: Partial<Contract>) => void
  deleteContract: (id: string) => void
  getContract: (id: string) => Contract | undefined

  // Note actions
  addNote: (note: Omit<Note, "id" | "createdAt" | "updatedAt">) => void
  updateNote: (id: string, content: string) => void
  deleteNote: (id: string) => void
  getNotesByContract: (contractId: string) => Note[]

  // Worker actions
  addWorker: (worker: Omit<Worker, "id">) => void
  updateWorker: (id: string, worker: Partial<Worker>) => void
  deleteWorker: (id: string) => void

  // Event actions
  addEvent: (event: Omit<CalendarEvent, "id">) => void
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void

  // Reminder actions
  addReminder: (reminder: Omit<Reminder, "id">) => void
  updateReminder: (id: string, reminder: Partial<Reminder>) => void
  deleteReminder: (id: string) => void
  toggleReminder: (id: string) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      contracts: [],
      notes: [],
      workers: [],
      events: [],
      reminders: [],

      // Contract actions
      addContract: (contract) =>
        set((state) => ({
          contracts: [...state.contracts, { ...contract, id: crypto.randomUUID() }],
        })),

      updateContract: (id, contract) =>
        set((state) => ({
          contracts: state.contracts.map((c) => (c.id === id ? { ...c, ...contract } : c)),
        })),

      deleteContract: (id) =>
        set((state) => ({
          contracts: state.contracts.filter((c) => c.id !== id),
          notes: state.notes.filter((n) => n.contractId !== id),
        })),

      getContract: (id) => get().contracts.find((c) => c.id === id),

      // Note actions
      addNote: (note) =>
        set((state) => ({
          notes: [
            ...state.notes,
            {
              ...note,
              id: crypto.randomUUID(),
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ],
        })),

      updateNote: (id, content) =>
        set((state) => ({
          notes: state.notes.map((n) => (n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n)),
        })),

      deleteNote: (id) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        })),

      getNotesByContract: (contractId) => get().notes.filter((n) => n.contractId === contractId),

      // Worker actions
      addWorker: (worker) =>
        set((state) => ({
          workers: [...state.workers, { ...worker, id: crypto.randomUUID() }],
        })),

      updateWorker: (id, worker) =>
        set((state) => ({
          workers: state.workers.map((w) => (w.id === id ? { ...w, ...worker } : w)),
        })),

      deleteWorker: (id) =>
        set((state) => ({
          workers: state.workers.filter((w) => w.id !== id),
        })),

      // Event actions
      addEvent: (event) =>
        set((state) => ({
          events: [...state.events, { ...event, id: crypto.randomUUID() }],
        })),

      updateEvent: (id, event) =>
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...event } : e)),
        })),

      deleteEvent: (id) =>
        set((state) => ({
          events: state.events.filter((e) => e.id !== id),
        })),

      // Reminder actions
      addReminder: (reminder) =>
        set((state) => ({
          reminders: [...state.reminders, { ...reminder, id: crypto.randomUUID() }],
        })),

      updateReminder: (id, reminder) =>
        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? { ...r, ...reminder } : r)),
        })),

      deleteReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        })),

      toggleReminder: (id) =>
        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? { ...r, completed: !r.completed } : r)),
        })),
    }),
    {
      name: "contracts-storage",
    },
  ),
)
