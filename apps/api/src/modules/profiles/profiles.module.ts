import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { DatabaseModule } from "../../infra/database/database.module";
import { StorageModule } from "../../infra/storage/storage.module";
import { ProfilesService } from "./application/profiles.service";
import { ProfilesRepository } from "./infrastructure/profiles.repository";
import { ProfilesController } from "./presentation/profiles.controller";
import { SocialAccountsService } from "./application/social-accounts.service";
import { SocialAccountsRepository } from "./infrastructure/social-accounts.repository";
import { SocialAccountsController } from "./presentation/social-accounts.controller";
import { InterestsService } from "./application/interests.service";
import { InterestsRepository } from "./infrastructure/interests.repository";
import { InterestsController } from "./presentation/interests.controller";
import { AddressesService } from "./application/addresses.service";
import { AddressesRepository } from "./infrastructure/addresses.repository";
import { AddressesController } from "./presentation/addresses.controller";
import { PayoutAccountsService } from "./application/payout-accounts.service";
import { PayoutAccountsRepository } from "./infrastructure/payout-accounts.repository";
import { PayoutAccountsController } from "./presentation/payout-accounts.controller";
import { BusinessVerificationsService } from "./application/business-verifications.service";
import { BusinessVerificationsRepository } from "./infrastructure/business-verifications.repository";
import { BusinessVerificationsController } from "./presentation/business-verifications.controller";
import { VerificationDocumentsService } from "./application/verification-documents.service";
import { VerificationDocumentsRepository } from "./infrastructure/verification-documents.repository";
import { VerificationDocumentsController } from "./presentation/verification-documents.controller";
import { PayoutDirectoryService } from "./application/payout-directory.service";
import { PayoutsController } from "./presentation/payouts.controller";
import {
  ManualPayoutProvider,
  PAYOUT_PROVIDER_RESOLVER,
  type PayoutProviderResolver,
} from "./application/payout-provider";
import { PaystackPayoutProvider } from "./infrastructure/paystack-payout.provider";

/**
 * ProfilesModule — Phase B2.1 profile data model.
 *
 * Authenticated creation, retrieval and update of the caller's own
 * profiles (traveller, planner, business, host — at most one of each per
 * user). Ownership is enforced in ProfilesService against the verified
 * Supabase identity.
 */
@Module({
  imports: [AuthModule, UsersModule, DatabaseModule, StorageModule],
  providers: [
    ProfilesService,
    ProfilesRepository,
    SocialAccountsService,
    SocialAccountsRepository,
    InterestsService,
    InterestsRepository,
    AddressesService,
    AddressesRepository,
    PayoutAccountsService,
    PayoutAccountsRepository,
    BusinessVerificationsService,
    BusinessVerificationsRepository,
    VerificationDocumentsService,
    VerificationDocumentsRepository,
    PayoutDirectoryService,
    {
      provide: PAYOUT_PROVIDER_RESOLVER,
      inject: [ConfigService],
      // Paystack resolves Nigerian bank accounts when configured; otherwise
      // the manual provider keeps account entry working without verification.
      useFactory: (config: ConfigService): PayoutProviderResolver =>
        config.get<string>("PAYSTACK_SECRET_KEY")
          ? new PaystackPayoutProvider(config)
          : new ManualPayoutProvider(),
    },
  ],
  controllers: [
    ProfilesController,
    SocialAccountsController,
    InterestsController,
    AddressesController,
    PayoutAccountsController,
    BusinessVerificationsController,
    VerificationDocumentsController,
    PayoutsController,
  ],
  exports: [ProfilesRepository, BusinessVerificationsRepository, VerificationDocumentsRepository],
})
export class ProfilesModule {}
