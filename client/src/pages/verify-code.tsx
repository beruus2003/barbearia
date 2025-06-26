import { useState } from "react";
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

const codeSchema = z.object({
  code: z.string().min(1, "Código é obrigatório"),
});

type CodeForm = z.infer<typeof codeSchema>;

export default function VerifyCode() {
  const [, navigate] = useLocation();
  const [error, setError] = useState<string>("");
  
  const form = useForm<CodeForm>({
    resolver: zodResolver(codeSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSubmit = async (data: CodeForm) => {
    setError("");
    try {
      // Verificar código com o backend
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        // Código válido, redirecionar para registro com código
        navigate(`/register?code=${data.code}`);
      } else {
        const error = await response.json();
        setError(error.message || "Código inválido");
      }
    } catch (error) {
      setError("Erro ao verificar código");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white shadow-lg border border-gray-200">
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              Código de Confirmação
            </h1>
            <h2 className="text-lg text-gray-600 mb-6">
              Insira o código fornecido pelo barbeiro
            </h2>
            <h3 className="text-3xl font-bold text-black mb-6">
              Seja Bem-vindo a Barbearia Rodrigues
            </h3>
            
            {/* Logo da Barbearia Rodrigues */}
            <div className="w-24 h-24 mx-auto mb-8 flex items-center justify-center">
              <img 
                src={logoPath} 
                alt="Logo Barbearia Rodrigues" 
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Código de Confirmação
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o código"
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
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg"
              >
                Verificar Código
              </Button>
            </form>
          </Form>

          {/* Back to Login */}
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