# Gatsby ELT：GitHub Pages 实施方案

版本：2026-11-27。执行仓库：`https://github.com/cw-wan/cw-wan.github.io`。

## 任务与最终结果

在现有仓库中增加一个独立的英文 Gatsby Event Logic Tree 页面：

- 仓库内位置：`projects/elt/index.html`。
- 目标网址：`https://cw-wan.github.io/projects/elt/`。
- 路径是 **projects（复数）**，不是 `project`。
- 移植此前 ChatGPT 中的可视化，保留人物头像、电影剧照、树形布局、节点展开、原语详情和面包屑导航，全部用户可见文字改为英文。
- 首页当前只是占位页，之后会重做。ELT 是长期保留的独立页面，不采用占位首页的视觉风格，不依赖其 CSS 或 JavaScript。
- 本轮目标是原有可视化的英文迁移，不重新设计 ELT，不把它做成另一种图或通用编辑器。

请在实际执行任务时连续完成实现、浏览器验证和既有 GitHub Pages 流程允许的部署。常规实现选择自行决定。若缺少权限或必要素材，先完成不受影响的工作，明确指出唯一剩余阻塞，不以“已完成”代替未通过的验收。

## 已检查的仓库情况

2026-11-27 的只读检查结果：

- 默认分支为 `main`，仓库启用了 Pages。
- `main` 文件树仅有根目录 `index.html`，未发现框架、构建配置、工作流或 `AGENTS.md`。
- 在线首页返回 200，取得的 HTML 与 `main/index.html` 内容相同。
- 首页是 “Site Under Construction / NEON GENESIS” 占位页。
- 文件树 SHA 为 `480059d950631ab89f0cba521a0d4edbb6ce6427`。这是树对象标识，不是这里声称核验过的提交 SHA。
- 未通过匿名 Pages API 确认后台发布源设置。上述结果支持“main 根目录静态站点”的判断，但执行前仍应检查实际 Pages 设置。

这些是检查时的事实，不是要求仓库永远保持这个状态。执行前重新读取实际工作树、分支和项目指令，保护用户已有修改。

## 交付包与原版基准

本包包含：

| 文件 | 用途 |
| --- | --- |
| `CODEX_IMPLEMENTATION_PLAN.md` | 本执行方案 |
| `data/Gatsby_ELT.original.json` | 恢复的原始 ELT，保持原样作结构基准 |
| `data/Gatsby_ELT.en.json` | 已翻译的英文 ELT；保留原 ID、通道、运算符、证据和子节点顺序 |
| `reference/translations.en.json` | 73 个节点的英文短标题、37 个完整原语、角色名及 UI 文案 |
| `reference/rendering-contract.md` | 之前实际渲染代码的布局与交互记录 |
| `reference/image-sources.json` | 之前使用的图片来源与人物裁切参数 |

**当前唯一缺失的迁移基准：**原始 `gatsby-event-tree.html`、其中嵌入的图片字节，以及当时 ChatGPT 宿主提供的完整样式快照，未能从临时环境恢复。环境维护清理了临时文件；保存的 ELT JSON 已恢复。包内的渲染记录不是原 HTML，也不是浏览器截图。

优先取得用户保存的原完整 HTML 或其可访问导出；若只有 HTML fragment，还必须取得对应基础 CSS、字体/主题变量及工具提示实现。原 ChatGPT 消息中的文件路径、内部引用或模型记忆不能充当可下载的发布资源。

若只能取得当前渲染截图：以截图校准视觉，以 `rendering-contract.md` 校准交互，明确这是基于记录重建。若 HTML 和截图都无法取得，先完成静态目录、英文数据、页面实现和功能验证，再向用户一次性请求原 HTML 或截图；把“与原版视觉一致”列为待验收，不以新页面自己的截图证明它与旧版相同。

## 一、检查与目录接入

