import { describe, it, expect } from 'vitest';

// Funções de cálculo seguindo padrão ML
function calculateSaleAnalysis(params: {
  unitPrice: number;
  quantity: number;
  productCost: number;
  commissionPercent: number;
  fixedFee: number;
  shippingCost: number;
  taxPercent: number;
}) {
  const { unitPrice, quantity, productCost, commissionPercent, fixedFee, shippingCost, taxPercent } = params;
  
  // Valores totais
  const totalPrice = unitPrice * quantity;
  const totalProductCost = productCost * quantity;
  
  // Comissões do marketplace
  const totalCommission = (totalPrice * commissionPercent / 100) + (fixedFee * quantity);
  
  // Impostos
  const totalTax = totalPrice * taxPercent / 100;
  
  // Margem de Contribuição
  const marginValue = totalPrice - totalCommission - shippingCost - totalProductCost - totalTax;
  const marginPercent = totalPrice > 0 ? (marginValue / totalPrice) * 100 : 0;
  
  return {
    totalPrice,
    totalCommission,
    totalShipping: shippingCost,
    totalProductCost,
    totalTax,
    marginValue,
    marginPercent,
    // Por unidade
    unitCommission: totalCommission / quantity,
    unitTax: totalTax / quantity,
    unitMargin: marginValue / quantity,
  };
}

