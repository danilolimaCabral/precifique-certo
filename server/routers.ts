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
    // Admin: Manage plans
    getAllPlans: adminProcedure.query(async () => db.getAllPlans()),
    updatePlan: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      priceMonthly: z.string().optional(),
      priceYearly: z.string().optional(),
      maxMaterials: z.number().optional(),
      maxProducts: z.number().optional(),
      maxMarketplaces: z.number().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updatePlan(id, data);
    }),
    updateUserPlan: adminProcedure.input(z.object({
      userId: z.number(),
      planId: z.number(),
      expiresAt: z.string().optional(),
    })).mutation(async ({ input }) => {
      const expiresAt = input.expiresAt ? new Date(input.expiresAt) : undefined;
      return db.updateUserPlan(input.userId, input.planId, expiresAt);
    }),
  }),

  // Plans - Public
  plans: router({
    list: publicProcedure.query(async () => db.getPlans()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getPlanById(input.id)),
    getBySlug: publicProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => db.getPlanBySlug(input.slug)),
    myPlan: protectedProcedure.query(async ({ ctx }) => db.getEffectivePlan(ctx.user.id)),
    myLimits: protectedProcedure.query(async ({ ctx }) => db.checkPlanLimitsWithTrial(ctx.user.id)),
    // Trial
    trialStatus: protectedProcedure.query(async ({ ctx }) => db.getTrialStatus(ctx.user.id)),
    startTrial: protectedProcedure.input(z.object({ planId: z.number() })).mutation(async ({ ctx, input }) => db.startTrial(ctx.user.id, input.planId)),
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
    listWithCost: protectedProcedure.query(async ({ ctx }) => {
      const products = await db.getProducts(ctx.user.id);
      const productsWithCost = await Promise.all(
        products.map(async (p) => ({
          ...p,
          totalCost: await db.calculateProductCost(p.id, ctx.user.id),
        }))
      );
      return productsWithCost;
    }),
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
  // Tax Regimes - System-wide
  taxRegimes: router({
    list: publicProcedure.query(async () => db.getTaxRegimes()),
    listAll: adminProcedure.query(async () => db.getAllTaxRegimes()),
    get: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => db.getTaxRegimeById(input.id)),
    create: adminProcedure.input(z.object({
      name: z.string().min(1, "Nome é obrigatório"),
      defaultRate: z.string(),
    })).mutation(async ({ input }) => db.createTaxRegime(input)),
    update: adminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      defaultRate: z.string().optional(),
      isActive: z.boolean().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      return db.updateTaxRegime(id, data);
    }),
    delete: adminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => db.deleteTaxRegime(input.id)),
  }),

  settings: router({
    get: protectedProcedure.query(async ({ ctx }) => db.getSettings(ctx.user.id)),
    update: protectedProcedure.input(z.object({
      taxRegimeId: z.number().optional(),
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

  // Import - Bulk import from Excel
  import: router({
    materials: protectedProcedure.input(z.object({
      materials: z.array(z.object({
        sku: z.string(),
        description: z.string(),
        type: z.enum(["insumo", "embalagem"]),
        unitCost: z.string(),
      })),
    })).mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const data = input.materials.map(m => ({ ...m, userId, isActive: true }));
      return db.bulkCreateMaterials(data);
    }),

    products: protectedProcedure.input(z.object({
      products: z.array(z.object({
        sku: z.string(),
        name: z.string(),
        height: z.string().optional(),
        width: z.string().optional(),
        length: z.string().optional(),
        realWeight: z.string().optional(),
      })),
    })).mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const data = input.products.map(p => ({ ...p, userId, isActive: true }));
      return db.bulkCreateProducts(data);
    }),

    productMaterials: protectedProcedure.input(z.object({
      items: z.array(z.object({
        productSku: z.string(),
        materialSku: z.string(),
        quantity: z.string(),
      })),
    })).mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const data: Array<{ userId: number; productId: number; materialId: number; quantity: string }> = [];
      
      for (const item of input.items) {
        const product = await db.getProductBySku(item.productSku, userId);
        const material = await db.getMaterialBySku(item.materialSku, userId);
        
        if (product && material) {
          data.push({
            userId,
            productId: product.id,
            materialId: material.id,
            quantity: item.quantity,
          });
        }
      }
      
      return db.bulkCreateProductMaterials(data);
    }),
  }),

  // Mercado Livre Integration
  mercadoLivre: router({
    // Get ML credentials status
    getStatus: protectedProcedure.query(async ({ ctx }) => {
      const credentials = await db.getMlCredentials(ctx.user.id);
      if (!credentials) {
        return { isConfigured: false, isConnected: false };
      }
      return {
        isConfigured: !!credentials.clientId && !!credentials.clientSecret,
        isConnected: credentials.isConnected,
        lastSyncAt: credentials.lastSyncAt,
      };
    }),

    // Save ML app credentials
    saveCredentials: protectedProcedure.input(z.object({
      clientId: z.string().min(1, "Client ID é obrigatório"),
      clientSecret: z.string().min(1, "Client Secret é obrigatório"),
    })).mutation(async ({ input, ctx }) => {
      return db.saveMlCredentials(ctx.user.id, input);
    }),

    // Get authorization URL for OAuth flow
    getAuthUrl: protectedProcedure.input(z.object({
      redirectUri: z.string(),
    })).query(async ({ input, ctx }) => {
      const credentials = await db.getMlCredentials(ctx.user.id);
      if (!credentials?.clientId) {
        throw new Error("Configure as credenciais do Mercado Livre primeiro");
      }
      const { getAuthorizationUrl } = await import("./mercadolivre");
      const state = `user_${ctx.user.id}_${Date.now()}`;
      return {
        url: getAuthorizationUrl(credentials.clientId, input.redirectUri, state),
        state,
      };
    }),

    // Exchange authorization code for tokens
    exchangeCode: protectedProcedure.input(z.object({
      code: z.string(),
      redirectUri: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const credentials = await db.getMlCredentials(ctx.user.id);
      if (!credentials?.clientId || !credentials?.clientSecret) {
        throw new Error("Credenciais do Mercado Livre não configuradas");
      }
      const { exchangeCodeForToken } = await import("./mercadolivre");
      const tokens = await exchangeCodeForToken(
        credentials.clientId,
        credentials.clientSecret,
        input.code,
        input.redirectUri
      );
      await db.saveMlTokens(ctx.user.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresIn: tokens.expires_in,
      });
      return { success: true };
    }),

    // Disconnect ML account
    disconnect: protectedProcedure.mutation(async ({ ctx }) => {
      return db.disconnectMl(ctx.user.id);
    }),

    // Delete ML credentials
    deleteCredentials: protectedProcedure.mutation(async ({ ctx }) => {
      return db.deleteMlCredentials(ctx.user.id);
    }),

    // Get current commissions from ML
    getCommissions: protectedProcedure.input(z.object({
      referencePrice: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const credentials = await db.getMlCredentials(ctx.user.id);
      if (!credentials?.accessToken) {
        throw new Error("Conecte sua conta do Mercado Livre primeiro");
      }
      const { getListingPrices } = await import("./mercadolivre");
      const prices = await getListingPrices(
        credentials.accessToken,
        input.referencePrice || 100
      );
      return prices.map(p => ({
        listingTypeId: p.listing_type_id,
        listingTypeName: p.listing_type_name,
        commissionPercent: p.sale_fee_details?.percentage_fee || 0,
        fixedFee: p.sale_fee_details?.fixed_fee || 0,
        exposure: p.listing_exposure,
      }));
    }),

    // Sync commissions to marketplaces
    syncCommissions: protectedProcedure.input(z.object({
      referencePrice: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const credentials = await db.getMlCredentials(userId);
      if (!credentials?.accessToken) {
        throw new Error("Conecte sua conta do Mercado Livre primeiro");
      }
      
      const { getListingPrices, mapListingTypeToMarketplace } = await import("./mercadolivre");
      const prices = await getListingPrices(
        credentials.accessToken,
        input.referencePrice || 100
      );
      
      const userMarketplaces = await db.getMarketplaces(userId);
      let updated = 0;
      const updates: Array<{ name: string; oldCommission: number; newCommission: number }> = [];
      
      for (const price of prices) {
        if (price.listing_type_id !== "gold_pro" && price.listing_type_id !== "gold_special") continue;
        
        const mlName = mapListingTypeToMarketplace(price.listing_type_id);
        const marketplace = userMarketplaces.find(m => 
          m.name.toLowerCase().includes("mercado livre") &&
          (price.listing_type_id === "gold_pro" 
            ? m.name.toLowerCase().includes("premium") 
            : m.name.toLowerCase().includes("clássico") || m.name.toLowerCase().includes("classico"))
        );
        
        if (marketplace) {
          const oldCommission = parseFloat(marketplace.commissionPercent as string || "0");
          const newCommission = price.sale_fee_details?.percentage_fee || 0;
          const fixedFee = price.sale_fee_details?.fixed_fee || 0;
          
          await db.updateMarketplace(marketplace.id, {
            commissionPercent: newCommission.toString(),
            fixedFee: fixedFee.toString(),
          }, userId);
          
          updates.push({
            name: marketplace.name,
            oldCommission,
            newCommission,
          });
          updated++;
        }
      }
      
      await db.updateMlLastSync(userId);
      
      return {
        success: true,
        updated,
        updates,
      };
    }),
  }),

  // Analytics - Dashboard charts data
  analytics: router({
    marginByProduct: protectedProcedure.input(z.object({
      marketplaceId: z.number().optional(),
      salePrice: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const products = await db.getProducts(userId);
      const marketplaces = await db.getMarketplaces(userId);
      const settingsData = await db.getSettings(userId);
      
      if (products.length === 0 || marketplaces.length === 0) {
        return [];
      }
      
      const targetMarketplace = input.marketplaceId 
        ? marketplaces.find(m => m.id === input.marketplaceId) 
        : marketplaces[0];
      
      if (!targetMarketplace) return [];
      
      const results = [];
      for (const product of products.slice(0, 10)) {
        const productCost = await db.calculateProductCost(product.id, userId);
        const realWeight = parseFloat(product.realWeight as string || "0");
        const shippingCost = await db.getShippingCost(targetMarketplace.id, realWeight, userId);
        const commissionPercent = parseFloat(targetMarketplace.commissionPercent as string || "0");
        const fixedFee = parseFloat(targetMarketplace.fixedFee as string || "0");
        const taxPercent = parseFloat(settingsData?.taxPercent as string || "0");
        
        // Use provided sale price or estimate based on cost + 50% margin
        const salePrice = input.salePrice || (productCost > 0 ? productCost * 1.5 : 100);
        const commission = (salePrice * commissionPercent / 100) + fixedFee;
        const taxValue = salePrice * taxPercent / 100;
        const ctm = productCost + shippingCost + commission + taxValue;
        const marginValue = salePrice - ctm;
        const marginPercent = salePrice > 0 ? (marginValue / salePrice) * 100 : 0;
        
        results.push({
          id: product.id,
          name: product.name || product.sku,
          sku: product.sku,
          productCost,
          salePrice,
          ctm,
          marginValue,
          marginPercent,
        });
      }
      
      return results;
    }),
    
    marginByMarketplace: protectedProcedure.input(z.object({
      productId: z.number().optional(),
      salePrice: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const products = await db.getProducts(userId);
      const marketplaces = await db.getMarketplaces(userId);
      const settingsData = await db.getSettings(userId);
      
      if (marketplaces.length === 0) {
        return [];
      }
      
      const targetProduct = input.productId 
        ? products.find(p => p.id === input.productId) 
        : products[0];
      
      const productCost = targetProduct 
        ? await db.calculateProductCost(targetProduct.id, userId) 
        : 50;
      const realWeight = targetProduct 
        ? parseFloat(targetProduct.realWeight as string || "0") 
        : 500;
      
      const salePrice = input.salePrice || (productCost > 0 ? productCost * 1.5 : 100);
      const taxPercent = parseFloat(settingsData?.taxPercent as string || "0");
      const taxValue = salePrice * taxPercent / 100;
      
      const results = [];
      for (const marketplace of marketplaces) {
        const shippingCost = await db.getShippingCost(marketplace.id, realWeight, userId);
        const commissionPercent = parseFloat(marketplace.commissionPercent as string || "0");
        const fixedFee = parseFloat(marketplace.fixedFee as string || "0");
        const commission = (salePrice * commissionPercent / 100) + fixedFee;
        const ctm = productCost + shippingCost + commission + taxValue;
        const marginValue = salePrice - ctm;
        const marginPercent = salePrice > 0 ? (marginValue / salePrice) * 100 : 0;
        
        results.push({
          id: marketplace.id,
          name: marketplace.name,
          commissionPercent,
          shippingCost,
          ctm,
          marginValue,
          marginPercent,
        });
      }
      
      return results;
    }),
    
    summary: protectedProcedure.query(async ({ ctx }) => {
      const userId = ctx.user.id;
      const products = await db.getProducts(userId);
      const marketplaces = await db.getMarketplaces(userId);
      const materials = await db.getMaterials(userId);
      const settingsData = await db.getSettings(userId);
      
      let totalProductCost = 0;
      for (const product of products) {
        totalProductCost += await db.calculateProductCost(product.id, userId);
      }
      
      const avgCommission = marketplaces.length > 0
        ? marketplaces.reduce((sum, m) => sum + parseFloat(m.commissionPercent as string || "0"), 0) / marketplaces.length
        : 0;
      
      return {
        totalProducts: products.length,
        totalMaterials: materials.length,
        totalMarketplaces: marketplaces.length,
        totalProductCost,
        avgProductCost: products.length > 0 ? totalProductCost / products.length : 0,
        avgCommission,
        taxPercent: parseFloat(settingsData?.taxPercent as string || "0"),
        minMarginTarget: parseFloat(settingsData?.minMarginTarget as string || "10"),
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
