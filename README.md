# 🎬 CineVault - 个人影视库

<p align="center">
  <img src="https://img.shields.io/badge/React-18-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5-orange" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5-purple" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8" alt="Tailwind">
  <img src="https://img.shields.io/badge/PWA-Supported-4ade80" alt="PWA">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

> 🎨 基于 TMDB API 的影视数据管理与个人影视库，支持 PWA 离线访问

<p align="center">
  <strong>🌐 在线访问</strong>：<a href="https://kiritomemory.github.io/cinevault">https://kiritomemory.github.io/cinevault</a>
</p>

---

## ✨ 功能特点

| 🏠 发现 | 📋 清单 | 📊 数据 | 🎨 视觉 |
|:---:|:---:|:---:|:---:|
| 5大分类Tab导航 | 收藏/想看/已看 | 观影统计图表 | 液态玻璃效果 |
| 中文标题/地区筛选 | 自定义清单创建 | 类型分布饼图 | 彩虹折射光边 |
| 全局搜索 | 加入清单管理 | 近半年趋势 | 流动背景动画 |

---

## 📸 截图预览

### 发现页
![CineVault Discover](https://image.tmdb.org/t/p/original/8UlWHLMpgZmDfx6gMWuS80agAI4.jpg)

### 详情页
![CineVault Detail](https://image.tmdb.org/t/p/original/tUkdSF2LVRro2oosGGzNqwE6Lx8.jpg)

### 数据看板
![CineVault Dashboard](https://image.tmdb.org/t/p/original/3m7uppFMLJqMEM9oonPMoFgaqLu.jpg)

---

## 🚀 快速开始

### 在线访问（推荐）

👉 **https://kiritomemory.github.io/cinevault**

首次使用需要配置 TMDB API Key（免费，申请地址：https://www.themoviedb.org/settings/api）

### 本地运行

```bash
# 克隆项目
git clone https://github.com/kiritomemory/cinevault.git
cd cinevault

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 http://localhost:5173

### PWA 安装（桌面/手机）

1. 访问 https://kiritomemory.github.io/cinevault
2. **Chrome/Edge**：点击地址栏右侧 📥 安装图标
3. **手机**：浏览器菜单 → "安装应用" 或 "添加到主屏幕"

安装后可离线访问已缓存的内容！

---

## 🎯 功能详情

### 发现页（Discover）

- 🎬 **流行趋势** - trending/all/week
- 🔥 **正在热映** - movie/now_playing
- 📅 **即将上映** - movie/upcoming
- ⭐ **高分推荐** - movie/top_rated
- 📈 **本周趋势** - trending/all/week

### 清单系统

| 默认清单 | 说明 |
|---------|------|
| 💚 收藏 | 喜欢的影视 |
| 📋 想看 | 计划观看的 |
| ✅ 已看 | 标记已观看的 |

- 支持创建自定义清单
- 清单内添加/移除媒体
- 媒体标题格式：`名字.年份.[tmdb=id]`

### 用户评分与评论

- ⭐ 1-5 星评分
- 📝 个人短评
- 📅 观看日期记录
- 所有数据本地存储（IndexedDB）

### 数据看板

- 📊 总览统计（观影数、收藏数、时长）
- 📈 近半年观影柱状图
- 🥧 类型分布饼图
- 💾 JSON 数据导出

---

## 🛠 技术栈

| 技术 | 用途 |
|------|------|
| React 18 | UI 框架 |
| TypeScript | 类型安全 |
| Vite 5 | 构建工具 |
| Tailwind CSS 3 | 样式方案 |
| Zustand | 状态管理 |
| IndexedDB | 本地存储 |
| Recharts | 图表库 |
| Lucide React | 图标库 |
| React Router v6 | 路由 |
| PWA (Service Worker) | 离线支持 |

---

## 📁 项目结构

```
cinevault/
├── public/
│   ├── manifest.json     # PWA 配置
│   ├── sw.js            # Service Worker
│   └── icon-*.png       # APP 图标
├── src/
│   ├── components/      # UI 组件
│   ├── pages/           # 页面
│   ├── services/        # API & DB
│   ├── stores/          # 状态管理
│   └── index.css        # 全局样式
├── dist/                # 生产构建
└── package.json
```

---

## 🔧 配置 TMDB API Key

1. 访问 https://www.themoviedb.org/settings/api
2. 注册/登录账号（免费）
3. 复制 API Key
4. 在 CineVault 设置页粘贴即可

---

## 📝 License

MIT © [kiritomemory](https://github.com/kiritomemory)

---

<p align="center">
  🎬 CineVault - 让你的观影之旅井井有条
</p>
