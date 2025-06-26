import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppointments, useUpdateAppointment } from "@/hooks/use-appointments";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, User, CheckCircle, Calendar } from "lucide-react";

export default function TodaysAppointments() {
  const { data: appointments } = useAppointments(new Date());
  const updateAppointment = useUpdateAppointment();
  const { toast } = useToast();

  // Filtrar apenas agendamentos confirmados para hoje
  const todaysAppointments = appointments?.filter(apt => 
    apt.status === "confirmed" || apt.status === "completed"
  ) || [];

  const handleCompleteAppointment = async (appointmentId: number) => {
    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        status: "completed"
      });
      
      toast({
        title: "Atendimento concluído",
        description: "Agendamento marcado como finalizado",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível completar o agendamento",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluído';
      case 'confirmed':
        return 'Agendado';
      default:
        return status;
    }
  };

  // Ordenar por horário
  const sortedAppointments = todaysAppointments.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <Card className="bg-white border border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Agendamentos de Hoje
          {todaysAppointments.length > 0 && (
            <Badge variant="secondary">{todaysAppointments.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sortedAppointments.length === 0 ? (
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum agendamento para hoje</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {sortedAppointments.map((appointment) => (
              <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {appointment.client.firstName} {appointment.client.lastName}
                      </p>
                      <p className="text-sm text-gray-600">{appointment.service.name}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(appointment.date), "HH:mm", { locale: ptBR })} - {appointment.service.duration}min
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 mb-2">
                      R$ {parseFloat(appointment.service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                    <Badge className={getStatusColor(appointment.status)}>
                      {getStatusLabel(appointment.status)}
                    </Badge>
                  </div>
                </div>
                
                {appointment.status === "confirmed" && (
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => handleCompleteAppointment(appointment.id)}
                      className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
                      size="sm"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Marcar como Concluído
                    </Button>
                  </div>
                )}
                
                {appointment.notes && (
                  <div className="mt-3 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <strong>Observações:</strong> {appointment.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}