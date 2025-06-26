import { eq, desc, sql, and, gte, lt, count, sum } from "drizzle-orm";
import { format } from "date-fns";
import { db } from "./db";
import {
  appointments,
  services,
  clients,
  users,
  barbers,
  confirmationCodes,
  barberSchedule,
  notifications,
  type Appointment,
  type Service,
  type Client,
  type User,
  type Barber,
  type ConfirmationCode,
  type BarberSchedule,
  type Notification,
  type AppointmentWithDetails,
  type InsertAppointment,
  type InsertService,
  type InsertClient,
  type UpsertUser,
  type InsertBarber,
  type InsertConfirmationCode,
  type InsertBarberSchedule,
  type InsertNotification,
} from "@shared/schema";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";
import { sendEmail } from "./email";

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';

export interface IStorage {
  // Users (only clients)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<User>;
  loginUser(email: string, password: string): Promise<User | null>;
  sendConfirmationEmail(email: string, token: string): Promise<boolean>;
  confirmEmail(token: string): Promise<boolean>;

  // Barber
  getBarberByUsername(username: string): Promise<Barber | undefined>;
  loginBarber(username: string, password: string): Promise<Barber | null>;
  initializeBarber(): Promise<void>;

  // Confirmation Codes
  generateConfirmationCode(): Promise<string>;
  validateConfirmationCode(code: string): Promise<boolean>;
  getUnusedConfirmationCodes(): Promise<ConfirmationCode[]>;

  // Clients
  getClients(): Promise<Client[]>;
  getClient(id: number): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: number, client: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;

  // Services
  getServices(): Promise<Service[]>;
  getService(id: number): Promise<Service | undefined>;
  createService(service: InsertService): Promise<Service>;
  updateService(id: number, service: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;

  // Appointments
  getAppointments(date?: Date): Promise<AppointmentWithDetails[]>;
  getAppointment(id: number): Promise<AppointmentWithDetails | undefined>;
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: number, appointment: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentWithDetails[]>;

  // Barber Schedule
  getBarberSchedule(barberId: number): Promise<BarberSchedule[]>;
  updateBarberSchedule(barberId: number, schedules: InsertBarberSchedule[]): Promise<BarberSchedule[]>;
  getAvailableTimeSlots(date: Date): Promise<string[]>;

  // Stats
  getStats(): Promise<{
    todayAppointments: number;
    monthlyRevenue: number;
    activeClients: number;
    occupancyRate: number;
  }>;
  
  getDetailedStats(period: 'day' | 'week' | 'month' | 'year', date?: Date): Promise<{
    completedAppointments: number;
    totalRevenue: number;
    appointments: AppointmentWithDetails[];
  }>;

  // Notifications
  getNotifications(): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  getUnreadNotificationsCount(): Promise<number>;
}

export class DatabaseStorage implements IStorage {
  constructor() {
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    try {
      const existingServices = await this.getServices();
      if (existingServices.length === 0) {
        await db.insert(services).values([
          {
            name: "Corte Tradicional",
            price: "25.00",
            duration: 30,
            description: "Corte clássico masculino"
          },
          {
            name: "Corte + Barba",
            price: "40.00",
            duration: 45,
            description: "Corte + modelagem de barba"
          },
          {
            name: "Barba",
            price: "20.00",
            duration: 20,
            description: "Modelagem e aparagem de barba"
          },
          {
            name: "Corte Degradê",
            price: "30.00",
            duration: 35,
            description: "Corte degradê moderno"
          },
          {
            name: "Corte Feminino",
            price: "35.00",
            duration: 40,
            description: "Corte feminino estilizado"
          }
        ]);
      }
    } catch (error) {
      console.log("Erro ao inicializar dados:", error);
    }
  }
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser(userData: { email: string; password: string; firstName: string; lastName: string }): Promise<User> {
    const bcrypt = await import('bcrypt');
    const { nanoid } = await import('nanoid');

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const confirmationToken = nanoid(64);

    const [user] = await db
      .insert(users)
      .values({
        id: nanoid(),
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
        emailConfirmed: false,
        confirmationToken: confirmationToken,
      })
      .returning();

    // Send confirmation email
    await this.sendConfirmationEmail(userData.email, confirmationToken);

    return user;
  }

