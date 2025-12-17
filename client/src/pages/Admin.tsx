import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Users, Shield, ShieldCheck, Store, Loader2, Copy, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { useEffect, useState } from "react";

export default function Admin() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
  const [sourceUserId, setSourceUserId] = useState<number | null>(null);
  const [targetUserId, setTargetUserId] = useState<number | null>(null);
  
  const { data: users, isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const { data: usersWithMarketplaces, refetch: refetchWithMarketplaces } = trpc.admin.listUsersWithMarketplaces.useQuery();
  
  const updateRole = trpc.admin.updateUserRole.useMutation({
    onSuccess: () => {
      toast.success("Permissão atualizada com sucesso!");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar permissão");
    },
  });

  const duplicateMarketplaces = trpc.admin.duplicateMarketplaces.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setDuplicateDialogOpen(false);
      setSourceUserId(null);
      setTargetUserId(null);
      refetchWithMarketplaces();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao duplicar marketplaces");
    },
  });

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "admin") {
      setLocation("/");
      toast.error("Acesso restrito a administradores");
    }
  }, [user, setLocation]);

  if (!user || user.role !== "admin") {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const handleRoleChange = (userId: number, newRole: "user" | "admin") => {
    if (userId === user.id) {
      toast.error("Você não pode alterar sua própria permissão");
      return;
    }
    updateRole.mutate({ userId, role: newRole });
  };

  const handleDuplicate = () => {
    if (!sourceUserId || !targetUserId) {
      toast.error("Selecione o usuário de origem e destino");
      return;
    }
    if (sourceUserId === targetUserId) {
      toast.error("Usuário de origem e destino não podem ser iguais");
      return;
    }
    duplicateMarketplaces.mutate({ sourceUserId, targetUserId });
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const usersWithMp = usersWithMarketplaces || [];
  const usersWithMarketplacesSource = usersWithMp.filter((u: any) => u.marketplacesCount > 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Administração</h1>
              <p className="text-muted-foreground">Gerencie usuários e permissões do sistema</p>
            </div>
          </div>
          
          {/* Duplicate Marketplaces Button */}
          <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
                <Copy className="h-4 w-4" />
                Duplicar Marketplaces
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-green-500" />
                  Duplicar Marketplaces
                </DialogTitle>
                <DialogDescription>
                  Copie todos os marketplaces e faixas de frete de um usuário para outro. Útil para configurar novos clientes rapidamente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Usuário de Origem (copiar de)</label>
                  <Select
                    value={sourceUserId?.toString() || ""}
                    onValueChange={(value) => setSourceUserId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o usuário de origem" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersWithMarketplacesSource.map((u: any) => (
                        <SelectItem key={u.id} value={u.id.toString()}>
                          <div className="flex items-center gap-2">
                            <span>{u.name || u.email || "Usuário " + u.id}</span>
                            <Badge variant="secondary" className="text-xs">
                              {u.marketplacesCount} marketplace(s)
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {usersWithMarketplacesSource.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      Nenhum usuário possui marketplaces cadastrados ainda.
                    </p>
                  )}
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="h-6 w-6 text-muted-foreground" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Usuário de Destino (copiar para)</label>
                  <Select
                    value={targetUserId?.toString() || ""}
                    onValueChange={(value) => setTargetUserId(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o usuário de destino" />
                    </SelectTrigger>
                    <SelectContent>
                      {usersWithMp
                        .filter((u: any) => u.id !== sourceUserId)
                        .map((u: any) => (
                          <SelectItem key={u.id} value={u.id.toString()}>
                            <div className="flex items-center gap-2">
                              <span>{u.name || u.email || "Usuário " + u.id}</span>
                              <Badge variant="outline" className="text-xs">
                                {u.marketplacesCount} marketplace(s)
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {sourceUserId && targetUserId && (
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-sm text-amber-800">
                      <strong>Atenção:</strong> Esta ação irá adicionar os marketplaces do usuário de origem ao usuário de destino. Os marketplaces existentes do destino não serão removidos.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  onClick={handleDuplicate}
                  disabled={!sourceUserId || !targetUserId || duplicateMarketplaces.isPending}
                  className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                >
                  {duplicateMarketplaces.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Duplicando...
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{users?.length || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Administradores</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold">{users?.filter(u => u.role === "admin").length || 0}</span>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Usuários Comuns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{users?.filter(u => u.role === "user").length || 0}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Usuários do Sistema</CardTitle>
            <CardDescription>
              Gerencie as permissões de acesso de cada usuário. Cada usuário tem seus próprios dados isolados (materiais, produtos, marketplaces).
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Marketplaces</TableHead>
                    <TableHead>Permissão</TableHead>
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Último Acesso</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usersWithMp.map((u: any) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-xs font-semibold text-primary">
                              {u.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                          <span>{u.name || "Sem nome"}</span>
                          {u.id === user.id && (
                            <Badge variant="outline" className="ml-2 text-xs">Você</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.email || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1">
                          <Store className="h-3 w-3" />
                          {u.marketplacesCount}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className={u.role === "admin" ? "bg-purple-500" : ""}>
                          {u.role === "admin" ? "Admin" : "Usuário"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(u.createdAt)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(u.lastSignedIn)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Select
                          value={u.role}
                          onValueChange={(value) => handleRoleChange(u.id, value as "user" | "admin")}
                          disabled={u.id === user.id || updateRole.isPending}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">Usuário</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="border-0 shadow-md bg-gradient-to-br from-amber-50 to-white">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-amber-500" />
              Sobre o Sistema Multi-Tenant
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Isolamento de Dados:</strong> Cada usuário tem seus próprios materiais, produtos, marketplaces e configurações. Um usuário nunca vê os dados de outro.
            </p>
            <p>
              <strong>Duplicar Marketplaces:</strong> Use o botão "Duplicar Marketplaces" para copiar rapidamente a configuração de marketplaces e faixas de frete de um usuário para outro.
            </p>
            <p>
              <strong>Administradores:</strong> Podem acessar esta página para gerenciar permissões de outros usuários e duplicar configurações.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
