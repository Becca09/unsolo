import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { HealthModule } from "./modules/health/health.module";

import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { ProfilesModule } from "./modules/profiles/profiles.module";
import { TravellersModule } from "./modules/travellers/travellers.module";
import { PlannersModule } from "./modules/planners/planners.module";
import { BusinessesModule } from "./modules/businesses/businesses.module";
import { HostsModule } from "./modules/hosts/hosts.module";
import { TripsModule } from "./modules/trips/trips.module";
import { BookingsModule } from "./modules/bookings/bookings.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { WalletsModule } from "./modules/wallets/wallets.module";
import { ReviewsModule } from "./modules/reviews/reviews.module";
import { MessagingModule } from "./modules/messaging/messaging.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { SearchModule } from "./modules/search/search.module";
import { AiModule } from "./modules/ai/ai.module";
import { KycModule } from "./modules/kyc/kyc.module";
import { PromotionsModule } from "./modules/promotions/promotions.module";
import { AdminModule } from "./modules/admin/admin.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    HealthModule,
    // Domain modules (Phase A: structural skeletons only — see each
    // module's *.module.ts for scope notes. No business logic yet.)
    AuthModule,
    UsersModule,
    ProfilesModule,
    TravellersModule,
    PlannersModule,
    BusinessesModule,
    HostsModule,
    TripsModule,
    BookingsModule,
    PaymentsModule,
    WalletsModule,
    ReviewsModule,
    MessagingModule,
    NotificationsModule,
    SearchModule,
    AiModule,
    KycModule,
    PromotionsModule,
    AdminModule,
  ],
})
export class AppModule {}
