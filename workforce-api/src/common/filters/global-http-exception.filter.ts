import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Catch, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import type { Request, Response } from "express";

/** Single JSON shape for all HTTP failures (validation, domain, infra). */
export interface ApiFailureBody {
  success: false;
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
  error: string;
  validationErrors?: string[];
}

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly log = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Internal server error";
    let errorTag = "InternalServerError";
    let validationErrors: string[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const resPayload = exception.getResponse();
      if (typeof resPayload === "string") {
        message = resPayload;
      } else if (typeof resPayload === "object" && resPayload !== null && "message" in resPayload) {
        const m = (resPayload as { message?: string | string[] }).message;
        if (Array.isArray(m)) {
          validationErrors = m.map(String);
          message = m.join("; ");
        } else if (typeof m === "string") {
          message = m;
        }
      }
      errorTag =
        typeof exception.name === "string" && exception.name.length > 0 ? exception.name : "HttpException";
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      errorTag = "PrismaClientKnownRequestError";
      ({ statusCode, message } = prismaKnownToHttp(exception));
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      statusCode = HttpStatus.BAD_REQUEST;
      errorTag = "PrismaClientValidationError";
      message = exception.message.includes("\n")
        ? exception.message.split("\n")[0]!
        : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
      errorTag = exception.name ?? "Error";
      this.log.error(exception.stack);
    } else {
      this.log.error(String(exception));
    }

    const body: ApiFailureBody = {
      success: false,
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.originalUrl ?? request.url ?? "",
      message,
      error: errorTag
    };

    if (validationErrors?.length) body.validationErrors = validationErrors;

    response.status(statusCode).json(body);
  }
}

function prismaKnownToHttp(error: Prisma.PrismaClientKnownRequestError): {
  statusCode: number;
  message: string;
} {
  switch (error.code) {
    case "P2002":
      return { statusCode: HttpStatus.CONFLICT, message: "Unique constraint violated" };
    case "P2003":
      return { statusCode: HttpStatus.BAD_REQUEST, message: "Foreign key constraint failed" };
    case "P2025":
      return { statusCode: HttpStatus.NOT_FOUND, message: "Record not found" };
    default:
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Database error (${error.code ?? "unknown"})`
      };
  }
}
