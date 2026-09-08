import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { AuthGuard } from "./auth.guard";
import { AuthenticatedUser } from "../application/auth.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * Test/health-style controller for the auth foundation.
 *
 * The `/auth/me` route is protected by the Supabase JWT guard and returns the
 * currently authenticated user's `sub` (auth id) and `email`. This proves the
 * backend can verify Supabase-issued tokens.
 */
@Controller("auth")
export class AuthController {
  @Get("me")
  @UseGuards(AuthGuard)
  me(@Request() req: RequestWithUser) {
    return {
      id: req.user.sub,
      email: req.user.email,
    };
  }
}
