import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateApiKeyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  label?: string;
}
