import {
  WebSocketGateway, WebSocketServer, OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Logger, OnModuleInit } from '@nestjs/common'
import { Server, Socket } from 'socket.io'
import { RedisService } from '../common/redis.service'

interface AuthSocket extends Socket {
  userId?: string
}

@WebSocketGateway({ cors: { origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000', credentials: true } })
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer() server!: Server
  private readonly logger = new Logger(NotificationsGateway.name)
  private userSockets = new Map<string, Set<string>>() // userId → Set<socketId>

  constructor(private redis: RedisService) {}

  async onModuleInit() {
    // Subscribe to Redis pub/sub for all notification channels
    await this.redis.psubscribe('notifications:*', (channel, message) => {
      const userId = channel.replace('notifications:', '')
      this.pushToUser(userId, message)
    })
  }

  handleConnection(client: AuthSocket) {
    const token = client.handshake.auth?.token ?? client.handshake.query?.token
    if (!token) { client.disconnect(); return }

    const userId = this._extractUserId(token as string)
    if (!userId) { client.disconnect(); return }

    client.userId = userId
    const sockets = this.userSockets.get(userId) ?? new Set()
    sockets.add(client.id)
    this.userSockets.set(userId, sockets)
    this.logger.log(`User ${userId} connected (${client.id})`)
  }

  handleDisconnect(client: AuthSocket) {
    if (client.userId) {
      const sockets = this.userSockets.get(client.userId)
      sockets?.delete(client.id)
      if (!sockets?.size) this.userSockets.delete(client.userId)
    }
  }

  pushToUser(userId: string, data: string) {
    const socketIds = this.userSockets.get(userId)
    if (!socketIds?.size) return
    socketIds.forEach((id) => {
      this.server.to(id).emit('notification', JSON.parse(data))
    })
  }

  private _extractUserId(token: string): string | null {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
      return payload?.sub ?? null
    } catch { return null }
  }
}
