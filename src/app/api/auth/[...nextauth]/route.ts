/**
 * Auth.js v5 catch-all route. Hanterar /api/auth/signin, /api/auth/callback,
 * /api/auth/session, etc. Inget annat behövs på app-sidan — NextAuth
 * själv-mountar alla auth-flow-endpoints under denna route.
 */

export { GET, POST } from '@/lib/auth/handlers'
