import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          const data = await res.json()

          if (!res.ok || !data.success) {
            throw new Error(data.error || 'Credenciais inválidas.')
          }

          const { user, token } = data.data
          return { ...user, token }
        } catch (err) {
          if (err instanceof Error) throw err
          throw new Error('Erro ao conectar ao servidor.')
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // Na primeira autenticação, user vem preenchido
      if (user) {
        token.id = user.id
        token.role = user.role
        token.token = user.token
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.id
      session.user.role = token.role
      session.token = token.token
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
  },

  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
