import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { jwtVerify, createRemoteJWKSet, JWTPayload, decodeProtectedHeader } from "jose";

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  aud: string;
  /** Supabase `app_metadata` claim — set server-side only; carries `role`. */
  appMetadata: Record<string, unknown>;
}

/**
 * Verifies Supabase-issued access tokens.
 *
 * The token header's `alg` determines the verifier:
 * - `HS256` -> verify against the configured `SUPABASE_JWT_SECRET`.
 * - `RS256`, `ES256`, etc. -> verify against the Supabase Auth JWKS endpoint
 *   at `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`.
 */
@Injectable()
export class AuthService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

  private readonly issuer?: string;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>("SUPABASE_URL");
    if (url) {
      const base = url.replace(/\/$/, "");
      this.issuer = `${base}/auth/v1`;
      this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
    }
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    const header = decodeProtectedHeader(token);

    const secret = this.config.get<string>("SUPABASE_JWT_SECRET");
    let payload: JWTPayload;

    try {
      if (header.alg === "HS256") {
        if (!secret) {
          throw new UnauthorizedException("Supabase auth is not configured");
        }
        const encoder = new TextEncoder();
        const { payload: verified } = await jwtVerify(token, encoder.encode(secret), {
          algorithms: ["HS256"],
        });
        payload = verified;
      } else if (this.jwks) {
        const { payload: verified } = await jwtVerify(token, this.jwks, {
          issuer: this.issuer,
        });
        payload = verified;
      } else {
        throw new UnauthorizedException("Supabase auth is not configured");
      }
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }

    if (!payload.sub) {
      throw new UnauthorizedException("Invalid token: missing subject");
    }

    return {
      sub: payload.sub,
      email: typeof payload.email === "string" ? payload.email : undefined,
      aud: typeof payload.aud === "string" ? payload.aud : "",
      appMetadata:
        typeof payload.app_metadata === "object" && payload.app_metadata !== null
          ? (payload.app_metadata as Record<string, unknown>)
          : {},
    };
  }
}
