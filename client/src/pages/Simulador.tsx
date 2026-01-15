import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { trpc } from "@/lib/trpc";
import { Sliders, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import { useState, useEffect, useMemo } from "react";

export default function Simulador() {
  const [productId, setProductId] = useState<string>("");
  const [marketplaceId, setMarketplaceId] = useState<string>("");
  const [salePrice, setSalePrice] = useState<number>(100);
  const [taxPercent, setTaxPercent] = useState<number>(0);
  const [adsPercent, setAdsPercent] = useState<number>(0);
  const [opexValue, setOpexValue] = useState<number>(0);

  const { data: products } = trpc.products.list.useQuery();
  const { data: marketplaces } = trpc.marketplaces.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const calculateMutation = trpc.pricing.calculate.useMutation();

  useEffect(() => {
    if (settings) {
      setTaxPercent(Number(settings.taxPercent || 0));
      setAdsPercent(Number(settings.adsPercent || 0));
      setOpexValue(Number(settings.opexValue || 0));
    }
  }, [settings]);

  useEffect(() => {
    if (productId && marketplaceId) {
      calculateMutation.mutate({
        productId: Number(productId),
        marketplaceId: Number(marketplaceId),
        salePrice,
        taxPercent,
        adsPercent,
        opexType: settings?.opexType || "percent",
        opexValue,
      });
    }
  }, [productId, marketplaceId, salePrice, taxPercent, adsPercent, opexValue]);

  const formatCurrency = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  const result = calculateMutation.data;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Simulador de Cenários</h1>
          <p className="text-muted-foreground">Ajuste variáveis em tempo real e veja o impacto no CTM e margem</p>
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sliders className="h-5 w-5" />Parâmetros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {products?.filter(p => p.isActive).map(p => (
                      <SelectItem key={p.id} value={String(p.id)}>{p.sku} - {p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Marketplace</Label>
                <Select value={marketplaceId} onValueChange={setMarketplaceId}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {marketplaces?.filter(m => m.isActive).map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preço de Venda (R$)</Label>
                <Input 
                  type="number" 
                  step="0.01" 
                  min="0"
                  value={salePrice} 
                  onChange={(e) => setSalePrice(Number(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>
              <div className="space-y-2">
                <Label>Imposto (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0"
                  max="100"
                  value={taxPercent} 
                  onChange={(e) => setTaxPercent(Number(e.target.value) || 0)}
                  placeholder="0,0"
                />
              </div>
              <div className="space-y-2">
                <Label>ADS - Publicidade (%)</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0"
                  max="100"
                  value={adsPercent} 
                  onChange={(e) => setAdsPercent(Number(e.target.value) || 0)}
                  placeholder="0,0"
                />
              </div>
              <div className="space-y-2">
                <Label>OPEX ({settings?.opexType === "fixed" ? "R$" : "%"})</Label>
                <Input 
                  type="number" 
                  step="0.1" 
                  min="0"
                  value={opexValue} 
                  onChange={(e) => setOpexValue(Number(e.target.value) || 0)}
                  placeholder="0,0"
                />
              </div>
            </CardContent>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resultado em Tempo Real</CardTitle>
            </CardHeader>
            <CardContent>
              {!result ? (
                <div className="text-center py-12 text-muted-foreground">Selecione produto e marketplace para simular</div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-primary/5 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">Preço Venda</p>
                      <p className="text-xl font-bold">{formatCurrency(result.salePrice)}</p>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-xl text-center">
                      <p className="text-xs text-muted-foreground">CTM</p>
                      <p className="text-xl font-bold">{formatCurrency(result.ctm)}</p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${result.marginValue >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <p className="text-xs text-muted-foreground">Margem R$</p>
                      <p className={`text-xl font-bold ${result.marginValue >= 0 ? "text-green-700" : "text-red-700"}`}>{formatCurrency(result.marginValue)}</p>
                    </div>
                    <div className={`p-4 rounded-xl text-center ${result.marginPercent >= result.alerts.minMarginTarget ? "bg-green-50" : result.marginPercent >= 0 ? "bg-amber-50" : "bg-red-50"}`}>
                      <p className="text-xs text-muted-foreground">Margem %</p>
                      <p className={`text-xl font-bold ${result.marginPercent >= result.alerts.minMarginTarget ? "text-green-700" : result.marginPercent >= 0 ? "text-amber-700" : "text-red-700"}`}>{result.marginPercent.toFixed(2)}%</p>
                    </div>
                  </div>
                  {result.alerts.isNegativeMargin && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-red-600" />
                      <p className="text-sm text-red-800">Margem negativa! Aumente o preço ou reduza custos.</p>
                    </div>
                  )}
                  {result.alerts.isBelowTarget && !result.alerts.isNegativeMargin && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <p className="text-sm text-amber-800">Margem abaixo da meta de {result.alerts.minMarginTarget}%</p>
                    </div>
                  )}
                  {!result.alerts.isNegativeMargin && !result.alerts.isBelowTarget && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <p className="text-sm text-green-800">Margem dentro da meta!</p>
                    </div>
                  )}
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-semibold mb-3">Composição do CTM</h4>
                    <div className="space-y-2">
                      {[
                        { label: "Custo Produto", value: result.costs.productCost, percent: (result.costs.productCost / result.ctm) * 100 },
                        { label: "Frete", value: result.costs.shippingCost, percent: (result.costs.shippingCost / result.ctm) * 100 },
                        { label: `Comissão (${result.costs.commissionPercent}%)`, value: result.costs.commission, percent: (result.costs.commission / result.ctm) * 100 },
                        { label: `Imposto (${result.costs.taxPercent}%)`, value: result.costs.taxValue, percent: (result.costs.taxValue / result.ctm) * 100 },
                        { label: `ADS (${result.costs.adsPercent}%)`, value: result.costs.adsValue, percent: (result.costs.adsValue / result.ctm) * 100 },
                        { label: "OPEX", value: result.costs.opexCost, percent: (result.costs.opexCost / result.ctm) * 100 },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm w-40">{item.label}</span>
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(item.percent, 100)}%` }} />
                          </div>
                          <span className="text-sm font-mono w-24 text-right">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-semibold">Preço Mínimo Sugerido</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">{formatCurrency(result.minPrice)}</p>
                    <p className="text-sm text-muted-foreground">Para margem zero com os parâmetros atuais</p>
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
