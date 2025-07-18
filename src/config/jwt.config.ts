import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtConfig {
  constructor(private configService: ConfigService) {}

  get secret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get expiresAt(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN') || '7d';
  }
}
