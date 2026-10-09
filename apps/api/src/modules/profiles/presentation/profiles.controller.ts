import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import {
  CreateProfileSchema,
  UpdateBusinessProfileSchema,
  UpdateProfileSchema,
  type CreateProfileInput,
  type UpdateBusinessProfileInput,
  type UpdateProfileInput,
} from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { ProfilesService } from "../application/profiles.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * ProfilesController — authenticated endpoints for the caller's own
 * profiles. The user id always comes from the verified Supabase JWT
 * (`req.user.sub`); clients can never create or modify another user's
 * profile.
 */
@Controller("profiles")
@UseGuards(AuthGuard)
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get("me")
  listMine(@Request() req: RequestWithUser) {
    return this.profilesService.listMine(req.user.sub);
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Body(new ZodValidationPipe(CreateProfileSchema)) body: CreateProfileInput,
  ) {
    return this.profilesService.create(req.user.sub, body);
  }

  @Patch(":id")
  update(
    @Request() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.profilesService.update(req.user.sub, id, body);
  }

  @Get(":id/business")
  getBusinessDetails(@Request() req: RequestWithUser, @Param("id", ParseUUIDPipe) id: string) {
    return this.profilesService.getBusinessDetails(req.user.sub, id);
  }

  @Patch(":id/business")
  updateBusinessDetails(
    @Request() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(UpdateBusinessProfileSchema)) body: UpdateBusinessProfileInput,
  ) {
    return this.profilesService.updateBusinessDetails(req.user.sub, id, body);
  }
}
