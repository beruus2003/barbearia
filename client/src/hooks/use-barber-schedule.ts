import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { BarberSchedule, InsertBarberSchedule } from "@shared/schema";

export function useBarberSchedule(barberId: number) {
  return useQuery<BarberSchedule[]>({
    queryKey: ["/api/barber/schedule", barberId],
    queryFn: async () => {
      const response = await fetch(`/api/barber/schedule/${barberId}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar horários do barbeiro");
      }
      return response.json();
    },
  });
}

export function useUpdateBarberSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ barberId, schedules }: { barberId: number; schedules: InsertBarberSchedule[] }) => {
      const response = await fetch(`/api/barber/schedule/${barberId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(schedules),
      });
      if (!response.ok) {
        throw new Error("Erro ao atualizar horários");
      }
      return response.json();
    },
    onSuccess: (_, { barberId }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/barber/schedule", barberId] });
      queryClient.invalidateQueries({ queryKey: ["/api/available-slots"] });
    },
  });
}

export function useAvailableTimeSlots(date?: Date) {
  return useQuery<string[]>({
    queryKey: ["/api/available-slots", date?.toISOString()],
    queryFn: async () => {
      if (!date) return [];
      const dateStr = date.toISOString().split('T')[0];
      const response = await fetch(`/api/available-slots/${dateStr}`);
      if (!response.ok) {
        throw new Error("Erro ao buscar horários disponíveis");
      }
      return response.json();
    },
    enabled: !!date,
  });
}