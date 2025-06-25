import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthResponse, IAuthService } from './auth.interface';
import { User } from '@prisma/client';
import {
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from '@prisma/client/runtime/library';

@Injectable()
export class AuthService implements IAuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  private handlePrismaError(error: any, context: string): never {
    this.logger.error(`Database error in ${context}:`, error);

    if (error instanceof PrismaClientKnownRequestError) {
      switch (error.code) {
        case 'P2002': // Unique constraint violation
          throw new ConflictException(
            'A record with this information already exists',
          );
        case 'P2025': // Record not found
          throw new NotFoundException('Record not found');
        case 'P2024': // Connection timeout
        case 'P2028': // Transaction timeout
          throw new InternalServerErrorException(
            'Database connection timeout. Please try again.',
          );
        default:
          throw new InternalServerErrorException('Database operation failed');
      }
    }

    if (error instanceof PrismaClientUnknownRequestError) {
      throw new InternalServerErrorException(
        'Database connection error. Please try again.',
      );
    }

    // Handle connection pool timeout specifically
    if (
      error.message?.includes('connection pool') ||
      error.message?.includes('Timed out')
    ) {
      throw new InternalServerErrorException(
        'Service temporarily unavailable. Please try again.',
      );
    }

    throw new InternalServerErrorException('An unexpected error occurred');
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName, phone } = registerDto;

    try {
      // Check if user already exists
      const existingUser = await this.prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Create user
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          resetToken: true,
          resetTokenExpiry: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      });

      // Send welcome email (optional)
      try {
        await this.mailService.sendWelcomeEmail(user.email);
      } catch (error) {
        // Log email error but don't fail registration
        this.logger.warn(`Failed to send welcome email to ${email}:`, error);
      }

      return {
        user,
        accessToken,
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.handlePrismaError(error, 'register');
    }
  }

  // In your login method, update the user selection to include all fields
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { email, password } = loginDto;

    try {
      // Find user by email
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid credentials');
      }

      // Generate JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };
      const accessToken = this.jwtService.sign(payload);

      // Return user without password and with all required fields
      const { password: _, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.handlePrismaError(error, 'login');
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists or not
        return;
      }

      // Generate reset token
      const resetToken = this.jwtService.sign(
        { sub: user.id, email: user.email, type: 'password-reset' },
        { expiresIn: '1h' },
      );

      // Store reset token in database
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken,
          resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      // Send reset email
      try {
        await this.mailService.sendPasswordResetEmail(email, resetToken);
      } catch (error) {
        this.logger.error(
          `Failed to send password reset email to ${email}:`,
          error,
        );
        throw new BadRequestException('Failed to send reset email');
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.handlePrismaError(error, 'forgotPassword');
    }
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    try {
      // Verify and decode token
      const decoded = this.jwtService.verify(token);

      if (decoded.type !== 'password-reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      // Find user
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if token matches stored token and is not expired
      if (
        user.resetToken !== token ||
        !user.resetTokenExpiry ||
        user.resetTokenExpiry < new Date()
      ) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Update password and clear reset token
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      // Send confirmation email
      try {
        await this.mailService.sendPasswordChangeConfirmation(user.email);
      } catch (error) {
        this.logger.warn(
          `Failed to send password change confirmation to ${user.email}:`,
          error,
        );
      }
    } catch (error) {
      if (
        error.name === 'JsonWebTokenError' ||
        error.name === 'TokenExpiredError'
      ) {
        throw new UnauthorizedException('Invalid or expired reset token');
      }
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.handlePrismaError(error, 'resetPassword');
    }
  }

  async refreshToken(userId: number): Promise<AuthResponse> {
    try {
      // Find user by ID
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          role: true,
          resetToken: true,
          resetTokenExpiry: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Generate new JWT token
      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '7d'),
      });

      return {
        user,
        accessToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.handlePrismaError(error, 'refreshToken');
    }
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
      });

      if (user && (await bcrypt.compare(password, user.password))) {
        return user;
      }

      return null;
    } catch (error) {
      this.logger.error(`Error validating user ${email}:`, error);
      return null; // Return null instead of throwing to avoid breaking authentication flow
    }
  }

  async createAdminUser(): Promise<void> {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminEmail || !adminPassword) {
      return;
    }

    try {
      const existingAdmin = await this.prisma.user.findUnique({
        where: { email: adminEmail },
      });

      if (existingAdmin) {
        return;
      }

      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

      await this.prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      this.logger.log('Admin user created successfully');
    } catch (error) {
      this.logger.error('Failed to create admin user:', error);
      // Don't throw error here as this is typically called during app startup
    }
  }
}
