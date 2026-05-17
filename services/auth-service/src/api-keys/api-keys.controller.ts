import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  ForbiddenException,
} from '@nestjs/common'
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger'
import { IsString, MinLength, MaxLength } from 'class-validator'
import { ApiKeysService } from './api-keys.service'
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { JwtPayload } from '@etsy-analyzer/types'

class CreateApiKeyDto {
  @IsString() @MinLength(1) @MaxLength(100) name!: string
}

@ApiTags('api-keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApiKeysController {
  constructor(private apiKeys: ApiKeysService) {}

  @Get()
  list(@CurrentUser() user: JwtPayload) {
    if (user.plan !== 'agency') throw new ForbiddenException('API keys require Agency plan')
    return this.apiKeys.list(user.sub)
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateApiKeyDto) {
    if (user.plan !== 'agency') throw new ForbiddenException('API keys require Agency plan')
    return this.apiKeys.create(user.sub, dto.name)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  revoke(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.apiKeys.revoke(user.sub, id)
  }
}
