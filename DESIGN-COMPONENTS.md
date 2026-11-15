# DESIGN-COMPONENTS — 组件词典

> 建立：2026-11-15（设计知识库应用批 KB-04）。组织法借 #53 The Component Gallery
> 「组件 = 定义 + 别名 + 实例」与 #86 Fonts In Use 的档案法（每条登记字体角色与字重实证）。
> 用途：新页面/新批次开工先查本词典复用既有组件，不再造同物异名的新组件；
> 改词典内组件前先读其「禁改项」。本词典只登记仓库实存组件（每条均经 grep 对账）。

约定：状态码 F=免签 / A=落地签 / E=电子签 / T=ETA / R=需签证 / N=不准入境，
状态色 token 为 `--f/--a/--e/--t/--r/--n` 与对应 `--*-bg`（Base.astro `:root`）。
2026-11-15 KB-01 起每状态另有 `--*-border`（边框步）与 `--*-solid`（实心步，
供状态点与实心徽章）两个角色步；中性色另有 KB-06 角色别名层，详见文末附录。

---

## 1. 货架 Shelf

- **定义**：配对页唯一的商业报价组件，按路线状态组装主报价、备选与次级报价，并与官方路线并行展示。
- **别名**：货架 / shelf / 卡组（旧称）。
- **构成**：`src/components/Shelf.astro`；props = `status / passportName / destinationName / passportCode / destinationCode / pos / locale`。三种形态：
  - `pos="top"` 完整卡片：R 状态为 `.shelf--featured`（eVisas 全宽主卡 `.card.featured` + `.alt-line` 备选行）；其余状态 `.shelf--duo`（eVisas 主卡 + 保险/eSIM 次卡组）。
  - `pos="bottom"` 紧凑行：`.shelf--quick`，同批报价改以 `.qrow` 单行呈现 + `.alt-line`；href、`data-offer` 锚点、sid 深链与 top 完全一致。
  - `.alt-line` 备选行：VisaHQ 的文字行形态（`.alt-k` + `.alt-link`），top 与 bottom 各一份。
  - 状态 N 不渲染。
- **实例**：任一配对页，如 `/visa/japan/thailand/`（verdict 下方 top、材料清单下方 bottom）。
- **字体角色**：卡内 `.k` 为小号大写 kicker、`.t` 为报价方名（组件内样式）。
- **禁改项**：槽位构成与顺序、全部 `data-offer` 锚点（`evisas-top/bottom`、`visahq-*`、`safetywing-*`、`worldnomads-*`、`airalo-*`）为变现定版，未经协调人裁决不得增删或改名；官方路线说明（`.official-note`）必须与付费报价并行出现。

## 2. 材料清单 Checklist（配对页）

- **定义**：配对页「要带什么」的逐项清单，普通项为勾选行，带官方出处的事实注记为事实行。
- **别名**：清单 / 材料清单 / checklist。
- **构成**：markup 在 `src/views/PairView.astro`（`.checklist-card > ul.checklist > li`，图标 `.ck-ic`）；样式在 `src/layouts/Base.astro`（`.checklist-card`、`ul.checklist li`）。事实行变体 `li.ck-fact`：浅绿底（事实注记专用），内含 `.ck-src` 来源标注（13.5px，链接 600 字重）。
- **实例**：任一配对页的材料清单区；事实行见 B10 保险事实覆盖的路线页。
- **字体角色**：行文 15.5px（移动 15px）；来源标注 13.5px / 600。
- **禁改项**：事实行必须带可点官方出处（`.ck-src`）；文件服务类清单行（证件照/翻译）接入时复用本组件的事实行形态，不另起卡片（接入条件见变现审计口径）。

## 3. 路线行 Route Line（政策页）

- **定义**：政策变更条目里指向受影响配对页的链接行，让「哪条路线变了」一键可达。
- **别名**：路线行 / tl-route。
- **构成**：`src/views/PolicyChangesView.astro`：`.tl-routes` 容器内的 `a.tl-route`，内含 `.tl-route-meta`（路线元信息）。
- **实例**：`/visa-policy-changes/` 每条变更卡内。
- **禁改项**：链接目标必须是站内配对页路径，不得改指外部站点。

## 4. 规格卡 Spec Card

