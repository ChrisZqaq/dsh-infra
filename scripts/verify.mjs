/**
 * Offline harness: no browser, no Host, no network, no writes outside a temp
 * directory. Fakes ModuleLoader / React / Cordis, then checks the slot
 * contract, the money math, the YAML + JSONL store, and the JSON routes.
 *
 * Run: node scripts/verify.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

let failures = 0
let checks = 0
function check(name, condition, detail) {
  checks += 1
  if (condition) {
    console.log(`  ok   ${name}`)
    return
  }
  failures += 1
  console.log(`  FAIL ${name}${detail === undefined ? '' : ` — ${detail}`}`)
}

// ---------------------------------------------------------------- fake shell
const styleTags = []
globalThis.document = {
  getElementById: (id) => styleTags.find((tag) => tag.id === id) ?? null,
  head: { appendChild: (tag) => styleTags.push(tag) },
  createElement: (tag) => ({
    tag,
    textContent: '',
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = String(value) },
  }),
}
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true })
globalThis.fetch = async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ doc: {}, totals: {}, snapshots: [] }) })

let loaded
globalThis.window = { __ModuleLoader__: { load: (definition) => (loaded = definition) } }

const React = {
  createElement: (type, props, ...children) => ({ type, props: { ...(props ?? {}), children }, children }),
  useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
  useMemo: (factory) => factory(),
  useEffect: () => {},
  useRef: (initial) => ({ current: initial ?? null }),
  useCallback: (fn) => fn,
  Component: class {
    constructor(props) {
      this.props = props
      this.state = {}
    }

    setState(next) {
      this.state = { ...this.state, ...next }
    }
  },
}

const dataDir = await mkdtemp(join(tmpdir(), 'dsh-ledger-data-'))
process.env.DSH_INFRA_DIR = dataDir

await import(pathToFileURL(join(root, 'client.js')).href)
const client = loaded.factory((id) => {
  if (id === 'react') return React
  throw new Error(`unexpected require(${id})`)
})
const { DICTIONARIES, maskKey, totalsOf, amountOf, daysUntil, keysView, moneyView, devicesView, reposView, overviewView, historyView } = client.__test__
const shellCss = readFileSync(join(root, 'client.js'), 'utf8')
check('styles mount synchronously during module materialization', styleTags.length === 1 && styleTags[0]?.tag === 'style' && styleTags[0]?.textContent.includes('.dshi-root{'))
check('styles declare loader ownership', styleTags[0]?.attributes?.['data-plugin-css'] === 'ledger')
check('style mount is not deferred behind a React effect', !/function useStyleOnce|useStyleOnce\(\)/.test(shellCss))
check('factory installs styles before returning the plugin', /installStyles\(\)[\s\S]*return \{[\s\S]*inject: \['slots', 'locale', 'layout'\]/.test(shellCss))

const loadHostModule = async (name) => {
  try {
    return await import(pathToFileURL(join(root, name)).href)
  } catch (error) {
    if (error?.code === 'ERR_MODULE_NOT_FOUND' && String(error.message).includes("'yaml'")) {
      console.log('\n  FAIL host modules imported — 先装依赖：pnpm install（离线可用 pnpm install --offline）\n')
      process.exit(1)
    }
    throw error
  }
}
const store = await loadHostModule('host/store.js')
const github = await loadHostModule('host/github.js')
const routes = await loadHostModule('host/routes.js')
const entryFile = await loadHostModule('index.js')

// ------------------------------------------------------------------- contract
console.log('\npackage + slot contract')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
check('bundle id matches the package name', loaded.id === pkg.name, loaded?.id)
check('client injects slots, locale and layout', client.inject.join(',') === 'slots,locale,layout', client.inject.join(','))
check('client never reads ctx.fetch', !/ctx\.fetch/.test(String(client.apply)))
check('host injects only webServer and subprocess', entryFile.inject.join(',') === 'webServer,subprocess', entryFile.inject.join(','))
check('host no longer touches systemPrompt / tools.guard', !/systemPrompt|tools\.guard|sessionQuery/.test(readFileSync(join(root, 'index.js'), 'utf8')))
check('dictionary pairs agree', JSON.stringify(Object.keys(DICTIONARIES.en).sort()) === JSON.stringify(Object.keys(DICTIONARIES.zh).sort()))
check('english copy has no leftover chinese', !/[\u4e00-\u9fa5]/.test(Object.values(DICTIONARIES.en).join(' ')))
check('chinese copy is actually chinese', /[\u4e00-\u9fa5]/.test(Object.values(DICTIONARIES.zh).join(' ')))
check('every tab has a label', ['overview', 'money', 'devices', 'repos', 'keys', 'history'].every((key) => Boolean(DICTIONARIES.zh[key])))

const registered = []
const selected = []
const fakeCtx = {
  effect: (fn) => fn(),
  locale: {
    register: (ns, dictionaries) => {
      check('locale namespace is "infra"', ns === 'infra', ns)
      check('locale got both languages', Boolean(dictionaries.en && dictionaries.zh))
    },
    bind: () => (key) => DICTIONARIES.zh[key] ?? key,
  },
  layout: { selectPanel: (id) => selected.push(id) },
  slots: {
    inject: (name, fn) => fn(),
    register: (options, component) => registered.push({ options, component }),
  },
}
client.apply(fakeCtx)

const entry = registered.find((item) => item.options.name === 'sidebar.footer.action')
const main = registered.find((item) => item.options.name === 'main')
check('the entry registers in the sidebar footer', Boolean(entry) && !registered.some((item) => item.options.name === 'sidebar.panellist'))
check('main is registered for the same panel id', Boolean(main) && main.options.key === entry?.options.id)
check('panel id is "infra" (keeps the existing layout seat)', entry?.options.id === 'infra', entry?.options.id)
check('entry sits right of the two pills (order 22)', entry?.options.order === 22, entry?.options.order)
check('entry label comes from the dictionary', entry?.options.label() === DICTIONARIES.zh.title)
check('the retired conversation.view is gone', !registered.some((item) => item.options.name === 'conversation.view'))

const panelInfo = (activePanelId) => (selector) => selector({ activePanelId })
const entryTree = entry.component({ wide: true, usePanelInfo: panelInfo(null) })
check('entry renders without a Host', Boolean(entryTree) && entryTree.props.className === 'dshi-entry')
check('entry is not active until its panel opens', entryTree.props['data-active'] === 'no')
check('entry draws a 16px dollar on the shell icon grid', (() => {
  const glyph = entryTree.children[0]
  const strokes = (glyph?.children ?? []).filter((node) => node?.type === 'path')
  return glyph?.type === 'svg' && glyph.props.viewBox === '0 0 16 16' && glyph.props.width === 16 && glyph.props.fill === 'none' && strokes.length === 2
})())
entryTree.props.onClick()
check('clicking the entry opens the panel', selected.at(-1) === 'infra', selected.join(','))
const openTree = entry.component({ wide: true, usePanelInfo: panelInfo('infra') })
check('entry marks itself active while the panel shows', openTree.props['data-active'] === 'yes')
openTree.props.onClick()
check('clicking the active entry closes the panel', selected.at(-1) === null, String(selected.at(-1)))
check('icon button keeps the shipped 28px box', /\.dshi-entry\{[^}]*width:28px/.test(shellCss) && /\.dshi-entry\{[^}]*height:28px/.test(shellCss) && /\.dshi-entry\{[^}]*border-radius:var\(--dsw-radius-sm\)/.test(shellCss))
check('icon button carries no fill or border', /\.dshi-entry\{[^}]*background:transparent/.test(shellCss) && /\.dshi-entry\{[^}]*border:none/.test(shellCss))
check('panel renders without a Host', Boolean(main.component({})))

// ---------------------------------------------------------------- money math
console.log('\nmoney math')
const doc = {
  rate: { HKD_CNY: 0.9 },
  money: [
    { id: 'a', name: '现金', kind: '现金', currency: 'CNY', quantity: 1, price: 10000 },
    { id: 'b', name: '股票', kind: '持仓', currency: 'CNY', quantity: 2, price: 2500 },
    { id: 'c', name: '港币', kind: '现金', currency: 'HKD', quantity: 1, price: 1000 },
    { id: 'd', name: '房贷', kind: '负债', currency: 'CNY', quantity: 1, price: 4000 },
  ],
  devices: [],
  repos: [],
  keys: [],
}
const totals = totalsOf(doc)
check('same-currency amount ignores sign in input', amountOf({ quantity: -3, price: 100 }) === 300, String(amountOf({ quantity: -3, price: 100 })))
check('cash adds only 现金', totals.cash === 10000 + 900, String(totals.cash))
check('holdings add only 持仓', totals.holdings === 5000, String(totals.holdings))
check('assets = cash + holdings', totals.assets === totals.cash + totals.holdings, String(totals.assets))
check('liabilities stay negative', totals.liability === -4000, String(totals.liability))
check('net = assets - liabilities', totals.net === totals.assets - 4000, String(totals.net))
check('per-currency subtotals stay native', totals.cny === 10000 + 5000 + 4000 && totals.hkd === 1000, `${totals.cny}/${totals.hkd}`)
check('a zero rate falls back instead of dividing by zero', totalsOf({ rate: { HKD_CNY: 0 }, money: [{ kind: '现金', currency: 'HKD', quantity: 1, price: 100 }] }).cash > 0)
const storeTotals = store.totalsOf({ rate: { HKD_CNY: 0.9 }, money: doc.money })
check('client and host agree on totals', Math.abs(storeTotals.net - totals.net) < 1e-6, `${storeTotals.net} vs ${totals.net}`)
check('missing numbers read as zero', totalsOf({ money: [{ kind: '现金', currency: 'CNY' }] }).net === 0)

// --------------------------------------------------------------- key masking
console.log('\nkey masking')
check('short keys hide completely', maskKey('abc') === '***', maskKey('abc'))
check('mid keys keep two on each side', maskKey('sk-12345') === 'sk*****45', maskKey('sk-12345'))
check('long keys keep four on each side', maskKey('sk-abcdefghijklmnop') === 'sk-a*****mnop', maskKey('sk-abcdefghijklmnop'))
check('empty stays empty', maskKey('') === '' && maskKey(undefined) === '')
check('an eight-char key never shows six of its chars', maskKey('abcd1234').replace(/\*/g, '').length <= 4, maskKey('abcd1234'))
const keyDoc = { keys: [{ id: 'k1', name: 'OpenAI', purpose: '文本', value: 'sk-aaaaaaaaaaaaaaaa', location: '1Password', expiresAt: '2000-01-01' }] }
const countChildren = (node) => (Array.isArray(node?.children) ? node.children.filter((child) => child !== null && child !== undefined && child !== false).length : -1)
const byType = (node, type, out = []) => {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) { node.forEach((child) => byType(child, type, out)); return out }
  if (typeof node.type === 'function') return byType(node.type(node.props), type, out)
  if (node.type === type) out.push(node)
  byType(node.children, type, out)
  return out
}
const renderKeys = (revealed) => keysView(keyDoc, () => {}, (key) => DICTIONARIES.zh[key] ?? key, revealed, () => {}, '', () => {})
const flat = (node) => {
  if (node === null || node === undefined || node === false) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(flat).join(' ')
  if (typeof node.type === 'function') return flat(node.type(node.props))
  if (node.type === 'input' || node.type === 'select') return String(node.props?.value ?? '') + ' ' + flat(node.children)
  return flat(node.children)
}
const maskedRow = flat(renderKeys({}))
const openRow = flat(renderKeys({ k1: true }))
check('the key list never prints the full secret', !maskedRow.includes('sk-aaaaaaaaaaaaaaaa'), maskedRow.slice(0, 120))
check('the key list shows the mask instead', maskedRow.includes('sk-a*****aaaa') || maskedRow.includes('*****'), maskedRow.slice(0, 120))
check('revealing swaps in the real value', openRow.includes('sk-aaaaaaaaaaaaaaaa'))
check('an expired key is flagged', maskedRow.includes(DICTIONARIES.zh.expired) || maskedRow.includes('expired'), maskedRow.slice(-160))
// 每一行的子元素个数必须等于 CSS 里声明的列数，否则表头与数据行会错位
const COLUMNS = { money: 7, device: 6, repo: 5, key: 7 }
const byCss = (node, cols, out = []) => {
  if (!node || typeof node !== 'object') return out
  if (Array.isArray(node)) { node.forEach((child) => byCss(child, cols, out)); return out }
  if (node.props?.['data-cols'] === cols) out.push(node)
  byCss(node.children, cols, out)
  return out
}
const tZh = (key) => DICTIONARIES.zh[key] ?? key
const sampleDoc = {
  rate: { HKD_CNY: 0.917 },
  money: [{ id: 'm1', name: '现金', kind: '现金', currency: 'CNY', quantity: 1, price: 100, note: '' }],
  devices: [{ id: 'd1', name: 'tx', type: '服务器', address: 'ssh tx', specs: '2C2G', status: '在线', note: '' }],
  repos: [{ id: 'r1', name: 'a/b', visibility: 'public', language: 'JS', committedAt: '2026-11-13', description: '', remote: '', note: '' }],
  keys: [{ id: 'k1', name: 'k', purpose: 'p', value: 'sk-aaaaaaaaaaaaaaaa', location: 'l', expiresAt: '' }],
}
const views = [
  ['money', moneyView(sampleDoc, () => {}, tZh)],
  ['device', devicesView(sampleDoc, () => {}, tZh)],
  ['repo', reposView(sampleDoc, () => {}, tZh, () => {}, false)],
  ['key', keysView(sampleDoc, () => {}, tZh, {}, () => {}, '', () => {})],
]
for (const [cols, tree] of views) {
  const found = byCss(tree, cols)
  const header = found[0]
  const body = found.slice(1)
  check('a ' + cols + ' table has a header and one row per item', found.length === 2, String(found.length))
  check(cols + ' header columns match the css template', countChildren(header) === COLUMNS[cols], String(countChildren(header)))
  check(cols + ' body columns match the css template', body.every((row) => countChildren(row) === COLUMNS[cols]), body.map(countChildren).join(','))
}
check('secret actions use a div, never nested buttons', byCss(renderKeys({}), 'key')[1].children[5].type === 'div')
check('secret controls have accessible labels', byType(renderKeys({}), 'button').filter((button) => ['查看 OpenAI', '复制 OpenAI'].includes(button.props['aria-label'])).length === 2, byType(renderKeys({}), 'button').map((button) => button.props['aria-label']).join(','))
check('narrow tables scroll inside their own container', /\.dshi-table\{[^}]*overflow-x:auto/.test(shellCss) && /@container \(max-width:480px\)/.test(shellCss))
check('trend has a readable summary and reduced motion support', byType(overviewView(sampleDoc, [], tZh), 'svg').every((svg) => svg.props['aria-label']) && /prefers-reduced-motion/.test(shellCss))
check('clipboard is requested only when the copy action is invoked', await (async () => {
  let value = ''
  navigator.clipboard.writeText = async (text) => { value = text }
  let copied = ''
  const tree = keysView(keyDoc, () => {}, tZh, {}, () => {}, copied, (id) => { copied = id })
  const row = byCss(tree, 'key')[1]
  await row.children[5].children[1].props.onClick()
  return value === keyDoc.keys[0].value && copied === 'k1' && !flat(renderKeys({})).includes(keyDoc.keys[0].value)
})())
check('history and overview render before any snapshot exists', Boolean(flat(historyView([], tZh)) && flat(overviewView(sampleDoc, [], tZh))))
const snapshots = [
  { at: '2026-11-13T04:00:00Z', date: '2026-11-13', totals: { net: 130 }, counts: { money: 1 } },
  { at: '2026-11-12T04:00:00Z', date: '2026-11-12', totals: { net: 100 }, counts: { money: 1 } },
]
check('history shows the latest delta against the next row', flat(historyView(snapshots, tZh)).includes('30.00'), flat(historyView(snapshots, tZh)))
let navigated = ''
const overview = overviewView(sampleDoc, snapshots, tZh, (tab) => { navigated = tab })
check('overview has a native SVG trend and no chart dependency', byType(overview, 'svg').length > 0 && !/recharts|chart\.js/i.test(readFileSync(join(root, 'package.json'), 'utf8')), String(byType(overview, 'svg').length))
const resources = byType(overview, 'button').filter((button) => button.props.className === 'dshi-resource')
resources[0].props.onClick()
check('overview resource links navigate without routing overhead', navigated === 'devices', navigated)
check('expiry in the past is negative', daysUntil('2000-01-01') < 0)
check('no expiry is undefined', daysUntil('') === undefined && daysUntil(undefined) === undefined)

