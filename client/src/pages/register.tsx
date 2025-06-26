import { useState, useEffect } from "react";
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

const registerSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  firstName: z.string().min(1, "Nome é obrigatório"),
  lastName: z.string().min(1, "Sobrenome é obrigatório"),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [, navigate] = useLocation();
  const [confirmationCode, setConfirmationCode] = useState<string>("");
  
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      firstName: "",
      lastName: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    // Get confirmation code from URL params
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (!code) {
      // Redirect to verify code page if no code
      navigate('/verify-code');
    } else {
      setConfirmationCode(code);
    }
  }, [navigate]);

  const onSubmit = async (data: RegisterForm) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...data, confirmationCode }),
      });

      if (response.ok) {
        alert("Usuário criado com sucesso! Verifique seu email para confirmar a conta.");
        navigate("/login");
      } else {
        const error = await response.json();
        alert(error.message || "Erro ao criar usuário");
      }
    } catch (error) {
      alert("Erro ao criar usuário");
    }
  };

  if (!confirmationCode) {
    return null; // Will redirect to verify-code
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border border-gray-200">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Criar Conta
            </h1>
            <h2 className="text-3xl font-bold text-black mb-6">
              Seja Bem-vindo a Barbearia Rodrigues
            </h2>
            
            {/* Logo da Barbearia Rodrigues */}
            <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center">
              <img 
                src={logoPath} 
                alt="Logo Barbearia Rodrigues" 
                className="w-full h-full object-contain"
              />
            </div>

            {/* Show confirmation code */}
            <div className="mb-4 p-2 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
              Código confirmado: {confirmationCode}
            </div>
          </div>

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Nome
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu nome"
                          className="h-12 bg-white text-black border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Sobrenome
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Seu sobrenome"
                          className="h-12 bg-white text-black border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Digite seu email"
                        className="h-12 bg-white text-black border-gray-300 focus:border-blue-500 focus:ring-blue-500 placeholder:text-gray-400"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
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
                        {...field}
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
                Criar Conta
              </Button>
            </form>
          </Form>

          {/* Toggle to Login */}
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">
              Já tem uma conta?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-600 hover:text-blue-700 font-semibold underline"
              >
                Fazer Login
              </button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}