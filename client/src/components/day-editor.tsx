import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Edit, X } from "lucide-react";
import { useBarberSchedule, useUpdateBarberSchedule } from "@/hooks/use-barber-schedule";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DayEditorProps {
  barberId: number;
}

const DAYS_OF_WEEK = [
  { value: 0, name: 'Domingo' },
  { value: 1, name: 'Segunda-feira' },
  { value: 2, name: 'Terça-feira' },
  { value: 3, name: 'Quarta-feira' },
  { value: 4, name: 'Quinta-feira' },
  { value: 5, name: 'Sexta-feira' },
  { value: 6, name: 'Sábado' },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return `${hour}:00`;
});

export default function DayEditor({ barberId }: DayEditorProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [isWorking, setIsWorking] = useState(true);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [isOpen, setIsOpen] = useState(false);

  const { data: schedule } = useBarberSchedule(barberId);
  const updateSchedule = useUpdateBarberSchedule();
  const { toast } = useToast();

  const handleDayClick = (dayOfWeek: number) => {
    const daySchedule = schedule?.find(s => s.dayOfWeek === dayOfWeek);
    setSelectedDay(dayOfWeek);
    setIsWorking(daySchedule?.isWorking ?? true);
    setStartTime(daySchedule?.startTime ?? "09:00");
    setEndTime(daySchedule?.endTime ?? "18:00");
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (selectedDay === null) return;

    try {
      const updatedSchedules = DAYS_OF_WEEK.map(day => ({
        barberId,
        dayOfWeek: day.value,
        isWorking: day.value === selectedDay ? isWorking : schedule?.find(s => s.dayOfWeek === day.value)?.isWorking ?? true,
        startTime: day.value === selectedDay ? startTime : schedule?.find(s => s.dayOfWeek === day.value)?.startTime ?? "09:00",
        endTime: day.value === selectedDay ? endTime : schedule?.find(s => s.dayOfWeek === day.value)?.endTime ?? "18:00",
      }));

      await updateSchedule.mutateAsync({
        barberId,
        schedules: updatedSchedules,
      });

      toast({
        title: "Horário atualizado",
        description: `${DAYS_OF_WEEK[selectedDay].name} ${isWorking ? 'disponível' : 'fechado'}`,
      });

      setIsOpen(false);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o horário",
        variant: "destructive",
      });
    }
  };

  const today = new Date();
  const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 0 });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="h-5 w-5" />
          <span>Editar Horários de Trabalho</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {DAYS_OF_WEEK.map((day) => {
            const daySchedule = schedule?.find(s => s.dayOfWeek === day.value);
            const currentDate = addDays(startOfCurrentWeek, day.value);
            
            return (
              <Dialog key={day.value} open={isOpen && selectedDay === day.value} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-20 flex flex-col items-center justify-center p-2"
                    onClick={() => handleDayClick(day.value)}
                  >
                    <div className="text-xs font-medium text-center">
                      {day.name.substring(0, 3)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {format(currentDate, "dd/MM")}
                    </div>
                    {daySchedule?.isWorking ? (
                      <Badge variant="default" className="text-xs mt-1">
                        {daySchedule.startTime}-{daySchedule.endTime}
                      </Badge>
                    ) : (
                      <Badge variant="destructive" className="text-xs mt-1">
                        Fechado
                      </Badge>
                    )}
                  </Button>
                </DialogTrigger>
                
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                      <Edit className="h-5 w-5" />
                      <span>Editar {day.name}</span>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="is-working"
                        checked={isWorking}
                        onCheckedChange={setIsWorking}
                      />
                      <Label htmlFor="is-working">
                        {isWorking ? "Dia de trabalho" : "Dia de fechamento"}
                      </Label>
                    </div>
                    
                    {isWorking && (
                      <>
                        <div>
                          <Label htmlFor="start-time">Horário de início</Label>
                          <Select value={startTime} onValueChange={setStartTime}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(time => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div>
                          <Label htmlFor="end-time">Horário de término</Label>
                          <Select value={endTime} onValueChange={setEndTime}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIME_SLOTS.map(time => (
                                <SelectItem key={time} value={time}>
                                  {time}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                    
                    <div className="flex space-x-2 pt-4">
                      <Button onClick={handleSave} disabled={updateSchedule.isPending}>
                        Salvar
                      </Button>
                      <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}