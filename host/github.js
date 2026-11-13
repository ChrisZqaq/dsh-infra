/**
 * Read-only `gh` bridge. Nothing is ever written back to GitHub.
 */
import { run } from './exec.js'

const FIELDS = 'nameWithOwner,visibility,primaryLanguage,updatedAt,description,url'

export async function listRepos(spawn, { signal } = {}) {
  const result = await run(spawn, {
    argv: ['gh', 'repo', 'list', '--limit', '300', '--json', FIELDS],
    timeoutMs: 20_000,
    signal,
  })
  if (!result.ok) {
    const detail = (result.stderr || result.stdout).trim().slice(0, 300)
    throw new Error(detail || 'gh repo list 执行失败')
  }
  let rows
  try {
    rows = JSON.parse(result.stdout || '[]')
  } catch {
    throw new Error('gh 返回的不是 JSON')
  }
  if (!Array.isArray(rows)) return []
  return rows.map((row) => ({
    id: `repo-${String(row.nameWithOwner ?? '').toLowerCase()}`,
    name: String(row.nameWithOwner ?? ''),
    visibility: row.visibility === 'PRIVATE' || row.visibility === 'private' ? 'private' : 'public',
    language: String(row.primaryLanguage?.name ?? row.primaryLanguage ?? ''),
    committedAt: String(row.updatedAt ?? '').slice(0, 10),
    description: String(row.description ?? ''),
    remote: String(row.url ?? '').replace(/^https:\/\/github\.com\//, 'git@github.com:').replace(/$/, ''),
    note: '',
  }))
}

/**
 * Remote wins on the five facts GitHub owns; the local note survives, because
 * it is the only field a user types by hand.
 */
export function mergeRepos(existing, incoming) {
  const byId = new Map()
  for (const item of Array.isArray(existing) ? existing : []) byId.set(item.id ?? item.name, item)
  const merged = []
  const seen = new Set()
  for (const fresh of incoming) {
    const key = fresh.id ?? fresh.name
    seen.add(key)
    const before = byId.get(key)
    merged.push({ ...fresh, note: before?.note ?? '' })
  }
  for (const [key, before] of byId) {
    if (!seen.has(key)) merged.push(before)
  }
  return merged
}
