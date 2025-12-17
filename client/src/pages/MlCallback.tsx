import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function MlCallback() {
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  const exchangeCodeMutation = trpc.mercadoLivre.exchangeCode.useMutation({
    onSuccess: () => {
      setStatus("success");
      toast.success("Conta do Mercado Livre conectada com sucesso!");
      setTimeout(() => {
        setLocation("/mercado-livre");
      }, 2000);
    },
    onError: (error) => {
      setStatus("error");
      setErrorMessage(error.message || "Erro ao conectar conta");
      toast.error(error.message || "Erro ao conectar conta");
    },
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");
    const state = urlParams.get("state");
    const error = urlParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMessage(urlParams.get("error_description") || "Autorização negada");
      return;
    }

    if (!code) {
      setStatus("error");
      setErrorMessage("Código de autorização não encontrado");
      return;
    }

    // Verify state if stored
    const storedState = localStorage.getItem("ml_oauth_state");
    if (storedState && state !== storedState) {
      setStatus("error");
      setErrorMessage("Estado de verificação inválido");
      return;
    }

    // Clear stored state
    localStorage.removeItem("ml_oauth_state");

    // Exchange code for token
    const redirectUri = `${window.location.origin}/ml-callback`;
    exchangeCodeMutation.mutate({ code, redirectUri });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            {status === "loading" && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === "success" && <CheckCircle2 className="h-6 w-6 text-green-500" />}
            {status === "error" && <XCircle className="h-6 w-6 text-red-500" />}
            {status === "loading" && "Conectando..."}
            {status === "success" && "Conectado!"}
            {status === "error" && "Erro na Conexão"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Aguarde enquanto conectamos sua conta do Mercado Livre..."}
            {status === "success" && "Sua conta foi conectada com sucesso. Redirecionando..."}
            {status === "error" && errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === "error" && (
            <button
              onClick={() => setLocation("/mercado-livre")}
              className="text-primary underline hover:no-underline"
            >
              Voltar para configurações
            </button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
