import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { Request } from "express";
import { AuthService, AuthenticatedUser } from "../application/auth.service";

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * Protects NestJS routes by verifying the Supabase access token sent in the
 * `Authorization: Bearer <token>` header.
 *
 * The token is verified server-side using the Supabase JWT secret. No secret
 * keys are exposed to the browser and no client-supplied user IDs are trusted.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authHeader = request.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing or invalid authorization header");
    }

    const token = authHeader.slice("Bearer ".length).trim();
    const user = await this.auth.verifyAccessToken(token);

    request.user = user;
    return true;
  }
}
