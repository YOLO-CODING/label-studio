# Web Bundle 优化计划

> 基线 (2026-06-06 ANALYZE=true 构建):
> - `dist/apps/labelstudio` 总产物 **108 MB**（含 source-map）
> - 运行时 JS **7.03 MB** / CSS **1.88 MB**
> - `main.js` **3.6 MB**，`609.js` **1.4 MB**，`171.js` **974 KB**，`vendor.js` 278 KB
>
> 目标:
> - 首屏 JS 7 MB → **≤ 3 MB**
> - dist 总体积 108 MB → **≤ 20 MB**
> - CSS 重复降到 0

---

## 优先级总览

| # | 任务 | 优先级 | 工作量 | 预计收益 |
|---|------|--------|--------|----------|
| 1 | 修复 splitChunks（CSS 重复 + vendor 范围） | P0 | 0.5d | -2 MB CSS, main -800 KB |
| 2 | 生产环境关闭内联 source-map | P0 | 0.1d | dist -90 MB |
| 3 | icons barrel 改 per-icon 导出 | P0 | 1d | main -500 KB |
| 4 | editor / datamanager / codemirror 懒加载 | P0 | 2d | 首屏 -1.5 MB |
| 5 | 依赖去重 (yarn dedupe + resolutions) | P1 | 0.2d | -150 KB |
| 6 | d3 / chroma-js / strman 按需或替换 | P1 | 2d | -300 KB |
| 7 | date-fns 升级或换 dayjs | P1 | 1d | -150 KB |
| 8 | antd v4 拆包（过渡）/ 长期迁移 | P1 / P3 | 0.5d / 长期 | 主包结构清晰 |
| 9 | Terser / 缓存 / 长缓存 hash | P2 | 0.5d | 二次构建 ↑↑ |
| 10 | SVG loader 双重处理评估 | P3 | 0.5d | 小幅 |

---

## P0 任务

### 1. 修复 splitChunks（CSS 重复 + vendor 分组过窄）

**问题**
- `webpack.config.js:123-143` 的 `commonVendor` 仅匹配 react/mobx，其它 node_modules 走 `chunks: 'async'`，于是 antd、konva、audio-decoder 等被打进发起方的同步 chunk（609.js 1.4 MB 的来源）。
- editor chunk `171.js` 里同一份 css-loader 产物出现 5 份 ~560 KB（合计浪费 ~2 MB CSS）。

**改动点** (`web/webpack.config.js`)
```js
config.optimization = {
  runtimeChunk: 'single',
  sideEffects: true,
  splitChunks: {
    chunks: 'all',
    maxInitialRequests: 10,
    minSize: 30_000,
    cacheGroups: {
      reactVendor: {
        test: /[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/,
        name: 'vendor-react',
        priority: 30,
      },
      mobxVendor: {
        test: /[\\/]node_modules[\\/](mobx|mobx-react|mobx-react-lite|mobx-state-tree)[\\/]/,
        name: 'vendor-mobx',
        priority: 25,
      },
      antd: {
        test: /[\\/]node_modules[\\/](antd|rc-[^/]+|@ant-design)[\\/]/,
        name: 'vendor-antd',
        priority: 20,
      },
      defaultVendors: {
        test: /[\\/]node_modules[\\/]/,
        name: 'vendor-common',
        priority: -10,
        reuseExistingChunk: true,
      },
      styles: {
        name: 'styles',
        type: 'css/mini-extract',
        chunks: 'all',
        enforce: true,
      },
    },
  },
};
```

**验收**
- `ANALYZE=true yarn build` 后 `main.js` < 2 MB
- editor chunk 内同名 CSS 模块不再重复出现
- 首次加载 chunk 总数控制在 8 个以内

---

### 2. 生产环境关闭内联 source-map

**问题** `webpack.config.js:24` 生产用 `source-map`，dist 翻倍（108 MB vs ~15 MB 真实产物）。

**改动点**
```js
const devtool =
  process.env.NODE_ENV === 'production'
    ? (process.env.SOURCEMAP === 'inline' ? 'source-map' : 'hidden-source-map')
    : 'eval-cheap-source-map';
```
- 同时在 build 脚本里把 `.map` 文件单独上传 Sentry，再从 dist 排除（CI 步骤里 `find dist -name '*.map' -delete`）。

**验收**
- `dist/apps/labelstudio` 体积下降到 ~15 MB
- Sentry release 仍能反解堆栈

---

### 3. icons barrel → per-icon 导出

**问题** `libs/ui/src/assets/icons/index.ts` 一次性导出 262 个 svg 组件，被 main.tsx 引用后整包 769 KB 进入主入口。

