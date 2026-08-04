import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsString,
  Matches,
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
}
