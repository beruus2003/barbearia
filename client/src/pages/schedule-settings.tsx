import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useBarberSchedule, useUpdateBarberSchedule } from "@/hooks/use-barber-schedule";
import { Loader2, Clock, Calendar } from "lucide-react";
import type { InsertBarberSchedule } from "@shared/schema";

const daysOfWeek = [
  { value: 0, label: "Domingo" },
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
  { value: 6, label: "Sábado" },
];

const scheduleSchema = z.object({
  schedules: z.array(z.object({
    dayOfWeek: z.number(),
    isWorking: z.boolean(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    barberId: z.number(),
  }))
});

type ScheduleForm = z.infer<typeof scheduleSchema>;

export default function ScheduleSettings() {
  const { toast } = useToast();
  const barberId = 1; // Fixed barber ID
  const { data: schedules, isLoading } = useBarberSchedule(barberId);
  const updateScheduleMutation = useUpdateBarberSchedule();

  const form = useForm<ScheduleForm>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      schedules: daysOfWeek.map(day => ({
        dayOfWeek: day.value,
        isWorking: false,
        startTime: "09:00",
        endTime: "18:00",
        barberId,
      }))
    }
  });

  useEffect(() => {
    if (schedules) {
      const scheduleMap = new Map(schedules.map(s => [s.dayOfWeek, s]));
      const formSchedules = daysOfWeek.map(day => {
        const existing = scheduleMap.get(day.value);
        return {
          dayOfWeek: day.value,
          isWorking: existing ? Boolean(existing.isWorking) : false,
          startTime: existing ? existing.startTime || "09:00" : "09:00",
          endTime: existing ? existing.endTime || "18:00" : "18:00",
          barberId,
        };
      });
      form.reset({ schedules: formSchedules });
    }
  }, [schedules, form]);

  const onSubmit = async (data: ScheduleForm) => {
    try {
      const validSchedules: InsertBarberSchedule[] = data.schedules
        .filter(schedule => schedule.isWorking)
        .map(schedule => ({
          barberId: schedule.barberId,
          dayOfWeek: schedule.dayOfWeek,
          isWorking: schedule.isWorking,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
        }));

      await updateScheduleMutation.mutateAsync({ barberId, schedules: validSchedules });
      
      toast({
        title: "Horários atualizados",
        description: "Seus horários de trabalho foram salvos com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível salvar os horários. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando horários...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center space-x-3 mb-8">
          <Calendar className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold">Configuração de Horários</h1>
            <p className="text-gray-600">Configure seus dias e horários de trabalho</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4">
              {daysOfWeek.map((day, index) => (
                <Card key={day.value} className="bg-white">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{day.label}</CardTitle>
                      <FormField
                        control={form.control}
                        name={`schedules.${index}.isWorking`}
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              {field.value ? "Trabalhar" : "Não trabalhar"}
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardHeader>

                  {form.watch(`schedules.${index}.isWorking`) && (
                    <CardContent className="pt-0">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`schedules.${index}.startTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Horário de início</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  className="bg-white border-gray-300"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`schedules.${index}.endTime`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>Horário de término</span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="time"
                                  {...field}
                                  className="bg-white border-gray-300"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>

            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="submit"
                disabled={updateScheduleMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8"
              >
                {updateScheduleMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Horários"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}