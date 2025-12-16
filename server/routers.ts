import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  materials: router({
    list: protectedProcedure.query(async () => db.getMaterials()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getMaterialById(input.id)),
    create: protectedProcedure.input(z.object({
      sku: z.string(),
      description: z.string(),
      type: z.enum(["insumo", "embalagem"]),
      unitCost: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => db.createMaterial(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      sku: z.string(),
      description: z.string(),
      type: z.enum(["insumo", "embalagem"]),
      unitCost: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateMaterial(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteMaterial(input.id)),
  }),

  products: router({
    list: protectedProcedure.query(async () => db.getProducts()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getProductById(input.id)),
    create: protectedProcedure.input(z.object({
      sku: z.string(),
      name: z.string(),
      height: z.string().optional(),
      width: z.string().optional(),
      length: z.string().optional(),
      realWeight: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => db.createProduct(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      sku: z.string(),
      name: z.string(),
      height: z.string().optional(),
      width: z.string().optional(),
      length: z.string().optional(),
      realWeight: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateProduct(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteProduct(input.id)),
  }),

  productMaterials: router({
    list: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ input }) => db.getProductMaterials(input.productId)),
    add: protectedProcedure.input(z.object({
      productId: z.number(),
      materialId: z.number(),
      quantity: z.string(),
    })).mutation(async ({ input }) => db.addProductMaterial(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      quantity: z.string(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateProductMaterial(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number(), productId: z.number() })).mutation(async ({ input }) => db.deleteProductMaterial(input.id)),
  }),

  marketplaces: router({
    list: protectedProcedure.query(async () => db.getMarketplaces()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getMarketplaceById(input.id)),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      commissionPercent: z.string(),
      fixedFee: z.string().optional(),
      logisticsType: z.string().optional(),
      freeShipping: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => db.createMarketplace(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string(),
      commissionPercent: z.string(),
      fixedFee: z.string().optional(),
      logisticsType: z.string().optional(),
      freeShipping: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateMarketplace(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteMarketplace(input.id)),
  }),

  shippingRanges: router({
    list: protectedProcedure.input(z.object({ marketplaceId: z.number() })).query(async ({ input }) => db.getShippingRanges(input.marketplaceId)),
    create: protectedProcedure.input(z.object({
      marketplaceId: z.number(),
      minWeight: z.string(),
      maxWeight: z.string(),
      cost: z.string(),
    })).mutation(async ({ input }) => db.createShippingRange(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      minWeight: z.string(),
      maxWeight: z.string(),
      cost: z.string(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateShippingRange(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteShippingRange(input.id)),
  }),

  settings: router({
    get: protectedProcedure.query(async () => db.getSettings()),
    update: protectedProcedure.input(z.object({
      taxName: z.string().optional(),
      taxPercent: z.string().optional(),
      adsPercent: z.string().optional(),
      opexType: z.enum(["percent", "fixed"]).optional(),
      opexValue: z.string().optional(),
      minMarginTarget: z.string().optional(),
    })).mutation(async ({ input }) => db.updateSettings(input)),
  }),

  customCharges: router({
    list: protectedProcedure.query(async () => db.getCustomCharges()),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getCustomChargeById(input.id)),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      chargeType: z.enum(["percent_sale", "percent_cost", "fixed"]),
      value: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => db.createCustomCharge(input)),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string(),
      chargeType: z.enum(["percent_sale", "percent_cost", "fixed"]),
      value: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateCustomCharge(id, data);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteCustomCharge(input.id)),
  }),

  pricing: router({
    calculate: protectedProcedure.input(z.object({
      productId: z.number(),
      marketplaceId: z.number(),
      salePrice: z.number(),
      taxPercent: z.number().optional(),
      adsPercent: z.number().optional(),
      opexType: z.enum(["percent", "fixed"]).optional(),
      opexValue: z.number().optional(),
      customChargesOverride: z.array(z.object({
        id: z.number(),
        value: z.number().optional(),
        isActive: z.boolean().optional(),
      })).optional(),
    })).mutation(async ({ input }) => {
      const product = await db.getProductById(input.productId);
      const marketplace = await db.getMarketplaceById(input.marketplaceId);
      const settingsData = await db.getSettings();
      const charges = await db.getCustomCharges();

      if (!product || !marketplace) {
        throw new Error("Product or marketplace not found");
      }

      // Calculate product cost from BOM
      const productCost = await db.calculateProductCost(input.productId);

      // Calculate dimensions
      const height = parseFloat(product.height as string || "0");
      const width = parseFloat(product.width as string || "0");
      const length = parseFloat(product.length as string || "0");
      const realWeight = parseFloat(product.realWeight as string || "0");
      const cubicVolume = height * width * length;
      const cubedWeight = cubicVolume / 6000;
      const consideredWeight = Math.max(realWeight, cubedWeight);

      // Get shipping cost
      const shippingCost = await db.getShippingCost(input.marketplaceId, consideredWeight);

      // Marketplace commission
      const commissionPercent = parseFloat(marketplace.commissionPercent as string || "0");
      const fixedFee = parseFloat(marketplace.fixedFee as string || "0");
      const commission = (input.salePrice * commissionPercent / 100) + fixedFee;

      // Tax
      const taxPercent = input.taxPercent ?? parseFloat(settingsData?.taxPercent as string || "0");
      const taxValue = input.salePrice * taxPercent / 100;

      // ADS
      const adsPercent = input.adsPercent ?? parseFloat(settingsData?.adsPercent as string || "0");
      const adsValue = input.salePrice * adsPercent / 100;

      // OPEX
      const opexType = input.opexType ?? settingsData?.opexType ?? "percent";
      const opexValue = input.opexValue ?? parseFloat(settingsData?.opexValue as string || "0");
      const opexCost = opexType === "percent" ? input.salePrice * opexValue / 100 : opexValue;

      // Custom charges
      let customChargesTotal = 0;
      const chargeDetails: Array<{name: string, value: number}> = [];

      for (const charge of charges) {
        const override = input.customChargesOverride?.find(o => o.id === charge.id);
        const isActive = override?.isActive ?? charge.isActive;
        if (!isActive) continue;

        const chargeValue = override?.value ?? parseFloat(charge.value as string || "0");
        let calculatedValue = 0;

        switch (charge.chargeType) {
          case "percent_sale":
            calculatedValue = input.salePrice * chargeValue / 100;
            break;
          case "percent_cost":
            calculatedValue = productCost * chargeValue / 100;
            break;
          case "fixed":
            calculatedValue = chargeValue;
            break;
        }

        customChargesTotal += calculatedValue;
        chargeDetails.push({ name: charge.name, value: calculatedValue });
      }

      // Calculate CTM
      const ctm = productCost + shippingCost + commission + taxValue + adsValue + opexCost + customChargesTotal;

      // Calculate margin
      const marginValue = input.salePrice - ctm;
      const marginPercent = input.salePrice > 0 ? (marginValue / input.salePrice) * 100 : 0;

      // Calculate minimum price
      const minMarginTarget = parseFloat(settingsData?.minMarginTarget as string || "10");
      
      // Min price formula: minPrice = CTM / (1 - targetMargin/100)
      let customPercentTotal = 0;
      let customFixedTotal = 0;
      for (const charge of charges) {
        const override = input.customChargesOverride?.find(o => o.id === charge.id);
        const isActive = override?.isActive ?? charge.isActive;
        if (!isActive) continue;
        const chargeValue = override?.value ?? parseFloat(charge.value as string || "0");
        if (charge.chargeType === "percent_sale") {
          customPercentTotal += chargeValue;
        } else if (charge.chargeType === "fixed") {
          customFixedTotal += chargeValue;
        }
      }

      const percentCosts = commissionPercent + taxPercent + adsPercent + (opexType === "percent" ? opexValue : 0) + customPercentTotal;
      const fixedCosts = productCost + shippingCost + fixedFee + (opexType === "fixed" ? opexValue : 0) + customFixedTotal;
      const minPrice = fixedCosts / (1 - percentCosts / 100);

      return {
        salePrice: input.salePrice,
        ctm,
        marginValue,
        marginPercent,
        minPrice,
        costs: {
          productCost,
          shippingCost,
          commission,
          commissionPercent,
          fixedFee,
          taxValue,
          taxPercent,
          adsValue,
          adsPercent,
          opexCost,
          opexType,
          opexValue,
          customCharges: chargeDetails,
          customChargesTotal,
        },
        dimensions: {
          height,
          width,
          length,
          realWeight,
          cubicVolume,
          cubedWeight,
          consideredWeight,
        },
        alerts: {
          isNegativeMargin: marginValue < 0,
          isBelowTarget: marginPercent < minMarginTarget && marginPercent >= 0,
          minMarginTarget,
        },
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
