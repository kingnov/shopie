import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty()
  url: string;

  @ApiProperty()
  publicId: string;

  @ApiProperty()
  originalName: string;

  @ApiProperty()
  size: number;

  @ApiProperty()
  format: string;
}