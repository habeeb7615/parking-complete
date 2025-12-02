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

        // If data is a message string, return simple response
        if (typeof data === 'string') {
          return {
            statusCode,
            message: data,
          };
        }

        // If data is an object with only message field, return simple response
        if (data && typeof data === 'object' && 'message' in data && Object.keys(data).length === 1) {
          return {
            statusCode,
            message: data.message,
          };
        }

        // Return data directly without extra wrapper fields
        return data || null;
      }),
    );
  }

}

