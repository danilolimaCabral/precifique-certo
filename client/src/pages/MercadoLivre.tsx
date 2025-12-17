import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Link2, 
  Unlink, 
  RefreshCw, 
  Settings, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ExternalLink,
  Loader2,
  ArrowRight,
  Info
} from "lucide-react";
import { toast } from "sonner";

export default function MercadoLivre() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showCredentials, setShowCredentials] = useState(false);

  const utils = trpc.useUtils();
  const { data: status, isLoading: statusLoading } = trpc.mercadoLivre.getStatus.useQuery();
  
  const saveCredentialsMutation = trpc.mercadoLivre.saveCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credenciais salvas com sucesso!");
      utils.mercadoLivre.getStatus.invalidate();
      setShowCredentials(false);
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao salvar credenciais");
    },
  });

  const disconnectMutation = trpc.mercadoLivre.disconnect.useMutation({
    onSuccess: () => {
      toast.success("Conta desconectada com sucesso!");
      utils.mercadoLivre.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao desconectar");
    },
  });

  const deleteCredentialsMutation = trpc.mercadoLivre.deleteCredentials.useMutation({
    onSuccess: () => {
      toast.success("Credenciais removidas com sucesso!");
      utils.mercadoLivre.getStatus.invalidate();
      setClientId("");
      setClientSecret("");
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover credenciais");
    },
  });

  const syncMutation = trpc.mercadoLivre.syncCommissions.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.updated} marketplace(s) atualizado(s)!`);
      utils.marketplaces.list.invalidate();
      utils.mercadoLivre.getStatus.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao sincronizar comissões");
    },
  });

  const handleSaveCredentials = () => {
    if (!clientId.trim() || !clientSecret.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    saveCredentialsMutation.mutate({ clientId, clientSecret });
  };

  const handleConnect = async () => {
    // Get the authorization URL and redirect user
    const redirectUri = `${window.location.origin}/ml-callback`;
    try {
      const result = await utils.mercadoLivre.getAuthUrl.fetch({ redirectUri });
      if (result?.url) {
        // Store state for verification
        localStorage.setItem("ml_oauth_state", result.state);
        window.location.href = result.url;
      }
    } catch (error: any) {
      toast.error(error.message || "Erro ao obter URL de autorização");
    }
  };

  const handleSync = () => {
    syncMutation.mutate({ referencePrice: 100 });
  };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integração Mercado Livre</h1>
        <p className="text-muted-foreground mt-2">
          Conecte sua conta do Mercado Livre para sincronizar automaticamente as comissões da plataforma.
        </p>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <img 
                  src="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.6.73/mercadolibre/logo_large_25years@2x.png" 
                  alt="Mercado Livre" 
                  className="h-8"
                />
                Status da Integração
              </CardTitle>
              <CardDescription>
                Gerencie sua conexão com o Mercado Livre
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {status?.isConnected ? (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Conectado
                </Badge>
              ) : status?.isConfigured ? (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Configurado
                </Badge>
              ) : (
                <Badge variant="outline">
                  <XCircle className="h-3 w-3 mr-1" />
                  Não configurado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status?.lastSyncAt && (
            <p className="text-sm text-muted-foreground">
              Última sincronização: {new Date(status.lastSyncAt).toLocaleString("pt-BR")}
            </p>
          )}

          <div className="flex flex-wrap gap-2">
            {status?.isConnected && (
              <>
                <Button onClick={handleSync} disabled={syncMutation.isPending}>
                  {syncMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Sincronizar Comissões
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  <Unlink className="h-4 w-4 mr-2" />
                  Desconectar
                </Button>
              </>
            )}
            {status?.isConfigured && !status?.isConnected && (
              <Button onClick={handleConnect}>
                <Link2 className="h-4 w-4 mr-2" />
                Conectar Conta
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => setShowCredentials(!showCredentials)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showCredentials ? "Ocultar" : "Configurar"} Credenciais
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Credentials Form */}
      {showCredentials && (
        <Card>
          <CardHeader>
            <CardTitle>Credenciais do Aplicativo</CardTitle>
            <CardDescription>
              Configure as credenciais do seu aplicativo no Mercado Livre
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Como obter as credenciais</AlertTitle>
              <AlertDescription className="mt-2 space-y-2">
                <p>1. Acesse o <a href="https://developers.mercadolivre.com.br/devcenter" target="_blank" rel="noopener noreferrer" className="text-primary underline">DevCenter do Mercado Livre</a></p>
                <p>2. Crie um novo aplicativo ou use um existente</p>
                <p>3. Copie o <strong>Client ID</strong> e <strong>Client Secret</strong></p>
                <p>4. Configure a URI de redirecionamento como: <code className="bg-muted px-1 rounded">{window.location.origin}/ml-callback</code></p>
              </AlertDescription>
            </Alert>

            <div className="grid gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID (App ID)</Label>
                <Input
                  id="clientId"
                  placeholder="Digite o Client ID do seu aplicativo"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  placeholder="Digite o Client Secret do seu aplicativo"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSaveCredentials}
                disabled={saveCredentialsMutation.isPending}
              >
                {saveCredentialsMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar Credenciais
              </Button>
              {status?.isConfigured && (
                <Button 
                  variant="destructive" 
                  onClick={() => deleteCredentialsMutation.mutate()}
                  disabled={deleteCredentialsMutation.isPending}
                >
                  Remover Credenciais
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* How it works */}
      <Card>
        <CardHeader>
          <CardTitle>Como Funciona</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold">Configure as Credenciais</h3>
              <p className="text-sm text-muted-foreground">
                Crie um aplicativo no DevCenter do Mercado Livre e insira as credenciais aqui.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold">Conecte sua Conta</h3>
              <p className="text-sm text-muted-foreground">
                Autorize o acesso à sua conta do Mercado Livre para obter as comissões atualizadas.
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold">Sincronize</h3>
              <p className="text-sm text-muted-foreground">
                Clique em sincronizar para atualizar automaticamente as comissões nos seus marketplaces.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Benefícios da Integração</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Comissões Atualizadas:</strong> Mantenha suas taxas sempre sincronizadas com as cobradas pelo Mercado Livre.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Precisão nos Cálculos:</strong> Calcule margens e preços com base em dados reais da plataforma.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Economia de Tempo:</strong> Não precisa mais verificar manualmente as comissões do Mercado Livre.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
              <span><strong>Segurança:</strong> Suas credenciais são armazenadas de forma segura e você pode desconectar a qualquer momento.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
