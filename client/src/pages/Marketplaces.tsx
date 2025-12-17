import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Store, Plus, Pencil, Trash2, Truck, Package, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Marketplaces() {
  const [open, setOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", commissionPercent: "", fixedFee: "", logisticsType: "", freeShipping: false, isActive: true });
  const [shippingForm, setShippingForm] = useState({ minWeight: "", maxWeight: "", cost: "" });
  const [editShippingId, setEditShippingId] = useState<number | null>(null);
  const [editShippingForm, setEditShippingForm] = useState({ minWeight: "", maxWeight: "", cost: "" });

  const utils = trpc.useUtils();
  const { data: marketplaces, isLoading } = trpc.marketplaces.list.useQuery();
  const { data: limits } = trpc.plans.myLimits.useQuery();
  const { data: shippingRanges, refetch: refetchShipping } = trpc.shippingRanges.list.useQuery(
    { marketplaceId: selectedMarketplace || 0 }, 
    { enabled: !!selectedMarketplace }
  );

  const createMutation = trpc.marketplaces.create.useMutation({ 
    onSuccess: () => { 
      utils.marketplaces.list.invalidate();
      utils.plans.myLimits.invalidate(); 
      setOpen(false); 
      resetForm(); 
      toast.success("Marketplace criado com sucesso!"); 
    },
    onError: (error) => toast.error(`Erro ao criar: ${error.message}`)
  });
  
  const updateMutation = trpc.marketplaces.update.useMutation({ 
    onSuccess: () => { 
      utils.marketplaces.list.invalidate(); 
      setOpen(false); 
      resetForm(); 
      toast.success("Marketplace atualizado!"); 
    },
    onError: (error) => toast.error(`Erro ao atualizar: ${error.message}`)
  });
  
  const deleteMutation = trpc.marketplaces.delete.useMutation({ 
    onSuccess: () => { 
      utils.marketplaces.list.invalidate(); 
      toast.success("Marketplace excluído!"); 
    },
    onError: (error) => toast.error(`Erro ao excluir: ${error.message}`)
  });
  
  const createShippingMutation = trpc.shippingRanges.create.useMutation({ 
    onSuccess: () => { 
      refetchShipping();
      setShippingForm({ minWeight: "", maxWeight: "", cost: "" }); 
      toast.success("Faixa de frete adicionada!"); 
    },
    onError: (error) => toast.error(`Erro ao adicionar faixa: ${error.message}`)
  });
  
  const updateShippingMutation = trpc.shippingRanges.update.useMutation({ 
    onSuccess: () => { 
      refetchShipping();
      setEditShippingId(null);
      setEditShippingForm({ minWeight: "", maxWeight: "", cost: "" });
      toast.success("Faixa de frete atualizada!"); 
    },
    onError: (error) => toast.error(`Erro ao atualizar faixa: ${error.message}`)
  });
  
  const deleteShippingMutation = trpc.shippingRanges.delete.useMutation({ 
    onSuccess: () => { 
      refetchShipping();
      toast.success("Faixa de frete removida!"); 
    },
    onError: (error) => toast.error(`Erro ao remover faixa: ${error.message}`)
  });

  const resetForm = () => { 
    setForm({ name: "", commissionPercent: "", fixedFee: "", logisticsType: "", freeShipping: false, isActive: true }); 
    setEditId(null); 
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) { 
      updateMutation.mutate({ id: editId, ...form }); 
    } else { 
      createMutation.mutate(form); 
    }
  };

  const handleEdit = (mp: NonNullable<typeof marketplaces>[number]) => {
    setForm({ 
      name: mp.name, 
      commissionPercent: String(mp.commissionPercent), 
      fixedFee: String(mp.fixedFee || ""), 
      logisticsType: mp.logisticsType || "", 
      freeShipping: mp.freeShipping || false, 
      isActive: mp.isActive 
    });
    setEditId(mp.id);
    setOpen(true);
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarketplace) return;
    
    const minWeight = parseFloat(shippingForm.minWeight);
    const maxWeight = parseFloat(shippingForm.maxWeight);
    
    if (minWeight >= maxWeight) {
      toast.error("Peso mínimo deve ser menor que o peso máximo");
      return;
    }
    
    createShippingMutation.mutate({ 
      marketplaceId: selectedMarketplace, 
      ...shippingForm 
    });
  };

  const handleEditShipping = (sr: NonNullable<typeof shippingRanges>[number]) => {
    setEditShippingId(sr.id);
    setEditShippingForm({
      minWeight: String(sr.minWeight),
      maxWeight: String(sr.maxWeight),
      cost: String(sr.cost)
    });
  };

  const handleUpdateShipping = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editShippingId) return;
    
    const minWeight = parseFloat(editShippingForm.minWeight);
    const maxWeight = parseFloat(editShippingForm.maxWeight);
    
    if (minWeight >= maxWeight) {
      toast.error("Peso mínimo deve ser menor que o peso máximo");
      return;
    }
    
    updateShippingMutation.mutate({
      id: editShippingId,
      ...editShippingForm
    });
  };

  const cancelEditShipping = () => {
    setEditShippingId(null);
    setEditShippingForm({ minWeight: "", maxWeight: "", cost: "" });
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  };

  const formatWeight = (value: string | number | null) => {
    if (!value) return "0g";
    const num = Number(value);
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}kg`;
    }
    return `${num}g`;
  };

  // Refetch shipping when marketplace changes
  useEffect(() => {
    if (selectedMarketplace) {
      refetchShipping();
    }
  }, [selectedMarketplace]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketplaces</h1>
            <p className="text-muted-foreground">Configure canais de venda e personalize faixas de frete</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button 
                className="gap-2"
                disabled={limits && !limits.canCreateMarketplace}
                onClick={() => {
                  if (limits && !limits.canCreateMarketplace) {
                    toast.error(`Limite atingido! Seu plano permite ${limits.marketplacesLimit} marketplaces. Faça upgrade para adicionar mais.`);
                    return;
                  }
                }}
              >
                <Plus className="h-4 w-4" />
                Novo Marketplace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Marketplace" : "Novo Marketplace"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome do Marketplace</Label>
                  <Input 
                    value={form.name} 
                    onChange={(e) => setForm({ ...form, name: e.target.value })} 
                    placeholder="Ex: Mercado Livre, Shopee, Amazon" 
                    required 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Comissão (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      max="100"
                      value={form.commissionPercent} 
                      onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} 
                      placeholder="Ex: 12.5"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa Fixa (R$)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      min="0"
                      value={form.fixedFee} 
                      onChange={(e) => setForm({ ...form, fixedFee: e.target.value })} 
                      placeholder="Ex: 5.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Logística</Label>
                  <Input 
                    value={form.logisticsType} 
                    onChange={(e) => setForm({ ...form, logisticsType: e.target.value })} 
                    placeholder="Ex: Mercado Envios, FBA, Shopee Envios" 
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={form.freeShipping} 
                      onCheckedChange={(v) => setForm({ ...form, freeShipping: v })} 
                    />
                    <Label>Frete Grátis</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={form.isActive} 
                      onCheckedChange={(v) => setForm({ ...form, isActive: v })} 
                    />
                    <Label>Ativo</Label>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? "Salvando..." : editId ? "Salvar Alterações" : "Criar Marketplace"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Lista de Marketplaces
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !marketplaces?.length ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">Nenhum marketplace cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">Clique em "Novo Marketplace" para começar</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-center py-3 px-4 font-medium">Comissão</th>
                      <th className="text-center py-3 px-4 font-medium">Taxa Fixa</th>
                      <th className="text-center py-3 px-4 font-medium">Logística</th>
                      <th className="text-center py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marketplaces.map((mp) => (
                      <tr key={mp.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-medium">{mp.name}</div>
                          {mp.freeShipping && (
                            <span className="text-xs text-green-600">Frete Grátis</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono">{mp.commissionPercent}%</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono">{formatCurrency(mp.fixedFee)}</span>
                        </td>
                        <td className="py-3 px-4 text-center text-muted-foreground">
                          {mp.logisticsType || "-"}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            mp.isActive 
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                              : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                          }`}>
                            {mp.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setSelectedMarketplace(mp.id); setShippingOpen(true); }}
                              title="Configurar Faixas de Frete"
                            >
                              <Truck className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => handleEdit(mp)}
                              title="Editar Marketplace"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => {
                                if (confirm(`Deseja excluir "${mp.name}"? Todas as faixas de frete também serão removidas.`)) {
                                  deleteMutation.mutate({ id: mp.id });
                                }
                              }}
                              title="Excluir Marketplace"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shipping Ranges Modal */}
        <Dialog open={shippingOpen} onOpenChange={(v) => { setShippingOpen(v); if (!v) cancelEditShipping(); }}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                Faixas de Frete - {marketplaces?.find(m => m.id === selectedMarketplace)?.name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Add new shipping range form */}
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Adicionar Nova Faixa</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleShippingSubmit} className="flex flex-wrap gap-3 items-end">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Peso Mínimo (g)</Label>
                      <Input 
                        type="number" 
                        step="1" 
                        min="0"
                        placeholder="0" 
                        value={shippingForm.minWeight} 
                        onChange={(e) => setShippingForm({ ...shippingForm, minWeight: e.target.value })} 
                        className="w-28"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Peso Máximo (g)</Label>
                      <Input 
                        type="number" 
                        step="1" 
                        min="1"
                        placeholder="500" 
                        value={shippingForm.maxWeight} 
                        onChange={(e) => setShippingForm({ ...shippingForm, maxWeight: e.target.value })} 
                        className="w-28"
                        required
                      />
                    </div>
                    <div className="space-y-1.5 flex-1 min-w-[120px]">
                      <Label className="text-xs">Custo do Frete (R$)</Label>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0"
                        placeholder="15.90" 
                        value={shippingForm.cost} 
                        onChange={(e) => setShippingForm({ ...shippingForm, cost: e.target.value })} 
                        required
                      />
                    </div>
                    <Button type="submit" disabled={createShippingMutation.isPending} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Adicionar
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Shipping ranges table */}
              {shippingRanges?.length ? (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="text-left py-3 px-4 font-medium text-sm">Peso Mínimo</th>
                        <th className="text-left py-3 px-4 font-medium text-sm">Peso Máximo</th>
                        <th className="text-right py-3 px-4 font-medium text-sm">Custo do Frete</th>
                        <th className="text-right py-3 px-4 font-medium text-sm w-32">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shippingRanges.map((sr) => (
                        <tr key={sr.id} className="border-t hover:bg-muted/30 transition-colors">
                          {editShippingId === sr.id ? (
                            <>
                              <td className="py-2 px-4">
                                <Input 
                                  type="number" 
                                  step="1"
                                  value={editShippingForm.minWeight} 
                                  onChange={(e) => setEditShippingForm({ ...editShippingForm, minWeight: e.target.value })}
                                  className="w-24 h-8"
                                />
                              </td>
                              <td className="py-2 px-4">
                                <Input 
                                  type="number" 
                                  step="1"
                                  value={editShippingForm.maxWeight} 
                                  onChange={(e) => setEditShippingForm({ ...editShippingForm, maxWeight: e.target.value })}
                                  className="w-24 h-8"
                                />
                              </td>
                              <td className="py-2 px-4 text-right">
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  value={editShippingForm.cost} 
                                  onChange={(e) => setEditShippingForm({ ...editShippingForm, cost: e.target.value })}
                                  className="w-28 h-8 ml-auto"
                                />
                              </td>
                              <td className="py-2 px-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="default" 
                                    size="sm"
                                    onClick={handleUpdateShipping}
                                    disabled={updateShippingMutation.isPending}
                                  >
                                    Salvar
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={cancelEditShipping}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4">
                                <span className="font-mono text-sm">{formatWeight(sr.minWeight)}</span>
                              </td>
                              <td className="py-3 px-4">
                                <span className="font-mono text-sm">{formatWeight(sr.maxWeight)}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <span className="font-mono text-sm font-medium text-green-600 dark:text-green-400">
                                  {formatCurrency(sr.cost)}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEditShipping(sr)}
                                    title="Editar Faixa"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      if (confirm("Deseja excluir esta faixa de frete?")) {
                                        deleteShippingMutation.mutate({ id: sr.id });
                                      }
                                    }}
                                    title="Excluir Faixa"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                </div>
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg bg-muted/20">
                  <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">Nenhuma faixa de frete cadastrada</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Adicione faixas de peso para calcular o custo de envio automaticamente
                  </p>
                </div>
              )}

              {/* Help text */}
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Dica:</strong> As faixas de frete são usadas para calcular automaticamente o custo de envio 
                com base no peso do produto. O sistema considera o maior valor entre o peso real e o peso cubado 
                (calculado a partir das dimensões).
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
