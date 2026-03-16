"use client"

import { useStore } from "@/lib/store"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, FileText } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ContractsListProps {
  onEdit: (id: string) => void
}

export function ContractsList({ onEdit }: ContractsListProps) {
  const contracts = useStore((state) => state.contracts)
  const deleteContract = useStore((state) => state.deleteContract)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "completed":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Activo"
      case "completed":
        return "Completado"
      case "pending":
        return "Pendiente"
      default:
        return status
    }
  }

  if (contracts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No hay contratos</h2>
        <p className="text-muted-foreground">Comienza añadiendo tu primer contrato</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {contracts.map((contract) => (
        <Card key={contract.id} className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">{contract.name}</h3>
              <p className="text-sm text-muted-foreground mb-2">Cliente: {contract.client}</p>
              <Badge className={getStatusColor(contract.status)}>{getStatusLabel(contract.status)}</Badge>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => onEdit(contract.id)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (confirm("¿Estás seguro de eliminar este contrato?")) {
                    deleteContract(contract.id)
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="text-sm space-y-1">
            <p>
              <span className="font-medium">Inicio:</span>{" "}
              {format(new Date(contract.startDate), "dd/MM/yyyy", { locale: es })}
            </p>
            <p>
              <span className="font-medium">Fin:</span>{" "}
              {format(new Date(contract.endDate), "dd/MM/yyyy", { locale: es })}
            </p>
            {contract.description && <p className="text-muted-foreground mt-2">{contract.description}</p>}
          </div>
        </Card>
      ))}
    </div>
  )
}
