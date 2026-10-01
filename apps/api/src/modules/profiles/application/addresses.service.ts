import { Injectable, NotFoundException } from "@nestjs/common";
import type { Address } from "@unsolo/database";
import type { CreateAddressInput, UpdateAddressInput } from "@unsolo/validation";
import { ProfilesRepository } from "../infrastructure/profiles.repository";
import { AddressesRepository } from "../infrastructure/addresses.repository";

/**
 * AddressesService — application layer for profile addresses.
 *
 * Ownership rules:
 *   - Addresses always attach to a profile owned by the authenticated user;
 *     ownership is resolved from the verified JWT, never from the request
 *     body.
 *   - Addresses are private data (spec: "never expose ... private
 *     addresses"). A profile or address belonging to someone else is
 *     indistinguishable from a missing one (404), so existence is never
 *     leaked across users.
 */
@Injectable()
export class AddressesService {
  constructor(
    private readonly profiles: ProfilesRepository,
    private readonly addresses: AddressesRepository,
  ) {}

  async list(authUserId: string, profileId: string): Promise<Address[]> {
    await this.requireOwnedProfile(authUserId, profileId);
    return this.addresses.findByProfileId(profileId);
  }

  async create(authUserId: string, profileId: string, input: CreateAddressInput): Promise<Address> {
    await this.requireOwnedProfile(authUserId, profileId);

    return this.addresses.create({
      profileId,
      country: input.country,
      state: input.state,
      city: input.city,
      street: input.street,
    });
  }

  async update(
    authUserId: string,
    profileId: string,
    addressId: string,
    input: UpdateAddressInput,
  ): Promise<Address> {
    await this.requireOwnedProfile(authUserId, profileId);
    await this.requireOwnedAddress(profileId, addressId);

    const updated = await this.addresses.update(addressId, input);
    if (!updated) {
      throw new NotFoundException("Address not found");
    }
    return updated;
  }

  async remove(authUserId: string, profileId: string, addressId: string): Promise<void> {
    await this.requireOwnedProfile(authUserId, profileId);

    const deleted = await this.addresses.delete(addressId, profileId);
    if (!deleted) {
      throw new NotFoundException("Address not found");
    }
  }

  private async requireOwnedProfile(authUserId: string, profileId: string) {
    const profile = await this.profiles.findById(profileId);
    if (!profile || profile.userId !== authUserId) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  private async requireOwnedAddress(profileId: string, addressId: string) {
    const address = await this.addresses.findById(addressId);
    if (!address || address.profileId !== profileId) {
      throw new NotFoundException("Address not found");
    }
    return address;
  }
}
