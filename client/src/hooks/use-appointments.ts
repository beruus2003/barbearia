import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { apiRequest } from "@/lib/queryClient";
import type { AppointmentWithDetails, InsertAppointment } from "@shared/schema";

export function useAppointments(date?: Date) {
  const dateParam = date ? format(date, "yyyy-MM-dd") : undefined;
  
  return useQuery<AppointmentWithDetails[]>({
    queryKey: ["/api/appointments", dateParam],
    queryFn: async () => {
      const url = dateParam ? `/api/appointments?date=${dateParam}` : "/api/appointments";
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch appointments");
      return response.json();
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (appointment: InsertAppointment) => {
      const response = await apiRequest("POST", "/api/appointments", appointment);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useUpdateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: number } & Partial<InsertAppointment> & { status?: string; notificationRead?: boolean }) => {
      const response = await apiRequest("PUT", `/api/appointments/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/appointments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    },
  });
}
