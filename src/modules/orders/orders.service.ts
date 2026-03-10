import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { OrderItemDto } from './dto/order-item.dto';
import { CreateOrderDto } from './dto/create-order.dto'
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class OrdersService {

  constructor(
    @Inject("CORE_SERVICE") private readonly coreClient: ClientProxy,
  ) { }

  async onModuleInit() {
    try {
      await this.coreClient.connect();
      console.log("RabbitMQ client connected");
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
    }
  }

  private orders = []
  private idempotencyMap = new Map();

  create(dto: CreateOrderDto) {
    const existing = this.idempotencyMap.get(dto.idempotencyKey)
    if (existing) {
      throw new ConflictException("ya existe este registro")
    }

    const total = dto.items.reduce((acc, item) => {
      return acc + item.quantity * item.unitPrice
    }, 0);

    const order = {
      userId: dto.userId,
      items: dto.items,
      currency: dto.currency,
      total,
      creatrAt: new Date()
    }
    this.orders.push(order)

    this.idempotencyMap.set(dto.idempotencyKey, order)
    this.publisherOrderCreated(order)
    return order
  }

  publisherOrderCreated(order: any) {

    const evento = {
      ...order,
      key_event: "event00200"
    }
    this.coreClient.emit("order", evento)
    console.log("event emitido", evento)
  }

  getOrdersServices(userId: string) {


    const existing = this.orders.some(evento => evento.userId == userId)

    if (!existing) {
      throw new NotFoundException("usuario no existe")
    }
    const userOrders = this.orders.filter(order => order.userId === userId)
    const currrency = userOrders.length ? userOrders[0].currency : "PEN";
    const totalAmount = userOrders.reduce((acc, order) => acc + order.total, 0)
    const ordersCount = userOrders.length

    const data = {
      userId,
      ordersCount,
      totalAmount,
      currrency

    }
    return data
  }

}
