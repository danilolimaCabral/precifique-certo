import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Settings, Plus, Pencil, Trash2, Percent, DollarSign, Calculator } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export default function Configuracoes() {
  const [chargeOpen, setChargeOpen] = useState(false);
  const [editChargeId, setEditChargeId] = useState<number | null>(null);
  const [settingsForm, setSettingsForm] = useState({ taxName: "", taxPercent: "", adsPercent: "", opexType: "percent" as "percent" | "fixed", opexValue: "", minMarginTarget: "" });
  const [chargeForm, setChargeForm] = useState({ name: "", chargeType: "percent_sale" as "percent_sale" | "percent_cost" | "fixed", value: "", isActive: true });

  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const { data: customCharges } = trpc.customCharges.list.useQuery();
  const updateSettingsMutation = trpc.settings.update.useMutation({ onSuccess: () => { utils.settings.get.invalidate(); toast.success("Configurações salvas!"); } });
  const createChargeMutation = trpc.customCharges.create.useMutation({ onSuccess: () => { utils.customCharges.list.invalidate(); setChargeOpen(false); resetChargeForm(); toast.success("Encargo criado!"); } });
  const updateChargeMutation = trpc.customCharges.update.useMutation({ onSuccess: () => { utils.customCharges.list.invalidate(); setChargeOpen(false); resetChargeForm(); toast.success("Encargo atualizado!"); } });
  const deleteChargeMutation = trpc.customCharges.delete.useMutation({ onSuccess: () => { utils.customCharges.list.invalidate(); toast.success("Encargo excluído!"); } });

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        taxName: settings.taxName || "",
        taxPercent: String(settings.taxPercent || ""),
        adsPercent: String(settings.adsPercent || ""),
        opexType: settings.opexType || "percent",
        opexValue: String(settings.opexValue || ""),
        minMarginTarget: String(settings.minMarginTarget || ""),
      });
    }
  }, [settings]);

  const resetChargeForm = () => { setChargeForm({ name: "", chargeType: "percent_sale", value: "", isActive: true }); setEditChargeId(null); };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettingsMutation.mutate(settingsForm);
  };

  const handleChargeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editChargeId) { updateChargeMutation.mutate({ id: editChargeId, ...chargeForm }); }
    else { createChargeMutation.mutate(chargeForm); }
  };

  const handleEditCharge = (charge: NonNullable<typeof customCharges>[number]) => {
    setChargeForm({ name: charge.name, chargeType: charge.chargeType as "percent_sale" | "percent_cost" | "fixed", value: String(charge.value), isActive: charge.isActive });
    setEditChargeId(charge.id);
    setChargeOpen(true);
  };

  const chargeTypeLabels = { percent_sale: "% sobre Venda", percent_cost: "% sobre Custo", fixed: "Valor Fixo (R$)" };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Configure impostos, ADS, OPEX e encargos personalizados</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calculator className="h-5 w-5" />Configurações Gerais</CardTitle>
              <CardDescription>Defina os parâmetros padrão para cálculos</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : (
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome do Imposto</Label>
                      <Input value={settingsForm.taxName} onChange={(e) => setSettingsForm({ ...settingsForm, taxName: e.target.value })} placeholder="Ex: Simples Nacional" />
                    </div>
                    <div className="space-y-2">
                      <Label>Alíquota (%)</Label>
                      <Input type="number" step="0.01" value={settingsForm.taxPercent} onChange={(e) => setSettingsForm({ ...settingsForm, taxPercent: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>ADS - Publicidade (%)</Label>
                    <Input type="number" step="0.01" value={settingsForm.adsPercent} onChange={(e) => setSettingsForm({ ...settingsForm, adsPercent: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de OPEX</Label>
                      <Select value={settingsForm.opexType} onValueChange={(v) => setSettingsForm({ ...settingsForm, opexType: v as "percent" | "fixed" })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="percent">Percentual (%)</SelectItem>
                          <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Valor OPEX</Label>
                      <Input type="number" step="0.01" value={settingsForm.opexValue} onChange={(e) => setSettingsForm({ ...settingsForm, opexValue: e.target.value })} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Meta de Margem Mínima (%)</Label>
                    <Input type="number" step="0.01" value={settingsForm.minMarginTarget} onChange={(e) => setSettingsForm({ ...settingsForm, minMarginTarget: e.target.value })} />
                  </div>
                  <Button type="submit" className="w-full" disabled={updateSettingsMutation.isPending}>Salvar Configurações</Button>
                </form>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><Percent className="h-5 w-5" />Encargos Personalizados</CardTitle>
                  <CardDescription>Adicione impostos e taxas extras</CardDescription>
                </div>
                <Dialog open={chargeOpen} onOpenChange={(v) => { setChargeOpen(v); if (!v) resetChargeForm(); }}>
                  <DialogTrigger asChild>
                    <Button size="sm"><Plus className="h-4 w-4 mr-1" />Novo</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editChargeId ? "Editar Encargo" : "Novo Encargo"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleChargeSubmit} className="space-y-4">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input value={chargeForm.name} onChange={(e) => setChargeForm({ ...chargeForm, name: e.target.value })} placeholder="Ex: DIFAL, Taxa Extra" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Tipo de Cálculo</Label>
                        <Select value={chargeForm.chargeType} onValueChange={(v) => setChargeForm({ ...chargeForm, chargeType: v as "percent_sale" | "percent_cost" | "fixed" })}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percent_sale">% sobre Preço de Venda</SelectItem>
                            <SelectItem value="percent_cost">% sobre Custo do Produto</SelectItem>
                            <SelectItem value="fixed">Valor Fixo (R$)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Valor</Label>
                        <Input type="number" step="0.01" value={chargeForm.value} onChange={(e) => setChargeForm({ ...chargeForm, value: e.target.value })} required />
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch checked={chargeForm.isActive} onCheckedChange={(v) => setChargeForm({ ...chargeForm, isActive: v })} />
                        <Label>Ativo</Label>
                      </div>
                      <Button type="submit" className="w-full" disabled={createChargeMutation.isPending || updateChargeMutation.isPending}>
                        {editChargeId ? "Salvar" : "Criar"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {!customCharges?.length ? (
                <div className="text-center py-8 text-muted-foreground">Nenhum encargo personalizado</div>
              ) : (
                <div className="space-y-2">
                  {customCharges.map((charge) => (
                    <div key={charge.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{charge.name}</p>
                        <p className="text-sm text-muted-foreground">{chargeTypeLabels[charge.chargeType as keyof typeof chargeTypeLabels]}: {charge.value}{charge.chargeType !== "fixed" ? "%" : ""}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs ${charge.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {charge.isActive ? "Ativo" : "Inativo"}
                        </span>
                        <Button variant="ghost" size="icon" onClick={() => handleEditCharge(charge)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteChargeMutation.mutate({ id: charge.id })}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
