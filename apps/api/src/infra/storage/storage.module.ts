import { Module } from "@nestjs/common";
import { AuthModule } from "../../modules/auth/auth.module";
import { StorageService } from "./storage.service";

/**
 * StorageModule — wraps the backend-only Supabase service client to expose
 * private-bucket operations (signed upload/download URLs) to feature
 * modules.
 */
@Module({
  imports: [AuthModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
