import { Injectable, Logger, BadRequestException } from '@nestjs/common'
import { getDb, users } from '@etsy-analyzer/db'
import { eq } from 'drizzle-orm'
import type { Plan } from '@etsy-analyzer/types'

// Stripe is imported lazily so the service starts without the package
// when STRIPE_SECRET_KEY is not set (local dev without billing).
type Stripe = import('stripe').default

const PLAN_PRICE_MAP: Record<string, string> = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO_MONTHLY     ?? '']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_MONTHLY  ?? '']: 'agency',
  [process.env.STRIPE_PRICE_STARTER_ANNUAL  ?? '']: 'starter',
  [process.env.STRIPE_PRICE_PRO_ANNUAL      ?? '']: 'pro',
  [process.env.STRIPE_PRICE_AGENCY_ANNUAL   ?? '']: 'agency',
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name)
  private db = getDb()
  private _stripe: Stripe | null = null

  private stripe(): Stripe {
    if (!this._stripe) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const Stripe = require('stripe')
      this._stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? '', {
        apiVersion: '2024-06-20',
      }) as Stripe
    }
    return this._stripe!
  }

  // ── Checkout ────────────────────────────────────────────────────

  async createCheckoutSession(userId: string, priceId: string): Promise<{ url: string }> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) throw new BadRequestException('User not found')

    const stripe = this.stripe()
    let customerId = user.stripeCustomerId ?? undefined

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId },
      })
      customerId = customer.id
      await this.db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, userId))
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXTAUTH_URL}/settings?billing=success`,
      cancel_url:  `${process.env.NEXTAUTH_URL}/pricing`,
      metadata: { userId },
    })

    return { url: session.url! }
  }

  async createBillingPortalSession(userId: string): Promise<{ url: string }> {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user?.stripeCustomerId) throw new BadRequestException('No Stripe customer found')

    const session = await this.stripe().billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${process.env.NEXTAUTH_URL}/settings`,
    })
    return { url: session.url }
  }

  async getSubscription(userId: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) })
    return {
      plan: user?.plan ?? 'free',
      planStatus: user?.planStatus ?? 'active',
      planExpiresAt: user?.planExpiresAt?.toISOString() ?? null,
    }
  }

  // ── Webhook event handling ───────────────────────────────────────

  async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
    const stripe = this.stripe()
    let event: import('stripe').Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ?? '',
      )
    } catch (err) {
      this.logger.warn(`Webhook signature verification failed: ${String(err)}`)
      throw new BadRequestException('Invalid webhook signature')
    }

    this.logger.log(`Stripe webhook: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed':
        await this._onCheckoutComplete(event.data.object as import('stripe').Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await this._onSubscriptionUpdated(event.data.object as import('stripe').Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await this._onSubscriptionDeleted(event.data.object as import('stripe').Stripe.Subscription)
        break
      case 'invoice.payment_failed':
        await this._onPaymentFailed(event.data.object as import('stripe').Stripe.Invoice)
        break
      case 'invoice.paid':
        await this._onInvoicePaid(event.data.object as import('stripe').Stripe.Invoice)
        break
      default:
        this.logger.debug(`Unhandled event type: ${event.type}`)
    }
  }

  private async _onCheckoutComplete(session: import('stripe').Stripe.Checkout.Session) {
    const userId = session.metadata?.userId
    if (!userId) return

    const subId = session.subscription as string
    const sub = await this.stripe().subscriptions.retrieve(subId)
    const priceId = sub.items.data[0]?.price.id ?? ''
    const plan = (PLAN_PRICE_MAP[priceId] ?? 'starter') as Plan

    await this.db.update(users).set({
      plan,
      planStatus: 'active',
      stripeSubId: subId,
      planExpiresAt: new Date((sub.current_period_end ?? 0) * 1000),
    }).where(eq(users.id, userId))

    this.logger.log(`User ${userId} upgraded to ${plan}`)
  }

  private async _onSubscriptionUpdated(sub: import('stripe').Stripe.Subscription) {
    const customerId = sub.customer as string
    const user = await this.db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    })
    if (!user) return

    const priceId = sub.items.data[0]?.price.id ?? ''
    const plan = (PLAN_PRICE_MAP[priceId] ?? user.plan) as Plan
    const status = sub.status === 'past_due' ? 'past_due'
      : sub.status === 'canceled' ? 'canceled' : 'active'

    await this.db.update(users).set({
      plan,
      planStatus: status,
      planExpiresAt: new Date((sub.current_period_end ?? 0) * 1000),
    }).where(eq(users.id, user.id))
  }

  private async _onSubscriptionDeleted(sub: import('stripe').Stripe.Subscription) {
    const customerId = sub.customer as string
    const user = await this.db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    })
    if (!user) return
    await this.db.update(users).set({ plan: 'free', planStatus: 'canceled' }).where(eq(users.id, user.id))
    this.logger.log(`User ${user.id} downgraded to free (subscription deleted)`)
  }

  private async _onPaymentFailed(invoice: import('stripe').Stripe.Invoice) {
    const customerId = invoice.customer as string
    const user = await this.db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    })
    if (!user) return
    await this.db.update(users).set({ planStatus: 'past_due' }).where(eq(users.id, user.id))
    this.logger.warn(`Payment failed for user ${user.id}`)
  }

  private async _onInvoicePaid(invoice: import('stripe').Stripe.Invoice) {
    const customerId = invoice.customer as string
    const user = await this.db.query.users.findFirst({
      where: eq(users.stripeCustomerId, customerId),
    })
    if (!user) return
    if (user.planStatus === 'past_due') {
      await this.db.update(users).set({ planStatus: 'active' }).where(eq(users.id, user.id))
    }
  }
}
