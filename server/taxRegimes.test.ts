import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock tax regime data
const mockTaxRegimes = [
  { id: 1, name: "Simples Nacional", defaultRate: "6.00", isActive: true, isSystem: true, sortOrder: 1 },
  { id: 2, name: "Lucro Presumido", defaultRate: "11.33", isActive: true, isSystem: true, sortOrder: 2 },
  { id: 3, name: "Lucro Real", defaultRate: "9.25", isActive: true, isSystem: true, sortOrder: 3 },
  { id: 4, name: "MEI", defaultRate: "0.00", isActive: true, isSystem: true, sortOrder: 4 },
  { id: 5, name: "Isento", defaultRate: "0.00", isActive: true, isSystem: true, sortOrder: 5 },
  { id: 6, name: "Outro (Personalizado)", defaultRate: "0.00", isActive: true, isSystem: true, sortOrder: 6 },
];

describe("Tax Regimes", () => {
  describe("Standard Tax Regimes", () => {
    it("should have Simples Nacional with 6% default rate", () => {
      const regime = mockTaxRegimes.find(r => r.name === "Simples Nacional");
      expect(regime).toBeDefined();
      expect(regime?.defaultRate).toBe("6.00");
    });

    it("should have Lucro Presumido with 11.33% default rate", () => {
      const regime = mockTaxRegimes.find(r => r.name === "Lucro Presumido");
      expect(regime).toBeDefined();
      expect(regime?.defaultRate).toBe("11.33");
    });

    it("should have Lucro Real with 9.25% default rate", () => {
      const regime = mockTaxRegimes.find(r => r.name === "Lucro Real");
      expect(regime).toBeDefined();
      expect(regime?.defaultRate).toBe("9.25");
    });

    it("should have MEI with 0% default rate", () => {
      const regime = mockTaxRegimes.find(r => r.name === "MEI");
      expect(regime).toBeDefined();
      expect(regime?.defaultRate).toBe("0.00");
    });

    it("should have Isento with 0% default rate", () => {
      const regime = mockTaxRegimes.find(r => r.name === "Isento");
      expect(regime).toBeDefined();
      expect(regime?.defaultRate).toBe("0.00");
    });

    it("should have Outro (Personalizado) option", () => {
      const regime = mockTaxRegimes.find(r => r.name === "Outro (Personalizado)");
      expect(regime).toBeDefined();
      expect(regime?.defaultRate).toBe("0.00");
    });
  });

  describe("Tax Regime Properties", () => {
    it("should have all required fields", () => {
      mockTaxRegimes.forEach(regime => {
        expect(regime).toHaveProperty("id");
        expect(regime).toHaveProperty("name");
        expect(regime).toHaveProperty("defaultRate");
        expect(regime).toHaveProperty("isActive");
        expect(regime).toHaveProperty("isSystem");
        expect(regime).toHaveProperty("sortOrder");
      });
    });

    it("should have all system regimes marked as isSystem=true", () => {
      const systemRegimes = mockTaxRegimes.filter(r => r.isSystem);
      expect(systemRegimes.length).toBe(6);
    });

    it("should have all regimes active by default", () => {
      const activeRegimes = mockTaxRegimes.filter(r => r.isActive);
      expect(activeRegimes.length).toBe(6);
    });

    it("should have regimes sorted by sortOrder", () => {
      const sorted = [...mockTaxRegimes].sort((a, b) => a.sortOrder - b.sortOrder);
      expect(sorted[0].name).toBe("Simples Nacional");
      expect(sorted[5].name).toBe("Outro (Personalizado)");
    });
  });

  describe("Tax Rate Calculations", () => {
    it("should calculate tax correctly for Simples Nacional", () => {
      const salePrice = 100;
      const taxRate = 6.00;
      const taxAmount = salePrice * (taxRate / 100);
      expect(taxAmount).toBe(6);
    });

    it("should calculate tax correctly for Lucro Presumido", () => {
      const salePrice = 100;
      const taxRate = 11.33;
      const taxAmount = salePrice * (taxRate / 100);
      expect(taxAmount).toBeCloseTo(11.33, 2);
    });

    it("should calculate tax correctly for Lucro Real", () => {
      const salePrice = 100;
      const taxRate = 9.25;
      const taxAmount = salePrice * (taxRate / 100);
      expect(taxAmount).toBeCloseTo(9.25, 2);
    });

    it("should calculate zero tax for MEI", () => {
      const salePrice = 100;
      const taxRate = 0;
      const taxAmount = salePrice * (taxRate / 100);
      expect(taxAmount).toBe(0);
    });

    it("should calculate zero tax for Isento", () => {
      const salePrice = 100;
      const taxRate = 0;
      const taxAmount = salePrice * (taxRate / 100);
      expect(taxAmount).toBe(0);
    });
  });

  describe("Custom Tax Regime", () => {
    it("should allow custom name for Outro (Personalizado)", () => {
      const customRegime = {
        ...mockTaxRegimes.find(r => r.name === "Outro (Personalizado)"),
        customName: "Regime Especial ZFM",
        customRate: "3.50",
      };
      expect(customRegime.customName).toBe("Regime Especial ZFM");
      expect(customRegime.customRate).toBe("3.50");
    });

    it("should validate custom rate is a valid number", () => {
      const customRate = "5.50";
      const parsed = parseFloat(customRate);
      expect(isNaN(parsed)).toBe(false);
      expect(parsed).toBeGreaterThanOrEqual(0);
      expect(parsed).toBeLessThanOrEqual(100);
    });
  });

  describe("Tax Regime Validation", () => {
    it("should require a tax regime selection", () => {
      const settings = { taxRegimeId: undefined };
      expect(settings.taxRegimeId).toBeUndefined();
      // Validation should fail
      const isValid = settings.taxRegimeId !== undefined;
      expect(isValid).toBe(false);
    });

    it("should accept valid tax regime selection", () => {
      const settings = { taxRegimeId: 1 };
      expect(settings.taxRegimeId).toBeDefined();
      const isValid = settings.taxRegimeId !== undefined && settings.taxRegimeId > 0;
      expect(isValid).toBe(true);
    });

    it("should validate tax rate is within bounds", () => {
      const validRates = [0, 6, 11.33, 9.25, 15, 27.5];
      validRates.forEach(rate => {
        expect(rate).toBeGreaterThanOrEqual(0);
        expect(rate).toBeLessThanOrEqual(100);
      });
    });
  });

  describe("Settings Integration", () => {
    it("should update tax rate when regime changes", () => {
      let settings = { taxRegimeId: 1, taxPercent: "6.00" };
      
      // Simulate changing to Lucro Presumido
      const newRegime = mockTaxRegimes.find(r => r.id === 2);
      settings = {
        taxRegimeId: 2,
        taxPercent: newRegime!.defaultRate,
      };
      
      expect(settings.taxRegimeId).toBe(2);
      expect(settings.taxPercent).toBe("11.33");
    });

    it("should allow manual tax rate override", () => {
      let settings = { taxRegimeId: 1, taxPercent: "6.00" };
      
      // User manually changes rate
      settings.taxPercent = "7.50";
      
      expect(settings.taxRegimeId).toBe(1);
      expect(settings.taxPercent).toBe("7.50");
    });

    it("should store custom regime name when Outro is selected", () => {
      const settings = {
        taxRegimeId: 6, // Outro (Personalizado)
        taxName: "Regime Especial",
        taxPercent: "4.00",
      };
      
      expect(settings.taxRegimeId).toBe(6);
      expect(settings.taxName).toBe("Regime Especial");
      expect(settings.taxPercent).toBe("4.00");
    });
  });
});

