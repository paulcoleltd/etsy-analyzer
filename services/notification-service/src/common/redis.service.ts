import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis
  private subscriber!: Redis

  onModuleInit() {
    const url = process.env.REDIS_URL ?? 'redis://localhost:6379'
    this.client = new Redis(url, { maxRetriesPerRequest: 3, lazyConnect: true })
    this.subscriber = new Redis(url, { lazyConnect: true })
  }

  async onModuleDestroy() {
    await Promise.all([this.client.quit(), this.subscriber.quit()])
  }

  getClient(): Redis { return this.client }
  getSubscriber(): Redis { return this.subscriber }

  async get(key: string) { return this.client.get(key) }
  async set(key: string, value: string, ttl?: number) {
    if (ttl) return this.client.setex(key, ttl, value)
    return this.client.set(key, value)
  }
  async del(...keys: string[]) { return this.client.del(...keys) }
  async publish(channel: string, message: string) {
    return this.client.publish(channel, message)
  }
  async subscribe(channel: string, handler: (msg: string) => void) {
    await this.subscriber.subscribe(channel)
    this.subscriber.on('message', (_ch, msg) => { if (_ch === channel) handler(msg) })
  }
  async psubscribe(pattern: string, handler: (channel: string, msg: string) => void) {
    await this.subscriber.psubscribe(pattern)
    this.subscriber.on('pmessage', (_pattern, ch, msg) => handler(ch, msg))
  }
}
