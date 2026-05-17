import { Test, TestingModule } from '@nestjs/testing'
import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { AuthService } from './auth.service'
import { EmailService } from './email.service'
import { RedisService } from '../common/redis.service'

const mockDb = {
  query: {
    users: { findFirst: jest.fn() },
    refreshTokens: { findFirst: jest.fn() },
    passwordResets: { findFirst: jest.fn() },
    emailVerifications: { findFirst: jest.fn() },
  },
  insert: jest.fn().mockReturnThis(),
  values: jest.fn().mockReturnThis(),
  returning: jest.fn().mockResolvedValue([{ id: 'user-1', email: 'test@test.com', plan: 'free' }]),
  update: jest.fn().mockReturnThis(),
  set: jest.fn().mockReturnThis(),
  where: jest.fn().mockResolvedValue(undefined),
  delete: jest.fn().mockReturnThis(),
}

jest.mock('@etsy-analyzer/db', () => ({
  getDb: () => mockDb,
  users: {},
  emailVerifications: {},
  passwordResets: {},
  refreshTokens: {},
}))

describe('AuthService', () => {
  let service: AuthService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('token.jwt') },
        },
        {
          provide: RedisService,
          useValue: { set: jest.fn(), get: jest.fn().mockResolvedValue(null) },
        },
        {
          provide: EmailService,
          useValue: { sendVerificationEmail: jest.fn() },
        },
      ],
    }).compile()

    service = module.get<AuthService>(AuthService)
  })

  describe('signup', () => {
    it('throws ConflictException if email already exists', async () => {
      mockDb.query.users.findFirst.mockResolvedValueOnce({ id: 'existing', email: 'test@test.com' })
      await expect(
        service.signup({ email: 'test@test.com', password: 'Password1!', name: 'Test' }),
      ).rejects.toThrow(ConflictException)
    })

    it('returns success message for new user', async () => {
      mockDb.query.users.findFirst.mockResolvedValueOnce(null)
      const result = await service.signup({ email: 'new@test.com', password: 'Password1!', name: 'New' })
      expect(result.message).toContain('Verification email sent')
    })
  })

  describe('signin', () => {
    it('throws UnauthorizedException for unknown email', async () => {
      mockDb.query.users.findFirst.mockResolvedValueOnce(null)
      await expect(service.signin('x@x.com', 'pass')).rejects.toThrow(UnauthorizedException)
    })
  })
})
