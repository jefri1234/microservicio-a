import Stripe from "stripe";

export const PAYMENT_METHODS = {
    CARD_ONLY: ['card'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
    CARD_AND_LINK: ['card', 'link'] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
} as const;


export const MODE_PAYMENT = {
    PAYMENT: "payment" as Stripe.Checkout.SessionCreateParams.Mode,
    SUBSCRIPTION: "subscription" as Stripe.Checkout.SessionCreateParams.Mode,
    SETUP: "setup" as Stripe.Checkout.SessionCreateParams.Mode
}

export const VERSION_STRIPE = "2025-10-29.clover" as Stripe.StripeConfig['apiVersion'];