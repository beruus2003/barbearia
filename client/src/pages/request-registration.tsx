import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import { ArrowLeft, UserPlus, CheckCircle } from "lucide-react";

const requestSchema = z.object({
  firstName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  lastName: z.string().min(2, "Sobrenome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
});

type RequestForm = z.infer<typeof requestSchema>;

export default function RequestRegistration() {
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const form = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const onSubmit = async (data: RequestForm) => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/auth/request-registration", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setIsSuccess(true);
        toast({
          title: "Solicitação enviada!",
          description: "O barbeiro receberá sua solicitação em breve.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Erro",
          description: error.message || "Não foi possível enviar a solicitação",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao conectar com o servidor",
        variant: "destructive",
      });
    }
    setIsSubmitting(false);
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Solicitação Enviada!
              </h2>
              <p className="text-gray-600 mb-6">
                Sua solicitação de cadastro foi enviada para o barbeiro. Em breve você receberá um código de confirmação para completar seu cadastro.
              </p>
              <div className="space-y-3">
                <Button 
                  onClick={() => setLocation("/register")}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Continuar com o Cadastro
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setLocation("/")}
                  className="w-full"
                >
                  Voltar ao Início
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <style jsx>{`
        .custom-button {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
          color: white !important;
        }
        .custom-button:hover {
          background-color: #1d4ed8 !important;
          border-color: #1d4ed8 !important;
        }
        .custom-button:focus {
          box-shadow: 0 0 0 2px #93c5fd !important;
        }
      `}</style>
      <Card className="w-full max-w-md bg-white border border-gray-200">
        <CardHeader>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-800 hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <UserPlus className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Solicitar Cadastro
          </CardTitle>
          <p className="text-gray-600">
            Preencha seus dados para solicitar um código de cadastro
          </p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Nome</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Seu nome" 
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                    <FormLabel className="text-gray-700">Sobrenome</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Seu sobrenome" 
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700">Email</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="seu@email.com" 
                        className="bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <button
                type="submit"
                className="custom-button w-full h-12 rounded-md font-medium transition-all duration-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Solicitar Código de Cadastro"}
              </button>
            </form>
          </Form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem um código de confirmação?{" "}
              <Link href="/register" className="text-blue-600 hover:text-blue-700 hover:underline">
                Cadastre-se aqui
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}