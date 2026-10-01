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
  CreatePayoutAccountSchema,
  UpdatePayoutAccountSchema,
  type CreatePayoutAccountInput,
  type UpdatePayoutAccountInput,
} from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { PayoutAccountsService } from "../application/payout-accounts.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * PayoutAccountsController — authenticated endpoints for the caller's own
 * profile payout accounts. Ownership is resolved from the verified Supabase
 * JWT (`req.user.sub`); clients can never touch another user's payout
 * information. Responses never include the external account reference.
 */
@Controller("profiles/:profileId/payout-accounts")
@UseGuards(AuthGuard)
export class PayoutAccountsController {
  constructor(private readonly payoutAccounts: PayoutAccountsService) {}

  @Get()
  list(@Request() req: RequestWithUser, @Param("profileId", ParseUUIDPipe) profileId: string) {
    return this.payoutAccounts.list(req.user.sub, profileId);
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Body(new ZodValidationPipe(CreatePayoutAccountSchema)) body: CreatePayoutAccountInput,
  ) {
    return this.payoutAccounts.create(req.user.sub, profileId, body);
  }

  @Patch(":payoutAccountId")
  update(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("payoutAccountId", ParseUUIDPipe) payoutAccountId: string,
    @Body(new ZodValidationPipe(UpdatePayoutAccountSchema)) body: UpdatePayoutAccountInput,
  ) {
    return this.payoutAccounts.update(req.user.sub, profileId, payoutAccountId, body);
  }

  @Delete(":payoutAccountId")
  @HttpCode(204)
  remove(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("payoutAccountId", ParseUUIDPipe) payoutAccountId: string,
  ) {
    return this.payoutAccounts.remove(req.user.sub, profileId, payoutAccountId);
  }
}
