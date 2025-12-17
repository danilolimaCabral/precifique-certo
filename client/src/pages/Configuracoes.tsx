import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Settings, Plus, Pencil, Trash2, Percent, DollarSign, Calculator, Search, Check, ChevronsUpDown, Building2 } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Configuracoes() {
  const [chargeOpen, setChargeOpen] = useState(false);
  const [editChargeId, setEditChargeId] = useState<number | null>(null);
  const [regimeOpen, setRegimeOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({ 
    taxRegimeId: undefined as number | undefined,
    taxName: "", 
    taxPercent: "", 
    adsPercent: "", 
    opexType: "percent" as "percent" | "fixed", 
    opexValue: "", 
    minMarginTarget: "" 
  });
  const [chargeForm, setChargeForm] = useState({ name: "", chargeType: "percent_sale" as "percent_sale" | "percent_cost" | "fixed", value: "", isActive: true });
  const [customRegimeName, setCustomRegimeName] = useState("");

  const utils = trpc.useUtils();
  const { data: settings, isLoading } = trpc.settings.get.useQuery();
  const { data: taxRegimes } = trpc.taxRegimes.list.useQuery();
  const { data: customCharges } = trpc.customCharges.list.useQuery();
  const updateSettingsMutation = trpc.settings.update.useMutation({ 
    onSuccess: () => { 
      utils.settings.get.invalidate(); 
      toast.success("Configurações salvas!"); 
    } 
  });
  const createChargeMutation = trpc.customCharges.create.useMutation({ onSuccess: () => { utils.customCharges.list.invalidate(); setChargeOpen(false); resetChargeForm(); toast.success("Encargo criado!"); } });
  const updateChargeMutation = trpc.customCharges.update.useMutation({ onSuccess: () => { utils.customCharges.list.invalidate(); setChargeOpen(false); resetChargeForm(); toast.success("Encargo atualizado!"); } });
  const deleteChargeMutation = trpc.customCharges.delete.useMutation({ onSuccess: () => { utils.customCharges.list.invalidate(); toast.success("Encargo excluído!"); } });

  // Find selected regime
  const selectedRegime = useMemo(() => {
    if (!taxRegimes || !settingsForm.taxRegimeId) return null;
    return taxRegimes.find(r => r.id === settingsForm.taxRegimeId);
  }, [taxRegimes, settingsForm.taxRegimeId]);

  // Check if "Outro (Personalizado)" is selected
  const isCustomRegime = selectedRegime?.name === "Outro (Personalizado)";

  useEffect(() => {
    if (settings) {
      setSettingsForm({
        taxRegimeId: settings.taxRegimeId ?? undefined,
        taxName: settings.taxName || "",
        taxPercent: String(settings.taxPercent || ""),
        adsPercent: String(settings.adsPercent || ""),
        opexType: settings.opexType || "percent",
        opexValue: String(settings.opexValue || ""),
        minMarginTarget: String(settings.minMarginTarget || ""),
      });
      if (settings.taxName && settings.taxName !== "Simples Nacional") {
        setCustomRegimeName(settings.taxName);
      }
    }
  }, [settings]);

  // Auto-fill tax rate when regime changes
  const handleRegimeSelect = (regimeId: number) => {
    const regime = taxRegimes?.find(r => r.id === regimeId);
    if (regime) {
      setSettingsForm(prev => ({
        ...prev,
        taxRegimeId: regimeId,
        taxPercent: String(regime.defaultRate),
        taxName: regime.name === "Outro (Personalizado)" ? customRegimeName : regime.name,
      }));
    }
    setRegimeOpen(false);
  };

  const resetChargeForm = () => { setChargeForm({ name: "", chargeType: "percent_sale", value: "", isActive: true }); setEditChargeId(null); };

  const handleSettingsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm.taxRegimeId) {
      toast.error("Selecione um regime tributário para continuar");
      return;
    }
    const dataToSave = {
      ...settingsForm,
      taxName: isCustomRegime ? customRegimeName : selectedRegime?.name || settingsForm.taxName,
    };
    updateSettingsMutation.mutate(dataToSave);
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
          <p className="text-muted-foreground">Configure regime tributário, ADS, OPEX e encargos personalizados</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Regime Tributário</CardTitle>
              <CardDescription>Selecione o regime tributário da sua empresa</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Carregando...</div>
              ) : (
                <form onSubmit={handleSettingsSubmit} className="space-y-4">
                  {/* Tax Regime Select with Search */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1">
                      Regime Tributário
                      <span className="text-destructive">*</span>
                    </Label>
                    <Popover open={regimeOpen} onOpenChange={setRegimeOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={regimeOpen}
                          className="w-full justify-between"
                        >
                          <span className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            {selectedRegime ? selectedRegime.name : "Selecione o regime tributário"}
                          </span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Buscar regime tributário..." />
                          <CommandList>
                            <CommandEmpty>Nenhum regime encontrado.</CommandEmpty>
                            <CommandGroup>
                              {taxRegimes?.map((regime) => (
                                <CommandItem
                                  key={regime.id}
                                  value={regime.name}
                                  onSelect={() => handleRegimeSelect(regime.id)}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      settingsForm.taxRegimeId === regime.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex flex-col">
                                    <span>{regime.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                      Alíquota padrão: {regime.defaultRate}%
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {!settingsForm.taxRegimeId && (
                      <p className="text-sm text-destructive">Selecione um regime tributário para continuar</p>
                    )}
                  </div>

                  {/* Custom Regime Name (only shown when "Outro" is selected) */}
                  {isCustomRegime && (
                    <div className="space-y-2">
                      <Label>Nome do Regime Personalizado</Label>
                      <Input 
                        value={customRegimeName} 
                        onChange={(e) => setCustomRegimeName(e.target.value)} 
                        placeholder="Digite o nome do regime" 
                        required
                      />
                    </div>
                  )}

                  {/* Tax Rate */}
                  <div className="space-y-2">
                    <Label>Alíquota (%)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={settingsForm.taxPercent} 
                      onChange={(e) => setSettingsForm({ ...settingsForm, taxPercent: e.target.value })} 
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      A alíquota padrão foi preenchida automaticamente. Você pode ajustar conforme necessário.
                    </p>
                  </div>

                  {/* ADS */}
                  <div className="space-y-2">
                    <Label>ADS - Publicidade (%)</Label>
                    <Input type="number" step="0.01" value={settingsForm.adsPercent} onChange={(e) => setSettingsForm({ ...settingsForm, adsPercent: e.target.value })} />
                  </div>

                  {/* OPEX */}
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

                  {/* Min Margin Target */}
                  <div className="space-y-2">
                    <Label>Meta de Margem Mínima (%)</Label>
                    <Input type="number" step="0.01" value={settingsForm.minMarginTarget} onChange={(e) => setSettingsForm({ ...settingsForm, minMarginTarget: e.target.value })} />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={updateSettingsMutation.isPending || !settingsForm.taxRegimeId}
                  >
                    Salvar Configurações
                  </Button>
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
