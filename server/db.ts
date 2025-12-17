import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, materials, products, productMaterials, marketplaces, shippingRanges, settings, customCharges, pricingRecords, Material, Product, ProductMaterial, Marketplace, ShippingRange, Settings, CustomCharge, PricingRecord, InsertMaterial, InsertProduct, InsertProductMaterial, InsertMarketplace, InsertShippingRange, InsertSettings, InsertCustomCharge, InsertPricingRecord } from "../drizzle/schema";
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
  
  // Check if email already exists
  const existingUser = await getUserByEmail(data.email);
  if (existingUser) {
    throw new Error("Email já cadastrado");
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(data.password, 10);
  
  // Generate unique openId for local users
  const openId = `local_${nanoid(20)}`;
  
  const result = await db.insert(users).values({
    openId,
    name: data.name,
    email: data.email,
    passwordHash,
    loginMethod: 'email',
    role: 'user',
    lastSignedIn: new Date(),
  });
  
  return { id: result[0].insertId, openId, email: data.email, name: data.name };
}

export async function verifyUserPassword(email: string, password: string) {
  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash) {
    return null;
  }
  
  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }
  
  // Update last signed in
  const db = await getDb();
  if (db) {
    await db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, user.id));
  }
  
  return user;
}

// Materials
export async function getMaterials() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(materials).orderBy(materials.sku);
}

export async function getMaterialById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(materials).where(eq(materials.id, id)).limit(1);
  return result[0];
}

export async function createMaterial(data: InsertMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(materials).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateMaterial(id: number, data: Partial<InsertMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(materials).set(data).where(eq(materials.id, id));
  return getMaterialById(id);
}

export async function deleteMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(materials).where(eq(materials.id, id));
  return { success: true };
}

// Products
export async function getProducts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(products).orderBy(products.sku);
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result[0];
}

export async function createProduct(data: InsertProduct) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(products).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateProduct(id: number, data: Partial<InsertProduct>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(products).set(data).where(eq(products.id, id));
  return getProductById(id);
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productMaterials).where(eq(productMaterials.productId, id));
  await db.delete(products).where(eq(products.id, id));
  return { success: true };
}

// Product Materials (BOM)
export async function getProductMaterials(productId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(productMaterials).where(eq(productMaterials.productId, productId));
}

export async function addProductMaterial(data: InsertProductMaterial) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(productMaterials).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateProductMaterial(id: number, data: Partial<InsertProductMaterial>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(productMaterials).set(data).where(eq(productMaterials.id, id));
}

export async function deleteProductMaterial(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(productMaterials).where(eq(productMaterials.id, id));
  return { success: true };
}

// Marketplaces
export async function getMarketplaces() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(marketplaces).orderBy(marketplaces.name);
}

export async function getMarketplaceById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(marketplaces).where(eq(marketplaces.id, id)).limit(1);
  return result[0];
}

export async function createMarketplace(data: InsertMarketplace) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(marketplaces).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateMarketplace(id: number, data: Partial<InsertMarketplace>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(marketplaces).set(data).where(eq(marketplaces.id, id));
  return getMarketplaceById(id);
}

export async function deleteMarketplace(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(shippingRanges).where(eq(shippingRanges.marketplaceId, id));
  await db.delete(marketplaces).where(eq(marketplaces.id, id));
  return { success: true };
}

// Shipping Ranges
export async function getShippingRanges(marketplaceId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shippingRanges).where(eq(shippingRanges.marketplaceId, marketplaceId)).orderBy(shippingRanges.minWeight);
}

export async function createShippingRange(data: InsertShippingRange) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(shippingRanges).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateShippingRange(id: number, data: Partial<InsertShippingRange>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(shippingRanges).set(data).where(eq(shippingRanges.id, id));
}

export async function deleteShippingRange(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(shippingRanges).where(eq(shippingRanges.id, id));
  return { success: true };
}

// Settings
export async function getSettings() {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(settings).limit(1);
  return result[0];
}

export async function updateSettings(data: Partial<InsertSettings>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await getSettings();
  if (existing) {
    await db.update(settings).set(data).where(eq(settings.id, existing.id));
  } else {
    await db.insert(settings).values(data as InsertSettings);
  }
  return getSettings();
}

// Custom Charges
export async function getCustomCharges() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customCharges).orderBy(customCharges.name);
}

export async function getCustomChargeById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customCharges).where(eq(customCharges.id, id)).limit(1);
  return result[0];
}

export async function createCustomCharge(data: InsertCustomCharge) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customCharges).values(data);
  return { id: result[0].insertId, ...data };
}

export async function updateCustomCharge(id: number, data: Partial<InsertCustomCharge>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(customCharges).set(data).where(eq(customCharges.id, id));
  return getCustomChargeById(id);
}

export async function deleteCustomCharge(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(customCharges).where(eq(customCharges.id, id));
  return { success: true };
}

// Pricing calculation helper
export async function calculateProductCost(productId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const bom = await getProductMaterials(productId);
  let totalCost = 0;
  for (const item of bom) {
    const material = await getMaterialById(item.materialId);
    if (material) {
      totalCost += parseFloat(material.unitCost as string) * parseFloat(item.quantity as string);
    }
  }
  return totalCost;
}

export async function getShippingCost(marketplaceId: number, weight: number): Promise<number> {
  const ranges = await getShippingRanges(marketplaceId);
  for (const range of ranges) {
    const min = parseFloat(range.minWeight as string);
    const max = parseFloat(range.maxWeight as string);
    if (weight >= min && weight <= max) {
      return parseFloat(range.cost as string);
    }
  }
  return 0;
}
