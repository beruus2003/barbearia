import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import logoPath from "@assets/Logo Barbearia Rodrigues.pdf.png";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useLocation } from "wouter";

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, "Email ou nome de usuário é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, navigate] = useLocation();
  
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: "",
      password: "",
    },
  });

  const onLoginSubmit = async (data: LoginForm) => {
    try {
      // Detectar se é email ou username
      const isEmail = data.emailOrUsername.includes("@");
      const requestBody = isEmail ? 
        { email: data.emailOrUsername, password: data.password } :
        { username: data.emailOrUsername, password: data.password };

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("Login response:", result); // Debug
        // Redirecionar baseado no tipo de usuário
        if (result.user && result.user.userType === "barber") {
          navigate("/barber-dashboard");
        } else if (result.user && result.user.userType === "client") {
          navigate("/client-dashboard");
        } else {
          // Fallback: tentar detectar pelo conteúdo da resposta
          if (result.user && result.user.username) {
            navigate("/barber-dashboard");
          } else {
            navigate("/client-dashboard");
          }
        }
      } else {
        const error = await response.json();
        alert(error.message || "Erro ao fazer login");
      }
    } catch (error) {
      alert("Erro ao conectar com o servidor");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border border-gray-200">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-black mb-6">
              Seja Bem-vindo a Barbearia Rodrigues
            </h1>
            
            {/* Logo da Barbearia Rodrigues */}
            <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center">
              <img 
                src={logoPath} 
                alt="Logo Barbearia Rodrigues" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Login Form */}
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-6">
              <FormField
                control={loginForm.control}
                name="emailOrUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Email ou Nome de Usuário
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Digite seu email ou nome de usuário"
                        className="h-12 bg-white text-black border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={field.disabled}
                        autoComplete="username"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Senha
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Digite sua senha"
                        className="h-12 bg-white text-black border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        disabled={field.disabled}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-lg"
              >
                Entrar
              </Button>
            </form>
          </Form>

          {/* Toggle to Register */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              Não tem uma conta?{" "}
              <button
                onClick={() => navigate("/request-registration")}
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Solicitar Cadastro
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}