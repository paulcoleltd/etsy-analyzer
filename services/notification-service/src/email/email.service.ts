import { Injectable, Logger } from '@nestjs/common'

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)
  private readonly from = process.env.FROM_EMAIL ?? 'alerts@etsy-analyzer.com'
  private readonly apiKey = process.env.RESEND_API_KEY ?? ''

  async sendAlertEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.apiKey) {
      this.logger.warn(`RESEND_API_KEY not set — skipping email to ${to}`)
      return
    }
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${this.apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    })
    if (!res.ok) {
      this.logger.error(`Resend ${res.status}: ${await res.text()}`)
    }
  }

  async sendWeeklyDigest(to: string, notifications: Array<{ title: string; body: string }>): Promise<void> {
    if (!notifications.length) return
    const listItems = notifications
      .map((n) => `<li><strong>${n.title}</strong><br>${n.body}</li>`)
      .join('')
    const html = `
      <h2>Your weekly Etsy Analyzer digest</h2>
      <p>Here's what changed with your tracked shops this week:</p>
      <ul>${listItems}</ul>
      <p><a href="${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/competitors">View all alerts →</a></p>
    `
    await this.sendAlertEmail(to, 'Your weekly Etsy Analyzer digest', html)
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/verify-email?token=${token}`
    await this.sendAlertEmail(
      to,
      'Verify your email — Etsy Analyzer',
      `<p>Click to verify your email: <a href="${url}">${url}</a></p>`,
    )
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.NEXTAUTH_URL ?? 'http://localhost:3000'}/auth/reset-password?token=${token}`
    await this.sendAlertEmail(
      to,
      'Reset your password — Etsy Analyzer',
      `<p>Click to reset your password: <a href="${url}">${url}</a></p>`,
    )
  }
}
