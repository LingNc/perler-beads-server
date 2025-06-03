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
    "pixelData": { "type": "MappedPixel[][]", "required": true, "description": "像素数据" },
    "gridDimensions": { "type": "{ N: number, M: number }", "required": true, "description": "网格尺寸" },
    "colorCounts": { "type": "object", "required": true, "description": "颜色统计" },
    "totalBeadCount": { "type": "number", "required": true, "description": "总珠子数" },
    "activeBeadPalette": { "type": "PaletteColor[]", "required": true, "description": "活跃调色板" },
    "selectedColorSystem": { "type": "ColorSystem", "required": true, "description": "选择的颜色系统" },
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
| `activeBeadPalette` | Array | ✅ | 活跃调色板 |
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
| `filename` | string | 自动生成 | - | 文件名 |
| `title` | string | - | - | **NEW** 图纸标题 |
| `dpi` | number | 150 | 72-600 | **NEW** 图片分辨率 |

### 新功能说明

#### 🆕 标题功能 (`title`)
- **描述**: 在图片顶部添加标题栏，居中显示指定的标题文字
- **样式**: 浅灰色背景 (#F8F9FA)，深色文字 (#1F2937)，带边框
- **位置**: 图片最顶部，标题栏高度根据DPI自动调整
- **字体**: 粗体，大小根据DPI和画布宽度自动缩放
- **示例**: `"title": "我的拼豆图纸"`
- **注意**: 如果不提供title参数，则不显示标题栏

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
    "#FFFFFF": {"count": 300, "color": "#FFFFFF"},
    "#E7002F": {"count": 325, "color": "#E7002F"}
  },
  "totalBeadCount": 625,
  "activeBeadPalette": [
    {"key": "#FFFFFF", "color": "#FFFFFF"},
    {"key": "#E7002F", "color": "#E7002F"}
  ],
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
  "activeBeadPalette": "...",
  "selectedColorSystem": "MARD",
  "downloadOptions": {
    "showGrid": true,
    "gridInterval": 5,
    "showCoordinates": true,
    "gridLineColor": "#999999",
    "includeStats": true,
    "filename": "my_pattern",
    "title": "我的拼豆图纸 - 爱心图案",
    "dpi": 300
  }
}
```

### 成功响应

- **Content-Type**: `image/png`
- **Content-Disposition**: `attachment; filename="pattern.png"`
- **Body**: PNG图片二进制数据

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

1. **网页预览**: 使用72-150 DPI
2. **家用打印**: 使用200-300 DPI
3. **专业打印**: 使用300-600 DPI
4. **标题长度**: 建议不超过30个字符以确保良好显示
5. **文件大小**: 高DPI会显著增加文件大小，请根据需要选择

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
    "#FFFFFF": {"count": 2, "color": "#FFFFFF"},
    "#E7002F": {"count": 2, "color": "#E7002F"}
  },
  "totalBeadCount": 4,
  "activeBeadPalette": [
    {"key": "#FFFFFF", "color": "#FFFFFF"},
    {"key": "#E7002F", "color": "#E7002F"}
  ],
  "selectedColorSystem": "MARD",
  "downloadOptions": {
    "title": "测试图纸",
    "dpi": 300
  }
}
```
