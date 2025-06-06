# 图纸下载 API

## GET `/api/download`

获取图纸下载接口的详细文档和参数说明。

### 响应示例

```json
{
  "endpoint": "/api/download",
  "method": "POST",
  "description": "生成并下载拼豆图纸图片",
  "parameters": {
    "pixelData": {
      "type": "PixelData",
      "required": true,
      "description": "包含所有像素数据和元信息的对象（mappedData, width, height, colorSystem）"
    },
    "downloadOptions": {
      "showGrid": { "type": "boolean", "default": true, "description": "显示网格线" },
      "gridInterval": { "type": "number", "default": 10, "description": "网格间隔" },
      "showCoordinates": { "type": "boolean", "default": true, "description": "显示坐标" },
      "gridLineColor": { "type": "string", "default": "#CCCCCC", "description": "网格线颜色" },
      "outerBorderColor": { "type": "string", "default": "#141414", "description": "外边框颜色 - 围绕网格的边框颜色，可选参数" },
      "includeStats": { "type": "boolean", "default": true, "description": "包含统计信息" },
      "showTransparentLabels": { "type": "boolean", "default": false, "description": "是否在透明色（T01）上显示色号标识" },
      "filename": { "type": "string", "description": "自定义文件名" },
      "title": { "type": "string", "description": "图纸标题 - 显示在图片顶部的标题栏中" },
      "dpi": { "type": "number", "default": 150, "range": "72-600", "description": "图片分辨率 (DPI)" },
      "renderMode": { "type": "string", "default": "dpi", "options": ["dpi", "fixed"], "description": "渲染模式" },
      "fixedWidth": { "type": "number", "description": "固定宽度（像素，fixed模式）" }
    }
  },
  "response": {
    "contentType": "image/png",
    "headers": {
      "Content-Disposition": "attachment; filename=\"...\""
    }
  }
}
```

---

## POST `/api/download`

生成并下载拼豆图纸图片。

### 请求参数 (JSON)

| 参数 | 类型 | 必需 | 说明 |
|------|------|------|------|
| `pixelData` | PixelData | ✅ | 像素数据对象 (来自convert API，包含mappedData、width、height、colorSystem) |
| `downloadOptions` | Object | ❌ | 下载选项 |

### PixelData 结构

```typescript
interface PixelData {
  mappedData: MappedPixel[][] | null;  // 像素网格数据
  width: number | null;                 // 网格宽度
  height: number | null;                // 网格高度
  colorSystem: ColorSystem;             // 色号系统 (MARD、COCO等)
}
```

### 下载选项

| 选项 | 类型 | 默认值 | 范围 | 说明 |
|------|------|--------|------|------|
| `showGrid` | boolean | true | - | 显示网格线 |
| `gridInterval` | number | 10 | 1-50 | 网格间隔 |
| `showCoordinates` | boolean | true | - | 显示坐标 |
| `gridLineColor` | string | "#CCCCCC" | - | 网格线颜色 |
| `outerBorderColor` | string | "#141414" | - | **NEW** 外边框颜色 |
| `includeStats` | boolean | true | - | 包含统计信息 |
| `showTransparentLabels` | boolean | false | - | **NEW** 显示透明色标识 |
| `title` | string | - | - | **NEW** 图纸标题（高度已增加） |
| `dpi` | number | 150 | 72-600 | **NEW** 图片分辨率（DPI模式） |
| `renderMode` | string | "dpi" | "dpi"\|"fixed" | **NEW** 渲染模式 |
| `fixedWidth` | number | - | >0 | **NEW** 固定宽度（像素，fixed模式） |

### 新功能说明

