import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { ApiFailureResponseDto, PaginationMetaDto } from "./api-standard.dto";

export function setupSwagger(app: INestApplication): void {
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("Workforce API")
      .setDescription(
        "Industrial workforce REST surface (employees, halls, departments, shifts, roles, employment statuses).\n\n" +
          "**List payloads:** `{ data: T[], meta: PaginationMeta }`.\n" +
          "**Errors:** `{ success: false, statusCode, message, error, validationErrors? }` " +
          "(`ApiFailureResponseDto`)."
      )
      .setVersion("1.0")
      .addTag("Workforce — Halls")
      .addTag("Workforce — Departments")
      .addTag("Workforce — Job roles")
      .addTag("Workforce — Shifts")
      .addTag("Workforce — Employee statuses")
      .addTag("Workforce — Employees")
      .addServer("http://localhost:4000/api/v1", "Nest global prefix")
      .build(),
    { extraModels: [PaginationMetaDto, ApiFailureResponseDto], deepScanRoutes: true }
  );

  SwaggerModule.setup("docs", app, document, {
    swaggerOptions: { persistAuthorization: true },
    jsonDocumentUrl: "/docs-json",
    useGlobalPrefix: false
  });
}
