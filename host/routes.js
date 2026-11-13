/**
 * Same-origin JSON routes. The browser half never touches the filesystem.
 */
import { readDoc, writeDoc, appendSnapshot, readSnapshots, totalsOf, paths } from './store.js'
import { listRepos, mergeRepos } from './github.js'

async function readBody(request, limit = 512 * 1024) {
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

const view = (doc) => ({ doc, totals: totalsOf(doc), paths })

export function createHandler({ spawn }) {
  return async function handler(request, response) {
    try {
      const url = new URL(request.url, 'http://local')
      const path = url.pathname.replace(/^\/dsh-infra/, '') || '/'
      const method = request.method ?? 'GET'

      if (path === '/assets' && method === 'GET') {
        send(response, 200, view(await readDoc()))
        return
      }

      if (path === '/assets' && method === 'POST') {
        const body = await readBody(request)
        const saved = await writeDoc(body.doc ?? body)
        const snapshot = body.snapshot ? await appendSnapshot(saved) : undefined
        send(response, 200, { ...view(saved), snapshot })
        return
      }

      if (path === '/snapshots' && method === 'GET') {
        const limit = Number.parseInt(url.searchParams.get('limit') ?? '120', 10)
        send(response, 200, { snapshots: await readSnapshots(Number.isFinite(limit) ? limit : 120) })
        return
      }

      if (path === '/github/sync' && method === 'POST') {
        let fetched
        try {
          fetched = await listRepos(spawn)
        } catch (error) {
          send(response, 502, { error: error instanceof Error ? error.message : String(error) })
          return
        }
        const doc = await readDoc()
        const saved = await writeDoc({ ...doc, repos: mergeRepos(doc.repos, fetched) })
        send(response, 200, { ...view(saved), synced: fetched.length })
        return
      }

      send(response, 404, { error: `no route: ${method} ${path}` })
    } catch (error) {
      send(response, 500, { error: error instanceof Error ? error.message : String(error) })
    }
  }
}
