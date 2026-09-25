import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

export class AskAiDto {
  @ApiProperty()
  @IsString()
  question!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  conversationId?: string;

  @ApiPropertyOptional({ enum: ['QUESTION', 'ACTION_PLAN'] })
  @IsOptional()
  @IsIn(['QUESTION', 'ACTION_PLAN'])
  intent?: 'QUESTION' | 'ACTION_PLAN';
}
