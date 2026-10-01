import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { AddInterestSchema, type AddInterestInput } from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { InterestsService } from "../application/interests.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * InterestsController — authenticated endpoints for the caller's own
 * profile interests. Ownership is resolved from the verified Supabase JWT
 * (`req.user.sub`); clients can never touch another user's interests.
 */
@Controller("profiles/:profileId/interests")
@UseGuards(AuthGuard)
export class InterestsController {
  constructor(private readonly interests: InterestsService) {}

  @Get()
  list(@Request() req: RequestWithUser, @Param("profileId", ParseUUIDPipe) profileId: string) {
    return this.interests.list(req.user.sub, profileId);
  }

  @Post()
  add(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Body(new ZodValidationPipe(AddInterestSchema)) body: AddInterestInput,
  ) {
    return this.interests.add(req.user.sub, profileId, body);
  }

  @Delete(":interestId")
  @HttpCode(204)
  remove(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("interestId", ParseUUIDPipe) interestId: string,
  ) {
    return this.interests.remove(req.user.sub, profileId, interestId);
  }
}
