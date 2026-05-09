import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import req from "supertest";
import { AppModule } from "../src/app.module";
import { configureAppHttpCore } from "../src/common/configure-app-core";
import { setupSwagger } from "../src/common/swagger/setup-swagger";

describe("Workforce HTTP (no DB bootstrap)", () => {


  let app: INestApplication;


  beforeAll(async () => {


    const fixture = await Test.createTestingModule({ imports: [AppModule] }).compile();


    app = fixture.createNestApplication();


    configureAppHttpCore(app);


    setupSwagger(app);


    await app.init();


  });


  afterAll(async () => {


    await app.close();


  });


  it("serves OpenAPI JSON with Workforce paths", async () => {


    const res = await req(app.getHttpServer()).get("/docs-json").expect(200);


    expect(res.body.openapi || res.body.swagger).toBeDefined();


    expect(Object.keys(res.body.paths).some((p) => p.includes("/workforce/employees"))).toBe(true);


  });


  it("responds with standardized validation error JSON", async () => {


    const res = await req(app.getHttpServer())


      .post("/api/v1/workforce/employees")


      .send({})


      .expect(400);


    expect(res.body.success).toBe(false);


    expect(res.body.statusCode).toBe(400);


    expect(Array.isArray(res.body.validationErrors)).toBe(true);


    expect(typeof res.body.message).toBe("string");


    expect(typeof res.body.timestamp).toBe("string");


    expect(typeof res.body.path).toBe("string");


  });


});

