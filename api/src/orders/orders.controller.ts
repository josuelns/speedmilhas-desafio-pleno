import { Body, Controller, Post } from '@nestjs/common';

import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('orders')
  create(@Body() body: CreateOrderDto) {
    return this.ordersService.create(body);
  }
}
