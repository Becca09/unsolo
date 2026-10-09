import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Request } from "express";
import type { AuthenticatedUser } from "../../modules/auth/application/auth.service";

interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}

/**
 * AdminGuard — restricts a route to Supabase users whose JWT carries
 * `app_metadata.role === "admin"`.
 *
 * There is no admin domain model yet (admin tables are a later phase), so
 * the check relies on the Supabase `app_metadata` claim — the standard
 * Supabase mechanism for server-assigned roles, which users cannot set on
 * themselves (only the service role or the dashboard can write it).
 * Provisioning an admin today is an ops action:
 *
 *   supabase.auth.admin.updateUserById(userId, { app_metadata: { role: "admin" } })
 *
 * Run AFTER AuthGuard — it reads `req.user`, never the request body.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.appMetadata?.role !== "admin") {
      throw new ForbiddenException("Admin access required");
    }
    return true;
  }
}
