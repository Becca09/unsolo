import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const corsOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    // Unset CORS_ORIGIN permits all origins in development only; in
    // production the default denies cross-origin requests.
    origin: corsOrigins?.length ? corsOrigins : process.env.NODE_ENV !== "production",
    credentials: true,
  });

  const port = process.env.PORT ? Number(process.env.PORT) : 4000;
  await app.listen(port);
  console.log(`Unsolo API listening on port ${port}`);
}

bootstrap();
