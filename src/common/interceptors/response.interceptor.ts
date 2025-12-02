import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Response<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode || 200;

    return next.handle().pipe(
      map((data) => {
        // If data already has success field, return as is (for custom responses)
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // If data is a message string, return simple response with statusCode
        if (typeof data === 'string') {
          return {
            statusCode: statusCode || 200,
            message: data,
          };
        }

        // If data is an object with only message field, return simple response with statusCode
        if (data && typeof data === 'object' && 'message' in data && Object.keys(data).length === 1) {
          return {
            statusCode: statusCode || 200,
            message: data.message,
          };
        }

        // If data is an array, wrap it with statusCode
        if (Array.isArray(data)) {
          return {
            statusCode: statusCode || 200,
            data: data,
          };
        }

        // If data is an object, check if it already has statusCode
        if (data && typeof data === 'object') {
          // If data already has statusCode, preserve it
          if ('statusCode' in data) {
            return data;
          }
          // Add statusCode to the response object
          return {
            ...data,
            statusCode: statusCode || 200,
          };
        }

        // For null or other types, return with statusCode
        if (data === null || data === undefined) {
          return {
            statusCode: statusCode || 200,
          };
        }

        return {
          statusCode: statusCode || 200,
          data: data,
        };
      }),
    );
  }

}

