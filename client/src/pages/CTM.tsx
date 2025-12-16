import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, ArrowRight } from "lucide-react";

export default function CTM() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CTM - Custo Total da Mercadoria</h1>
          <p className="text-muted-foreground">Entenda como é calculado o custo total</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Fórmula do CTM</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-6 bg-primary/5 rounded-xl border border-primary/20">
              <p className="text-lg font-mono text-center">CTM = Custo Produto + Frete + Comissão + Impostos + ADS + OPEX + Encargos</p>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg"><h3 className="font-semibold mb-2">Custo do Produto</h3><p className="text-sm text-muted-foreground">Soma dos custos dos materiais (BOM) × quantidade</p></div>
              <div className="p-4 border rounded-lg"><h3 className="font-semibold mb-2">Frete</h3><p className="text-sm text-muted-foreground">Baseado no peso considerado (maior entre real e cubado)</p></div>
              <div className="p-4 border rounded-lg"><h3 className="font-semibold mb-2">Comissão</h3><p className="text-sm text-muted-foreground">(Preço × Comissão%) + Taxa Fixa do marketplace</p></div>
              <div className="p-4 border rounded-lg"><h3 className="font-semibold mb-2">Impostos</h3><p className="text-sm text-muted-foreground">Preço × Alíquota de imposto configurada</p></div>
              <div className="p-4 border rounded-lg"><h3 className="font-semibold mb-2">ADS (Publicidade)</h3><p className="text-sm text-muted-foreground">Preço × Percentual de ADS configurado</p></div>
              <div className="p-4 border rounded-lg"><h3 className="font-semibold mb-2">OPEX</h3><p className="text-sm text-muted-foreground">Percentual sobre preço ou valor fixo</p></div>
            </div>
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800"><strong>Dica:</strong> Use o Simulador para calcular o CTM em tempo real e testar diferentes cenários de precificação.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
