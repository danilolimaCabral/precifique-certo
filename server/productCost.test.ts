import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db";
import { drizzle } from "drizzle-orm/mysql2";
import { users, materials, products, productMaterials } from "../drizzle/schema";
import { eq } from "drizzle-orm";

let testDb: ReturnType<typeof drizzle>;
let testUserId: number;
let testMaterialId: number;
let testProductId: number;

beforeAll(async () => {
  testDb = drizzle(process.env.DATABASE_URL!);
  
  // Create test user
  const userResult = await testDb.insert(users).values({
    openId: `test_product_cost_${Date.now()}`,
    name: "Test User Product Cost",
    email: `test_product_cost_${Date.now()}@example.com`,
    role: "user",
  });
  testUserId = userResult[0].insertId;
  
  // Create test material
  const materialResult = await testDb.insert(materials).values({
    userId: testUserId,
    sku: "MAT001",
    description: "Test Material",
    type: "insumo",
    unitCost: "10.00",
    isActive: true,
  });
  testMaterialId = materialResult[0].insertId;
});

afterAll(async () => {
  // Cleanup
  if (testProductId) {
    await testDb.delete(productMaterials).where(eq(productMaterials.productId, testProductId));
    await testDb.delete(products).where(eq(products.id, testProductId));
  }
  if (testMaterialId) {
    await testDb.delete(materials).where(eq(materials.id, testMaterialId));
  }
  if (testUserId) {
    await testDb.delete(users).where(eq(users.id, testUserId));
  }
});

describe("Product Cost Calculation", () => {
  it("should use unitCost when available", async () => {
    // Create product with unitCost
    const productResult = await testDb.insert(products).values({
      userId: testUserId,
      sku: "PROD001",
      name: "Test Product with Direct Cost",
      unitCost: "50.00",
      isActive: true,
    });
    testProductId = productResult[0].insertId;
    
    const cost = await db.calculateProductCost(testProductId, testUserId);
    expect(cost).toBe(50);
  });
  
  it("should calculate from BOM when unitCost is not set", async () => {
    // Create product without unitCost
    const productResult = await testDb.insert(products).values({
      userId: testUserId,
      sku: "PROD002",
      name: "Test Product with BOM",
      isActive: true,
    });
    const productId = productResult[0].insertId;
    
    // Add material to BOM
    await testDb.insert(productMaterials).values({
      userId: testUserId,
      productId: productId,
      materialId: testMaterialId,
      quantity: "2",
    });
    
    const cost = await db.calculateProductCost(productId, testUserId);
    expect(cost).toBe(20); // 10 * 2
    
    // Cleanup
    await testDb.delete(productMaterials).where(eq(productMaterials.productId, productId));
    await testDb.delete(products).where(eq(products.id, productId));
  });
  
  it("should prioritize unitCost over BOM", async () => {
    // Create product with both unitCost and BOM
    const productResult = await testDb.insert(products).values({
      userId: testUserId,
      sku: "PROD003",
      name: "Test Product with Both",
      unitCost: "100.00",
      isActive: true,
    });
    const productId = productResult[0].insertId;
    
    // Add material to BOM (should be ignored)
    await testDb.insert(productMaterials).values({
      userId: testUserId,
      productId: productId,
      materialId: testMaterialId,
      quantity: "5",
    });
    
    const cost = await db.calculateProductCost(productId, testUserId);
    expect(cost).toBe(100); // Should use unitCost, not BOM (which would be 50)
    
    // Cleanup
    await testDb.delete(productMaterials).where(eq(productMaterials.productId, productId));
    await testDb.delete(products).where(eq(products.id, productId));
  });
});

describe("Mercado Livre Fixed Fee Ranges", () => {
  it("should return R$ 6 for products below R$ 79", async () => {
    const fee = await db.getMlFixedFee(50);
    expect(fee).toBe(6);
  });
  
  it("should return R$ 6 for products at exactly R$ 79", async () => {
    const fee = await db.getMlFixedFee(79);
    expect(fee).toBe(6);
  });
  
  it("should return R$ 0 for products above R$ 79", async () => {
    const fee = await db.getMlFixedFee(80);
    expect(fee).toBe(0);
  });
  
  it("should return R$ 0 for products at R$ 100", async () => {
    const fee = await db.getMlFixedFee(100);
    expect(fee).toBe(0);
  });
  
  it("should return R$ 0 for products at R$ 1000", async () => {
    const fee = await db.getMlFixedFee(1000);
    expect(fee).toBe(0);
  });
});
