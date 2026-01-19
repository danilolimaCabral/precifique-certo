import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Package, Boxes, Store, Calculator, TrendingUp, Sparkles, AlertTriangle, Target, Zap, BarChart3, PieChart, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Legend } from "recharts";

const iconColors: Record<string, string> = {
  primary: "bg-violet-100 text-violet-600",
  success: "bg-emerald-100 text-emerald-600",
  warning: "bg-amber-100 text-amber-600",
  info: "bg-blue-100 text-blue-600",
};

const CHART_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];

export default function Home() {
  const { data: materials } = trpc.materials.list.useQuery();
  const { data: products } = trpc.products.list.useQuery();
  const { data: marketplaces } = trpc.marketplaces.list.useQuery();
  const { data: settings } = trpc.settings.get.useQuery();
  const { data: marginByProduct } = trpc.analytics.marginByProduct.useQuery({});
  const { data: marginByMarketplace } = trpc.analytics.marginByMarketplace.useQuery({});

  const activeMaterials = materials?.filter((m: { isActive: boolean }) => m.isActive).length || 0;
  const activeProducts = products?.filter((p: { isActive: boolean }) => p.isActive).length || 0;
  const activeMarketplaces = marketplaces?.filter((m: { isActive: boolean }) => m.isActive).length || 0;
  const taxPercent = settings?.taxPercent || "0";

  const stats = [
    { title: "Materiais", value: activeMaterials, description: "Insumos e embalagens ativos", icon: Package, color: "primary", href: "/materiais" },
    { title: "Produtos", value: activeProducts, description: "Produtos cadastrados", icon: Boxes, color: "success", href: "/produtos" },
    { title: "Marketplaces", value: activeMarketplaces, description: "Canais de venda configurados", icon: Store, color: "warning", href: "/marketplaces" },
    { title: "Alíquota de Imposto", value: `${taxPercent}%`, description: settings?.taxName || "Não configurado", icon: Calculator, color: "info", href: "/configuracoes" },
  ];

  const quickActions = [
    { title: "Cadastrar Material", description: "Adicione insumos e embalagens", icon: Package, href: "/materiais", gradient: "from-violet-500 to-purple-600" },
    { title: "Cadastrar Produto", description: "Crie produtos com BOM", icon: Boxes, href: "/produtos", gradient: "from-emerald-500 to-teal-600" },
    { title: "Simular Preço", description: "Calcule margem e CTM", icon: Calculator, href: "/simulador", gradient: "from-amber-500 to-orange-600" },
    { title: "Preço Mínimo", description: "Encontre o menor preço viável", icon: TrendingUp, href: "/preco-minimo", gradient: "from-rose-500 to-pink-600" },
  ];

  // Prepare chart data
  const productChartData = marginByProduct?.map((p: any) => ({
    name: p.name?.substring(0, 15) || p.sku?.substring(0, 15),
    margem: Number(p.marginPercent?.toFixed(1)) || 0,
    valor: Number(p.marginValue?.toFixed(2)) || 0,
  })) || [];

  const marketplaceChartData = marginByMarketplace?.map((m: any, index: number) => ({
    name: m.name,
    value: Math.abs(Number(m.marginPercent?.toFixed(1)) || 0),
    marginValue: Number(m.marginValue?.toFixed(2)) || 0,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  // Prepare profit by marketplace bar chart data
  const profitByMarketplaceData = marginByMarketplace?.map((m: any, index: number) => ({
    name: m.name?.substring(0, 12) || "N/A",
    lucro: Number(m.marginValue?.toFixed(2)) || 0,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })) || [];

  const hasChartData = productChartData.length > 0 || marketplaceChartData.length > 0;

  // Calculate total profit
  const totalProfit = profitByMarketplaceData.reduce((sum: number, m: any) => sum + m.lucro, 0);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="relative">
          <div className="absolute inset-0 gradient-mesh opacity-50 rounded-3xl" />
          <div className="relative p-8 rounded-3xl border bg-card/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl gradient-primary">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-sm font-medium text-primary">Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Bem-vindo ao <span className="text-gradient">GetCerto</span></h1>
            <p className="text-muted-foreground mt-2 max-w-2xl">Sistema completo de formação de preço e análise de custos para e-commerce.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Link key={stat.title} href={stat.href}>
              <Card className="stat-card cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold mt-2 tabular-nums">{stat.value}</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
                    </div>
                    <div className={`flex items-center justify-center rounded-xl p-2.5 ${iconColors[stat.color]}`}>
                      <stat.icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Charts Section */}
        {hasChartData && (
          <>
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Margin by Product Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    Margem por Produto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {productChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={productChartData} margin={{ top: 10, right: 30, left: 0, bottom: 40 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 11 }} 
                          angle={-45} 
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }} 
                          tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip 
                          formatter={(value: number, name: string) => [
                            name === "margem" ? `${value}%` : `R$ ${value.toFixed(2)}`,
                            name === "margem" ? "Margem %" : "Valor R$"
                          ]}
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }}
                        />
                        <Bar 
                          dataKey="margem" 
                          fill="#8b5cf6" 
                          radius={[4, 4, 0, 0]}
                          name="Margem %"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Boxes className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Cadastre produtos para ver o gráfico</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Margin by Marketplace Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Margem por Marketplace
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {marketplaceChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPie>
                        <Pie
                          data={marketplaceChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}%`}
                          labelLine={false}
                        >
                          {marketplaceChartData.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value}% (R$ ${props.payload.marginValue})`,
                            "Margem"
                          ]}
                          contentStyle={{ 
                            backgroundColor: "white", 
                            border: "1px solid #e5e7eb",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                          }}
                        />
                        <Legend />
                      </RechartsPie>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                      <div className="text-center">
                        <Store className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Configure marketplaces para ver o gráfico</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Profit by Marketplace Bar Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-emerald-600" />
                    Lucro Total por Marketplace
                  </CardTitle>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Lucro Total Estimado</p>
                    <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      R$ {totalProfit.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {profitByMarketplaceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={profitByMarketplaceData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }} 
                        angle={-45} 
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => `R$ ${value}`}
                      />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toFixed(2)}`, "Lucro"]}
                        contentStyle={{ 
                          backgroundColor: "white", 
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                        }}
                        labelStyle={{ fontWeight: "bold" }}
                      />
                      <Bar 
                        dataKey="lucro" 
                        radius={[6, 6, 0, 0]}
                        name="Lucro R$"
                      >
                        {profitByMarketplaceData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.lucro >= 0 ? CHART_COLORS[index % CHART_COLORS.length] : "#ef4444"} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Configure marketplaces e produtos para ver o gráfico de lucro</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-primary" />Ações Rápidas</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => (
              <Link key={action.title} href={action.href}>
                <Card className="card-hover cursor-pointer group overflow-hidden">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold">{action.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{action.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary"><Target className="h-5 w-5" />Como Começar</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">1</span><div><strong>Cadastre seus Materiais</strong><p className="text-muted-foreground">Insumos e embalagens com custos unitários</p></div></li>
                <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">2</span><div><strong>Crie seus Produtos</strong><p className="text-muted-foreground">Monte a lista de materiais (BOM)</p></div></li>
                <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">3</span><div><strong>Configure os Marketplaces</strong><p className="text-muted-foreground">Comissões, taxas e faixas de frete</p></div></li>
                <li className="flex items-start gap-3"><span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">4</span><div><strong>Simule e Precifique</strong><p className="text-muted-foreground">Use o simulador para encontrar o preço ideal</p></div></li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-amber-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-700"><AlertTriangle className="h-5 w-5" />Dica Importante</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-amber-800">Para calcular o preço correto dos seus produtos, certifique-se de configurar primeiro: <strong>Materiais</strong>, <strong>Produtos com BOM</strong>, <strong>Marketplaces</strong> e <strong>Configurações de Impostos</strong>. Depois, use o <strong>Simulador</strong> para testar diferentes cenários de precificação.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
