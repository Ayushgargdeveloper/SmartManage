import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class ReportFeedbackDto {
  @ApiProperty({ maxLength: 800 })
  @IsString()
  @MaxLength(800)
  feedback!: string;
}
