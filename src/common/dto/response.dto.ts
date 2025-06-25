import { ApiProperty } from '@nestjs/swagger';

export class ApiResponse<T = any> {
  @ApiProperty({
    example: true,
    description: 'Indicates if the request was successful',
  })
  success: boolean;

  @ApiProperty({
    description: 'Response data',
    required: false,
  })
  data?: T;

  @ApiProperty({
    example: 'Operation completed successfully',
    description: 'Response message',
    required: false,
  })
  message?: string;
}

export class AuthResponseDto {
  @ApiProperty({
    example: {
      id: 1,
      email: 'user@example.com',
      role: 'CUSTOMER',
      createdAt: '2025-01-20T10:00:00.000Z',
      updatedAt: '2025-01-20T10:00:00.000Z',
    },
    description: 'User information',
  })
  user: {
    id: number;
    email: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token',
  })
  accessToken: string;
}

export class PaginatedResponse<T = any> extends ApiResponse<T[]> {
  @ApiProperty({
    example: {
      page: 1,
      limit: 10,
      total: 25,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    },
    description: 'Pagination information',
  })
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Helper class (no Swagger decorators needed)
export class ApiResponseHelper {
  static success<T>(data: T, message?: string): ApiResponse<T> {
    return {
      success: true,
      data,
      message,
    };
  }

  static error(message: string): ApiResponse {
    return {
      success: false,
      message,
    };
  }

  static paginated<T>(
    data: T[],
    pagination: PaginatedResponse<T>['pagination'],
    message?: string
  ): PaginatedResponse<T> {
    return {
      success: true,
      data,
      pagination,
      message,
    };
  }
}