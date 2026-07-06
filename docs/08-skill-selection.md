# 前端技能选择

## 结论

本项目后续前端设计与实现的主技能选择：

1. `ui-design-system`
   - 作为主技能。
   - 原因：AIxxts 是内部情报工作台，包含仪表盘、列表、表格、表单、状态徽标和响应式布局，更接近产品 UI / design system 工作，而不是营销页。

2. `accessibility`
   - 作为强制检查技能。
   - 原因：项目需要团队内部长期使用，导航、表单、表格、焦点、键盘访问和对比度必须稳定。

3. `shadcn-component-review`
   - 作为审查参考，不作为当前实现主约束。
   - 原因：当前项目尚未安装 shadcn/ui，也没有 `components.json`。可以借用它对 spacing、tokens、响应式和 a11y 的审查方法，但不强行要求 `data-slot`、CVA 或 shadcn 组件结构。

4. `design-taste-frontend`
   - 降级为视觉反模式清单。
   - 原因：该技能明确说明不适合 dashboard、data table 和多步骤产品 UI。本项目只使用其中适用的约束：不做 AI 紫色渐变、不做营销 hero、不做装饰性大图、不做模板化三卡片、保持颜色和形状一致。

## 外部技能搜索结果

已执行：

```powershell
npx skills find "dashboard design system accessibility"
```

发现外部候选：

- `bergside/awesome-design-skills@dashboard`
- `akillness/oh-my-skills@frontend-design-system`
- `akillness/oh-my-skills@design-system`
- `community-access/accessibility-agents@design-system`

暂不安装。原因是当前本地已有 `ui-design-system` 和 `accessibility`，覆盖本阶段所需能力，临时引入未知技能会增加不确定性。

## 当前项目设计参数

- 产品类型：内部 AI 行业情报工作台。
- 主要使用者：只读成员和管理员。
- 优先端：桌面优先，移动端保持可读。
- 密度：中高密度。
- 动效：低动效，仅状态和交互反馈。
- 视觉：浅色工作台，单一墨绿色 accent，8px 半径以内。

## 后续执行规则

- 页面和组件新增前，先用 `ui-design-system` 判断是否需要抽取共享组件。
- 每次新增可交互元素，按 `accessibility` 检查可访问名称、焦点、键盘操作和对比度。
- 页面完成后，用 Playwright 至少检查 390px 和 1440px 两个视口。
- 不安装新 UI 库，除非出现原生控件无法满足的复杂交互，例如 Dialog、Popover、Select、多选表格。
- 若未来需要复杂表单、弹窗和选择器，再讨论是否正式引入 Radix 或 shadcn/ui。
