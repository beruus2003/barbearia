import { pgTable, text, serial, integer, boolean, timestamp, decimal, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  lastVisit: timestamp("last_visit"),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  duration: integer("duration").notNull(), // em minutos
  description: text("description"),
});

export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: text("client_id").notNull(), // referencia ao user.id do cliente
  serviceId: integer("service_id").notNull(),
  date: timestamp("date").notNull(),
  status: text("status").notNull().default("pending"), // pending, confirmed, in_progress, completed, cancelled
  notes: text("notes"),
  notificationRead: boolean("notification_read").default(false), // para o barbeiro saber se já viu
  createdAt: timestamp("created_at").defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for authentication (only clients)
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").unique().notNull(),
  password: text("password"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileImageUrl: text("profile_image_url"),
  emailConfirmed: boolean("email_confirmed").default(false),
  confirmationToken: text("confirmation_token"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Barber table (fixed barber login)
export const barbers = pgTable("barbers", {
  id: serial("id").primaryKey(),
  username: text("username").unique().notNull(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Client confirmation codes table
export const confirmationCodes = pgTable("confirmation_codes", {
  id: serial("id").primaryKey(),
  code: text("code").unique().notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Barber schedule configuration table
export const barberSchedule = pgTable("barber_schedule", {
  id: serial("id").primaryKey(),
  barberId: integer("barber_id").notNull().references(() => barbers.id),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Domingo, 1 = Segunda, etc.
  isWorking: boolean("is_working").default(true),
  startTime: text("start_time"), // "09:00"
  endTime: text("end_time"), // "18:00"
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'new_appointment', 'appointment_cancelled', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  appointmentId: integer("appointment_id").references(() => appointments.id),
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  lastVisit: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
}).extend({
  date: z.string().transform((str) => new Date(str)),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
});

export const insertBarberSchema = createInsertSchema(barbers).omit({
  id: true,
  createdAt: true,
});

export const insertConfirmationCodeSchema = createInsertSchema(confirmationCodes).omit({
  id: true,
  createdAt: true,
});

export const insertBarberScheduleSchema = createInsertSchema(barberSchedule).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)").optional(),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)").optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = typeof users.$inferInsert;

export type Barber = typeof barbers.$inferSelect;
export type InsertBarber = z.infer<typeof insertBarberSchema>;

export type ConfirmationCode = typeof confirmationCodes.$inferSelect;
export type InsertConfirmationCode = z.infer<typeof insertConfirmationCodeSchema>;

export type BarberSchedule = typeof barberSchedule.$inferSelect;
export type InsertBarberSchedule = z.infer<typeof insertBarberScheduleSchema>;

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;

// Appointment with related data
export type AppointmentWithDetails = Appointment & {
  client: User; // agora usamos User ao invés de Client
  service: Service;
};