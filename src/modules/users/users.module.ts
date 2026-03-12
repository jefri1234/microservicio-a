import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { OrdersModule } from '../orders/orders.module';
import { User } from './user.model';
import { SequelizeModule } from "@nestjs/sequelize";

@Module({
  imports: [
    OrdersModule,
    SequelizeModule.forFeature([User]),

  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService]
})
export class UsersModule { }
