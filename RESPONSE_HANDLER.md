# Generic Response Handler Documentation

## Overview

The application now uses a generic response handler that ensures all API responses follow a consistent format with proper HTTP status codes.

## Response Format

### Success Response (200, 201, etc.)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response (400, 401, 404, 500, etc.)

```json
{
  "success": false,
  "statusCode": 404,
  "message": ["Resource not found"],
  "error": "Not Found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/endpoint"
}
```

## Features

### 1. Response Interceptor
- Automatically wraps all successful responses in a standard format
- Adds `success`, `statusCode`, `message`, and `timestamp` fields
- Preserves original data in the `data` field

### 2. Exception Filter
- Catches all exceptions and formats them consistently
- Returns proper HTTP status codes (400, 401, 404, 500, etc.)
- Includes error details and request path
- Logs server errors (500+) for debugging

### 3. Validation Pipe
- Automatically validates request bodies
- Returns 400 Bad Request with validation errors
- Formats validation errors in the standard response format

## HTTP Status Codes

| Status Code | Meaning | When Used |
|------------|---------|-----------|
| 200 | OK | Successful GET, PUT, PATCH, DELETE |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Validation errors, invalid input |
| 401 | Unauthorized | Authentication required or failed |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate resource, conflict |
| 500 | Internal Server Error | Server errors, exceptions |

## Usage Examples

### Success Response Example

**Controller:**
```typescript
@Get(':id')
async getContractor(@Param('id') id: string) {
  return this.contractorsService.getContractorById(id);
}
```

**Response (200):**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Data retrieved successfully",
  "data": {
    "id": "uuid",
    "company_name": "ABC Parking",
    ...
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response Example

**Controller:**
```typescript
@Get(':id')
async getContractor(@Param('id') id: string) {
  const contractor = await this.contractorsService.getContractorById(id);
  if (!contractor) {
    throw new NotFoundException('Contractor not found');
  }
  return contractor;
}
```

**Response (404):**
```json
{
  "success": false,
  "statusCode": 404,
  "message": ["Contractor not found"],
  "error": "Not Found",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/contractors/123"
}
```

### Validation Error Example

**Request:**
```json
{
  "email": "invalid-email",
  "password": "123"
}
```

**Response (400):**
```json
{
  "success": false,
  "statusCode": 400,
  "message": [
    "email must be an email",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "path": "/api/auth/login"
}
```

## Custom Messages

You can return custom messages by returning an object with a `message` property:

```typescript
@Delete(':id')
async deleteContractor(@Param('id') id: string) {
  await this.contractorsService.deleteContractor(id);
  return { message: 'Contractor deleted successfully' };
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Contractor deleted successfully",
  "data": null,
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Exception Types

### Built-in NestJS Exceptions

```typescript
// 400 Bad Request
throw new BadRequestException('Invalid input');

// 401 Unauthorized
throw new UnauthorizedException('Invalid credentials');

// 403 Forbidden
throw new ForbiddenException('Access denied');

// 404 Not Found
throw new NotFoundException('Resource not found');

// 409 Conflict
throw new ConflictException('Resource already exists');

// 500 Internal Server Error
throw new InternalServerErrorException('Server error');
```

## Testing

All endpoints now return consistent responses. Test with:

```bash
# Success
curl http://localhost:3000/api/contractors

# Not Found
curl http://localhost:3000/api/contractors/invalid-id

# Validation Error
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid"}'
```

## Notes

- All responses are automatically formatted
- No need to manually wrap responses in controllers
- Error responses include stack traces in development (logged, not returned)
- Timestamps are in ISO 8601 format
- Path is included in error responses for debugging

