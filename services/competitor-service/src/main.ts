import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import helmet from 'helmet'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.use(helmet())
  app.enableCors({ origin: process.env.NEXTAUTH_URL ?? 'http://localhost:3000', credentials: true })
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))

  const port = process.env.PORT ?? 3002
  await app.listen(port)
  console.log(`Competitor service running on port ${port}`)
}

bootstrap()
