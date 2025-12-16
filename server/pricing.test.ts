import { describe, expect, it } from "vitest";

// Test pricing calculation logic
describe("Pricing Calculations", () => {
  // Helper function to calculate CTM (Custo Total da Mercadoria)
  const calculateCTM = (params: {
    productCost: number;
    shippingCost: number;
    salePrice: number;
    commissionPercent: number;
    fixedFee: number;
    taxPercent: number;
    adsPercent: number;
    opexType: "percent" | "fixed";
    opexValue: number;
    customCharges?: { chargeType: string; value: number }[];
  }) => {
    const { productCost, shippingCost, salePrice, commissionPercent, fixedFee, taxPercent, adsPercent, opexType, opexValue, customCharges = [] } = params;
    
    const commission = (salePrice * commissionPercent / 100) + fixedFee;
    const taxValue = salePrice * taxPercent / 100;
    const adsValue = salePrice * adsPercent / 100;
    const opexCost = opexType === "percent" ? salePrice * opexValue / 100 : opexValue;
    
    let customChargesTotal = 0;
    for (const charge of customCharges) {
      if (charge.chargeType === "percent_sale") {
        customChargesTotal += salePrice * charge.value / 100;
      } else if (charge.chargeType === "percent_cost") {
        customChargesTotal += productCost * charge.value / 100;
      } else {
        customChargesTotal += charge.value;
      }
    }
    
    return productCost + shippingCost + commission + taxValue + adsValue + opexCost + customChargesTotal;
  };

  // Helper function to calculate margin
  const calculateMargin = (salePrice: number, ctm: number) => {
    const marginValue = salePrice - ctm;
    const marginPercent = (marginValue / salePrice) * 100;
    return { marginValue, marginPercent };
  };

  // Helper function to calculate minimum price for zero margin
  const calculateMinPrice = (params: {
    productCost: number;
    shippingCost: number;
    commissionPercent: number;
    fixedFee: number;
    taxPercent: number;
    adsPercent: number;
    opexType: "percent" | "fixed";
    opexValue: number;
  }) => {
    const { productCost, shippingCost, commissionPercent, fixedFee, taxPercent, adsPercent, opexType, opexValue } = params;
    
    const fixedCosts = productCost + shippingCost + fixedFee + (opexType === "fixed" ? opexValue : 0);
    const percentCosts = commissionPercent + taxPercent + adsPercent + (opexType === "percent" ? opexValue : 0);
    
    return fixedCosts / (1 - percentCosts / 100);
  };

  // Helper function to calculate cubed weight
  const calculateCubedWeight = (height: number, width: number, length: number) => {
    return (height * width * length) / 6000;
  };

  describe("CTM Calculation", () => {
    it("should calculate CTM correctly with all components", () => {
      const ctm = calculateCTM({
        productCost: 50,
        shippingCost: 15,
        salePrice: 150,
        commissionPercent: 12,
        fixedFee: 5,
        taxPercent: 6,
        adsPercent: 5,
        opexType: "percent",
        opexValue: 3,
      });
      
      expect(ctm).toBe(109);
    });

    it("should calculate CTM with fixed OPEX", () => {
      const ctm = calculateCTM({
        productCost: 30,
        shippingCost: 10,
        salePrice: 100,
        commissionPercent: 10,
        fixedFee: 2,
        taxPercent: 5,
        adsPercent: 3,
        opexType: "fixed",
        opexValue: 5,
      });
      
      expect(ctm).toBe(65);
    });

    it("should include custom charges in CTM", () => {
      const ctm = calculateCTM({
        productCost: 40,
        shippingCost: 12,
        salePrice: 120,
        commissionPercent: 11,
        fixedFee: 3,
        taxPercent: 6,
        adsPercent: 4,
        opexType: "percent",
        opexValue: 2,
        customCharges: [
          { chargeType: "percent_sale", value: 2 },
          { chargeType: "fixed", value: 3 },
        ],
      });
      
      expect(ctm).toBeCloseTo(88, 2);
    });
  });

  describe("Margin Calculation", () => {
    it("should calculate positive margin correctly", () => {
      const { marginValue, marginPercent } = calculateMargin(150, 100);
      expect(marginValue).toBe(50);
      expect(marginPercent).toBeCloseTo(33.33, 1);
    });

    it("should calculate zero margin correctly", () => {
      const { marginValue, marginPercent } = calculateMargin(100, 100);
      expect(marginValue).toBe(0);
      expect(marginPercent).toBe(0);
    });

    it("should calculate negative margin correctly", () => {
      const { marginValue, marginPercent } = calculateMargin(80, 100);
      expect(marginValue).toBe(-20);
      expect(marginPercent).toBe(-25);
    });
  });

  describe("Minimum Price Calculation", () => {
    it("should calculate minimum price for zero margin", () => {
      const minPrice = calculateMinPrice({
        productCost: 50,
        shippingCost: 15,
        commissionPercent: 12,
        fixedFee: 5,
        taxPercent: 6,
        adsPercent: 5,
        opexType: "percent",
        opexValue: 3,
      });
      
      expect(minPrice).toBeCloseTo(94.59, 1);
    });

    it("should verify CTM equals sale price at minimum price", () => {
      const params = {
        productCost: 50,
        shippingCost: 15,
        commissionPercent: 12,
        fixedFee: 5,
        taxPercent: 6,
        adsPercent: 5,
        opexType: "percent" as const,
        opexValue: 3,
      };
      
      const minPrice = calculateMinPrice(params);
      const ctm = calculateCTM({ ...params, salePrice: minPrice });
      
      expect(ctm).toBeCloseTo(minPrice, 1);
    });
  });

  describe("Weight Calculations", () => {
    it("should calculate cubed weight correctly", () => {
      const cubedWeight = calculateCubedWeight(30, 20, 10);
      expect(cubedWeight).toBe(1);
    });

    it("should determine considered weight as max of real and cubed", () => {
      const realWeight = 0.8;
      const cubedWeight = calculateCubedWeight(30, 20, 10);
      const consideredWeight = Math.max(realWeight, cubedWeight);
      expect(consideredWeight).toBe(1);
    });

    it("should use real weight when heavier than cubed", () => {
      const realWeight = 2;
      const cubedWeight = calculateCubedWeight(20, 15, 10);
      const consideredWeight = Math.max(realWeight, cubedWeight);
      expect(consideredWeight).toBe(2);
    });
  });

  describe("Product Cost from BOM", () => {
    it("should calculate product cost from materials", () => {
      const materials = [
        { unitCost: 10, quantity: 2 },
        { unitCost: 5, quantity: 3 },
        { unitCost: 8, quantity: 1 },
      ];
      
      const productCost = materials.reduce((sum, m) => sum + m.unitCost * m.quantity, 0);
      expect(productCost).toBe(43);
    });

    it("should handle decimal quantities", () => {
      const materials = [
        { unitCost: 100, quantity: 0.5 },
        { unitCost: 20, quantity: 0.25 },
      ];
      
      const productCost = materials.reduce((sum, m) => sum + m.unitCost * m.quantity, 0);
      expect(productCost).toBe(55);
    });
  });

  describe("Shipping Cost by Weight Range", () => {
    const shippingRanges = [
      { minWeight: 0, maxWeight: 500, cost: 15 },
      { minWeight: 501, maxWeight: 1000, cost: 20 },
      { minWeight: 1001, maxWeight: 2000, cost: 28 },
      { minWeight: 2001, maxWeight: 5000, cost: 40 },
    ];

    const getShippingCost = (weight: number) => {
      const range = shippingRanges.find(r => weight >= r.minWeight && weight <= r.maxWeight);
      return range?.cost || 0;
    };

    it("should return correct shipping cost for weight in first range", () => {
      expect(getShippingCost(300)).toBe(15);
    });

    it("should return correct shipping cost for weight in middle range", () => {
      expect(getShippingCost(800)).toBe(20);
    });

    it("should return correct shipping cost for weight at boundary", () => {
      expect(getShippingCost(1000)).toBe(20);
      expect(getShippingCost(1001)).toBe(28);
    });
  });

  describe("Margin Alerts", () => {
    it("should flag negative margin", () => {
      const { marginValue } = calculateMargin(80, 100);
      const isNegativeMargin = marginValue < 0;
      expect(isNegativeMargin).toBe(true);
    });

    it("should flag margin below target", () => {
      const { marginPercent } = calculateMargin(110, 100);
      const minMarginTarget = 15;
      const isBelowTarget = marginPercent < minMarginTarget;
      expect(isBelowTarget).toBe(true);
    });

    it("should not flag margin at or above target", () => {
      const { marginPercent } = calculateMargin(130, 100);
      const minMarginTarget = 15;
      const isBelowTarget = marginPercent < minMarginTarget;
      expect(isBelowTarget).toBe(false);
    });
  });
});
