import NextAuth from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const AUTH_URL = process.env.AUTH_SERVICE_URL ?? 'http://localhost:3001'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${AUTH_URL}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: credentials.email, password: credentials.password }),
          })
          if (!res.ok) return null

          const tokens = (await res.json()) as {
            accessToken: string
            refreshToken: string
            expiresIn: number
          }

          const meRes = await fetch(`${AUTH_URL}/auth/me`, {
            headers: { Authorization: `Bearer ${tokens.accessToken}` },
          })
          if (!meRes.ok) return null

          const user = (await meRes.json()) as {
            id: string
            email: string
            name: string | null
            plan: string
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            plan: user.plan,
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
          }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken
        token.refreshToken = user.refreshToken
        token.plan = user.plan
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken
      if (session.user) {
        session.user.plan = token.plan
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin',
  },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
