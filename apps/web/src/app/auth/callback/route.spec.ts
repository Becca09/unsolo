import { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { GET } from "./route";

jest.mock("@supabase/ssr", () => ({
  createServerClient: jest.fn(),
}));

const mockExchangeCodeForSession = jest.fn();

(createServerClient as jest.Mock).mockImplementation(() => ({
  auth: {
    exchangeCodeForSession: mockExchangeCodeForSession,
  },
}));

describe("GET /auth/callback", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  });

  beforeEach(() => {
    mockExchangeCodeForSession.mockReset();
    mockExchangeCodeForSession.mockResolvedValue({ error: null });
  });

  it("redirects to /login when the code is missing", async () => {
    const request = new NextRequest("http://localhost:3000/auth/callback");
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=oauth_missing_code",
    );
    expect(mockExchangeCodeForSession).not.toHaveBeenCalled();
  });

  it("exchanges a recovery code server-side and redirects to /reset-password", async () => {
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?type=recovery&next=/reset-password&code=abc123",
    );
    const response = await GET(request);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith("abc123");
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/reset-password");
  });

  it("rejects an external next URL and falls back to /dashboard", async () => {
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc123&next=https://evil.com",
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("rejects a protocol-relative next URL", async () => {
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=abc123&next=//evil.com",
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });

  it("redirects to /login with an error when the exchange fails", async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: { message: "invalid code" },
    });

    const request = new NextRequest("http://localhost:3000/auth/callback?code=bad");
    const response = await GET(request);

    const location = response.headers.get("location") ?? "";
    expect(location).toContain("/login");
    expect(location).toContain("error=oauth_callback_failed");
  });
});
