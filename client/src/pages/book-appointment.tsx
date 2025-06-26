import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, Clock, DollarSign, Calendar as CalendarIcon, Check } from "lucide-react";
import { useLocation } from "wouter";
import { useServices } from "@/hooks/use-services";
import { useAvailableTimeSlots } from "@/hooks/use-barber-schedule";
import { useCreateAppointment } from "@/hooks/use-appointments";
import { useCurrentUser } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import type { BarberSchedule } from "@shared/schema";

type BookingStep = 'service' | 'date' | 'time' | 'confirmation';

export default function BookAppointment() {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  const { data: services, isLoading: servicesLoading } = useServices();
  const { data: availableSlots } = useAvailableTimeSlots(selectedDate);
  const { data: currentUser } = useCurrentUser();
  const createAppointment = useCreateAppointment();
  const { toast } = useToast();

  const handleServiceSelect = (service: any) => {
    setSelectedService(service);
    setCurrentStep('date');
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setCurrentStep('time');
    }
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setCurrentStep('confirmation');
  };

  const { data: barberSchedule } = useQuery<BarberSchedule[]>({
    queryKey: ["/api/barber/schedule", 1],
    queryFn: async () => {
      const response = await fetch("/api/barber/schedule/1");
      if (!response.ok) throw new Error("Erro ao buscar agenda");
      return response.json();
    },
  });

  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = date.getDay();
    
    // Não pode agendar em datas passadas
    if (date < today) return false;
    
    // Verifica se o barbeiro trabalha neste dia
    if (!barberSchedule) return false;
    
    const schedule = barberSchedule.find(s => s.dayOfWeek === dayOfWeek && s.isWorking);
    return !!schedule;
  };

  const handleConfirmBooking = async () => {
    console.log('Dados do agendamento:', {
      selectedService,
      selectedDate,
      selectedTime,
      currentUser
    });

    if (!selectedService || !selectedDate || !selectedTime) {
      toast({
        title: "Erro",
        description: "Por favor, selecione serviço, data e horário",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Erro de autenticação",
        description: "Faça login para agendar",
        variant: "destructive",
      });
      setLocation('/login');
      return;
    }

    try {
      const appointmentDate = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      appointmentDate.setHours(parseInt(hours), parseInt(minutes));

      await createAppointment.mutateAsync({
        clientId: currentUser.id,
        serviceId: selectedService.id,
        date: appointmentDate.toISOString(),
        status: 'pending',
        notes: null,
      });

      toast({
        title: "Agendamento confirmado!",
        description: "Seu horário foi marcado com sucesso",
      });

      setLocation('/client-dashboard');
    } catch (error) {
      toast({
        title: "Erro no agendamento",
        description: "Não foi possível confirmar seu horário",
        variant: "destructive",
      });
    }
  };



  const renderServiceSelection = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Escolha o Serviço</h1>
        <p className="text-gray-600">Selecione o serviço que deseja agendar</p>
      </div>

      {servicesLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-24 rounded-lg" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {services?.map((service) => (
            <Card
              key={service.id}
              className="bg-white hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-blue-200"
              onClick={() => handleServiceSelect(service)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-semibold mb-2">{service.name}</h3>
                    {service.description && (
                      <p className="text-gray-600 mb-3">{service.description}</p>
                    )}
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-sm text-gray-600">{service.duration} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-1 mb-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">
                        {service.price}
                      </span>
                    </div>
                    <Button>Selecionar</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const renderDateSelection = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep('service')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos serviços
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Escolha a Data</h1>
        <p className="text-gray-600">
          Serviço selecionado: <strong>{selectedService?.name}</strong>
        </p>
      </div>

      <Card className="bg-white">
        <CardContent className="p-6">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={(date) => !isDateAvailable(date)}
            locale={ptBR}
            className="w-full"
          />
        </CardContent>
      </Card>
    </div>
  );

  const renderTimeSelection = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep('date')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao calendário
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Escolha o Horário</h1>
        <p className="text-gray-600">
          Data selecionada: <strong>
            {selectedDate && format(selectedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </strong>
        </p>
      </div>

      <Card className="bg-white">
        <CardContent className="p-6">
          {!availableSlots || availableSlots.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum horário disponível
              </h3>
              <p className="text-gray-600">
                Não há horários disponíveis para esta data. Tente outro dia.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {availableSlots.map((time) => (
                <Button
                  key={time}
                  variant="outline"
                  className="h-12 text-center hover:bg-blue-50 hover:border-blue-300"
                  onClick={() => handleTimeSelect(time)}
                >
                  {time}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const renderConfirmation = () => (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setCurrentStep('time')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar aos horários
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Confirmar Agendamento</h1>
        <p className="text-gray-600">Revise os detalhes do seu agendamento</p>
      </div>

      <Card className="bg-white">
        <CardContent className="p-6">
          <div className="space-y-6">
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Serviço:</span>
              <span className="font-medium">{selectedService?.name}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Data:</span>
              <span className="font-medium">
                {selectedDate && format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Horário:</span>
              <span className="font-medium">{selectedTime}</span>
            </div>
            
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">Duração:</span>
              <span className="font-medium">{selectedService?.duration} minutos</span>
            </div>
            
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">Valor:</span>
              <span className="text-xl font-bold text-green-600">
                R$ {selectedService?.price}
              </span>
            </div>

            <div className="pt-6">
              <Button
                className="w-full h-12 text-lg"
                onClick={handleConfirmBooking}
                disabled={createAppointment.isPending}
              >
                {createAppointment.isPending ? (
                  "Confirmando..."
                ) : (
                  <>
                    <Check className="h-5 w-5 mr-2" />
                    Confirmar Agendamento
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/client-dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao início
        </Button>
      </div>

      {currentStep === 'service' && renderServiceSelection()}
      {currentStep === 'date' && renderDateSelection()}
      {currentStep === 'time' && renderTimeSelection()}
      {currentStep === 'confirmation' && renderConfirmation()}
    </div>
  );
}