// -------------------------------------------------------------------- store
console.log('\nassets store')
const emptyRound = await store.readDoc()
check('a missing assets.yml reads as an empty doc', Array.isArray(emptyRound.money) && emptyRound.money.length === 0)
check('default rate is populated', Number(emptyRound.rate.HKD_CNY) > 0, String(emptyRound.rate.HKD_CNY))

const written = await store.writeDoc(doc)
check('write stamps updatedAt', Boolean(written.updatedAt))
const text = await readFile(store.ASSETS_FILE, 'utf8')
check('assets.yml explains itself', text.startsWith('# dsh-ledger'))
check('assets.yml lives outside the package', !store.ASSETS_FILE.startsWith(root), store.ASSETS_FILE)
const reread = await store.readDoc()
check('round trip keeps every money row', reread.money.length === 4, String(reread.money.length))
check('round trip keeps numbers as numbers', typeof reread.money[1].price === 'number' && reread.money[1].price === 2500)
check('round trip keeps the rate', reread.rate.HKD_CNY === 0.9, String(reread.rate.HKD_CNY))
check('unknown kinds are coerced, not trusted', store.normalizeDoc({ money: [{ name: 'x', kind: '乱写', currency: 'USD' }] }).money[0].kind === '现金')
check('a non-array collection does not throw', store.normalizeDoc({ money: 'nope' }).money.length === 0)
check('a broken yaml surfaces a readable error', await (async () => {
  await writeFile(store.ASSETS_FILE, 'money: [\n', 'utf8')
  try {
    await store.readDoc()
    return false
  } catch (error) {
    return /解析失败/.test(String(error?.message))
  }
})())
await store.writeDoc(doc)

