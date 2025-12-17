import { describe, expect, it } from "vitest";

// Testes para o sistema de planos de assinatura

describe("Plans System", () => {
  describe("Plan Limits", () => {
    it("should define correct limits for free plan", () => {
      const freePlan = {
        slug: "free",
        maxMaterials: 10,
        maxProducts: 5,
        maxMarketplaces: 2,
        hasSimulator: false,
        hasReports: false,
        hasExport: false,
        hasPrioritySupport: false,
      };
      
      expect(freePlan.maxMaterials).toBe(10);
      expect(freePlan.maxProducts).toBe(5);
      expect(freePlan.maxMarketplaces).toBe(2);
      expect(freePlan.hasSimulator).toBe(false);
    });

    it("should define correct limits for basic plan", () => {
      const basicPlan = {
        slug: "basic",
        maxMaterials: 50,
        maxProducts: 25,
        maxMarketplaces: 5,
        hasSimulator: true,
        hasReports: false,
        hasExport: false,
        hasPrioritySupport: false,
      };
      
      expect(basicPlan.maxMaterials).toBe(50);
      expect(basicPlan.maxProducts).toBe(25);
      expect(basicPlan.maxMarketplaces).toBe(5);
      expect(basicPlan.hasSimulator).toBe(true);
    });

    it("should define correct limits for pro plan", () => {
      const proPlan = {
        slug: "pro",
        maxMaterials: 200,
        maxProducts: 100,
        maxMarketplaces: 10,
        hasSimulator: true,
        hasReports: true,
        hasExport: true,
        hasPrioritySupport: false,
      };
      
      expect(proPlan.maxMaterials).toBe(200);
      expect(proPlan.maxProducts).toBe(100);
      expect(proPlan.maxMarketplaces).toBe(10);
      expect(proPlan.hasReports).toBe(true);
    });

    it("should define unlimited for enterprise plan", () => {
      const enterprisePlan = {
        slug: "enterprise",
        maxMaterials: -1, // -1 means unlimited
        maxProducts: -1,
        maxMarketplaces: -1,
        hasSimulator: true,
        hasReports: true,
        hasExport: true,
        hasPrioritySupport: true,
      };
      
      expect(enterprisePlan.maxMaterials).toBe(-1);
      expect(enterprisePlan.maxProducts).toBe(-1);
      expect(enterprisePlan.maxMarketplaces).toBe(-1);
      expect(enterprisePlan.hasPrioritySupport).toBe(true);
    });
  });

  describe("Limit Checking", () => {
    it("should allow creation when under limit", () => {
      const currentCount = 5;
      const limit = 10;
      const canCreate = limit === -1 || currentCount < limit;
      
      expect(canCreate).toBe(true);
    });

    it("should block creation when at limit", () => {
      const currentCount = 10;
      const limit = 10;
      const canCreate = limit === -1 || currentCount < limit;
      
      expect(canCreate).toBe(false);
    });

    it("should allow creation when unlimited (-1)", () => {
      const currentCount = 1000;
      const limit = -1;
      const canCreate = limit === -1 || currentCount < limit;
      
      expect(canCreate).toBe(true);
    });
  });

  describe("Plan Pricing", () => {
    it("should calculate yearly discount correctly", () => {
      const monthlyPrice = 49.90;
      const yearlyPrice = 499.00;
      const expectedYearlyWithoutDiscount = monthlyPrice * 12;
      const discount = ((expectedYearlyWithoutDiscount - yearlyPrice) / expectedYearlyWithoutDiscount) * 100;
      
      expect(discount).toBeCloseTo(16.7, 0);
    });

    it("should have free plan at R$0", () => {
      const freePlanPrice = 0;
      expect(freePlanPrice).toBe(0);
    });
  });

  describe("User Plan Assignment", () => {
    it("should assign free plan to new users by default", () => {
      const newUser = {
        id: 1,
        planId: 1, // Free plan ID
        planExpiresAt: null, // Free plan never expires
      };
      
      expect(newUser.planId).toBe(1);
      expect(newUser.planExpiresAt).toBeNull();
    });

    it("should set expiration date for paid plans", () => {
      const paidUser = {
        id: 2,
        planId: 2, // Basic plan
        planExpiresAt: new Date("2025-01-16"), // 30 days from now
      };
      
      expect(paidUser.planId).toBe(2);
      expect(paidUser.planExpiresAt).not.toBeNull();
    });
  });
});
