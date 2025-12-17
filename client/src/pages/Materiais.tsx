import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Package, Plus, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Materiais() {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ sku: "", description: "", type: "insumo" as "insumo" | "embalagem", unitCost: "", isActive: true });

  const utils = trpc.useUtils();
  const { data: materials, isLoading } = trpc.materials.list.useQuery();
  const { data: limits } = trpc.plans.myLimits.useQuery();
  const createMutation = trpc.materials.create.useMutation({ onSuccess: () => { utils.materials.list.invalidate(); utils.plans.myLimits.invalidate(); setOpen(false); resetForm(); toast.success("Material criado!"); } });
  const updateMutation = trpc.materials.update.useMutation({ onSuccess: () => { utils.materials.list.invalidate(); setOpen(false); resetForm(); toast.success("Material atualizado!"); } });
  const deleteMutation = trpc.materials.delete.useMutation({ onSuccess: () => { utils.materials.list.invalidate(); toast.success("Material excluído!"); } });

  const resetForm = () => { setForm({ sku: "", description: "", type: "insumo", unitCost: "", isActive: true }); setEditId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) { updateMutation.mutate({ id: editId, ...form }); }
    else { createMutation.mutate(form); }
  };

  const handleEdit = (material: NonNullable<typeof materials>[number]) => {
    setForm({ sku: material.sku, description: material.description || "", type: material.type as "insumo" | "embalagem", unitCost: String(material.unitCost), isActive: material.isActive });
    setEditId(material.id);
    setOpen(true);
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
            <h1 className="text-3xl font-bold tracking-tight">Materiais</h1>
            <p className="text-muted-foreground">Gerencie insumos e embalagens</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button 
                disabled={limits && !limits.canCreateMaterial}
                onClick={() => {
                  if (limits && !limits.canCreateMaterial) {
                    toast.error(`Limite atingido! Seu plano permite ${limits.materialsLimit} materiais. Faça upgrade para adicionar mais.`);
                    return;
                  }
                }}
              ><Plus className="h-4 w-4 mr-2" />Novo Material</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Material" : "Novo Material"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>SKU</Label>
                  <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as "insumo" | "embalagem" })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="insumo">Insumo</SelectItem>
                      <SelectItem value="embalagem">Embalagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Custo Unitário (R$)</Label>
                  <Input type="number" step="0.01" value={form.unitCost} onChange={(e) => setForm({ ...form, unitCost: e.target.value })} required />
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} />
                  <Label>Ativo</Label>
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
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" />Lista de Materiais</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !materials?.length ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum material cadastrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">SKU</th>
                      <th className="text-left py-3 px-4 font-medium">Descrição</th>
                      <th className="text-left py-3 px-4 font-medium">Tipo</th>
                      <th className="text-right py-3 px-4 font-medium">Custo</th>
                      <th className="text-center py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materials.map((m) => (
                      <tr key={m.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-sm">{m.sku}</td>
                        <td className="py-3 px-4">{m.description}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.type === "insumo" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                            {m.type === "insumo" ? "Insumo" : "Embalagem"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono">{formatCurrency(m.unitCost)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${m.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {m.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(m)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: m.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
      </div>
    </DashboardLayout>
  );
}
