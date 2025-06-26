import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, DollarSign, Users, TrendingUp, ArrowUp, ArrowDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

interface StatsCardsProps {
  onCalendarClick?: () => void;
  onRevenueClick?: () => void;
}

export default function StatsCards({ onCalendarClick, onRevenueClick }: StatsCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="card-stats bg-white shadow-sm border border-gray-100">
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-8 w-16 mb-4" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="card-stats bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={onCalendarClick}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Horários Marcados</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.todayAppointments || 0}</p>
            </div>
            <Button variant="ghost" size="sm" className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
              <CalendarDays className="text-gray-600" size={20} />
            </Button>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 flex items-center">
              <ArrowUp size={12} className="mr-1" />
              8%
            </span>
            <span className="text-gray-500 ml-2">vs. ontem</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow" onClick={onRevenueClick}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Faturamento</p>
              <p className="text-2xl font-bold text-gray-900">
                R$ {stats?.monthlyRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </p>
            </div>
            <Button variant="ghost" size="sm" className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
              <DollarSign className="text-gray-600" size={20} />
            </Button>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 flex items-center">
              <ArrowUp size={12} className="mr-1" />
              15%
            </span>
            <span className="text-gray-500 ml-2">vs. mês passado</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clientes Ativos</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.activeClients || 0}</p>
            </div>
            <Button variant="ghost" size="sm" className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
              <Users className="text-gray-600" size={20} />
            </Button>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 flex items-center">
              <ArrowUp size={12} className="mr-1" />
              5%
            </span>
            <span className="text-gray-500 ml-2">novos este mês</span>
          </div>
        </CardContent>
      </Card>

      <Card className="card-stats bg-white shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taxa de Ocupação</p>
              <p className="text-2xl font-bold text-gray-900">{stats?.occupancyRate || 0}%</p>
            </div>
            <Button variant="ghost" size="sm" className="w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50">
              <TrendingUp className="text-gray-600" size={20} />
            </Button>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <span className="text-gray-600 flex items-center">
              <ArrowDown size={12} className="mr-1" />
              2%
            </span>
            <span className="text-gray-500 ml-2">vs. semana passada</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
