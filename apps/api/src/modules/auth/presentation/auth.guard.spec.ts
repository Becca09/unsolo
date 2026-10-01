import { Test, TestingModule } from "@nestjs/testing";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "../application/auth.service";

const mockAuthService = {
  verifyAccessToken: jest.fn(),
};

function createContext(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization },
      }),
    }),
  } as unknown as ExecutionContext;
}

describe("AuthGuard", () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthGuard, { provide: AuthService, useValue: mockAuthService }],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
    mockAuthService.verifyAccessToken.mockReset();
  });

  it("passes with a valid Bearer token and attaches the user", async () => {
    mockAuthService.verifyAccessToken.mockResolvedValue({
      sub: "user-123",
      email: "dev@unsolo.com",
      aud: "authenticated",
    });

    const context = createContext("Bearer valid-token");
    const result = await guard.canActivate(context);

    expect(result).toBe(true);
    expect(mockAuthService.verifyAccessToken).toHaveBeenCalledWith("valid-token");
  });

  it("rejects when the Authorization header is missing", async () => {
    const context = createContext(undefined);
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects when the header does not start with Bearer", async () => {
    const context = createContext("Basic dXNlcjpwYXNz");
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects an invalid token", async () => {
    mockAuthService.verifyAccessToken.mockRejectedValue(new UnauthorizedException("Invalid token"));
    const context = createContext("Bearer invalid-token");
    await expect(guard.canActivate(context)).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
