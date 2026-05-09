import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { configureAppHttpCore } from "./common/configure-app-core";
import { setupSwagger } from "./common/swagger/setup-swagger";

declare global {
  interface BigInt {

    /** BIGINT values serialize as decimal strings in JSON responses. */
    toJSON(): string;

  }

}

(BigInt.prototype as unknown as BigInt).toJSON = function toJSON(): string {

  return this.toString();

};

async function bootstrap(): Promise<void> {

  const app = await NestFactory.create(AppModule, { cors: true });

  configureAppHttpCore(app);

  setupSwagger(app);

  const port = process.env.PORT ?? 4000;

  await app.listen(port);

  console.log(`API http://localhost:${port}/api/v1/workforce/...`);

  console.log(`Swagger http://localhost:${port}/docs (spec: /docs-json)`);


}

void bootstrap();
