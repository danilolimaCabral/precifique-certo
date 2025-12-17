import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import { Receipt, Package, Truck, Calculator, TrendingUp, ChevronDown, ChevronUp, Info } from "lucide-react";
import { useState, useMemo } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AnaliseVenda() {
  const [productId, setProductId] = useState<string>("");
  const [marketplaceId, setMarketplaceId] = useState<string>("");
  const [salePrice, setSalePrice] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("1");
  const [shippingCost, setShippingCost] = useState<string>("");
  const [showDetails, setShowDetails] = useState(true);

  const { data: products } = trpc.products.listWithCost.useQuery();
  const { data: marketplaces } = trpc.marketplaces.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();

  const selectedProduct = useMemo(() => 
    products?.find(p => p.id === Number(productId)), 
    [products, productId]
  );

  const selectedMarketplace = useMemo(() => 
    marketplaces?.find(m => m.id === Number(marketplaceId)), 
    [marketplaces, marketplaceId]
  );

  // Cálculos seguindo padrão ML
  const analysis = useMemo(() => {
    if (!selectedProduct || !selectedMarketplace || !salePrice || !quantity) return null;

    const qty = Number(quantity) || 1;
    const unitPrice = Number(salePrice) || 0;
    const shipping = Number(shippingCost) || 0;
    
    // Valores totais
    const totalPrice = unitPrice * qty;
    const productCostUnit = Number(selectedProduct.totalCost) || 0;
    const totalProductCost = productCostUnit * qty;
    
    // Comissões do marketplace
    const commissionPercent = Number(selectedMarketplace.commissionPercent) || 0;
    const fixedFee = Number(selectedMarketplace.fixedFee) || 0;
    const totalCommission = (totalPrice * commissionPercent / 100) + (fixedFee * qty);
    
    // Impostos
    const taxPercent = Number(settings?.taxPercent) || 0;
    const totalTax = totalPrice * taxPercent / 100;
    
    // Margem de Contribuição
    const marginValue = totalPrice - totalCommission - shipping - totalProductCost - totalTax;
    const marginPercent = totalPrice > 0 ? (marginValue / totalPrice) * 100 : 0;
    
    // Total recebido (sem custo do produto e imposto - valor líquido do ML)
    const totalReceived = totalPrice - totalCommission - shipping;

    return {
      // Por unidade
      unitPrice,
      unitCommission: totalCommission / qty,
      unitShipping: shipping / qty,
      unitProductCost: productCostUnit,
      unitTax: totalTax / qty,
      unitMargin: marginValue / qty,
      
      // Totais
      totalPrice,
      totalCommission,
      totalShipping: shipping,
      totalProductCost,
      totalTax,
      marginValue,
      marginPercent,
      totalReceived,
      
      // Percentuais
      commissionPercent,
      taxPercent,
      
      // Metadados
      quantity: qty,
      productName: selectedProduct.name,
      productSku: selectedProduct.sku,
      marketplaceName: selectedMarketplace.name,
    };
  }, [selectedProduct, selectedMarketplace, salePrice, quantity, shippingCost, settings]);

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Receipt className="h-8 w-8 text-primary" />
            Análise de Venda
          </h1>
          <p className="text-muted-foreground">
            Simule uma venda e veja o breakdown completo de valores (padrão Mercado Livre)
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Coluna Esquerda - Parâmetros e Detalhes */}
          <div className="lg:col-span-2 space-y-6">
            {/* Card de Parâmetros */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Parâmetros da Venda
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Produto</label>
                    <Select value={productId} onValueChange={setProductId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.filter(p => p.isActive).map(p => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.sku} - {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Marketplace</label>
                    <Select value={marketplaceId} onValueChange={setMarketplaceId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o marketplace" />
                      </SelectTrigger>
                      <SelectContent>
                        {marketplaces?.filter(m => m.isActive).map(m => (
                          <SelectItem key={m.id} value={String(m.id)}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Preço de Venda (R$)</label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 292.95"
                      value={salePrice} 
                      onChange={(e) => setSalePrice(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Quantidade</label>
                    <Input 
                      type="number" 
                      min="1"
                      value={quantity} 
                      onChange={(e) => setQuantity(e.target.value)} 
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-medium flex items-center gap-1">
                      Custo de Envio (R$)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Tarifa do Mercado Envios ou frete por sua conta</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="Ex: 39.90"
                      value={shippingCost} 
                      onChange={(e) => setShippingCost(e.target.value)} 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Card de Detalhes da Venda */}
            {analysis && (
              <Card>
                <CardHeader className="cursor-pointer" onClick={() => setShowDetails(!showDetails)}>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5" />
                      Detalhes da Venda
                    </div>
                    {showDetails ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </CardTitle>
                </CardHeader>
                {showDetails && (
                  <CardContent className="space-y-4">
                    {/* Info do Produto */}
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{analysis.productName}</h4>
                        <p className="text-sm text-muted-foreground">SKU {analysis.productSku}</p>
                        <Badge variant="outline" className="mt-1">{analysis.marketplaceName}</Badge>
                      </div>
                    </div>

                    {/* Breakdown por Unidade */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Valores por Unidade
                      </h4>
                      <div className="space-y-1">
                        <div className="flex justify-between py-2 border-b">
                          <span>Tarifas de Venda</span>
                          <span className="font-medium">{formatCurrency(analysis.unitCommission)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Envios (Frete)</span>
                          <span className="font-medium">{formatCurrency(analysis.unitShipping)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Custo do Produto</span>
                          <span className="font-medium">{formatCurrency(analysis.unitProductCost)}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span>Imposto do Produto</span>
                          <span className="font-medium">{formatCurrency(analysis.unitTax)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-emerald-600">
                          <span className="font-semibold">Margem de Contribuição</span>
                          <span className="font-bold">
                            {formatCurrency(analysis.unitMargin)}
                            <span className="text-sm ml-1">({formatPercent(analysis.marginPercent)})</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-lg font-bold text-primary">
                      <span>{analysis.quantity} {analysis.quantity === 1 ? 'unidade' : 'unidades'}</span>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Coluna Direita - Resumo do Pagamento (estilo ML) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader className="bg-muted/30">
                <CardTitle className="text-lg">Pagamento aprovado</CardTitle>
                {analysis && (
                  <p className="text-sm text-muted-foreground">
                    Simulação de venda
                  </p>
                )}
              </CardHeader>
              <CardContent className="pt-4">
                {!analysis ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Preencha os parâmetros para ver o resumo</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Preço do Produto */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Preço do produto</span>
                      <span className="font-semibold">{formatCurrency(analysis.totalPrice)}</span>
                    </div>
                    
                    <Separator />
                    
                    {/* Tarifa de Venda */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm flex items-center gap-1">
                          Tarifa de venda total
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Info className="h-3 w-3 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Comissão do marketplace</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </span>
                        <span className="font-semibold text-red-600">-{formatCurrency(analysis.totalCommission)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground pl-2">
                        <span>Tarifa de {formatPercent(analysis.commissionPercent)}</span>
                        <span>-{formatCurrency(analysis.totalCommission)}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Envios */}
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Envios</span>
                        <span className="font-semibold text-red-600">-{formatCurrency(analysis.totalShipping)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-muted-foreground pl-2">
                        <span>Tarifa do Mercado Envios (por sua conta)</span>
                        <span>-{formatCurrency(analysis.totalShipping)}</span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Custo do Produto */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Custo do Produto</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(analysis.totalProductCost)}</span>
                    </div>
                    
                    <Separator />
                    
                    {/* Imposto */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Imposto do Produto</span>
                      <span className="font-semibold text-red-600">-{formatCurrency(analysis.totalTax)}</span>
                    </div>
                    
                    <Separator />
                    
                    {/* Margem de Contribuição */}
                    <div className="p-3 bg-emerald-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-emerald-700">Margem de Contribuição</span>
                        <span className={`font-bold ${analysis.marginValue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatCurrency(analysis.marginValue)}
                        </span>
                      </div>
                      <div className="flex justify-end">
                        <span className={`text-sm ${analysis.marginValue >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {formatPercent(analysis.marginPercent)}
                        </span>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    {/* Total */}
                    <div className="flex justify-between items-center pt-2">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">{formatCurrency(analysis.totalPrice)}</span>
                    </div>
                    
                    {/* Alerta de margem negativa */}
                    {analysis.marginValue < 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
                        <p className="text-sm text-red-700 font-medium">
                          ⚠️ Margem negativa! Revise o preço de venda ou reduza custos.
                        </p>
                      </div>
                    )}
                    
                    {/* Indicador de margem baixa */}
                    {analysis.marginValue >= 0 && analysis.marginPercent < 15 && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-4">
                        <p className="text-sm text-amber-700 font-medium">
                          ⚠️ Margem abaixo de 15%. Considere ajustar o preço.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
