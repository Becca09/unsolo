import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import { BusinessVerificationStatusSchema } from "@unsolo/validation";
import {
  ReviewBusinessVerificationSchema,
  type ReviewBusinessVerificationInput,
} from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { AdminGuard } from "../../../common/guards/admin.guard";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { AdminVerificationsService } from "../application/admin-verifications.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * AdminVerificationsController — the business verification review queue.
 *
 * Guarded by AuthGuard + AdminGuard: callers need a valid Supabase JWT
 * carrying `app_metadata.role === "admin"`. All responses keep NIN/BVN
 * masked — reviewers see last-4 plus the uploaded documents.
 */
@Controller("admin/verifications")
@UseGuards(AuthGuard, AdminGuard)
export class AdminVerificationsController {
  constructor(private readonly verifications: AdminVerificationsService) {}

  @Get()
  list(
    @Query(
      "status",
      new DefaultValuePipe("pending"),
      new ZodValidationPipe(BusinessVerificationStatusSchema),
    )
    status: "pending" | "verified" | "rejected",
  ) {
    return this.verifications.list(status);
  }

  @Get(":id")
  get(@Param("id", ParseUUIDPipe) id: string) {
    return this.verifications.get(id);
  }

  @Patch(":id")
  review(
    @Request() req: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(ReviewBusinessVerificationSchema))
    body: ReviewBusinessVerificationInput,
  ) {
    return this.verifications.review(id, req.user.sub, body);
  }
}
