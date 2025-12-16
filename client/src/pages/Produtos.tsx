import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Boxes, Plus, Pencil, Trash2, Package } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Produtos() {
  const [open, setOpen] = useState(false);
  const [bomOpen, setBomOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<number | null>(null);
  const [form, setForm] = useState({ sku: "", name: "", height: "", width: "", length: "", realWeight: "", isActive: true });
  const [bomForm, setBomForm] = useState({ materialId: "", quantity: "" });

  const utils = trpc.useUtils();
  const { data: products, isLoading } = trpc.products.list.useQuery();
  const { data: materials } = trpc.materials.list.useQuery();
  const { data: productMaterials } = trpc.productMaterials.list.useQuery({ productId: selectedProduct || 0 }, { enabled: !!selectedProduct });

  const createMutation = trpc.products.create.useMutation({ onSuccess: () => { utils.products.list.invalidate(); setOpen(false); resetForm(); toast.success("Produto criado!"); } });
  const updateMutation = trpc.products.update.useMutation({ onSuccess: () => { utils.products.list.invalidate(); setOpen(false); resetForm(); toast.success("Produto atualizado!"); } });
  const deleteMutation = trpc.products.delete.useMutation({ onSuccess: () => { utils.products.list.invalidate(); toast.success("Produto excluído!"); } });
  const addBomMutation = trpc.productMaterials.add.useMutation({ onSuccess: () => { utils.productMaterials.list.invalidate(); setBomForm({ materialId: "", quantity: "" }); toast.success("Material adicionado!"); } });
  const deleteBomMutation = trpc.productMaterials.delete.useMutation({ onSuccess: () => { utils.productMaterials.list.invalidate(); toast.success("Material removido!"); } });

  const resetForm = () => { setForm({ sku: "", name: "", height: "", width: "", length: "", realWeight: "", isActive: true }); setEditId(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) { updateMutation.mutate({ id: editId, ...form }); }
    else { createMutation.mutate(form); }
  };

  const handleEdit = (product: NonNullable<typeof products>[number]) => {
    setForm({ sku: product.sku, name: product.name || "", height: String(product.height || ""), width: String(product.width || ""), length: String(product.length || ""), realWeight: String(product.realWeight || ""), isActive: product.isActive });
    setEditId(product.id);
    setOpen(true);
  };

  const handleBomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    addBomMutation.mutate({ productId: selectedProduct, materialId: Number(bomForm.materialId), quantity: bomForm.quantity });
  };

  const formatCurrency = (value: string | number | null) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
  };

  const calculateProductCost = (productId: number) => {
    if (!productMaterials || selectedProduct !== productId) return 0;
    return productMaterials.reduce((sum, pm) => {
      const material = materials?.find(m => m.id === pm.materialId);
      return sum + (Number(material?.unitCost || 0) * Number(pm.quantity));
    }, 0);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
            <p className="text-muted-foreground">Gerencie produtos e lista de materiais (BOM)</p>
          </div>
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Novo Produto</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editId ? "Editar Produto" : "Novo Produto"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>SKU</Label>
                    <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Nome</Label>
                    <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Altura (cm)</Label>
                    <Input type="number" step="0.01" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Largura (cm)</Label>
                    <Input type="number" step="0.01" value={form.width} onChange={(e) => setForm({ ...form, width: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Comprimento (cm)</Label>
                    <Input type="number" step="0.01" value={form.length} onChange={(e) => setForm({ ...form, length: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Peso Real (g)</Label>
                    <Input type="number" step="0.01" value={form.realWeight} onChange={(e) => setForm({ ...form, realWeight: e.target.value })} />
                  </div>
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
            <CardTitle className="flex items-center gap-2"><Boxes className="h-5 w-5" />Lista de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : !products?.length ? (
              <div className="text-center py-8 text-muted-foreground">Nenhum produto cadastrado</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium">SKU</th>
                      <th className="text-left py-3 px-4 font-medium">Nome</th>
                      <th className="text-center py-3 px-4 font-medium">Dimensões</th>
                      <th className="text-center py-3 px-4 font-medium">Peso</th>
                      <th className="text-center py-3 px-4 font-medium">Status</th>
                      <th className="text-right py-3 px-4 font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4 font-mono text-sm">{p.sku}</td>
                        <td className="py-3 px-4">{p.name}</td>
                        <td className="py-3 px-4 text-center text-sm">{p.height && p.width && p.length ? `${p.height}x${p.width}x${p.length} cm` : "-"}</td>
                        <td className="py-3 px-4 text-center text-sm">{p.realWeight ? `${p.realWeight}g` : "-"}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                            {p.isActive ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => { setSelectedProduct(p.id); setBomOpen(true); }}><Package className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate({ id: p.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

        <Dialog open={bomOpen} onOpenChange={setBomOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Lista de Materiais (BOM) - {products?.find(p => p.id === selectedProduct)?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <form onSubmit={handleBomSubmit} className="flex gap-4">
                <Select value={bomForm.materialId} onValueChange={(v) => setBomForm({ ...bomForm, materialId: v })}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Selecione um material" /></SelectTrigger>
                  <SelectContent>
                    {materials?.filter(m => m.isActive).map(m => (
                      <SelectItem key={m.id} value={String(m.id)}>{m.sku} - {m.description}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input type="number" step="0.0001" placeholder="Quantidade" value={bomForm.quantity} onChange={(e) => setBomForm({ ...bomForm, quantity: e.target.value })} className="w-32" />
                <Button type="submit" disabled={addBomMutation.isPending}><Plus className="h-4 w-4" /></Button>
              </form>
              {productMaterials?.length ? (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4 font-medium">Material</th>
                      <th className="text-right py-2 px-4 font-medium">Quantidade</th>
                      <th className="text-right py-2 px-4 font-medium">Custo Unit.</th>
                      <th className="text-right py-2 px-4 font-medium">Subtotal</th>
                      <th className="text-right py-2 px-4 font-medium">Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productMaterials.map((pm) => {
                      const material = materials?.find(m => m.id === pm.materialId);
                      const subtotal = Number(material?.unitCost || 0) * Number(pm.quantity);
                      return (
                        <tr key={pm.id} className="border-b">
                          <td className="py-2 px-4">{material?.sku} - {material?.description}</td>
                          <td className="py-2 px-4 text-right">{pm.quantity}</td>
                          <td className="py-2 px-4 text-right">{formatCurrency(material?.unitCost || 0)}</td>
                          <td className="py-2 px-4 text-right font-medium">{formatCurrency(subtotal)}</td>
                          <td className="py-2 px-4 text-right">
                            <Button variant="ghost" size="icon" onClick={() => deleteBomMutation.mutate({ id: pm.id, productId: selectedProduct || 0 })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/50">
                      <td colSpan={3} className="py-2 px-4 font-bold">Custo Total do Produto</td>
                      <td className="py-2 px-4 text-right font-bold">{formatCurrency(calculateProductCost(selectedProduct || 0))}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              ) : (
                <div className="text-center py-4 text-muted-foreground">Nenhum material adicionado</div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
