/**
 * Same-origin JSON routes behind the two surfaces. The client never touches
 * the filesystem; every read and write of the knowledge base happens here.
 */
import { readState as readStateImpl, upsertEntry, upsertRule } from './store.js'
import { discover } from './discover.js'
import { activeRules } from './guard.js'
import { run } from './exec.js'

async function readBody(request, limit = 64 * 1024) {
  const chunks = []
  let size = 0
  for await (const chunk of request) {
    size += chunk.length
    if (size > limit) throw new Error('request body too large')
    chunks.push(chunk)
  }
  if (chunks.length === 0) return {}
  const text = Buffer.concat(chunks).toString('utf8')
  return text.trim() ? JSON.parse(text) : {}
}

function send(response, status, payload) {
  response.statusCode = status
  response.setHeader('content-type', 'application/json; charset=utf-8')
  response.setHeader('cache-control', 'no-store')
  response.end(JSON.stringify(payload))
}

function toSshUrl(url) {
  const match = /^https?:\/\/([^/]+)\/(.+?)(?:\.git)?\/?$/.exec(String(url))
  if (!match) return undefined
  return `git@${match[1]}:${match[2].replace(/\.git$/, '')}.git`
}

const DEFAULT_HOST_CHECK = (entry, id) => entry.check ?? `ssh -o BatchMode=yes -o ConnectTimeout=5 ${entry.command?.replace(/^ssh\s+/, '') ?? id} true`

export function createHandler({ spawn, readState = readStateImpl, defaultCwd }) {
  const resolveCwd = async (candidate) => candidate ?? (await defaultCwd?.()) ?? undefined
  const checkHost = async (entry, id, cwd, signal) => {
    const command = DEFAULT_HOST_CHECK(entry, id)
    const result = await run(spawn, { argv: ['/bin/sh', '-c', command], cwd, signal })
    return { id, ok: result.ok, ms: result.ms, detail: (result.stderr || result.stdout).trim().slice(0, 400) }
  }
  const checkGit = async (entry, id, cwd, signal) => {
    if (!entry.remote) return { id, ok: false, ms: 0, detail: '没有 remote' }
    const result = await run(spawn, { argv: ['git', 'ls-remote', '--exit-code', entry.remote, 'HEAD'], cwd, signal, timeoutMs: 12_000 })
    return { id, ok: result.ok, ms: result.ms, detail: (result.stderr || result.stdout).trim().slice(0, 400) }
  }
  return async function handler(request, response) {
    try {
      const url = new URL(request.url, 'http://local')
      const path = url.pathname.replace(/^\/dsh-infra/, '') || '/'
      const method = request.method ?? 'GET'

      if (path === '/state' && method === 'GET') {
        const state = await readState(await resolveCwd(url.searchParams.get('cwd') ?? undefined))
        send(response, 200, { ...state, rules: activeRules(state.merged) })
        return
      }

      const body = method === 'POST' ? await readBody(request) : {}
      const cwd = await resolveCwd(body.cwd ?? url.searchParams.get('cwd') ?? undefined)

      if (path === '/discover' && method === 'POST') {
        const result = await discover({ spawn, cwd, signal: undefined })
        send(response, 200, result)
        return
      }

      if (path === '/check' && method === 'POST') {
        const state = await readState(cwd)
        const wanted = Array.isArray(body.ids) ? body.ids : []
        const targets = wanted.length > 0 ? wanted : [
          ...Object.keys(state.merged.hosts).map((id) => ({ kind: 'hosts', id })),
        ]
        const results = []
        for (const target of targets) {
          const collection = state.merged[target.kind] ?? {}
          const entry = collection[target.id]
          if (!entry) continue
          results.push(
            target.kind === 'git'
              ? await checkGit(entry, target.id, cwd, undefined)
              : await checkHost(entry, target.id, cwd, undefined),
          )
        }
        send(response, 200, { checkedAt: Date.now(), results })
        return
      }

      if (path === '/entry' && method === 'POST') {
        const state = await upsertEntry({ cwd, file: body.file ?? 'global', kind: body.kind, id: body.id, value: body.value })
        send(response, 200, state)
        return
      }

      if (path === '/rule' && method === 'POST') {
        const state = await upsertRule({ cwd, file: body.file ?? 'global', rule: body.rule })
        send(response, 200, state)
        return
      }

      if (path === '/repo' && method === 'POST') {
        const state = await readState(cwd)
        if (body.action === 'switch-ssh') {
          const remote = state.project.remote ?? Object.values(state.merged.git)[0]?.remote
          const sshUrl = toSshUrl(remote)
          if (!sshUrl) {
            send(response, 400, { error: '当前 remote 不是 https 形式，无需转换' })
            return
          }
          const result = await run(spawn, { argv: ['git', 'remote', 'set-url', 'origin', sshUrl], cwd })
          if (!result.ok) {
            send(response, 500, { error: result.stderr.trim() || 'git remote set-url 失败' })
            return
          }
          send(response, 200, { ok: true, remote: sshUrl })
          return
        }
        if (body.action === 'identity') {
          const entries = [['user.name', body.name], ['user.email', body.email]].filter(([, value]) => typeof value === 'string' && value.length > 0)
          for (const [key, value] of entries) {
            const result = await run(spawn, { argv: ['git', 'config', key, value], cwd })
            if (!result.ok) {
              send(response, 500, { error: result.stderr.trim() || `git config ${key} 失败` })
              return
            }
          }
          send(response, 200, { ok: true, identity: { name: body.name, email: body.email } })
          return
        }
        send(response, 400, { error: `unknown action: ${body.action}` })
        return
      }

      send(response, 404, { error: `no route: ${method} ${path}` })
    } catch (error) {
      send(response, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  }
}
