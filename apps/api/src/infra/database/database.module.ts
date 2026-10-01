import { Module } from "@nestjs/common";
import { DatabaseService } from "./database.service";

/**
 * DatabaseModule — provides the Drizzle client to domain modules.
 */
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
