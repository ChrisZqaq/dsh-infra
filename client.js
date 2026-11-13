window.__ModuleLoader__.load({
  id: '@local/dsh-infra',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useMemo, useState } = React

    const NS = 'infra'
    const PANEL_ID = 'infra'
    const ROUTE = '/dsh-infra'

    const DICTIONARIES = {
      en: {
        title: 'Assets',
        overview: 'Overview',
        money: 'Money',
        devices: 'Devices',
        repos: 'Repositories',
        keys: 'Keys',
        history: 'Snapshots',
        rate: 'Rate',
        rateHint: '1 HKD =',
        save: 'Save',
        saving: 'Saving…',
        saved: 'Saved',
        dirty: 'Unsaved',
        sync: 'Sync',
        syncing: 'Syncing…',
        add: 'Add',
        remove: 'Remove',
        name: 'Name',
        kind: 'Kind',
        currency: 'Currency',
        qty: 'Qty',
        price: 'Price',
        amount: 'Amount',
        note: 'Note',
        cash: 'Cash',
        holdings: 'Holdings',
        liability: 'Liabilities',
        assets: 'Assets',
        net: 'Net worth',
        cny: 'CNY',
        hkd: 'HKD',
        device: 'Device',
        type: 'Type',
        address: 'Address',
        specs: 'Specs',
        status: 'Status',
        language: 'Language',
        updated: 'Updated',
        description: 'Description',
        remote: 'Remote',
        purpose: 'Purpose',
        value: 'Key',
        location: 'Location',
        expires: 'Expires',
        reveal: 'Reveal',
        hide: 'Hide',
        copy: 'Copy',
        copied: 'Copied',
        snapshot: 'Snapshot',
        totals: 'Totals',
        delta: 'vs last',
        empty: 'Nothing recorded yet.',
        noSnapshots: 'No snapshot yet. Save once to start the history.',
        keyHint: 'Rows show four characters on each side until you press Reveal.',
        failed: 'Assets failed to load',
        expiring: 'expires soon',
        expired: 'expired',
      },
      zh: {
        title: '资产',
        overview: '总览',
        money: '货币',
        devices: '设备',
        repos: '仓库',
        keys: '密钥',
        history: '历史',
        rate: '汇率',
        rateHint: '1 港币 =',
        save: '保存',
        saving: '保存中…',
        saved: '已保存',
        dirty: '未保存',
        sync: '同步仓库',
        syncing: '同步中…',
        add: '添加',
        remove: '删除',
        name: '名称',
        kind: '类别',
        currency: '币种',
        qty: '数量',
        price: '单价',
        amount: '市值',
        note: '备注',
        cash: '现金',
        holdings: '持仓',
        liability: '负债',
        assets: '资产小计',
        net: '净资产',
        cny: '人民币',
        hkd: '港币',
        device: '设备',
        type: '类型',
        address: '连接地址',
        specs: '配置',
        status: '状态',
        language: '语言',
        updated: '最近提交',
        description: '说明',
        remote: '远端',
        purpose: '用途',
        value: '密钥',
        location: '存放位置',
        expires: '到期日',
        reveal: '查看',
        hide: '收起',
        copy: '复制',
        copied: '已复制',
        snapshot: '快照',
        totals: '合计',
        delta: '较上次',
        empty: '还没有条目。',
        noSnapshots: '还没有快照。保存一次就会开始记录。',
        keyHint: '列表里默认只显示前后各 4 位；点「查看」才展开，展开后可改。',
        failed: '资产面板加载失败',
        expiring: '即将到期',
        expired: '已过期',
      },
    }

    const STYLES = `
.dshi-root{display:flex;flex-direction:column;gap:0;padding:18px 22px 36px;max-width:940px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5}
.dshi-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.dshi-title{font-size:17px;font-weight:600;margin-right:auto;letter-spacing:-.01em}
.dshi-tabs{display:flex;gap:2px;margin:14px 0 4px;border-bottom:1px solid var(--dsw-alias-border-l1);flex-wrap:wrap}
.dshi-tab{border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:7px 11px;font-size:12px;cursor:pointer;border-bottom:1.5px solid transparent;margin-bottom:-1px}
.dshi-tab:hover{color:var(--dsw-alias-label-primary)}
.dshi-tab[data-on='yes']{color:var(--dsw-alias-label-primary);border-bottom-color:var(--dsw-alias-brand-primary);font-weight:600}
.dshi-btn{border:0.5px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);border-radius:7px;padding:4px 10px;font-size:12px;cursor:pointer;white-space:nowrap}
.dshi-btn:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshi-btn[disabled]{opacity:.5;cursor:default}
.dshi-btn[data-variant='primary']{background:var(--dsw-alias-brand-primary);border-color:transparent;color:#fff}
.dshi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:16px 0 6px}
.dshi-stat{border:0.5px solid var(--dsw-alias-border-l1);border-radius:10px;padding:10px 12px}
.dshi-stat small{display:block;color:var(--dsw-alias-label-tertiary);font-size:11px;letter-spacing:.04em}
.dshi-stat strong{display:block;font-size:19px;font-weight:600;letter-spacing:-.02em;margin-top:3px}
.dshi-stat[data-tone='up'] strong{color:var(--dsw-alias-state-success-primary)}
.dshi-stat[data-tone='down'] strong{color:var(--dsw-alias-state-error-primary)}
.dshi-sec{margin-top:22px}
.dshi-sechead{display:flex;align-items:center;gap:8px;padding-bottom:6px;border-bottom:1px solid var(--dsw-alias-border-l1);font-weight:600;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dshi-sechead .dshi-sp{flex:1}
.dshi-row{display:grid;gap:8px;align-items:center;padding:7px 0;border-bottom:0.5px solid var(--dsw-alias-border-l1)}
.dshi-row:last-child{border-bottom:0}
.dshi-row[data-cols='money']{grid-template-columns:1.4fr 74px 62px 62px 88px 1fr 24px}
.dshi-row[data-cols='device']{grid-template-columns:1.1fr 74px 1.4fr 1fr 66px 24px}
.dshi-row[data-cols='repo']{grid-template-columns:1.5fr 62px 88px 1fr 24px}
.dshi-row[data-cols='key']{grid-template-columns:1fr 1fr 1.6fr 1fr 96px 46px 24px}
.dshi-row[data-cols='history']{grid-template-columns:104px 1fr 116px 96px}
.dshi-th{color:var(--dsw-alias-label-tertiary);font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:6px 0 4px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshi-in{width:100%;min-width:0;overflow:hidden;text-overflow:ellipsis;border:0.5px solid transparent;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);padding:3px 5px;font-size:12px;font-family:inherit}
.dshi-in:hover{border-color:var(--dsw-alias-border-l2)}
.dshi-in:focus{outline:none;border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base)}
.dshi-in[data-num='yes']{text-align:right;font-variant-numeric:tabular-nums}
.dshi-num{text-align:right;font-variant-numeric:tabular-nums;font-size:12px;padding:3px 5px}
.dshi-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;color:var(--dsw-alias-label-secondary);word-break:break-all}
.dshi-muted{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dshi-chip{display:inline-block;padding:0 6px;border-radius:999px;border:0.5px solid var(--dsw-alias-border-l2);font-size:10px;color:var(--dsw-alias-label-secondary);line-height:16px}
.dshi-chip[data-tone='warn']{color:var(--dsw-alias-state-warn-primary);border-color:currentColor}
.dshi-chip[data-tone='bad']{color:var(--dsw-alias-state-error-primary);border-color:currentColor}
.dshi-del{border:0;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;padding:0;font-size:14px;line-height:1;visibility:hidden}
.dshi-row:hover .dshi-del{visibility:visible}
.dshi-del:hover{color:var(--dshi-error,var(--dsw-alias-state-error-primary))}
.dshi-sum{display:flex;gap:20px;flex-wrap:wrap;padding:10px 0 0;font-size:12px;color:var(--dsw-alias-label-secondary)}
.dshi-sum b{font-weight:600;color:var(--dsw-alias-label-primary);font-variant-numeric:tabular-nums}
.dshi-empty{padding:16px 0;color:var(--dsw-alias-label-tertiary);font-size:12px}
.dshi-error{color:var(--dsw-alias-state-error-primary);font-size:12px;padding:8px 0}
.dshi-spark{display:block;width:100%;height:52px;margin-top:12px}
.dshi-entry{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;padding:0;border:none;background:transparent;border-radius:var(--dsw-radius-sm);color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshi-entry:hover{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshi-entry:active{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshi-entry[data-active='yes']{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshi-entry:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:-2px}
`

    const EMPTY = { version: 2, rate: { HKD_CNY: 0.917 }, money: [], devices: [], repos: [], keys: [] }
    const KINDS = ['现金', '持仓', '负债']
    const CURRENCIES = ['CNY', 'HKD']
    const TYPES = ['服务器', '电脑']
    const STATES = ['在线', '离线', '未知']
    const TABS = ['overview', 'money', 'devices', 'repos', 'keys', 'history']

    // ------------------------------------------------------------- formatting

    const num = (value) => {
      const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(/,/g, ''))
      return Number.isFinite(parsed) ? parsed : 0
    }

    function money(value, currency = 'CNY') {
      const amount = num(value)
      const text = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(amount))
      return `${currency === 'HKD' ? 'HK$' : '¥'}${text}`
    }

    function signedMoney(value, currency = 'CNY') {
      const amount = num(value)
      return `${amount < 0 ? '-' : ''}${money(amount, currency)}`
    }

    const amountOf = (item) => Math.abs(num(item.quantity) * num(item.price))

    function toCny(item, rate) {
      const amount = amountOf(item)
      return item.currency === 'HKD' ? amount * rate : amount
    }

    function totalsOf(doc) {
      const rate = num(doc?.rate?.HKD_CNY) || 0.917
      let cash = 0
      let holdings = 0
      let debt = 0
      let cny = 0
      let hkd = 0
      for (const item of doc?.money ?? []) {
        if (item.currency === 'HKD') hkd += amountOf(item)
        else cny += amountOf(item)
        if (item.kind === '负债') debt += toCny(item, rate)
        else if (item.kind === '持仓') holdings += toCny(item, rate)
        else cash += toCny(item, rate)
      }
      return { rate, cash, holdings, assets: cash + holdings, liability: -debt, net: cash + holdings - debt, cny, hkd }
    }

    /** 4 leading + 5 stars + trailing 4; short values keep only two on each side. */
    function maskKey(value) {
      const text = String(value ?? '')
      if (text.length === 0) return ''
      if (text.length < 12) {
        if (text.length < 6) return '*'.repeat(text.length)
        return `${text.slice(0, 2)}*****${text.slice(-2)}`
      }
      return `${text.slice(0, 4)}*****${text.slice(-4)}`
    }

    function daysUntil(date) {
      if (!date) return undefined
      const target = new Date(`${date}T00:00:00`)
      if (Number.isNaN(target.getTime())) return undefined
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      return Math.ceil((target.getTime() - today.getTime()) / 86400000)
    }

    const stamp = (iso) => {
      if (!iso) return ''
      const value = new Date(iso)
      if (Number.isNaN(value.getTime())) return String(iso)
      const pad = (n) => String(n).padStart(2, '0')
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())} ${pad(value.getHours())}:${pad(value.getMinutes())}`
    }

    let seq = 0
    const uid = (prefix) => `${prefix}-${Date.now().toString(36)}${(seq++).toString(36)}`

    // ---------------------------------------------------------------- plumbing

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

    const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body ?? {}) })

    async function copyText(text) {
      try {
        await navigator.clipboard.writeText(text)
        return true
      } catch {
        return false
      }
    }

    // ------------------------------------------------------------------ pieces

    function Cell(props) {
      const { value, onChange, numeric, placeholder, mono } = props
      return h('input', {
        className: mono ? 'dshi-in dshi-mono' : 'dshi-in',
        'data-num': numeric ? 'yes' : undefined,
        value: value ?? '',
        placeholder: placeholder ?? '',
        inputMode: numeric ? 'decimal' : undefined,
        onChange: (event) => onChange?.(event.target.value),
      })
    }

    function Choice(props) {
      const { value, options, onChange } = props
      return h(
        'select',
        { className: 'dshi-in', value, onChange: (event) => onChange?.(event.target.value) },
        options.map((option) => h('option', { key: option, value: option }, option)),
      )
    }

    function Stat(props) {
      return h(
        'div',
        { className: 'dshi-stat', 'data-tone': props.tone },
        h('small', null, props.label),
        h('strong', null, props.value),
        props.hint ? h('small', null, props.hint) : null,
      )
    }

    function Spark(props) {
      const rows = props.points ?? []
      if (rows.length < 2) return null
      const values = rows.map((row) => num(row))
      const min = Math.min(...values)
      const max = Math.max(...values)
      const span = max - min || 1
      const step = 100 / (values.length - 1)
      const path = values
        .map((value, index) => `${index === 0 ? 'M' : 'L'}${(index * step).toFixed(2)} ${(28 - ((value - min) / span) * 24).toFixed(2)}`)
        .join(' ')
      return h(
        'svg',
        { className: 'dshi-spark', viewBox: '0 0 100 32', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
        h('path', { d: path, fill: 'none', stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: '1', vectorEffect: 'non-scaling-stroke' }),
      )
    }

    // ------------------------------------------------------------------- views

    function overviewView(doc, snapshots, t) {
      const totals = totalsOf(doc)
      const latest = snapshots[0]
      const delta = latest ? totals.net - num(latest.totals?.net) : 0
      const percent = latest && num(latest.totals?.net) !== 0 ? (delta / Math.abs(num(latest.totals.net))) * 100 : 0
      const points = [...snapshots].reverse().map((row) => row.totals?.net ?? 0).concat([totals.net])
      return h(
        'div',
        null,
        h(
          'div',
          { className: 'dshi-grid' },
          h(Stat, { label: t('assets'), value: money(totals.assets) }),
          h(Stat, { label: t('liability'), value: signedMoney(totals.liability) }),
          h(Stat, {
            label: t('net'),
            value: money(totals.net),
            hint: latest ? `${t('delta')} ${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%` : undefined,
            tone: latest ? (delta > 0 ? 'up' : delta < 0 ? 'down' : undefined) : undefined,
          }),
        ),
        h(
          'div',
          { className: 'dshi-sum' },
          h('span', null, `${t('cash')} `, h('b', null, money(totals.cash))),
          h('span', null, `${t('holdings')} `, h('b', null, money(totals.holdings))),
          h('span', null, `${t('cny')} `, h('b', null, money(totals.cny, 'CNY'))),
          h('span', null, `${t('hkd')} `, h('b', null, money(totals.hkd, 'HKD'))),
        ),
        h(Spark, { points }),
        h(
          'div',
          { className: 'dshi-sec' },
          h('div', { className: 'dshi-sechead' }, t('overview')),
          [
            [t('money'), doc.money.length],
            [t('devices'), doc.devices.length],
            [t('repos'), doc.repos.length],
            [t('keys'), doc.keys.length],
          ].map(([label, count]) =>
            h(
              'div',
              { className: 'dshi-row', key: label, style: { gridTemplateColumns: '1fr auto' } },
              h('span', null, label),
              h('span', { className: 'dshi-muted' }, String(count)),
            ),
          ),
        ),
      )
    }

    function moneyView(doc, setDoc, t) {
      const totals = totalsOf(doc)
      const rows = doc.money
      const patch = (index, key, value) => {
        const next = rows.slice()
        next[index] = { ...next[index], [key]: value }
        setDoc({ ...doc, money: next })
      }
      return h(
        'div',
        { className: 'dshi-sec' },
        h(
          'div',
          { className: 'dshi-sechead' },
          t('money'),
          h('span', { className: 'dshi-sp' }),
          h(
            'button',
            {
              className: 'dshi-btn',
              type: 'button',
              onClick: () =>
                setDoc({
                  ...doc,
                  money: [...rows, { id: uid('money'), name: '', kind: '现金', currency: 'CNY', quantity: 1, price: 0, note: '' }],
                }),
            },
            t('add'),
          ),
        ),
        h(
          'div',
          { className: 'dshi-row dshi-th', 'data-cols': 'money' },
          h('span', null, t('name')),
          h('span', null, t('kind')),
          h('span', null, t('currency')),
          h('span', { style: { textAlign: 'right' } }, t('qty')),
          h('span', { style: { textAlign: 'right' } }, t('price')),
          h('span', { style: { textAlign: 'right' } }, t('amount')),
          h('span', null, ''),
        ),
        rows.length === 0
          ? h('div', { className: 'dshi-empty' }, t('empty'))
          : rows.map((item, index) =>
              h(
                'div',
                { className: 'dshi-row', 'data-cols': 'money', key: item.id ?? index },
                h(Cell, { value: item.name, onChange: (value) => patch(index, 'name', value), placeholder: t('name') }),
                h(Choice, { value: item.kind, options: KINDS, onChange: (value) => patch(index, 'kind', value) }),
                h(Choice, { value: item.currency, options: CURRENCIES, onChange: (value) => patch(index, 'currency', value) }),
                h(Cell, { value: item.quantity, numeric: true, onChange: (value) => patch(index, 'quantity', value) }),
                h(Cell, { value: item.price, numeric: true, onChange: (value) => patch(index, 'price', value) }),
                h(
                  'span',
                  { className: 'dshi-num' },
                  item.kind === '负债' ? `-${money(amountOf(item), item.currency)}` : money(amountOf(item), item.currency),
                ),
                h(
                  'button',
                  {
                    className: 'dshi-del',
                    type: 'button',
                    title: t('remove'),
                    onClick: () => setDoc({ ...doc, money: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
              ),
            ),
        h(
          'div',
          { className: 'dshi-sum' },
          h('span', null, `${t('cash')} `, h('b', null, money(totals.cash))),
          h('span', null, `${t('holdings')} `, h('b', null, money(totals.holdings))),
          h('span', null, `${t('assets')} `, h('b', null, money(totals.assets))),
          h('span', null, `${t('liability')} `, h('b', null, signedMoney(totals.liability))),
          h('span', null, `${t('net')} `, h('b', null, money(totals.net))),
        ),
      )
    }

    function devicesView(doc, setDoc, t) {
      const rows = doc.devices
      const patch = (index, key, value) => {
        const next = rows.slice()
        next[index] = { ...next[index], [key]: value }
        setDoc({ ...doc, devices: next })
      }
      return h(
        'div',
        { className: 'dshi-sec' },
        h(
          'div',
          { className: 'dshi-sechead' },
          t('devices'),
          h('span', { className: 'dshi-sp' }),
          h(
            'button',
            {
              className: 'dshi-btn',
              type: 'button',
              onClick: () =>
                setDoc({
                  ...doc,
                  devices: [...rows, { id: uid('device'), name: '', type: '服务器', address: '', specs: '', status: '未知', note: '' }],
                }),
            },
            t('add'),
          ),
        ),
        h(
          'div',
          { className: 'dshi-row dshi-th', 'data-cols': 'device' },
          h('span', null, t('name')),
          h('span', null, t('type')),
          h('span', null, t('address')),
          h('span', null, t('specs')),
          h('span', null, t('status')),
          h('span', null, ''),
        ),
        rows.length === 0
          ? h('div', { className: 'dshi-empty' }, t('empty'))
          : rows.map((item, index) =>
              h(
                'div',
                { className: 'dshi-row', 'data-cols': 'device', key: item.id ?? index },
                h(Cell, { value: item.name, onChange: (value) => patch(index, 'name', value), placeholder: t('name') }),
                h(Choice, { value: item.type, options: TYPES, onChange: (value) => patch(index, 'type', value) }),
                h(Cell, { value: item.address, onChange: (value) => patch(index, 'address', value), placeholder: 'ssh tx' }),
                h(Cell, { value: item.specs, onChange: (value) => patch(index, 'specs', value), placeholder: '2C2G · Ubuntu 24.04' }),
                h(Choice, { value: item.status, options: STATES, onChange: (value) => patch(index, 'status', value) }),
                h(
                  'button',
                  {
                    className: 'dshi-del',
                    type: 'button',
                    title: t('remove'),
                    onClick: () => setDoc({ ...doc, devices: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
              ),
            ),
        h('div', { className: 'dshi-muted', style: { paddingTop: '8px' } }, doc.devices.map((item) => item.note).filter(Boolean).join(' · ')),
      )
    }

    function reposView(doc, setDoc, t, onSync, busy) {
      const rows = doc.repos
      const patch = (index, key, value) => {
        const next = rows.slice()
        next[index] = { ...next[index], [key]: value }
        setDoc({ ...doc, repos: next })
      }
      return h(
        'div',
        { className: 'dshi-sec' },
        h(
          'div',
          { className: 'dshi-sechead' },
          t('repos'),
          h('span', { className: 'dshi-sp' }),
          h('button', { className: 'dshi-btn', type: 'button', disabled: Boolean(busy), onClick: onSync }, busy ? t('syncing') : t('sync')),
        ),
        h(
          'div',
          { className: 'dshi-row dshi-th', 'data-cols': 'repo' },
          h('span', null, t('name')),
          h('span', null, t('language')),
          h('span', null, t('updated')),
          h('span', null, t('description')),
          h('span', null, ''),
        ),
        rows.length === 0
          ? h('div', { className: 'dshi-empty' }, t('empty'))
          : rows.map((item, index) =>
              h(
                'div',
                { className: 'dshi-row', 'data-cols': 'repo', key: item.id ?? index },
                h(
                  'div',
                  { style: { minWidth: 0 } },
                  h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center' } },
                    h('span', { className: 'dshi-mono' }, item.name || '—'),
                    item.visibility === 'private' ? h('span', { className: 'dshi-chip' }, 'private') : null,
                  ),
                  h(Cell, { value: item.note, onChange: (value) => patch(index, 'note', value), placeholder: t('note') }),
                ),
                h('span', { className: 'dshi-muted' }, item.language || '—'),
                h('span', { className: 'dshi-muted' }, item.committedAt || '—'),
                h('span', { className: 'dshi-muted', style: { overflow: 'hidden', textOverflow: 'ellipsis' } }, item.description || '—'),
                h(
                  'button',
                  {
                    className: 'dshi-del',
                    type: 'button',
                    title: t('remove'),
                    onClick: () => setDoc({ ...doc, repos: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
              ),
            ),
      )
    }

    function keysView(doc, setDoc, t, revealed, setRevealed, copied, setCopied) {
      const rows = doc.keys
      const patch = (index, key, value) => {
        const next = rows.slice()
        next[index] = { ...next[index], [key]: value }
        setDoc({ ...doc, keys: next })
      }
      const toggle = (id) => setRevealed({ ...revealed, [id]: !revealed[id] })
      return h(
        'div',
        { className: 'dshi-sec' },
        h(
          'div',
          { className: 'dshi-sechead' },
          t('keys'),
          h('span', { className: 'dshi-sp' }),
          h(
            'button',
            {
              className: 'dshi-btn',
              type: 'button',
              onClick: () =>
                setDoc({
                  ...doc,
                  keys: [...rows, { id: uid('key'), name: '', purpose: '', value: '', location: '', expiresAt: '' }],
                }),
            },
            t('add'),
          ),
        ),
        h(
          'div',
          { className: 'dshi-row dshi-th', 'data-cols': 'key' },
          h('span', null, t('name')),
          h('span', null, t('purpose')),
          h('span', null, t('value')),
          h('span', null, t('location')),
          h('span', null, t('expires')),
          h('span', null, ''),
          h('span', null, ''),
        ),
        rows.length === 0
          ? h('div', { className: 'dshi-empty' }, t('empty'))
          : rows.map((item, index) => {
              const left = daysUntil(item.expiresAt)
              const tone = left === undefined ? undefined : left < 0 ? 'bad' : left <= 14 ? 'warn' : undefined
              const open = Boolean(revealed[item.id])
              return h(
                'div',
                { className: 'dshi-row', 'data-cols': 'key', key: item.id ?? index },
                h(Cell, { value: item.name, onChange: (value) => patch(index, 'name', value), placeholder: t('name') }),
                h(Cell, { value: item.purpose, onChange: (value) => patch(index, 'purpose', value), placeholder: t('purpose') }),
                open
                  ? h(Cell, { value: item.value, onChange: (value) => patch(index, 'value', value), mono: true, placeholder: 'sk-…' })
                  : h(
                      'button',
                      { className: 'dshi-in dshi-mono', type: 'button', title: t('reveal'), style: { textAlign: 'left', cursor: 'pointer' }, onClick: () => toggle(item.id) },
                      maskKey(item.value) || '—',
                    ),
                h(Cell, { value: item.location, onChange: (value) => patch(index, 'location', value), placeholder: t('location') }),
                h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
                  h(Cell, { value: item.expiresAt, onChange: (value) => patch(index, 'expiresAt', value), placeholder: '2026-12-31' }),
                  tone ? h('span', { className: 'dshi-chip', 'data-tone': tone }, left < 0 ? t('expired') : `${t('expiring')} ${left}d`) : null,
                ),
                h(
                  'button',
                  {
                    className: 'dshi-btn',
                    type: 'button',
                    title: open ? t('hide') : t('reveal'),
                    onClick: () => toggle(item.id),
                  },
                  open ? t('hide') : t('reveal'),
                ),
                h(
                  'button',
                  {
                    className: 'dshi-del',
                    type: 'button',
                    title: t('remove'),
                    onClick: () => setDoc({ ...doc, keys: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
              )
            }),
        h('div', { className: 'dshi-muted', style: { paddingTop: '8px' } }, t('keyHint')),
      )
    }

    // -------------------------------------------------------------------- panel

    function makePanel(ctx, t) {
      function Panel() {
        useStyleOnce()
        const [doc, setDoc] = useState(EMPTY)
        const [tab, setTab] = useState('overview')
        const [snapshots, setSnapshots] = useState([])
        const [error, setError] = useState('')
        const [busy, setBusy] = useState('')
        const [dirty, setDirty] = useState(false)
        const [revealed, setRevealed] = useState({})
        const [copied, setCopied] = useState('')

        const load = useCallback(async () => {
          try {
            const payload = await request('/assets')
            setDoc(payload.doc ?? EMPTY)
            setDirty(false)
            setError('')
          } catch (failure) {
            setError(String(failure?.message ?? failure))
          }
          try {
            const payload = await request('/snapshots?limit=120')
            setSnapshots(Array.isArray(payload.snapshots) ? payload.snapshots : [])
          } catch {
            setSnapshots([])
          }
        }, [])

        useEffect(() => {
          void load()
        }, [load])

        const update = useCallback((next) => {
          setDoc(next)
          setDirty(true)
        }, [])

        const save = useCallback(async () => {
          setBusy('save')
          try {
            const payload = await post('/assets', { doc, snapshot: true })
            setDoc(payload.doc ?? doc)
            setDirty(false)
            setError('')
            const history = await request('/snapshots?limit=120')
            setSnapshots(Array.isArray(history.snapshots) ? history.snapshots : [])
          } catch (failure) {
            setError(String(failure?.message ?? failure))
          } finally {
            setBusy('')
          }
        }, [doc])

        const sync = useCallback(async () => {
          setBusy('sync')
          try {
            const payload = await post('/github/sync')
            setDoc(payload.doc ?? doc)
            setError('')
          } catch (failure) {
            setError(String(failure?.message ?? failure))
          } finally {
            setBusy('')
          }
        }, [doc])

        const rate = num(doc?.rate?.HKD_CNY) || 0.917
        let body
        if (tab === 'money') body = moneyView(doc, update, t)
        else if (tab === 'devices') body = devicesView(doc, update, t)
        else if (tab === 'repos') body = reposView(doc, update, t, sync, busy === 'sync')
        else if (tab === 'keys') body = keysView(doc, update, t, revealed, setRevealed, copied, setCopied)
        else if (tab === 'history') body = historyView(snapshots, t)
        else body = overviewView(doc, snapshots, t)

        return h(
          'div',
          { className: 'dshi-root' },
          h(
            'div',
            { className: 'dshi-bar' },
            h('span', { className: 'dshi-title' }, t('title')),
            h('span', { className: 'dshi-muted' }, t('rateHint')),
            h(Cell, {
              value: rate,
              numeric: true,
              onChange: (value) => update({ ...doc, rate: { ...doc.rate, HKD_CNY: value } }),
            }),
            dirty ? h('span', { className: 'dshi-chip' }, t('dirty')) : null,
            h('button', { className: 'dshi-btn', type: 'button', 'data-variant': 'primary', disabled: Boolean(busy), onClick: save }, busy === 'save' ? t('saving') : t('save')),
          ),
          h(
            'div',
            { className: 'dshi-tabs' },
            TABS.map((id) =>
              h('button', { key: id, className: 'dshi-tab', type: 'button', 'data-on': tab === id ? 'yes' : 'no', onClick: () => setTab(id) }, t(id)),
            ),
          ),
          error ? h('div', { className: 'dshi-error' }, `${t('failed')}：${error}`) : null,
          body,
        )
      }
      return Panel
    }

    function makeEntry(ctx, t) {
      function Entry(props) {
        useStyleOnce()
        const active = Boolean(props.usePanelInfo?.((info) => info?.activePanelId === PANEL_ID))
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
          h(
            'svg',
            { width: 16, height: 16, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': 'true', stroke: 'currentColor', strokeWidth: 1.1, strokeLinecap: 'round', strokeLinejoin: 'round' },
            h('path', { d: 'M10.4 4.6c-.7-.7-1.6-1-2.6-1-1.6 0-2.6.8-2.6 2 0 1.3 1 1.8 2.7 2.2 1.8.4 2.7.9 2.7 2.2 0 1.2-1.1 2-2.8 2-1.1 0-2-.4-2.7-1.1' }),
            h('path', { d: 'M8 2.1v11.8' }),
          ),
        )
      }
      return Entry
    }

    function Boundary(props) {
      return h(Guard, { fallback: props?.t ? props.t('failed') : 'Assets failed' }, props.children)
    }

    class Guard extends React.Component {
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
        const Entry = makeEntry(ctx, t)

        ctx.slots.inject('sidebar.footer.action', () =>
          ctx.slots.register({ name: 'sidebar.footer.action', id: PANEL_ID, order: 22, locale: NS, label: () => t('title') }, Entry),
        )
        ctx.slots.inject('main', () =>
          ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS, inject: () => ({ t }) }, function InfraPage() {
            return h(Boundary, { t }, h(Panel, null))
          }),
        )
      },
      __test__: {
        DICTIONARIES,
        request,
        keysView,
        moneyView,
        devicesView,
        reposView,
        maskKey,
        totalsOf,
        amountOf,
        daysUntil,
        snapshotView: (doc) => totalsOf(doc),
      },
    }
  },
})