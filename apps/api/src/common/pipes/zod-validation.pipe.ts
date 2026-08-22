import { BadRequestException, type PipeTransform } from "@nestjs/common";
import type { ZodSchema } from "zod";

/**
 * Generic pipe that validates incoming request data against a shared Zod
 * schema from @unsolo/validation. This is infrastructure only — it does not
 * define any domain schemas itself.
 *
 * Usage (once domain schemas exist in a later phase):
 *   @Body(new ZodValidationPipe(CreateTripSchema)) body: CreateTripDto
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      throw new BadRequestException(result.error.flatten());
    }
    return result.data;
  }
}
