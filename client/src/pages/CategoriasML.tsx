import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { Store, Search, ChevronRight, ArrowLeft, Plus, Loader2 } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
}

export default function CategoriasML() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<Category | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<Category[]>([]);

  const utils = trpc.useUtils();
  
  // Buscar categorias principais
  const { data: categories, isLoading: loadingCategories } = trpc.mercadoLivre.getCategories.useQuery();
  
  // Buscar subcategorias quando uma categoria é selecionada
  const { data: subcategories, isLoading: loadingSubcategories } = trpc.mercadoLivre.getSubcategories.useQuery(
    { categoryId: selectedCategory?.id || "" },
    { enabled: !!selectedCategory }
  );

  // Buscar detalhes da categoria para obter comissão
  const { data: categoryDetails } = trpc.mercadoLivre.getCategoryDetails.useQuery(
    { categoryId: selectedSubcategory?.id || selectedCategory?.id || "" },
    { enabled: !!(selectedSubcategory || selectedCategory) }
  );

  // Mutation para criar marketplace
  const createMarketplace = trpc.marketplaces.create.useMutation({
    onSuccess: () => {
      utils.marketplaces.list.invalidate();
      toast.success("Marketplace criado com sucesso!");
      // Reset selection
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setBreadcrumb([]);
    },
    onError: (error) => toast.error(`Erro ao criar: ${error.message}`)
  });

  // Filtrar categorias por busca
  const filteredCategories = useMemo(() => {
    if (!categories) return [];
    if (!searchTerm) return categories;
    return categories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [categories, searchTerm]);

  // Filtrar subcategorias por busca
  const filteredSubcategories = useMemo(() => {
    if (!subcategories) return [];
    if (!searchTerm) return subcategories;
    return subcategories.filter(cat => 
      cat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [subcategories, searchTerm]);

  const handleSelectCategory = (cat: Category) => {
    setSelectedCategory(cat);
    setSelectedSubcategory(null);
    setBreadcrumb([cat]);
    setSearchTerm("");
  };

  const handleSelectSubcategory = async (subcat: Category) => {
    setSelectedSubcategory(subcat);
    setBreadcrumb(prev => [...prev.slice(0, 1), subcat]);
  };

  const handleBack = () => {
    if (selectedSubcategory) {
      setSelectedSubcategory(null);
      setBreadcrumb(prev => prev.slice(0, 1));
    } else if (selectedCategory) {
      setSelectedCategory(null);
      setBreadcrumb([]);
    }
    setSearchTerm("");
  };

  const handleCreateMarketplace = () => {
    const categoryName = selectedSubcategory?.name || selectedCategory?.name;
    if (!categoryName) return;

    // Comissão padrão do ML (pode ser ajustada)
    const defaultCommission = "16"; // 16% é uma média comum no ML

    createMarketplace.mutate({
      name: `Mercado Livre - ${categoryName}`,
      commissionPercent: defaultCommission,
      fixedFee: "6.00", // Taxa fixa padrão do ML
      logisticsType: "Mercado Envios",
      freeShipping: false,
      isActive: true
    });
  };

  const currentList = selectedCategory ? filteredSubcategories : filteredCategories;
  const isLoading = loadingCategories || loadingSubcategories;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Categorias do Mercado Livre</h1>
            <p className="text-muted-foreground">
              Selecione uma categoria para criar um marketplace com comissões do ML
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Categorias */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Store className="h-5 w-5 text-primary" />
                    {selectedCategory ? "Subcategorias" : "Categorias Principais"}
                  </CardTitle>
                  {selectedCategory && (
                    <Button variant="ghost" size="sm" onClick={handleBack}>
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      Voltar
                    </Button>
                  )}
                </div>
                
                {/* Breadcrumb */}
                {breadcrumb.length > 0 && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                    <span className="cursor-pointer hover:text-primary" onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setBreadcrumb([]); }}>
                      Início
                    </span>
                    {breadcrumb.map((item, index) => (
                      <span key={item.id} className="flex items-center">
                        <ChevronRight className="h-3 w-3 mx-1" />
                        <span className={index === breadcrumb.length - 1 ? "text-foreground font-medium" : "cursor-pointer hover:text-primary"}>
                          {item.name}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </CardHeader>
              <CardContent>
                {/* Busca */}
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar categoria..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                {/* Lista */}
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : currentList.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    {searchTerm ? "Nenhuma categoria encontrada" : "Nenhuma categoria disponível"}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
                    {currentList.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => selectedCategory ? handleSelectSubcategory(cat) : handleSelectCategory(cat)}
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left hover:bg-accent hover:border-primary/50 ${
                          (selectedSubcategory?.id === cat.id) ? "bg-primary/10 border-primary" : ""
                        }`}
                      >
                        <span className="font-medium truncate">{cat.name}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Painel de Detalhes */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Detalhes da Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {selectedCategory || selectedSubcategory ? (
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Categoria Selecionada</p>
                      <p className="font-medium">{selectedSubcategory?.name || selectedCategory?.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">ID da Categoria</p>
                      <p className="font-mono text-sm">{selectedSubcategory?.id || selectedCategory?.id}</p>
                    </div>

                    <div className="pt-4 border-t">
                      <p className="text-sm text-muted-foreground mb-2">Configuração do Marketplace</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Comissão:</span>
                          <span className="font-medium">16%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa Fixa:</span>
                          <span className="font-medium">R$ 6,00</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Logística:</span>
                          <span className="font-medium">Mercado Envios</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      className="w-full mt-4 gap-2" 
                      onClick={handleCreateMarketplace}
                      disabled={createMarketplace.isPending}
                    >
                      {createMarketplace.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}
                      Criar Marketplace
                    </Button>

                    <p className="text-xs text-muted-foreground text-center">
                      Você poderá ajustar a comissão após criar o marketplace
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Store className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Selecione uma categoria para ver os detalhes</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