1. 在 `cw-wan/cw-wan.github.io` 的工作副本中执行，读取适用的项目指令，检查 `git status`，不要覆盖未提交修改。
2. 确认默认分支、当前发布来源及是否存在 `projects/elt/`。若已有实现，先检查再增量修改。
3. 现有纯静态结构优先采用 HTML/CSS/JavaScript。无需引入 React、Next.js、Vite、数据库、服务端或构建流水线。
4. 让 `projects/elt/` 自包含。建议发布文件如下；可以按原导出适度合并 CSS/JS，不强制无意义拆分：

| 路径 | 内容 |
| --- | --- |
| `projects/elt/index.html` | 英文页面入口，完整 HTML 文档 |
| `projects/elt/styles.css` | 原可视化样式和必需的宿主基础样式 |
| `projects/elt/renderer.js` | 原树的显示、布局与交互 |
| `projects/elt/data/gatsby-elt.en.json` | 英文事件数据 |
| `projects/elt/data/labels.en.json` | 英文短标签与 UI 文案；可内联 |
| `projects/elt/assets/portraits/` | 本地人物图片 |
| `projects/elt/assets/scenes/` | 本地电影剧照 |
| `projects/elt/README.md` | 页面维护、资源来源、验证与发布说明 |

数据可用相对路径 fetch，也可内联为 `application/json`；按原渲染代码选择最少改动的方案。使用本地 HTTP 服务开发，不把 file:// 模式当作部署验证。

5. 所有页面内部资源用 `./styles.css`、`./renderer.js`、`./assets/...`、`./data/...` 等相对地址。不要使用 `sandbox:`、`/workspace/`、ChatGPT 私有地址、临时签名链接或本机绝对路径。
6. 不重写当前首页。此次不额外创建 `/projects/` 汇总页或新导航系统。将来首页直接链接 `/projects/elt/` 即可。
7. 页面不加载占位首页的全局 CSS/JS。使用独立文档和局部作用域，避免后来首页改版改变 ELT 的按钮、字体、边距和图片布局。

## 二、迁移原渲染环境，而不只是复制 JSON

原图使用宿主提供的 CSS 变量和工具类。单独复制树数据，甚至只复制 fragment，都不足以保持原效果。

1. 原完整导出可用时，先在独立页面复现中文原版，确认图片、基础样式、tooltip、导航都工作，再替换为英文文本。
2. 将必要的变量、字体、reset、按钮、文字尺寸、隐藏辅助文字和 tooltip 样式本地化。包括原代码使用的 `--background`、`--foreground`、`--muted`、`--muted-foreground`、`--font-size-base`、`--viz-series-1/2/3`，以及 `.btn`、`.btn-ghost`、`.text-small`、`.text-muted`、`.sr-only`、`.cursor-interaction`。
3. 去掉对 ChatGPT 宿主脚本和宿主 API 的依赖。`data-tooltip` 属性本身不会自动产生 tooltip；要保留本地实现与键盘支持。
4. 图的默认有效宽度保持约 736 CSS px，在大屏居中；不要因为部署到网站就把树拉伸到全屏。小屏保持响应式。
5. 保留浅色/深色主题下的可读性。按可恢复的原主题值移植，独立页面用系统主题作为默认来源；不得用首页的霓虹黑色风格重新设计本图。
6. 不嵌入 ChatGPT 网页或不可公开访问的 iframe。若原完整导出本身包含自足的本地 iframe，可先保留以减少视觉偏差，但必须处理自适应高度、资源加载和键盘可访问性，不能依赖外部 ChatGPT 父页面。
7. 保留圆形头像、节点内场景图片、简洁树线、运算符标签与底部可折叠来源。不要添加大幅海报首页、电影播放器、时间轴、随机位置关系网或与原图无关的控件。

## 三、英文与 ELT 结构约束

使用包内英文数据和翻译表，避免重新生成树。

必须保持：

