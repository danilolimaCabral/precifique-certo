import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Store, Plus, Pencil, Trash2, Truck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Marketplaces() {
  const [open, setOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", commissionPercent: "", fixedFee: "", logisticsType: "", freeShipping: false, isActive: true });
  const [shippingForm, setShippingForm] = useState({ minWeight: "", maxWeight: "", cost: "" });

  const utils = trpc.useUtils();
  const { data: marketplaces, isLoading } = trpc.marketplaces.list.useQuery();
  const { data: shippingRanges } = trpc.shippingRanges.list.useQuery({ marketplaceId: selectedMarketplace || 0 }, { enabled: !!selectedMarketplace });

  const createMutation = trpc.marketplaces.create.useMutation({ onSuccess: () => { utils.marketplaces.list.invalidate(); setOpen(false); resetForm(); toast.success("Marketplace criado!"); } });
  const updateMutation = trpc.marketplaces.update.useMutation({ onSuccess: () => { utils.marketplaces.list.invalidate(); setOpen(false); resetForm(); toast.success("Marketplace atualizado!"); } });
  const deleteMutation = trpc.marketplaces.delete.useMutation({ onSuccess: () => { utils.marketplaces.list.invalidate(); toast.success("Marketplace excluído!"); } });
  const createShippingMutation = trpc.shippingRanges.create.useMutation({ onSuccess: () => { utils.shippingRanges.list.invalidate(); setShippingForm({ minWeight: "", maxWeight: "", cost: "" }); toast.success("Faixa de frete adicionada!"); } });
  const deleteShippingMutation = trpc.shippingRanges.delete.useMutation({ onSuccess: () => { utils.shippingRanges.list.invalidate(); toast.success("Faixa removida!"); } });

  const resetForm = () => { setForm({ name: "", commissionPercent: "", fixedFee: "", logisticsType: "", freeShipping: false, isActive: true }); setEditId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) { updateMutation.mutate({ id: editId, ...form }); }
    else { createMutation.mutate(form); }
  };

  const handleEdit = (mp: NonNullable<typeof marketplaces>[number]) => {
    setForm({ name: mp.name, commissionPercent: String(mp.commissionPercent), fixedFee: String(mp.fixedFee || ""), logisticsType: mp.logisticsType || "", freeShipping: mp.freeShipping || false, isActive: mp.isActive });
    setEditId(mp.id);
    setOpen(true);
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMarketplace) return;
    createShippingMutation.mutate({ marketplaceId: selectedMarketplace, ...shippingForm });
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Marketplaces</h1>
            <p className="text-muted-foreground">Configure canais de venda e faixas de frete</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Marketplace</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Marketplace" : "Novo Marketplace"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Mercado Livre, Shopee" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Comissão (%)</Label>
                    <Input type="number" step="0.01" value={form.commissionPercent} onChange={(e) => setForm({ ...form, commissionPercent: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Taxa Fixa (R$)</Label>
                    <Input type="number" step="0.01" value={form.fixedFee} onChange={(e) => setForm({ ...form, fixedFee: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Logística</Label>
                  <Input value={form.logisticsType} onChange={(e) => setForm({ ...form, logisticsType: e.target.value })} placeholder="Ex: Full, Flex, FBA" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch checked={form.freeShipping} onCheckedChange={(v) => setForm({ ...form, freeShipping: v })} />
                    <Label>Frete Grátis</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                    <Label>Ativo</Label>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editId ? "Salvar" : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" />Lista de Marketplaces</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !marketplaces?.length ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum marketplace cadastrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
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
                      <tr key={mp.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-medium">{mp.name}</td>
                        <td className="py-3 px-4 text-center">{mp.commissionPercent}%</td>
                        <td className="py-3 px-4 text-center">{formatCurrency(mp.fixedFee)}</td>
                        <td className="py-3 px-4 text-center">{mp.logisticsType || "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${mp.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {mp.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedMarketplace(mp.id); setShippingOpen(true); }}><Truck className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(mp)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: mp.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

        <Dialog open={shippingOpen} onOpenChange={setShippingOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Faixas de Frete - {marketplaces?.find(m => m.id === selectedMarketplace)?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <form onSubmit={handleShippingSubmit} className="flex gap-4">
                <Input type="number" step="0.01" placeholder="Peso Mín (g)" value={shippingForm.minWeight} onChange={(e) => setShippingForm({ ...shippingForm, minWeight: e.target.value })} className="w-32" />
                <Input type="number" step="0.01" placeholder="Peso Máx (g)" value={shippingForm.maxWeight} onChange={(e) => setShippingForm({ ...shippingForm, maxWeight: e.target.value })} className="w-32" />
                <Input type="number" step="0.01" placeholder="Custo (R$)" value={shippingForm.cost} onChange={(e) => setShippingForm({ ...shippingForm, cost: e.target.value })} className="flex-1" />
                <Button type="submit" disabled={createShippingMutation.isPending}><Plus className="h-4 w-4" /></Button>
              </form>
              {shippingRanges?.length ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Peso Mínimo</th>
                      <th className="text-left py-2 px-4 font-medium">Peso Máximo</th>
                      <th className="text-right py-2 px-4 font-medium">Custo</th>
                      <th className="text-right py-2 px-4 font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shippingRanges.map((sr) => (
                      <tr key={sr.id} className="border-b">
                        <td className="py-2 px-4">{sr.minWeight}g</td>
                        <td className="py-2 px-4">{sr.maxWeight}g</td>
                        <td className="py-2 px-4 text-right">{formatCurrency(sr.cost)}</td>
                        <td className="py-2 px-4 text-right">
                          <Button variant="ghost" size="icon" onClick={() => deleteShippingMutation.mutate({ id: sr.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">Nenhuma faixa de frete cadastrada</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
