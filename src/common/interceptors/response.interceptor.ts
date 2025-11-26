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

        // If data is a message string, wrap it
        if (typeof data === 'string') {
          return {
            success: true,
            statusCode,
            message: data,
            data: null,
            timestamp: new Date().toISOString(),
          };
        }

        // Default response format
        return {
          success: true,
          statusCode,
          message: this.getDefaultMessage(request.method, statusCode),
          data: data || null,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }

  private getDefaultMessage(method: string, statusCode: number): string {
    if (statusCode === 201) {
      return 'Resource created successfully';
    }
    if (statusCode === 200) {
      switch (method) {
        case 'GET':
          return 'Data retrieved successfully';
        case 'POST':
          return 'Operation completed successfully';
        case 'PUT':
        case 'PATCH':
          return 'Resource updated successfully';
        case 'DELETE':
          return 'Resource deleted successfully';
        default:
          return 'Operation completed successfully';
      }
    }
    return 'Success';
  }
}

