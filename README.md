# dsh-infra · 基础设施清单（DSH 插件）

给 DeepSeek Harness 用的「机器 + 仓库」公共知识库：**一处维护，所有会话都知道，agent 不用猜**。

它解决的是具体的一类事故：agent 要 push 代码，发现没权限，于是自己 `ssh-keygen` 造了把新 key——而机器上早就配好了。或者它不知道该用 `ssh home` 还是 `ssh tx`，开始一个个试。

## 三个界面，一份 YAML

| 界面 | 位置 | 用途 |
|---|---|---|
| **Infra 入口** | 侧栏底部、两枚胶囊右边，只有一个锁图标（悬停才有底色，打开时变蓝） | 点开主区域的 Infra 面板，再点一次回对话 |
| **Infra 面板** | 主区域 | 全部机器 / 仓库 / 规则一览；复制连接命令；逐条探活；增删改；从本机自动发现候选 |
| **仓库视图** | 对话区上方（与「对话 / 轨迹 / 上下文」并列） | 本项目的远端、认证方式、key、工作目录；一键「切到 SSH」；设置提交身份 |

三者读同一份文件、走同一个宿主路由，所以面板里改完，仓库视图立刻一致——不存在「两个地方各记一半」。

## 配置

```yaml
version: 1
project: aluolaCRM            # 项目级文件里写；全局里写会被覆盖

hosts:                        # 机器
  home:
    label: 家里的 Linux
    command: ssh home         # 面板上「复制」按钮复制这一行
    os: Ubuntu 24.04
    specs: i5-12400 / 32G
    note: 重启/改配置先问
    check: ssh -o BatchMode=yes -o ConnectTimeout=5 home true
    projects: ['/Users/chrisz/Documents/**']   # 可选：只在匹配的目录里生效

git:                          # 仓库
  dsh-token-pill:
    label: dsh-token-pill
    remote: git@github.com:ChrisZqaq/dsh-token-pill.git
    auth: ssh
    key: ~/.ssh/id_ed25519
    rule: 已有 key，不要新建；不要改成 https

rules:                        # 自定义拦截（正则，不分大小写）
  - id: no-wipe
    match: (^|[\s;&|])rm\s+-rf\s+/(?!tmp)
    reason: 不要整目录删除，先在面板里确认目标
```

文件位置：

- 全局 `~/.dsh/infra/infra.yml`
- 项目 `<workspace>/.dsh/infra.yml`（同名 id 覆盖全局条目，项目规则排在全局规则之后）

**只放指针，不放秘密**：命令、主机名、端口、`IdentityFile` 的路径、凭据的引用名。密码、私钥、token 一律不进来——真需要读取密钥时用 DSH 自己的 `credentials`，不要在这里复制一份。

## 注入：全局一句 + 项目详情

宿主在 `agent/created` 时解析该会话的工作目录，然后**只给这个 agent** 注册一段 prompt section（`order: 450`，在 persona 之后、plan policy 之前）：

```
## 基础设施（用户维护的公共知识，优先于任何猜测）

本项目：aluolaCRM

- 仓库 dsh-token-pill：git@github.com:ChrisZqaq/dsh-token-pill.git · 走 ssh · key ~/.ssh/id_ed25519 —— 已有 key，不要新建
- 机器 家里的 Linux：`ssh home` · Ubuntu 24.04 / i5-12400 / 32G —— 重启/改配置先问

必须遵守：
- 已有 key，不要新建

（还有 3 条未列入，完整清单在侧栏 Infra 面板；需要时可以问用户。）
```

约束：最多 8 条、最多 1200 字符、超了显式标注「已截断」。它在每一步都占 token，所以宁短勿长——详情留在面板里，人要看就点开。

因为注册在**每个 agent 自己的作用域**上，A 项目的主机不会漏进 B 项目的 prompt。

## 拦截：只拒绝，不改写

用 `tools.guard` 注册**单调拒绝**（返回理由即拒绝，不能替你改写命令）：

| 规则 | 触发条件 |
|---|---|
| `no-new-ssh-key` | 项目里有 `auth: ssh` 的仓库 且 命令含 `ssh-keygen`（含 `sudo ssh-keygen`） |
| `no-gh-key-add` | 同上，且含 `gh ssh-key add` |
| `no-https-remote` | 同上，且 `git remote set-url … https://` |
| `no-inline-private-key` | 任何命令里出现 `-----BEGIN … PRIVATE KEY-----` |
| `rules:` 里的自定义条目 | 命中正则即拒绝 |

只拦 `bash` 工具（`run_code` 里再套 shell 不在拦截范围内——这是已知缺口）。

## 自动发现

面板「发现」按钮会读，**只读、且要你逐条确认后才会写进 YAML**：

- `~/.ssh/config` 里的 Host 别名（跳过 `*` 通配与 `Match` 块）→ 机器候选
- `~/.ssh/*.pub` 列表
- 当前目录的 `git remote get-url origin` → 仓库候选
- `gh auth status` 的账号名（绝不读 token）

## 安装

```bash
cd plugins/dsh-infra
npm install                    # 只有一个依赖：yaml
```

然后在 DSH 里：

```
plugin_manager install_bundle target=/绝对路径/plugins/dsh-infra
```

或直接把这一行放进 profile 的 `cordis.patch.yml`：

```yaml
- insert:
    - id: dsh-infra
      name: '@local/dsh-infra'
      config: {}
```

装好后刷新页面：侧栏底部两枚胶囊右边出现一个锁图标（悬停才显出底色，选中变蓝），点开是 Infra 面板；对话区上方出现「仓库」。

## 自检

```bash
node scripts/verify.mjs
```

不需要浏览器、不需要 Host、不写任何真实文件：桩掉 ModuleLoader / React / Cordis，检查槽位契约、YAML 读写、ssh_config 解析、prompt 渲染预算、guard 判定、子进程超时与路由状态码。当前 67 项全过。

## 已知局限

- 只拦 `bash`；`run_code` 内部再起 shell 拦不到。
- 探活走本机命令（`ssh -o BatchMode=yes …` / `git ls-remote`），需要免密登录或已加载的 ssh-agent；`git ls-remote` 会真的连网。
- 自动发现只认 ssh_config 别名与当前目录的 origin，不扫别处的私钥、不解析云厂商 API。
- 没有加密存储：这里不是密码库。密钥留在 `~/.ssh` 或 DSH `credentials` 里。
- 面板的编辑表单只写全局文件；项目级条目请直接编辑 `<workspace>/.dsh/infra.yml`（或把 `file` 传成 `project`）。
