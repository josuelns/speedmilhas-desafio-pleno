import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
} from 'class-validator';

import { AIRPORTS } from '../constants';
import { DifferentAirportsConstraint } from './different-airports.validator';

const airportList = [...AIRPORTS];

export class SearchRequestDto {
  @IsString({ message: 'origin deve ser uma string' })
  @IsNotEmpty({ message: 'origin é obrigatório' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(airportList, {
    message: `aeroporto de origem inválido. Disponíveis: ${airportList.join(', ')}`,
  })
  origin!: string;

  @IsString({ message: 'destination deve ser uma string' })
  @IsNotEmpty({ message: 'destination é obrigatório' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsIn(airportList, {
    message: `aeroporto de destino inválido. Disponíveis: ${airportList.join(', ')}`,
  })
  @Validate(DifferentAirportsConstraint)
  destination!: string;

  @IsString({ message: 'date deve ser uma string' })
  @IsNotEmpty({ message: 'date é obrigatório' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date deve estar no formato YYYY-MM-DD',
  })
  date!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page deve ser um inteiro' })
  @Min(1, { message: 'page deve ser no mínimo 1' })
  @Transform(({ value }: { value: unknown }) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 ? Math.floor(parsed) : 1;
  })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'pageSize deve ser um inteiro' })
  @Min(1, { message: 'pageSize deve ser no mínimo 1' })
  @Max(50, { message: 'pageSize deve ser no máximo 50' })
  @Transform(({ value }: { value: unknown }) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 1 && parsed <= 50
      ? Math.floor(parsed)
      : 5;
  })
  pageSize?: number;
}
