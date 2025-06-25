import { IsString, IsNumber, IsUrl, IsInt, IsOptional, IsBoolean, MinLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 14 Pro' })
  @IsString()
  @MinLength(1)
  name: string;

  @ApiProperty({ example: 'Latest Apple smartphone with advanced features' })
  @IsString()
  @MinLength(1)
  shortDescription: string;

  @ApiProperty({ example: 999.99 })
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price: number;

  @ApiProperty({ example: 'https://example.com/image.jpg' })
  @IsString()
  @IsUrl()
  imageUrl: string;

  @ApiProperty({ example: 50, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number = 0;

  @ApiProperty({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}