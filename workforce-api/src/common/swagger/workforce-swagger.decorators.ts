import { applyDecorators } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation
} from "@nestjs/swagger";
import { ApiFailureResponseDto } from "./api-standard.dto";

const envelopeHint =
  '`{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": number, "totalPages": number } }`';

export function ApiWorkforceMutationErrors(notFoundDetail?: string) {
  return applyDecorators(
    ApiBadRequestResponse({
      description: "Malformed id, unknown JSON props, validation, Prisma parsing",
      type: ApiFailureResponseDto
    }),
    ApiConflictResponse({ description: "Unique / FK violations", type: ApiFailureResponseDto }),
    ApiNotFoundResponse({
      description: notFoundDetail ?? "No row matches the path id",
      type: ApiFailureResponseDto
    })
  );

}

export function ApiWorkforcePagedList(resourcePlural: string, filterLines: string) {
  const description =
    "**Paging:** `page`, `pageSize` (≤100), `sortBy`, `sortOrder` asc|desc, `search`, `isActive`.\n\n" +
    `**${resourcePlural} filters**\n` +
    filterLines +
    `\n\n**Envelope:** ${envelopeHint}`;

  return applyDecorators(
    ApiOperation({ summary: `List ${resourcePlural}`, description }),
    ApiOkResponse({ description: envelopeHint }),

    ApiBadRequestResponse({
      description: "Invalid paging or filter serialization",
      type: ApiFailureResponseDto
    })
  );
}
