# CineVault - 个人影视库

基于 TMDB API 的影视数据管理与个人影视库桌面客户端。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **样式方案**: Tailwind CSS 3 + CSS 变量主题
- **状态管理**: Zustand + persist 中间件
- **图表库**: Recharts
- **图标库**: Lucide React
- **本地存储**: IndexedDB (浏览器原生)
- **路由**: React Router v6

## 已实现功能

### 核心功能 (V1.0 MVP)

| 功能模块 | 实现状态 | 说明 |
|---------|---------|------|
| 三栏式全局布局 | ✅ | 侧边栏50px + 导航区240px + 内容区 + 右侧面板360px |
| 深色/浅色双主题 | ✅ | CSS 变量 + class 切换，支持系统偏好 |
| 发现首页 | ✅ | 横幅轮播(5秒自动切换) + 流行趋势/正在热映/即将上映/高分推荐/本周趋势 |
| 全局搜索 | ✅ | 即时搜索 + 类型筛选(全部/电影/剧集/人物) + 搜索历史 + 分页加载 |
| 影视详情页 | ✅ | 沉浸式头部 + 概览/演职人员/媒体/相关推荐 标签页 + 标记操作 |
| 人物详情页 | ✅ | 肖像背景 + 信息区 + 作品年表 + 部门/类型/排序筛选器 |
| 清单系统 | ✅ | 收藏/想看的/已看 三大默认清单 + 自定义清单创建删除 + 条目管理 |
| 数据看板 | ✅ | 总览统计卡片 + 近半年观影柱状图 + 类型分布饼图 + JSON导出 |
| 设置页 | ✅ | API Key 配置向导 + 主题切换 + 语言/区域设置 |
| 命令面板 | ✅ | Ctrl+K 唤起，支持搜索/导航/主题切换等命令 |
| 右侧面板 | ✅ | 快速预览 + 想看/已看/收藏标记 + 加入清单 + 查看完整档案 |

### 本地数据层 (IndexedDB)

- `movies` / `tv_shows` / `persons` - TMDB 数据缓存
- `lists` / `list_items` - 清单系统
- `user_markings` - 用户标记（想看/已看/收藏/评分/短评/观看日期）
- `search_history` - 搜索历史（保留最近10条）

### TMDB API 服务

- 搜索: `search/multi`, `search/movie`, `search/tv`, `search/person`
- 详情: `movie/{id}`, `tv/{id}`, `person/{id}` (均含 append_to_response)
- 发现: `movie/popular`, `movie/now_playing`, `movie/upcoming`, `movie/top_rated`, `trending/all/{time_window}`
- 图片: `image.tmdb.org/t/p/{size}/{path}`

## 项目结构

```
cinevault/
├── index.html              # HTML 入口
├── package.json            # 依赖配置
├── vite.config.ts          # Vite 配置
├── tailwind.config.js      # Tailwind 配置
├── postcss.config.js       # PostCSS 配置
├── tsconfig.json           # TypeScript 配置
├── src/
│   ├── main.tsx            # React 入口
│   ├── App.tsx             # 根组件 + 路由
│   ├── index.css           # 全局样式 + CSS 变量主题
│   ├── types/index.ts      # TypeScript 类型定义
│   ├── services/
│   │   ├── tmdb.ts         # TMDB API 封装
│   │   └── db.ts           # IndexedDB 本地数据库
│   ├── stores/
│   │   └── appStore.ts     # Zustand 全局状态
│   ├── components/
│   │   ├── Sidebar.tsx     # 50px 侧边栏
│   │   ├── NavPanel.tsx    # 240px 导航区
│   │   ├── RightPanel.tsx  # 360px 右侧面板
│   │   ├── MediaCard.tsx   # 影视卡片
│   │   ├── MediaSection.tsx # 水平滚动区块
│   │   ├── ImageCarousel.tsx # 横幅轮播
│   │   └── CommandPalette.tsx # Ctrl+K 命令面板
│   └── pages/
│       ├── DiscoverPage.tsx   # 发现首页
│       ├── SearchPage.tsx     # 搜索结果页
│       ├── MovieDetailPage.tsx # 影视详情页
│       ├── PersonDetailPage.tsx # 人物详情页
│       ├── ListsPage.tsx      # 清单页面
│       ├── DashboardPage.tsx  # 数据看板
│       └── SettingsPage.tsx   # 设置页面
└── dist/                   # 生产构建产物
```

## 快速开始

### 开发模式

```bash
npm install
npm run dev
```

### 生产构建

```bash
npm run build
```

构建产物位于 `dist/` 目录，可直接部署到任何静态托管服务。

## 使用说明

1. **首次启动**: 输入 TMDB API Key 即可开始使用（前往 [TMDB 设置](https://www.themoviedb.org/settings/api) 获取）
2. **快捷键**:
   - `Ctrl+K` - 打开命令面板
   - `Ctrl+F` / 点击搜索框 - 激活搜索
3. **标记影视**: 在卡片悬停层或详情页点击"想看"/"已看"/"收藏"按钮
4. **管理清单**: 在导航区"我的清单"下查看和管理清单，支持自定义清单创建
5. **数据导出**: 在数据看板页面点击"导出数据"按钮下载 JSON

## 注意事项

- 由于当前环境限制，项目采用纯 Web 方案（浏览器 + IndexedDB），原 PRD 中的 Tauri 桌面端特性（系统浮窗、全局热键唤起、SQLite）已调整为浏览器原生实现
- 如需打包为桌面应用，可在现有代码基础上接入 Tauri/Electron，后端逻辑（IndexedDB → SQLite）已预留接口
- 图片加载依赖 TMDB CDN，请确保网络可访问 `image.tmdb.org`
