import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Check, X, Sparkles, Zap, Building2, Crown } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";

const planIcons: Record<string, React.ReactNode> = {
  free: <Sparkles className="h-6 w-6" />,
  basic: <Zap className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  enterprise: <Building2 className="h-6 w-6" />,
};

const planColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  basic: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

export default function Planos() {
  const { user, isAuthenticated } = useAuth();
  const { data: plans, isLoading } = trpc.plans.list.useQuery();
  const { data: myPlan } = trpc.plans.myPlan.useQuery(undefined, { enabled: isAuthenticated });
  const { data: myLimits } = trpc.plans.myLimits.useQuery(undefined, { enabled: isAuthenticated });

  const formatPrice = (price: string | number) => {
    const num = typeof price === "string" ? parseFloat(price) : price;
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? "Ilimitado" : limit.toString();
  };

  const handleSelectPlan = (planSlug: string) => {
    if (!isAuthenticated) {
      toast.info("Faça login ou cadastre-se para escolher um plano");
      return;
    }
    
    if (planSlug === "free") {
      toast.info("Você já está no plano gratuito!");
      return;
    }
    
    // For paid plans, show contact info (manual payment workflow)
    toast.info(
      "Para assinar este plano, entre em contato conosco via WhatsApp ou email para receber o link de pagamento via PIX.",
      { duration: 8000 }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/">
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent cursor-pointer">
              PRECIFIQUE CERTO
            </span>
          </Link>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link href="/">
                <Button variant="outline">Voltar ao Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Entrar</Button>
                </Link>
                <Link href="/cadastro">
                  <Button>Criar Conta</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Escolha o plano ideal para seu negócio
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Precifique seus produtos com precisão e aumente sua margem de lucro em todos os marketplaces
          </p>
          
          {isAuthenticated && myPlan && (
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-6 py-3 shadow-md border">
              <span className="text-gray-600">Seu plano atual:</span>
              <Badge className={planColors[myPlan.slug] || "bg-gray-100"}>
                {myPlan.name}
              </Badge>
            </div>
          )}
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans?.map((plan) => {
              const isCurrentPlan = myPlan?.id === plan.id;
              const isPro = plan.slug === "pro";
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden transition-all hover:shadow-xl ${
                    isPro ? "border-2 border-purple-500 shadow-lg scale-105" : ""
                  } ${isCurrentPlan ? "ring-2 ring-indigo-500" : ""}`}
                >
                  {isPro && (
                    <div className="absolute top-0 right-0 bg-purple-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                      MAIS POPULAR
                    </div>
                  )}
                  
                  {isCurrentPlan && (
                    <div className="absolute top-0 left-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-br-lg">
                      SEU PLANO
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-3 ${planColors[plan.slug] || "bg-gray-100"}`}>
                      {planIcons[plan.slug] || <Sparkles className="h-6 w-6" />}
                    </div>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-sm min-h-[40px]">
                      {plan.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-gray-900">
                        {formatPrice(plan.priceMonthly)}
                      </span>
                      <span className="text-gray-500">/mês</span>
                      {plan.priceYearly && parseFloat(String(plan.priceYearly)) > 0 && (
                        <p className="text-sm text-green-600 mt-1">
                          ou {formatPrice(plan.priceYearly)}/ano (economize 17%)
                        </p>
                      )}
                    </div>
                    
                    <ul className="space-y-3 text-left text-sm">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span><strong>{formatLimit(plan.maxMaterials)}</strong> materiais</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span><strong>{formatLimit(plan.maxProducts)}</strong> produtos</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        <span><strong>{formatLimit(plan.maxMarketplaces)}</strong> marketplaces</span>
                      </li>
                      <li className="flex items-center gap-2">
                        {plan.hasSimulator ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={!plan.hasSimulator ? "text-gray-400" : ""}>
                          Simulador de preços
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {plan.hasReports ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={!plan.hasReports ? "text-gray-400" : ""}>
                          Relatórios avançados
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {plan.hasExport ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={!plan.hasExport ? "text-gray-400" : ""}>
                          Exportar dados
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        {plan.hasPrioritySupport ? (
                          <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={!plan.hasPrioritySupport ? "text-gray-400" : ""}>
                          Suporte prioritário
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                  
                  <CardFooter>
                    <Button 
                      className={`w-full ${isPro ? "bg-purple-600 hover:bg-purple-700" : ""}`}
                      variant={isCurrentPlan ? "outline" : "default"}
                      disabled={isCurrentPlan}
                      onClick={() => handleSelectPlan(plan.slug)}
                    >
                      {isCurrentPlan ? "Plano Atual" : plan.slug === "free" ? "Começar Grátis" : "Assinar Agora"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Usage Stats for logged users */}
      {isAuthenticated && myLimits && (
        <section className="pb-20 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Seu uso atual</CardTitle>
                <CardDescription>Acompanhe o consumo do seu plano</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">
                      {myLimits.materialsUsed}
                      <span className="text-gray-400 text-lg">
                        /{myLimits.materialsLimit === -1 ? "∞" : myLimits.materialsLimit}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Materiais</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {myLimits.productsUsed}
                      <span className="text-gray-400 text-lg">
                        /{myLimits.productsLimit === -1 ? "∞" : myLimits.productsLimit}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Produtos</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-amber-600">
                      {myLimits.marketplacesUsed}
                      <span className="text-gray-400 text-lg">
                        /{myLimits.marketplacesLimit === -1 ? "∞" : myLimits.marketplacesLimit}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">Marketplaces</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      <section className="pb-20 px-4 bg-white">
        <div className="container mx-auto max-w-3xl py-16">
          <h2 className="text-3xl font-bold text-center mb-12">Perguntas Frequentes</h2>
          
          <div className="space-y-6">
            <div className="border-b pb-6">
              <h3 className="font-semibold text-lg mb-2">Posso mudar de plano a qualquer momento?</h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento. 
                O valor será ajustado proporcionalmente ao período restante.
              </p>
            </div>
            
            <div className="border-b pb-6">
              <h3 className="font-semibold text-lg mb-2">Como funciona o pagamento?</h3>
              <p className="text-gray-600">
                Aceitamos pagamento via PIX ou boleto bancário. Após a confirmação do pagamento, 
                seu plano é ativado imediatamente. Em breve teremos cartão de crédito disponível.
              </p>
            </div>
            
            <div className="border-b pb-6">
              <h3 className="font-semibold text-lg mb-2">O que acontece se eu atingir o limite do meu plano?</h3>
              <p className="text-gray-600">
                Você receberá um aviso quando estiver próximo do limite. Ao atingir o limite, 
                não será possível criar novos itens, mas você poderá editar os existentes ou fazer upgrade.
              </p>
            </div>
            
            <div className="pb-6">
              <h3 className="font-semibold text-lg mb-2">Existe período de teste?</h3>
              <p className="text-gray-600">
                O plano Gratuito permite que você teste todas as funcionalidades básicas sem custo. 
                Quando precisar de mais recursos, faça upgrade para um plano pago.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2024 PRECIFIQUE CERTO. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
