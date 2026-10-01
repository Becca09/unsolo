import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createDatabaseClient, type Database } from "@unsolo/database";

/**
 * Provides the shared Drizzle database client bound to `DATABASE_URL`.
 *
 * The client uses the service-role connection server-side only; ownership and
 * authorization are enforced in the application layer, never by the client.
 */
@Injectable()
export class DatabaseService {
  readonly db: Database;

  constructor(config: ConfigService) {
    const url = config.get<string>("DATABASE_URL");
    if (!url) {
      throw new Error("DATABASE_URL must be configured");
    }
    this.db = createDatabaseClient(url);
  }
}
