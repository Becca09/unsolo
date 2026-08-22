import { Controller, Get } from "@nestjs/common";
import { HealthCheckResponseSchema, type HealthCheckResponse } from "@unsolo/validation";

@Controller("health")
export class HealthController {
  @Get()
  check(): HealthCheckResponse {
    return HealthCheckResponseSchema.parse({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  }
}
