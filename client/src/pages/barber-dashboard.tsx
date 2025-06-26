import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppointments, useUpdateAppointment } from "@/hooks/use-appointments";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, Check, X, Clock, User, Calendar, Key, Copy } from "lucide-react";
import StatsCards from "@/components/stats-cards";
import AppointmentCalendar from "@/components/appointment-calendar";
import RegistrationNotifications from "@/components/registration-notifications";
import AppointmentNotifications from "@/components/appointment-notifications";
import TodaysAppointments from "@/components/todays-appointments";
import DayEditor from "@/components/day-editor";
import RevenueStatsModal from "@/components/revenue-stats-modal";
import AppointmentStatsModal from "@/components/appointment-stats-modal";
import { useQuery } from "@tanstack/react-query";

export default function BarberDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [revenueModalOpen, setRevenueModalOpen] = useState(false);
  const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
  const { data: appointments } = useAppointments(selectedDate);
  const updateAppointment = useUpdateAppointment();
  const { toast } = useToast();

  // Filtrar agendamentos para exibição
  const todaysAppointments = appointments || [];
  const confirmedAppointments = appointments?.filter(apt => apt.status === "confirmed") || [];
  const completedAppointments = appointments?.filter(apt => apt.status === "completed") || [];

  const handleConfirmAppointment = async (appointmentId: number) => {
    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        status: "confirmed",
        notificationRead: true
      });
      
      toast({
        title: "Agendamento confirmado",
        description: "Cliente será notificado da confirmação",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar o agendamento",
        variant: "destructive",
      });
    }
  };

  const handleRejectAppointment = async (appointmentId: number) => {
    try {
      await updateAppointment.mutateAsync({
        id: appointmentId,
        status: "cancelled",
        notificationRead: true
      });
      
      toast({
        title: "Agendamento rejeitado",
        description: "Cliente será notificado da rejeição",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível rejeitar o agendamento",
        variant: "destructive",
      });
    }
  };

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

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Dashboard do Barbeiro</h1>
          {todaysAppointments.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
              <Bell className="h-5 w-5 text-blue-600" />
              <span className="text-blue-700 font-medium">
                {todaysAppointments.length} agendamento(s) hoje
              </span>
            </div>
          )}
        </div>

        {/* Cards de estatísticas */}
        <StatsCards 
          onCalendarClick={() => setAppointmentModalOpen(true)}
          onRevenueClick={() => setRevenueModalOpen(true)}
        />

        {/* Editor de horários */}
        <div className="mt-8">
          <DayEditor barberId={1} />
        </div>

        {/* Agendamentos de Hoje */}
        <div className="mt-8">
          <TodaysAppointments />
        </div>

        {/* Seção de notificações */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          <AppointmentNotifications />
          <RegistrationNotifications />
        </div>

        {/* Calendário de agendamentos */}
        <div className="mt-8">
          <AppointmentCalendar />
        </div>

        {/* Modais */}
        <RevenueStatsModal 
          open={revenueModalOpen} 
          onOpenChange={setRevenueModalOpen} 
        />
        <AppointmentStatsModal 
          open={appointmentModalOpen} 
          onOpenChange={setAppointmentModalOpen} 
        />
      </div>
    </div>
  );
}