/**
 * YAML-backed infra knowledge store.
 *
 * Two files, one truth:
 *   ~/.dsh/infra/infra.yml       global, shared by every project
 *   <workspace>/.dsh/infra.yml   project-local, may be committed with the repo
 *
 * Nothing secret is ever stored here — entries hold pointers (key paths,
 * credential ref names), never key material.
 */
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import YAML from 'yaml'

export const GLOBAL_FILE = join(homedir(), '.dsh', 'infra', 'infra.yml')
export const PROJECT_REL = join('.dsh', 'infra.yml')

const KINDS = ['hosts', 'git']

export function projectFile(cwd) {
  return cwd ? join(cwd, PROJECT_REL) : undefined
}

export function emptyConfig() {
  return { version: 1, hosts: {}, git: {}, rules: [] }
}

function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {}
}

function normalize(raw) {
  const cfg = asObject(raw)
  const out = emptyConfig()
  out.version = Number.isFinite(cfg.version) ? Number(cfg.version) : 1
  for (const kind of KINDS) {
    const entries = asObject(cfg[kind])
    for (const [id, value] of Object.entries(entries)) {
      const entry = asObject(value)
      if (Object.keys(entry).length === 0) continue
      out[kind][id] = { ...entry, id }
    }
  }
  const rules = Array.isArray(cfg.rules) ? cfg.rules : []
  out.rules = rules
    .map((rule, index) => ({ ...asObject(rule), id: String(asObject(rule).id ?? `rule-${index + 1}`) }))
    .filter((rule) => typeof rule.match === 'string' && rule.match.length > 0)
  if (typeof cfg.project === 'string') out.project = cfg.project
  if (typeof cfg.remote === 'string') out.remote = cfg.remote
  return out
}

export async function readYaml(path) {
  if (!path) return { config: emptyConfig(), exists: false }
  let text
  try {
    text = await readFile(path, 'utf8')
  } catch {
    return { config: emptyConfig(), exists: false }
  }
  try {
    return { config: normalize(YAML.parse(text)), exists: true }
  } catch (error) {
    return { config: emptyConfig(), exists: true, error: `YAML 解析失败：${String(error?.message ?? error)}` }
  }
}

export async function writeYaml(path, config) {
  const text = `# dsh-infra — 由 @local/dsh-infra 维护。这里只放指针，不放密码和私钥。\n${YAML.stringify({
    version: config.version ?? 1,
    ...(config.project ? { project: config.project } : {}),
    ...(config.remote ? { remote: config.remote } : {}),
    hosts: config.hosts ?? {},
    git: config.git ?? {},
    rules: config.rules ?? [],
  })}`
  await mkdir(dirname(path), { recursive: true })
  const tmp = `${path}.tmp-${process.pid}`
  await writeFile(tmp, text, 'utf8')
  await rename(tmp, path)
}

/** Glob-lite: `*` matches inside a segment, `**` crosses segments. */
export function matchesProject(cwd, patterns) {
  if (!cwd) return false
  const list = Array.isArray(patterns) ? patterns : typeof patterns === 'string' ? [patterns] : []
  if (list.length === 0) return true
  const target = resolve(cwd)
  return list.some((pattern) => {
    if (typeof pattern !== 'string' || pattern.length === 0) return false
    const source = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*\*/g, '\u0000')
      .replace(/\*/g, '[^/]*')
      .replace(/\u0000/g, '.*')
    try {
      return new RegExp(`^${source}`).test(target)
    } catch {
      return target.includes(pattern)
    }
  })
}

function pick(entries, cwd) {
  const out = {}
  for (const [id, entry] of Object.entries(entries)) {
    if (!matchesProject(cwd, entry.projects)) continue
    out[id] = entry
  }
  return out
}

/**
 * Merge global and project config for one workspace.
 * Project entries win on the same id; project rules come last so they can
 * narrow a global rule.
 */
export function mergeConfigs(globalConfig, projectConfig, cwd) {
  const hosts = { ...pick(globalConfig.hosts, cwd), ...pick(projectConfig.hosts, cwd) }
  const git = { ...pick(globalConfig.git, cwd), ...pick(projectConfig.git, cwd) }
  const rules = [...pickRules(globalConfig.rules, cwd), ...pickRules(projectConfig.rules, cwd)]
  return {
    project: projectConfig.project ?? globalConfig.project,
    remote: projectConfig.remote,
    hosts,
    git,
    rules,
    counts: {
      hosts: Object.keys(hosts).length,
      git: Object.keys(git).length,
      globalHosts: Object.keys(globalConfig.hosts).length,
      globalGit: Object.keys(globalConfig.git).length,
    },
  }
}

function pickRules(rules, cwd) {
  return (rules ?? []).filter((rule) => matchesProject(cwd, rule.projects))
}

export async function readState(cwd) {
  const global = await readYaml(GLOBAL_FILE)
  const project = await readYaml(projectFile(cwd))
  return {
    paths: { global: GLOBAL_FILE, project: projectFile(cwd) },
    exists: { global: global.exists, project: project.exists },
    errors: [global.error, project.error].filter(Boolean),
    global: global.config,
    project: project.config,
    merged: mergeConfigs(global.config, project.config, cwd),
  }
}

export async function upsertEntry({ cwd, file, kind, id, value }) {
  if (!KINDS.includes(kind)) throw new Error(`unknown kind: ${kind}`)
  const path = file === 'project' ? projectFile(cwd) : GLOBAL_FILE
  if (!path) throw new Error('no workspace directory for a project entry')
  const { config } = await readYaml(path)
  if (value === null) {
    delete config[kind][id]
  } else {
    config[kind][id] = { ...value, id }
  }
  await writeYaml(path, config)
  return readState(cwd)
}

export async function upsertRule({ cwd, file, rule }) {
  const path = file === 'project' ? projectFile(cwd) : GLOBAL_FILE
  if (!path) throw new Error('no workspace directory for a project rule')
  const { config } = await readYaml(path)
  const index = config.rules.findIndex((item) => item.id === rule.id)
  if (index === -1) config.rules.push(rule)
  else config.rules[index] = { ...config.rules[index], ...rule }
  await writeYaml(path, config)
  return readState(cwd)
}
