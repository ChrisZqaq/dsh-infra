window.__ModuleLoader__.load({
  id: '@local/dsh-infra',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useRef, useState } = React

    const NS = 'infra'
    const PANEL_ID = 'infra'
    const VIEW_ID = 'infra-repo'
    const ROUTE = '/dsh-infra'

    const DICTIONARIES = {
      en: {
        title: 'Infra',
        repo: 'Repo',
        machines: 'Machines',
        rules: 'Rules',
        empty: 'Nothing here yet. Use Discover, or add an entry by hand.',
        emptyRules: 'No rules. Agents are free to guess.',
        discover: 'Discover',
        discovering: 'Scanning…',
        refresh: 'Refresh',
        copy: 'Copy',
        copied: 'Copied',
        check: 'Check',
        checking: 'Checking…',
        add: 'Add',
        save: 'Save',
        remove: 'Remove',
        cancel: 'Cancel',
        edit: 'Edit',
        newEntry: 'New entry',
        newRule: 'New rule',
        candidates: 'Found on this machine',
        noneFound: 'Nothing new found.',
        kindHosts: 'machine',
        kindGit: 'repository',
        label: 'Label',
        command: 'Command',
        host: 'Host',
        user: 'User',
        port: 'Port',
        note: 'Note',
        os: 'OS',
        specs: 'Specs',
        checkCmd: 'Check command',
        remote: 'Remote',
        auth: 'Auth',
        key: 'Key',
        rule: 'Rule',
        match: 'Match (regex)',
        reason: 'Why',
        project: 'Project',
        cwd: 'Workspace',
        paths: 'Files',
        failed: 'Infra could not load',
        unconfigured: 'No infra.yml yet',
        ssh: 'SSH',
        https: 'HTTPS',
        switchSsh: 'Switch to SSH',
        switching: 'Switching…',
        identity: 'Commit identity',
        name: 'Name',
        email: 'Email',
        saveIdentity: 'Save identity',
        identitySaved: 'Identity saved',
        clone: 'Copy clone command',
        unknownAuth: 'unknown',
        health: 'Health',
        ok: 'ok',
        bad: 'failed',
        unchecked: 'not checked',
        added: 'Added',
      },
      zh: {
        title: 'Infra',
        repo: '仓库',
        machines: '机器',
        rules: '规则',
        empty: '还没有条目。点“发现”，或手工添加一条。',
        emptyRules: '没有规则，agent 只能靠猜。',
        discover: '发现',
        discovering: '扫描中…',
        refresh: '刷新',
        copy: '复制',
        copied: '已复制',
        check: '测活',
        checking: '探测中…',
        add: '添加',
        save: '保存',
        remove: '删除',
        cancel: '取消',
        edit: '编辑',
        newEntry: '新建条目',
        newRule: '新建规则',
        candidates: '本机发现',
        noneFound: '没有新发现。',
        kindHosts: '机器',
        kindGit: '仓库',
        label: '名称',
        command: '命令',
        host: '主机',
        user: '用户',
        port: '端口',
        note: '备注',
        os: '系统',
        specs: '配置',
        checkCmd: '探活命令',
        remote: '远端',
        auth: '认证',
        key: '密钥',
        rule: '规则',
        match: '匹配（正则）',
        reason: '原因',
        project: '项目',
        cwd: '工作目录',
        paths: '配置位置',
        failed: 'Infra 加载失败',
        unconfigured: '还没有 infra.yml',
        ssh: 'SSH',
        https: 'HTTPS',
        switchSsh: '切换到 SSH',
        switching: '切换中…',
        identity: '提交身份',
        name: '名字',
        email: '邮箱',
        saveIdentity: '保存身份',
        identitySaved: '身份已保存',
        clone: '复制 clone 命令',
        unknownAuth: '未知',
        health: '探活',
        ok: '通过',
        bad: '失败',
        unchecked: '未检测',
        added: '已添加',
      },
    }

    const STYLES = `
.dshi-root{display:flex;flex-direction:column;gap:0;padding:20px 24px 36px;max-width:980px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.dshi-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dshi-title{font-size:18px;font-weight:600;margin-right:auto;letter-spacing:-.01em}
.dshi-path{color:var(--dsw-alias-label-tertiary);font-size:11px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace}
.dshi-btn{border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer}
.dshi-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshi-btn:active{background:var(--dsw-alias-interactive-bg-active)}
.dshi-btn[disabled]{opacity:.5;cursor:default}
.dshi-btn[data-variant="primary"]{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.dshi-card{border:0;border-radius:0;background:transparent;overflow:hidden}
.dshi-cardhead{display:flex;align-items:center;gap:8px;padding:20px 0 8px;border-bottom:0;font-weight:600;font-size:12px}
.dshi-count{color:var(--dsw-alias-label-tertiary);font-weight:400}
.dshi-row{display:flex;align-items:flex-start;gap:10px;padding:12px 0;border-bottom:0.5px solid var(--dsw-alias-border-l1)}
.dshi-row:last-child{border-bottom:0}
.dshi-dot{width:7px;height:7px;border-radius:50%;margin-top:6px;flex:none;background:var(--dsw-alias-label-tertiary)}
.dshi-dot[data-state="ok"]{background:var(--dsw-alias-state-success-primary)}
.dshi-dot[data-state="bad"]{background:var(--dsw-alias-state-error-primary)}
.dshi-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:3px}
.dshi-name{font-weight:500}
.dshi-code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-all}
.dshi-meta{color:var(--dsw-alias-label-tertiary);font-size:11px;word-break:break-all}
.dshi-actions{display:flex;gap:2px;opacity:0;transition:opacity .12s;flex:none;flex-wrap:wrap;justify-content:flex-end}
.dshi-row:hover .dshi-actions,.dshi-row:focus-within .dshi-actions{opacity:1}
.dshi-row .dshi-btn{border:0;background:transparent;padding:3px 7px;color:var(--dsw-alias-label-secondary);border-radius:6px}
.dshi-row .dshi-btn:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-label-primary)}
.dshi-chip{display:inline-block;padding:1px 7px;border-radius:999px;border:0.5px solid var(--dsw-alias-border-l2);font-size:11px;color:var(--dsw-alias-label-secondary)}
.dshi-field{display:flex;flex-direction:column;gap:4px;padding:0 12px 10px}
.dshi-field label{font-size:11px;color:var(--dsw-alias-label-tertiary)}
.dshi-input{border:0.5px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);padding:6px 8px;font-size:12px;font-family:inherit}
.dshi-form{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:12px}
.dshi-form .dshi-wide{grid-column:1 / -1}
.dshi-note{color:var(--dsw-alias-label-tertiary);font-size:11px;padding:0 12px 10px}
.dshi-root > .dshi-field{padding:20px 0 4px}
.dshi-root > .dshi-meta{padding-top:4px}
.dshi-error{color:var(--dsw-alias-state-error-primary);font-size:12px}
.dshi-warn{color:var(--dsw-alias-state-warn-primary);font-size:12px}
.dshi-empty{padding:14px 0;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dshi-view{display:flex;flex-direction:column;gap:0;padding:20px 24px;max-width:760px;color:var(--dsw-alias-label-primary);font-size:13px}
.dshi-kv{display:grid;grid-template-columns:96px 1fr;gap:6px 12px;padding:12px}
.dshi-kv dt{color:var(--dsw-alias-label-tertiary);font-size:12px}
.dshi-kv dd{margin:0;word-break:break-all}
.dshi-entry{display:inline-flex;align-items:center;justify-content:center;flex:none;
  width:28px;height:28px;padding:0;border:none;background:transparent;border-radius:var(--dsw-radius-sm);
  color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshi-entry:hover{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshi-entry:active{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshi-entry[data-active='yes']{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshi-entry:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}
`

    // --------------------------------------------------------------- entries

    /**
     * The footer hands its entries only `{ wide }`, so the icon cannot learn
     * from its own props whether the panel is on screen. The shell passes
     * `usePanelInfo` as a standard prop, which is the same subscription the
     * shipped panel rows use — reading it keeps the icon honest even when the
     * panel is restored on boot, and costs no local state.
     */
    const selectActive = (info) => info?.activePanelId === PANEL_ID

    /** 16px lock drawn on the 0 0 16 16 grid the rest of the shell uses. */
    function LockIcon(props) {
      const edge = typeof props?.size === 'number' ? props.size : 16
      return h(
        'svg',
        {
          width: edge,
          height: edge,
          viewBox: '0 0 16 16',
          fill: 'none',
          'aria-hidden': 'true',
          strokeWidth: 1,
          stroke: 'currentColor',
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
        },
        h('path', { d: 'M5.4 7.1V5.7a2.6 2.6 0 0 1 5.2 0v1.4' }),
        h('rect', { x: '3.6', y: '7.1', width: '8.8', height: '6.4', rx: '1.7' }),
        h('path', { d: 'M8 10.1v1.4' }),
      )
    }

    function makeEntry(ctx, t) {
      function InfraEntry(props) {
        useStyleOnce()
        const active = Boolean(props.usePanelInfo?.(selectActive))
        return h(
          'button',
          {
            type: 'button',
            className: 'dshi-entry',
            'data-active': active ? 'yes' : 'no',
            title: t('title'),
            'aria-label': t('title'),
            'aria-pressed': active ? 'true' : 'false',
            onClick: () => ctx.layout.selectPanel(active ? null : PANEL_ID),
          },
          h(LockIcon, { size: 16 }),
        )
      }
      return InfraEntry
    }

    function useStyleOnce() {
      useEffect(() => {
        const id = 'dshi-styles'
        if (document.getElementById(id)) return
        const style = document.createElement('style')
        style.id = id
        style.textContent = STYLES
        document.head.appendChild(style)
      }, [])
    }

    async function request(path, init) {
      const response = await fetch(`${ROUTE}${path}`, {
        credentials: 'same-origin',
        cache: 'no-store',
        ...init,
        ...(init?.body ? { headers: { 'content-type': 'application/json', ...(init.headers ?? {}) } } : {}),
      })
      const text = await response.text()
      let payload
      try {
        payload = text ? JSON.parse(text) : {}
      } catch {
        throw new Error(`infra route returned non-JSON: ${text.slice(0, 120)}`)
      }
      if (!response.ok) throw new Error(payload?.error ? String(payload.error) : `infra route answered ${response.status}`)
      return payload
    }

    const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) })

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        return false
      }
    }

    function stateSummary(state) {
      if (!state) return undefined
      return state.merged
    }

    function entryLines(kind, entry) {
      const lines = []
      if (kind === 'hosts') {
        if (entry.command) lines.push(entry.command)
        const facts = [entry.host, entry.user, entry.port ? `:${entry.port}` : undefined].filter(Boolean).join(' ')
        if (facts) lines.push(facts)
        if (entry.key) lines.push(entry.key)
      } else {
        if (entry.remote) lines.push(entry.remote)
        if (entry.key) lines.push(entry.key)
      }
      return lines
    }

    function Row({ kind, entry, health, t, onCopy, onCheck, onEdit, onRemove }) {
      const [copied, setCopied] = useState(false)
      const state = health === true ? 'ok' : health === false ? 'bad' : 'unknown'
      return h(
        'div',
        { className: 'dshi-row' },
        h('span', { className: 'dshi-dot', 'data-state': state, title: t(state === 'ok' ? 'ok' : state === 'bad' ? 'bad' : 'unchecked') }),
        h(
          'div',
          { className: 'dshi-main' },
          h(
            'div',
            { className: 'dshi-name' },
            entry.label ?? entry.id,
            kind === 'git' && entry.auth
              ? h('span', { className: 'dshi-chip', style: { marginLeft: 8 } }, entry.auth === 'ssh' ? t('ssh') : entry.auth === 'https' ? t('https') : String(entry.auth))
              : null,
          ),
          ...entryLines(kind, entry).map((line, index) => h('div', { key: index, className: index === 0 ? 'dshi-code' : 'dshi-meta' }, line)),
          entry.note ? h('div', { className: 'dshi-meta' }, entry.note) : null,
        ),
        h(
          'div',
          { className: 'dshi-actions' },
          entry.command
            ? h(
                'button',
                {
                  className: 'dshi-btn',
                  type: 'button',
                  onClick: async () => {
                    if (await onCopy(entry.command)) {
                      setCopied(true)
                      setTimeout(() => setCopied(false), 1200)
                    }
                  },
                },
                copied ? t('copied') : t('copy'),
              )
            : null,
          h('button', { className: 'dshi-btn', type: 'button', onClick: () => onCheck(kind, entry.id) }, t('check')),
          h('button', { className: 'dshi-btn', type: 'button', onClick: () => onEdit(kind, entry) }, t('edit')),
          h('button', { className: 'dshi-btn', type: 'button', onClick: () => onRemove(kind, entry.id) }, t('remove')),
        ),
      )
    }

    function Editor({ kind, draft, t, onChange, onSave, onCancel }) {
      const fields =
        kind === 'hosts'
          ? [
              ['label', t('label')],
              ['command', t('command')],
              ['host', t('host')],
              ['user', t('user')],
              ['port', t('port')],
              ['note', t('note')],
              ['os', t('os')],
              ['specs', t('specs')],
              ['check', t('checkCmd')],
            ]
          : [
              ['label', t('label')],
              ['remote', t('remote')],
              ['auth', t('auth')],
              ['key', t('key')],
              ['rule', t('rule')],
              ['note', t('note')],
            ]
      return h(
        'div',
        { className: 'dshi-form' },
        h('div', { className: 'dshi-wide dshi-meta' }, `${t(kind === 'hosts' ? 'kindHosts' : 'kindGit')} · ${draft.id}`),
        ...fields.map(([name, label]) =>
          h(
            'div',
            { key: name, className: name === 'command' || name === 'remote' || name === 'rule' || name === 'note' ? 'dshi-wide dshi-field' : 'dshi-field' },
            h('label', null, label),
            h('input', {
              className: 'dshi-input',
              value: draft[name] ?? '',
              onChange: (event) => onChange(name, event.target.value),
            }),
          ),
        ),
        h(
          'div',
          { className: 'dshi-wide dshi-actions', style: { justifyContent: 'flex-end' } },
          h('button', { className: 'dshi-btn', type: 'button', onClick: onCancel }, t('cancel')),
          h('button', { className: 'dshi-btn', type: 'button', 'data-variant': 'primary', onClick: onSave }, t('save')),
        ),
      )
    }

    function makePanel(ctx, t) {
      function Panel() {
        useStyleOnce()
        const [state, setState] = useState(undefined)
        const [error, setError] = useState(undefined)
        const [busy, setBusy] = useState('')
        const [health, setHealth] = useState({})
        const [editing, setEditing] = useState(undefined)
        const [discovered, setDiscovered] = useState(undefined)
        const [cwd, setCwd] = useState('')
        const alive = useRef(true)

        useEffect(() => {
          alive.current = true
          return () => {
            alive.current = false
          }
        }, [])

        const load = useCallback(async (workspace) => {
          try {
            const query = workspace ? `?cwd=${encodeURIComponent(workspace)}` : ''
            const next = await request(`/state${query}`)
            if (alive.current) {
              setState(next)
              setError(undefined)
              if (!workspace && next.paths?.project) setCwd('')
            }
          } catch (failure) {
            if (alive.current) setError(String(failure?.message ?? failure))
          }
        }, [])

        useEffect(() => {
          void load(cwd)
        }, [load, cwd])

        const merged = stateSummary(state)
        const hosts = Object.entries(merged?.hosts ?? {})
        const git = Object.entries(merged?.git ?? {})
        const rules = merged?.rules ?? []

        const mutate = async (label, action) => {
          setBusy(label)
          try {
            const next = await action()
            if (alive.current && next) setState(next)
            setError(undefined)
          } catch (failure) {
            if (alive.current) setError(String(failure?.message ?? failure))
          } finally {
            if (alive.current) setBusy('')
          }
        }

        const runCheck = (kind, id) =>
          mutate(`check:${id}`, async () => {
            const result = await post('/check', { cwd: cwd || undefined, ids: [{ kind, id }] })
            const found = result.results?.find((item) => item.id === id)
            if (alive.current) setHealth((prev) => ({ ...prev, [`${kind}:${id}`]: found ? Boolean(found.ok) : false }))
            return undefined
          })

        const saveEntry = () =>
          mutate('save', async () => {
            const value = Object.fromEntries(Object.entries(editing.draft).filter(([key, val]) => key !== 'id' && String(val ?? '').trim() !== ''))
            const next = await post('/entry', { cwd: cwd || undefined, file: 'global', kind: editing.kind, id: editing.draft.id, value })
            setEditing(undefined)
            return next
          })

        const removeEntry = (kind, id) =>
          mutate(`remove:${id}`, () => post('/entry', { cwd: cwd || undefined, file: 'global', kind, id, value: null }))

        const startEdit = (kind, entry) => setEditing({ kind, draft: { ...entry } })

        const startNew = (kind) => setEditing({ kind, draft: { id: '', label: '' } })

        const scan = () =>
          mutate('discover', async () => {
            const result = await post('/discover', { cwd: cwd || undefined })
            if (alive.current) setDiscovered(result)
            return undefined
          })

        const addCandidate = (kind, entry) =>
          mutate(`add:${entry.id}`, async () => {
            const value = { ...entry }
            delete value.kind
            delete value.id
            const next = await post('/entry', { cwd: cwd || undefined, file: 'global', kind, id: entry.id, value })
            if (alive.current) setDiscovered((prev) => (prev ? { ...prev, [kind]: Object.fromEntries(Object.entries(prev[kind] ?? {}).filter(([id]) => id !== entry.id)) } : prev))
            return next
          })

        const candidates = useMemo(() => {
          if (!discovered) return []
          const rows = []
          for (const kind of ['git', 'hosts']) {
            for (const [id, entry] of Object.entries(discovered[kind] ?? {})) {
              if (merged?.[kind]?.[id]) continue
              rows.push({ kind, entry: { ...entry, id } })
            }
          }
          return rows
        }, [discovered, merged])

        return h(
          'div',
          { className: 'dshi-root' },
          h(
            'div',
            { className: 'dshi-bar' },
            h('span', { className: 'dshi-title' }, t('title')),
            h('button', { className: 'dshi-btn', type: 'button', onClick: () => void load(cwd), disabled: Boolean(busy) }, t('refresh')),
            h('button', { className: 'dshi-btn', type: 'button', onClick: scan, disabled: Boolean(busy) }, busy === 'discover' ? t('discovering') : t('discover')),
          ),
          state
            ? h(
                'div',
                { className: 'dshi-bar' },
                h('span', { className: 'dshi-meta' }, `${t('project')}：${merged?.project ?? '—'}`),
                h('span', { className: 'dshi-chip' }, `${t('machines')} ${hosts.length}`),
                h('span', { className: 'dshi-chip' }, `${t('repo')} ${git.length}`),
              )
            : null,
          error ? h('div', { className: 'dshi-error' }, error) : null,
          state && !state.exists.global && !state.exists.project ? h('div', { className: 'dshi-warn' }, t('unconfigured')) : null,

          h(
            'div',
            { className: 'dshi-card' },
            h('div', { className: 'dshi-cardhead' }, t('machines'), h('span', { className: 'dshi-count' }, hosts.length), h('span', { style: { flex: 1 } }), h('button', { className: 'dshi-btn', type: 'button', onClick: () => startNew('hosts') }, t('newEntry'))),
            hosts.length === 0
              ? h('div', { className: 'dshi-empty' }, t('empty'))
              : hosts.map(([id, entry]) =>
                  h(Row, {
                    key: id,
                    kind: 'hosts',
                    entry,
                    health: health[`hosts:${id}`],
                    t,
                    onCopy: copyText,
                    onCheck: runCheck,
                    onEdit: startEdit,
                    onRemove: removeEntry,
                  }),
                ),
            editing && editing.kind === 'hosts'
              ? h(Editor, {
                  kind: 'hosts',
                  draft: editing.draft,
                  t,
                  onChange: (name, value) => setEditing((prev) => ({ ...prev, draft: { ...prev.draft, [name]: value } })),
                  onSave: saveEntry,
                  onCancel: () => setEditing(undefined),
                })
              : null,
          ),

          h(
            'div',
            { className: 'dshi-card' },
            h('div', { className: 'dshi-cardhead' }, t('repo'), h('span', { className: 'dshi-count' }, git.length), h('span', { style: { flex: 1 } }), h('button', { className: 'dshi-btn', type: 'button', onClick: () => startNew('git') }, t('newEntry'))),
            git.length === 0
              ? h('div', { className: 'dshi-empty' }, t('empty'))
              : git.map(([id, entry]) =>
                  h(Row, {
                    key: id,
                    kind: 'git',
                    entry,
                    health: health[`git:${id}`],
                    t,
                    onCopy: copyText,
                    onCheck: runCheck,
                    onEdit: startEdit,
                    onRemove: removeEntry,
                  }),
                ),
            editing && editing.kind === 'git'
              ? h(Editor, {
                  kind: 'git',
                  draft: editing.draft,
                  t,
                  onChange: (name, value) => setEditing((prev) => ({ ...prev, draft: { ...prev.draft, [name]: value } })),
                  onSave: saveEntry,
                  onCancel: () => setEditing(undefined),
                })
              : null,
          ),

          candidates.length > 0
            ? h(
                'div',
                { className: 'dshi-card' },
                h('div', { className: 'dshi-cardhead' }, t('candidates'), h('span', { className: 'dshi-count' }, candidates.length)),
                candidates.map(({ kind, entry }) =>
                  h(
                    'div',
                    { key: `${kind}:${entry.id}`, className: 'dshi-row' },
                    h('span', { className: 'dshi-dot', 'data-state': 'unknown' }),
                    h(
                      'div',
                      { className: 'dshi-main' },
                      h('div', { className: 'dshi-name' }, entry.label ?? entry.id),
                      ...entryLines(kind, entry).map((line, index) => h('div', { key: index, className: index === 0 ? 'dshi-code' : 'dshi-meta' }, line)),
                    ),
                    h('div', { className: 'dshi-actions' }, h('button', { className: 'dshi-btn', type: 'button', onClick: () => addCandidate(kind, entry) }, t('add'))),
                  ),
                ),
              )
            : discovered
              ? h('div', { className: 'dshi-meta' }, t('noneFound'))
              : null,

          h(
            'div',
            { className: 'dshi-card' },
            h('div', { className: 'dshi-cardhead' }, t('rules'), h('span', { className: 'dshi-count' }, rules.length)),
            rules.length === 0
              ? h('div', { className: 'dshi-empty' }, t('emptyRules'))
              : rules.map((rule) =>
                  h(
                    'div',
                    { key: rule.id ?? rule.match, className: 'dshi-row' },
                    h('span', { className: 'dshi-dot', 'data-state': 'ok' }),
                    h(
                      'div',
                      { className: 'dshi-main' },
                      h('div', { className: 'dshi-name' }, String(rule.id ?? rule.match)),
                      h('div', { className: 'dshi-code' }, typeof rule.match === 'string' ? rule.match : '/built-in/'),
                      h('div', { className: 'dshi-meta' }, String(rule.reason ?? '')),
                    ),
                  ),
                ),
          ),

          h(
            'div',
            { className: 'dshi-field' },
            h('label', null, t('cwd')),
            h('input', {
              className: 'dshi-input',
              value: cwd,
              placeholder: state?.paths?.project ?? '',
              onChange: (event) => setCwd(event.target.value.trim()),
            }),
          ),
          h(
            'div',
            { className: 'dshi-meta' },
            `${t('paths')}：${state?.paths?.global ?? ''}${state?.paths?.project ? `  ·  ${state.paths.project}` : ''}`,
          ),
        )
      }
      return Panel
    }

    function makeRepoView(ctx, t) {
      function RepoView(props) {
        useStyleOnce()
        const inherited = props?.cwd ?? props?.session?.header?.cwd ?? props?.workspace ?? ''
        const [state, setState] = useState(undefined)
        const [error, setError] = useState(undefined)
        const [busy, setBusy] = useState('')
        const [identity, setIdentity] = useState({ name: '', email: '' })
        const [copied, setCopied] = useState(false)

        useEffect(() => {
          let cancelled = false
          const query = inherited ? `?cwd=${encodeURIComponent(inherited)}` : ''
          request(`/state${query}`)
            .then((next) => {
              if (!cancelled) setState(next)
            })
            .catch((failure) => {
              if (!cancelled) setError(String(failure?.message ?? failure))
            })
          return () => {
            cancelled = true
          }
        }, [inherited])

        const merged = stateSummary(state)
        const entry = Object.values(merged?.git ?? {})[0]
        const remote = entry?.remote ?? merged?.remote
        const auth = entry?.auth ?? (remote ? (/^git@|^ssh:/.test(remote) ? 'ssh' : 'https') : undefined)

        const act = async (label, action) => {
          setBusy(label)
          try {
            await action()
            setError(undefined)
            const next = await request(inherited ? `/state?cwd=${encodeURIComponent(inherited)}` : '/state')
            setState(next)
          } catch (failure) {
            setError(String(failure?.message ?? failure))
          } finally {
            setBusy('')
          }
        }

        const switchSsh = () =>
          act('ssh', () => post('/repo', { cwd: inherited || undefined, action: 'switch-ssh' }))

        const saveIdentity = () =>
          act('identity', () => post('/repo', { cwd: inherited || undefined, action: 'identity', ...identity }))

        return h(
          'div',
          { className: 'dshi-view' },
          h(
            'div',
            { className: 'dshi-bar' },
            h('span', { className: 'dshi-title' }, `${t('repo')} · ${merged?.project ?? entry?.label ?? '—'}`),
            auth ? h('span', { className: 'dshi-chip' }, auth === 'ssh' ? t('ssh') : auth === 'https' ? t('https') : t('unknownAuth')) : null,
          ),
          error ? h('div', { className: 'dshi-error' }, error) : null,
          h(
            'div',
            { className: 'dshi-card' },
            h('dl', { className: 'dshi-kv' },
              h('dt', null, t('remote')),
              h('dd', { className: 'dshi-code' }, remote ?? '—'),
              h('dt', null, t('key')),
              h('dd', { className: 'dshi-code' }, entry?.key ?? '—'),
              h('dt', null, t('cwd')),
              h('dd', { className: 'dshi-code' }, inherited || '—'),
            ),
            h(
              'div',
              { className: 'dshi-bar', style: { padding: '0 12px 12px' } },
              auth === 'https'
                ? h('button', { className: 'dshi-btn', type: 'button', 'data-variant': 'primary', onClick: switchSsh, disabled: Boolean(busy) }, busy === 'ssh' ? t('switching') : t('switchSsh'))
                : null,
              remote
                ? h(
                    'button',
                    {
                      className: 'dshi-btn',
                      type: 'button',
                      onClick: async () => {
                        if (await copyText(`git clone ${remote}`)) {
                          setCopied(true)
                          setTimeout(() => setCopied(false), 1200)
                        }
                      },
                    },
                    copied ? t('copied') : t('clone'),
                  )
                : null,
            ),
          ),
          h(
            'div',
            { className: 'dshi-card' },
            h('div', { className: 'dshi-cardhead' }, t('identity')),
            h(
              'div',
              { className: 'dshi-form' },
              h('div', { className: 'dshi-field' }, h('label', null, t('name')), h('input', { className: 'dshi-input', value: identity.name, onChange: (event) => setIdentity((prev) => ({ ...prev, name: event.target.value })) })),
              h('div', { className: 'dshi-field' }, h('label', null, t('email')), h('input', { className: 'dshi-input', value: identity.email, onChange: (event) => setIdentity((prev) => ({ ...prev, email: event.target.value })) })),
              h('div', { className: 'dshi-wide dshi-actions', style: { justifyContent: 'flex-end' } },
                h('button', { className: 'dshi-btn', type: 'button', 'data-variant': 'primary', onClick: saveIdentity, disabled: Boolean(busy) || (!identity.name && !identity.email) }, t('saveIdentity')),
              ),
            ),
            h('div', { className: 'dshi-note' }, `git config user.name / user.email（只改本仓库，不动 --global）`),
          ),
        )
      }
      return RepoView
    }

    function PanelBoundary(props) {
      return h(Boundary, { fallback: props?.t ? props.t('failed') : 'Infra failed' }, props.children)
    }

    class Boundary extends React.Component {
      constructor(properties) {
        super(properties)
        this.state = { failed: false }
      }

      static getDerivedStateFromError() {
        return { failed: true }
      }

      render() {
        if (!this.state.failed) return this.props.children
        return h('div', { className: 'dshi-root' }, h('div', { className: 'dshi-error' }, this.props.fallback))
      }
    }

    return {
      inject: ['slots', 'locale', 'layout'],
      apply(ctx) {
        ctx.effect(() => ctx.locale.register(NS, DICTIONARIES), 'infra dictionaries')
        const t = ctx.locale.bind(NS)
        const Panel = makePanel(ctx, t)
        const RepoView = makeRepoView(ctx, t)
        const InfraEntry = makeEntry(ctx, t)

        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register({ name: 'sidebar.footer.action', id: PANEL_ID, order: 22, locale: NS, label: () => t('title') }, InfraEntry),
        )
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS, inject: () => ({ t }) }, function InfraPage() {
            return h(PanelBoundary, { t }, h(Panel, null))
          }),
        )
        ctx.slots.inject('conversation.view', () =>
          ctx.slots.register({ name: 'conversation.view', id: VIEW_ID, order: 40, locale: NS, label: () => t('repo') }, function InfraRepoView(props) {
            return h(PanelBoundary, { t }, h(RepoView, props ?? {}))
          }),
        )
      },
      __test__: {
        DICTIONARIES,
        request,
        entryLines,
        stateSummary,
      },
    }
  },
})
