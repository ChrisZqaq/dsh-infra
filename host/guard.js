/**
 * Monotonic denial only: a guard can refuse a command with a reason, never
 * silently rewrite it. Built-in rules cover the mistake that motivated this
 * plugin — an agent minting a fresh SSH key for a repo that already has one.
 */
const KEYGEN = /(^|[\s;&|(])(sudo\s+)?ssh-keygen\b/i
/** Read-only modes (list / print fingerprint / check known host); no `i` flag,
 *  because with it `-f <path>` would look like `-F <hostfile>`. */
const KEYGEN_READ_ONLY = /(^|\s)-[lLyFR](\s|$)/
const SET_URL_HTTPS = /\bgit\s+remote\s+set-url\b[^\n]*\bhttps?:\/\//i
const GH_KEY_ADD = /\bgh\s+ssh-key\s+add\b/i
const KEY_IN_TREE = /-----BEGIN [A-Z ]*PRIVATE KEY-----/

const BUILTIN = [
  { id: 'no-new-ssh-key', test: (command) => KEYGEN.test(command) && !KEYGEN_READ_ONLY.test(command), reason: '这台机器已经有可用的 SSH key，不要新建。先看侧栏 Infra 面板里的“机器/仓库”条目；确实需要新 key 时先问用户。', when: 'ssh-git' },
  { id: 'no-gh-key-add', match: GH_KEY_ADD, reason: '不要向 GitHub 追加新的 SSH key。已有 key 请复用；确需新增时先问用户。', when: 'ssh-git' },
  { id: 'no-https-remote', match: SET_URL_HTTPS, reason: '本仓库走 SSH，不要改成 https。', when: 'ssh-git' },
  { id: 'no-inline-private-key', match: KEY_IN_TREE, reason: '不要把私钥内容写进命令或文件；清单里只记录 key 的路径。', when: 'always' },
]

function hasSshGit(merged) {
  return Object.values(merged?.git ?? {}).some((entry) => entry?.auth === 'ssh')
}

export function activeRules(merged) {
  const sshGit = hasSshGit(merged)
  const builtins = BUILTIN.filter((rule) => rule.when === 'always' || sshGit)
  const custom = (merged?.rules ?? []).map((rule) => ({
    id: rule.id ?? rule.match,
    match: rule.match,
    reason: rule.reason ?? `该命令被规则 ${rule.id ?? rule.match} 拦截。`,
    custom: true,
  }))
  return [...builtins.map((rule) => ({ id: rule.id, reason: rule.reason, test: rule.test, match: rule.match })), ...custom]
}

/** @returns {string | undefined} the denial reason, or undefined to allow. */
export function checkCommand(merged, command) {
  if (typeof command !== 'string' || command.length === 0) return undefined
  for (const rule of activeRules(merged)) {
    const matched =
      typeof rule.test === 'function'
        ? rule.test(command)
        : rule.match instanceof RegExp
          ? rule.match.test(command)
          : safeRegex(rule.match)?.test(command)
    if (matched) return rule.reason
  }
  return undefined
}

function safeRegex(source) {
  try {
    return new RegExp(String(source), 'i')
  } catch {
    return undefined
  }
}
