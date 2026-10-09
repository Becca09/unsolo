import { Body, Controller, Get, Post, UseGuards } from "@nestjs/common";
import { ResolvePayoutAccountSchema, type ResolvePayoutAccountInput } from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { PayoutDirectoryService } from "../application/payout-directory.service";

/**
 * PayoutsController — provider bank directory and account resolution.
 * Authenticated but not profile-scoped: these are generic provider lookups
 * used before a payout account is saved. Account numbers are forwarded to
 * the provider for resolution and never logged.
 */
@Controller("payouts")
@UseGuards(AuthGuard)
export class PayoutsController {
  constructor(private readonly directory: PayoutDirectoryService) {}

  @Get("banks")
  listBanks() {
    return this.directory.listBanks();
  }

  @Post("resolve")
  resolve(
    @Body(new ZodValidationPipe(ResolvePayoutAccountSchema)) body: ResolvePayoutAccountInput,
  ) {
    return this.directory.resolve(body);
  }
}
