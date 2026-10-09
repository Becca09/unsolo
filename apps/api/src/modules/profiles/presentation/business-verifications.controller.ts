import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import {
  SubmitBusinessVerificationSchema,
  type SubmitBusinessVerificationInput,
} from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { BusinessVerificationsService } from "../application/business-verifications.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * BusinessVerificationsController — authenticated endpoints for the
 * caller's own business verification submission. Ownership is resolved
 * from the verified Supabase JWT; sensitive values (NIN/BVN) are masked by
 * the service and never leave the API raw.
 */
@Controller("profiles/:profileId/verification")
@UseGuards(AuthGuard)
export class BusinessVerificationsController {
  constructor(private readonly verifications: BusinessVerificationsService) {}

  @Get()
  get(@Request() req: RequestWithUser, @Param("profileId", ParseUUIDPipe) profileId: string) {
    return this.verifications.get(req.user.sub, profileId);
  }

  @Post()
  submit(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Body(new ZodValidationPipe(SubmitBusinessVerificationSchema))
    body: SubmitBusinessVerificationInput,
  ) {
    return this.verifications.submit(req.user.sub, profileId, body);
  }
}
