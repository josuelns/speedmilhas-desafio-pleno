import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

const ORDER_STATUS_CONFIRMED = 'confirmed';

export interface OrderResponse {
  id: string;
  idempotencyKey: string;
  status: string;
  payload: {
    quoteId: string;
    passageiro: string;
  };
  createdAt: Date;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: CreateOrderDto): Promise<OrderResponse> {
    const payload = {
      quoteId: body.quoteId,
      passageiro: body.passageiro.trim(),
    };

    try {
      const order = await this.prisma.order.create({
        data: {
          idempotencyKey: body.idempotencyKey,
          status: ORDER_STATUS_CONFIRMED,
          payload,
        },
      });

      return this.toOrderResponse(order);
    } catch (error: unknown) {
      if (!this.isUniqueConstraintViolation(error)) {
        throw error;
      }

      const existingOrder = await this.prisma.order.findUnique({
        where: { idempotencyKey: body.idempotencyKey },
      });

      if (!existingOrder) {
        throw new NotFoundException(
          'Reserva idempotente não encontrada após conflito de chave',
        );
      }

      return this.toOrderResponse(existingOrder);
    }
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }

  private toOrderResponse(order: {
    id: string;
    idempotencyKey: string;
    status: string;
    payload: unknown;
    createdAt: Date;
  }): OrderResponse {
    const payload = order.payload as OrderResponse['payload'];

    return {
      id: order.id,
      idempotencyKey: order.idempotencyKey,
      status: order.status,
      payload,
      createdAt: order.createdAt,
    };
  }
}
