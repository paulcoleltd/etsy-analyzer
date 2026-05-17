import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { createHash, randomBytes } from 'crypto'
import { getDb } from '@etsy-analyzer/db'
import { users, emailVerifications, passwordResets, refreshTokens } from '@etsy-analyzer/db'
import { eq, and, gt } from 'drizzle-orm'
import type { AuthTokens, JwtPayload } from '@etsy-analyzer/types'
import { RedisService } from '../common/redis.service'
import { EmailService } from './email.service'

const ACCESS_TOKEN_TTL = '15m'
const REFRESH_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const BCRYPT_ROUNDS = 12

@Injectable()
export class AuthService {
  private db = getDb()

  constructor(
    private jwtService: JwtService,
    private redis: RedisService,
    private email: EmailService,
  ) {}

  async signup(data: { email: string; password: string; name: string }): Promise<{ message: string }> {
    const existing = await this.db.query.users.findFirst({
      where: eq(users.email, data.email.toLowerCase()),
    })
    if (existing) throw new ConflictException('Email already registered')

    const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS)
    const [user] = await this.db
      .insert(users)
      .values({ email: data.email.toLowerCase(), passwordHash, name: data.name })
      .returning()

    const token = uuidv4()
    await this.db.insert(emailVerifications).values({
      userId: user.id,
      token,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    })

    await this.email.sendVerificationEmail(user.email, token)
    return { message: 'Verification email sent. Please check your inbox.' }
  }

  async signin(email: string, password: string): Promise<AuthTokens> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })
    if (!user?.passwordHash) throw new UnauthorizedException('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedException('Invalid credentials')

    return this.issueTokenPair(user.id, user.email, user.plan)
  }

  async signout(userId: string, jti: string, exp: number): Promise<void> {
    const ttl = exp - Math.floor(Date.now() / 1000)
    if (ttl > 0) {
      await this.redis.set(`jwt:blacklist:${jti}`, '1', ttl)
    }
    // Revoke all refresh tokens for this user
    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.userId, userId))
  }

  async refreshToken(rawToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashToken(rawToken)
    const stored = await this.db.query.refreshTokens.findFirst({
      where: and(
        eq(refreshTokens.tokenHash, tokenHash),
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date()),
      ),
    })
    if (!stored) throw new UnauthorizedException('Invalid or expired refresh token')

    await this.db
      .update(refreshTokens)
      .set({ revoked: true })
      .where(eq(refreshTokens.id, stored.id))

    const user = await this.db.query.users.findFirst({ where: eq(users.id, stored.userId) })
    if (!user) throw new UnauthorizedException('User not found')

    return this.issueTokenPair(user.id, user.email, user.plan)
  }

  async verifyEmail(token: string): Promise<{ message: string }> {
    const verification = await this.db.query.emailVerifications.findFirst({
      where: and(
        eq(emailVerifications.token, token),
        gt(emailVerifications.expiresAt, new Date()),
      ),
    })
    if (!verification) throw new BadRequestException('Invalid or expired verification token')

    await this.db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, verification.userId))

    await this.db.delete(emailVerifications).where(eq(emailVerifications.id, verification.id))
    return { message: 'Email verified successfully' }
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.db.query.users.findFirst({
      where: eq(users.email, email.toLowerCase()),
    })
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If that email exists, a reset link has been sent.' }

    const rawToken = randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawToken)

    await this.db.insert(passwordResets).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
    })

    await this.email.sendPasswordResetEmail(user.email, rawToken)
    return { message: 'If that email exists, a reset link has been sent.' }
  }

  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    const tokenHash = this.hashToken(token)
    const reset = await this.db.query.passwordResets.findFirst({
      where: and(
        eq(passwordResets.tokenHash, tokenHash),
        eq(passwordResets.used, false),
        gt(passwordResets.expiresAt, new Date()),
      ),
    })
    if (!reset) throw new BadRequestException('Invalid or expired reset token')

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS)
    await this.db.update(users).set({ passwordHash }).where(eq(users.id, reset.userId))
    await this.db.update(passwordResets).set({ used: true }).where(eq(passwordResets.id, reset.id))

    return { message: 'Password reset successfully' }
  }

  async getMe(userId: string) {
    const user = await this.db.query.users.findFirst({ where: eq(users.id, userId) })
    if (!user) throw new NotFoundException('User not found')
    const { passwordHash: _, ...safe } = user
    return safe
  }

  private async issueTokenPair(userId: string, email: string, plan: string): Promise<AuthTokens> {
    const jti = uuidv4()
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, email, plan: plan as JwtPayload['plan'], jti }

    const accessToken = this.jwtService.sign(payload, { expiresIn: ACCESS_TOKEN_TTL })

    const rawRefresh = randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawRefresh)
    await this.db.insert(refreshTokens).values({
      userId,
      tokenHash,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_SECONDS * 1000),
    })

    return { accessToken, refreshToken: rawRefresh, expiresIn: 900 }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }
}