const snapA = await store.appendSnapshot(doc)
check('snapshot carries a date', /^\d{4}-\d{2}-\d{2}$/.test(snapA.date), snapA.date)
check('snapshot stores full copies, not a diff', Array.isArray(snapA.money) && snapA.money.length === 4)
check('snapshot freezes its own totals', snapA.totals.net === totals.net, String(snapA.totals.net))
const bigger = { ...doc, money: [...doc.money, { id: 'e', name: '加仓', kind: '持仓', currency: 'CNY', quantity: 1, price: 1000 }] }
await store.appendSnapshot(bigger)
const history = await store.readSnapshots()
check('history is newest first', history.length === 2 && history[0].totals.net > history[1].totals.net, JSON.stringify(history.map((row) => row.totals.net)))
check('history rows are light', history[0].money === undefined && Boolean(history[0].counts))
check('history counts match what was saved', history[0].counts.money === 5, String(history[0].counts.money))
check('history honours the limit', (await store.readSnapshots(1)).length === 1)
check('a corrupt line is skipped, not fatal', await (async () => {
  const raw = await readFile(store.SNAPSHOTS_FILE, 'utf8')
  await writeFile(store.SNAPSHOTS_FILE, `${raw}{\"at\": oops\n`, 'utf8')
  return (await store.readSnapshots()).length === 2
})())

