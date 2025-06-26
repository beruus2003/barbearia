
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, CheckCircle, XCircle, Plus } from "lucide-react";
import { useLocation } from "wouter";
import { useAppointments } from "@/hooks/use-appointments";
import { useCurrentUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ClientDashboard() {
  const [, setLocation] = useLocation();
  const { data: currentUser } = useCurrentUser();
  const { data: appointments } = useAppointments();

  // Filtrar apenas agendamentos do cliente atual
  const myAppointments = appointments?.filter(apt => 
    apt.clientId === currentUser?.id
  ) || [];

  // Ordenar por data mais próxima
  const sortedAppointments = myAppointments.sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Próximo agendamento
  const now = new Date();
  const nextAppointment = sortedAppointments.find(apt => 
    new Date(apt.date) > now && (apt.status === 'pending' || apt.status === 'confirmed')
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-white border border-gray-200 text-gray-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmado';
      case 'pending':
        return 'Pendente';
      case 'in_progress':
        return 'Em andamento';
      case 'completed':
        return 'Concluído';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Olá, {currentUser?.firstName}!
            </h1>
            <p className="text-gray-600">
              Bem-vindo ao seu painel de agendamentos
            </p>
          </div>

          {/* Próximo Agendamento */}
          {nextAppointment && (
            <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200 mb-6">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-1">
                      Você tem horário marcado para {format(new Date(nextAppointment.date), "dd/MM 'às' HH:mm", { locale: ptBR })}!
                    </h3>
                    <p className="text-green-700">
                      {nextAppointment.service.name}
                    </p>
                    <Badge 
                      variant={nextAppointment.status === "confirmed" ? "default" : "secondary"}
                      className="mt-2"
                    >
                      {nextAppointment.status === "confirmed" ? "Confirmado" : "Aguardando confirmação"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Botão principal para marcar horário */}
          <div className="mb-8">
            <Card className="bg-white border-2 border-blue-200 hover:border-blue-300 transition-colors">
              <CardContent className="p-8 text-center">
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                      Marcar Horário
                    </h2>
                    <p className="text-gray-600 mb-4">
                      Escolha um serviço e agende seu horário
                    </p>
                  </div>
                  <Button 
                    size="lg" 
                    className="px-8 py-3 text-lg"
                    onClick={() => setLocation('/book-appointment')}
                  >
                    <Calendar className="h-5 w-5 mr-2" />
                    Agendar Agora
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Meus Agendamentos */}
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Meus Agendamentos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sortedAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum agendamento
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Você ainda não tem agendamentos marcados.
                  </p>
                  <Button onClick={() => setLocation('/book-appointment')}>
                    Marcar primeiro horário
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {appointment.service?.name}
                            </h3>
                            <Badge className={getStatusColor(appointment.status)}>
                              <div className="flex items-center space-x-1">
                                {getStatusIcon(appointment.status)}
                                <span>{getStatusText(appointment.status)}</span>
                              </div>
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>
                                {format(new Date(appointment.date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Clock className="h-4 w-4" />
                              <span>
                                {format(new Date(appointment.date), "HH:mm", { locale: ptBR })} 
                                ({appointment.service?.duration} min)
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-2 font-semibold text-green-600">
                              <span>R$ {appointment.service?.price}</span>
                            </div>
                          </div>

                          {appointment.notes && (
                            <div className="mt-2 p-2 bg-gray-50 rounded text-sm">
                              <strong>Observações:</strong> {appointment.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
