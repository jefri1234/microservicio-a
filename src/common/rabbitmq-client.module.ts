import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";

@Module({
    imports: [
        ClientsModule.register([
            {
                name: "CORE_SERVICE",
                transport: Transport.RMQ,
                options: {
                    urls: [`amqp://guest:guest@localhost:5672`],
                    queue: 'order.created',
                    queueOptions: { durable: true },
                    socketOptions: {
                        reconnectTimeInSeconds: 5,
                        heartbeatIntervalInSeconds: 30,
                    },
                },
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class RabbitMQClientModule { }
