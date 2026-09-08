import { Test, TestingModule } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { UnauthorizedException } from "@nestjs/common";
import { SignJWT } from "jose";
import { AuthService } from "./auth.service";

describe("AuthService", () => {
  let service: AuthService;

  const mockConfig = {
    get: jest.fn().mockImplementation((key: string) => {
      if (key === "SUPABASE_JWT_SECRET") return "test-secret-32-characters-long!!!";
      if (key === "SUPABASE_URL") return "http://localhost:54321";
      return undefined;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthService, { provide: ConfigService, useValue: mockConfig }],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("verifies a valid Supabase-style access token", async () => {
    const encoder = new TextEncoder();
    const token = await new SignJWT({ sub: "user-123", email: "dev@unsolo.com" })
      .setProtectedHeader({ alg: "HS256" })
      .setAudience("authenticated")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(encoder.encode("test-secret-32-characters-long!!!"));

    const user = await service.verifyAccessToken(token);
    expect(user.sub).toBe("user-123");
    expect(user.email).toBe("dev@unsolo.com");
    expect(user.aud).toBe("authenticated");
  });

  it("rejects an expired token", async () => {
    const encoder = new TextEncoder();
    const token = await new SignJWT({ sub: "user-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("-1h")
      .sign(encoder.encode("test-secret-32-characters-long!!!"));

    await expect(service.verifyAccessToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects an invalid signature", async () => {
    const encoder = new TextEncoder();
    const token = await new SignJWT({ sub: "user-123" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(encoder.encode("wrong-secret-32-characters-long!!"));

    await expect(service.verifyAccessToken(token)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
