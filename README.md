# dsh-infra · 个人资产记录（DSH 插件）

侧栏底部一个 `$` 图标，点开是一本**只属于这台机器**的账：手上有多少钱、有哪些服务器和电脑、GitHub 上有哪些仓库、正在用哪些 API KEY。每次保存留一份快照，能看见资产净值怎么变。

数据落在插件仓外面，不进 git，不上传，也不进任何 prompt。

## 面板里有什么

| 页签 | 记什么 |
|---|---|
| **总览** | 资产小计 / 负债 / 净资产三个数字，较上次变化的百分比，一条净值走势线，四类条目计数 |
| **货币** | 现金、持仓、负债三类；人民币与港币两种币种；数量 × 单价 = 市值；同类小计、分币种小计、合计三级 |
| **设备** | 服务器与电脑：名称、类型、连接地址（如 `ssh tx`）、配置、状态 |
| **仓库** | GitHub 仓库全量列表：可见性、语言、最近提交、说明；「同步仓库」一键拉取 |
| **密钥** | 名称、用途、明文值、存放位置、到期日；列表里默认 `sk-a*****mnop`，点「查看」才展开 |
| **历史** | 每次保存的时间、条目数、当时净资产、与前一次的差额 |

汇率是**手填**的（面板顶部「1 港币 = ___」），不联网、不猜；港币条目按这个汇率折算进人民币合计，同时保留港币原币小计。

## 数据放在哪

```
~/.dsh/infra/assets.yml       当前状态。人能直接改，改完刷新面板即可
~/.dsh/infra/snapshots.jsonl  只追加，一行一份完整快照
```

`assets.yml` 结构：

```yaml
version: 2
updatedAt: 2026-11-13T11:00:00.000Z
rate:
  HKD_CNY: 0.917
money:
  - { id: money-1, name: 招行活期, kind: 现金, currency: CNY, quantity: 1, price: 24000, note: '' }
  - { id: money-2, name: 腾讯, kind: 持仓, currency: HKD, quantity: 200, price: 380, note: 港股 }
  - { id: money-3, name: 房贷, kind: 负债, currency: CNY, quantity: 1, price: 800000, note: '' }
devices:
  - { id: device-1, name: 腾讯云, type: 服务器, address: ssh tx, specs: 2C2G · Ubuntu 24.04, status: 在线, note: 生产机，重启先问 }
repos:
  - { id: repo-1, name: ChrisZqaq/dsh-infra, visibility: public, language: JavaScript, committedAt: 2026-11-13, description: 资产面板, remote: git@github.com:ChrisZqaq/dsh-infra.git, note: '' }
keys:
  - { id: key-1, name: OpenAI, purpose: 文本, value: sk-xxxxxxxx, location: 1Password, expiresAt: 2027-01-01 }
```

**负债填正数**：面板按 `kind: 负债` 自己加负号，合计里不会重复抵减。

密钥是明文存的（面板显示时才省略）。要么放进 `~/.dsh/infra/`（仓外、无同步），要么填 `location` 只记位置、`value` 留空。

## 汇率与合计怎么算

```
现金 = Σ(kind=现金) 折算人民币     持仓 = Σ(kind=持仓) 折算人民币
资产小计 = 现金 + 持仓             负债 = -Σ(kind=负债) 折算人民币
净资产 = 资产小计 + 负债
```

快照把当时的 `rate` 和 `totals` 一起存进去，所以以后改汇率不会污染历史曲线。

## 同步仓库

「同步仓库」调 `gh repo list --limit 300`，只读。合并规则：

- GitHub 覆盖 `name / visibility / language / committedAt / description / remote` 六项；
- `note` 是本地手写的，同步永远不动它；
- GitHub 上已经没有的仓库留在列表里，不自动删。

`gh` 没登录时面板显示真实报错（`gh: not logged in`），不会静默失败。

## 宿主面

一个路由前缀 `/dsh-infra`，四个端点，全部 same-origin：

| 端点 | 作用 |
|---|---|
| `GET /dsh-infra/assets` | 当前文档 + 合计 + 两个文件路径 |
| `POST /dsh-infra/assets` | 整份写回；`{snapshot:true}` 时额外追加一行快照 |
| `GET /dsh-infra/snapshots?limit=120` | 历史列表（只回摘要，不回全量副本） |
| `POST /dsh-infra/github/sync` | 读 `gh`，合并进 `repos` |

宿主只 `inject: ['webServer', 'subprocess']`。这一版**不再**注入 prompt section、不再拦截命令、不再扫 `~/.ssh`——面板就是面板。

## 安装

已经在 `desktop` profile 里（`link:` 指向本仓）。全新机器：

```bash
pnpm install               # 只有一个运行时依赖：yaml
pnpm install --offline     # 本机已有 pnpm store 时用这个
```

或者从聚合仓装：

```bash
./install.sh --plugin dsh-infra --profile desktop
```

装好后刷新页面：侧栏底部两枚胶囊右边出现一个 `$`，点开就是资产面板。

## 自检

```bash
node scripts/verify.mjs
```

不开浏览器、不连 Host、不写仓内文件（数据目录用 `DSH_INFRA_DIR` 指到临时目录）。桩掉 ModuleLoader / React / Cordis 后检查：槽位契约、`$` 图标几何、三级合计、跨币种折算、掩码长度、YAML 往返、非法 YAML 报错、快照追加与倒序、坏行跳过、`gh` 合并规则、四个路由的状态码，以及 0.1.1 的 `infra.yml` 一次性迁移。当前 **80 项全过**。

## 已知局限

- 汇率手填，没有行情源；改汇率后历史快照不受影响，但旧快照不会自动重算。
- 净资产走势线只画最近 120 个快照点，没有缩放、没有坐标轴。
- `gh repo list` 只列当前登录账号能看到的仓库；组织里没授权的看不到。
- `snapshots.jsonl` 只增不减，没有清理界面（文件很小，一行约 1 KB；需要时手工删）。
- 面板是单页六页签，没有搜索和排序；条目多了靠 `assets.yml` 里手改更快。