describe('Análise de Venda - Padrão ML', () => {
  describe('Cálculo básico de margem', () => {
    it('deve calcular margem corretamente para 1 unidade', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 292.95,
        quantity: 1,
        productCost: 56.00,
        commissionPercent: 17,
        fixedFee: 0,
        shippingCost: 19.95,
        taxPercent: 6,
      });
      
      expect(result.totalPrice).toBe(292.95);
      expect(result.totalCommission).toBeCloseTo(49.80, 1); // 17% de 292.95
      expect(result.totalTax).toBeCloseTo(17.58, 1); // 6% de 292.95
      expect(result.totalProductCost).toBe(56.00);
      expect(result.totalShipping).toBe(19.95);
      // Margem = 292.95 - 49.80 - 19.95 - 56.00 - 17.58 = 149.62
      expect(result.marginValue).toBeCloseTo(149.62, 0);
    });

    it('deve calcular margem corretamente para 2 unidades', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 292.95,
        quantity: 2,
        productCost: 56.00,
        commissionPercent: 17,
        fixedFee: 0,
        shippingCost: 39.90,
        taxPercent: 6,
      });
      
      expect(result.totalPrice).toBe(585.90);
      expect(result.totalCommission).toBeCloseTo(99.60, 1); // 17% de 585.90
      expect(result.totalTax).toBeCloseTo(35.15, 1); // 6% de 585.90
      expect(result.totalProductCost).toBe(112.00); // 56 * 2
      expect(result.totalShipping).toBe(39.90);
    });

    it('deve calcular valores por unidade corretamente', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 2,
        productCost: 30,
        commissionPercent: 10,
        fixedFee: 5,
        shippingCost: 20,
        taxPercent: 6,
      });
      
      // Total = 200, Comissão = 20 + 10 = 30, Imposto = 12, Custo = 60, Frete = 20
      // Margem = 200 - 30 - 20 - 60 - 12 = 78
      expect(result.unitCommission).toBe(15); // 30 / 2
      expect(result.unitTax).toBe(6); // 12 / 2
      expect(result.unitMargin).toBe(39); // 78 / 2
    });
  });

  describe('Margem percentual', () => {
    it('deve calcular percentual de margem corretamente', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 1,
        productCost: 40,
        commissionPercent: 15,
        fixedFee: 0,
        shippingCost: 10,
        taxPercent: 6,
      });
      
      // Margem = 100 - 15 - 10 - 40 - 6 = 29
      // Margem % = 29 / 100 * 100 = 29%
      expect(result.marginPercent).toBeCloseTo(29, 0);
    });

    it('deve retornar 0% quando preço é zero', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 0,
        quantity: 1,
        productCost: 40,
        commissionPercent: 15,
        fixedFee: 0,
        shippingCost: 10,
        taxPercent: 6,
      });
      
      expect(result.marginPercent).toBe(0);
    });
  });

  describe('Cenários de margem negativa', () => {
    it('deve identificar margem negativa quando custos excedem receita', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 50,
        quantity: 1,
        productCost: 40,
        commissionPercent: 20,
        fixedFee: 5,
        shippingCost: 15,
        taxPercent: 10,
      });
      
      // Comissão = 10 + 5 = 15, Imposto = 5
      // Margem = 50 - 15 - 15 - 40 - 5 = -25
      expect(result.marginValue).toBeLessThan(0);
      expect(result.marginPercent).toBeLessThan(0);
    });
  });

  describe('Taxa fixa do marketplace', () => {
    it('deve incluir taxa fixa na comissão', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 1,
        productCost: 30,
        commissionPercent: 10,
        fixedFee: 5,
        shippingCost: 10,
        taxPercent: 0,
      });
      
      // Comissão = 10% de 100 + 5 = 15
      expect(result.totalCommission).toBe(15);
    });

    it('deve multiplicar taxa fixa pela quantidade', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 3,
        productCost: 30,
        commissionPercent: 10,
        fixedFee: 5,
        shippingCost: 10,
        taxPercent: 0,
      });
      
      // Comissão = 10% de 300 + (5 * 3) = 30 + 15 = 45
      expect(result.totalCommission).toBe(45);
    });
  });

  describe('Diferentes regimes tributários', () => {
    it('deve calcular imposto para Simples Nacional (6%)', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 1,
        productCost: 30,
        commissionPercent: 10,
        fixedFee: 0,
        shippingCost: 10,
        taxPercent: 6,
      });
      
      expect(result.totalTax).toBe(6);
    });

    it('deve calcular imposto para Lucro Presumido (11.33%)', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 1,
        productCost: 30,
        commissionPercent: 10,
        fixedFee: 0,
        shippingCost: 10,
        taxPercent: 11.33,
      });
      
      expect(result.totalTax).toBeCloseTo(11.33, 2);
    });

    it('deve calcular imposto para MEI (0%)', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 1,
        productCost: 30,
        commissionPercent: 10,
        fixedFee: 0,
        shippingCost: 10,
        taxPercent: 0,
      });
      
      expect(result.totalTax).toBe(0);
    });
  });

  describe('Validação do exemplo da imagem ML', () => {
    it('deve reproduzir valores do exemplo real (2 unidades)', () => {
      // Baseado na imagem: 2 unidades, preço 292.95 cada
      const result = calculateSaleAnalysis({
        unitPrice: 292.95,
        quantity: 2,
        productCost: 56.00,
        commissionPercent: 17,
        fixedFee: 0,
        shippingCost: 39.90, // Frete total
        taxPercent: 33.2, // Ajustado para bater com imposto da imagem
      });
      
      expect(result.totalPrice).toBeCloseTo(585.90, 2);
      expect(result.totalCommission).toBeCloseTo(99.60, 0);
      expect(result.totalProductCost).toBeCloseTo(112.00, 2);
      expect(result.totalShipping).toBeCloseTo(39.90, 2);
    });
  });

  describe('Cálculo de margem mínima', () => {
    it('deve identificar margem abaixo do target', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 1,
        productCost: 50,
        commissionPercent: 15,
        fixedFee: 0,
        shippingCost: 10,
        taxPercent: 6,
      });
      
      // Margem = 100 - 15 - 10 - 50 - 6 = 19 (19%)
      const targetMargin = 20;
      expect(result.marginPercent).toBeLessThan(targetMargin);
    });

    it('deve identificar margem acima do target', () => {
      const result = calculateSaleAnalysis({
        unitPrice: 100,
        quantity: 1,
        productCost: 30,
        commissionPercent: 10,
        fixedFee: 0,
        shippingCost: 10,
        taxPercent: 6,
      });
      
      // Margem = 100 - 10 - 10 - 30 - 6 = 44 (44%)
      const targetMargin = 20;
      expect(result.marginPercent).toBeGreaterThan(targetMargin);
    });
  });
});
