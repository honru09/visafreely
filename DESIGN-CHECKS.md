# DESIGN-CHECKS — 界面细则走查表

> 建立：2026-11-15（设计知识库应用批 KB-07）。来源：#51 Vercel Web Interface
> Guidelines（官网核验，补核版）——把手感写成可勾选的参数条目；本表对照本站
> 现状逐条判定，判定均经仓库实地核对（2026-11-15），不是照抄条文。
> 用途：每批施工验收时逐条过本表；判定变化时同步更新本表与判定日期。

判定口径：**已达标**＝现状满足条目；**已达标（本站口径）**＝本站有既定标准
且与条文数值有登记在案的差异；**已知例外**＝有意保留、理由登记；**待补**＝
未达标、已排期或待立项。

| # | 条目（Vercel 口径） | 本站判定 | 实证（2026-11-15 核对） |
|---|---|---|---|
| 1 | 命中区：视觉尺寸 <24px 的控件，命中区 ≥24px；移动端控件约 44px | 已达标（本站口径） | 移动端主控件本站标准为 ≥40px 高（QA-004 定版）：`.fchip`/`.pair-chip`/`.source-chip`/`.route-chip`/`.tl-route` 均有 `min-height: 40px`（≤720px 块）；数据集 `.dl-btn` 为 44px、对比页控件行 44px。与条文 44px 的 4px 差为既定口径，不逐页返工；新控件按 ≥40px 落，关键转化按钮按 44px 落。 |
| 2 | 正文内链的命中区放大不得撑破相邻元素布局 | 已达标 | QA-004 的 `main p a:not([class])` 以 padding + 负 margin 等量补偿放大命中区；2026-11-15 晨该规则曾误伤无类链接致 `#dataset` 两按钮重叠，已由 `.dl-btn` 类名隔离修复——新增长链接样式必须带类或置于该规则作用域外。 |
| 3 | 动画只用 transform / opacity（合成器友好属性） | 已知例外（3 处，登记保留） | ① `.faq-panel` 用 `grid-template-rows` 过渡——FAQ 展开的内容高度不可预知，transform 无法表达，属功能性展开；② 榜单 `.rank-row .bar i` 用 `width` 过渡——条宽本身即数据，morph 的对象就是它；③ `.ck-list` 用 `visibility` 延迟配合 opacity——可见性时序是无障碍焦点顺序的一部分。三处之外全站过渡均为 transform/opacity。 |
| 4 | 尊重 prefers-reduced-motion | 已达标 | `Base.astro` 全局 RM 块：动画/过渡时长压至 `.01ms`、`[data-reveal]` 与 hero 入场直接终态、榜单条宽直接终值；JS 侧 `matchMedia('(prefers-reduced-motion: reduce)')` 同步门控（Base 脚本、CheckerZh、MapView 各自核对）。该 `.01ms` 为有意惯例值，不纳入 KB-16 的 token 化范围。 |
| 5 | 动效时长/曲线只有一个出处 | 已达标（KB-16 后） | 2026-11-15 前时长散写在规则里（`.16s` 等 13 种字面量）；KB-16 已全量收进 `--dur-*` token（阶梯登记见 DESIGN-COMPONENTS 附录），曲线早已统一为 `--ease`/`--spring`。新代码禁止再写字面时长。 |
| 6 | 表格数字用 tabular 数字字形 | 已达标（KB-14 后） | `.tnum` 工具类、榜单 `.num`（tabular + `tnum/ss01/zero` 特性）、`.tl-date`、`.fcount` 均已 tabular；居留 `.res-table td` 于 KB-14 补齐 `font-variant-numeric: tabular-nums`，数据面全覆盖。 |
| 7 | URL 即状态（可分享、可回退） | 已达标 | 查询器结果即配对页 URL（选择完成即导航）；对比页与地图页用 `history.replaceState` 把所选护照/目的地同步进 URL；枢纽筛选为页内状态（一次性浏览过滤，不入 URL 为有意取舍，登记于此）。 |
| 8 | 语义元素优先于 ARIA 补救 | 已达标 | FAQ 问题行与筛选 chips 均为原生 `<button>`（chips 带 `aria-pressed` 表达开关态）；表格表头用 `scope` 属性；装饰性状态点 `.sdot` 一律 `aria-hidden="true"`，状态语义由相邻文字承载，不靠读屏软件念颜色。 |
| 9 | 焦点可见 | 已达标 | 全局 `:focus-visible` 2px 品牌色描边 + 2px 偏移（Base.astro），无 `outline: none` 裸奔控件（施工时新增控件须复核）。 |
| 10 | 颜色按角色取用，不散写 hex | 已达标（KB-01/05/06 后） | 状态色有 bg/text/border/solid 四个角色步（KB-01）；中性色有 text/surface/border 角色别名层（KB-06）；RankingView 硬编码 hex 已于 KB-05 归零。Residency 三 View 的徽章色组与 DestinationHubView/MapView 各一处硬编码为 KB-05 登记的范围外存货，未清前新增页面不得再添新硬编码。 |

---

*维护：每批验收引用本表逐条过；判定变化（新例外、待补关闭）同步改本表并注明日期。*