**改动点**
- 将 `import { IconX } from '@humansignal/icons'` 改为 `import IconX from '@humansignal/icons/IconX'`，依靠 tsconfig path 直接定位单文件。
- 参考已有 `tools/react-icons-shim/generate.js`，写一个 codemod 扫描所有 `@humansignal/icons` 的命名导入并改写。
- `index.ts` 保留但加 `sideEffects: false`，确保 tree-shaking 生效。

**验收**
- `libs/ui/src/assets/icons/index.ts + N modules` 不再出现在 main chunk Top 模块
- main.js -≥ 400 KB

---

### 4. editor / datamanager / codemirror 路由级懒加载

**问题** 主入口同步引用 `@humansignal/editor`（2.7 MB modules）、`@humansignal/datamanager`（568 KB）、`codemirror`（392 KB），首屏未必都要。

**改动点**
- 路由入口（labelstudio app 的 route 表）改为 `const Editor = React.lazy(() => import('@humansignal/editor'))`，外层包 `<Suspense>`。
- `codemirror` 仅在标签配置编辑器界面动态 `import('codemirror')`。
- `konva` 跟随 editor 一起懒加载，确认不再被首屏直接引用。

**验收**
- Network 面板下首屏 JS 请求总和 ≤ 3 MB（gzip 前）
- 项目列表页打开不再加载 editor/codemirror chunk

---

## P1 任务

### 5. 依赖去重

**问题** `515.js` 中出现 6 份 `get-intrinsic`、2 份 `object-inspect`、多版本 `entities`。

**改动**
```bash
npx yarn-deduplicate yarn.lock
yarn install
```
`package.json` 增加 resolutions：
```json
"resolutions": {
  "get-intrinsic": "1.2.4",
  "object-inspect": "1.13.2",
  "entities": "4.5.0"
}
```

**验收** bundle-stats 中以上模块每个仅 1 份。

---

### 6. d3 / chroma-js / strman 改造

- **d3**：禁止 `import * as d3 from 'd3'`，改用子包（`d3-scale`, `d3-selection` 等）。在 webpack alias 或 ESLint 规则中拦截。
- **chroma-js (91 KB)**：评估替换为 `@ant-design/colors` 或仅保留实际用到的 ~5 个函数自实现。
- **strman (158 KB)**：调查实际调用面（多半是 1-2 个方法），替换为 lodash/原生实现，从 dependencies 移除。

**验收** 三者均不再出现在 main chunk Top 模块。

---

### 7. date-fns 升级或换 dayjs

`date-fns@2.x` 在 ESM 下 tree-shaking 弱。

- 方案 A：升 `date-fns@3+`（API 兼容性较好），515.js 中 `parse/format` 模块树会变小。
- 方案 B：替换为 `dayjs`（~7 KB），需要改写调用点。

**验收** 515.js 体积 ≤ 200 KB。

---

### 8. antd v4 处理

- **短期**：通过任务 1 的 `antd` cacheGroup 单独拆出 `vendor-antd.js`，使其独立缓存、并行加载。
- **长期 (P3)**：antd v4 已 EOL，规划逐组件迁移到 `@humansignal/ui` + Radix，目标完全移除 antd 依赖。

---

## P2 任务

### 9. Terser / 缓存 / 长缓存 hash

`web/webpack.config.js` 优化：
```js
new TerserPlugin({
  parallel: true,
  terserOptions: {
    compress: { drop_console: true, passes: 2 },
    format: { comments: false },
  },
  extractComments: false,
}),
```
生产环境也开 filesystem cache：
```js
cache: { type: 'filesystem', buildDependencies: { config: [__filename] } },
```
确认 `output.filename` 包含 `[contenthash:8]`，利于浏览器/CDN 长缓存。

可选：引入 `compression-webpack-plugin` 预生成 `.br/.gz`。

**验收**
- 二次构建时间 < 首次 50%
- 同代码二次构建 hash 不变

---

## P3 任务

### 10. SVG 双 loader 评估

`webpack.config.js:231-243` 同时启用 `@svgr/webpack` 和 `url-loader`，导致同一文件既被编译为 React 组件、又被生成 URL。

- 排查调用方实际需要哪一种，按 query 区分 (`?url` vs default)，避免双产物。

---

## 度量与回归

每次 PR 合并后跑：

```bash
ANALYZE=true yarn build
# 关注：
# - dist/apps/labelstudio 大小
# - main.js / vendor-*.js / styles.css 大小
# - bundle-report.html 中重复模块
```

建议在 CI 里增加体积阈值守护（例如 `size-limit` 或 `bundlewatch`），超出阈值自动 fail。

---

## 推进顺序建议

1. **第 1 周**：任务 1 + 2 + 5（低风险，立竿见影）
2. **第 2 周**：任务 3 + 4（首屏体积大幅下降）
3. **第 3 周**：任务 6 + 7 + 9
4. **持续**：任务 8（antd 迁移）、任务 10
