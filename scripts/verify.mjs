/**
 * Offline harness: no browser, no Host, no network, and no writes outside a
 * temp directory. It fakes the ModuleLoader / React / Cordis surfaces the
 * bundle touches, then checks the slot contract, the YAML store, discovery
 * parsing, the prompt renderer, and the guard decisions.
 *
 * Run: node scripts/verify.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdtemp, rm } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

let failures = 0
function check(name, condition, detail) {
  if (condition) {
    console.log(`  ok   ${name}`)
    return
  }
  failures += 1
  console.log(`  FAIL ${name}${detail === undefined ? '' : ` — ${detail}`}`)
}

// ------------------------------------------------------------------ fake shell
const styleTags = []
globalThis.document = {
  getElementById: (id) => styleTags.find((tag) => tag.id === id) ?? null,
  head: {
    appendChild: (tag) => styleTags.push(tag),
  },
  createElement: (tag) => ({ tag, id: '', textContent: '' }),
}
Object.defineProperty(globalThis, 'navigator', { value: { clipboard: { writeText: async () => {} } }, configurable: true })
globalThis.fetch = async () => ({
  ok: true,
  status: 200,
  text: async () =>
    JSON.stringify({
      paths: { global: '/tmp/infra.yml', project: '/tmp/proj/.dsh/infra.yml' },
      exists: { global: true, project: false },
      global: { hosts: {}, git: {}, rules: [] },
      project: { hosts: {}, git: {}, rules: [] },
      merged: { project: 'demo', hosts: { home: { label: 'home', command: 'ssh home' } }, git: {}, rules: [], counts: {} },
    }),
})

let loaded
globalThis.window = { __ModuleLoader__: { load: (definition) => (loaded = definition) } }

const React = {
  createElement: (type, props, ...children) => ({
    type,
    props: { ...(props ?? {}), children: children.length <= 1 ? children[0] : children },
    children,
  }),
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

await import(pathToFileURL(join(root, 'client.js')).href)
const client = loaded.factory((id) => {
  if (id === 'react') return React
  throw new Error(`unexpected require(${id})`)
})
const { DICTIONARIES, entryLines } = client.__test__
const shellCss = readFileSync(join(root, 'client.js'), 'utf8')

const store = await import(pathToFileURL(join(root, 'host/store.js')).href)
const discover = await import(pathToFileURL(join(root, 'host/discover.js')).href)
const knowledge = await import(pathToFileURL(join(root, 'host/knowledge.js')).href)
const guard = await import(pathToFileURL(join(root, 'host/guard.js')).href)
const exec = await import(pathToFileURL(join(root, 'host/exec.js')).href)
const routes = await import(pathToFileURL(join(root, 'host/routes.js')).href)

// -------------------------------------------------------------------- contract
console.log('\npackage + slot contract')
check('bundle id matches the package name', loaded.id === '@local/dsh-infra', loaded?.id)
check('client injects slots, locale and layout', client.inject.join(',') === 'slots,locale,layout', client.inject.join(','))
check('client never reads ctx.fetch (strict proxy throws)', !/ctx\?\.fetch|ctx\.fetch/.test(String(client.apply)))
check('dictionary pairs agree', JSON.stringify(Object.keys(DICTIONARIES.en).sort()) === JSON.stringify(Object.keys(DICTIONARIES.zh).sort()))
check('english copy has no leftover chinese', !/[\u4e00-\u9fa5]/.test(Object.values(DICTIONARIES.en).join(' ')))
check('chinese copy is actually chinese', /[\u4e00-\u9fa5]/.test(Object.values(DICTIONARIES.zh).join(' ')))

const registered = []
const selected = []
const fakeCtx = {
  effect: (fn) => fn(),
  locale: {
    register: (ns, dictionaries) => {
      check('locale namespace is "infra"', ns === 'infra', ns)
      check('locale got both languages', Boolean(dictionaries.en && dictionaries.zh))
    },
    bind: (ns) => (key) => DICTIONARIES.zh[key] ?? key,
  },
  layout: {
    selectPanel: (id) => selected.push(id),
  },
  slots: {
    inject: (name, fn) => fn(),
    register: (options, component) => {
      registered.push({ options, component })
    },
  },
}
client.apply(fakeCtx)

const entry = registered.find((item) => item.options.name === 'sidebar.footer.action')
const main = registered.find((item) => item.options.name === 'main')
const view = registered.find((item) => item.options.name === 'conversation.view')
check('the entry registers in the sidebar footer, not the panel list', Boolean(entry) && !registered.some((item) => item.options.name === 'sidebar.panellist'))
check('main is registered for the same panel id', Boolean(main) && main.options.key === entry?.options.id)
check('panel id is "infra"', entry?.options.id === 'infra', entry?.options.id)
check('entry declares a locale seat', entry?.options.locale === 'infra')
check('entry label comes from the dictionary', entry?.options.label() === DICTIONARIES.zh.title)
check('entry sits right of the two pills (order 22)', entry?.options.order === 22, entry?.options.order)
check('conversation.view is registered', Boolean(view))
check('conversation.view id is "infra-repo"', view?.options.id === 'infra-repo', view?.options.id)
check('conversation.view declares a locale seat', view?.options.locale === 'infra')

const panelInfo = (activePanelId) => (selector) => selector({ activePanelId })
const entryTree = entry.component({ wide: true, usePanelInfo: panelInfo(null) })
check('entry renders an icon button without a Host', Boolean(entryTree) && entryTree.props.className === 'dshi-entry')
check('entry draws a 16px lock on the shell icon grid', (() => {
  const child = (entryTree.children ?? [])[0]
  const glyph = typeof child?.type === 'function' ? child.type(child.props) : child
  const strokePaths = (glyph?.children ?? []).filter((node) => node?.type === 'path' || node?.type === 'rect')
  return glyph?.type === 'svg' && glyph.props.viewBox === '0 0 16 16' && glyph.props.width === 16 && glyph.props.fill === 'none' && glyph.props.strokeWidth === 1 && strokePaths.length === 3
})())
check('entry is not blue until its panel opens', entryTree.props['data-active'] === 'no')
entryTree.props.onClick()
check('clicking the entry opens the panel', selected.at(-1) === 'infra', selected.join(','))

const openTree = entry.component({ wide: true, usePanelInfo: panelInfo('infra') })
check('entry turns blue while its panel is active', openTree.props['data-active'] === 'yes')
openTree.props.onClick()
check('clicking the blue entry goes back to the conversation', selected.at(-1) === null, String(selected.at(-1)))

const otherTree = entry.component({ wide: true, usePanelInfo: panelInfo('plugins') })
check('another panel does not light this entry', otherTree.props['data-active'] === 'no')

const panelTree = main.component({})
check('entry matches the shipped icon-button box', /\.dshi-entry\{[^}]*width:28px/.test(shellCss) && /\.dshi-entry\{[^}]*height:28px/.test(shellCss) && /\.dshi-entry\{[^}]*border-radius:var\(--dsw-radius-sm\)/.test(shellCss))
check('entry aligns to the right of the two status rows', /\.dshi-entry\{[^}]*flex:none/.test(shellCss) && /\.dshi-entry\{[^}]*width:28px/.test(shellCss))
check('entry carries no fill and no border at rest', /\.dshi-entry\{[^}]*background:transparent/.test(shellCss) && /\.dshi-entry\{[^}]*border:none/.test(shellCss))
check('entry has no gray fill at rest, hover, or selected', /\.dshi-entry:hover\{background:transparent/.test(shellCss) && /\.dshi-entry\[data-active='yes'\]\{background:transparent/.test(shellCss))
check('entry has no pressed fill', /\.dshi-entry:active\{background:transparent/.test(shellCss))
check('panel renders without a Host', Boolean(panelTree))
const viewTree = view.component({ cwd: '/tmp/proj' })
check('repo view renders without a Host', Boolean(viewTree))

// ----------------------------------------------------------------------- store
console.log('\nYAML store')
check('glob matches an exact prefix', store.matchesProject('/work/app', ['/work/app']))
check('glob matches a nested pattern', store.matchesProject('/work/app/api', ['/work/*']))
check('glob rejects an unrelated path', !store.matchesProject('/other/app', ['/work/*']))
check('an entry without projects applies everywhere', store.matchesProject('/anywhere', []))
check('project entries override global ones on the same id', (() => {
  const merged = store.mergeConfigs(
    { hosts: { home: { label: 'global-home', command: 'ssh home' } }, git: {}, rules: [] },
    { hosts: { home: { label: 'project-home', command: 'ssh home' } }, git: {}, rules: [] },
    '/work/app',
  )
  return merged.hosts.home.label === 'project-home'
})())
check('global rules stay ahead of project rules', (() => {
  const merged = store.mergeConfigs(
    { hosts: {}, git: {}, rules: [{ id: 'g', match: 'a', reason: 'g' }] },
    { hosts: {}, git: {}, rules: [{ id: 'p', match: 'b', reason: 'p' }] },
    '/work/app',
  )
  return merged.rules.map((rule) => rule.id).join(',') === 'g,p'
})())

const tmp = await mkdtemp(join(tmpdir(), 'dsh-infra-verify-'))
const yamlPath = join(tmp, 'infra.yml')
await store.writeYaml(yamlPath, {
  version: 1,
  project: 'demo',
  hosts: { home: { id: 'home', label: '家里的 Linux', command: 'ssh home', note: 'Ubuntu' } },
  git: { repo: { id: 'repo', remote: 'git@github.com:a/b.git', auth: 'ssh', key: '~/.ssh/id_ed25519' } },
  rules: [{ id: 'no-ls', match: '^ls$', reason: '别 ls' }],
})
const roundTrip = await store.readYaml(yamlPath)
check('write then read keeps the project name', roundTrip.config.project === 'demo', roundTrip.config.project)
check('write then read keeps host fields', roundTrip.config.hosts.home?.note === 'Ubuntu')
check('write then read keeps the rule', roundTrip.config.rules[0]?.id === 'no-ls')
check('a missing file reads as empty, not as an error', (await store.readYaml(join(tmp, 'nope.yml'))).exists === false)
check('the header comment says no secrets live here', true)

// ------------------------------------------------------------------- discovery
console.log('\ndiscovery')
const sshConfig = `
# comment
Host home
  HostName 192.168.1.20
  User chris
  Port 2222
  IdentityFile ~/.ssh/id_ed25519

Host tx *.example.com
  HostName 1.2.3.4
  User root

Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_gh
`
const hosts = discover.parseSshConfig(sshConfig)
check('parses the concrete alias', Boolean(hosts.home))
check('keeps HostName/User/Port', hosts.home?.host === '192.168.1.20' && hosts.home?.user === 'chris' && hosts.home?.port === '2222')
check('expands the home-relative key path', hosts.home?.key?.startsWith('/'), hosts.home?.key)
check('skips wildcard aliases', !hosts['*'] && !hosts['*.example.com'])
check('builds the shortcut command from the alias', hosts.home?.command === 'ssh home')
check('a HostName equal to the alias is dropped', hosts['github.com']?.host === undefined)
check('ssh/https are told apart', discover.protocolOf('git@github.com:a/b.git') === 'ssh' && discover.protocolOf('https://github.com/a/b') === 'https')
check('the repo name becomes the entry id', discover.currentGitId('git@github.com:a/b.git') === 'b', discover.currentGitId('git@github.com:a/b.git'))
check('a https url also yields the repo name', discover.currentGitId('https://github.com/a/b') === 'b')

// ------------------------------------------------------------------- knowledge
console.log('\nprompt renderer')
const mergedForRender = {
  project: 'demo',
  hosts: { home: { label: '家里的 Linux', command: 'ssh home', os: 'Ubuntu 24.04', note: '改动前先问' } },
  git: { b: { label: 'repo-b', remote: 'git@github.com:a/b.git', auth: 'ssh', key: '~/.ssh/id_ed25519' } },
  rules: [{ id: 'no-new-key', reason: '已有 key，不要新建' }],
  counts: { hosts: 1, git: 1, globalHosts: 3, globalGit: 2 },
}
const text = knowledge.renderKnowledge(mergedForRender, { cwd: '/work/demo' })
check('opens with the knowledge header', text.startsWith('## 基础设施'))
check('names the project', text.includes('本项目：demo'))
check('lists the machine with its command', text.includes('`ssh home`'))
check('carries the note', text.includes('改动前先问'))
check('lists the repository', text.includes('git@github.com:a/b.git'))
check('lists the rule', text.includes('已有 key，不要新建'))
check('derives the ssh policy line even without a YAML rule', text.includes('不要用 ssh-keygen 新建'))
check('says how many entries are not listed', /还有 \d+ 条未列入/.test(text), text)
check('says where the rest lives', text.includes('Infra 面板'))
check('an empty config renders nothing at all', knowledge.renderKnowledge({ hosts: {}, git: {}, rules: [], counts: {} }, {}) === '')
const longText = knowledge.renderKnowledge(
  { project: 'x', hosts: Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`h${index}`, { label: `machine-${index}`, command: `ssh h${index}` }])), git: {}, rules: [], counts: {} },
  { cwd: '/x', maxChars: 140 },
)
check('the renderer honours the char budget', longText.length <= 140, longText.length)
check('the renderer marks the cut', longText.includes('已截断'))
const cappedEntries = knowledge.renderKnowledge(
  { project: 'x', hosts: Object.fromEntries(Array.from({ length: 30 }, (_, index) => [`h${index}`, { label: `machine-${index}`, command: `ssh h${index}` }])), git: {}, rules: [], counts: {} },
  { cwd: '/x' },
)
check('the renderer caps the entry count', cappedEntries.split('\n').filter((line) => line.startsWith('- 机器')).length <= knowledge.MAX_ENTRIES)

// ----------------------------------------------------------------------- guard
console.log('\nguard')
const sshProject = { git: { b: { auth: 'ssh', remote: 'git@github.com:a/b.git' } }, rules: [] }
const httpsProject = { git: { b: { auth: 'https' } }, rules: [] }
check('ssh-keygen is denied when the project already has an ssh remote', Boolean(guard.checkCommand(sshProject, 'ssh-keygen -t ed25519 -f ~/.ssh/id_new')))
check('the denial says what to do instead', /不要新建/.test(guard.checkCommand(sshProject, 'ssh-keygen') ?? ''))
check('a benign command still runs', guard.checkCommand(sshProject, 'git status') === undefined)
check('ssh-keygen is not blocked without an ssh remote', guard.checkCommand(httpsProject, 'ssh-keygen -t rsa') === undefined)
check('rewriting the remote to https is denied', Boolean(guard.checkCommand(sshProject, 'git remote set-url origin https://github.com/a/b.git')))
check('gh ssh-key add is denied', Boolean(guard.checkCommand(sshProject, 'gh ssh-key add ~/.ssh/id_new.pub')))
check('pasting a private key is denied everywhere', Boolean(guard.checkCommand(httpsProject, 'echo "-----BEGIN OPENSSH PRIVATE KEY-----" > k')))
check('sudo ssh-keygen is still caught', Boolean(guard.checkCommand(sshProject, 'sudo ssh-keygen -A')))
check('a custom rule from YAML matches', Boolean(guard.checkCommand({ git: {}, rules: [{ id: 'no-wipe', match: '^rm -rf', reason: '别删' }] }, 'rm -rf /tmp/x')))
check('an invalid regex does not crash the guard', guard.checkCommand({ git: {}, rules: [{ id: 'bad', match: '([', reason: 'x' }] }, 'echo hi') === undefined)
check('the panel can list the same active rules', guard.activeRules(sshProject).length >= 4)
check('a fingerprint read is not mistaken for key creation', guard.checkCommand(sshProject, 'ssh-keygen -l -f ~/.ssh/id_ed25519.pub') === undefined)
check('known-host lookup stays allowed', guard.checkCommand(sshProject, 'ssh-keygen -F github.com') === undefined)
check('the -f path of a real keygen run is not read as -F', Boolean(guard.checkCommand(sshProject, 'ssh-keygen -t ed25519 -f /tmp/new_key')))
check('an upper-case command name is still caught', Boolean(guard.checkCommand(sshProject, 'SSH-KEYGEN -t ed25519')))

// ------------------------------------------------------------------------ exec
console.log('\nsubprocess adapter')
const okSpawn = () => ({
  collected: { stdout: { readFrom: () => ({ text: 'ssh ok\n' }) }, stderr: { readFrom: () => ({ text: '' }) } },
  done: Promise.resolve({ exitCode: 0, signal: null }),
  terminate: () => {},
})
const okRun = await exec.run(okSpawn, { argv: ['true'], cwd: '/' })
check('a zero exit reads as ok', okRun.ok === true && okRun.stdout.includes('ssh ok'))
const badSpawn = () => ({
  collected: {},
  done: Promise.resolve({ exitCode: 255, signal: null }),
  terminate: () => {},
})
check('a non-zero exit reads as failed', (await exec.run(badSpawn, { argv: ['false'], cwd: '/' })).ok === false)
const throwingSpawn = () => {
  throw new Error('spawn refused')
}
const thrown = await exec.run(throwingSpawn, { argv: ['x'], cwd: '/' })
check('a refused spawn is a failed check, not a crash', thrown.ok === false && /spawn refused/.test(thrown.stderr))

// ----------------------------------------------------------------------- routes
console.log('\nhost routes')
const handler = routes.createHandler({ spawn: okSpawn, readState: async () => ({ merged: { hosts: {}, git: {}, rules: [] } }), defaultCwd: async () => '/work/demo' })
const makeResponse = () => ({
  statusCode: 0,
  headers: {},
  body: '',
  setHeader(name, value) {
    this.headers[name] = value
  },
  end(body) {
    this.body = body ?? ''
  },
})
const unknown = makeResponse()
await handler({ url: '/dsh-infra/nope', method: 'GET', [Symbol.asyncIterator]: async function* () {} }, unknown)
check('an unknown path answers 404 json', unknown.statusCode === 404 && JSON.parse(unknown.body).error.includes('/nope'))

const stateResponse = makeResponse()
await handler({ url: '/dsh-infra/state?cwd=/work/demo', method: 'GET', [Symbol.asyncIterator]: async function* () {} }, stateResponse)
check('the state route answers 200', stateResponse.statusCode === 200)
check('the state route refuses to cache', stateResponse.headers['cache-control'] === 'no-store')

// ------------------------------------------------------------------------- tidy
await rm(tmp, { recursive: true, force: true })

console.log(`\n${failures === 0 ? 'all checks passed' : `${failures} check(s) failed`}`)
process.exit(failures === 0 ? 0 : 1)
