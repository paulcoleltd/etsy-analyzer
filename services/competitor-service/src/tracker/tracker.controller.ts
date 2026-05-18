import {
  Controller, Get, Post, Delete, Put, Param, Body,
  UseGuards, HttpCode, HttpStatus, Request,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength, IsBoolean, IsArray, IsIn } from 'class-validator'
import { TrackerService } from './tracker.service'
import { JwtAuthGuard } from '../common/jwt-auth.guard'
import type { ShopAlertConfig } from '@etsy-analyzer/types'

class AddShopDto {
  @IsString() @MinLength(1) @MaxLength(100) etsyShopId!: string
  @IsString() @MinLength(1) @MaxLength(100) shopName!: string
}

class AlertConfigDto implements ShopAlertConfig {
  @IsBoolean() newListing!: boolean
  @IsBoolean() priceChange!: boolean
  @IsBoolean() reviewMilestone!: boolean
  @IsArray() @IsIn(['in_app', 'email'], { each: true }) channels!: Array<'in_app' | 'email'>
}

@ApiTags('competitors')
@Controller('v1/competitors')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrackerController {
  constructor(private tracker: TrackerService) {}

  @Get()
  list(@Request() req: any) {
    return this.tracker.listShops(req.user.sub)
  }

  @Post()
  add(@Request() req: any, @Body() dto: AddShopDto) {
    return this.tracker.addShop(req.user.sub, dto.etsyShopId, dto.shopName, req.user.plan)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.tracker.removeShop(req.user.sub, id)
  }

  @Get(':id')
  getOne(@Request() req: any, @Param('id') id: string) {
    return this.tracker.getShop(req.user.sub, id)
  }

  @Put(':id/alerts')
  updateAlerts(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: AlertConfigDto,
  ) {
    return this.tracker.updateAlerts(req.user.sub, id, dto)
  }
}
