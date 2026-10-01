import { Injectable } from "@nestjs/common";
import type { User } from "@unsolo/database";
import { UsersRepository } from "../infrastructure/users.repository";

/**
 * UsersService — application layer for the Unsolo user record.
 *
 * One Supabase Auth identity maps to exactly one `users` row whose primary
 * key is the Supabase `auth.users.id`. The row is provisioned lazily on the
 * first authenticated call (`ensureUser`).
 */
@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  /**
   * Returns the Unsolo user for the given Supabase auth id, creating the
   * record on first use. Idempotent — safe to call on every request.
   */
  async ensureUser(authUserId: string): Promise<User> {
    const existing = await this.users.findById(authUserId);
    if (existing) {
      return existing;
    }
    return this.users.create(authUserId);
  }

  async getMe(authUserId: string): Promise<User> {
    return this.ensureUser(authUserId);
  }
}
