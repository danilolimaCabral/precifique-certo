import { useState, useRef } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Download, Package, Boxes, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface MaterialRow {
  sku: string;
  description: string;
  type: "insumo" | "embalagem";
  unitCost: string;
}

interface ProductRow {
  sku: string;
  name: string;
  height?: string;
  width?: string;
  length?: string;
  realWeight?: string;
}

interface BOMRow {
  productSku: string;
  materialSku: string;
  quantity: string;
}

export default function Importar() {
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [bom, setBom] = useState<BOMRow[]>([]);
  const [activeTab, setActiveTab] = useState("materials");
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ materials: number; products: number; bom: number } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMaterials = trpc.import.materials.useMutation();
  const importProducts = trpc.import.products.useMutation();
  const importBOM = trpc.import.productMaterials.useMutation();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      // Parse MATERIAIS sheet
      const materiaisSheet = workbook.Sheets["MATERIAIS"];
      if (materiaisSheet) {
        const rawData = XLSX.utils.sheet_to_json<any>(materiaisSheet, { header: 1 });
        const parsedMaterials: MaterialRow[] = [];
        
        for (let i = 3; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !row[1]) continue; // Skip empty rows
          
          const categoria = String(row[0] || "").toLowerCase().trim();
          const sku = String(row[1] || "").trim();
          const description = String(row[2] || "").trim();
          const cost = parseFloat(row[3]) || 0;
          
          if (sku && (categoria === "produto" || categoria === "embalagem")) {
            parsedMaterials.push({
              sku,
              description: description || sku,
              type: categoria === "embalagem" ? "embalagem" : "insumo",
              unitCost: cost.toFixed(2),
            });
          }
        }
        setMaterials(parsedMaterials);
      }

      // Parse PRECIFIQUE 2.0 sheet for products with dimensions
      const precifiqueSheet = workbook.Sheets["PRECIFIQUE 2.0"];
      if (precifiqueSheet) {
        const rawData = XLSX.utils.sheet_to_json<any>(precifiqueSheet, { header: 1 });
        const parsedProducts: ProductRow[] = [];
        
        for (let i = 2; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row || !row[0]) continue;
          
          const sku = String(row[0] || "").trim();
          const name = String(row[1] || "").trim();
          const height = row[3] ? String(row[3]) : undefined;
          const width = row[4] ? String(row[4]) : undefined;
          const length = row[5] ? String(row[5]) : undefined;
          const weight = row[7] ? String(row[7]) : undefined;
          
          if (sku) {
            parsedProducts.push({
              sku,
              name: name || sku,
              height,
              width,
              length,
              realWeight: weight,
            });
          }
        }
        setProducts(parsedProducts);
      }

      // Parse PRODUTOS ACABADOS sheet for BOM
      const bomSheet = workbook.Sheets["PRODUTOS ACABADOS"];
      if (bomSheet) {
        const rawData = XLSX.utils.sheet_to_json<any>(bomSheet, { header: 1 });
        const parsedBom: BOMRow[] = [];
        let currentProductSku = "";
        
        for (let i = 3; i < rawData.length; i++) {
          const row = rawData[i];
          if (!row) continue;
          
          const sku = String(row[0] || "").trim();
          const materialSku = String(row[2] || "").trim();
          const quantity = row[5] ? String(row[5]) : "1";
          
          // If first column has a value and it's not an EMB, it's a product
          if (sku && !sku.startsWith("EMB")) {
            currentProductSku = sku;
          }
          
          // If we have a material SKU and a current product, add to BOM
          if (materialSku && currentProductSku && materialSku !== currentProductSku) {
            parsedBom.push({
              productSku: currentProductSku,
              materialSku,
              quantity,
            });
          }
        }
        setBom(parsedBom);
      }

      toast.success("Arquivo processado com sucesso!");
    } catch (error) {
      console.error("Error parsing file:", error);
      toast.error("Erro ao processar arquivo");
    }
  };

  const handleImport = async () => {
    setImporting(true);
    setImportResults(null);

    try {
      let materialsCount = 0;
      let productsCount = 0;
      let bomCount = 0;

      // Import materials first
      if (materials.length > 0) {
        const result = await importMaterials.mutateAsync({ materials });
        materialsCount = result.count;
      }

      // Then import products
      if (products.length > 0) {
        const result = await importProducts.mutateAsync({ products });
        productsCount = result.count;
      }

      // Finally import BOM
      if (bom.length > 0) {
        const result = await importBOM.mutateAsync({ items: bom });
        bomCount = result.count;
      }

      setImportResults({ materials: materialsCount, products: productsCount, bom: bomCount });
      toast.success("Importação concluída com sucesso!");
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Erro na importação");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();

    // Materials sheet
    const materialsData = [
      ["Categoria", "SKU", "Descrição", "Custo Unitário"],
      ["Produto", "PROD001", "Produto Exemplo", "100.00"],
      ["Embalagem", "EMB001", "Caixa Pequena", "2.50"],
    ];
    const materialsWs = XLSX.utils.aoa_to_sheet(materialsData);
    XLSX.utils.book_append_sheet(wb, materialsWs, "MATERIAIS");

    // Products sheet
    const productsData = [
      ["", "", "", "", "", "", "", "", ""],
      ["", "", "", "", "", "", "", "", ""],
      ["SKU", "Descrição", "Custo Total", "Altura (cm)", "Largura (cm)", "Comprimento (cm)", "Cubagem", "Peso (gramas)", "Referência Frete"],
      ["PROD001", "Produto Exemplo", "100.00", "10", "20", "30", "1.0", "500", "0.5"],
    ];
    const productsWs = XLSX.utils.aoa_to_sheet(productsData);
    XLSX.utils.book_append_sheet(wb, productsWs, "PRECIFIQUE 2.0");

    // BOM sheet
    const bomData = [
      ["", "", "", "", "", "", ""],
      ["", "", "", "", "", "", ""],
      ["SKU", "Produto Acabado", "SKU Material", "Desc. Material", "Custo Unitário", "Quantidade", "Custo Total"],
      ["PROD001", "Produto Exemplo", "PROD001", "Produto Exemplo", "100.00", "1", "100.00"],
      ["EMB001", "Caixa Pequena", "EMB001", "Caixa Pequena", "2.50", "1", "2.50"],
    ];
    const bomWs = XLSX.utils.aoa_to_sheet(bomData);
    XLSX.utils.book_append_sheet(wb, bomWs, "PRODUTOS ACABADOS");

    XLSX.writeFile(wb, "template_precifique.xlsx");
    toast.success("Template baixado!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Importar Dados</h1>
          <p className="text-muted-foreground mt-1">
            Importe materiais, produtos e BOM em massa via planilha Excel
          </p>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              Upload de Planilha
            </CardTitle>
            <CardDescription>
              Faça upload de uma planilha Excel no formato ICOMM PRECIFIQUE ou baixe o template
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Selecionar Arquivo
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button variant="outline" onClick={downloadTemplate} className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Baixar Template
              </Button>
            </div>

            {(materials.length > 0 || products.length > 0 || bom.length > 0) && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Arquivo processado</AlertTitle>
                <AlertDescription className="flex flex-wrap gap-4 mt-2">
                  <Badge variant="secondary">{materials.length} materiais</Badge>
                  <Badge variant="secondary">{products.length} produtos</Badge>
                  <Badge variant="secondary">{bom.length} itens de BOM</Badge>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Preview Tabs */}
        {(materials.length > 0 || products.length > 0 || bom.length > 0) && (
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização dos Dados</CardTitle>
              <CardDescription>
                Revise os dados antes de importar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="materials" className="flex items-center gap-2">
                    <Boxes className="h-4 w-4" />
                    Materiais ({materials.length})
                  </TabsTrigger>
                  <TabsTrigger value="products" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Produtos ({products.length})
                  </TabsTrigger>
                  <TabsTrigger value="bom" className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    BOM ({bom.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="materials" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Descrição</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead className="text-right">Custo Unit.</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {materials.slice(0, 20).map((m, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">{m.sku}</TableCell>
                            <TableCell>{m.description}</TableCell>
                            <TableCell>
                              <Badge variant={m.type === "embalagem" ? "secondary" : "default"}>
                                {m.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">R$ {m.unitCost}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {materials.length > 20 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando 20 de {materials.length} materiais
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="products" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead className="text-right">Altura</TableHead>
                          <TableHead className="text-right">Largura</TableHead>
                          <TableHead className="text-right">Comp.</TableHead>
                          <TableHead className="text-right">Peso (g)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.slice(0, 20).map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">{p.sku}</TableCell>
                            <TableCell>{p.name}</TableCell>
                            <TableCell className="text-right">{p.height || "-"}</TableCell>
                            <TableCell className="text-right">{p.width || "-"}</TableCell>
                            <TableCell className="text-right">{p.length || "-"}</TableCell>
                            <TableCell className="text-right">{p.realWeight || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {products.length > 20 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando 20 de {products.length} produtos
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="bom" className="mt-4">
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>SKU Produto</TableHead>
                          <TableHead>SKU Material</TableHead>
                          <TableHead className="text-right">Quantidade</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bom.slice(0, 20).map((b, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-mono">{b.productSku}</TableCell>
                            <TableCell className="font-mono">{b.materialSku}</TableCell>
                            <TableCell className="text-right">{b.quantity}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {bom.length > 20 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Mostrando 20 de {bom.length} itens de BOM
                    </p>
                  )}
                </TabsContent>
              </Tabs>

              <div className="mt-6 flex justify-end">
                <Button
                  onClick={handleImport}
                  disabled={importing || (materials.length === 0 && products.length === 0)}
                  className="flex items-center gap-2"
                >
                  {importing ? (
                    <>Importando...</>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Importar Dados
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Import Results */}
        {importResults && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Importação Concluída</AlertTitle>
            <AlertDescription className="text-green-700">
              <ul className="list-disc list-inside mt-2">
                <li>{importResults.materials} materiais importados</li>
                <li>{importResults.products} produtos importados</li>
                <li>{importResults.bom} itens de BOM importados</li>
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Instruções de Importação
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <p>A planilha deve conter as seguintes abas:</p>
            <ul>
              <li><strong>MATERIAIS</strong>: Lista de insumos e embalagens com SKU, descrição, categoria e custo unitário</li>
              <li><strong>PRECIFIQUE 2.0</strong>: Lista de produtos com SKU, nome, dimensões (altura, largura, comprimento) e peso</li>
              <li><strong>PRODUTOS ACABADOS</strong>: Lista de materiais (BOM) de cada produto com quantidades</li>
            </ul>
            <p className="text-muted-foreground">
              Você pode usar o template ICOMM PRECIFIQUE ou baixar nosso template padrão.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