#### 🆕 标题功能 (`title`)
- **描述**: 在图片顶部添加标题栏，居中显示指定的标题文字
- **样式**: 深色文字 (#1F2937)
- **位置**: 图片最顶部，紧凑布局
- **字体**: 粗体，大小根据DPI和画布宽度自动缩放
- **示例**: `"title": "我的拼豆图纸"`
- **注意**: 如果不提供title参数，则不显示标题栏
- **更新**: 标题栏高度已优化为更紧凑的布局

#### 🆕 DPI功能 (`dpi`)
- **描述**: 控制生成图片的分辨率，影响图片清晰度和文件大小
- **默认值**: 150 DPI
- **推荐值**:
  - **72 DPI**: 网页显示，文件较小
  - **150 DPI**: 标准打印，平衡质量和大小
  - **300 DPI**: 高质量打印，文件较大
  - **600 DPI**: 专业打印，文件很大
- **影响**: 所有元素（单元格、文字、边距）都会按DPI比例缩放
- **示例**: `"dpi": 300`
- **注意**: 仅在DPI模式下使用

#### 🆕 渲染模式功能 (`renderMode`)
- **描述**: 选择图片渲染的计算方式
- **默认值**: `"dpi"`
- **可选值**:
  - **`"dpi"`**: DPI模式 - 基于DPI设置图片分辨率，适用于需要特定分辨率的场景
  - **`"fixed"`**: 固定宽度模式 - 根据指定的像素宽度渲染，系统自动计算单元格大小
- **示例**: `"renderMode": "fixed"`

#### 🆕 固定宽度功能 (`fixedWidth`)
- **描述**: 在固定宽度模式下指定图片的横向像素宽度
- **单位**: 像素
- **使用条件**: 仅在 `renderMode: "fixed"` 时生效
- **计算**: 系统会根据指定宽度和网格数量自动计算最合适的单元格大小
- **示例**: `"fixedWidth": 1200`
- **注意**: 如果未指定且为fixed模式，将自动回退到DPI模式

#### 🆕 外边框颜色功能 (`outerBorderColor`)
- **描述**: 为网格外围添加可自定义颜色的边框
- **默认值**: `"#141414"` (深灰色)
- **样式**: 围绕整个网格区域的实线边框
- **位置**: 网格最外层边界
- **颜色格式**: 支持十六进制颜色代码 (如 #FF0000)
- **示例**:
  - `"outerBorderColor": "#000000"` - 纯黑色边框
  - `"outerBorderColor": "#FF0000"` - 红色边框
  - `"outerBorderColor": "#CCCCCC"` - 浅灰色边框
- **用途**: 增强图纸边界识别，美化打印效果

#### 🆕 透明色标识功能 (`showTransparentLabels`)
- **描述**: 控制是否在透明色（T01）单元格中显示色号标识
- **默认值**: `false` (不显示)
- **行为**:
  - `true`: 在T01透明色单元格中显示"T01"文字标识
  - `false`: T01透明色单元格保持空白，不显示任何文字
- **用途**:
  - 设计阶段：显示标识便于识别透明区域
  - 制作阶段：隐藏标识保持图纸简洁
- **统计影响**: 无论此选项如何设置，T01都不会计入豆子用量统计
- **示例**: `"showTransparentLabels": true`

### 请求示例

#### 基础请求
```json
{
  "pixelData": {
    "mappedData": [
      [
        {"key": "P12", "color": "#FFFFFF", "isExternal": false},
        {"key": "M01", "color": "#E7002F", "isExternal": false}
      ]
    ],
    "width": 25,
    "height": 25,
    "colorSystem": "MARD"
  }
}
```

#### 完整功能请求
```json
{
  "pixelData": {
    "mappedData": "...",
    "width": 50,
    "height": 40,
    "colorSystem": "MARD"
  },
  "downloadOptions": {
    "showGrid": true,
    "gridInterval": 5,
    "showCoordinates": true,
    "gridLineColor": "#999999",
    "outerBorderColor": "#000000",
    "includeStats": true,
    "showTransparentLabels": false,
    "title": "我的拼豆图纸 - 爱心图案",
    "renderMode": "dpi",
    "dpi": 300
  }
}
```

#### 自定义边框颜色请求
```json
{
  "pixelData": "...",
  "downloadOptions": {
    "title": "彩色边框图纸",
    "renderMode": "fixed",
    "fixedWidth": 1200,
    "showGrid": true,
    "gridLineColor": "#CCCCCC",
    "outerBorderColor": "#FF0000",
    "showTransparentLabels": true,
    "includeStats": true
  }
}
```

#### DPI模式请求（基于DPI）
```json
{
  "pixelData": "...",
  "downloadOptions": {
    "title": "高分辨率拼豆图纸",
    "renderMode": "dpi",
    "dpi": 300,
    "showGrid": true,
    "gridLineColor": "#DDDDDD",
    "outerBorderColor": "#141414",
    "showTransparentLabels": false
  }
}
```

#### 固定宽度模式请求
```json
{
  "pixelData": "...",
  "gridDimensions": "...",
  "colorCounts": "...",
  "totalBeadCount": 625,
  "selectedColorSystem": "MARD",
  "downloadOptions": {
    "title": "固定宽度拼豆图纸",
    "renderMode": "fixed",
    "fixedWidth": 1200,
    "showGrid": true,
    "showCoordinates": true
  }
}
```

### 成功响应

- **Content-Type**: `image/png`
- **Content-Disposition**: `attachment; filename="pattern.png"`
- **Body**: PNG图片二进制数据

> **API更新说明:**
> 1. 移除了 `activeBeadPalette` 参数 - 在下载API中不再需要调色板数据，因为所有颜色映射已在转换阶段完成
> 2. 移除了 `filename` 参数 - 服务端统一使用固定文件名，由客户端决定保存文件时使用的实际文件名
> 3. 简化了响应头信息 - 默认使用 `pattern.png` 作为下载文件名

#### 文件大小参考
| DPI | 30x30网格 | 50x50网格 | 100x100网格 |
|-----|-----------|-----------|-------------|
| 72  | ~50KB     | ~120KB    | ~400KB      |
| 150 | ~180KB    | ~400KB    | ~1.2MB      |
| 300 | ~600KB    | ~1.5MB    | ~4.5MB      |
| 600 | ~2.2MB    | ~5.8MB    | ~17MB       |

### 错误响应

| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | 缺少必要的数据参数 | 未提供必需参数 |
| 400 | DPI超出范围 | DPI不在72-600范围内 |
| 500 | 图片生成失败 | 服务器内部错误 |

```json
{
  "success": false,
  "error": "图片生成失败",
  "details": "错误详情"
}
```

### 使用建议

#### 模式选择
- **DPI模式** (`renderMode: "dpi"`):
  - 适用于需要特定分辨率的场景（如打印）
  - 通过DPI控制图片质量
  - 文件大小可预测
- **固定宽度模式** (`renderMode: "fixed"`):
  - 适用于需要固定尺寸的场景（如网页显示）
  - 图片宽度固定，高度自适应
  - 单元格大小自动计算

#### DPI建议（DPI模式）
1. **网页预览**: 使用72-150 DPI
2. **家用打印**: 使用200-300 DPI
3. **专业打印**: 使用300-600 DPI

#### 固定宽度建议（Fixed模式）
1. **移动端显示**: 800-1000像素
2. **桌面端显示**: 1200-1600像素
3. **高分辨率显示**: 1920像素以上

#### 通用建议
1. **标题长度**: 建议不超过30个字符以确保良好显示
2. **文件大小**: 高DPI和大尺寸会显著增加文件大小，请根据需要选择
3. **网格间隔**: 建议使用5或10的间隔值，便于查看和制作

### 测试端点

可以使用以下简单数据测试新功能：

```json
{
  "pixelData": {
    "mappedData": [
      [
        {"key": "P12", "color": "#FFFFFF", "isExternal": false},
        {"key": "M01", "color": "#E7002F", "isExternal": false}
      ],
      [
        {"key": "M01", "color": "#E7002F", "isExternal": false},
        {"key": "P12", "color": "#FFFFFF", "isExternal": false}
      ]
    ],
    "width": 2,
    "height": 2,
    "colorSystem": "MARD"
  },
  "downloadOptions": {
    "title": "测试图纸",
    "dpi": 300
  }
}
```
