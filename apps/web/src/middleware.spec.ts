import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { middleware } from "./middleware";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

const mockGetUser = jest.fn();

(createServerClient as jest.Mock).mockImplementation(() => ({
  auth: {
    getUser: mockGetUser,
  },
}));

describe("middleware", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  beforeEach(() => {
    mockGetUser.mockReset();
    (createServerClient as jest.Mock).mockClear();
    mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  it("does not touch the Supabase session on /auth/callback", async () => {
    // Regression test for "PKCE code verifier not found in storage":
    // getUser() can trigger _removeSession() → removeAllPKCEVerifiers(),
    // which deletes the pending recovery verifier before the route
    // handler can exchange the code.
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?type=recovery&next=/reset-password&code=abc123&sb_flow_id=flow123",
    );
    const response = await middleware(request);

    expect(createServerClient).not.toHaveBeenCalled();
    expect(mockGetUser).not.toHaveBeenCalled();
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects unauthenticated users away from protected routes", async () => {
    const request = new NextRequest("http://localhost:3000/dashboard");
    const response = await middleware(request);

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.headers.get("location")).toBe("http://localhost:3000/login?next=%2Fdashboard");
  });

  it("redirects authenticated users away from /login", async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: "u1" } } });

    const request = new NextRequest("http://localhost:3000/login");
    const response = await middleware(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("passes public routes through for unauthenticated users", async () => {
    const request = new NextRequest("http://localhost:3000/forgot-password");
    const response = await middleware(request);

    expect(mockGetUser).toHaveBeenCalled();
    expect(response.headers.get("location")).toBeNull();
  });
});
