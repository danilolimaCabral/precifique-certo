import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Ruler, Box, Scale } from "lucide-react";

export default function Dimensoes() {
  const { data: products } = trpc.products.list.useQuery();
  const activeProducts = products?.filter(p => p.isActive) || [];

  const calculateCubedWeight = (h: number, w: number, l: number) => (h * w * l) / 6000;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dimensões e Logística</h1>
          <p className="text-muted-foreground">Visualize cubagem e peso considerado dos produtos</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Ruler className="h-5 w-5" />Dimensões dos Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {!activeProducts.length ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum produto com dimensões cadastradas</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">Produto</th>
                      <th className="text-center py-3 px-4 font-medium">Altura (cm)</th>
                      <th className="text-center py-3 px-4 font-medium">Largura (cm)</th>
                      <th className="text-center py-3 px-4 font-medium">Comprimento (cm)</th>
                      <th className="text-center py-3 px-4 font-medium">Cubagem (cm³)</th>
                      <th className="text-center py-3 px-4 font-medium">Peso Real (g)</th>
                      <th className="text-center py-3 px-4 font-medium">Peso Cubado (g)</th>
                      <th className="text-center py-3 px-4 font-medium">Peso Considerado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeProducts.map((p) => {
                      const h = Number(p.height || 0);
                      const w = Number(p.width || 0);
                      const l = Number(p.length || 0);
                      const realWeight = Number(p.realWeight || 0);
                      const cubicVolume = h * w * l;
                      const cubedWeight = calculateCubedWeight(h, w, l) * 1000;
                      const consideredWeight = Math.max(realWeight, cubedWeight);
                      return (
                        <tr key={p.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4"><span className="font-mono text-sm">{p.sku}</span> - {p.name}</td>
                          <td className="py-3 px-4 text-center">{h || "-"}</td>
                          <td className="py-3 px-4 text-center">{w || "-"}</td>
                          <td className="py-3 px-4 text-center">{l || "-"}</td>
                          <td className="py-3 px-4 text-center">{cubicVolume.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">{realWeight || "-"}</td>
                          <td className="py-3 px-4 text-center">{cubedWeight.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center font-bold">{consideredWeight.toFixed(2)}g</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
