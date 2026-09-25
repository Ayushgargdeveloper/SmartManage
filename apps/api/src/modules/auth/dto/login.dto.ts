import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'priya.m@acme.example' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'workpulse-dev-pass', minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;
}
