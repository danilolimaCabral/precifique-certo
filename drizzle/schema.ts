import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean } from "drizzle-orm/mysql-core";

// Subscription Plans
export const plans = mysqlTable("plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).notNull().unique(),
  description: text("description"),
  priceMonthly: decimal("priceMonthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("priceYearly", { precision: 10, scale: 2 }),
  maxMaterials: int("maxMaterials").notNull(),
  maxProducts: int("maxProducts").notNull(),
  maxMarketplaces: int("maxMarketplaces").notNull(),
  hasSimulator: boolean("hasSimulator").default(true).notNull(),
  hasReports: boolean("hasReports").default(false).notNull(),
  hasExport: boolean("hasExport").default(false).notNull(),
  hasPrioritySupport: boolean("hasPrioritySupport").default(false).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Plan = typeof plans.$inferSelect;
export type InsertPlan = typeof plans.$inferInsert;

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  passwordHash: varchar("passwordHash", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  planId: int("planId"),
  planExpiresAt: timestamp("planExpiresAt"),
  trialPlanId: int("trialPlanId"), // Plan being trialed
  trialStartedAt: timestamp("trialStartedAt"), // When trial started
  trialUsed: boolean("trialUsed").default(false).notNull(), // If user already used trial
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Materials (Insumos e Embalagens) - Multi-tenant
export const materials = mysqlTable("materials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  sku: varchar("sku", { length: 100 }).notNull(),
  description: text("description").notNull(),
  type: mysqlEnum("type", ["insumo", "embalagem"]).notNull(),
  unitCost: decimal("unitCost", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = typeof materials.$inferInsert;

// Products - Multi-tenant
export const products = mysqlTable("products", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  sku: varchar("sku", { length: 100 }).notNull(),
  name: text("name").notNull(),
  height: decimal("height", { precision: 10, scale: 2 }),
  width: decimal("width", { precision: 10, scale: 2 }),
  length: decimal("length", { precision: 10, scale: 2 }),
  realWeight: decimal("realWeight", { precision: 10, scale: 2 }),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = typeof products.$inferInsert;

// Product Materials (BOM) - Multi-tenant (inherits from product)
export const productMaterials = mysqlTable("productMaterials", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  productId: int("productId").notNull(),
  materialId: int("materialId").notNull(),
  quantity: decimal("quantity", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ProductMaterial = typeof productMaterials.$inferSelect;
export type InsertProductMaterial = typeof productMaterials.$inferInsert;

// Marketplaces - Multi-tenant
export const marketplaces = mysqlTable("marketplaces", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  name: varchar("name", { length: 100 }).notNull(),
  commissionPercent: decimal("commissionPercent", { precision: 5, scale: 2 }).notNull(),
  fixedFee: decimal("fixedFee", { precision: 10, scale: 2 }).default("0"),
  logisticsType: varchar("logisticsType", { length: 100 }),
  freeShipping: boolean("freeShipping").default(false),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Marketplace = typeof marketplaces.$inferSelect;
export type InsertMarketplace = typeof marketplaces.$inferInsert;

// Shipping Ranges - Multi-tenant (inherits from marketplace)
export const shippingRanges = mysqlTable("shippingRanges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  marketplaceId: int("marketplaceId").notNull(),
  minWeight: decimal("minWeight", { precision: 10, scale: 2 }).notNull(),
  maxWeight: decimal("maxWeight", { precision: 10, scale: 2 }).notNull(),
  cost: decimal("cost", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ShippingRange = typeof shippingRanges.$inferSelect;
export type InsertShippingRange = typeof shippingRanges.$inferInsert;

// Settings - Multi-tenant (each user has their own settings)
export const settings = mysqlTable("settings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  taxName: varchar("taxName", { length: 100 }).default("Simples Nacional"),
  taxPercent: decimal("taxPercent", { precision: 5, scale: 2 }).default("0"),
  adsPercent: decimal("adsPercent", { precision: 5, scale: 2 }).default("0"),
  opexType: mysqlEnum("opexType", ["percent", "fixed"]).default("percent"),
  opexValue: decimal("opexValue", { precision: 10, scale: 2 }).default("0"),
  minMarginTarget: decimal("minMarginTarget", { precision: 5, scale: 2 }).default("10"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Settings = typeof settings.$inferSelect;
export type InsertSettings = typeof settings.$inferInsert;

// Custom Charges - Multi-tenant
export const customCharges = mysqlTable("customCharges", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  name: varchar("name", { length: 100 }).notNull(),
  chargeType: mysqlEnum("chargeType", ["percent_sale", "percent_cost", "fixed"]).notNull(),
  value: decimal("value", { precision: 10, scale: 2 }).notNull(),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CustomCharge = typeof customCharges.$inferSelect;
export type InsertCustomCharge = typeof customCharges.$inferInsert;

// Pricing Records - Multi-tenant
export const pricingRecords = mysqlTable("pricingRecords", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Tenant isolation
  productId: int("productId").notNull(),
  marketplaceId: int("marketplaceId").notNull(),
  salePrice: decimal("salePrice", { precision: 10, scale: 2 }).notNull(),
  ctm: decimal("ctm", { precision: 10, scale: 2 }).notNull(),
  marginValue: decimal("marginValue", { precision: 10, scale: 2 }).notNull(),
  marginPercent: decimal("marginPercent", { precision: 5, scale: 2 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PricingRecord = typeof pricingRecords.$inferSelect;
export type InsertPricingRecord = typeof pricingRecords.$inferInsert;