- 73 个唯一节点 = 37 个 primitive + 36 个 composite。
- 36 个 composite 均为二叉节点；运算符计数为 SEQ 28、GUARD 5、SYNC 3。
- 8 个 channel：N、G、D、T、J、M、W、H。
- 所有 ID、kind、operator、channel、evidence_source、父子关系和子节点先后顺序不变。
- `Root` 的二叉结构及全部 `_tail` 节点不变。短标题是展示层，不是新事件节点。
- 来源 URL 保留。原始中文 JSON 不作为英文页面的可见文案来源。

英文覆盖：页面标题、节点短标题、完整 predicate、人物姓名、按钮、边标签、图例、统计文案、面包屑、tooltip、图像 alt、ARIA 标签、动态状态播报、底部来源与说明。`<html lang="en">`，并设置英文 title、description、viewport 和目标 canonical URL。

语义要点：

- `J_backstory` 是 1922 年乔丹的讲述，1917 年是其讲述内容，不另插一个 1917 年的节点。
- `W_misidentifies` 是威尔逊形成错误判断，不是宣告盖茨比确为默特尔的情人。
- `T_identifies_owner` 与 `T_admits_telling` 是不同时间的两次言语行为。
- `FatalReturn` 保留 GUARD 的内事件/外区间方向：child 0 是碰撞死亡，child 1 是覆盖碰撞的黛西驾车区间。
- SYNC 节点保留同一事件的参与方投影，不解释成互相独立的证据。
- 原著情节决定节点，电影只提供配图；H 继续使用 “Henry Gatz” 与 H 占位头像。
- 不展示编造的日期、置信度或实际时间区间，也不宣称本故事的真实 Temporal Compactness 已验证。

长英文允许自然换行并重新计算节点高度。不要靠缩小到难读字号、裁掉完整谓词或改变拓扑解决排版问题。

## 四、图片迁移

1. 原导出若有 data URL，优先原样使用或无损提取到 assets，保持选图与裁切。数据文件化不是更换图片的理由。
2. 若原图片不可恢复，按 `image-sources.json` 定向恢复之前使用的那几张，检查实际下载内容和人物/场景，再与视觉基准比较。这些是历史来源地址，不保证当前仍返回同样字节。
3. 页面加载已保存的本地图片，避免运行时从第三方热链；保留出处链接。不要用 AI 生成头像替换演员。
4. 保留头像裁切：默认 `background-size: 230% auto`、`background-position: center top`；M 使用 `center 6%`，W 使用 `280% auto` 和 `26% center`。若恢复的素材尺寸变化，依据原图调整而非机械套用。
5. 不把无关场景剧照标成某个事件的证据。底部简短说明电影插图与小说事件树的关系即可。

## 五、原交互契约

详细尺寸见 `reference/rendering-contract.md`。以下是功能验收项：

- 初始 Root 总览保留二叉逻辑和五个主要情节端点：Entry、Reunion、Confrontation、Tragedy、Aftermath。
- 桌面初始展开集合为 Root、Connection、Collapse、Consequences，显示 9 个节点、8 条边。数据层始终保留全部 73 个节点。
- 点击 “Expand · n” 聚焦相应子树；n 为该节点下的原语数。
- 点击 “View primitive” 展示对应人物、完整英文谓词、节点 ID 和来源链接。
- 面包屑能返回父级和总览，深层截短时仍保留必要导航。
- SEQ 的 First / Then、SYNC 的 Aligned、GUARD 的 Inner / Outer 标签方向正确。
- 620 px 树宽阈值控制展开深度；560 px 阈值让角色栏从 8 列变 4 列。
- 子节点 y 坐标使用各自父节点的实测底部 + 44 px，避免全局行高造成巨大空白。使用 ResizeObserver 与字体就绪事件更新布局。
- 文字换行、头像和图片载入后没有连线穿字、节点重叠或横向溢出。
- 原有轻量移动动画尊重 reduced-motion；全部操作可键盘访问，动态状态用 aria-live。

## 六、真实浏览器验证

使用仓库已有检查工具；无现成工具时可以使用 Playwright 等浏览器自动化验证实际静态页面。不要只检查 JavaScript 语法或模拟 DOM。

