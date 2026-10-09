import { ForbiddenException } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { AdminGuard } from "./admin.guard";

function contextWithUser(user: unknown): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe("AdminGuard", () => {
  const guard = new AdminGuard();

  it("allows users with app_metadata.role === 'admin'", () => {
    expect(guard.canActivate(contextWithUser({ sub: "u1", appMetadata: { role: "admin" } }))).toBe(
      true,
    );
  });

  it("rejects users without the admin role", () => {
    expect(() => guard.canActivate(contextWithUser({ sub: "u1", appMetadata: {} }))).toThrow(
      ForbiddenException,
    );
    expect(() =>
      guard.canActivate(contextWithUser({ sub: "u1", appMetadata: { role: "user" } })),
    ).toThrow(ForbiddenException);
  });

  it("rejects requests with no authenticated user", () => {
    expect(() => guard.canActivate(contextWithUser(undefined))).toThrow(ForbiddenException);
  });
});
