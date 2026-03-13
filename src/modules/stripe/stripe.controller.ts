import { Controller, Get, Post, Body, Headers, Req, HttpCode, RawBodyRequest } from '@nestjs/common';
import { StripeService } from './stripe.service';
import { BadRequestException } from "@nestjs/common/exceptions";
import { CreatePaymentDto } from "./dto/create-stripe.dto";
import { UsersService } from '../users/users.service';
import Stripe from 'stripe';


@Controller('stripe')
export class StripeController {
  constructor(
    private readonly stripeService: StripeService,
    private readonly userService: UsersService
  ) { }

  @Post('subscribe')
  async subscribe(@Body() createPaymentDto: CreatePaymentDto) {
    const user = await this.userService.getUserId(createPaymentDto.userId);

    try {

      const result = await this.stripeService.createCheckoutSession(
        {
          priceId: createPaymentDto.priceId,
          userId: createPaymentDto.userId,
          stripe_id: user.stripe_customer_id,
          email: user.email,
          name: user.name
        }
      );

      if (!user.stripe_customer_id) {
        await this.userService.updateUser(createPaymentDto.userId, result.stripeCustomerId);
      }

      return { checkoutUrl: result.session.url };

    } catch (error) {
      console.error('Error al crear la sesión de checkout:', error);
      throw new BadRequestException(`Error al procesar el pago: ${error}`);
    }
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    if (!signature) throw new BadRequestException('Missing stripe-signature');

    let event: Stripe.Event;
    try {
      event = await this.stripeService.constructEvent(req.rawBody, signature);
    } catch (err) {
      throw new BadRequestException(`Webhook signature invalid: ${err.message}`);
    }

    await this.stripeService.handleStripeEvent(event);
    return { received: true };
  }

}