// ---------------------------------------------------------------- gh bridge
console.log('\ngh bridge')
check('visibility is normalised', github.mergeRepos([], [{ id: 'r', name: 'a/b', visibility: 'private' }])[0].visibility === 'private')
const mergedRepos = github.mergeRepos(
  [{ id: 'r1', name: 'a/b', note: '手写备注', visibility: 'public' }],
  [{ id: 'r1', name: 'a/b', note: '', visibility: 'private', language: 'Go' }],
)
check('remote facts overwrite the local copy', mergedRepos[0].visibility === 'private' && mergedRepos[0].language === 'Go')
check('the hand-written note survives a sync', mergedRepos[0].note === '手写备注', mergedRepos[0].note)
check('a repo missing from GitHub is kept', github.mergeRepos([{ id: 'gone', name: 'x/y' }], []).length === 1)

// ------------------------------------------------------------------- routes
console.log('\nJSON routes')
const spawnOf = (result) => (spec) => ({
  done: Promise.resolve(result.outcome ?? { exitCode: 0 }),
  terminate: () => {},
  collected: {
    stdout: { readFrom: () => ({ text: result.stdout ?? '' }) },
    stderr: { readFrom: () => ({ text: result.stderr ?? '' }) },
  },
})

async function ask(handler, method, path, body) {
  const request = {
    method,
    url: `/dsh-ledger${path}`,
    async *[Symbol.asyncIterator]() {
      if (body !== undefined) yield Buffer.from(JSON.stringify(body))
    },
  }
  const out = { status: 0, payload: undefined }
  const response = {
    statusCode: 0,
    setHeader: () => {},
    end: (text) => {
      out.status = response.statusCode
      out.payload = JSON.parse(text)
    },
  }
  await handler(request, response)
  return out
}

