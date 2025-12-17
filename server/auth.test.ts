import { describe, expect, it } from "vitest";
import bcrypt from "bcryptjs";

describe("Authentication with Email/Password", () => {
  describe("Password Hashing", () => {
    it("should hash password correctly", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 10);
      
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it("should verify correct password", async () => {
      const password = "testPassword123";
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(password, hash);
      expect(isValid).toBe(true);
    });

    it("should reject incorrect password", async () => {
      const password = "testPassword123";
      const wrongPassword = "wrongPassword456";
      const hash = await bcrypt.hash(password, 10);
      
      const isValid = await bcrypt.compare(wrongPassword, hash);
      expect(isValid).toBe(false);
    });

    it("should generate different hashes for same password", async () => {
      const password = "testPassword123";
      const hash1 = await bcrypt.hash(password, 10);
      const hash2 = await bcrypt.hash(password, 10);
      
      expect(hash1).not.toBe(hash2);
      // But both should verify correctly
      expect(await bcrypt.compare(password, hash1)).toBe(true);
      expect(await bcrypt.compare(password, hash2)).toBe(true);
    });
  });

  describe("Email Validation", () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    it("should validate correct email format", () => {
      expect(emailRegex.test("user@example.com")).toBe(true);
      expect(emailRegex.test("user.name@domain.co")).toBe(true);
      expect(emailRegex.test("user+tag@example.org")).toBe(true);
    });

    it("should reject invalid email format", () => {
      expect(emailRegex.test("invalid")).toBe(false);
      expect(emailRegex.test("invalid@")).toBe(false);
      expect(emailRegex.test("@domain.com")).toBe(false);
      expect(emailRegex.test("user@.com")).toBe(false);
    });
  });

  describe("Password Strength", () => {
    function isPasswordStrong(password: string): boolean {
      return password.length >= 6;
    }

    it("should accept passwords with 6+ characters", () => {
      expect(isPasswordStrong("123456")).toBe(true);
      expect(isPasswordStrong("abcdef")).toBe(true);
      expect(isPasswordStrong("password123")).toBe(true);
    });

    it("should reject passwords with less than 6 characters", () => {
      expect(isPasswordStrong("12345")).toBe(false);
      expect(isPasswordStrong("abc")).toBe(false);
      expect(isPasswordStrong("")).toBe(false);
    });
  });

  describe("OpenID Generation for Local Users", () => {
    function generateLocalOpenId(): string {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
      let result = 'local_';
      for (let i = 0; i < 20; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    }

    it("should generate openId with local_ prefix", () => {
      const openId = generateLocalOpenId();
      expect(openId.startsWith("local_")).toBe(true);
    });

    it("should generate openId with correct length", () => {
      const openId = generateLocalOpenId();
      expect(openId.length).toBe(26); // "local_" (6) + 20 chars
    });

    it("should generate unique openIds", () => {
      const openId1 = generateLocalOpenId();
      const openId2 = generateLocalOpenId();
      expect(openId1).not.toBe(openId2);
    });
  });

  describe("User Registration Data", () => {
    interface RegisterData {
      name: string;
      email: string;
      password: string;
    }

    function validateRegisterData(data: RegisterData): { valid: boolean; errors: string[] } {
      const errors: string[] = [];
      
      if (!data.name || data.name.length < 2) {
        errors.push("Nome deve ter pelo menos 2 caracteres");
      }
      
      if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        errors.push("Email inválido");
      }
      
      if (!data.password || data.password.length < 6) {
        errors.push("Senha deve ter pelo menos 6 caracteres");
      }
      
      return { valid: errors.length === 0, errors };
    }

    it("should validate correct registration data", () => {
      const result = validateRegisterData({
        name: "João Silva",
        email: "joao@example.com",
        password: "senha123"
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject short name", () => {
      const result = validateRegisterData({
        name: "J",
        email: "joao@example.com",
        password: "senha123"
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Nome deve ter pelo menos 2 caracteres");
    });

    it("should reject invalid email", () => {
      const result = validateRegisterData({
        name: "João Silva",
        email: "invalid-email",
        password: "senha123"
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Email inválido");
    });

    it("should reject short password", () => {
      const result = validateRegisterData({
        name: "João Silva",
        email: "joao@example.com",
        password: "123"
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Senha deve ter pelo menos 6 caracteres");
    });

    it("should collect multiple errors", () => {
      const result = validateRegisterData({
        name: "",
        email: "invalid",
        password: "123"
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBe(3);
    });
  });
});