1. 对比中英文数据中的 ID 集合、kind、operator、channel、证据字段以及每个节点有序的 children ID；检查唯一性、无环、单父节点和所有计数。
2. 遍历实际 UI 的展开与原语入口，确认所有 37 个原语可达，面包屑每一步可返回。检查 console error、未捕获异常、图片和数据请求失败。
3. 至少覆盖这些具有不同逻辑的状态：Root、Reunion、Plaza、FatalReturn、Shooting、Funeral、一个长谓词原语（如 J_backstory）。
4. 在实际内容宽度 736 px、窄屏 320/390 px 和宽屏浏览器下检查布局；对照浅色与深色。等待字体和图片就绪后截图。
5. 原版 HTML 可用时，用相同浏览器、有效画布宽度、主题和字体环境对比原版与迁移版。截图差异需区分合理的英文换行和不合理的样式漂移；不要求翻译前后的文字像素一致。
6. 仅有原截图时，比较照片、裁切、节点位置关系、颜色、字号、间距、按钮和总体密度，并按交互契约验证行为。
7. 原基准缺失时，明确写“功能已验证，原版视觉一致性待核对”。此前的模拟 DOM 检查不能替代本轮浏览器测试。
8. 从站点根目录启动服务并直接访问 `/projects/elt/`，验证刷新、尾部斜杠、相对资源和直接深链。不要只从 elt 目录根访问而漏掉部署路径错误。

验收只增加与此次迁移有关的检查，不建设与任务无关的测试平台。

## 七、发布与未来首页改版

- 首先沿用已有 Pages 发布流程。若确认为 `main` 根目录发布，新文件合入相应分支后应随已有流程发布。
- 不为这个子目录另外建立仓库或第二个 Pages 发布站点。
- 不盲目新增 `.nojekyll`、改全站 Pages source 或覆盖部署工作流。若执行时网站已换框架，只做确保构建产物包含 `projects/elt/index.html` 及其资源所需的最小接入。
- 后续若首页迁入 Vite/Astro/Next 静态导出等体系，应把本目录放入该框架会原样复制的静态资源位置，或在构建中复制它。**最终部署产物路径继续是 `/projects/elt/`**，不因源码目录迁移改变公共 URL。
- 有权限且任务明确执行部署时，按仓库的分支保护和现有发布方式提交、推送，等待实际 Pages 部署状态并检查线上页面。不要绕过保护或 force-push。
- 若只能创建 PR/提交，交付具体 PR 或提交与唯一剩余的合并/发布步骤，清楚说明尚未上线。
- 线上检查首页仍可访问，`/projects/elt/` 返回页面，CSS/JS/数据/图片可加载，展开和返回操作正常。目标 URL 尚未部署前不得称其为已上线。

## 八、执行结束时的交付

1. 实际修改文件和可维护的英文 ELT 页面。
2. 简明 README：本地运行方式、目录用途、数据和图片来源、以后首页改版时的保留方式。
3. 结构、英文覆盖、真实浏览器交互和响应式检查结果。
4. 视觉对照的证据和未解决的差异；不能把基准缺失写成已匹配。
5. 已验证的在线地址，或明确的 PR/提交和待发布步骤。

## 官方部署参考

- GitHub Pages 发布源： https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- 创建与发布静态页面： https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site

## 可直接给 Codex 的启动指令

> 请读取本包 CODEX_IMPLEMENTATION_PLAN.md 及 reference/、data/ 下的文件，在 cw-wan/cw-wan.github.io 仓库实现英文 Gatsby ELT 页面，目标路径 /projects/elt/。首页只是占位，ELT 子目录必须独立且能在未来首页重做时保留。原数据结构和原图交互必须保持。优先迁移原渲染及其基础样式，不凭 JSON 自行重新设计；若原 HTML 或视觉截图缺失，先完成不受影响的工作，并把视觉一致性标成待验收。完成真实浏览器验证，并按仓库已有 Pages 流程完成获授权的发布或交付可合并变更。
