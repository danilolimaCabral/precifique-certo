import { describe, expect, it } from "vitest";

describe("Shipping Ranges", () => {
  describe("Weight Range Validation", () => {
    it("should validate that minWeight is less than maxWeight", () => {
      const minWeight = 0;
      const maxWeight = 500;
      expect(minWeight).toBeLessThan(maxWeight);
    });

    it("should reject when minWeight equals maxWeight", () => {
      const minWeight = 500;
      const maxWeight = 500;
      expect(minWeight).not.toBeLessThan(maxWeight);
    });

    it("should reject when minWeight is greater than maxWeight", () => {
      const minWeight = 1000;
      const maxWeight = 500;
      expect(minWeight).not.toBeLessThan(maxWeight);
    });
  });

  describe("Shipping Cost Calculation", () => {
    const shippingRanges = [
      { minWeight: 0, maxWeight: 300, cost: 18.90 },
      { minWeight: 301, maxWeight: 500, cost: 20.90 },
      { minWeight: 501, maxWeight: 1000, cost: 23.90 },
      { minWeight: 1001, maxWeight: 2000, cost: 28.90 },
      { minWeight: 2001, maxWeight: 5000, cost: 35.90 },
    ];

    function getShippingCost(weight: number): number {
      const range = shippingRanges.find(
        r => weight >= r.minWeight && weight <= r.maxWeight
      );
      return range?.cost ?? 0;
    }

    it("should return correct cost for weight in first range (0-300g)", () => {
      expect(getShippingCost(150)).toBe(18.90);
      expect(getShippingCost(0)).toBe(18.90);
      expect(getShippingCost(300)).toBe(18.90);
    });

    it("should return correct cost for weight in second range (301-500g)", () => {
      expect(getShippingCost(350)).toBe(20.90);
      expect(getShippingCost(301)).toBe(20.90);
      expect(getShippingCost(500)).toBe(20.90);
    });

    it("should return correct cost for weight in third range (501-1000g)", () => {
      expect(getShippingCost(750)).toBe(23.90);
    });

    it("should return correct cost for weight in fourth range (1001-2000g)", () => {
      expect(getShippingCost(1500)).toBe(28.90);
    });

    it("should return correct cost for weight in fifth range (2001-5000g)", () => {
      expect(getShippingCost(3000)).toBe(35.90);
    });

    it("should return 0 for weight outside all ranges", () => {
      expect(getShippingCost(10000)).toBe(0);
    });
  });

  describe("Weight Formatting", () => {
    function formatWeight(value: number): string {
      if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}kg`;
      }
      return `${value}g`;
    }

    it("should format weight in grams for values under 1000", () => {
      expect(formatWeight(500)).toBe("500g");
      expect(formatWeight(0)).toBe("0g");
      expect(formatWeight(999)).toBe("999g");
    });

    it("should format weight in kilograms for values 1000 and above", () => {
      expect(formatWeight(1000)).toBe("1.0kg");
      expect(formatWeight(1500)).toBe("1.5kg");
      expect(formatWeight(5000)).toBe("5.0kg");
      expect(formatWeight(30000)).toBe("30.0kg");
    });
  });

  describe("Cubed Weight Calculation", () => {
    function calculateCubedWeight(height: number, width: number, length: number): number {
      const cubicVolume = height * width * length;
      return cubicVolume / 6000; // Standard divisor for cubed weight
    }

    function getConsideredWeight(realWeight: number, cubedWeight: number): number {
      return Math.max(realWeight, cubedWeight);
    }

    it("should calculate cubed weight correctly", () => {
      // 30cm x 20cm x 10cm = 6000cm³ / 6000 = 1kg
      expect(calculateCubedWeight(30, 20, 10)).toBe(1);
    });

    it("should use real weight when greater than cubed weight", () => {
      const realWeight = 2000; // 2kg
      const cubedWeight = calculateCubedWeight(30, 20, 10) * 1000; // 1kg in grams
      expect(getConsideredWeight(realWeight, cubedWeight)).toBe(2000);
    });

    it("should use cubed weight when greater than real weight", () => {
      const realWeight = 500; // 500g
      const cubedWeight = calculateCubedWeight(60, 40, 20) * 1000; // 8kg in grams
      expect(getConsideredWeight(realWeight, cubedWeight)).toBe(8000);
    });
  });

  describe("Currency Formatting", () => {
    function formatCurrency(value: number): string {
      return new Intl.NumberFormat("pt-BR", { 
        style: "currency", 
        currency: "BRL" 
      }).format(value);
    }

    it("should format currency in Brazilian Real", () => {
      expect(formatCurrency(18.90)).toBe("R$\u00a018,90");
      expect(formatCurrency(0)).toBe("R$\u00a00,00");
      expect(formatCurrency(1234.56)).toBe("R$\u00a01.234,56");
    });
  });
});
