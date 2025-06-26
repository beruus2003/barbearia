import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Scissors, BarChart3, Phone, Calendar } from "lucide-react";
import { useClients } from "@/hooks/use-clients";
import { useServices } from "@/hooks/use-services";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocation } from "wouter";

export default function QuickActions() {
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: services, isLoading: servicesLoading } = useServices();
  const [, setLocation] = useLocation();

  const recentClients = clients?.slice(0, 3) || [];
  const popularServices = services?.slice(0, 3) || [];

  return (
    <div className="space-y-6">
      {/* Quick Actions Card */}
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 p-3 h-auto hover:bg-gray-50"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserPlus className="text-blue-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-primary">Novo Cliente</p>
              <p className="text-sm text-secondary">Cadastrar cliente</p>
            </div>
          </Button>
          
          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 p-3 h-auto hover:bg-gray-50"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Scissors className="text-success" size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-primary">Gerenciar Serviços</p>
              <p className="text-sm text-secondary">Editar preços</p>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 p-3 h-auto hover:bg-gray-50"
          >
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="text-purple-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-primary">Relatórios</p>
              <p className="text-sm text-secondary">Ver estatísticas</p>
            </div>
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-start space-x-3 p-3 h-auto hover:bg-gray-50"
            onClick={() => setLocation('/schedule-settings')}
          >
            <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center">
              <Calendar className="text-gray-600" size={20} />
            </div>
            <div className="text-left">
              <p className="font-medium text-primary">Horários</p>
              <p className="text-sm text-secondary">Configurar agenda</p>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Clients */}
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">
            Clientes Recentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {clientsLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="w-8 h-8" />
              </div>
            ))
          ) : (
            recentClients.map((client, index) => (
              <div key={client.id} className="flex items-center space-x-3">
                <img 
                  src={`https://images.unsplash.com/photo-${
                    index === 0 ? '1507003211169-0a1dd7228f2d' : 
                    index === 1 ? '1500648767791-00dcc994a43e' : 
                    '1472099645785-5658abf4ff4e'
                  }?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=40&h=40`}
                  alt="Cliente" 
                  className="w-10 h-10 rounded-full object-cover" 
                />
                <div className="flex-1">
                  <p className="font-medium text-primary text-sm">{client.name}</p>
                  <p className="text-xs text-secondary">
                    {client.lastVisit 
                      ? `Último corte: ${new Date(client.lastVisit).toLocaleDateString('pt-BR')}`
                      : 'Primeiro atendimento'
                    }
                  </p>
                </div>
                <Button variant="ghost" size="sm" className="p-2">
                  <Phone className="text-secondary" size={14} />
                </Button>
              </div>
            ))
          )}
          
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-accent hover:text-accent/80 text-sm font-medium"
          >
            Ver todos os clientes
          </Button>
        </CardContent>
      </Card>

      {/* Services Overview */}
      <Card className="bg-surface shadow-sm border border-gray-100">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-primary">
            Serviços Populares
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {servicesLoading ? (
            [...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))
          ) : (
            popularServices.map((service, index) => (
              <div key={service.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-primary text-sm">{service.name}</p>
                  <p className="text-xs text-secondary">
                    R$ {parseFloat(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    index === 0 ? 'bg-success/20 text-success' : 
                    index === 1 ? 'bg-success/20 text-success' : 
                    'bg-blue-100 text-blue-600'
                  }`}
                >
                  {index === 0 ? '45 este mês' : index === 1 ? '32 este mês' : '18 este mês'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