await store.writeDoc(doc)
const handler = routes.createHandler({ spawn: spawnOf({ stdout: '[]' }) })
const got = await ask(handler, 'GET', '/assets')
check('GET /assets returns doc, totals and paths', got.status === 200 && Boolean(got.payload.doc) && Boolean(got.payload.totals) && Boolean(got.payload.paths.assets))
check('GET /assets never leaks the key values into totals', !JSON.stringify(got.payload.totals).includes('sk-'))
const savedGone = await ask(handler, 'POST', '/assets', { doc: { ...doc, money: doc.money.slice(0, 1) }, snapshot: true })
check('POST /assets persists', savedGone.status === 200 && savedGone.payload.doc.money.length === 1)
check('POST /assets with snapshot:true appends one row', (await store.readSnapshots()).length === 3)
const savedNoSnap = await ask(handler, 'POST', '/assets', { doc })
check('POST /assets without snapshot leaves history alone', savedNoSnap.payload.snapshot === undefined && (await store.readSnapshots()).length === 3)
const snapList = await ask(handler, 'GET', '/snapshots?limit=1')
check('GET /snapshots honours limit', snapList.status === 200 && snapList.payload.snapshots.length === 1)
check('unknown route answers 404', (await ask(handler, 'GET', '/nope')).status === 404)

