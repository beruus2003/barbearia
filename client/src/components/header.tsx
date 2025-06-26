import { Bell, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation } from "wouter";
import { useNotifications, useUnreadNotificationsCount, useMarkNotificationAsRead } from "@/hooks/use-notifications";
import { useCurrentUser } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logoPath from "@assets/logo.png";

export default function Header() {
  const [, setLocation] = useLocation();
  const { data: currentUser } = useCurrentUser();
  const { data: notifications = [] } = useNotifications();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const markAsRead = useMarkNotificationAsRead();

  const handleNotificationClick = (id: number) => {
    markAsRead.mutate(id);
  };

  const isBarber = currentUser?.userType === 'barber';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <img src={logoPath} alt="Barbearia Rodrigues" className="w-8 h-8 object-contain" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Barbearia Rodrigues</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {isBarber && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
                      >
                        {unreadCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <h4 className="font-medium leading-none">Notificações</h4>
                    <ScrollArea className="h-72">
                      <div className="space-y-2">
                        {notifications.length === 0 ? (
                          <p className="text-sm text-gray-500">Nenhuma notificação</p>
                        ) : (
                          notifications.map((notification) => (
                            <div
                              key={notification.id}
                              className={`p-3 rounded-lg border cursor-pointer hover:bg-gray-50 ${
                                !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white'
                              }`}
                              onClick={() => handleNotificationClick(notification.id)}
                            >
                              <h5 className="font-medium text-sm">{notification.title}</h5>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {format(new Date(notification.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            <nav className="hidden md:flex space-x-6">
              <Button variant="ghost" onClick={() => setLocation('/dashboard')}>
                Dashboard
              </Button>
              {isBarber && (
                <Button variant="ghost" onClick={() => setLocation('/schedule-settings')}>
                  Horários
                </Button>
              )}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
}
