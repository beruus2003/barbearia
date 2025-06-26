import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DollarSign, Calendar, Clock, User, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface RevenueStatsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Period = 'day' | 'week' | 'month' | 'year';

interface DetailedStats {
  completedAppointments: number;
  totalRevenue: number;
  appointments: Array<{
    id: number;
    date: string;
    client: {
      firstName: string;
      lastName: string;
    };
    service: {
      name: string;
      price: string;
      duration: number;
    };
  }>;
}

export default function RevenueStatsModal({ open, onOpenChange }: RevenueStatsModalProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const { data: stats, isLoading } = useQuery<DetailedStats>({
    queryKey: ['/api/stats/detailed', selectedPeriod, selectedDate.toISOString()],
    queryFn: async () => {
      const response = await fetch(`/api/stats/detailed?period=${selectedPeriod}&date=${selectedDate.toISOString()}`);
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');
      return response.json();
    },
    enabled: open,
  });

  // Funções para navegação de data
  const goToPrevious = () => {
    const newDate = new Date(selectedDate);
    switch (selectedPeriod) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() - 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() - 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(selectedDate);
    switch (selectedPeriod) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1);
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
    }
    setSelectedDate(newDate);
  };

  const changeDay = (day: string) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(parseInt(day));
    setSelectedDate(newDate);
  };

  const changeMonth = (month: string) => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(parseInt(month));
    setSelectedDate(newDate);
  };

  const changeYear = (year: string) => {
    const newDate = new Date(selectedDate);
    newDate.setFullYear(parseInt(year));
    setSelectedDate(newDate);
  };

  // Gerar opções para os selects
  const getDaysInMonth = () => {
    const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  };

  const getMonths = () => {
    return [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
  };

  const getYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);
  };

  const getPeriodLabel = (period: Period) => {
    switch (period) {
      case 'day': return format(selectedDate, "dd 'de' MMMM", { locale: ptBR });
      case 'week': {
        const startOfWeek = new Date(selectedDate);
        const dayOfWeek = startOfWeek.getDay();
        startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return `${format(startOfWeek, "dd/MM", { locale: ptBR })} - ${format(endOfWeek, "dd/MM", { locale: ptBR })}`;
      }
      case 'month': return format(selectedDate, "MMMM 'de' yyyy", { locale: ptBR });
      case 'year': return format(selectedDate, "yyyy", { locale: ptBR });
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Estatísticas de Receita
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-green-600" />
            Estatísticas de Receita
          </DialogTitle>
        </DialogHeader>

        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as Period)}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="day">Dia</TabsTrigger>
            <TabsTrigger value="week">Semana</TabsTrigger>
            <TabsTrigger value="month">Mês</TabsTrigger>
            <TabsTrigger value="year">Ano</TabsTrigger>
          </TabsList>

          {/* Seletor de Data/Período */}
          <div className="bg-gray-50 p-4 rounded-lg mt-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="outline" size="sm" onClick={goToPrevious}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex items-center gap-2">
                {selectedPeriod === 'day' && (
                  <>
                    <Select value={selectedDate.getDate().toString()} onValueChange={changeDay}>
                      <SelectTrigger className="w-16">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getDaysInMonth().map((day) => (
                          <SelectItem key={day} value={day.toString()}>
                            {day}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select value={selectedDate.getMonth().toString()} onValueChange={changeMonth}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getMonths().map((month, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {month}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                )}
                
                {(selectedPeriod === 'month' || selectedPeriod === 'day') && (
                  <Select value={selectedDate.getFullYear().toString()} onValueChange={changeYear}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYears().map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                
                {selectedPeriod === 'week' && (
                  <div className="text-center">
                    <p className="font-medium">Semana de {getPeriodLabel('week')}</p>
                    <p className="text-sm text-gray-600">{format(selectedDate, "yyyy", { locale: ptBR })}</p>
                  </div>
                )}
                
                {selectedPeriod === 'year' && (
                  <Select value={selectedDate.getFullYear().toString()} onValueChange={changeYear}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {getYears().map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              
              <Button variant="outline" size="sm" onClick={goToNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            
            <p className="text-center text-gray-600 text-sm">
              Período: {getPeriodLabel(selectedPeriod)}
            </p>
          </div>

          <TabsContent value={selectedPeriod} className="mt-6">
            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Cortes Realizados</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className="text-2xl font-bold">{stats?.completedAppointments || 0}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Receita Total</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-600" />
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(stats?.totalRevenue || 0)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{getPeriodLabel(selectedPeriod)}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-gray-600">Ticket Médio</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-purple-600" />
                    <span className="text-2xl font-bold text-purple-600">
                      {stats?.completedAppointments && stats.completedAppointments > 0
                        ? formatCurrency(stats.totalRevenue / stats.completedAppointments)
                        : formatCurrency(0)
                      }
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Por atendimento</p>
                </CardContent>
              </Card>
            </div>

            {/* Lista de Atendimentos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Atendimentos Realizados ({getPeriodLabel(selectedPeriod)})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!stats?.appointments || stats.appointments.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">Nenhum atendimento realizado {getPeriodLabel(selectedPeriod).toLowerCase()}</p>
                  </div>
                ) : (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {stats.appointments.map((appointment) => (
                      <div key={appointment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-green-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {appointment.client.firstName} {appointment.client.lastName}
                            </p>
                            <p className="text-sm text-gray-600">{appointment.service.name}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(appointment.date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 mb-1">
                            {appointment.service.duration}min
                          </Badge>
                          <p className="font-bold text-green-600">
                            {formatCurrency(parseFloat(appointment.service.price))}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}