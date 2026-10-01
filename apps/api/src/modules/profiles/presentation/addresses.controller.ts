import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from "@nestjs/common";
import type { Request as ExpressRequest } from "express";
import {
  CreateAddressSchema,
  UpdateAddressSchema,
  type CreateAddressInput,
  type UpdateAddressInput,
} from "@unsolo/validation";
import { AuthGuard } from "../../auth/presentation/auth.guard";
import type { AuthenticatedUser } from "../../auth/application/auth.service";
import { ZodValidationPipe } from "../../../common/pipes/zod-validation.pipe";
import { AddressesService } from "../application/addresses.service";

interface RequestWithUser extends ExpressRequest {
  user: AuthenticatedUser;
}

/**
 * AddressesController — authenticated endpoints for the caller's own
 * profile addresses. Ownership is resolved from the verified Supabase JWT
 * (`req.user.sub`); clients can never touch another user's addresses.
 */
@Controller("profiles/:profileId/addresses")
@UseGuards(AuthGuard)
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  list(@Request() req: RequestWithUser, @Param("profileId", ParseUUIDPipe) profileId: string) {
    return this.addresses.list(req.user.sub, profileId);
  }

  @Post()
  create(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Body(new ZodValidationPipe(CreateAddressSchema)) body: CreateAddressInput,
  ) {
    return this.addresses.create(req.user.sub, profileId, body);
  }

  @Patch(":addressId")
  update(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("addressId", ParseUUIDPipe) addressId: string,
    @Body(new ZodValidationPipe(UpdateAddressSchema)) body: UpdateAddressInput,
  ) {
    return this.addresses.update(req.user.sub, profileId, addressId, body);
  }

  @Delete(":addressId")
  @HttpCode(204)
  remove(
    @Request() req: RequestWithUser,
    @Param("profileId", ParseUUIDPipe) profileId: string,
    @Param("addressId", ParseUUIDPipe) addressId: string,
  ) {
    return this.addresses.remove(req.user.sub, profileId, addressId);
  }
}