  async sendConfirmationEmail(email: string, token: string): Promise<boolean> {
    try {
      const { sendEmail, generateConfirmationEmailHtml } = await import('./email.js');
      
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? `https://${process.env.REPLIT_DOMAINS}` 
        : 'http://localhost:5000';
      
      const html = generateConfirmationEmailHtml(token, baseUrl);
      
      const emailSent = await sendEmail({
        to: email,
        from: process.env.FROM_EMAIL || 'noreply@barbeariaapp.com',
        subject: 'Confirme seu Email - Barbearia',
        html: html,
        text: `Confirme seu email clicando no link: ${baseUrl}/confirm-email?token=${token}`
      });

      console.log(`Email de confirmação enviado para ${email}: ${emailSent ? 'sucesso' : 'falhou'}`);
      return emailSent;
    } catch (error) {
      console.error("Erro ao enviar email de confirmação:", error);
      return false;
    }
  }

  async confirmEmail(token: string): Promise<boolean> {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.confirmationToken, token));

    if (!user) {
      return false;
    }

    await db
      .update(users)
      .set({ 
        emailConfirmed: true, 
        confirmationToken: null 
      })
      .where(eq(users.id, user.id));

    return true;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async loginUser(email: string, password: string): Promise<User | null> {
    const bcrypt = await import('bcrypt');
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (user && user.password && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  // Barber methods
  async getBarberByUsername(username: string): Promise<Barber | undefined> {
    const [barber] = await db.select().from(barbers).where(eq(barbers.username, username));
    return barber;
  }

  async loginBarber(username: string, password: string): Promise<Barber | null> {
    const bcrypt = await import('bcrypt');
    const [barber] = await db.select().from(barbers).where(eq(barbers.username, username));

    if (barber && await bcrypt.compare(password, barber.password)) {
      return barber;
    }
    return null;
  }

  async initializeBarber(): Promise<void> {
    // Check if barber already exists
    const existingBarber = await this.getBarberByUsername("tiagorodrigues47");
    if (existingBarber) return;

    const bcrypt = await import('bcrypt');
    const hashedPassword = await bcrypt.hash("Js180620", 10);

    await db
      .insert(barbers)
      .values({
        username: "tiagorodrigues47",
        password: hashedPassword,
        name: "Tiago Rodrigues"
      });
  }

  // Confirmation codes methods
  async generateConfirmationCode(): Promise<string> {
    const { nanoid } = await import('nanoid');
    const code = nanoid(8).toUpperCase(); // 8 character code

    await db
      .insert(confirmationCodes)
      .values({
        code: code,
        used: false
      });

    return code;
  }

  async validateConfirmationCode(code: string): Promise<boolean> {
    const [confirmationCode] = await db
      .select()
      .from(confirmationCodes)
      .where(eq(confirmationCodes.code, code));

    if (!confirmationCode || confirmationCode.used) {
      return false;
    }

    // Mark code as used
    await db
      .update(confirmationCodes)
      .set({ used: true })
      .where(eq(confirmationCodes.code, code));

    return true;
  }

  async getUnusedConfirmationCodes(): Promise<ConfirmationCode[]> {
    return await db
      .select()
      .from(confirmationCodes)
      .where(eq(confirmationCodes.used, false));
  }



  private seedData() {
    // Seed services
    const defaultServices = [
      { name: "Corte Tradicional", price: "25.00", duration: 30, description: "Corte clássico masculino" },
      { name: "Corte + Barba", price: "40.00", duration: 45, description: "Corte + modelagem de barba" },
      { name: "Barba", price: "20.00", duration: 20, description: "Modelagem e aparagem de barba" },
      { name: "Corte Degradê", price: "30.00", duration: 35, description: "Corte degradê moderno" },
      { name: "Corte Feminino", price: "35.00", duration: 40, description: "Corte feminino estilizado" },
    ];

    defaultServices.forEach(service => {
      const id = this.currentServiceId++;
      this.services.set(id, { id, ...service });
    });

    // Seed clients
    const defaultClients = [
      { name: "Carlos Mendes", phone: "(11) 99999-1111", email: "carlos@email.com", lastVisit: new Date('2024-12-15') },
      { name: "Miguel Santos", phone: "(11) 99999-2222", email: "miguel@email.com", lastVisit: new Date('2024-12-10') },
      { name: "Ana Silva", phone: "(11) 99999-3333", email: "ana@email.com", lastVisit: new Date('2024-12-12') },
      { name: "Pedro Lima", phone: "(11) 99999-4444", email: "pedro@email.com", lastVisit: new Date('2024-12-15') },
      { name: "Lucas Oliveira", phone: "(11) 99999-5555", email: "lucas@email.com", lastVisit: new Date('2024-12-10') },
      { name: "Roberto Costa", phone: "(11) 99999-6666", email: "roberto@email.com", lastVisit: new Date('2024-12-08') },
    ];

    defaultClients.forEach(client => {
      const id = this.currentClientId++;
      this.clients.set(id, { id, ...client });
    });

    // Seed appointments for today
    const today = new Date();
    const defaultAppointments = [
      { 
        clientId: 1, 
        serviceId: 2, 
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0), 
        status: "confirmed" as const,
        notes: "",
        createdAt: new Date()
      },
      { 
        clientId: 2, 
        serviceId: 4, 
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0), 
        status: "pending" as const,
        notes: "",
        createdAt: new Date()
      },
      { 
        clientId: 3, 
        serviceId: 5, 
        date: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0), 
        status: "in_progress" as const,
        notes: "",
        createdAt: new Date()
      },
    ];

