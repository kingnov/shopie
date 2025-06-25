import { User } from '@prisma/client';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';


export interface AuthResponse {
  user: Omit<User, 'password'>;
  accessToken: string;
}

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<AuthResponse>;
  login(loginDto: LoginDto): Promise<AuthResponse>;
  forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void>;
  resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void>;
  refreshToken(userId: number): Promise<AuthResponse>;
  validateUser(email: string, password: string): Promise<User | null>;
}