import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import {
  CreateSocialAccountSchema,
  UpdateSocialAccountSchema,
  type CreateSocialAccountInput,
  type UpdateSocialAccountInput,
} from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { SocialAccountsService } from "../application/social-accounts.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * SocialAccountsController — authenticated endpoints for the caller's own
 * profile social accounts. Ownership is resolved from the verified Supabase
 * JWT (`req.user.sub`); clients can never touch another user's accounts.
 */
@Controller("profiles/:profileId/socials")
@UseGuards(AuthGuard)
export class SocialAccountsController {
  constructor(private readonly socialAccounts: SocialAccountsService) {}

  @Get()
  list(@Request() req: RequestWithUser, @Param("profileId", ParseUUIDPipe) profileId: string) {
    return this.socialAccounts.list(req.user.sub, profileId);
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Body(new ZodValidationPipe(CreateSocialAccountSchema)) body: CreateSocialAccountInput,
  ) {
    return this.socialAccounts.create(req.user.sub, profileId, body);
  }

  @Patch(":socialId")
  update(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("socialId", ParseUUIDPipe) socialId: string,
    @Body(new ZodValidationPipe(UpdateSocialAccountSchema)) body: UpdateSocialAccountInput,
  ) {
    return this.socialAccounts.update(req.user.sub, profileId, socialId, body);
  }

  @Delete(":socialId")
  @HttpCode(204)
  remove(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("socialId", ParseUUIDPipe) socialId: string,
  ) {
    return this.socialAccounts.remove(req.user.sub, profileId, socialId);
  }
}
