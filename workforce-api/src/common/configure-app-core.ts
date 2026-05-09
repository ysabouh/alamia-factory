import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { GlobalHttpExceptionFilter } from "./filters/global-http-exception.filter";

export function configureAppHttpCore(app: INestApplication): void {
  app.setGlobalPrefix("api/v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true }
    })
  );
  app.useGlobalFilters(new GlobalHttpExceptionFilter());
}