    defaultAppointments.forEach(appointment => {
      const id = this.currentAppointmentId++;
      this.appointments.set(id, { id, ...appointment });
    });
  }



  // Clients
  async getClients(): Promise<Client[]> {
    const result = await db
      .select()
      .from(clients)
      .orderBy(clients.name);
    return result;
  }

  async getClient(id: number): Promise<Client | undefined> {
    const result = await db
      .select()
      .from(clients)
      .where(eq(clients.id, id))
      .limit(1);
    return result[0];
  }

  async createClient(insertClient: InsertClient): Promise<Client> {
    const [client] = await db
      .insert(clients)
      .values(insertClient)
      .returning();
    return client;
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db
      .delete(clients)
      .where(eq(clients.id, id));
    return result.rowCount > 0;
  }

  // Services
  async getServices(): Promise<Service[]> {
    const result = await db
      .select()
      .from(services)
      .orderBy(services.name);
    return result;
  }

  async getService(id: number): Promise<Service | undefined> {
    const result = await db
      .select()
      .from(services)
      .where(eq(services.id, id))
      .limit(1);
    return result[0];
  }

  async createService(insertService: InsertService): Promise<Service> {
    const [service] = await db
      .insert(services)
      .values(insertService)
      .returning();
    return service;
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set(serviceData)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db
      .delete(services)
      .where(eq(services.id, id));
    return result.rowCount > 0;
  }

  // Appointments
  async getAppointments(date?: Date): Promise<AppointmentWithDetails[]> {
    let query = db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        status: appointments.status,
        notes: appointments.notes,
        notificationRead: appointments.notificationRead,
        createdAt: appointments.createdAt,
        client: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          emailConfirmed: users.emailConfirmed,
          confirmationToken: users.confirmationToken,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
          description: services.description,
        }
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.clientId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id));

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      query = query.where(
        sql`${appointments.date} >= ${startOfDay} AND ${appointments.date} <= ${endOfDay}`
      );
    }

    const result = await query.orderBy(appointments.date);
    
    return result.map(row => ({
      id: row.id,
      clientId: row.clientId,
      serviceId: row.serviceId,
      date: row.date,
      status: row.status,
      notes: row.notes,
      notificationRead: row.notificationRead,
      createdAt: row.createdAt,
      client: row.client as User,
      service: row.service as Service,
    }));
  }

  async getAppointment(id: number): Promise<AppointmentWithDetails | undefined> {
    const result = await db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        status: appointments.status,
        notes: appointments.notes,
        notificationRead: appointments.notificationRead,
        createdAt: appointments.createdAt,
        client: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          emailConfirmed: users.emailConfirmed,
          confirmationToken: users.confirmationToken,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
          description: services.description,
        }
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.clientId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      id: row.id,
      clientId: row.clientId,
      serviceId: row.serviceId,
      date: row.date,
      status: row.status,
      notes: row.notes,
      notificationRead: row.notificationRead,
      createdAt: row.createdAt,
      client: row.client as User,
      service: row.service as Service,
    };
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db
      .insert(appointments)
      .values(insertAppointment)
      .returning();

    // Create notification for new appointment and send WebSocket message
    try {
      const client = await this.getUser(insertAppointment.clientId);
      const service = await this.getService(insertAppointment.serviceId);
      const appointmentDate = new Date(insertAppointment.date);
      
      if (client && service) {
        await this.createNotification({
          type: 'new_appointment',
          title: 'Novo Agendamento',
          message: `${client.firstName} ${client.lastName} marcou ${service.name} para ${appointmentDate.toLocaleDateString('pt-BR')} às ${appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          appointmentId: appointment.id,
          read: false,
        });

        // Send WebSocket notification to barber
        this.sendWebSocketNotification({
          type: 'new_appointment',
          appointmentId: appointment.id,
          clientName: `${client.firstName} ${client.lastName}`,
          serviceName: service.name,
          date: appointmentDate.toLocaleDateString('pt-BR'),
          time: appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          message: `${client.firstName} ${client.lastName} marcou ${service.name} para ${appointmentDate.toLocaleDateString('pt-BR')} às ${appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.log("Erro ao criar notificação:", error);
    }

    // Confirmar automaticamente o agendamento
    const [confirmedAppointment] = await db
      .update(appointments)
      .set({ status: "confirmed" })
      .where(eq(appointments.id, appointment.id))
      .returning();

    return confirmedAppointment;
  }

  // WebSocket notification method
  private webSocketNotificationCallback: ((data: any) => void) | null = null;

  setWebSocketNotificationCallback(callback: (data: any) => void) {
    this.webSocketNotificationCallback = callback;
  }

  private sendWebSocketNotification(data: any) {
    if (this.webSocketNotificationCallback) {
      this.webSocketNotificationCallback(data);
    }
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id));
    return result.rowCount > 0;
  }

  async getAppointmentsByDateRange(startDate: Date, endDate: Date): Promise<AppointmentWithDetails[]> {
    const result = await db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        status: appointments.status,
        notes: appointments.notes,
        notificationRead: appointments.notificationRead,
        createdAt: appointments.createdAt,
        client: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          emailConfirmed: users.emailConfirmed,
          confirmationToken: users.confirmationToken,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        },
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
          description: services.description,
        }
      })
      .from(appointments)
      .leftJoin(users, eq(appointments.clientId, users.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(
        sql`${appointments.date} >= ${startDate} AND ${appointments.date} <= ${endDate}`
      )
      .orderBy(appointments.date);

    return result.map(row => ({
      id: row.id,
      clientId: row.clientId,
      serviceId: row.serviceId,
      date: row.date,
      status: row.status,
      notes: row.notes,
      notificationRead: row.notificationRead,
      createdAt: row.createdAt,
      client: row.client as User,
      service: row.service as Service,
    }));
  }

  async getDetailedStats(period: 'day' | 'week' | 'month' | 'year', date?: Date): Promise<{
    completedAppointments: number;
    totalRevenue: number;
    appointments: AppointmentWithDetails[];
  }> {
    const referenceDate = date || new Date();
    let startDate: Date;
    let endDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(referenceDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(referenceDate);
        const dayOfWeek = startDate.getDay();
        startDate.setDate(startDate.getDate() - dayOfWeek);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
        endDate = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 1);
        break;
      case 'year':
        startDate = new Date(referenceDate.getFullYear(), 0, 1);
        endDate = new Date(referenceDate.getFullYear() + 1, 0, 1);
        break;
    }

    // Buscar agendamentos completados no período
    const completedAppointments = await db
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        status: appointments.status,
        notes: appointments.notes,
        notificationRead: appointments.notificationRead,
        createdAt: appointments.createdAt,
        client: {
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImageUrl: users.profileImageUrl,
          emailConfirmed: users.emailConfirmed,
          createdAt: users.createdAt,
        },
        service: {
          id: services.id,
          name: services.name,
          price: services.price,
          duration: services.duration,
          description: services.description,
        }
      })
      .from(appointments)
      .innerJoin(users, eq(appointments.clientId, users.id))
      .innerJoin(services, eq(appointments.serviceId, services.id))
      .where(
        sql`${appointments.date} >= ${startDate} AND ${appointments.date} < ${endDate} AND ${appointments.status} = 'completed'`
      )
      .orderBy(appointments.date);

    // Calcular receita total
    const totalRevenue = completedAppointments.reduce((sum, apt) => {
      return sum + parseFloat(apt.service.price);
    }, 0);

    return {
      completedAppointments: completedAppointments.length,
      totalRevenue,
      appointments: completedAppointments
    };
  }

  async getStats(): Promise<{
    todayAppointments: number;
    monthlyRevenue: number;
    activeClients: number;
    occupancyRate: number;
  }> {
    try {
      const today = new Date();
      const startOfDay = new Date(today);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(today);
      endOfDay.setHours(23, 59, 59, 999);

      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

      // Count today's appointments
      const todayAppointmentsResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(appointments)
        .where(
          sql`DATE(${appointments.date}) = CURRENT_DATE`
        );
      const todayAppointments = todayAppointmentsResult[0]?.count || 0;

      // Calculate monthly revenue from completed appointments
      const monthlyRevenueResult = await db
        .select({
          total: sql<number>`COALESCE(SUM(CAST(${services.price} AS DECIMAL)), 0)`
        })
        .from(appointments)
        .leftJoin(services, eq(appointments.serviceId, services.id))
        .where(
          sql`${appointments.date} >= ${startOfMonth} AND ${appointments.date} <= ${endOfMonth} AND ${appointments.status} = 'completed'`
        );
      const monthlyRevenue = Number(monthlyRevenueResult[0]?.total || 0);

      // Count active clients (users who have appointments)
      const activeClientsResult = await db
        .select({ count: sql<number>`count(DISTINCT ${appointments.clientId})` })
        .from(appointments);
      const activeClients = activeClientsResult[0]?.count || 0;

      // Calculate occupancy rate (assuming 8 hours of work, 30 min slots = 16 slots per day)
      const totalSlotsToday = 16;
      const occupancyRate = Math.round((todayAppointments / totalSlotsToday) * 100);

      return {
        todayAppointments,
        monthlyRevenue,
        activeClients,
        occupancyRate,
      };
    } catch (error) {
      console.error('Error in getStats:', error);
      return {
        todayAppointments: 0,
        monthlyRevenue: 0,
        activeClients: 0,
        occupancyRate: 0,
      };
    }
  }

  // Barber Schedule Methods
  async getBarberSchedule(barberId: number): Promise<BarberSchedule[]> {
    const schedules = await db
      .select()
      .from(barberSchedule)
      .where(eq(barberSchedule.barberId, barberId))
      .orderBy(barberSchedule.dayOfWeek);
    return schedules;
  }

  async updateBarberSchedule(barberId: number, schedules: InsertBarberSchedule[]): Promise<BarberSchedule[]> {
    // Delete existing schedules for this barber
    await db.delete(barberSchedule).where(eq(barberSchedule.barberId, barberId));
    
    // Insert new schedules
    if (schedules.length > 0) {
      await db.insert(barberSchedule).values(schedules);
    }
    
    // Return updated schedules
    return this.getBarberSchedule(barberId);
  }

  async getAvailableTimeSlots(date: Date): Promise<string[]> {
    const dayOfWeek = date.getDay();
    
    // Get barber schedule for this day (assuming barberId = 1 for now)
    const schedules = await db
      .select()
      .from(barberSchedule)
      .where(eq(barberSchedule.barberId, 1));
    
    const schedule = schedules.find(s => 
      s.dayOfWeek === dayOfWeek && s.isWorking
    );

    if (!schedule || !schedule.startTime || !schedule.endTime) {
      return [];
    }

    // Generate time slots between start and end time
    const timeSlots: string[] = [];
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    let currentHour = startHour;
    let currentMinute = startMinute;
    
    while (currentHour < endHour || (currentHour === endHour && currentMinute < endMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      timeSlots.push(timeString);
      
      // Add 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour += 1;
      }
    }

    // Get existing appointments for this date to filter out booked slots
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const bookedAppointments = await db
      .select()
      .from(appointments)
      .where(
        sql`${appointments.date} >= ${dayStart} AND ${appointments.date} <= ${dayEnd} AND ${appointments.status} != 'cancelled'`
      );

    const bookedSlots = bookedAppointments.map(apt => {
      const hour = apt.date.getHours().toString().padStart(2, '0');
      const minute = apt.date.getMinutes().toString().padStart(2, '0');
      return `${hour}:${minute}`;
    });

    return timeSlots.filter(slot => !bookedSlots.includes(slot));
  }

  // Notifications
  async getNotifications(): Promise<Notification[]> {
    const result = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50);
    return result;
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(notificationData)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, id));
    return result.rowCount > 0;
  }

  async getUnreadNotificationsCount(): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(eq(notifications.read, false));
    return result[0]?.count || 0;
  }
}

export const storage = new DatabaseStorage();