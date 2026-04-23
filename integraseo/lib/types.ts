export interface ValueItem {
  quantity: number
  type: string
}

export interface ContractNote {
  id: string
  date: string
  time: string
  content: string
}

export interface ContractWorker {
  id: string
  name: string
  position: string
  phone?: string
}

export interface Visit {
  id: string
  date: string
  time: string
  createdAt: string
  confirmedAt: string
  status: "confirmed"
  contractId: string
  contractName: string
}

export interface Contract {
  id: string
  name: string
  client: string
  location?: string
  coordinates?: { lat: number; lng: number }  // Coordenadas exactas del mini mapa
  valueItems: ValueItem[]
  status: "active" | "completed" | "pending"
  notes: ContractNote[]
  workers: ContractWorker[]
  visits: Visit[]
  color?: string
  createdAt?: string
  signature?: string   // base64 PNG
  signedAt?: string    // ISO timestamp
  signedBy?: string    // nombre del firmante
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  time: string
  description?: string
}

export interface Reminder {
  id: string
  title: string
  date: string
  time: string
  description?: string
  contractId?: string
  contractName?: string
  completed: boolean
}

export interface BrigadaServices {
  jardineria: boolean
  aseo: boolean
  updatedAt?: string
}

export interface Supernumerario {
  fecha: string
  nombre: string
  trabajo: string
  contratoId: string
  createdAt?: string
  updatedAt?: string
}

export interface HistoryEntry {
  id: string
  contractId: string
  action: string        // e.g. "Contrato creado", "Estado cambiado"
  detail: string        // e.g. "De 'Pendiente' a 'Activo'"
  category: "contract" | "note" | "worker" | "visit"
  timestamp: string     // ISO string
}
