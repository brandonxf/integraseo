export interface Contract {
  id: string
  name: string
  client: string
  startDate: string
  endDate: string
  status: "active" | "completed" | "pending"
  description: string
  workers: string[]
}

export interface Note {
  id: string
  contractId: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface Worker {
  id: string
  name: string
  phone: string
  email: string
  contractIds: string[]
}

export interface CalendarEvent {
  id: string
  title: string
  date: string
  contractId?: string
  type: "meeting" | "deadline" | "note" | "other"
}

export interface Reminder {
  id: string
  title: string
  description: string
  dueDate: string
  contractId?: string
  completed: boolean
}
