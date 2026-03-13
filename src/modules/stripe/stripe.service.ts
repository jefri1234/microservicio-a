import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { MODE_PAYMENT, PAYMENT_METHODS, VERSION_STRIPE, TYPE_EVENTS_STRIPE } from "src/common/constants/stripe.constants"
import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Payment } from '../payments/payments.model';
import { Subscription } from "src/modules/subcription/subcription.model";
import { User } from '../users/user.model';
import { StripeEvent } from './stripe_events.model';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class StripeService {

  private logger: Logger = new Logger(StripeService.name);
  private stripe: Stripe;

  constructor(
    private configService: ConfigService,
    @InjectModel(Payment)
    private paymentRepository: typeof Payment,
    @InjectModel(Subscription)
    private subscriptionRepository: typeof Subscription,
    @InjectModel(User)
    private userRepository: typeof User,
    @InjectModel(StripeEvent)
    private stripeEventRepository: typeof StripeEvent,
    private readonly sequelize: Sequelize,


  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY'),
      {
        apiVersion: VERSION_STRIPE
      }
    );
  }

  async createCheckoutSession(params: {
    priceId: string;
    userId: string;
    stripe_id: string;
    email: string;
    name: string;

  }): Promise<{ session: Stripe.Checkout.Session, stripeCustomerId: string }> {
    try {
      let customerId = params.stripe_id;
      if (!customerId) {
        const customer = await this.stripe.customers.create({
          email: params.email,
          address: {
            line1: "Calle Falsa 123",
            city: "Ciudad",
            state: "Estado",
            postal_code: "12345",
            country: "US"
          },
          business_name: "Consultinggroup",
          name: params.name,
          metadata: {
            user_id: params.userId,
            country: "US",
            city: "New York"
          },
        });
        customerId = customer.id;
      }

      const session = await this.stripe.checkout.sessions.create({
        customer: customerId,
        mode: MODE_PAYMENT.SUBSCRIPTION,
        payment_method_types: PAYMENT_METHODS.CARD_ONLY,
        line_items: [{ price: params.priceId, quantity: 1, }],
        success_url: `${process.env.FRONTEND_URL}/pago-exitoso?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/pago-cancelado`,
        metadata: {
          userId: params.userId,
          // Puedes agregar lo que necesites: planId, orderId, etc.
        },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      });

      return {
        session,
        stripeCustomerId: customerId
      };

    } catch (error) {
      throw new InternalServerErrorException(
        `Error creando checkout session: ${error.message}`
      );
    }
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    try {
      // Stripe verifica que el payload no fue alterado en tránsito
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      throw new Error(`Webhook signature verification failed: ${error.message}`);
    }
  }

  // ──────────────────────────────────────────────────────────
  // RECUPERAR CHECKOUT SESSION (para verificar estado)
  // ──────────────────────────────────────────────────────────
  async retrieveCheckoutSession(sessionId: string): Promise<Stripe.Checkout.Session> {
    return this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer'], // Expande objetos relacionados
    });
  }

  // ──────────────────────────────────────────────────────────
  // CREAR REEMBOLSO
  // ──────────────────────────────────────────────────────────
  async createRefund(params: {
    paymentIntentId: string;
    amount?: number; // En centavos. Si no se pone, reembolso total
    reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  }): Promise<Stripe.Refund> {
    return this.stripe.refunds.create({
      payment_intent: params.paymentIntentId,
      amount: params.amount,
      reason: params.reason || 'requested_by_customer',
    });
  }


  async handleStripeEvent(event: Stripe.Event): Promise<void> {

    const alreadyProcessed = await this.stripeEventRepository.findOne({
      where: { event_id: event.id }
    });
    if (alreadyProcessed) {
      this.logger.warn(`Event ${event.id} already processed. Skipping.`);
      return;
    }

    switch (event.type) {

      case TYPE_EVENTS_STRIPE.CHECKOUT_SESSION_COMPLETED: {
        const session = event.data.object as Stripe.Checkout.Session;
        await this.onCheckoutCompleted(session, event);
        break;
      }

      // case 'invoice.payment_succeeded': {
      //   const invoice = event.data.object as Stripe.Invoice;
      //   // Renovación mensual exitosa — registrar el cobro
      //   await this.onInvoicePaid(invoice, event.id);
      //   break;
      // }

      // case 'invoice.payment_failed': {
      //   const invoice = event.data.object as Stripe.Invoice;
      //   // Renovación falló — avisar al usuario, marcar past_due
      //   await this.onInvoiceFailed(invoice, event.id);
      //   break;
      // }

      // case 'customer.subscription.updated': {
      //   const sub = event.data.object as Stripe.Subscription;
      //   // Cambió algo: renovó, cambió de plan, se reactivó
      //   await this.onSubscriptionUpdated(sub, event.id);
      //   break;
      // }

      // case 'customer.subscription.deleted': {
      //   const sub = event.data.object as Stripe.Subscription;
      //   // Canceló o Stripe la terminó por falta de pago
      //   await this.onSubscriptionDeleted(sub, event.id);
      //   break;
      // }

      default:
        this.logger.log(`Ignored event: ${event.type}`);
    }
  }

  private async onCheckoutCompleted(session: Stripe.Checkout.Session, event: Stripe.Event): Promise<void> {
    const userId = session.metadata?.userId;
    if (!userId) {
      this.logger.error(`No userId in metadata. Session: ${session.id}`);
      return;
    }

    // 1. Obtener detalles completos de la suscripción en Stripe
    const subscription = await this.stripe.subscriptions.retrieve(
      session.subscription as string
    );

    await this.sequelize.transaction(async (t) => {
      await this.paymentRepository.create({
        user_id: userId,
        stripe_session_id: session.id,
        stripe_payment_intent_id: session.payment_intent as string,
        stripe_subscription_id: subscription.id,
        amount: session.amount_total,
        currency: session.currency,
        status: 'completed',
        stripe_event_id: event.id,
        paid_at: new Date(),
      }, { transaction: t });

      await this.subscriptionRepository.upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_price_id: subscription.items.data[0].price.id,
        status: subscription.status,
        current_period_start: new Date(),
        current_period_end: new Date(),
      }, { transaction: t });

      await this.userRepository.update(
        { has_active_subscription: true },
        {
          where: { user_id: userId },
          transaction: t
        }
      );

      await this.stripeEventRepository.create({
        event_id: event.id,
        event_type: event.type,
        processed_at: new Date(),
      }, { transaction: t });
    });

    this.logger.log(`Subscription activated for user ${userId}`);
  }

}
