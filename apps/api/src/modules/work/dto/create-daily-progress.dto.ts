import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  BlockerCategory,
  BlockerSeverity,
  ProgressStatus,
} from '../../../../prisma/generated/client';

export class CreateDailyProgressDto {
  @ApiProperty()
  @IsString()
  projectId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  taskId?: string;

  @ApiProperty({ example: '2026-07-25' })
  @IsISO8601({ strict: true })
  workDate!: string;

  @ApiProperty()
  @IsString()
  workCompleted!: string;

  @ApiProperty({ enum: ProgressStatus })
  @IsEnum(ProgressStatus)
  status!: ProgressStatus;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent!: number;

  @ApiProperty({ minimum: 0, maximum: 24 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  timeSpentHours!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tomorrowPlan?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  externalLinks?: string[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  hasBlocker?: boolean;

  @ApiPropertyOptional()
  @ValidateIf((input: CreateDailyProgressDto) => input.hasBlocker === true)
  @IsString()
  blockerDescription?: string;

  @ApiPropertyOptional({ enum: BlockerCategory, default: BlockerCategory.OTHER })
  @IsOptional()
  @IsEnum(BlockerCategory)
  blockerCategory?: BlockerCategory;

  @ApiPropertyOptional({ enum: BlockerSeverity, default: BlockerSeverity.MEDIUM })
  @IsOptional()
  @IsEnum(BlockerSeverity)
  blockerSeverity?: BlockerSeverity;
}
