import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateOrderDto {
  @IsUUID('4', { message: 'quoteId deve ser um UUID válido' })
  quoteId!: string;

  @IsString({ message: 'passageiro deve ser uma string' })
  @IsNotEmpty({ message: 'passageiro é obrigatório' })
  passageiro!: string;

  @IsString({ message: 'idempotencyKey deve ser uma string' })
  @IsNotEmpty({ message: 'idempotencyKey é obrigatório' })
  idempotencyKey!: string;
}
