"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, FileText, Users, Calendar, Bell } from "lucide-react"
import { ContractsList } from "@/components/contracts-list"
import { ContractDialog } from "@/components/contract-dialog"
import { NotesPanel } from "@/components/notes-panel"
import { WorkersPanel } from "@/components/workers-panel"
import { CalendarPanel } from "@/components/calendar-panel"
import { RemindersPanel } from "@/components/reminders-panel"

type View = "contracts" | "notes" | "workers" | "calendar" | "reminders"

export default function Home() {
  const [currentView, setCurrentView] = useState<View>("contracts")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedContractId, setSelectedContractId] = useState<string | null>(null)

  const handleEditContract = (id: string) => {
    setSelectedContractId(id)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedContractId(null)
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <h1 className="text-xl font-semibold text-foreground">Gestión de Contratos</h1>
        {currentView === "contracts" && (
          <Button onClick={() => setIsDialogOpen(true)} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo Contrato
          </Button>
        )}
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Content Area */}
        <main className="flex-1 overflow-y-auto">
          {currentView === "contracts" && <ContractsList onEdit={handleEditContract} />}
          {currentView === "notes" && <NotesPanel />}
          {currentView === "workers" && <WorkersPanel />}
          {currentView === "calendar" && <CalendarPanel />}
          {currentView === "reminders" && <RemindersPanel />}
        </main>
      </div>

      {/* Bottom Navigation - WhatsApp Style */}
      <nav className="flex items-center justify-around border-t border-border bg-card px-2 py-2">
        <Button
          variant={currentView === "contracts" ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => setCurrentView("contracts")}
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs">Contratos</span>
        </Button>
        <Button
          variant={currentView === "notes" ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => setCurrentView("notes")}
        >
          <FileText className="h-5 w-5" />
          <span className="text-xs">Notas</span>
        </Button>
        <Button
          variant={currentView === "workers" ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => setCurrentView("workers")}
        >
          <Users className="h-5 w-5" />
          <span className="text-xs">Operarios</span>
        </Button>
        <Button
          variant={currentView === "calendar" ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => setCurrentView("calendar")}
        >
          <Calendar className="h-5 w-5" />
          <span className="text-xs">Calendario</span>
        </Button>
        <Button
          variant={currentView === "reminders" ? "default" : "ghost"}
          size="sm"
          className="flex flex-col items-center gap-1 h-auto py-2"
          onClick={() => setCurrentView("reminders")}
        >
          <Bell className="h-5 w-5" />
          <span className="text-xs">Recordatorios</span>
        </Button>
      </nav>

      {/* Contract Dialog */}
      <ContractDialog open={isDialogOpen} onOpenChange={handleCloseDialog} contractId={selectedContractId} />
    </div>
  )
}
