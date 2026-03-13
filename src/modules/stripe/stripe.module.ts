import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/user.model';
import { UsersModule } from '../users/users.module';
import { Payment } from '../payments/payments.model';
import { Subscription } from '../subcription/subcription.model';
import { StripeEvent } from './stripe_events.model';


@Module({
  imports: [
    SequelizeModule.forFeature([User, Payment, Subscription, StripeEvent]),
    UsersModule
  ],
  controllers: [StripeController],
  providers: [StripeService],

})
export class StripeModule { }