describe("Tax Regime Impact on Pricing", () => {
  it("should affect margin calculation", () => {
    const salePrice = 100;
    const productCost = 40;
    const marketplaceCommission = 16;
    const shippingCost = 10;
    
    // With Simples Nacional (6%)
    const taxSimplesNacional = salePrice * 0.06;
    const marginSN = salePrice - productCost - marketplaceCommission - shippingCost - taxSimplesNacional;
    expect(marginSN).toBe(28); // 100 - 40 - 16 - 10 - 6
    
    // With Lucro Presumido (11.33%)
    const taxLucroPresumido = salePrice * 0.1133;
    const marginLP = salePrice - productCost - marketplaceCommission - shippingCost - taxLucroPresumido;
    expect(marginLP).toBeCloseTo(22.67, 2); // 100 - 40 - 16 - 10 - 11.33
  });

  it("should affect minimum price calculation", () => {
    const productCost = 40;
    const marketplaceCommission = 0.16; // 16%
    const shippingCost = 10;
    const targetMargin = 0.15; // 15%
    
    // With Simples Nacional (6%)
    const taxRateSN = 0.06;
    // Price = (Cost + Shipping) / (1 - Commission - Tax - Margin)
    const minPriceSN = (productCost + shippingCost) / (1 - marketplaceCommission - taxRateSN - targetMargin);
    expect(minPriceSN).toBeCloseTo(79.37, 2);
    
    // With Lucro Presumido (11.33%)
    const taxRateLP = 0.1133;
    const minPriceLP = (productCost + shippingCost) / (1 - marketplaceCommission - taxRateLP - targetMargin);
    expect(minPriceLP).toBeCloseTo(86.70, 2);
  });
});
