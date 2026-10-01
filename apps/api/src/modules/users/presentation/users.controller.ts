import { Controller, Get, Request, UseGuards } from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { UsersService } from "../application/users.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * UsersController — authenticated endpoints for the caller's own Unsolo
 * user record. The user id always comes from the verified Supabase JWT
 * (`req.user.sub`); clients can never act on another user's record.
 */
@Controller("users")
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  me(@Request() req: RequestWithUser) {
    return this.usersService.getMe(req.user.sub);
  }
}
