
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, DollarSign, Calendar, ArrowLeft, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useAppointments } from "@/hooks/use-appointments";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Notification {
  id: string;
  type: 'new_appointment' | 'daily_summary' | 'shift_end';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  data?: any;
}

export default function Notifications() {
  const [, setLocation] = useLocation();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { data: appointments } = useAppointments();

  useEffect(() => {
    // Simular notificações baseadas nos agendamentos reais
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayAppointments = appointments?.filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      return aptDate.getTime() === today.getTime() && apt.status === 'confirmed';
    }) || [];

    // Calcular renda do dia
    const dailyRevenue = todayAppointments.reduce((total, apt) => {
      return total + parseFloat(apt.service?.price || '0');
    }, 0);

    const mockNotifications: Notification[] = [
      // Novos agendamentos
      ...todayAppointments.slice(0, 3).map((apt, index) => ({
        id: `new_${apt.id}_${index}`,
        type: 'new_appointment' as const,
        title: 'Novo agendamento',
        message: `${apt.client?.name} marcou ${apt.service?.name} para ${format(new Date(apt.date), "HH:mm")}`,
        timestamp: new Date(Date.now() - (index + 1) * 30 * 60 * 1000),
        read: index > 1,
      })),
      
      // Notificação de fim de expediente (apenas se há agendamentos hoje)
      ...(todayAppointments.length > 0 ? [{
        id: 'shift_end_today',
        type: 'shift_end' as const,
        title: 'Fim do expediente',
        message: 'Chegou o horário limite do seu expediente de hoje',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1h atrás
        read: false,
      }] : []),
      
      // Resumo diário
      ...(dailyRevenue > 0 ? [{
        id: 'daily_summary_today',
        type: 'daily_summary' as const,
        title: 'Resumo do dia',
        message: `Sua renda de hoje foi: R$ ${dailyRevenue.toFixed(2)}`,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false,
        data: { dailyRevenue }
      }] : []),
    ];

    setNotifications(mockNotifications);
  }, [appointments]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, read: true }
          : notif
      )
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return <Calendar className="h-5 w-5 text-blue-600" />;
      case 'daily_summary':
        return <DollarSign className="h-5 w-5 text-green-600" />;
      case 'shift_end':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'new_appointment':
        return 'border-l-blue-600 bg-blue-50';
      case 'daily_summary':
        return 'border-l-green-600 bg-green-50';
      case 'shift_end':
        return 'border-l-gray-600 bg-white';
      default:
        return 'border-l-gray-600 bg-gray-50';
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `${minutes} min atrás`;
    } else if (hours < 24) {
      return `${hours}h atrás`;
    } else {
      return `${days} dia${days > 1 ? 's' : ''} atrás`;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center space-x-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/barber-dashboard')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar</span>
            </Button>
            
            <div className="flex items-center space-x-3">
              <Bell className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">Notificações</h1>
                {unreadCount > 0 && (
                  <p className="text-gray-600">
                    {unreadCount} notificação{unreadCount > 1 ? 'ões' : ''} não lida{unreadCount > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </div>

          {notifications.length === 0 ? (
            <Card className="bg-white">
              <CardContent className="py-12 text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-600">
                  Suas notificações aparecerão aqui quando houver novidades.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map((notification) => (
                <Card 
                  key={notification.id} 
                  className={`bg-white transition-all cursor-pointer hover:shadow-md ${
                    !notification.read ? `border-l-4 ${getNotificationStyle(notification.type)}` : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <Badge className="bg-blue-600 text-white">Nova</Badge>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-700 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{formatTimeAgo(notification.timestamp)}</span>
                        </div>
                        
                        {notification.type === 'daily_summary' && notification.data && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <DollarSign className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium text-green-800">
                                Total de hoje: R$ {notification.data.dailyRevenue.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        )}

                        {notification.type === 'shift_end' && (
                          <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <AlertClock className="h-4 w-4 text-orange-600" />
                              <span className="text-sm font-medium text-orange-800">
                                Horário limite atingido
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {unreadCount > 0 && (
            <div className="mt-6 text-center">
              <Button 
                variant="outline"
                onClick={() => {
                  setNotifications(prev => 
                    prev.map(notif => ({ ...notif, read: true }))
                  );
                }}
              >
                Marcar todas como lidas
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
