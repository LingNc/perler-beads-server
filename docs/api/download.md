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
    "pixelData": { "type": "MappedPixel[][]", "required": true, "description": "像素数据（转换完成后的网格数据）" },
    "gridDimensions": { "type": "{ N: number, M: number }", "required": true, "description": "网格尺寸（宽度和高度）" },
    "colorCounts": { "type": "object", "required": true, "description": "颜色统计（各颜色使用数量）" },
    "totalBeadCount": { "type": "number", "required": true, "description": "总珠子数量" },
    "selectedColorSystem": { "type": "string", "required": true, "description": "选择的颜色系统" },
    "downloadOptions": {
      "showGrid": { "type": "boolean", "default": true, "description": "显示网格线" },
      "gridInterval": { "type": "number", "default": 10, "description": "网格间隔" },
      "showCoordinates": { "type": "boolean", "default": true, "description": "显示坐标" },
      "gridLineColor": { "type": "string", "default": "#CCCCCC", "description": "网格线颜色" },
      "includeStats": { "type": "boolean", "default": true, "description": "包含统计信息" },
      "filename": { "type": "string", "description": "自定义文件名" },
      "title": { "type": "string", "description": "图纸标题 - 显示在图片顶部的标题栏中" },
      "dpi": { "type": "number", "default": 150, "range": "72-600", "description": "图片分辨率 (DPI)" }
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
| `pixelData` | Array | ✅ | 像素数据 (来自convert API) |
| `gridDimensions` | Object | ✅ | 网格尺寸 |
| `colorCounts` | Object | ✅ | 颜色统计 |
| `totalBeadCount` | Number | ✅ | 总珠子数 |
| `selectedColorSystem` | String | ✅ | 色号系统 |
| `downloadOptions` | Object | ❌ | 下载选项 |

### 下载选项

| 选项 | 类型 | 默认值 | 范围 | 说明 |
|------|------|--------|------|------|
| `showGrid` | boolean | true | - | 显示网格线 |
| `gridInterval` | number | 10 | 1-50 | 网格间隔 |
| `showCoordinates` | boolean | true | - | 显示坐标 |
| `gridLineColor` | string | "#CCCCCC" | - | 网格线颜色 |
| `includeStats` | boolean | true | - | 包含统计信息 |
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

### 请求示例

#### 基础请求
```json
{
  "pixelData": [
    [
      {"key": "#FFFFFF", "color": "#FFFFFF"},
      {"key": "#E7002F", "color": "#E7002F"}
    ]
  ],
  "gridDimensions": {"N": 25, "M": 25, "width": 25, "height": 25},
  "colorCounts": {
    "P12": {"count": 300, "color": "#FFFFFF"},
    "M01": {"count": 325, "color": "#E7002F"}
  },
  "totalBeadCount": 625,
  "selectedColorSystem": "MARD"
}
```

#### 完整功能请求
```json
{
  "pixelData": "...",
  "gridDimensions": "...",
  "colorCounts": "...",
  "totalBeadCount": 625,
  "selectedColorSystem": "MARD",
  "downloadOptions": {
    "showGrid": true,
    "gridInterval": 5,
    "showCoordinates": true,
    "gridLineColor": "#999999",
    "includeStats": true,
    "title": "我的拼豆图纸 - 爱心图案",
    "renderMode": "dpi",
    "dpi": 300
  }
}
```

#### DPI模式请求（基于DPI）
```json
{
  "pixelData": "...",
  "gridDimensions": "...",
  "colorCounts": "...",
  "totalBeadCount": 625,
  "selectedColorSystem": "MARD",
  "downloadOptions": {
    "title": "高分辨率拼豆图纸",
    "renderMode": "dpi",
    "dpi": 300,
    "showGrid": true
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
  "pixelData": [
    [{"key": "#FFFFFF", "color": "#FFFFFF"}, {"key": "#E7002F", "color": "#E7002F"}],
    [{"key": "#E7002F", "color": "#E7002F"}, {"key": "#FFFFFF", "color": "#FFFFFF"}]
  ],
  "gridDimensions": {"N": 2, "M": 2},
  "colorCounts": {
    "P12": {"count": 2, "color": "#FFFFFF"},
    "M01": {"count": 2, "color": "#E7002F"}
  },
  "totalBeadCount": 4,
  "selectedColorSystem": "MARD",
  "downloadOptions": {
    "title": "测试图纸",
    "dpi": 300
  }
}
```
