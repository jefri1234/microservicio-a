import { Module } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { StripeController } from './stripe.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '../users/user.model';

@Module({
  imports: [
    SequelizeModule.forFeature([User]),
  ],
  controllers: [StripeController],
  providers: [StripeService],

})
export class StripeModule { }
