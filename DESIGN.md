---
name: 蒲城县交通运输运行监测总览
description: 面向交通指挥中心的高密度告警值守舱视觉系统
colors:
  command-black: "#030a15"
  deep-navy: "#061327"
  panel-navy: "#071429"
  raised-navy: "#0a213c"
  structural-blue: "#164e73"
  signal-cyan: "#25b8ff"
  bright-cyan: "#45d5ff"
  key-yellow: "#ffd332"
  cool-white: "#dff4ff"
  support-blue-gray: "#7fa9ca"
  normal-green: "#35d78a"
  alert-red: "#ff5e64"
typography:
  title:
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "clamp(28px, 1.65vw, 54px)"
    fontWeight: 650
    lineHeight: 1
    letterSpacing: "0.13em"
  section-title:
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    fontWeight: 650
    lineHeight: 1.2
    letterSpacing: "0.05em"
  body:
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.4
  label:
    fontFamily: "PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.3
  numeric:
    fontFamily: "DIN Alternate, Arial Narrow, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1
spacing:
  xs: "6px"
  sm: "10px"
  md: "16px"
  lg: "24px"
components:
  command-panel:
    backgroundColor: "{colors.panel-navy}"
    textColor: "{colors.cool-white}"
    padding: "0"
  metric-slab:
    backgroundColor: "{colors.raised-navy}"
    textColor: "{colors.cool-white}"
    padding: "12px 14px"
  filter-active:
    backgroundColor: "{colors.raised-navy}"
    textColor: "{colors.cool-white}"
    height: "34px"
---

# Design System: 蒲城县交通运输运行监测总览

## Overview

**Creative North Star: "告警值守舱"**

界面像一座持续运行的交通指挥舱：中央车辆地图提供全县态势，右侧报警和视频承担异常发现，左侧行业数据用于判断规模与趋势。整体高密度、低装饰噪声，以实体深蓝面板、清晰结构线和强数字层级支持远距离值守。

视觉参考只约束装饰边框与配色，不约束业务布局或图表形态。系统不使用伪政府标识、三维数据底座、玻璃卡片或大面积发光效果。

**Key Characteristics:**

- 深海军蓝实体底色与青蓝结构线。
- 中央地图约占 44% 宽度，异常区位于右侧。
- 黄色只强调关键规模，红橙只表达异常与待处置状态。
- 3840×1080 高密度首屏，较小桌面保持三舱构图并将整张画布等比缩放居中。

## Colors

颜色以深海军蓝建立稳定底座，青蓝负责结构与交互，黄白负责读数，红绿只表达明确状态。

### Primary

- **信号青蓝** (`#25b8ff`)：主结构线、活动筛选、图表柱体和主要交互反馈。
- **明亮青色** (`#45d5ff`)：地图边界、面板图标和局部高亮。

### Secondary

- **关键黄色** (`#ffd332`)：总量、里程、刷卡量等需要第一眼读取的关键数字。
- **报警红色** (`#ff5e64`)：原始报警、故障和高风险状态，不用于一般装饰。
- **正常绿色** (`#35d78a`)：在线、系统正常和值守状态，同时必须配有文字。

### Neutral

- **指挥黑** (`#030a15`)：页面最外层背景。
- **深海军蓝** (`#061327`)：地图舱和主画布。
- **面板海军蓝** (`#071429`)：标准业务面板。
- **抬升海军蓝** (`#0a213c`)：指标块、表格交替行和选中态。
- **冷白** (`#dff4ff`)：标题与主要正文。
- **辅助蓝灰** (`#7fa9ca`)：单位、说明、时间和次要标签。

### Named Rules

**The 状态稀缺 Rule.** 黄色、红色和绿色只在对应语义成立时出现；关键状态必须同时显示文字或数值，不允许只靠颜色判断。

地图底图使用深海军蓝到结构蓝的同色系色阶：陆地和建筑保持深色，道路使用结构蓝，高速略亮，标签使用辅助蓝灰。地图主题通过百度 `setMapStyleV2` 配置，不以高不透明遮罩替代。

## Typography

**Display Font:** PingFang SC（Microsoft YaHei 后备）  
**Body Font:** PingFang SC（Microsoft YaHei 后备）  
**Numeric Font:** DIN Alternate（Arial Narrow 后备）

**Character:** 中文信息使用清晰中性的界面字形；数据采用较窄的数字字形提升单位宽度内的可读密度。标题依靠字重、字距和结构线建立层级，不使用渐变字或发光字。

### Hierarchy

- **Title**（650，`clamp(28px, 1.65vw, 54px)`，1）：仅用于页面主标题，字距 `0.13em`。
- **Section title**（650，20px，1.2）：用于面板标题，与青蓝图标及短结构线成组出现。
- **Key numeric**（700，34px，1）：用于主要里程、总量与在线数；在更高密度区域可降至 20–28px。
- **Body**（400，14px，1.4）：用于表格和监控树；3840 基准下局部可升至 15px。
- **Label**（400，11–14px）：用于单位、状态、时间和辅助说明，颜色使用辅助蓝灰。

