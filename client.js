window.__ModuleLoader__.load({
  id: '@local/dsh-ledger',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useCallback, useEffect, useState } = React

    const NS = 'infra'
    const PANEL_ID = 'infra' // Keep the installed layout seat; only the package name changes.
    const ROUTE = '/dsh-ledger'

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
        keyHint: 'Rows show four characters on each side until you press Reveal. Plaintext stays on this machine.',
        localOnly: 'LOCAL LEDGER · SAVED ON THIS MACHINE',
        ledgerHint: 'Every save keeps a snapshot. Numbers in CNY.',
        trend: 'Net worth trend',
        composition: 'Cash & holdings',
        recent: 'Recent snapshots',
        manage: 'Manage',
        allHistory: 'View history',
        current: 'Current',
        entries: 'entries',
        first: 'First snapshot',
        noAssets: 'No assets yet',
        online: 'online',
        expiringSoon: 'expiring soon',
        unsavedPoint: 'Current (unsaved)',
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
        keyHint: '默认只显示首尾；点「查看」才展开。明文保存在本机，请勿分享给他人。',
        localOnly: '本地账本 · 仅保存在此设备',
        ledgerHint: '每次保存留一份快照 · 金额以人民币计',
        trend: '净值走势',
        composition: '现金与持仓',
        recent: '最近快照',
        manage: '管理',
        allHistory: '查看全部历史',
        current: '当前',
        entries: '条',
        first: '首次记录',
        noAssets: '暂无资产记录',
        online: '台在线',
        expiringSoon: '个即将到期',
        unsavedPoint: '当前（未保存）',
        failed: '资产面板加载失败',
        expiring: '即将到期',
        expired: '已过期',
      },
    }

    // DSH claims styles synchronously during factory materialization. CSS that
    // waits for React's effect is invisible to the loader and never reinstalled
    // after an entry refresh. Keep this synchronous, with no browser fallback.
    const STYLES = `
.dshi-root{width:100%;max-width:1120px;box-sizing:border-box;padding:26px 32px 40px;color:var(--dsw-alias-label-primary);font-size:13px;line-height:1.5;container-type:inline-size}
.dshi-root button,.dshi-root input,.dshi-root select{font:inherit}
.dshi-bar{display:flex;align-items:center;gap:12px;min-height:36px}
.dshi-brand{margin-right:auto}
.dshi-title{display:block;font-size:18px;font-weight:600;line-height:1.3;letter-spacing:-.02em}
.dshi-local{display:block;margin-top:3px;color:var(--dsw-alias-label-tertiary);font-size:9px;letter-spacing:.09em}
.dshi-rate{display:flex;align-items:center;gap:4px;color:var(--dsw-alias-label-tertiary);font-size:11px}
.dshi-rate .dshi-in{width:59px;flex:none}
.dshi-tabs{display:flex;gap:3px;margin-top:19px;border-bottom:1px solid var(--dsw-alias-border-l1);overflow-x:auto;scrollbar-width:none}
.dshi-tabs::-webkit-scrollbar{display:none}
.dshi-tab{position:relative;flex:0 0 auto;min-height:36px;padding:7px 13px 9px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);font-size:12px;cursor:pointer;transition:color 120ms ease}
.dshi-tab:first-child{padding-left:0;padding-right:16px}
.dshi-tab:after{content:'';position:absolute;right:12px;bottom:-1px;left:12px;height:2px;background:transparent}
.dshi-tab:first-child:after{left:0}
.dshi-tab:hover{color:var(--dsw-alias-label-primary)}
.dshi-tab[data-on='yes']{color:var(--dsw-alias-label-primary);font-weight:600}
.dshi-tab[data-on='yes']:after{background:var(--dsw-alias-label-primary)}
.dshi-btn{min-height:28px;padding:4px 11px;border:1px solid var(--dsw-alias-border-l2);border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary);font-size:11px;line-height:1.4;cursor:pointer;white-space:nowrap;transition:background-color 120ms ease,border-color 120ms ease}
.dshi-btn:hover{background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-label-tertiary)}
.dshi-btn[disabled]{opacity:.5;cursor:default}
.dshi-btn[data-variant='primary']{padding-right:15px;padding-left:15px;border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base)}
.dshi-btn[data-variant='primary']:hover{opacity:.85}
.dshi-textbtn{padding:0;border:0;background:none;color:var(--dsw-alias-label-tertiary);font-size:11px;cursor:pointer;white-space:nowrap}
.dshi-textbtn:hover{color:var(--dsw-alias-label-primary)}
.dshi-hero{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(230px,.8fr);padding:35px 0 30px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshi-netmain{min-width:0;padding-right:32px}
.dshi-kicker{color:var(--dsw-alias-label-secondary);font-size:11px;font-weight:550;letter-spacing:.035em}
.dshi-kicker span{margin-left:10px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;font-weight:400;letter-spacing:.06em}
.dshi-big{margin-top:8px;font-size:clamp(32px,4.4cqw,50px);font-weight:500;line-height:1.14;letter-spacing:-.045em;font-variant-numeric:tabular-nums;white-space:nowrap}
.dshi-delta{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:12px;font-size:11px}
.dshi-delta[data-tone='up'] .dshi-change{color:var(--dsw-alias-state-success-primary)}
.dshi-delta[data-tone='down'] .dshi-change{color:var(--dsw-alias-state-error-primary)}
.dshi-delta[data-tone='down'] .dshi-change:before{content:'▼';margin-right:5px;font-size:8px}
.dshi-delta[data-tone='up'] .dshi-change:before{content:'▲';margin-right:5px;font-size:8px}
.dshi-change{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;font-variant-numeric:tabular-nums}
.dshi-balances{display:flex;flex-direction:column;justify-content:center;padding-left:28px;border-left:1px solid var(--dsw-alias-border-l1)}
.dshi-balance{display:grid;grid-template-columns:1fr auto;align-items:baseline;gap:2px 12px;padding:9px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshi-balance:last-child{border-bottom:0}
.dshi-balance>span{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dshi-balance>strong{font-size:13px;font-weight:550;font-variant-numeric:tabular-nums;white-space:nowrap}
.dshi-balance>small{grid-column:1/-1;color:var(--dsw-alias-label-tertiary);font-size:10px}
.dshi-balance>strong[data-tone='down']{color:var(--dsw-alias-state-error-primary)}
.dshi-analytics{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(215px,.8fr);padding:24px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshi-trend{min-width:0;padding-right:28px}
.dshi-allocation{min-width:0;padding-left:28px;border-left:1px solid var(--dsw-alias-border-l1)}
.dshi-heading{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
.dshi-heading h3{margin:0;font-size:12px;font-weight:600}
.dshi-heading small{color:var(--dsw-alias-label-tertiary);font-size:10px}
.dshi-spark{display:block;width:100%;height:112px;margin-top:18px;overflow:visible}
.dshi-chartfoot{display:flex;justify-content:space-between;margin-top:7px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px}
.dshi-allocation .dshi-heading{margin-bottom:25px}
.dshi-allocationrow{display:grid;grid-template-columns:1fr auto;gap:5px 10px;margin:17px 0;font-size:11px}
.dshi-allocationrow strong{font-weight:550;font-variant-numeric:tabular-nums}
.dshi-allocationrow small{grid-column:1/-1;color:var(--dsw-alias-label-tertiary);font-size:10px}
.dshi-meter{grid-column:1/-1;height:3px;margin-top:4px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.dshi-meter i{display:block;height:100%;background:var(--dsw-alias-label-secondary)}
.dshi-allocationrow:last-child .dshi-meter i{background:var(--dsw-alias-brand-primary)}
.dshi-lower{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(215px,.8fr);padding:24px 0 28px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshi-assets{min-width:0;padding-right:28px}
.dshi-recent{min-width:0;padding-left:28px;border-left:1px solid var(--dsw-alias-border-l1)}
.dshi-assetrow{display:grid;grid-template-columns:minmax(0,1fr) 90px 110px;gap:10px;align-items:center;min-height:38px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:11px}
.dshi-assetrow:last-child{border:0}
.dshi-assetrow>span:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dshi-assetrow>strong{text-align:right;font-weight:550;font-variant-numeric:tabular-nums}
.dshi-assetrow>small{color:var(--dsw-alias-label-tertiary);text-align:right}
.dshi-snapshotrow{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:3px 10px;padding:10px 0;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:11px}
.dshi-snapshotrow:last-child{border:0}
.dshi-snapshotrow strong{text-align:right;font-weight:550;font-variant-numeric:tabular-nums}
.dshi-snapshotrow small{color:var(--dsw-alias-label-tertiary);font-size:10px}
.dshi-snapshotrow small:last-child{text-align:right}
.dshi-resources{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));padding:6px 0}
.dshi-resource{min-width:0;padding:22px 24px 18px;border:0;border-right:1px solid var(--dsw-alias-border-l1);background:transparent;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer;transition:background-color 120ms ease}
.dshi-resource:first-child{padding-left:0}
.dshi-resource:last-child{padding-right:0;border:0}
.dshi-resource:hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshi-resource>span{display:block;color:var(--dsw-alias-label-tertiary);font-size:11px}
.dshi-resource>strong{display:block;margin:5px 0 3px;font-size:29px;font-weight:500;line-height:1.2;letter-spacing:-.035em;font-variant-numeric:tabular-nums}
.dshi-resource>small{display:block;overflow:hidden;color:var(--dsw-alias-label-tertiary);font-size:10px;text-overflow:ellipsis;white-space:nowrap}
.dshi-footer{display:flex;justify-content:space-between;gap:18px;padding-top:17px;color:var(--dsw-alias-label-tertiary);font-size:10px}
.dshi-sec{padding-top:27px}
.dshi-sechead{display:flex;align-items:center;gap:10px;padding-bottom:13px;border-bottom:1px solid var(--dsw-alias-label-primary);font-size:12px;font-weight:600}
.dshi-sechead .dshi-sp{flex:1}
.dshi-table{width:100%;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l2) transparent}
.dshi-table>.dshi-row{min-width:680px;box-sizing:border-box}
.dshi-row[data-cols='history']{min-width:510px}
.dshi-row{display:grid;gap:8px;align-items:center;min-height:42px;padding:5px 0;border-bottom:1px solid var(--dsw-alias-border-l1);transition:background-color 120ms ease}
.dshi-row:not(.dshi-th):hover{background:var(--dsw-alias-interactive-bg-hover)}
.dshi-row:last-child{border-bottom:0}
.dshi-row[data-cols='money']{grid-template-columns:minmax(100px,1.4fr) 74px 62px 68px 94px minmax(80px,1fr) 24px}
.dshi-row[data-cols='device']{grid-template-columns:minmax(85px,1.1fr) 74px minmax(120px,1.4fr) minmax(85px,1fr) 66px 24px}
.dshi-row[data-cols='repo']{grid-template-columns:minmax(170px,1.5fr) 62px 88px minmax(100px,1fr) 24px}
.dshi-row[data-cols='key']{grid-template-columns:minmax(75px,1fr) minmax(75px,1fr) minmax(115px,1.6fr) minmax(85px,1fr) 96px 46px 24px}
.dshi-row[data-cols='history']{grid-template-columns:140px minmax(90px,1fr) 116px 116px}
.dshi-table>.dshi-row[data-cols='key']{min-width:730px}
.dshi-th{min-height:32px;padding:7px 0;color:var(--dsw-alias-label-tertiary);font-size:9px;font-weight:500;letter-spacing:.07em}
.dshi-in{box-sizing:border-box;width:100%;min-width:0;height:29px;padding:3px 5px;border:1px solid transparent;border-radius:4px;outline:none;background:transparent;color:var(--dsw-alias-label-primary);font-size:12px;font-family:inherit;transition:border-color 120ms ease,background-color 120ms ease}
.dshi-in:hover{border-color:var(--dsw-alias-border-l2)}
.dshi-in:focus{border-color:var(--dsw-alias-brand-primary);background:var(--dsw-alias-bg-base)}
.dshi-in::placeholder{color:var(--dsw-alias-label-tertiary);opacity:.65}
.dshi-in[data-num='yes']{text-align:right;font-variant-numeric:tabular-nums}
.dshi-num{padding:3px 5px;text-align:right;font-size:12px;font-variant-numeric:tabular-nums}
.dshi-mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:10px;color:var(--dsw-alias-label-secondary);word-break:break-all}
.dshi-muted{color:var(--dsw-alias-label-tertiary);font-size:11px}
.dshi-chip{display:inline-block;min-height:18px;padding:0 5px;border:1px solid var(--dsw-alias-border-l1);border-radius:3px;color:var(--dsw-alias-label-tertiary);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:9px;line-height:16px;white-space:nowrap}
.dshi-chip[data-tone='warn']{color:var(--dsw-alias-state-warn-primary);border-color:currentColor}
.dshi-chip[data-tone='bad']{color:var(--dsw-alias-state-error-primary);border-color:currentColor}
.dshi-del{width:24px;height:28px;padding:0;border:0;border-radius:4px;background:transparent;color:var(--dsw-alias-label-tertiary);font-size:15px;line-height:1;cursor:pointer}
.dshi-del:hover{background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-state-error-primary)}
.dshi-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;padding:22px 0;border-bottom:1px solid var(--dsw-alias-border-l1)}
.dshi-sum span{display:flex;flex-direction:column;gap:4px;color:var(--dsw-alias-label-tertiary);font-size:10px}
.dshi-sum b{color:var(--dsw-alias-label-primary);font-size:16px;font-weight:550;letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.dshi-empty{padding:22px 0;color:var(--dsw-alias-label-tertiary);font-size:11px}
.dshi-error{margin-top:12px;padding:9px 12px;border-left:2px solid var(--dsw-alias-state-error-primary);background:var(--dsw-alias-interactive-bg-hover);color:var(--dsw-alias-state-error-primary);font-size:11px}
.dshi-keyactions{display:flex;flex-direction:column;gap:1px}
.dshi-keyactions .dshi-btn{min-height:23px;padding:2px 4px;border-color:transparent;font-size:9px}
.dshi-entry{display:inline-flex;align-items:center;justify-content:center;flex:none;width:28px;height:28px;padding:0;border:none;border-radius:var(--dsw-radius-sm);background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer}
.dshi-entry:hover,.dshi-entry:active,.dshi-entry[data-active='yes']{background:transparent;color:var(--dsw-alias-label-secondary)}
.dshi-entry:focus-visible,.dshi-btn:focus-visible,.dshi-tab:focus-visible,.dshi-del:focus-visible,.dshi-textbtn:focus-visible{outline:var(--dsw-focus-ring-width) solid var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary));outline-offset:2px}
@container (max-width:760px){.dshi-root{padding:22px 20px 32px}.dshi-hero,.dshi-analytics,.dshi-lower{grid-template-columns:1fr}.dshi-netmain,.dshi-trend,.dshi-assets{padding-right:0}.dshi-balances,.dshi-allocation,.dshi-recent{padding:20px 0 0;border-left:0}.dshi-balances{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.dshi-balance{display:flex;flex-direction:column;padding:0;border:0}.dshi-allocation,.dshi-recent{margin-top:22px;border-top:1px solid var(--dsw-alias-border-l1)}.dshi-big{font-size:38px}.dshi-resource{padding:20px 14px}.dshi-spark{height:92px}}
@container (max-width:480px){.dshi-root{padding:18px 16px 28px}.dshi-bar{flex-wrap:wrap}.dshi-brand{flex:1 1 100%;margin-bottom:2px}.dshi-local{font-size:9px}.dshi-rate{margin-left:0}.dshi-bar>[data-variant='primary']{margin-left:auto}.dshi-bar{gap:8px}.dshi-rate{font-size:10px}.dshi-kicker span{display:block;margin:3px 0 0}.dshi-title{font-size:16px}.dshi-hero{padding-top:27px}.dshi-big{font-size:32px}.dshi-balances{gap:10px}.dshi-balance>strong{font-size:12px}.dshi-resource{padding:18px 10px}.dshi-resource>strong{font-size:25px}.dshi-footer{flex-direction:column;gap:4px}.dshi-sum{gap:12px}.dshi-sum b{font-size:14px}}
@media(prefers-reduced-motion:reduce){.dshi-root *{transition:none!important}}
`

    const EMPTY = { version: 2, rate: { HKD_CNY: 0.917 }, money: [], devices: [], repos: [], keys: [] }
    const KINDS = ['现金', '持仓', '负债']
    const CURRENCIES = ['CNY', 'HKD']
    const TYPES = ['服务器', '电脑']
    const STATES = ['在线', '离线', '未知']
    const TABS = ['overview', 'money', 'devices', 'repos', 'keys', 'history']
    const MONEY_FORMAT = new Intl.NumberFormat('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

    // ------------------------------------------------------------- formatting

    const num = (value) => {
      const parsed = typeof value === 'number' ? value : Number.parseFloat(String(value ?? '').replace(/,/g, ''))
      return Number.isFinite(parsed) ? parsed : 0
    }

    function money(value, currency = 'CNY') {
      const amount = num(value)
      const text = MONEY_FORMAT.format(Math.abs(amount))
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

    function installStyles() {
      const style = document.createElement('style')
      style.setAttribute('data-plugin-css', 'ledger')
      style.textContent = STYLES
      document.head.appendChild(style)
    }

    // installStyles() is called by the module factory, after all definitions.
    // Keeping the side effect below the factory would make it run at bundle
    // registration instead, outside the loader's style-ownership window.

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


    // ------------------------------------------------------------------ pieces

    function Cell(props) {
      const { value, onChange, numeric, placeholder, mono, label } = props
      return h('input', {
        className: mono ? 'dshi-in dshi-mono' : 'dshi-in',
        'data-num': numeric ? 'yes' : undefined,
        value: value ?? '',
        placeholder: placeholder ?? '',
        'aria-label': label || placeholder || '',
        inputMode: numeric ? 'decimal' : undefined,
        onChange: (event) => onChange?.(event.target.value),
      })
    }

    function Choice(props) {
      const { value, options, onChange, label } = props
      return h(
        'select',
        { className: 'dshi-in', value, 'aria-label': label || String(value || ''), onChange: (event) => onChange?.(event.target.value) },
        options.map((option) => h('option', { key: option, value: option }, option)),
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
      const accessibleLabel = props.label || ''
      const description = rows.map((value) => money(value)).join(' → ')
      return h(
        'svg',
        { className: 'dshi-spark', viewBox: '0 0 100 32', preserveAspectRatio: 'none', role: 'img', 'aria-label': `${accessibleLabel}: ${description}` },
        [0.25, 0.5, 0.75].map((ratio) => h('line', { key: ratio, x1: 0, y1: ratio * 32, x2: 100, y2: ratio * 32, stroke: 'var(--dsw-alias-border-l1)', strokeWidth: 0.6, strokeDasharray: '1 3', vectorEffect: 'non-scaling-stroke' })),
        h('path', { d: path, fill: 'none', stroke: 'var(--dsw-alias-brand-primary)', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' }),
        h('circle', { cx: 100, cy: 28 - ((values[values.length - 1] - min) / span) * 24, r: 2.2, fill: 'var(--dsw-alias-brand-primary)', stroke: 'var(--dsw-alias-bg-base)', strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' }),
      )
    }

    // ------------------------------------------------------------------- views

    function heading(title, detail, action) {
      return h('div', { className: 'dshi-heading' }, h('h3', null, title), action || (detail ? h('small', null, detail) : null))
    }

    function snapshotRows(snapshots, t, limit) {
      const rows = snapshots.slice(0, limit)
      if (rows.length === 0) return h('div', { className: 'dshi-empty' }, t('noSnapshots'))
      return rows.map((row, index) => {
        const previous = snapshots[index + 1]
        const delta = previous ? num(row.totals?.net) - num(previous.totals?.net) : 0
        return h(
          'div', { className: 'dshi-snapshotrow', key: row.at || index },
          h('span', null, stamp(row.at) || row.date || '—'),
          h('strong', null, signedMoney(row.totals?.net)),
          h('small', null, Object.values(row.counts || {}).reduce((sum, value) => sum + num(value), 0) + ' ' + t('entries')),
          h('small', null, previous ? `${delta >= 0 ? '+' : ''}${money(delta)}` : t('first')),
        )
      })
    }

    function overviewView(doc, snapshots, t, navigate) {
      const totals = totalsOf(doc)
      const latest = snapshots[0]
      const delta = latest ? totals.net - num(latest.totals?.net) : 0
      const percent = latest && num(latest.totals?.net) !== 0 ? (delta / Math.abs(num(latest.totals.net))) * 100 : 0
      const history = [...snapshots].reverse()
      const points = history.map((row) => row.totals?.net ?? 0).concat([totals.net])
      const first = history[0]
      const online = doc.devices.filter((item) => item.status === '在线').length
      const expiring = doc.keys.filter((item) => { const left = daysUntil(item.expiresAt); return left !== undefined && left <= 14 }).length
      const assets = doc.money.filter((item) => item.kind !== '负债').sort((a, b) => toCny(b, totals.rate) - toCny(a, totals.rate)).slice(0, 5)
      const allocation = (label, value) => h('div', { className: 'dshi-allocationrow', key: label },
        h('span', null, label), h('strong', null, totals.assets ? (value / totals.assets * 100).toFixed(1) + '%' : '—'),
        h('small', null, money(value)), h('div', { className: 'dshi-meter' }, h('i', { style: { width: (totals.assets ? value / totals.assets * 100 : 0) + '%' } })),
      )
      return h('div', null,
        h('section', { className: 'dshi-hero', 'aria-label': t('net') },
          h('div', { className: 'dshi-netmain' },
            h('div', { className: 'dshi-kicker' }, t('net'), h('span', null, 'NET WORTH · CNY')),
            h('div', { className: 'dshi-big' }, signedMoney(totals.net)),
            h('div', { className: 'dshi-delta', 'data-tone': delta > 0 ? 'up' : delta < 0 ? 'down' : undefined },
              latest ? h('span', { className: 'dshi-change' }, (delta >= 0 ? '+' : '') + money(delta) + '  ' + (percent >= 0 ? '+' : '') + percent.toFixed(2) + '%') : null,
              h('span', { className: 'dshi-muted' }, latest ? t('delta') + ' · ' + (latest.date || stamp(latest.at)) : t('ledgerHint')),
            ),
          ),
          h('div', { className: 'dshi-balances' },
            h('div', { className: 'dshi-balance' }, h('span', null, t('assets')), h('strong', null, money(totals.assets)), h('small', null, t('cash') + ' + ' + t('holdings'))),
            h('div', { className: 'dshi-balance' }, h('span', null, t('liability')), h('strong', { 'data-tone': totals.liability < 0 ? 'down' : undefined }, signedMoney(totals.liability)), h('small', null, t('net') + ' = ' + t('assets') + ' + ' + t('liability'))),
            h('div', { className: 'dshi-balance' }, h('span', null, t('rate')), h('strong', null, totals.rate.toFixed(4)), h('small', null, '1 HKD → CNY')),
          ),
        ),
        h('section', { className: 'dshi-analytics' },
          h('div', { className: 'dshi-trend' }, heading(t('trend'), snapshots.length + ' ' + t('snapshot')),
            h(Spark, { points, label: t('trend') }),
            h('div', { className: 'dshi-chartfoot' }, h('span', null, stamp(first?.at) || first?.date || '—'), h('span', null, t('unsavedPoint'))),
          ),
          h('div', { className: 'dshi-allocation' }, heading(t('composition'), 'CNY'), allocation(t('cash'), totals.cash), allocation(t('holdings'), totals.holdings)),
        ),
        h('section', { className: 'dshi-lower' },
          h('div', { className: 'dshi-assets' }, heading(t('money'), doc.money.length + ' ' + t('entries'), h('button', { className: 'dshi-textbtn', type: 'button', onClick: () => navigate?.('money') }, t('manage') + ' →')),
            assets.length === 0 ? h('div', { className: 'dshi-empty' }, t('noAssets')) : assets.map((item, index) => h('div', { className: 'dshi-assetrow', key: item.id || index },
              h('span', null, item.name || '—'), h('small', null, item.kind), h('strong', null, money(toCny(item, totals.rate))),
            )),
          ),
          h('div', { className: 'dshi-recent' }, heading(t('recent'), snapshots.length + ' ' + t('snapshot'), h('button', { className: 'dshi-textbtn', type: 'button', onClick: () => navigate?.('history') }, t('allHistory') + ' →')), snapshotRows(snapshots, t, 4)),
        ),
        h('section', { className: 'dshi-resources', 'aria-label': t('overview') },
          [[t('devices'), doc.devices.length, online + ' ' + t('online'), 'devices'],
           [t('repos'), doc.repos.length, t('sync'), 'repos'],
           [t('keys'), doc.keys.length, expiring + ' ' + t('expiringSoon'), 'keys']].map(([label, count, hint, tab]) =>
            h('button', { className: 'dshi-resource', type: 'button', key: tab, onClick: () => navigate?.(tab) },
              h('span', null, label), h('strong', null, String(count).padStart(2, '0')), h('small', null, hint),
            ),
          ),
        ),
      )
    }

    function historyView(snapshots, t) {
      return h('section', { className: 'dshi-sec' },
        h('div', { className: 'dshi-sechead' }, t('history'), h('span', { className: 'dshi-sp' }), h('span', { className: 'dshi-muted' }, snapshots.length + ' ' + t('snapshot'))),
        h('div', { className: 'dshi-table' },
          h('div', { className: 'dshi-row dshi-th', 'data-cols': 'history' }, h('span', null, t('updated')), h('span', null, t('totals')), h('span', { className: 'dshi-num' }, t('net')), h('span', { className: 'dshi-num' }, t('delta'))),
          snapshots.length === 0 ? h('div', { className: 'dshi-empty' }, t('noSnapshots')) : snapshots.map((row, index) => {
            const previous = snapshots[index + 1]
            const delta = previous ? num(row.totals?.net) - num(previous.totals?.net) : 0
            return h('div', { className: 'dshi-row', 'data-cols': 'history', key: row.at || index },
              h('span', { className: 'dshi-mono' }, stamp(row.at) || row.date || '—'),
              h('span', { className: 'dshi-muted' }, Object.values(row.counts || {}).reduce((sum, value) => sum + num(value), 0) + ' ' + t('entries')),
              h('span', { className: 'dshi-num' }, signedMoney(row.totals?.net)),
              h('span', { className: 'dshi-num', 'data-tone': delta > 0 ? 'up' : delta < 0 ? 'down' : undefined }, previous ? (delta >= 0 ? '+' : '') + money(delta) : t('first')),
            )
          }),
        ),
        h('div', { className: 'dshi-footer' }, h('span', null, t('ledgerHint')), h('span', null, 'CNY')),
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
          'div', { className: 'dshi-sum' },
          h('span', null, t('cash'), h('b', null, money(totals.cash))),
          h('span', null, t('holdings'), h('b', null, money(totals.holdings))),
          h('span', null, t('net'), h('b', null, signedMoney(totals.net))),
        ),
        h('div', { className: 'dshi-table' },
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
                    'aria-label': t('remove'),
                    onClick: () => setDoc({ ...doc, money: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
              ),
            ),
        ),
        h('div', { className: 'dshi-footer' }, h('span', null, t('assets') + ' ' + money(totals.assets) + ' · ' + t('liability') + ' ' + signedMoney(totals.liability)), h('span', null, '1 HKD = ' + totals.rate + ' CNY')),
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
        h('div', { className: 'dshi-table' },
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
                    'aria-label': t('remove'),
                    onClick: () => setDoc({ ...doc, devices: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
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
        h('div', { className: 'dshi-table' },
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
                    'aria-label': t('remove'),
                    onClick: () => setDoc({ ...doc, repos: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
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
      const copy = async (item) => {
        const value = String(item.value || '')
        if (!value) return
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value)
          else {
            const input = document.createElement('textarea')
            input.value = value
            input.setAttribute('readonly', '')
            input.style.position = 'fixed'
            input.style.opacity = '0'
            document.body.appendChild(input)
            input.select()
            document.execCommand('copy')
            input.remove()
          }
          setCopied(item.id)
          setTimeout(() => setCopied(''), 1800)
        } catch { setCopied('') }
      }
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
        h('div', { className: 'dshi-table' },
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
                      { className: 'dshi-in dshi-mono', type: 'button', title: t('reveal'), 'aria-label': t('reveal') + ' ' + (item.name || ''), style: { textAlign: 'left', cursor: 'pointer' }, onClick: () => toggle(item.id) },
                      maskKey(item.value) || '—',
                    ),
                h(Cell, { value: item.location, onChange: (value) => patch(index, 'location', value), placeholder: t('location') }),
                h(
                  'div',
                  { style: { display: 'flex', flexDirection: 'column', gap: '2px' } },
                  h(Cell, { value: item.expiresAt, onChange: (value) => patch(index, 'expiresAt', value), placeholder: '2026-12-31', label: t('expires') }),
                  tone ? h('span', { className: 'dshi-chip', 'data-tone': tone }, left < 0 ? t('expired') : `${t('expiring')} ${left}d`) : null,
                ),
                h(
                  'div',
                  { className: 'dshi-keyactions' },
                  h('button', { className: 'dshi-btn', type: 'button', title: open ? t('hide') : t('reveal'), 'aria-label': open ? t('hide') : t('reveal'), onClick: () => toggle(item.id) }, open ? t('hide') : t('reveal')),
                  h('button', { className: 'dshi-btn', type: 'button', disabled: !item.value, 'aria-label': t('copy') + ' ' + (item.name || ''), onClick: () => copy(item) }, copied === item.id ? t('copied') : t('copy')),
                ),
                h(
                  'button',
                  {
                    className: 'dshi-del',
                    type: 'button',
                    title: t('remove'),
                    'aria-label': t('remove'),
                    onClick: () => setDoc({ ...doc, keys: rows.filter((_, at) => at !== index) }),
                  },
                  '×',
                ),
              )
            }),
        ),
        h('div', { className: 'dshi-muted', style: { paddingTop: '8px' } }, t('keyHint')),
      )
    }

    // -------------------------------------------------------------------- panel

    function makePanel(ctx, t) {
      function Panel() {
        const [doc, setDoc] = useState(EMPTY)
        const [tab, setTab] = useState('overview')
        const [snapshots, setSnapshots] = useState([])
        const [error, setError] = useState('')
        const [busy, setBusy] = useState('')
        const [dirty, setDirty] = useState(false)
        const [revealed, setRevealed] = useState({})
        const [copied, setCopied] = useState('')

        const load = useCallback(async () => {
          const [assets, history] = await Promise.allSettled([request('/assets'), request('/snapshots?limit=120')])
          if (assets.status === 'fulfilled') {
            setDoc(assets.value.doc ?? EMPTY)
            setDirty(false)
            setError('')
          } else setError(String(assets.reason?.message ?? assets.reason))
          setSnapshots(history.status === 'fulfilled' && Array.isArray(history.value.snapshots) ? history.value.snapshots : [])
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
        else body = overviewView(doc, snapshots, t, setTab)

        return h(
          'div',
          { className: 'dshi-root' },
          h(
            'div',
            { className: 'dshi-bar' },
            h('div', { className: 'dshi-brand' }, h('span', { className: 'dshi-title' }, t('title')), h('span', { className: 'dshi-local' }, t('localOnly'))),
            h('label', { className: 'dshi-rate' }, h('span', null, t('rateHint')), h(Cell, {
              label: t('rateHint') + ' CNY',
              value: rate,
              numeric: true,
              onChange: (value) => update({ ...doc, rate: { ...doc.rate, HKD_CNY: value } }),
            }), h('span', null, 'CNY')),
            dirty ? h('span', { className: 'dshi-chip' }, t('dirty')) : null,
            h('button', { className: 'dshi-btn', type: 'button', 'data-variant': 'primary', disabled: Boolean(busy), onClick: save }, busy === 'save' ? t('saving') : t('save')),
          ),
          h(
            'nav',
            { className: 'dshi-tabs', 'aria-label': t('title') },
            TABS.map((id) =>
              h('button', { key: id, className: 'dshi-tab', type: 'button', 'data-on': tab === id ? 'yes' : 'no', 'aria-current': tab === id ? 'page' : undefined, onClick: () => setTab(id) }, t(id)),
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

    installStyles()

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
          ctx.slots.register({ name: 'main', key: PANEL_ID, locale: NS, inject: () => ({ t }) }, function LedgerPage() {
            return h(Boundary, { t }, h(Panel, null))
          }),
        )
      },
      __test__: {
        DICTIONARIES,
        request,
        overviewView,
        historyView,
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