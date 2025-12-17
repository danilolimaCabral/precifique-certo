import { describe, expect, it } from "vitest";

// Test analytics data calculations
describe("Analytics Data Calculations", () => {
  describe("Margin Calculation", () => {
    it("should calculate margin value correctly", () => {
      const salePrice = 100;
      const ctm = 70;
      const marginValue = salePrice - ctm;
      
      expect(marginValue).toBe(30);
    });

    it("should calculate margin percent correctly", () => {
      const salePrice = 100;
      const marginValue = 30;
      const marginPercent = (marginValue / salePrice) * 100;
      
      expect(marginPercent).toBe(30);
    });

    it("should handle zero sale price", () => {
      const salePrice = 0;
      const marginValue = 30;
      const marginPercent = salePrice > 0 ? (marginValue / salePrice) * 100 : 0;
      
      expect(marginPercent).toBe(0);
    });

    it("should handle negative margin", () => {
      const salePrice = 100;
      const ctm = 120;
      const marginValue = salePrice - ctm;
      const marginPercent = (marginValue / salePrice) * 100;
      
      expect(marginValue).toBe(-20);
      expect(marginPercent).toBe(-20);
    });
  });

  describe("CTM Calculation", () => {
    it("should calculate CTM correctly", () => {
      const productCost = 50;
      const shippingCost = 10;
      const commission = 15;
      const taxValue = 5;
      
      const ctm = productCost + shippingCost + commission + taxValue;
      
      expect(ctm).toBe(80);
    });

    it("should calculate commission with fixed fee", () => {
      const salePrice = 100;
      const commissionPercent = 10;
      const fixedFee = 5;
      
      const commission = (salePrice * commissionPercent / 100) + fixedFee;
      
      expect(commission).toBe(15);
    });

    it("should calculate tax value", () => {
      const salePrice = 100;
      const taxPercent = 6;
      
      const taxValue = salePrice * taxPercent / 100;
      
      expect(taxValue).toBe(6);
    });
  });

  describe("Chart Data Formatting", () => {
    it("should format product chart data", () => {
      const product = {
        id: 1,
        name: "Produto Teste Longo Nome",
        sku: "PROD001",
        marginPercent: 25.567,
        marginValue: 25.567,
      };

      const chartData = {
        name: product.name?.substring(0, 15),
        margem: Number(product.marginPercent.toFixed(1)),
        valor: Number(product.marginValue.toFixed(2)),
      };

      expect(chartData.name).toBe("Produto Teste L");
      expect(chartData.margem).toBe(25.6);
      expect(chartData.valor).toBe(25.57);
    });

    it("should format marketplace chart data", () => {
      const marketplace = {
        id: 1,
        name: "Mercado Livre",
        marginPercent: -5.5,
        marginValue: -5.50,
      };

      const chartData = {
        name: marketplace.name,
        value: Math.abs(Number(marketplace.marginPercent.toFixed(1))),
        marginValue: Number(marketplace.marginValue.toFixed(2)),
      };

      expect(chartData.name).toBe("Mercado Livre");
      expect(chartData.value).toBe(5.5);
      expect(chartData.marginValue).toBe(-5.5);
    });

    it("should handle empty data arrays", () => {
      const products: any[] = [];
      const marketplaces: any[] = [];

      const hasChartData = products.length > 0 || marketplaces.length > 0;

      expect(hasChartData).toBe(false);
    });

    it("should limit products to 10 for chart", () => {
      const products = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
      }));

      const chartProducts = products.slice(0, 10);

      expect(chartProducts.length).toBe(10);
      expect(chartProducts[0].name).toBe("Product 1");
      expect(chartProducts[9].name).toBe("Product 10");
    });
  });

  describe("Summary Statistics", () => {
    it("should calculate average product cost", () => {
      const productCosts = [50, 75, 100, 125];
      const totalCost = productCosts.reduce((sum, cost) => sum + cost, 0);
      const avgCost = totalCost / productCosts.length;

      expect(avgCost).toBe(87.5);
    });

    it("should calculate average commission", () => {
      const commissions = [10, 15, 12, 18];
      const avgCommission = commissions.reduce((sum, c) => sum + c, 0) / commissions.length;

      expect(avgCommission).toBe(13.75);
    });

    it("should handle empty arrays for averages", () => {
      const products: number[] = [];
      const avgCost = products.length > 0 
        ? products.reduce((sum, cost) => sum + cost, 0) / products.length 
        : 0;

      expect(avgCost).toBe(0);
    });
  });

  describe("Color Assignment", () => {
    it("should assign colors cyclically", () => {
      const CHART_COLORS = ["#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#ec4899"];
      
      const marketplaces = Array.from({ length: 8 }, (_, i) => ({
        id: i + 1,
        name: `Marketplace ${i + 1}`,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      }));

      expect(marketplaces[0].fill).toBe("#8b5cf6");
      expect(marketplaces[5].fill).toBe("#ec4899");
      expect(marketplaces[6].fill).toBe("#8b5cf6"); // Cycles back
      expect(marketplaces[7].fill).toBe("#10b981");
    });
  });
});