- **定义**：配对页的结构化规格表：要求、最长停留、何时申请、核验证据，四行说清一条路线的硬参数。
- **别名**：规格卡 / spec card。
- **构成**：markup 在 `src/views/PairView.astro`（`.spec-card > dl > .spec-row`，每行 `dt` 标签 + `dd` 值）；样式在 `src/layouts/Base.astro`（卡：`--card` 底、`--line` 边、16px 圆角；行：15.5px，`dt` 固定 190px / 600 / `--muted`，`dd` 600 + tabular-nums，移动端改纵排）。变体 `.spec-card.guide-box`：深度指南框（费用/处理时长/停留/文件四行，文件为内嵌列表）。
- **实例**：任一配对页清单之后；guide-box 见深度列覆盖的目的地路线页。
- **字体角色**：标签 600 弱化色、值 600 主色，数字一律 tabular-nums。
- **禁改项**：行内数值只能来自数据层（overrides/verified），不得在组件里手写；核验证据行必须保留官方来源链接。

## 5. 粘性条 Sticky Bar

- **定义**：配对页移动端底部固定行动条，一句话状态 + 主报价按钮，是移动转化路径的常驻入口。
- **别名**：粘性条 / 底栏 / sticky bar。
- **构成**：markup 在 `src/views/PairView.astro`（`.sticky-bar`，仅状态 R/E/T 渲染，`role="complementary"`；`.sb-text` + `a.sb-btn[data-offer="evisas-bar"]`）；样式在 `src/layouts/Base.astro`（桌面 `display:none`，移动端固定底部；页面有粘性条时 `body` 留 74px 底距）。
- **实例**：移动端打开任一 R/E/T 状态配对页。
- **字体角色**：`.sb-text` 13px / 700，两行截断（`-webkit-line-clamp: 2`，QA-012 定版）。
- **禁改项**：变现定版槽位之一；两行截断与 74px 底距不得回退；文案按状态三分支（R/E/T）不得合并成一句通稿。

## 6. 状态 Chip 与状态点 Status Chip / Dot

- **定义**：表达六种签证状态的最小语义单元——chip 是带字形徽的胶囊标签，sdot 是无文字的 9px 圆点。
- **别名**：状态 chip / 状态标签；状态点 / sdot。
- **构成**：均定义于 `src/layouts/Base.astro`。`.chip`：13px / 700，内嵌 `.g` 圆形字形徽（15px，`<i>` 放状态字母）；`.chip.F/.A/.E/.T/.R/.N` 分别取 `--f/--a/--e/--t/--r/--n` 前景、对应 `--*-bg` 底与同系边框。`.sdot`：9px 圆点，`.sdot.<状态>` 取状态实色。
- **实例**：chip——配对页规格卡「要求」行、首页路线卡（`.route-card .chip`）；sdot——护照/目的地枢纽页的分组标题与路线卡（`.rc-top`）、`/map/` 图例。
- **字体角色**：chip 13px / 700 + tabular-nums。
- **禁改项**：状态与颜色的映射只能经 `--f…--n` token 改，不得在用例处另写状态色；新增状态先加 token 再加类。

## 7. 事实瓷砖 Fact Tile

- **定义**：verdict 区下方的关键事实小块：小标签 + 大值，三联并排，一眼读完路线的核心数字。
- **别名**：事实瓷砖 / fact tile。
- **构成**：定义于 `src/layouts/Base.astro`：`.fact-tiles` 三列网格（移动单列）+ `.fact-tile`（半透明白底、`--line` 边、12px 圆角），内含 `.fl` 标签与 `.fv` 值。
- **实例**：配对页 verdict 区下方三联（`src/views/PairView.astro`）。
- **字体角色**：`.fl` 11.5px / 700 / 大写 / `--muted`；`.fv` 15.5px / 700 / tabular-nums。
- **禁改项**：值只能来自数据层；瓷砖数保持三联，不往里塞营销文案。

## 8. 核验印章块 Seal Block

- **定义**：承载「本页数据核验状态」的横幅块：印章图 + 一句状态说明，是全站信任信号的统一出口。
- **别名**：印章块 / seal / 核验条。
- **构成**：定义于 `src/layouts/Base.astro`（`.seal-block`：flex、16px 圆角、`.seal-art` 印章图）；变体 `.seal-block.verified`（已核验）/ `.seal-block.pending`（待核验），首页另有 `.compact` 紧凑变体。
- **实例**：配对页 verdict 区（verified/pending 随数据状态）、首页（compact）、`/about/` 方法论页。
- **禁改项**：verified/pending 的判定只能来自 verified 数据层，不得按页面手工指定；印章文案不得出现未经核验的覆盖率断言。

## 9. 下载按钮 Download Button（数据集）