const failing = routes.createHandler({ spawn: spawnOf({ outcome: { exitCode: 1 }, stderr: 'gh: not logged in' }) })
const syncFail = await ask(failing, 'POST', '/github/sync')
check('a broken gh is a 502 with the real message', syncFail.status === 502 && /not logged in/.test(syncFail.payload.error), JSON.stringify(syncFail.payload))
const syncOk = routes.createHandler({
  spawn: spawnOf({
    stdout: JSON.stringify([{ nameWithOwner: 'ChrisZqaq/demo', visibility: 'PUBLIC', primaryLanguage: { name: 'JavaScript' }, updatedAt: '2026-11-01T10:00:00Z', description: 'demo', url: 'https://github.com/ChrisZqaq/demo' }]),
  }),
})
const syncDone = await ask(syncOk, 'POST', '/github/sync')
check('POST /github/sync folds repos in', syncDone.status === 200 && syncDone.payload.doc.repos.length === 1, JSON.stringify(syncDone.payload).slice(0, 200))
check('sync reports how many it saw', syncDone.payload.synced === 1)
check('sync keeps the ssh remote shape', syncDone.payload.doc.repos[0].remote === 'git@github.com:ChrisZqaq/demo', syncDone.payload.doc.repos[0].remote)

// ------------------------------------------------------------------- legacy
console.log('\nlegacy import')
await rm(store.ASSETS_FILE, { force: true })
await mkdir(dirname(store.LEGACY_FILE), { recursive: true })
await writeFile(store.LEGACY_FILE, 'hosts:\n  home:\n    label: 家里的 Linux\n    command: ssh home\n    os: Ubuntu 26.04\ngit:\n  dsh-token-pill:\n    remote: git@github.com:ChrisZqaq/dsh-token-pill.git\nrules: []\n', 'utf8')
const imported = await store.readDoc()
check('legacy hosts become devices', imported.devices.length === 1 && /ssh home/.test(imported.devices[0].address), JSON.stringify(imported.devices))
check('legacy remotes become repos', imported.repos.length === 1 && /dsh-token-pill/.test(imported.repos[0].name))
check('the import is written once and then read from assets.yml', Boolean((await readFile(store.ASSETS_FILE, 'utf8')).includes('家里的 Linux')))

await rm(dataDir, { recursive: true, force: true })

console.log(failures === 0 ? `\n${checks} checks passed` : `\n${failures} of ${checks} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
