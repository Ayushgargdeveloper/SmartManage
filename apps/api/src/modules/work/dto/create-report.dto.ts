import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsISO8601, IsOptional, IsString } from 'class-validator';
import { ReportType } from '../../../../prisma/generated/client';

export class CreateReportDto {
  @ApiProperty({ enum: ReportType })
  @IsEnum(ReportType)
  type!: ReportType;

  @ApiProperty()
  @IsString()
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ example: '2026-07-20' })
  @IsOptional()
  @IsISO8601({ strict: true })
  periodStart?: string;

  @ApiPropertyOptional({ example: '2026-07-26' })
  @IsOptional()
  @IsISO8601({ strict: true })
  periodEnd?: string;
}
