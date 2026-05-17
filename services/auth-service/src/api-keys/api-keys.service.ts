import { Injectable, ForbiddenException } from '@nestjs/common'
import { createHash, randomBytes } from 'crypto'
import { getDb, apiKeys } from '@etsy-analyzer/db'
import { eq, and } from 'drizzle-orm'

@Injectable()
export class ApiKeysService {
  private db = getDb()

  async list(userId: string) {
    return this.db.query.apiKeys.findMany({
      where: and(eq(apiKeys.userId, userId), eq(apiKeys.revoked, false)),
    })
  }

  async create(userId: string, name: string): Promise<{ key: string; id: string; prefix: string }> {
    const rawKey = `ea_${randomBytes(32).toString('hex')}`
    const keyHash = createHash('sha256').update(rawKey).digest('hex')
    const keyPrefix = rawKey.slice(0, 8)

    const [created] = await this.db
      .insert(apiKeys)
      .values({ userId, name, keyHash, keyPrefix })
      .returning()

    return { key: rawKey, id: created.id, prefix: keyPrefix }
  }

  async revoke(userId: string, keyId: string): Promise<void> {
    const key = await this.db.query.apiKeys.findFirst({
      where: and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)),
    })
    if (!key) throw new ForbiddenException('API key not found')
    await this.db.update(apiKeys).set({ revoked: true }).where(eq(apiKeys.id, keyId))
  }
}
