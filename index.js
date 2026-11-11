/**
 * Host half of dsh-infra.
 *
 * Three jobs, one knowledge base:
 *   1. tell every agent, per project, which machines and remotes exist and how
 *      to reach them (per-Agent prompt section, so a prompt cannot leak one
 *      project's hosts into another);
 *   2. deny the specific command that motivated this plugin (minting a new SSH
 *      key for a repo that already has one);
 *   3. serve the sidebar panel and the conversation-view repo card.
 */

import { readState } from './host/store.js'
import { renderKnowledge } from './host/knowledge.js'
import { activeRules, checkCommand } from './host/guard.js'
import { createHandler } from './host/routes.js'

export const name = 'dsh-infra'
export const inject = ['systemPrompt', 'webServer', 'subprocess', 'workingDirectory', 'sessionQuery']

export const ROUTE = '/dsh-infra'
const SECTION = 'infra-knowledge'
/** Between the deployment persona (0) and the plan policy (500). */
const SECTION_ORDER = 450
const RULES_REFRESH_MS = 30_000

export function apply(ctx) {
  const dirs = new Map()
  const registered = new Set()
  const cache = new Map()
  const rules = new Map()

  const remember = (cwd, state) => {
    if (!cwd) return state
    cache.set(cwd, state.merged)
    rules.set(cwd, activeRules(state.merged))
    return state
  }

  const load = async (cwd) => remember(cwd, await readState(cwd))

  async function refresh(cwd) {
    try {
      const state = await load(cwd)
      return state
    } catch {
      return undefined
    }
  }

  ctx.on('agent/created', async (payload) => {
    const agent = payload?.agent
    if (!agent?.id) return undefined
    let cwd
    try {
      cwd = await ctx.workingDirectory.ensure(agent, payload.signal)
    } catch {
      cwd = undefined
    }
    if (cwd) dirs.set(agent.id, cwd)
    if (cwd) await refresh(cwd)
    if (registered.has(agent.id)) return undefined
    try {
      agent.ctx.systemPrompt.section({
        name: SECTION,
        order: SECTION_ORDER,
        text: () => {
          const dir = dirs.get(agent.id)
          return renderKnowledge(dir ? cache.get(dir) : undefined, { cwd: dir })
        },
      })
      registered.add(agent.id)
    } catch {
      // Section names are unique per scope; a second registration means the
      // agent already carries the block, which is the state we want.
    }
    return undefined
  })

  ctx.on('agent/disposed', (payload) => {
    const id = payload?.agent?.id
    if (!id) return
    const cwd = dirs.get(id)
    dirs.delete(id)
    registered.delete(id)
    if (cwd) {
      const stillUsed = [...dirs.values()].includes(cwd)
      if (!stillUsed) {
        cache.delete(cwd)
        rules.delete(cwd)
      }
    }
  })

  ctx.inject(['tools'], (scope) => {
    scope.effect(() =>
      scope.tools.guard((execution) => {
        if (execution?.name !== 'bash') return undefined
        const command = execution?.arguments?.command
        if (typeof command !== 'string') return undefined
        const cwd = execution?.agent?.id ? dirs.get(execution.agent.id) : undefined
        const merged = cwd ? cache.get(cwd) : undefined
        const custom = cwd ? rules.get(cwd) : undefined
        if (custom || merged) return checkCommand(merged ?? { rules: [] }, command)
        return checkCommand({}, command)
      }),
    )
  })

  ctx.effect(() => {
    const timer = setInterval(() => {
      for (const cwd of cache.keys()) void refresh(cwd)
    }, RULES_REFRESH_MS)
    timer.unref?.()
    return () => clearInterval(timer)
  })

  ctx.inject(['webServer', 'subprocess'], (scope) => {
    const handler = createHandler({
      spawn: (spec) => scope.subprocess.spawn(spec),
      readState: load,
      defaultCwd: async () => {
        // The sidebar panel has no session, so "current project" means the
        // workspace of the most recently created agent; the deployment default
        // is only a fallback (it points at the profile directory, not a repo).
        const seen = [...dirs.values()]
        if (seen.length > 0) return seen[seen.length - 1]
        try {
          const records = await ctx.sessionQuery.listSessions()
          const recent = Array.isArray(records)
            ? records.find((record) => record?.header?.cwd ?? record?.cwd)
            : undefined
          const cwd = recent?.header?.cwd ?? recent?.cwd
          if (typeof cwd === 'string' && cwd.length > 0) return cwd
        } catch {
          // fall through to the deployment default
        }
        try {
          const value = ctx.workingDirectory.defaultDirectory
          return typeof value === 'string' ? value : undefined
        } catch {
          return undefined
        }
      },
    })
    scope.effect(() => scope.webServer.register({ kind: 'prefix', path: ROUTE, handler }))
  })
}
