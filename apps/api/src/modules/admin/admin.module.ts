import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { ProfilesModule } from "../profiles/profiles.module";
import { StorageModule } from "../../infra/storage/storage.module";
import { AdminVerificationsService } from "./application/admin-verifications.service";
import { AdminVerificationsController } from "./presentation/admin-verifications.controller";

/**
 * AdminModule — admin review surface.
 *
 * Currently exposes the business verification review queue
 * (/admin/verifications). Routes are protected by AuthGuard + AdminGuard:
 * a valid Supabase JWT whose `app_metadata.role` is "admin". Admin roles
 * are provisioned manually via Supabase (app_metadata) until the admin
 * domain model lands — see common/guards/admin.guard.ts.
 */
@Module({
  imports: [AuthModule, ProfilesModule, StorageModule],
  providers: [AdminVerificationsService],
  controllers: [AdminVerificationsController],
})
export class AdminModule {}
