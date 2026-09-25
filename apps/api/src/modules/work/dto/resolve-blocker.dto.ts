import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResolveBlockerDto {
  @ApiProperty({
    example: 'Access was restored and the deployment checklist has been updated.',
    minLength: 3,
    maxLength: 1000,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(1000)
  resolution!: string;
}
