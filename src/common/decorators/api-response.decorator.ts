import { applyDecorators, Type } from '@nestjs/common';
import { ApiResponse, ApiExtraModels, getSchemaPath } from '@nestjs/swagger';

export interface ApiResponseOptions<T> {
  status: number;
  description: string;
  type?: Type<T>;
  isArray?: boolean;
  example?: any;
}

export const ApiStandardResponse = <T>(options: ApiResponseOptions<T>) => {
  const { status, description, type, isArray = false, example } = options;

  const schema: any = {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        example: status >= 200 && status < 300,
      },
      statusCode: {
        type: 'number',
        example: status,
      },
      message: {
        type: 'string',
        example: description,
      },
      data: type
        ? isArray
          ? {
              type: 'array',
              items: { $ref: getSchemaPath(type) },
            }
          : { $ref: getSchemaPath(type) }
        : example
        ? { example }
        : { type: 'object', nullable: true },
      timestamp: {
        type: 'string',
        format: 'date-time',
        example: new Date().toISOString(),
      },
    },
  };

  const decorators = [ApiResponse({ status, description, schema })];

  if (type) {
    decorators.push(ApiExtraModels(type));
  }

  return applyDecorators(...decorators);
};

export const ApiErrorResponse = (status: number, description: string) => {
  return ApiResponse({
    status,
    description,
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'boolean',
          example: false,
        },
        statusCode: {
          type: 'number',
          example: status,
        },
        message: {
          type: 'string',
          example: description,
        },
        error: {
          type: 'string',
          example: status === 400 ? 'Bad Request' : status === 401 ? 'Unauthorized' : status === 404 ? 'Not Found' : 'Internal Server Error',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          example: new Date().toISOString(),
        },
        path: {
          type: 'string',
          example: '/api/endpoint',
        },
      },
    },
  });
};

