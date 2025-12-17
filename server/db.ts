import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, materials, products, productMaterials, marketplaces, shippingRanges, settings, customCharges, pricingRecords, plans, Material, Product, ProductMaterial, Marketplace, ShippingRange, Settings, CustomCharge, PricingRecord, Plan, InsertMaterial, InsertProduct, InsertProductMaterial, InsertMarketplace, InsertShippingRange, InsertSettings, InsertCustomCharge, InsertPricingRecord, InsertPlan } from "../drizzle/schema";
import { ENV } from './_core/env';
import bcrypt from 'bcryptjs';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER MANAGEMENT ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot upsert user: database not available"); return; }
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; } else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) { console.warn("[Database] Cannot get user: database not available"); return undefined; }
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function createUserWithPassword(data: { name: string; email: string; password: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) throw new Error("Email já cadastrado");
  const passwordHash = await bcrypt.hash(data.password, 10);
  const openId = `local_${nanoid(20)}`;
  const result = await db.insert(users).values({
    openId, name: data.name, email: data.email, passwordHash,
    loginMethod: 'email', role: 'user', lastSignedIn: new Date(),
  });
  return { id: result[0].insertId, openId, email: data.email, name: data.name };
}

export async function verifyUserPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) return null;
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) return null;
  const db = await getDb();
  if (db) await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  return user;
}

// Admin functions
export async function getAllUsers() {
  const db = await getDb();
  if (!db) return [];
  return db.select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt, lastSignedIn: users.lastSignedIn }).from(users).orderBy(users.createdAt);
}

export async function updateUserRole(userId: number, role: "user" | "admin") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(users).set({ role }).where(eq(users.id, userId));
  return { success: true };
}

export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return { materials: 0, products: 0, marketplaces: 0 };
  const [mats, prods, mkts] = await Promise.all([
    db.select().from(materials).where(eq(materials.userId, userId)),
    db.select().from(products).where(eq(products.userId, userId)),
    db.select().from(marketplaces).where(eq(marketplaces.userId, userId)),
  ]);
  return { materials: mats.length, products: prods.length, marketplaces: mkts.length };
}

// ============ MATERIALS (Multi-tenant) ============
export async function getMaterials(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materials).where(eq(materials.userId, userId)).orderBy(materials.sku);
}

export async function getMaterialById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(materials).where(and(eq(materials.id, id), eq(materials.userId, userId))).limit(1);
  return result[0];
}

export async function createMaterial(data: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(materials).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateMaterial(id: number, data: Partial<InsertMaterial>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(materials).set(data).where(and(eq(materials.id, id), eq(materials.userId, userId)));
  return getMaterialById(id, userId);
}

export async function deleteMaterial(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(materials).where(and(eq(materials.id, id), eq(materials.userId, userId)));
  return { success: true };
}

// ============ PRODUCTS (Multi-tenant) ============
export async function getProducts(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).where(eq(products.userId, userId)).orderBy(products.sku);
}

export async function getProductById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(and(eq(products.id, id), eq(products.userId, userId))).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateProduct(id: number, data: Partial<InsertProduct>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(and(eq(products.id, id), eq(products.userId, userId)));
  return getProductById(id, userId);
}

export async function deleteProduct(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productMaterials).where(and(eq(productMaterials.productId, id), eq(productMaterials.userId, userId)));
  await db.delete(products).where(and(eq(products.id, id), eq(products.userId, userId)));
  return { success: true };
}

// ============ PRODUCT MATERIALS / BOM (Multi-tenant) ============
export async function getProductMaterials(productId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productMaterials).where(and(eq(productMaterials.productId, productId), eq(productMaterials.userId, userId)));
}

export async function addProductMaterial(data: InsertProductMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productMaterials).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateProductMaterial(id: number, data: Partial<InsertProductMaterial>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productMaterials).set(data).where(and(eq(productMaterials.id, id), eq(productMaterials.userId, userId)));
}

export async function deleteProductMaterial(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productMaterials).where(and(eq(productMaterials.id, id), eq(productMaterials.userId, userId)));
  return { success: true };
}

// ============ MARKETPLACES (Multi-tenant) ============
export async function getMarketplaces(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketplaces).where(eq(marketplaces.userId, userId)).orderBy(marketplaces.name);
}

export async function getMarketplaceById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(marketplaces).where(and(eq(marketplaces.id, id), eq(marketplaces.userId, userId))).limit(1);
  return result[0];
}

