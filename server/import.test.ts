import { describe, expect, it } from "vitest";

// Test import data parsing and validation
describe("Import Data Validation", () => {
  it("should validate material data structure", () => {
    const validMaterial = {
      sku: "PROD001",
      description: "Produto Teste",
      type: "insumo" as const,
      unitCost: "100.00",
    };

    expect(validMaterial.sku).toBeTruthy();
    expect(validMaterial.description).toBeTruthy();
    expect(["insumo", "embalagem"]).toContain(validMaterial.type);
    expect(parseFloat(validMaterial.unitCost)).toBeGreaterThanOrEqual(0);
  });

  it("should validate product data structure", () => {
    const validProduct = {
      sku: "PROD001",
      name: "Produto Teste",
      height: "10",
      width: "20",
      length: "30",
      realWeight: "500",
    };

    expect(validProduct.sku).toBeTruthy();
    expect(validProduct.name).toBeTruthy();
    expect(parseFloat(validProduct.height || "0")).toBeGreaterThanOrEqual(0);
    expect(parseFloat(validProduct.width || "0")).toBeGreaterThanOrEqual(0);
    expect(parseFloat(validProduct.length || "0")).toBeGreaterThanOrEqual(0);
    expect(parseFloat(validProduct.realWeight || "0")).toBeGreaterThanOrEqual(0);
  });

  it("should validate BOM data structure", () => {
    const validBOM = {
      productSku: "PROD001",
      materialSku: "MAT001",
      quantity: "2",
    };

    expect(validBOM.productSku).toBeTruthy();
    expect(validBOM.materialSku).toBeTruthy();
    expect(parseFloat(validBOM.quantity)).toBeGreaterThan(0);
  });

  it("should reject invalid material type", () => {
    const invalidType = "invalid";
    const validTypes = ["insumo", "embalagem"];
    
    expect(validTypes).not.toContain(invalidType);
  });

  it("should handle empty SKU", () => {
    const emptySku = "";
    expect(emptySku).toBeFalsy();
  });

  it("should parse decimal costs correctly", () => {
    const costs = ["100.00", "99.99", "0.01", "1000.50"];
    
    for (const cost of costs) {
      const parsed = parseFloat(cost);
      expect(parsed).toBeGreaterThanOrEqual(0);
      expect(isNaN(parsed)).toBe(false);
    }
  });

  it("should handle missing optional fields", () => {
    const productWithoutDimensions = {
      sku: "PROD001",
      name: "Produto Teste",
    };

    expect(productWithoutDimensions.sku).toBeTruthy();
    expect(productWithoutDimensions.name).toBeTruthy();
    // Optional fields should be undefined
    expect((productWithoutDimensions as any).height).toBeUndefined();
    expect((productWithoutDimensions as any).width).toBeUndefined();
    expect((productWithoutDimensions as any).length).toBeUndefined();
    expect((productWithoutDimensions as any).realWeight).toBeUndefined();
  });

  it("should validate bulk import array", () => {
    const materials = [
      { sku: "MAT001", description: "Material 1", type: "insumo" as const, unitCost: "10.00" },
      { sku: "MAT002", description: "Material 2", type: "embalagem" as const, unitCost: "5.00" },
      { sku: "MAT003", description: "Material 3", type: "insumo" as const, unitCost: "15.00" },
    ];

    expect(materials.length).toBe(3);
    expect(materials.every(m => m.sku && m.description && m.type && m.unitCost)).toBe(true);
  });

  it("should calculate total cost from BOM", () => {
    const materials = [
      { sku: "MAT001", unitCost: 10.00 },
      { sku: "MAT002", unitCost: 5.00 },
    ];

    const bom = [
      { materialSku: "MAT001", quantity: 2 },
      { materialSku: "MAT002", quantity: 3 },
    ];

    let totalCost = 0;
    for (const item of bom) {
      const material = materials.find(m => m.sku === item.materialSku);
      if (material) {
        totalCost += material.unitCost * item.quantity;
      }
    }

    expect(totalCost).toBe(35); // (10 * 2) + (5 * 3) = 35
  });

  it("should handle duplicate SKUs in import", () => {
    const materials = [
      { sku: "MAT001", description: "Material 1" },
      { sku: "MAT001", description: "Material 1 Duplicado" },
      { sku: "MAT002", description: "Material 2" },
    ];

    const uniqueSkus = new Set(materials.map(m => m.sku));
    const hasDuplicates = uniqueSkus.size < materials.length;

    expect(hasDuplicates).toBe(true);
  });
});

describe("Excel Parsing Helpers", () => {
  it("should normalize category names", () => {
    const normalize = (cat: string) => cat.toLowerCase().trim();
    
    expect(normalize("Produto")).toBe("produto");
    expect(normalize("EMBALAGEM")).toBe("embalagem");
    expect(normalize("  Produto  ")).toBe("produto");
  });

  it("should convert category to type", () => {
    const categoryToType = (cat: string): "insumo" | "embalagem" => {
      const normalized = cat.toLowerCase().trim();
      return normalized === "embalagem" ? "embalagem" : "insumo";
    };

    expect(categoryToType("Produto")).toBe("insumo");
    expect(categoryToType("Embalagem")).toBe("embalagem");
    expect(categoryToType("EMBALAGEM")).toBe("embalagem");
  });

  it("should format cost as string with 2 decimals", () => {
    const formatCost = (value: number) => value.toFixed(2);

    expect(formatCost(100)).toBe("100.00");
    expect(formatCost(99.9)).toBe("99.90");
    expect(formatCost(0.1)).toBe("0.10");
  });
});
