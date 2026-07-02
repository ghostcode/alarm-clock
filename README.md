# 极简闹钟（Chrome 扩展）

一个基于 Manifest V3 的轻量级 Chrome 闹钟扩展，支持多闹钟管理、重复提醒、系统通知与提示音。

## 功能特性

- 多闹钟管理：添加、编辑、删除、开关
- 重复提醒：每天、工作日、周末或自定义星期
- 一次性闹钟：响铃后自动关闭
- 系统通知：到点时弹出右下角 Chrome 通知
- 提示音：通过 Offscreen Document + Web Audio API 后台播放蜂鸣
- 12/24 小时制切换：弹窗顶部一键切换，时间选择器联动显示 AM/PM
- 暗色主题界面

## 安装方法

1. 打开 Chrome，进入 `chrome://extensions/`
2. 右上角开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择本项目所在文件夹
5. 工具栏会出现闹钟图标，点击即可使用

## 使用说明

1. 点击工具栏的闹钟图标打开弹窗
2. 点击右上角 `+` 添加闹钟
3. 选择时间、填写标签、设置重复规则后保存
4. 到点时浏览器会弹出通知并播放提示音
5. 点击通知上的「停止响铃」可关闭提示音

## 文件结构

```
alarm-clock/
├── manifest.json          # 扩展清单
├── popup.html             # 弹窗界面
├── popup.css              # 弹窗样式
├── popup.js               # 弹窗逻辑
├── utils.js               # 工具函数
├── background.js          # Service Worker 后台调度
├── offscreen.html         # 后台音频页面
├── offscreen.js           # Web Audio 提示音逻辑
├── icons/                 # 扩展图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
└── generate-assets.py     # 图标生成脚本
```

## 系统要求

- Chrome / Edge 等基于 Chromium 的浏览器
- 建议 Chrome 109 及以上版本（Offscreen API）
- 需要允许扩展发送通知

## 注意事项

- 请确保浏览器通知权限已开启，否则无法显示右下角通知
- 如果长时间没有闹钟触发，Chrome 可能会回收 Service Worker，但 `chrome.alarms` 会在到点前自动唤醒它
- 所有闹钟时间内部统一保存为 24 小时制 `HH:MM`，显示格式随设置切换

## 开发者

图标可通过 `generate-assets.py` 重新生成：

```bash
python generate-assets.py
```
