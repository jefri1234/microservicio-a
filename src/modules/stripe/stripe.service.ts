import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { MODE_PAYMENT, PAYMENT_METHODS, VERSION_STRIPE } from "src/common/constants/stripe.constants"

@Injectable()
export class StripeService {
  private stripe: Stripe;

  constructor(private configService: ConfigService) {
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
      console.log("datos recivisos de la sesion create", session)
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

  // ──────────────────────────────────────────────────────────
  // VERIFICAR WEBHOOK (MUY IMPORTANTE)
  // ──────────────────────────────────────────────────────────
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
}
