import { applyDecorators } from '@nestjs/common';
import { 
  ApiResponse, 
  ApiBadRequestResponse, 
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse 
} from '@nestjs/swagger';

export function ApiCommonResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request - Invalid input data',
      schema: {
        example: {
          success: false,
          message: 'Validation failed',
        },
      },
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Invalid or missing token',
      schema: {
        example: {
          success: false,
          message: 'Unauthorized access',
        },
      },
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      schema: {
        example: {
          success: false,
          message: 'Internal server error',
        },
      },
    }),
  );
}

export function ApiFindOneResponses() {
  return applyDecorators(
    ApiNotFoundResponse({
      description: 'Resource not found',
      schema: {
        example: {
          success: false,
          message: 'Resource not found',
        },
      },
    }),
    ApiCommonResponses(),
  );
}

export function ApiAdminOnlyResponses() {
  return applyDecorators(
    ApiForbiddenResponse({
      description: 'Forbidden - Admin role required',
      schema: {
        example: {
          success: false,
          message: 'Admin role required',
        },
      },
    }),
    ApiCommonResponses(),
  );
}