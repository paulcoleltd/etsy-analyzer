import {
  Controller, Get, Put, Delete, Param, Query,
  UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { NotificationsService } from './notifications.service'
import { JwtAuthGuard } from '../common/jwt-auth.guard'

@ApiTags('notifications')
@Controller('v1/notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private svc: NotificationsService) {}

  @Get()
  list(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.svc.list(req.user.sub, Number(page), Number(limit))
  }

  @Put(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(@Request() req: any, @Param('id') id: string) {
    return this.svc.markRead(req.user.sub, id)
  }

  @Put('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@Request() req: any) {
    return this.svc.markAllRead(req.user.sub)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Request() req: any, @Param('id') id: string) {
    return this.svc.delete(req.user.sub, id)
  }
}
