import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Home from "@/pages/home";
import ClientDashboard from "@/pages/client-dashboard";
import BarberDashboard from "@/pages/barber-dashboard";
import BookAppointment from "@/pages/book-appointment";
import ConfirmEmail from "@/pages/confirm-email";
import VerifyCode from "@/pages/verify-code";
import Register from "@/pages/register";
import RequestRegistration from "@/pages/request-registration";
import ScheduleSettings from "@/pages/schedule-settings";
import Notifications from "@/pages/notifications";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Login} />
      <Route path="/login" component={Login} />
      <Route path="/verify-code" component={VerifyCode} />
      <Route path="/register" component={Register} />
      <Route path="/request-registration" component={RequestRegistration} />
      <Route path="/home" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/client-dashboard" component={ClientDashboard} />
      <Route path="/barber-dashboard" component={BarberDashboard} />
      <Route path="/book-appointment" component={BookAppointment} />
      <Route path="/schedule-settings" component={ScheduleSettings} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/confirm-email" component={ConfirmEmail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