export async function createMarketplace(data: InsertMarketplace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(marketplaces).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateMarketplace(id: number, data: Partial<InsertMarketplace>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(marketplaces).set(data).where(and(eq(marketplaces.id, id), eq(marketplaces.userId, userId)));
  return getMarketplaceById(id, userId);
}

export async function deleteMarketplace(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(shippingRanges).where(and(eq(shippingRanges.marketplaceId, id), eq(shippingRanges.userId, userId)));
  await db.delete(marketplaces).where(and(eq(marketplaces.id, id), eq(marketplaces.userId, userId)));
  return { success: true };
}

// ============ SHIPPING RANGES (Multi-tenant) ============
export async function getShippingRanges(marketplaceId: number, userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shippingRanges).where(and(eq(shippingRanges.marketplaceId, marketplaceId), eq(shippingRanges.userId, userId))).orderBy(shippingRanges.minWeight);
}

export async function createShippingRange(data: InsertShippingRange) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shippingRanges).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateShippingRange(id: number, data: Partial<InsertShippingRange>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(shippingRanges).set(data).where(and(eq(shippingRanges.id, id), eq(shippingRanges.userId, userId)));
}

export async function deleteShippingRange(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(shippingRanges).where(and(eq(shippingRanges.id, id), eq(shippingRanges.userId, userId)));
  return { success: true };
}

// ============ SETTINGS (Multi-tenant) ============
export async function getSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
  if (result.length === 0) {
    // Create default settings for new user
    await db.insert(settings).values({ userId, taxName: "Simples Nacional", taxPercent: "0", adsPercent: "0", opexType: "percent", opexValue: "0", minMarginTarget: "10" });
    const newResult = await db.select().from(settings).where(eq(settings.userId, userId)).limit(1);
    return newResult[0];
  }
  return result[0];
}

export async function updateSettings(data: Partial<InsertSettings>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSettings(userId);
  if (existing) {
    await db.update(settings).set(data).where(and(eq(settings.id, existing.id), eq(settings.userId, userId)));
  } else {
    await db.insert(settings).values({ ...data, userId } as InsertSettings);
  }
  return getSettings(userId);
}

// ============ CUSTOM CHARGES (Multi-tenant) ============
export async function getCustomCharges(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customCharges).where(eq(customCharges.userId, userId)).orderBy(customCharges.name);
}

export async function getCustomChargeById(id: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customCharges).where(and(eq(customCharges.id, id), eq(customCharges.userId, userId))).limit(1);
  return result[0];
}

export async function createCustomCharge(data: InsertCustomCharge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customCharges).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateCustomCharge(id: number, data: Partial<InsertCustomCharge>, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customCharges).set(data).where(and(eq(customCharges.id, id), eq(customCharges.userId, userId)));
  return getCustomChargeById(id, userId);
}

export async function deleteCustomCharge(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customCharges).where(and(eq(customCharges.id, id), eq(customCharges.userId, userId)));
  return { success: true };
}

// ============ PRICING HELPERS (Multi-tenant) ============
export async function calculateProductCost(productId: number, userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const bom = await getProductMaterials(productId, userId);
  let totalCost = 0;
  for (const item of bom) {
    const material = await getMaterialById(item.materialId, userId);
    if (material) {
      totalCost += parseFloat(material.unitCost as string) * parseFloat(item.quantity as string);
    }
  }
  return totalCost;
}

export async function getShippingCost(marketplaceId: number, weight: number, userId: number): Promise<number> {
  const ranges = await getShippingRanges(marketplaceId, userId);
  for (const range of ranges) {
    const min = parseFloat(range.minWeight as string);
    const max = parseFloat(range.maxWeight as string);
    if (weight >= min && weight <= max) {
      return parseFloat(range.cost as string);
    }
  }
  return 0;
}


