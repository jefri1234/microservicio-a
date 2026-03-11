import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BadRequestException } from "@nestjs/common/exceptions";
import { CreatePaymentDto } from "./dto/create-stripe.dto";
import { User } from '../users/user.model';
import { InjectModel } from '@nestjs/sequelize';


@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    @InjectModel(User) private userRepository: typeof User,
  ) { }

  @Post('subscribe')
  async subscribe(@Body() createPaymentDto: CreatePaymentDto) {
    const user = await this.userRepository.findByPk(createPaymentDto.userId);

    if (!createPaymentDto.priceId) {
      throw new BadRequestException('priceId es requerido');
    }

    try {

      const result = await this.stripeService.createCheckoutSession(
        {
          priceId: createPaymentDto.priceId,
          userId: createPaymentDto.userId,
          stripe_id: user.stripe_customer_id,
          email: user.email,
        }
      );

      // if (!user.stripe_customer_id) {
      //   await this.userRepository.update(
      //     {
      //       stripe_customer_id: result.stripeCustomerId
      //     },
      //     {
      //       where: {
      //         user_id: user.user_id
      //       }
      //     }
      //   );
      // }

      return { checkoutUrl: result};

    } catch (error) {
      console.error('Error al crear la sesión de checkout:', error);
      throw new BadRequestException(`Error al procesar el pago: ${error}`);
    }
  }

}
