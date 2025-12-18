import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { DollarSign, AlertTriangle, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";

export default function Precificacao() {
  const [productId, setProductId] = useState<string>("");
  const [marketplaceId, setMarketplaceId] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");

  const { data: products, isLoading: loadingProducts } = trpc.products.list.useQuery();
  const { data: marketplaces, isLoading: loadingMarketplaces } = trpc.marketplaces.list.useQuery();
  const calculateMutation = trpc.pricing.calculate.useMutation();

  // Memoize filtered lists to avoid re-renders
  const activeProducts = useMemo(() => 
    products?.filter(p => p.isActive) || [], 
    [products]
  );
  
  const activeMarketplaces = useMemo(() => 
    marketplaces?.filter(m => m.isActive) || [], 
    [marketplaces]
  );

  const handleCalculate = () => {
    if (!productId || !marketplaceId || !salePrice) return;
    calculateMutation.mutate({ 
      productId: Number(productId), 
      marketplaceId: Number(marketplaceId), 
      salePrice: Number(salePrice) 
    });
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  
  const result = calculateMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Precificação</h1>
          <p className="text-muted-foreground">Calcule margem de contribuição por produto e marketplace</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto</label>
                {loadingProducts ? (
                  <div className="flex items-center gap-2 h-9 px-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : (
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um produto" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeProducts.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhum produto cadastrado
                        </div>
                      ) : (
                        activeProducts.map(p => (
                          <SelectItem key={`product-${p.id}`} value={String(p.id)}>
                            {p.sku} - {p.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marketplace</label>
                {loadingMarketplaces ? (
                  <div className="flex items-center gap-2 h-9 px-3 border rounded-md">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Carregando...</span>
                  </div>
                ) : (
                  <Select value={marketplaceId} onValueChange={setMarketplaceId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione um marketplace" />
                    </SelectTrigger>
                    <SelectContent>
                      {activeMarketplaces.length === 0 ? (
                        <div className="px-2 py-1.5 text-sm text-muted-foreground">
                          Nenhum marketplace cadastrado
                        </div>
                      ) : (
                        activeMarketplaces.map(m => (
                          <SelectItem key={`marketplace-${m.id}`} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço de Venda (R$)</label>
                <Input 
                  type="number" 
                  step="0.01" 
                  value={salePrice} 
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <Button 
                onClick={handleCalculate} 
                className="w-full" 
                disabled={calculateMutation.isPending || !productId || !marketplaceId || !salePrice}
              >
                {calculateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Calculando...
                  </>
                ) : (
                  "Calcular"
                )}
              </Button>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-8 text-muted-foreground">
                  Selecione os parâmetros e clique em Calcular
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-primary/5 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">Preço de Venda</p>
                      <p className="text-2xl font-bold">{formatCurrency(result.salePrice)}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg text-center">
                      <p className="text-sm text-muted-foreground">CTM</p>
                      <p className="text-2xl font-bold">{formatCurrency(result.ctm)}</p>
                    </div>
                    <div className={`p-4 rounded-lg text-center ${result.marginValue >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <p className="text-sm text-muted-foreground">Margem</p>
                      <p className={`text-2xl font-bold ${result.marginValue >= 0 ? "text-green-700" : "text-red-700"}`}>
                        {formatCurrency(result.marginValue)} ({result.marginPercent.toFixed(2)}%)
                      </p>
                    </div>
                  </div>
                  {result.alerts.isNegativeMargin && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <p className="text-red-800">Margem negativa! Revise o preço ou custos.</p>
                    </div>
                  )}
                  <div className="space-y-2">
                    <h4 className="font-semibold">Detalhamento dos Custos</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>Custo Produto</span>
                        <span>{formatCurrency(result.costs.productCost)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>Frete</span>
                        <span>{formatCurrency(result.costs.shippingCost)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>Comissão ({result.costs.commissionPercent}%)</span>
                        <span>{formatCurrency(result.costs.commission)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>Impostos ({result.costs.taxPercent}%)</span>
                        <span>{formatCurrency(result.costs.taxValue)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>ADS ({result.costs.adsPercent}%)</span>
                        <span>{formatCurrency(result.costs.adsValue)}</span>
                      </div>
                      <div className="flex justify-between p-2 bg-muted/50 rounded">
                        <span>OPEX</span>
                        <span>{formatCurrency(result.costs.opexCost)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