- **定义**：开放数据集的两个 CSV 下载入口（全部路线 / 仅已核验路线），位于榜单页数据集区。
- **别名**：下载按钮 / dl-btn。
- **构成**：`src/views/RankingView.astro`：容器 `p.rank-data-btns`（flex、gap 10px、上下 margin 14px/8px），按钮为 `a.dl-btn[download]`，样式经 `.rank-data-btns a`（主按钮 `--brand` 底白字；末按钮为描边形态）。按钮行下方紧跟许可行（`p.muted.small`，CC BY-NC 4.0）。
- **实例**：`/passport-ranking/#dataset`（六语同构）。
- **字体角色**：15px / 650，最小高度 44px。
- **禁改项**：①按钮与许可行的相对位置与间距为事故后定版（2026-11-15 重叠修复），改动数据集区排版时不得触碰；②新链接若无 class 会被 Base 全局规则 `main p a:not([class])` 命中（负 margin 拉叠），数据集区加链接必须带 class；③已知怪癖：末按钮 `background: var(--surface)` 的 `--surface` 未定义、渲染回退为透明——现状即上线状态，修复须另批并做像素对照，不得顺手改。

## 10. 计数丸 Count Pill

- **定义**：分组标题行内的计数胶囊，把「这一组有多少条」贴在标题右侧。
- **别名**：计数丸 / count pill。
- **构成**：定义于 `src/layouts/Base.astro`（`.count-pill`：`--soft` 底、`--line` 边、13.5px / 700 / tabular-nums、左距 9px）。
- **实例**：护照枢纽页与目的地枢纽页的状态分组 `<summary>`、对比页结果分组标题。
- **禁改项**：数字必须由分组数据现场计算，不得写死。

## 11. 查询器（三件套）Route Checker Trio

- **定义**：全站唯一的路线查询入口组件族：一个分发器 + 英文实现 + 本地化实现，不得再有第四套。
- **别名**：查询器 / checker / 路线查询。
- **构成**：
  - `src/components/RouteChecker.astro`——分发器，按 locale 选实现；挂载于 HomeView（首页）、VisaIndexView（/visa/）、NotFoundView（404）。
  - `src/components/Checker.astro`——英文实现，自身无脚本，由 `src/layouts/Base.astro` 的脚本驱动（EN 输出字节一致为既有约束）。
  - `src/components/CheckerZh.astro`——本地化实现（zh-hans/zh-hant/ja/ko/th 共用），自带脚本，是跨语言建议的参考实现（输入任意语言/罗马字、结果按当前页语言显示）。
- **禁改项**：新页面要查询器一律挂 RouteChecker；改 Checker.astro 前先想 EN 字节一致约束；语言偏好回放逻辑（vf_lang）与查询器联动，动其一必验其二（BUG-002 教训）。

---

## 附：token 登记（KB-01 / KB-06 / KB-16，2026-11-15）

**状态色角色步（KB-01）**——每状态四步，色相不变、只分角色：
背景步 `--*-bg`（浅底）、文本步 `--*`（文字与图标线）、边框步 `--*-border`
（chip/行边框）、实心步 `--*-solid`（状态点 `.sdot` 与 `.fchip.on` 实心底；
其值按「白字对比 ≥4.65:1」逐个校准）。配对页自有状态面（verdict/chip/
spec-card）仍用文本步，待 KB-02 统一消费。

**中性色角色别名（KB-06）**——别名值为 var() 引用，不可能与源值漂移：
`--text-1/2/3` = ink/ink-2/muted；`--surface-1/2/3` = paper/card/soft；
`--border-1/2` = line/line-strong。旧名继续有效，新代码按角色取色。
注意：未定义 `--surface` 裸名（第 9 条 `.dl-btn` 的已知怪癖与之无关，勿顺手「修复」）。

**动效时长阶梯（KB-16）**——Base.astro 全局样式的时长已全量 token 化，
规则里禁止再出现字面时长（`.01ms` reduced-motion 惯例值与 `0s` 除外）：
锚点步（新动效优先取这三档）：`--dur-1` 150ms / `--dur-2` 250ms / `--dur-3` 450ms；
存量保值步（保持既有渲染值、只终结散写）：`--dur-140` `--dur-160` `--dur-180`
`--dur-200` `--dur-280` `--dur-300` `--dur-320` `--dur-480` `--dur-500`
`--dur-600` `--dur-700` `--dur-1000`。曲线统一 `--ease` / `--spring`。

---

*维护：新增组件先在本词典登记再进代码；组件改名/下线同步更新本词典与 CHECKLIST（design-kb-apply-2026-11-15）。*
