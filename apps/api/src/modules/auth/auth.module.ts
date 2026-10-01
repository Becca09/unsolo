import { Module } from "@nestjs/common";
import { AuthService } from "./application/auth.service";
import { AuthGuard } from "./presentation/auth.guard";
import { AuthController } from "./presentation/auth.controller";
import { SupabaseService } from "./infrastructure/supabase.service";

/**
 * AuthModule — Phase B authentication foundation.
 *
 * Provides:
 *   - AuthService: verifies Supabase-issued JWTs
 *   - AuthGuard: protects routes with Bearer token validation
 *   - SupabaseService: backend-only service-role client
 *   - AuthController: /auth/me test endpoint
 */
@Module({
  providers: [AuthService, AuthGuard, SupabaseService],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, SupabaseService],
})
export class AuthModule {}
