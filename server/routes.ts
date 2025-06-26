import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertClientSchema, insertServiceSchema, insertAppointmentSchema, insertUserSchema, insertBarberScheduleSchema } from "@shared/schema";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import session from "express-session";

// Extend session types
declare module 'express-session' {
  interface SessionData {
    userId?: string;
    barberId?: string;
    userType?: 'client' | 'barber';
  }
}

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback'
);

let barberWebSocketConnection: WebSocket | null = null;

export async function registerRoutes(app: Express): Promise<Server> {
  const server = createServer(app);
  
  // WebSocket server setup
  const wss = new WebSocketServer({ server, path: '/ws' });
  
  wss.on('connection', (ws) => {
    console.log('WebSocket connection established');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        if (data.type === 'barber_connect') {
          barberWebSocketConnection = ws;
          console.log('Barber connected to WebSocket');
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });
    
    ws.on('close', () => {
      if (ws === barberWebSocketConnection) {
        barberWebSocketConnection = null;
        console.log('Barber disconnected from WebSocket');
      }
    });
  });

  // Session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'barbershop-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // set to true if using HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: 'lax'
    }
  }));

  // Initialize barber on startup
  await storage.initializeBarber();

  // Authentication routes
  
  // New endpoint for registration request (sends notification to barber)
  app.post("/api/auth/request-registration", async (req, res) => {
    try {
      const { email, firstName, lastName } = req.body;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Este email já está cadastrado" });
      }

      // Generate confirmation code automatically
      const code = await storage.generateConfirmationCode();
      
      // Send notification to barber via WebSocket
      if (barberWebSocketConnection && barberWebSocketConnection.readyState === WebSocket.OPEN) {
        const notification = {
          type: 'registration_request',
          message: `${firstName} ${lastName} está tentando se cadastrar como cliente`,
          code: code,
          email: email,
          fullName: `${firstName} ${lastName}`,
          timestamp: new Date().toISOString()
        };
        
        barberWebSocketConnection.send(JSON.stringify(notification));
      }

      res.json({ 
        message: "Solicitação de cadastro enviada! O barbeiro receberá seu código em breve.",
        success: true
      });
    } catch (error) {
      console.error("Error requesting registration:", error);
      res.status(500).json({ message: "Erro ao solicitar cadastro" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, firstName, lastName, confirmationCode } = req.body;

      // Validate confirmation code first
      if (!confirmationCode) {
        return res.status(400).json({ message: "Código de confirmação é obrigatório" });
      }

      const isValidCode = await storage.validateConfirmationCode(confirmationCode);
      if (!isValidCode) {
        return res.status(400).json({ message: "Código de confirmação inválido ou já usado" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Usuário já existe" });
      }

      const user = await storage.createUser({ email, password, firstName, lastName });
      res.status(201).json({ message: "Usuário criado com sucesso! Verifique seu email para confirmar a conta." });
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Erro ao criar usuário" });
    }
  });

  // Route for barber to generate confirmation codes
  app.post("/api/auth/generate-code", async (req, res) => {
    try {
      // Check if user is authenticated as barber
      if (!req.session.barberId || req.session.userType !== 'barber') {
        return res.status(403).json({ message: "Acesso negado. Apenas barbeiros podem gerar códigos." });
      }

      const code = await storage.generateConfirmationCode();
      res.json({ code });
    } catch (error) {
      console.error("Error generating confirmation code:", error);
      res.status(500).json({ message: "Erro ao gerar código de confirmação" });
    }
  });

  // Route for barber to get unused confirmation codes
  app.get("/api/auth/confirmation-codes", async (req, res) => {
    try {
      // Check if user is authenticated as barber
      if (!req.session.barberId || req.session.userType !== 'barber') {
        return res.status(403).json({ message: "Acesso negado. Apenas barbeiros podem visualizar códigos." });
      }

      const codes = await storage.getUnusedConfirmationCodes();
      res.json(codes);
    } catch (error) {
      console.error("Error getting confirmation codes:", error);
      res.status(500).json({ message: "Erro ao buscar códigos de confirmação" });
    }
  });

  // Route for clients to verify confirmation code before registration
  app.post("/api/auth/verify-code", async (req, res) => {
    try {
      const { code } = req.body;

      if (!code) {
        return res.status(400).json({ message: "Código é obrigatório" });
      }

      // Check if code exists and is unused (without marking as used)
      const codes = await storage.getUnusedConfirmationCodes();
      const validCode = codes.find(c => c.code === code);

      if (!validCode) {
        return res.status(400).json({ message: "Código inválido ou já usado" });
      }

      res.json({ message: "Código válido", valid: true });
    } catch (error) {
      console.error("Error verifying confirmation code:", error);
      res.status(500).json({ message: "Erro ao verificar código" });
    }
  });

  // Rota temporária para confirmar email manualmente (para testes)
  app.post("/api/auth/confirm-email-manual", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email não fornecido" });
      }

      // Confirmar email diretamente no banco
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Atualizar status de confirmação
      await storage.confirmEmail(user.confirmationToken || "fake-token");
      
      res.json({ message: "Email confirmado com sucesso!" });
    } catch (error) {
      console.error("Error confirming email manually:", error);
      res.status(500).json({ message: "Erro ao confirmar email" });
    }
  });

  app.get("/api/auth/confirm-email", async (req, res) => {
    try {
      const { token } = req.query;

      if (!token) {
        return res.status(400).send("Token de confirmação não fornecido");
      }

      const confirmed = await storage.confirmEmail(token as string);

      if (confirmed) {
        res.redirect('/confirm-email?status=success');
      } else {
        res.redirect('/confirm-email?status=error');
      }
    } catch (error) {
      console.error("Error confirming email:", error);
      res.status(500).send("Erro interno do servidor");
    }
  });

  app.post("/api/auth/resend-confirmation", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email é obrigatório" });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      if (user.emailConfirmed) {
        return res.status(400).json({ message: "Email já foi confirmado" });
      }

      const newToken = await storage.regenerateConfirmationToken(email);
      if (newToken) {
        res.json({ message: "Novo email de confirmação enviado com sucesso!" });
      } else {
        res.status(500).json({ message: "Erro ao enviar novo email de confirmação" });
      }
    } catch (error) {
      console.error("Error resending confirmation email:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      // Check if it's a barber login (username provided)
      if (username) {
        const barber = await storage.loginBarber(username, password);
        if (barber) {
          req.session.barberId = barber.id.toString();
          req.session.userType = 'barber';
          return res.json({ 
            message: "Login realizado com sucesso", 
            user: { id: barber.id, username: barber.username, name: barber.name, userType: 'barber' } 
          });
        } else {
          return res.status(401).json({ message: "Credenciais inválidas" });
        }
      }

      // Client login (email provided)
      if (email) {
        const user = await storage.loginUser(email, password);
        if (user) {
          if (!user.emailConfirmed) {
            return res.status(403).json({ message: "Por favor, confirme seu email antes de fazer login" });
          }

          req.session.userId = user.id;
          req.session.userType = 'client';
          return res.json({ 
            message: "Login realizado com sucesso", 
            user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, userType: 'client' } 
          });
        }
      }

      res.status(401).json({ message: "Credenciais inválidas" });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/auth/google", (req, res) => {
    const authUrl = googleClient.generateAuthUrl({
      access_type: 'offline',
      scope: ['profile', 'email'],
    });
    res.json({ authUrl });
  });

  app.post("/api/auth/google/callback", async (req, res) => {
    try {
      const { code } = req.body;
      const { tokens } = await googleClient.getToken(code);
      googleClient.setCredentials(tokens);

      const ticket = await googleClient.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      if (payload) {
        const userData = {
          id: payload.sub,
          email: payload.email,
          firstName: payload.given_name,
          lastName: payload.family_name,
          profileImageUrl: payload.picture,
        };

        const user = await storage.upsertUser(userData);
        req.session.userId = user.id;
        res.json({ message: "Login com Google realizado com sucesso", user });
      }
    } catch (error) {
      res.status(500).json({ message: "Erro ao fazer login com Google" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      // Check if it's a barber session
      if (req.session.barberId && req.session.userType === 'barber') {
        const barber = await storage.getBarberByUsername("tiagorodrigues47");
        if (barber) {
          return res.json({
            id: barber.id,
            username: barber.username,
            name: barber.name,
            userType: 'barber'
          });
        }
      }

      // Check if it's a client session
      if (req.session.userId && req.session.userType === 'client') {
        const user = await storage.getUser(req.session.userId);
        if (user) {
          return res.json({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            userType: 'client'
          });
        }
      }

      res.status(401).json({ message: "Não autenticado" });
    } catch (error) {
      console.error("Error in /api/auth/me:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  // Stats endpoint
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar estatísticas" });
    }
  });

  app.get("/api/stats/detailed", async (req, res) => {
    try {
      const { period, date } = req.query;
      if (!period || !['day', 'week', 'month', 'year'].includes(period as string)) {
        return res.status(400).json({ error: "Período inválido. Use: day, week, month, year" });
      }
      
      const referenceDate = date ? new Date(date as string) : undefined;
      const stats = await storage.getDetailedStats(period as 'day' | 'week' | 'month' | 'year', referenceDate);
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Clients endpoints
  app.get("/api/clients", async (req, res) => {
    try {
      const clients = await storage.getClients();
      res.json(clients);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar clientes" });
    }
  });

  app.get("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar cliente" });
    }
  });

  app.post("/api/clients", async (req, res) => {
    try {
      const clientData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(clientData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar cliente" });
    }
  });

  app.put("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const clientData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, clientData);
      if (!client) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar cliente" });
    }
  });

  app.delete("/api/clients/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Cliente não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar cliente" });
    }
  });

  // Services endpoints
  app.get("/api/services", async (req, res) => {
    try {
      const services = await storage.getServices();
      res.json(services);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviços" });
    }
  });

  app.get("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const service = await storage.getService(id);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      res.json(service);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar serviço" });
    }
  });

  app.post("/api/services", async (req, res) => {
    try {
      const serviceData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(serviceData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar serviço" });
    }
  });

  app.put("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const serviceData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, serviceData);
      if (!service) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar serviço" });
    }
  });

  app.delete("/api/services/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(404).json({ message: "Serviço não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar serviço" });
    }
  });

  // Appointments endpoints
  app.get("/api/appointments", async (req, res) => {
    try {
      const { date } = req.query;
      const queryDate = date ? new Date(date as string) : undefined;
      const appointments = await storage.getAppointments(queryDate);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamentos" });
    }
  });

  app.get("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointment(id);
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamento" });
    }
  });

  app.post("/api/appointments", async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      
      // Send WebSocket notification if barber is connected
      if (barberWebSocketConnection && barberWebSocketConnection.readyState === WebSocket.OPEN) {
        try {
          const client = await storage.getUser(appointmentData.clientId);
          const service = await storage.getService(appointmentData.serviceId);
          const appointmentDate = new Date(appointmentData.date);
          
          if (client && service) {
            const notificationData = {
              type: 'new_appointment',
              appointmentId: appointment.id,
              clientName: `${client.firstName} ${client.lastName}`,
              serviceName: service.name,
              date: appointmentDate.toLocaleDateString('pt-BR'),
              time: appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              message: `${client.firstName} ${client.lastName} marcou horário para as ${appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`,
              timestamp: new Date().toISOString(),
            };
            
            barberWebSocketConnection.send(JSON.stringify(notificationData));
          }
        } catch (wsError) {
          console.error('Erro ao enviar notificação WebSocket:', wsError);
        }
      }
      
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao criar agendamento" });
    }
  });

  app.put("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, appointmentData);
      if (!appointment) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar agendamento" });
    }
  });

  app.delete("/api/appointments/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAppointment(id);
      if (!success) {
        return res.status(404).json({ message: "Agendamento não encontrado" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Erro ao deletar agendamento" });
    }
  });

  app.get("/api/appointments/range/:startDate/:endDate", async (req, res) => {
    try {
      const startDate = new Date(req.params.startDate);
      const endDate = new Date(req.params.endDate);
      const appointments = await storage.getAppointmentsByDateRange(startDate, endDate);
      res.json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar agendamentos por período" });
    }
  });

  // Barber schedule endpoints
  app.get("/api/barber/schedule/:barberId", async (req, res) => {
    try {
      const barberId = parseInt(req.params.barberId);
      const schedule = await storage.getBarberSchedule(barberId);
      res.json(schedule);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários do barbeiro" });
    }
  });

  app.put("/api/barber/schedule/:barberId", async (req, res) => {
    try {
      const barberId = parseInt(req.params.barberId);
      const schedules = z.array(insertBarberScheduleSchema).parse(req.body);
      const updatedSchedule = await storage.updateBarberSchedule(barberId, schedules);
      res.json(updatedSchedule);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro ao atualizar horários do barbeiro" });
    }
  });

  app.get("/api/available-slots/:date", async (req, res) => {
    try {
      const date = new Date(req.params.date);
      const slots = await storage.getAvailableTimeSlots(date);
      res.json(slots);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar horários disponíveis" });
    }
  });

  // Notifications endpoints
  app.get("/api/notifications", async (req, res) => {
    try {
      const notifications = await storage.getNotifications();
      res.json(notifications);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar notificações" });
    }
  });

  app.get("/api/notifications/unread-count", async (req, res) => {
    try {
      const count = await storage.getUnreadNotificationsCount();
      res.json(count);
    } catch (error) {
      res.status(500).json({ message: "Erro ao buscar contagem de notificações" });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markNotificationAsRead(id);
      if (!success) {
        return res.status(404).json({ message: "Notificação não encontrada" });
      }
      res.json({ message: "Notificação marcada como lida" });
    } catch (error) {
      res.status(500).json({ message: "Erro ao marcar notificação como lida" });
    }
  });

  return server;
}