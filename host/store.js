/**
 * Asset ledger store — the only place that touches the disk.
 *
 *   ~/.dsh/infra/assets.yml       current state; hand-editable, single truth
 *   ~/.dsh/infra/snapshots.jsonl  append-only full copies, one JSON per line
 *
 * Both live outside the plugin repository on purpose: this package is public
 * and nothing here may ever end up in git.
 */
import { readFile, writeFile, rename, mkdir, appendFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import YAML from 'yaml'

/** Overridable only so the offline harness can point at a temp directory. */
export const DIR = process.env.DSH_INFRA_DIR || join(homedir(), '.dsh', 'infra')
export const ASSETS_FILE = join(DIR, 'assets.yml')
export const SNAPSHOTS_FILE = join(DIR, 'snapshots.jsonl')
/** Written by dsh-ledger <= 0.1.1; imported once, then left alone. */
export const LEGACY_FILE = join(DIR, 'infra.yml')

export const MONEY_KINDS = ['现金', '持仓', '负债']
export const CURRENCIES = ['CNY', 'HKD']
export const DEVICE_TYPES = ['服务器', '电脑']
export const DEVICE_STATES = ['在线', '离线', '未知']

const str = (value, fallback = '') => (typeof value === 'string' ? value : value === 0 ? '0' : fallback)
const num = (value, fallback = 0) => {
  const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(/,/g, ''))
  return Number.isFinite(parsed) ? parsed : fallback
}
const oneOf = (value, allowed, fallback) => (allowed.includes(str(value)) ? str(value) : fallback)

export function emptyDoc() {
  return {
    version: 2,
    rate: { HKD_CNY: 0.917 },
    money: [],
    devices: [],
    repos: [],
    keys: [],
    updatedAt: '',
  }
}

function normalizeMoney(raw, index) {
  const item = raw && typeof raw === 'object' ? raw : {}
  return {
    id: str(item.id) || `money-${index + 1}`,
    name: str(item.name),
    kind: oneOf(item.kind, MONEY_KINDS, '现金'),
    currency: oneOf(item.currency, CURRENCIES, 'CNY'),
    quantity: num(item.quantity, 1),
    price: num(item.price, 0),
    note: str(item.note),
  }
}

function normalizeDevice(raw, index) {
  const item = raw && typeof raw === 'object' ? raw : {}
  return {
    id: str(item.id) || `device-${index + 1}`,
    name: str(item.name),
    type: oneOf(item.type, DEVICE_TYPES, '服务器'),
    address: str(item.address),
    specs: str(item.specs),
    status: oneOf(item.status, DEVICE_STATES, '未知'),
    note: str(item.note),
  }
}

function normalizeRepo(raw, index) {
  const item = raw && typeof raw === 'object' ? raw : {}
  return {
    id: str(item.id) || `repo-${index + 1}`,
    name: str(item.name),
    visibility: oneOf(item.visibility, ['public', 'private'], 'public'),
    language: str(item.language),
    committedAt: str(item.committedAt),
    description: str(item.description),
    remote: str(item.remote),
    note: str(item.note),
  }
}

function normalizeKey(raw, index) {
  const item = raw && typeof raw === 'object' ? raw : {}
  return {
    id: str(item.id) || `key-${index + 1}`,
    name: str(item.name),
    purpose: str(item.purpose),
    value: str(item.value),
    location: str(item.location),
    expiresAt: str(item.expiresAt),
  }
}

export function normalizeDoc(raw) {
  const doc = raw && typeof raw === 'object' ? raw : {}
  const rate = doc.rate && typeof doc.rate === 'object' ? doc.rate : {}
  const list = (value, mapper) => (Array.isArray(value) ? value.map(mapper).filter((item) => item.name || item.id) : [])
  return {
    version: 2,
    rate: { HKD_CNY: num(rate.HKD_CNY, 0.917) || 0.917 },
    money: list(doc.money, normalizeMoney),
    devices: list(doc.devices, normalizeDevice),
    repos: list(doc.repos, normalizeRepo),
    keys: list(doc.keys, normalizeKey),
    updatedAt: str(doc.updatedAt),
  }
}

/** Quantity x price, always positive; the sign belongs to the kind. */
export function amountOf(item) {
  return Math.abs(num(item.quantity, 0) * num(item.price, 0))
}

/** One item in CNY, so mixed currencies can be summed. */
export function toCny(item, doc) {
  const rate = num(doc?.rate?.HKD_CNY, 0.917) || 0.917
  const amount = amountOf(item)
  return item.currency === 'HKD' ? amount * rate : amount
}

/**
 * Three-level totals: cash + holdings = assets, liabilities stay negative,
 * assets + liabilities = net. Per-currency subtotals stay in their own unit.
 */
export function totalsOf(doc) {
  const money = Array.isArray(doc?.money) ? doc.money : []
  const rate = num(doc?.rate?.HKD_CNY, 0.917) || 0.917
  let cash = 0
  let holdings = 0
  let liability = 0
  let cny = 0
  let hkd = 0
  for (const item of money) {
    const amount = amountOf(item)
    if (item.currency === 'HKD') hkd += amount
    else cny += amount
    if (item.kind === '负债') liability += toCny(item, doc)
    else if (item.kind === '持仓') holdings += toCny(item, doc)
    else cash += toCny(item, doc)
  }
  return {
    rate,
    cash,
    holdings,
    assets: cash + holdings,
    liability: -liability,
    net: cash + holdings - liability,
    cny,
    hkd,
    hkdInCny: hkd * rate,
  }
}

