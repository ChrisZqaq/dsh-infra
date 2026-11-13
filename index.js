/**
 * Host half of dsh-ledger.
 *
 * One job: serve the asset ledger panel. Everything that used to talk to
 * agents (prompt sections, command guards, host discovery) is gone on purpose —
 * the panel only reads and writes ~/.dsh/infra/assets.yml, and the single
 * outbound call it makes is a read-only `gh repo list`.
 */
import { createHandler } from './host/routes.js'

export const name = 'dsh-ledger'
export const inject = ['webServer', 'subprocess']

export const ROUTE = '/dsh-ledger'

export function apply(ctx) {
  ctx.inject(['webServer', 'subprocess'], (scope) => {
    const handler = createHandler({ spawn: (spec) => scope.subprocess.spawn(spec) })
    scope.effect(() => scope.webServer.register({ kind: 'prefix', path: ROUTE, handler }))
  })
}
