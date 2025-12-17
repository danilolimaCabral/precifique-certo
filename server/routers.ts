import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { sdk } from "./_core/sdk";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    register: publicProcedure.input(z.object({
      name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    })).mutation(async ({ input, ctx }) => {
      try {
        const user = await db.createUserWithPassword(input);
        const sessionToken = await sdk.createSessionToken(user.openId, {
          name: user.name,
          expiresInMs: 365 * 24 * 60 * 60 * 1000,
        });
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
        return { success: true, user: { id: user.id, name: user.name, email: user.email } };
      } catch (error: any) {
        throw new Error(error.message || "Erro ao criar conta");
      }
    }),
    login: publicProcedure.input(z.object({
      email: z.string().email("Email inválido"),
      password: z.string().min(1, "Senha é obrigatória"),
    })).mutation(async ({ input, ctx }) => {
      const user = await db.verifyUserPassword(input.email, input.password);
      if (!user) throw new Error("Email ou senha incorretos");
      const sessionToken = await sdk.createSessionToken(user.openId, {
        name: user.name || "",
        expiresInMs: 365 * 24 * 60 * 60 * 1000,
      });
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: 365 * 24 * 60 * 60 * 1000 });
      return { success: true, user: { id: user.id, name: user.name, email: user.email } };
    }),
  }),

  // Admin routes for user management
  admin: router({
    listUsers: adminProcedure.query(async () => db.getAllUsers()),
    listUsersWithMarketplaces: adminProcedure.query(async () => db.getUsersWithMarketplaces()),
    updateUserRole: adminProcedure.input(z.object({
      userId: z.number(),
      role: z.enum(["user", "admin"]),
    })).mutation(async ({ input }) => db.updateUserRole(input.userId, input.role)),
    getUserStats: adminProcedure.input(z.object({ userId: z.number() })).query(async ({ input }) => {
      return db.getUserStats(input.userId);
    }),
    duplicateMarketplaces: adminProcedure.input(z.object({
      sourceUserId: z.number(),
      targetUserId: z.number(),
    })).mutation(async ({ input }) => {
      if (input.sourceUserId === input.targetUserId) {
        throw new Error("Usuário de origem e destino não podem ser iguais");
      }
      return db.duplicateMarketplacesToUser(input.sourceUserId, input.targetUserId);
    }),
  }),

  // Materials - Multi-tenant
  materials: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getMaterials(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => db.getMaterialById(input.id, ctx.user.id)),
    create: protectedProcedure.input(z.object({
      sku: z.string(),
      description: z.string(),
      type: z.enum(["insumo", "embalagem"]),
      unitCost: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => db.createMaterial({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      sku: z.string(),
      description: z.string(),
      type: z.enum(["insumo", "embalagem"]),
      unitCost: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return db.updateMaterial(id, data, ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => db.deleteMaterial(input.id, ctx.user.id)),
  }),

  // Products - Multi-tenant
  products: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getProducts(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => db.getProductById(input.id, ctx.user.id)),
    create: protectedProcedure.input(z.object({
      sku: z.string(),
      name: z.string(),
      height: z.string().optional(),
      width: z.string().optional(),
      length: z.string().optional(),
      realWeight: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => db.createProduct({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      sku: z.string(),
      name: z.string(),
      height: z.string().optional(),
      width: z.string().optional(),
      length: z.string().optional(),
      realWeight: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return db.updateProduct(id, data, ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => db.deleteProduct(input.id, ctx.user.id)),
  }),

  // Product Materials - Multi-tenant
  productMaterials: router({
    list: protectedProcedure.input(z.object({ productId: z.number() })).query(async ({ input, ctx }) => db.getProductMaterials(input.productId, ctx.user.id)),
    add: protectedProcedure.input(z.object({
      productId: z.number(),
      materialId: z.number(),
      quantity: z.string(),
    })).mutation(async ({ input, ctx }) => db.addProductMaterial({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      quantity: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return db.updateProductMaterial(id, data, ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number(), productId: z.number() })).mutation(async ({ input, ctx }) => db.deleteProductMaterial(input.id, ctx.user.id)),
  }),

  // Marketplaces - Multi-tenant
  marketplaces: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getMarketplaces(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => db.getMarketplaceById(input.id, ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      commissionPercent: z.string(),
      fixedFee: z.string().optional(),
      logisticsType: z.string().optional(),
      freeShipping: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => db.createMarketplace({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string(),
      commissionPercent: z.string(),
      fixedFee: z.string().optional(),
      logisticsType: z.string().optional(),
      freeShipping: z.boolean().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return db.updateMarketplace(id, data, ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => db.deleteMarketplace(input.id, ctx.user.id)),
  }),

  // Shipping Ranges - Multi-tenant
  shippingRanges: router({
    list: protectedProcedure.input(z.object({ marketplaceId: z.number() })).query(async ({ input, ctx }) => db.getShippingRanges(input.marketplaceId, ctx.user.id)),
    create: protectedProcedure.input(z.object({
      marketplaceId: z.number(),
      minWeight: z.string(),
      maxWeight: z.string(),
      cost: z.string(),
    })).mutation(async ({ input, ctx }) => db.createShippingRange({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      minWeight: z.string(),
      maxWeight: z.string(),
      cost: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return db.updateShippingRange(id, data, ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => db.deleteShippingRange(input.id, ctx.user.id)),
  }),

  // Settings - Multi-tenant
  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => db.getSettings(ctx.user.id)),
    update: protectedProcedure.input(z.object({
      taxName: z.string().optional(),
      taxPercent: z.string().optional(),
      adsPercent: z.string().optional(),
      opexType: z.enum(["percent", "fixed"]).optional(),
      opexValue: z.string().optional(),
      minMarginTarget: z.string().optional(),
    })).mutation(async ({ input, ctx }) => db.updateSettings(input, ctx.user.id)),
  }),

  // Custom Charges - Multi-tenant
  customCharges: router({
    list: protectedProcedure.query(async ({ ctx }) => db.getCustomCharges(ctx.user.id)),
    get: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input, ctx }) => db.getCustomChargeById(input.id, ctx.user.id)),
    create: protectedProcedure.input(z.object({
      name: z.string(),
      chargeType: z.enum(["percent_sale", "percent_cost", "fixed"]),
      value: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => db.createCustomCharge({ ...input, userId: ctx.user.id })),
    update: protectedProcedure.input(z.object({
      id: z.number(),
      name: z.string(),
      chargeType: z.enum(["percent_sale", "percent_cost", "fixed"]),
      value: z.string(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      return db.updateCustomCharge(id, data, ctx.user.id);
    }),
    delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => db.deleteCustomCharge(input.id, ctx.user.id)),
  }),

  // Pricing - Multi-tenant
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
    })).mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const product = await db.getProductById(input.productId, userId);
      const marketplace = await db.getMarketplaceById(input.marketplaceId, userId);
      const settingsData = await db.getSettings(userId);
      const charges = await db.getCustomCharges(userId);

      if (!product || !marketplace) {
        throw new Error("Product or marketplace not found");
      }

      const productCost = await db.calculateProductCost(input.productId, userId);
      const height = parseFloat(product.height as string || "0");
      const width = parseFloat(product.width as string || "0");
      const length = parseFloat(product.length as string || "0");
      const realWeight = parseFloat(product.realWeight as string || "0");
      const cubicVolume = height * width * length;
      const cubedWeight = cubicVolume / 6000;
      const consideredWeight = Math.max(realWeight, cubedWeight);
      const shippingCost = await db.getShippingCost(input.marketplaceId, consideredWeight, userId);
      const commissionPercent = parseFloat(marketplace.commissionPercent as string || "0");
      const fixedFee = parseFloat(marketplace.fixedFee as string || "0");
      const commission = (input.salePrice * commissionPercent / 100) + fixedFee;
      const taxPercent = input.taxPercent ?? parseFloat(settingsData?.taxPercent as string || "0");
      const taxValue = input.salePrice * taxPercent / 100;
      const adsPercent = input.adsPercent ?? parseFloat(settingsData?.adsPercent as string || "0");
      const adsValue = input.salePrice * adsPercent / 100;
      const opexType = input.opexType ?? settingsData?.opexType ?? "percent";
      const opexValue = input.opexValue ?? parseFloat(settingsData?.opexValue as string || "0");
      const opexCost = opexType === "percent" ? input.salePrice * opexValue / 100 : opexValue;

      let customChargesTotal = 0;
      const chargeDetails: Array<{name: string, value: number}> = [];
      for (const charge of charges) {
        const override = input.customChargesOverride?.find(o => o.id === charge.id);
        const isActive = override?.isActive ?? charge.isActive;
        if (!isActive) continue;
        const chargeValue = override?.value ?? parseFloat(charge.value as string || "0");
        let calculatedValue = 0;
        switch (charge.chargeType) {
          case "percent_sale": calculatedValue = input.salePrice * chargeValue / 100; break;
          case "percent_cost": calculatedValue = productCost * chargeValue / 100; break;
          case "fixed": calculatedValue = chargeValue; break;
        }
        customChargesTotal += calculatedValue;
        chargeDetails.push({ name: charge.name, value: calculatedValue });
      }

      const ctm = productCost + shippingCost + commission + taxValue + adsValue + opexCost + customChargesTotal;
      const marginValue = input.salePrice - ctm;
      const marginPercent = input.salePrice > 0 ? (marginValue / input.salePrice) * 100 : 0;
      const minMarginTarget = parseFloat(settingsData?.minMarginTarget as string || "10");

      let customPercentTotal = 0;
      let customFixedTotal = 0;
      for (const charge of charges) {
        const override = input.customChargesOverride?.find(o => o.id === charge.id);
        const isActive = override?.isActive ?? charge.isActive;
        if (!isActive) continue;
        const chargeValue = override?.value ?? parseFloat(charge.value as string || "0");
        if (charge.chargeType === "percent_sale") customPercentTotal += chargeValue;
        else if (charge.chargeType === "fixed") customFixedTotal += chargeValue;
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
          productCost, shippingCost, commission, commissionPercent, fixedFee,
          taxValue, taxPercent, adsValue, adsPercent, opexCost, opexType, opexValue,
          customCharges: chargeDetails, customChargesTotal,
        },
        dimensions: { height, width, length, realWeight, cubicVolume, cubedWeight, consideredWeight },
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
