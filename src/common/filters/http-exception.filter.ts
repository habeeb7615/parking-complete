import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error?: string;
  timestamp: string;
  path: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        error = responseObj.error || exception.name;
      }
    } else if (exception instanceof Error) {
      message = exception.message || 'Internal server error';
      error = exception.name;
    }

    const errorResponse: ErrorResponse = {
      success: false,
      statusCode: status,
      message: Array.isArray(message) ? message : [message],
      error: error || HttpStatus[status],
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log error for debugging (in production, use proper logger)
    if (status >= 500) {
      console.error('Error:', {
        status,
        message,
        error,
        path: request.url,
        method: request.method,
        stack: exception instanceof Error ? exception.stack : undefined,
      });
    }

    response.status(status).json(errorResponse);
  }
}

