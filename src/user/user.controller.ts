import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { ApiResponse as CustomApiResponse } from '../common/dto/response.dto';

@ApiTags('user')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('profile')
  @ApiOperation({ 
    summary: 'Get user profile',
    description: 'Get current authenticated user profile' 
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  async getProfile(@Request() req): Promise<CustomApiResponse<UserResponseDto>> {
    const user = await this.userService.findOne(req.user.id);
    return {
      success: true,
      data: user,
      message: 'User profile retrieved successfully',
    };
  }

  @Put('profile')
  @ApiOperation({ 
    summary: 'Update user profile',
    description: 'Update current authenticated user profile details' 
  })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
  })
  async updateProfile(
    @Request() req,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<CustomApiResponse<UserResponseDto>> {
    const user = await this.userService.updateProfile(req.user.id, updateProfileDto);
    return {
      success: true,
      data: user,
      message: 'Profile updated successfully',
    };
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Change password',
    description: 'Change current authenticated user password' 
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Current password is incorrect',
  })
  async changePassword(
    @Request() req,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<CustomApiResponse<null>> {
    await this.userService.changePassword(req.user.id, changePasswordDto);
    return {
      success: true,
      data: null,
      message: 'Password changed successfully',
    };
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Delete user account',
    description: 'Permanently delete current authenticated user account' 
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  async deleteAccount(@Request() req): Promise<CustomApiResponse<null>> {
    await this.userService.deleteAccount(req.user.id);
    return {
      success: true,
      data: null,
      message: 'Account deleted successfully',
    };
  }
}