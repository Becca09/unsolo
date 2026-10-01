import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { users, type User } from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

/**
 * Persistence access for the `users` table. No authorization logic lives
 * here — that belongs to the application layer.
 */
@Injectable()
export class UsersRepository {
  constructor(private readonly database: DatabaseService) {}

  async findById(id: string): Promise<User | undefined> {
    const [row] = await this.database.db.select().from(users).where(eq(users.id, id)).limit(1);
    return row;
  }

  async create(id: string): Promise<User> {
    const [row] = await this.database.db.insert(users).values({ id }).returning();
    if (!row) {
      throw new Error("Failed to create user record");
    }
    return row;
  }
}
