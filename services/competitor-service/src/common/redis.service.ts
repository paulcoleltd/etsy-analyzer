import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis

  onModuleInit() {
    this.client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
    })
  }

  async onModuleDestroy() {
    await this.client.quit()
  }

  getClient(): Redis { return this.client }

  async get(key: string) { return this.client.get(key) }
  async set(key: string, value: string, ttl?: number) {
    if (ttl) await this.client.setex(key, ttl, value)
    else await this.client.set(key, value)
  }
  async del(...keys: string[]) { await this.client.del(...keys) }
  async hgetall(key: string) { return this.client.hgetall(key) }
  async zadd(key: string, score: number, member: string) {
    await this.client.zadd(key, score, member)
  }
  async publish(channel: string, message: string) {
    await this.client.publish(channel, message)
  }
}