export function snapshotOf(doc, at = new Date()) {
  const stamp = new Date(at)
  const pad = (value) => String(value).padStart(2, '0')
  const date = `${stamp.getFullYear()}-${pad(stamp.getMonth() + 1)}-${pad(stamp.getDate())}`
  return {
    at: stamp.toISOString(),
    date,
    rate: num(doc?.rate?.HKD_CNY, 0.917),
    totals: totalsOf(doc),
    money: doc.money ?? [],
    devices: doc.devices ?? [],
    repos: doc.repos ?? [],
    keys: doc.keys ?? [],
  }
}

/** dsh-ledger 0.1.1 kept machines and remotes in infra.yml; fold them in once. */
async function importLegacy() {
  let text
  try {
    text = await readFile(LEGACY_FILE, 'utf8')
  } catch {
    return undefined
  }
  let legacy
  try {
    legacy = YAML.parse(text)
  } catch {
    return undefined
  }
  if (!legacy || typeof legacy !== 'object') return undefined
  const doc = emptyDoc()
  const hosts = legacy.hosts && typeof legacy.hosts === 'object' ? legacy.hosts : {}
  for (const [id, raw] of Object.entries(hosts)) {
    const entry = raw && typeof raw === 'object' ? raw : {}
    doc.devices.push(
      normalizeDevice(
        {
          id: `device-${id}`,
          name: str(entry.label) || id,
          type: '服务器',
          address: str(entry.command) || [entry.user, entry.host].filter(Boolean).join('@'),
          specs: [str(entry.os), str(entry.specs)].filter(Boolean).join(' · '),
          status: '未知',
          note: str(entry.note),
        },
        doc.devices.length,
      ),
    )
  }
  const git = legacy.git && typeof legacy.git === 'object' ? legacy.git : {}
  for (const [id, raw] of Object.entries(git)) {
    const entry = raw && typeof raw === 'object' ? raw : {}
    doc.repos.push(
      normalizeRepo(
        {
          id: `repo-${id}`,
          name: id,
          visibility: 'private',
          remote: str(entry.remote),
          note: str(entry.rule),
        },
        doc.repos.length,
      ),
    )
  }
  if (doc.devices.length === 0 && doc.repos.length === 0) return undefined
  doc.updatedAt = new Date().toISOString()
  return doc
}

export async function readDoc() {
  let text
  try {
    text = await readFile(ASSETS_FILE, 'utf8')
  } catch {
    const imported = await importLegacy()
    if (imported) {
      await writeDoc(imported)
      return imported
    }
    return emptyDoc()
  }
  try {
    return normalizeDoc(YAML.parse(text))
  } catch (error) {
    throw new Error(`assets.yml 解析失败：${String(error?.message ?? error)}`)
  }
}

const HEADER = `# dsh-ledger — 个人资产记录。由插件维护，也可以手工编辑。\n# 这个文件在插件仓之外，永远不会被同步或上传。\n`

export async function writeDoc(raw) {
  const doc = normalizeDoc({ ...raw, updatedAt: new Date().toISOString() })
  const body = YAML.stringify(
    {
      version: 2,
      updatedAt: doc.updatedAt,
      rate: doc.rate,
      money: doc.money,
      devices: doc.devices,
      repos: doc.repos,
      keys: doc.keys,
    },
    { lineWidth: 0 },
  )
  await mkdir(dirname(ASSETS_FILE), { recursive: true })
  const tmp = `${ASSETS_FILE}.tmp-${process.pid}`
  await writeFile(tmp, HEADER + body, 'utf8')
  await rename(tmp, ASSETS_FILE)
  return doc
}

export async function appendSnapshot(doc) {
  const line = JSON.stringify(snapshotOf(doc))
  await mkdir(DIR, { recursive: true })
  await appendFile(SNAPSHOTS_FILE, `${line}\n`, 'utf8')
  return JSON.parse(line)
}

/** Newest first. Only the listing fields — the full copies stay on disk. */
export async function readSnapshots(limit = 120) {
  let text
  try {
    text = await readFile(SNAPSHOTS_FILE, 'utf8')
  } catch {
    return []
  }
  const out = []
  const lines = text.split('\n')
  for (let index = lines.length - 1; index >= 0 && out.length < limit; index -= 1) {
    const line = lines[index].trim()
    if (!line) continue
    try {
      const row = JSON.parse(line)
      out.push({
        at: str(row.at),
        date: str(row.date),
        rate: num(row.rate, 0.917),
        totals: row.totals ?? totalsOf(normalizeDoc(row)),
        counts: {
          money: Array.isArray(row.money) ? row.money.length : 0,
          devices: Array.isArray(row.devices) ? row.devices.length : 0,
          repos: Array.isArray(row.repos) ? row.repos.length : 0,
          keys: Array.isArray(row.keys) ? row.keys.length : 0,
        },
      })
    } catch {
      // A half-written trailing line is not worth failing the whole panel over.
    }
  }
  return out
}

export const paths = { assets: ASSETS_FILE, snapshots: SNAPSHOTS_FILE, legacy: LEGACY_FILE }
