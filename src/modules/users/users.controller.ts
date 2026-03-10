import { Controller, Get, Param } from '@nestjs/common';
import { OrdersService } from '../orders/orders.service';

@Controller('users')
export class UsersController {

  constructor(private readonly ordersService: OrdersService) { }


  @Get(":userId/orders-summary")
  getOrders(@Param('userId') userId: string) {
    return this.ordersService.getOrdersServices(userId)
  }
}




