import { Injectable } from "@nestjs/common";
import { and, eq } from "drizzle-orm";
import { addresses, type Address } from "@unsolo/database";
import { DatabaseService } from "../../../infra/database/database.service";

export interface CreateAddressRecord {
  profileId: string;
  country: string;
  state: string;
  city: string;
  street: string;
}

export interface UpdateAddressRecord {
  country?: string;
  state?: string;
  city?: string;
  street?: string;
}

/**
 * Persistence access for `addresses`. No authorization logic lives here —
 * that belongs to the application layer.
 */
@Injectable()
export class AddressesRepository {
  constructor(private readonly database: DatabaseService) {}

  async findByProfileId(profileId: string): Promise<Address[]> {
    return this.database.db.select().from(addresses).where(eq(addresses.profileId, profileId));
  }

  async findById(id: string): Promise<Address | undefined> {
    const [row] = await this.database.db
      .select()
      .from(addresses)
      .where(eq(addresses.id, id))
      .limit(1);
    return row;
  }

  async create(data: CreateAddressRecord): Promise<Address> {
    const [row] = await this.database.db
      .insert(addresses)
      .values({
        profileId: data.profileId,
        country: data.country,
        state: data.state,
        city: data.city,
        street: data.street,
      })
      .returning();
    if (!row) {
      throw new Error("Failed to create address");
    }
    return row;
  }

  async update(id: string, data: UpdateAddressRecord): Promise<Address | undefined> {
    const [row] = await this.database.db
      .update(addresses)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(addresses.id, id))
      .returning();
    return row;
  }

  async delete(id: string, profileId: string): Promise<boolean> {
    const rows = await this.database.db
      .delete(addresses)
      .where(and(eq(addresses.id, id), eq(addresses.profileId, profileId)))
      .returning({ id: addresses.id });
    return rows.length > 0;
  }
}
