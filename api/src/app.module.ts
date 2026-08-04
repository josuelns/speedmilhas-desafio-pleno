import { Module } from '@nestjs/common';

import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';

@Module({
  imports: [PrismaModule, SearchModule, OrdersModule],
})
export class AppModule {}
