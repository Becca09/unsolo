import { forgotPassword } from "./auth";
import { createClient } from "@/lib/supabase/server";

jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(),
}));

const mockResetPasswordForEmail = jest.fn();

(createClient as jest.Mock).mockImplementation(() => ({
  auth: {
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
}));

describe("forgotPassword", () => {
  beforeAll(() => {
    process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL = "http://localhost:3000/auth/callback";
  });

  beforeEach(() => {
    mockResetPasswordForEmail.mockReset();
  });

  it("sends a recovery link through /auth/callback with type=recovery", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: null });

    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await forgotPassword(null, formData);

    expect(result).toEqual({ success: true, email: "test@example.com" });
    expect(mockResetPasswordForEmail).toHaveBeenCalledWith("test@example.com", {
      redirectTo: expect.stringContaining("/auth/callback?type=recovery&next=/reset-password"),
    });
  });

  it("normalizes and returns a Supabase error", async () => {
    mockResetPasswordForEmail.mockResolvedValue({
      error: { code: "same_password", message: "same password" },
    });

    const formData = new FormData();
    formData.set("email", "test@example.com");

    const result = await forgotPassword(null, formData);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Your new password must be different from your current password.");
    }
  });
});
