/**
 * Turn the merged config into the few lines an agent actually needs.
 * The budget is deliberate: this text rides on every single model step.
 */
export const MAX_ENTRIES = 8
export const MAX_CHARS = 1200

function describeHost(id, entry) {
  const parts = []
  if (entry.command) parts.push(`\`${entry.command}\``)
  const facts = [entry.os, entry.specs].filter(Boolean)
  if (facts.length > 0) parts.push(facts.join(' / '))
  let line = `- 机器 ${entry.label ?? id}：${parts.join(' · ')}`
  if (entry.note) line += ` —— ${entry.note}`
  return line
}

function describeGit(id, entry) {
  const bits = []
  if (entry.remote) bits.push(entry.remote)
  if (entry.auth) bits.push(`走 ${entry.auth}`)
  if (entry.key) bits.push(`key ${entry.key}`)
  let line = `- 仓库 ${entry.label ?? id}：${bits.join(' · ')}`
  if (entry.rule) line += ` —— ${entry.rule}`
  return line
}

export function renderKnowledge(merged, { cwd, maxEntries = MAX_ENTRIES, maxChars = MAX_CHARS } = {}) {
  if (!merged) return ''
  const hosts = Object.entries(merged.hosts ?? {}).map(([id, entry]) => describeHost(id, entry))
  const git = Object.entries(merged.git ?? {}).map(([id, entry]) => describeGit(id, entry))
  const derived = Object.values(merged.git ?? {}).some((entry) => entry?.auth === 'ssh')
    ? ['- 已有可用 SSH key：不要用 ssh-keygen 新建，也不要把 remote 改成 https（会被拦截）']
    : []
  const rules = [...derived, ...(merged.rules ?? []).map((rule) => `- ${rule.reason ?? rule.match}`)]
  if (hosts.length + git.length === 0 && rules.length === 0 && !merged.remote) return ''

  const header = ['## 基础设施（用户维护的公共知识，优先于任何猜测）']
  if (merged.project) header.push(`本项目：${merged.project}`)
  const body = [...git, ...hosts].slice(0, maxEntries)
  const hidden = git.length + hosts.length - body.length
  const blocks = [header.join('\n'), ...(body.length > 0 ? [body.join('\n')] : [])]
  if (rules.length > 0) blocks.push(['必须遵守：', ...rules].join('\n'))
  const missing = (merged.counts?.globalHosts ?? 0) + (merged.counts?.globalGit ?? 0) - (merged.hosts ? Object.keys(merged.hosts).length : 0) - (merged.git ? Object.keys(merged.git).length : 0)
  if (hidden > 0 || missing > 0) {
    blocks.push(`（还有 ${Math.max(hidden, missing, 0)} 条未列入，完整清单在侧栏 Infra 面板；需要时可以问用户。）`)
  }
  if (cwd) blocks.push(`工作目录：${cwd}`)

  let text = blocks.join('\n\n')
  if (text.length > maxChars) text = `${text.slice(0, maxChars - 24).trimEnd()}\n…（已截断，完整清单在面板）`
  return text
}
