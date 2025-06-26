import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ConfirmEmail() {
  const [location, navigate] = useLocation();
  const [status, setStatus] = useState<"waiting" | "confirming" | "success" | "error">("waiting");
  const [message, setMessage] = useState("");

  // Extrair parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get("token");
  const statusParam = urlParams.get("status");

  useEffect(() => {
    if (statusParam === "success") {
      setStatus("success");
      setMessage("Email confirmado com sucesso!");
      // Redirecionar para o dashboard após 3 segundos
      setTimeout(() => {
        navigate("/dashboard");
      }, 3000);
    } else if (statusParam === "error") {
      setStatus("error");
      setMessage("Token inválido ou expirado. Tente se cadastrar novamente.");
    } else if (token) {
      confirmEmail(token);
    }
  }, [token, statusParam]);

  const confirmEmail = async (confirmToken: string) => {
    setStatus("confirming");
    try {
      const response = await fetch(`/api/auth/confirm-email?token=${confirmToken}`, {
        method: "GET",
      });
      
      if (response.ok) {
        setStatus("success");
        setMessage("Email confirmado com sucesso!");
        // Redirecionar para o dashboard após 3 segundos
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      } else {
        setStatus("error");
        setMessage("Token inválido ou expirado. Tente se cadastrar novamente.");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Erro ao confirmar email. Tente novamente.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "waiting" && <Mail className="h-16 w-16 text-blue-500" />}
            {status === "confirming" && <Mail className="h-16 w-16 text-blue-500 animate-pulse" />}
            {status === "success" && <CheckCircle className="h-16 w-16 text-green-500" />}
            {status === "error" && <AlertCircle className="h-16 w-16 text-red-500" />}
          </div>
          <CardTitle className="text-2xl font-bold">
            {status === "waiting" && "Confirme Seu Email"}
            {status === "confirming" && "Confirmando..."}
            {status === "success" && "Email Confirmado!"}
            {status === "error" && "Erro na Confirmação"}
          </CardTitle>
          <CardDescription>
            {status === "waiting" && !token && "Verifique seu email e clique no link de confirmação"}
            {status === "confirming" && "Processando sua confirmação..."}
            {status === "success" && "Redirecionando para o painel..."}
            {status === "error" && message}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === "waiting" && !token && (
            <>
              <p className="text-gray-600">
                Enviamos um email de confirmação para o endereço que você cadastrou.
              </p>
              <p className="text-sm text-gray-500">
                Não recebeu? Verifique sua caixa de spam ou tente se cadastrar novamente.
              </p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate("/login")}
                  className="w-full"
                >
                  Voltar ao Login
                </Button>
                <Button 
                  onClick={() => {
                    // Simular confirmação para teste
                    setStatus("success");
                    setMessage("Email confirmado com sucesso!");
                    setTimeout(() => {
                      navigate("/dashboard");
                    }, 2000);
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Confirmar Email (Teste)
                </Button>
              </div>
            </>
          )}
          
          {status === "success" && (
            <div className="space-y-4">
              <p className="text-green-600 font-medium">
                Sua conta foi ativada com sucesso!
              </p>
              <p className="text-sm text-gray-600">
                Você será redirecionado automaticamente em alguns segundos...
              </p>
              <Button 
                onClick={() => navigate("/dashboard")}
                className="w-full"
              >
                Ir para o Painel
              </Button>
            </div>
          )}
          
          {status === "error" && (
            <div className="space-y-4">
              <Button 
                variant="outline" 
                onClick={() => navigate("/login")}
                className="w-full"
              >
                Tentar Novamente
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}