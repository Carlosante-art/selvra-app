import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'

/**
 * Vitest-config för selvra-app.
 *
 * Status: scaffold. Tester förväntas vara unit-level för rena funktioner
 * (protocol/types-guards, ai-context-format, identity-helpers). Integration-
 * tester mot Selvra-protokollet körs separat via verify-skript i ~/selvra/
 * — inte här.
 *
 * Inga jsdom-eller-React-component-tester för v1 — UI-iteration är fortsatt
 * intensiv och component-tester skulle binda upp design-discipline mot
 * en bevis-modell som inte är stabil än.
 *
 * Kör: `pnpm test` eller `npx vitest run`.
 */

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: [
        'src/lib/**/*.test.ts',
        'src/lib/db/**',
        'src/lib/auth/**',
        'src/lib/protocol/client.ts',
      ],
    },
  },
})
