import { Injectable } from '@nestjs/common'

@Injectable()
export class EmailService {
  private readonly from = process.env.FROM_EMAIL ?? 'noreply@etsy-analyzer.com'

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`
    await this.send(to, 'Verify your email', `Click to verify: ${url}`)
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const url = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`
    await this.send(to, 'Reset your password', `Click to reset: ${url}`)
  }

  async sendAlertEmail(to: string, subject: string, body: string): Promise<void> {
    await this.send(to, subject, body)
  }

  private async send(to: string, subject: string, text: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      console.warn(`[EmailService] RESEND_API_KEY not set — skipping email to ${to}: ${subject}`)
      return
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: this.from, to, subject, text }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[EmailService] Failed to send email: ${res.status} ${body}`)
    }
  }
}
