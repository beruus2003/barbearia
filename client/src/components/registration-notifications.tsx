import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Copy, Check, X, User, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface RegistrationNotification {
  type: string;
  message: string;
  code: string;
  email: string;
  fullName: string;
  timestamp: string;
  id: string;
}

export default function RegistrationNotifications() {
  const [notifications, setNotifications] = useState<RegistrationNotification[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      // Identifica o barbeiro conectado
      ws.send(JSON.stringify({ type: 'barber_connect' }));
      setWsConnection(ws);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'registration_request') {
          const notification: RegistrationNotification = {
            ...data,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
          };
          
          setNotifications(prev => [notification, ...prev]);
          
          // Exibir toast de notificação
          toast({
            title: "Nova solicitação de cadastro!",
            description: `${data.fullName} quer se cadastrar`,
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnection(null);
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    return () => {
      ws.close();
    };
  }, [toast]);

  const copyToClipboard = (code: string, fullName: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: `Código de ${fullName} copiado para área de transferência`,
    });
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const confirmClientEmail = async (email: string) => {
    try {
      const response = await fetch("/api/auth/confirm-email-manual", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "Email confirmado!",
          description: "Cliente já pode fazer login no sistema",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Não foi possível confirmar email",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), "HH:mm", { locale: ptBR });
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Solicitações de Cadastro
          {notifications.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {notifications.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma solicitação de cadastro pendente</p>
            <p className="text-sm">As notificações aparecerão aqui automaticamente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <User className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900 dark:text-blue-100">
                      {notification.fullName}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {formatTime(notification.timestamp)}
                    </Badge>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-blue-700 dark:text-blue-300">
                      Código:
                    </span>
                    <Badge variant="secondary" className="font-mono">
                      {notification.code}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyToClipboard(notification.code, notification.fullName)}
                    className="text-blue-600 border-blue-200 hover:bg-blue-100"
                    title="Copiar código"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => confirmClientEmail(notification.email)}
                    className="text-green-600 border-green-200 hover:bg-green-100"
                    title="Confirmar email do cliente"
                  >
                    <Mail className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => dismissNotification(notification.id)}
                    className="text-gray-500 hover:text-gray-700"
                    title="Dispensar notificação"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {wsConnection === null && (
          <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-800 dark:text-gray-200">
              ⚠️ Desconectado - Reconectando automaticamente...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}