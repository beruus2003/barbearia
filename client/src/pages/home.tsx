import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Settings, Calendar as CalendarIcon, Clock, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Mock user data - in a real app this would come from authentication
const mockUser = {
  name: "João Silva",
  email: "joao@example.com",
  avatar: "/api/placeholder/100/100"
};

// Available time slots
const timeSlots = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00"
];

export default function Home() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Get available dates (excluding Sundays and past dates)
  const isDateAvailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today && date.getDay() !== 0; // Not Sunday and not in the past
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setSelectedTime(""); // Reset time selection when date changes
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
  };

  const handleBookAppointment = () => {
    if (selectedDate && selectedTime) {
      alert(`Agendamento marcado para ${selectedDate.toLocaleDateString('pt-BR')} às ${selectedTime}`);
      setIsCalendarOpen(false);
      setSelectedTime("");
    } else {
      alert("Por favor, selecione uma data e horário");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header with user profile and settings */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              Barbearia Rodrigues
            </h1>

            <div className="flex items-center space-x-4">
              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <Avatar>
                  <AvatarImage src={mockUser.avatar} alt={mockUser.name} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="text-sm">
                  <p className="font-medium text-gray-900">{mockUser.name}</p>
                  <p className="text-gray-500">{mockUser.email}</p>
                </div>
              </div>

              {/* Settings Icons */}
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Left Column - Schedule Button */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CalendarIcon className="h-5 w-5" />
                    <span>Agendamentos</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        Agendar Horário
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px]">
                      <DialogHeader>
                        <DialogTitle>Agendar Horário</DialogTitle>
                      </DialogHeader>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Calendar */}
                        <div>
                          <h3 className="font-medium mb-3">Selecione a Data</h3>
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={handleDateSelect}
                            disabled={(date) => !isDateAvailable(date)}
                            className="rounded-md border"
                          />
                        </div>

                        {/* Time Slots */}
                        <div>
                          <h3 className="font-medium mb-3">Horários Disponíveis</h3>
                          {selectedDate ? (
                            <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                              {timeSlots.map((time) => (
                                <Button
                                  key={time}
                                  variant={selectedTime === time ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => handleTimeSelect(time)}
                                  className="justify-center"
                                >
                                  <Clock className="h-3 w-3 mr-1" />
                                  {time}
                                </Button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">
                              Selecione uma data para ver os horários disponíveis
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Booking Summary */}
                      {selectedDate && selectedTime && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-medium mb-2">Resumo do Agendamento</h4>
                          <p className="text-sm text-gray-600">
                            Data: {selectedDate.toLocaleDateString('pt-BR', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            Horário: {selectedTime}
                          </p>
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex justify-end space-x-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setIsCalendarOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleBookAppointment}
                          disabled={!selectedDate || !selectedTime}
                        >
                          Confirmar Agendamento
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>

            {/* Center Column - Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Bem-vindo à Barbearia Rodrigues!</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <p className="text-gray-600">
                      Olá, {mockUser.name}! Aqui você pode agendar seus horários de forma rápida e fácil.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-medium text-blue-900 mb-2">Horário de Funcionamento</h3>
                        <p className="text-sm text-blue-700">
                          Segunda a Sábado<br />
                          09:00 às 12:00 | 14:00 às 18:00
                        </p>
                      </div>

                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="font-medium text-green-900 mb-2">Serviços</h3>
                        <p className="text-sm text-green-700">
                          Corte • Barba • Sobrancelha<br />
                          Lavagem • Penteado
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}