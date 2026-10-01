import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { DatabaseModule } from "../../infra/database/database.module";
import { UsersService } from "./application/users.service";
import { UsersRepository } from "./infrastructure/users.repository";
import { UsersController } from "./presentation/users.controller";

/**
 * UsersModule — Phase B2.1 user data model.
 *
 * Manages the Unsolo user record (1:1 with the Supabase Auth identity) and
 * the user-owned username. Exposes UsersService so other modules can
 * provision/resolve the user record for the authenticated identity.
 */
@Module({
  imports: [AuthModule, DatabaseModule],
  providers: [UsersService, UsersRepository],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