// ============ ADMIN: DUPLICATE MARKETPLACES ============
export async function duplicateMarketplacesToUser(sourceUserId: number, targetUserId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get all marketplaces from source user
  const sourceMarketplaces = await db.select().from(marketplaces).where(eq(marketplaces.userId, sourceUserId));
  
  if (sourceMarketplaces.length === 0) {
    return { success: false, message: "Usuário de origem não possui marketplaces cadastrados" };
  }
  
  let duplicatedCount = 0;
  let shippingRangesCount = 0;
  
  for (const mp of sourceMarketplaces) {
    // Create new marketplace for target user
    const newMarketplace = await db.insert(marketplaces).values({
      userId: targetUserId,
      name: mp.name,
      commissionPercent: mp.commissionPercent,
      fixedFee: mp.fixedFee,
      logisticsType: mp.logisticsType,
      isActive: mp.isActive,
    });
    
    const newMarketplaceId = newMarketplace[0].insertId;
    duplicatedCount++;
    
    // Get shipping ranges from source marketplace
    const sourceRanges = await db.select().from(shippingRanges).where(eq(shippingRanges.marketplaceId, mp.id));
    
    // Duplicate shipping ranges
    for (const range of sourceRanges) {
      await db.insert(shippingRanges).values({
        userId: targetUserId,
        marketplaceId: newMarketplaceId,
        minWeight: range.minWeight,
        maxWeight: range.maxWeight,
        cost: range.cost,
      });
      shippingRangesCount++;
    }
  }
  
  return { 
    success: true, 
    message: `${duplicatedCount} marketplace(s) e ${shippingRangesCount} faixa(s) de frete duplicados com sucesso`,
    marketplacesCount: duplicatedCount,
    shippingRangesCount: shippingRangesCount
  };
}

export async function getUsersWithMarketplaces() {
  const db = await getDb();
  if (!db) return [];
  
  // Get all users with their marketplace count
  const allUsers = await db.select().from(users);
  const result = [];
  
  for (const user of allUsers) {
    const userMarketplaces = await db.select().from(marketplaces).where(eq(marketplaces.userId, user.id));
    result.push({
      ...user,
      marketplacesCount: userMarketplaces.length
    });
  }
  
  return result;
}


// ============ PLANS ============
export async function getPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plans).where(eq(plans.isActive, true)).orderBy(plans.sortOrder);
}

export async function getPlanById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans).where(eq(plans.id, id)).limit(1);
  return result[0];
}

export async function getPlanBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(plans).where(eq(plans.slug, slug)).limit(1);
  return result[0];
}

export async function getUserPlan(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user[0] || !user[0].planId) {
    // Return free plan by default
    const freePlan = await db.select().from(plans).where(eq(plans.slug, "free")).limit(1);
    return freePlan[0];
  }
  
  const plan = await db.select().from(plans).where(eq(plans.id, user[0].planId)).limit(1);
  return plan[0];
}

export async function updateUserPlan(userId: number, planId: number, expiresAt?: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(users).set({ 
    planId, 
    planExpiresAt: expiresAt || null 
  }).where(eq(users.id, userId));
  
  return getUserPlan(userId);
}

export async function checkPlanLimits(userId: number) {
  const db = await getDb();
  if (!db) return { canCreate: false, reason: "Database not available" };
  
  const plan = await getUserPlan(userId);
  if (!plan) {
    return { 
      canCreateMaterial: true, 
      canCreateProduct: true, 
      canCreateMarketplace: true,
      materialsUsed: 0,
      productsUsed: 0,
      marketplacesUsed: 0,
      plan: null
    };
  }
  
  const userMaterials = await db.select().from(materials).where(eq(materials.userId, userId));
  const userProducts = await db.select().from(products).where(eq(products.userId, userId));
  const userMarketplaces = await db.select().from(marketplaces).where(eq(marketplaces.userId, userId));
  
  const materialsUsed = userMaterials.length;
  const productsUsed = userProducts.length;
  const marketplacesUsed = userMarketplaces.length;
  
  // -1 means unlimited
  const canCreateMaterial = plan.maxMaterials === -1 || materialsUsed < plan.maxMaterials;
  const canCreateProduct = plan.maxProducts === -1 || productsUsed < plan.maxProducts;
  const canCreateMarketplace = plan.maxMarketplaces === -1 || marketplacesUsed < plan.maxMarketplaces;
  
  return {
    canCreateMaterial,
    canCreateProduct,
    canCreateMarketplace,
    materialsUsed,
    productsUsed,
    marketplacesUsed,
    materialsLimit: plan.maxMaterials,
    productsLimit: plan.maxProducts,
    marketplacesLimit: plan.maxMarketplaces,
    plan
  };
}

// Admin: Get all plans for management
export async function getAllPlans() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(plans).orderBy(plans.sortOrder);
}

// Admin: Update plan
export async function updatePlan(id: number, data: Partial<InsertPlan>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(plans).set(data).where(eq(plans.id, id));
  return getPlanById(id);
}
