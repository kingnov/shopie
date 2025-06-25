import { User } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

// Define the user profile type that matches what we select
type UserProfile = Pick<User, 'id' | 'email' | 'firstName' | 'lastName' | 'phone' | 'role' | 'createdAt' | 'updatedAt'>;

export interface IUsersService {
  create(): Promise<User>; // Keep for interface compatibility
  findAll(): Promise<User[]>; // Keep for interface compatibility
  findOne(id: number): Promise<UserProfile | null>;
  findByEmail(email: string): Promise<User | null>;
  update(id: number): Promise<User>; // Keep for interface compatibility
  remove(id: number): Promise<User>; // Keep for interface compatibility

  // User-specific methods
  updateProfile(id: number, updateProfileDto: UpdateProfileDto): Promise<UserProfile>;
  changePassword(id: number, changePasswordDto: ChangePasswordDto): Promise<void>;
  deleteAccount(id: number): Promise<void>;
}