import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { jwtVerify, createRemoteJWKSet, JWTPayload } from "jose";

export interface AuthenticatedUser {
  sub: string;
  email?: string;
  aud: string;
}

/**
 * Verifies Supabase-issued access tokens using the Supabase JWT secret.
 *
 * In a local/development environment the JWT can be verified against the
 * configured `SUPABASE_JWT_SECRET`. In production, Supabase signs tokens with
 * an asymmetric key; the verifier can be extended to fetch the project's
 * public JWKS from the Supabase `.well-known/jwks.json` endpoint.
 */
@Injectable()
export class AuthService {
  private readonly jwks: ReturnType<typeof createRemoteJWKSet> | undefined;

  constructor(private config: ConfigService) {
    const url = this.config.get<string>("SUPABASE_URL");
    if (url) {
      this.jwks = createRemoteJWKSet(new URL(`${url}/.well-known/jwks.json`));
    }
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedUser> {
    const secret = this.config.get<string>("SUPABASE_JWT_SECRET");
    const url = this.config.get<string>("SUPABASE_URL");

    let payload: JWTPayload;

    try {
      if (secret) {
        const encoder = new TextEncoder();
        const { payload: verified } = await jwtVerify(token, encoder.encode(secret), {
          algorithms: ["HS256"],
        });
        payload = verified;
      } else if (this.jwks) {
        const { payload: verified } = await jwtVerify(token, this.jwks, {
          issuer: url,
          algorithms: ["RS256"],
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
    };
  }
}
