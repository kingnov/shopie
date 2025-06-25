import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { ApiResponse as CustomApiResponse, AuthResponseDto } from '../common/dto/response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { Public } from 'src/common/decorator/public.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Register new user',
    description: 'Create a new user account. Default role is CUSTOMER.' 
  })
  @ApiBody({ type: RegisterDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    type: AuthResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data or user already exists',
    schema: {
      example: {
        success: false,
        message: 'User with this email already exists',
      },
    },
  })
  async register(@Body() registerDto: RegisterDto): Promise<CustomApiResponse<AuthResponseDto>> {
    const result = await this.authService.register(registerDto);
    return {
      success: true,
      data: result,
      message: 'User registered successfully',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'User login',
    description: 'Authenticate user and return JWT token' 
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    schema: {
      example: {
        success: false,
        message: 'Invalid email or password',
      },
    },
  })
  async login(@Body() loginDto: LoginDto): Promise<CustomApiResponse<AuthResponseDto>> {
    const result = await this.authService.login(loginDto);
    return {
      success: true,
      data: result,
      message: 'Login successful',
    };
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Request password reset',
    description: 'Send password reset email to user' 
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
  })
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<CustomApiResponse<null>> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      success: true,
      data: null,
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Reset password',
    description: 'Reset user password using reset token' 
  })
  @ApiBody({ type: ResetPasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired reset token',
    schema: {
      example: {
        success: false,
        message: 'Invalid or expired reset token',
      },
    },
  })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto): Promise<CustomApiResponse<null>> {
    await this.authService.resetPassword(resetPasswordDto);
    return {
      success: true,
      data: null,
      message: 'Password reset successfully',
    };
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Generate a new access token for authenticated user'
  })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully',
    type: AuthResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid or expired token',
    schema: {
      example: {
        success: false,
        message: 'Invalid token',
      },
    },
  })
  async refreshToken(@Request() req: any): Promise<CustomApiResponse<AuthResponseDto>> {
    const result = await this.authService.refreshToken(req.user.id);
    return {
      success: true,
      data: result,
      message: 'Token refreshed successfully',
    };
  }
}