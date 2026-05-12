import 'server-only'

/**
 * Strukturerad server-side-logging för selvra-app.
 *
 * Server-only — klient-bundle använder console direkt (browser tar hand
 * om sin egen log-yta). Detta är för Next.js Server Actions, API-routes,
 * Server Components, `events.signIn`-callbacks etc.
 *
 * Format: enkel structured JSON-line med timestamp + level + module +
 * message + meta. Railway/Vercel-loggar plockar upp JSON-lines automatiskt.
 *
 * Kontext-injicering (request_id / user_id / subject_id) görs via
 * `logger.child({...})` per-request om det blir relevant senare. Nu
 * skickar varje site sin egen kontext via meta-arg.
 *
 * Användning:
 *   import { logger } from '@/lib/logging'
 *   const log = logger.child({ module: 'identity/ensure' })
 *   log.info('Provisioning tenant', { userId, email })
 *   log.error('Tenant-creation failed', { userId, error: e.message })
 *
 * Doktrinärt: vi loggar inte user-content (intentioner, tankar, brev-text).
 * Det är privacy-doktrin. Logger får ID:n och statuskoder, inte payload.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

type LogMeta = Record<string, unknown>

type LogEntry = {
  ts: string
  level: LogLevel
  module?: string
  message: string
  [extra: string]: unknown
}

class Logger {
  private readonly context: LogMeta

  constructor(context: LogMeta = {}) {
    this.context = context
  }

  child(extraContext: LogMeta): Logger {
    return new Logger({ ...this.context, ...extraContext })
  }

  debug(message: string, meta: LogMeta = {}): void {
    this.emit('debug', message, meta)
  }

  info(message: string, meta: LogMeta = {}): void {
    this.emit('info', message, meta)
  }

  warn(message: string, meta: LogMeta = {}): void {
    this.emit('warn', message, meta)
  }

  error(message: string, meta: LogMeta = {}): void {
    this.emit('error', message, meta)
  }

  private emit(level: LogLevel, message: string, meta: LogMeta): void {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      message,
      ...this.context,
      ...meta,
    }
    const line = JSON.stringify(entry)
    // Använd korrekt console-metod för rätt severity i Vercel/Railway.
    if (level === 'error') {
      console.error(line)
    } else if (level === 'warn') {
      console.warn(line)
    } else {
      console.log(line)
    }
  }
}

export const logger = new Logger()
