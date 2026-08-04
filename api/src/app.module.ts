import { Module } from '@nestjs/common';

import { OrdersModule } from './orders/orders.module';
import { PrismaModule } from './prisma/prisma.module';
import { SearchModule } from './search/search.module';
import { TestModule } from './test/test.module';

@Module({
  imports: [PrismaModule, SearchModule, OrdersModule, TestModule],
})
export class AppModule {}
