import { Injectable, BadRequestException } from '@nestjs/common'
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'
import { v4 as uuidv4 } from 'uuid'
import { getDb, etsyConnections } from '@etsy-analyzer/db'
import { eq } from 'drizzle-orm'
import { RedisService } from '../common/redis.service'

const ALGORITHM = 'aes-256-gcm'
const ETSY_AUTH_URL = 'https://www.etsy.com/oauth/connect'
const ETSY_TOKEN_URL = 'https://api.etsy.com/v3/public/oauth/token'

type EtsyTokenResponse = {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
}

@Injectable()
export class EtsyOAuthService {
  private db = getDb()
  private key = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY ?? '', 'hex')

  constructor(private redis: RedisService) {}

  getAuthUrl(userId: string): string {
    const state = uuidv4()
    const codeVerifier = randomBytes(32).toString('base64url')
    const codeChallenge = Buffer.from(
      require('crypto').createHash('sha256').update(codeVerifier).digest(),
    ).toString('base64url')

    // Store PKCE verifier and state (15 min TTL)
    void this.redis.set(`etsy:oauth:${state}`, JSON.stringify({ userId, codeVerifier }), 900)

    const params = new URLSearchParams({
      response_type: 'code',
      redirect_uri: process.env.ETSY_REDIRECT_URI ?? '',
      scope: 'transactions_r listings_r shops_r email_r',
      client_id: process.env.ETSY_API_KEY ?? '',
      state,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
    })

    return `${ETSY_AUTH_URL}?${params.toString()}`
  }

  async handleCallback(code: string, state: string): Promise<void> {
    const stored = await this.redis.get(`etsy:oauth:${state}`)
    if (!stored) throw new BadRequestException('Invalid or expired OAuth state')

    const { userId, codeVerifier } = JSON.parse(stored) as { userId: string; codeVerifier: string }
    await this.redis.del(`etsy:oauth:${state}`)

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.ETSY_API_KEY ?? '',
      redirect_uri: process.env.ETSY_REDIRECT_URI ?? '',
      code,
      code_verifier: codeVerifier,
    })

    const res = await fetch(ETSY_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new BadRequestException(`Etsy token exchange failed: ${err}`)
    }

    const tokens = (await res.json()) as EtsyTokenResponse

    // Fetch Etsy user info
    const userRes = await fetch('https://openapi.etsy.com/v3/application/users/me', {
      headers: {
        'x-api-key': process.env.ETSY_API_KEY ?? '',
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })
    const etsyUser = (await userRes.json()) as { user_id: string; primary_email?: string }

    // Fetch shop info
    const shopRes = await fetch(
      `https://openapi.etsy.com/v3/application/users/${etsyUser.user_id}/shops`,
      {
        headers: {
          'x-api-key': process.env.ETSY_API_KEY ?? '',
          Authorization: `Bearer ${tokens.access_token}`,
        },
      },
    )
    const shopData = (await shopRes.json()) as {
      results?: Array<{ shop_id: string; shop_name: string }>
    }
    const shop = shopData.results?.[0]

    const encryptedAccess = this.encryptToken(tokens.access_token)
    const encryptedRefresh = this.encryptToken(tokens.refresh_token)

    await this.db
      .insert(etsyConnections)
      .values({
        userId,
        etsyUserId: String(etsyUser.user_id),
        etsyShopId: shop?.shop_id,
        etsyShopName: shop?.shop_name,
        accessToken: encryptedAccess.encrypted,
        refreshToken: encryptedRefresh.encrypted,
        tokenIv: encryptedAccess.iv,
        tokenTag: encryptedAccess.tag,
        scopes: ['transactions_r', 'listings_r', 'shops_r', 'email_r'],
        expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
      })
      .onConflictDoUpdate({
        target: etsyConnections.userId,
        set: {
          accessToken: encryptedAccess.encrypted,
          refreshToken: encryptedRefresh.encrypted,
          tokenIv: encryptedAccess.iv,
          tokenTag: encryptedAccess.tag,
          etsyShopId: shop?.shop_id,
          etsyShopName: shop?.shop_name,
          expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
        },
      })
  }

  async disconnect(userId: string): Promise<void> {
    await this.db.delete(etsyConnections).where(eq(etsyConnections.userId, userId))
  }

  encryptToken(token: string): { encrypted: string; iv: string; tag: string } {
    const iv = randomBytes(16)
    const cipher = createCipheriv(ALGORITHM, this.key, iv)
    const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()])
    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: cipher.getAuthTag().toString('base64'),
    }
  }

  decryptToken(encrypted: string, iv: string, tag: string): string {
    const decipher = createDecipheriv(ALGORITHM, this.key, Buffer.from(iv, 'base64'))
    decipher.setAuthTag(Buffer.from(tag, 'base64'))
    return Buffer.concat([
      decipher.update(Buffer.from(encrypted, 'base64')),
      decipher.final(),
    ]).toString('utf8')
  }
}
