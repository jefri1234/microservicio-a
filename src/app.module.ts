import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrdersModule } from './modules/orders/orders.module';
import { UsersModule } from './modules/users/users.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { SequelizeModule } from "@nestjs/sequelize";
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true
    }),
    //DB
    SequelizeModule.forRootAsync({
      useFactory: async () => ({
        dialect: "postgres",
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
        autoLoadModels: true,
        synchronize: false,
        logging: false,
      }),
    }),

    //MODULES
    OrdersModule,
    UsersModule,
    StripeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
