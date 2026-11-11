/**
 * Read-only discovery: turn what is already on this machine into candidate
 * entries. Nothing is written until the user confirms in the panel.
 */
import { readdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { run } from './exec.js'

const SSH_DIR = join(homedir(), '.ssh')

/** Parse an ssh_config file into one entry per concrete Host alias. */
export function parseSshConfig(text) {
  const hosts = {}
  let current = null
  for (const rawLine of String(text).split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, '').trim()
    if (!line) continue
    const [keywordRaw, ...rest] = line.split(/\s+/)
    const keyword = keywordRaw.toLowerCase()
    const value = rest.join(' ')
    if (keyword === 'host') {
      const names = rest.filter((name) => name && !name.includes('*') && !name.includes('?'))
      current = names.length > 0 ? names[0] : null
      if (current) {
        hosts[current] ??= { kind: 'hosts', label: current, command: `ssh ${current}` }
      }
      continue
    }
    if (keyword === 'match') {
      current = null
      continue
    }
    if (!current) continue
    const entry = hosts[current]
    if (keyword === 'hostname') entry.host = value
    else if (keyword === 'user') entry.user = value
    else if (keyword === 'port') entry.port = value
    else if (keyword === 'identityfile') entry.key = value.replace(/^~/, homedir())
  }
  for (const entry of Object.values(hosts)) {
    if (typeof entry.key === 'string') entry.key = entry.key.replace(/^"|"$/g, '')
    if (entry.label === entry.host) delete entry.host
  }
  return hosts
}

export async function readSshHosts() {
  try {
    const text = await readFile(join(SSH_DIR, 'config'), 'utf8')
    return parseSshConfig(text)
  } catch {
    return {}
  }
}

export async function listPublicKeys() {
  try {
    const names = await readdir(SSH_DIR)
    return names.filter((name) => name.endsWith('.pub')).map((name) => join(SSH_DIR, name))
  } catch {
    return []
  }
}

export function protocolOf(url) {
  const text = String(url ?? '')
  if (/^git@|^ssh:\/\//.test(text)) return 'ssh'
  if (/^https?:\/\//.test(text)) return 'https'
  if (/^git:\/\//.test(text)) return 'git'
  return 'unknown'
}

export async function readGitRemote(spawn, cwd, signal) {
  if (!cwd) return undefined
  const remote = await run(spawn, { argv: ['git', 'remote', 'get-url', 'origin'], cwd, signal, timeoutMs: 4000 })
  if (!remote.ok) return undefined
  const url = remote.stdout.trim()
  if (!url) return undefined
  const branch = await run(spawn, { argv: ['git', 'rev-parse', '--abbrev-ref', 'HEAD'], cwd, signal, timeoutMs: 4000 })
  return { url, protocol: protocolOf(url), branch: branch.ok ? branch.stdout.trim() : undefined }
}

/** Best-effort `gh auth status` parse: account + protocol only, never the token. */
export async function readGhAccounts(spawn, signal) {
  const result = await run(spawn, { argv: ['gh', 'auth', 'status'], timeoutMs: 6000, signal })
  const text = `${result.stdout}\n${result.stderr}`
  const accounts = []
  const pattern = /Logged in to (\S+) account (\S+)/g
  let match
  while ((match = pattern.exec(text)) !== null) accounts.push({ host: match[1], account: match[2] })
  return { available: result.ok || accounts.length > 0, accounts }
}

export async function discover({ spawn, cwd, signal } = {}) {
  const [sshHosts, keys, gh] = await Promise.all([
    readSshHosts(),
    listPublicKeys(),
    spawn ? readGhAccounts(spawn, signal) : Promise.resolve({ available: false, accounts: [] }),
  ])
  const remote = spawn ? await readGitRemote(spawn, cwd, signal) : undefined
  const sshGithub = Object.entries(sshHosts).find(([alias, entry]) => alias === 'github.com' || entry.host === 'github.com')
  const git = {}
  if (remote) {
    git[currentGitId(remote.url)] = {
      kind: 'git',
      id: currentGitId(remote.url),
      label: '本项目远端',
      remote: remote.url,
      auth: remote.protocol === 'ssh' ? 'ssh' : 'https',
      ...(sshGithub && remote.protocol === 'ssh' ? { key: sshGithub[1].key } : {}),
    }
  }
  return {
    hosts: sshHosts,
    git,
    keys,
    gh,
    remote,
    existing: { hosts: Object.keys(sshHosts), git: Object.keys(git) },
  }
}

export function currentGitId(url) {
  const text = String(url ?? '')
  const match = /(?:[:/])([^/:]+)\/([^/]+?)(?:\.git)?$/.exec(text)
  if (!match) return 'origin'
  return `${match[2]}`
}
