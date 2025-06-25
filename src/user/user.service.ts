import { 
  Injectable, 
  NotFoundException, 
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { IUsersService } from './user.interface';

// Define the user profile type that matches what we select
type UserProfile = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'role' | 'createdAt' | 'updatedAt'>;

@Injectable()
export class UserService implements IUsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: number): Promise<UserProfile | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async updateProfile(id: number, updateProfileDto: UpdateProfileDto): Promise<UserProfile> {
    const { email, ...otherFields } = updateProfileDto;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If email is being updated, check if it's already taken
    if (email && email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Update user
    return this.prisma.user.update({
      where: { id },
      data: {
        email,
        ...otherFields,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void> {
    const { currentPassword, newPassword } = changePasswordDto;

    // Get user with password
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedNewPassword,
      },
    });
  }

  async deleteAccount(id: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete user (this will cascade delete related records if configured)
    await this.prisma.user.delete({
      where: { id },
    });
  }

  // Implementation for interface compatibility
  async create(): Promise<User> {
    throw new Error('Use AuthService.register() instead');
  }

  async findAll(): Promise<User[]> {
    throw new Error('Not implemented for user self-management');
  }

  async update(id: number): Promise<User> {
    throw new Error('Use updateProfile() instead');
  }

  async remove(id: number): Promise<User> {
    await this.deleteAccount(id);
    return {} as User; // Interface requirement
  }
}