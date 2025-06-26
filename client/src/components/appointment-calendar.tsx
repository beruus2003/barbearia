import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { useAppointments } from "@/hooks/use-appointments";
import { Skeleton } from "@/components/ui/skeleton";
import NewAppointmentModal from "./new-appointment-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "14:00", "14:30", "15:00", "15:30",
  "16:00", "16:30", "17:00", "17:30"
];

export default function AppointmentCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string | null>(null);

  const { data: appointments, isLoading } = useAppointments(selectedDate);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-success/10 border-success/30 text-success";
      case "pending":
        return "bg-white border-gray-200 text-gray-600";
      case "in_progress":
        return "bg-blue-50 border-blue-200 text-blue-600";
      case "completed":
        return "bg-gray-100 border-gray-300 text-gray-600";
      case "cancelled":
        return "bg-error/10 border-error/30 text-error";
      default:
        return "bg-gray-100 border-gray-300 text-gray-600";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "Confirmado";
      case "pending":
        return "Pendente";
      case "in_progress":
        return "Em Andamento";
      case "completed":
        return "Concluído";
      case "cancelled":
        return "Cancelado";
      default:
        return status;
    }
  };

  const appointmentsByTime = appointments?.reduce((acc, appointment) => {
    const time = format(new Date(appointment.date), "HH:mm");
    acc[time] = appointment;
    return acc;
  }, {} as Record<string, any>) || {};

  const handleTimeSlotClick = (time: string) => {
    if (!appointmentsByTime[time]) {
      setSelectedTimeSlot(time);
      setShowNewAppointmentModal(true);
    }
  };

  const handleNewAppointment = () => {
    setSelectedTimeSlot(null);
    setShowNewAppointmentModal(true);
  };

  return (
    <>
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold text-primary">
              Agenda de Hoje
            </CardTitle>
            <Button 
              onClick={handleNewAppointment}
              className="bg-accent text-white hover:bg-accent/90"
            >
              <Plus size={16} className="mr-2" />
              Novo Agendamento
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" className="p-2">
                <ChevronLeft className="text-secondary" size={16} />
              </Button>
              <h3 className="text-lg font-semibold text-primary">
                {format(selectedDate, "MMMM yyyy", { locale: ptBR })}
              </h3>
              <Button variant="ghost" size="sm" className="p-2">
                <ChevronRight className="text-secondary" size={16} />
              </Button>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="bg-accent text-white">
                Dia
              </Button>
              <Button variant="ghost" size="sm" className="text-secondary">
                Semana
              </Button>
              <Button variant="ghost" size="sm" className="text-secondary">
                Mês
              </Button>
            </div>
          </div>

          {/* Time Slots */}
          <div className="space-y-3">
            {isLoading ? (
              [...Array(8)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4 p-3">
                  <Skeleton className="w-20 h-4" />
                  <Skeleton className="flex-1 h-16" />
                </div>
              ))
            ) : (
              timeSlots.map((time) => {
                const appointment = appointmentsByTime[time];
                
                return (
                  <div key={time} className="flex items-center space-x-4 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-20 text-sm font-medium text-secondary">
                      {time}
                    </div>
                    
                    {appointment ? (
                      <div className={`flex-1 border rounded-lg p-3 ${getStatusColor(appointment.status)}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-primary">
                              {appointment.client.name}
                            </p>
                            <p className="text-sm text-secondary">
                              {appointment.service.name}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="secondary" className="text-xs">
                              {getStatusText(appointment.status)}
                            </Badge>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="p-1">
                                  <MoreVertical size={14} className="text-secondary" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem>Editar</DropdownMenuItem>
                                <DropdownMenuItem>Confirmar</DropdownMenuItem>
                                <DropdownMenuItem className="text-error">Cancelar</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTimeSlotClick(time)}
                        className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-accent transition-colors"
                      >
                        <span className="text-secondary hover:text-primary transition-colors">
                          <Plus size={16} className="inline mr-2" />
                          Disponível
                        </span>
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      <NewAppointmentModal
        open={showNewAppointmentModal}
        onOpenChange={setShowNewAppointmentModal}
        selectedDate={selectedDate}
        selectedTime={selectedTimeSlot}
      />
    </>
  );
}