### Named Rules

**The 数字先行 Rule.** 指标块先呈现可比较的数字，再显示单位和说明；数字不使用文本渐变或装饰性描边。

## Layout

3840×1080 是设计基准。页面使用 23% / 44% / 33% 的三舱网格：左舱纵向堆叠行业板块，中舱由车辆地图贯穿，右舱承载报警、12328、视频和城市交通。面板间距为 10px，面板标题高 42px，地图标题高 48px。

页面最外层使用 8px 安全边距。所有桌面宽度保持同一三舱拓扑；小于 3840×1080 时按视口宽高计算统一缩放比例，整张设计画布居中显示，不切换双栏、不纵向滚动。缩放只改变画布显示比例，不改变面板内部排版。

## Elevation & Depth

系统以色阶、边框和结构线表达层级，不使用悬浮卡片阴影。外框使用内嵌结构线形成指挥舱边界；地图覆盖层和信息浮层使用高不透明度深蓝背景，避免玻璃化。

### Named Rules

**The Flat Command Rule.** 面板在静止状态保持平面，层级来自实体色阶、1px 边框和区域尺度，不通过大阴影或模糊发光制造层级。

## Shapes

主面板为直角矩形，通过 `clip-path` 在右上与左下形成 10px 技术切角。最外框使用 18px 切角。常规容器不使用圆角；仅车辆点、状态点和加载指示器等真实圆形语义使用圆形。

## Components

### Buttons

- **Shape:** 直角，34px 高；地图重试按钮沿用 antd 深色主题。
- **Filter:** 未选中为深蓝底和辅助蓝灰文字；选中后使用抬升海军蓝、青蓝边框和冷白文字。
- **Focus:** 键盘焦点使用 2px 关键黄色轮廓，不能只改变颜色。

### Chips

- **Style:** 车辆筛选以带颜色点的矩形筛选项呈现，每项同时包含类别文字。
- **State:** `aria-pressed` 明确选中状态；未选中的颜色点降低饱和度和不透明度。

### Cards / Containers

- **Corner Style:** 标准面板 10px 切角，外框 18px 切角，无圆角卡片。
- **Background:** 标准面板使用面板海军蓝，指标块使用抬升海军蓝。
- **Shadow Strategy:** 无悬浮阴影；仅外框内嵌结构线。
- **Border:** 1px 结构蓝，局部活动边界使用信号青蓝。
- **Internal Padding:** 主体以 10px 或 16px 为主，密集表格使用 6–10px。

### Data Tables

- 表头使用较亮的深蓝底和青蓝文字，表体使用透明或交替深蓝行。
- 行分隔线必须可辨但低于文字对比度；项目名称允许省略并通过 Tooltip 查看完整文本。

### Command Panel

- 标题条使用深蓝横向色阶，左侧为语义图标、标题与短青蓝结构线，右侧只放必要状态或范围说明。
- 内容优先使用网格和实体分区，不在面板内部继续套用浮动卡片。
- 地图聚合和非聚合点统一由百度 JSAPI GL 官方 `Cluster.View` 管理；按屏幕像素距离混合显示聚合点与单车，点击聚合点由官方视口算法逐级展开，14 级后不再聚合。
- 聚合点使用 DOM 注入项目内透明聚合环，非聚合点使用官方 WebGL `PointIconLayer`。公交、出租、网约、危货、班线和旅游包车直接使用株洲大屏同一套 55×76 透明定位图标，不额外叠加颜色状态点，也不在业务层维护 Canvas 或 Marker DOM。
- 车辆信息浮层使用实体面板海军蓝、1px 信号青边框和 12px 技术切角；车牌使用关键黄色，运行状态同时使用文字与语义色，不使用百度地图默认白色信息窗。
- 视频窗口没有真实流时只展示“暂无视频信号”、离线或故障状态，不绘制模拟道路画面。

## Do's and Don'ts

### Do:

- **Do** 保持中央地图为第一视觉中心，并让报警与视频比一般统计更快被发现。
- **Do** 使用 1px 青蓝边框、10px 切角和 10px 面板间距维持统一结构。
- **Do** 为在线、离线、故障、选中等状态同时提供文字和颜色。
- **Do** 把模拟或真实数据放在独立数据适配层，避免组件中散落业务数字。

### Don't:

- **Don't** 使用玻璃拟态、胶囊按钮、圆角浮卡、霓虹外发光或三维数据底座。
- **Don't** 用红色、黄色或绿色作为无语义装饰，也不要把原始报警、确认事件和超限类型相加。
- **Don't** 伪造政府 Logo、真实视频或真实运营数据。
- **Don't** 在桌面宽度变化时重排成双栏或纵向长页；保持三舱设计画布并统一等比缩放。
