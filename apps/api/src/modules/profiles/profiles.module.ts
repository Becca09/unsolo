import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { UsersModule } from "../users/users.module";
import { DatabaseModule } from "../../infra/database/database.module";
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

/**
 * ProfilesModule — Phase B2.1 profile data model.
 *
 * Authenticated creation, retrieval and update of the caller's own
 * profiles (traveller, planner, business, host — at most one of each per
 * user). Ownership is enforced in ProfilesService against the verified
 * Supabase identity.
 */
@Module({
  imports: [AuthModule, UsersModule, DatabaseModule],
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
  ],
  controllers: [
    ProfilesController,
    SocialAccountsController,
    InterestsController,
    AddressesController,
    PayoutAccountsController,
  ],
})
export class ProfilesModule {}
