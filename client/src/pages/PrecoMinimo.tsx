import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function PrecoMinimo() {
  const [productId, setProductId] = useState<string>("");
  const [marketplaceId, setMarketplaceId] = useState<string>("");

  const { data: products } = trpc.products.list.useQuery();
  const { data: marketplaces } = trpc.marketplaces.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const calculateMutation = trpc.pricing.calculate.useMutation();

  useEffect(() => {
    if (productId && marketplaceId) {
      calculateMutation.mutate({ productId: Number(productId), marketplaceId: Number(marketplaceId), salePrice: 100 });
    }
  }, [productId, marketplaceId]);

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const result = calculateMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Preço Mínimo</h1>
          <p className="text-muted-foreground">Encontre o menor preço viável para margem não-negativa</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Selecione Produto e Marketplace</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Produto</label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
                  <SelectContent>
                    {products?.filter(p => p.isActive).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.sku} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Marketplace</label>
                <Select value={marketplaceId} onValueChange={setMarketplaceId}>
                  <SelectTrigger><SelectValue placeholder="Selecione um marketplace" /></SelectTrigger>
                  <SelectContent>
                    {marketplaces?.filter(m => m.isActive).map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><TrendingDown className="h-5 w-5" />Preço Mínimo Calculado</CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-8 text-muted-foreground">Selecione produto e marketplace</div>
              ) : (
                <div className="space-y-4">
                  <div className="p-6 bg-primary/5 rounded-xl text-center">
                    <p className="text-sm text-muted-foreground mb-2">Preço Mínimo para Margem Zero</p>
                    <p className="text-4xl font-bold text-primary">{formatCurrency(result.minPrice)}</p>
                  </div>
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <p className="text-sm text-amber-800"><strong>Meta de Margem:</strong> {settings?.minMarginTarget || 10}%</p>
                    <p className="text-sm text-amber-800 mt-1">Para atingir a meta, venda acima de <strong>{formatCurrency(result.minPrice / (1 - Number(settings?.minMarginTarget || 10) / 100))}</strong></p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between p-2 bg-muted/50 rounded"><span>Custo do Produto</span><span>{formatCurrency(result.costs.productCost)}</span></div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded"><span>Frete Estimado</span><span>{formatCurrency(result.costs.shippingCost)}</span></div>
                    <div className="flex justify-between p-2 bg-muted/50 rounded"><span>Comissão</span><span>{result.costs.commissionPercent}% + {formatCurrency(result.costs.fixedFee)}</span></div>
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
