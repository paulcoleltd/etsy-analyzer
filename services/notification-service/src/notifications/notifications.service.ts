import { Injectable, NotFoundException } from '@nestjs/common'
import { getDb, notifications } from '@etsy-analyzer/db'
import { eq, and, desc } from 'drizzle-orm'

@Injectable()
export class NotificationsService {
  private db = getDb()

  async list(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit
    const rows = await this.db.query.notifications.findMany({
      where: eq(notifications.userId, userId),
      orderBy: [desc(notifications.createdAt)],
      limit,
      offset,
    })
    return rows
  }

  async markRead(userId: string, notificationId: string) {
    const notif = await this.db.query.notifications.findFirst({
      where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    })
    if (!notif) throw new NotFoundException('Notification not found')

    await this.db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.id, notificationId))
  }

  async markAllRead(userId: string) {
    await this.db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId))
  }

  async delete(userId: string, notificationId: string) {
    const notif = await this.db.query.notifications.findFirst({
      where: and(eq(notifications.id, notificationId), eq(notifications.userId, userId)),
    })
    if (!notif) throw new NotFoundException('Notification not found')
    await this.db.delete(notifications).where(eq(notifications.id, notificationId))
  }
}
