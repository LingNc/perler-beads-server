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
      "filename": { "type": "string", "description": "自定义文件名" }
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

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showGrid` | boolean | true | 显示网格线 |
| `gridInterval` | number | 10 | 网格间隔 |
| `showCoordinates` | boolean | true | 显示坐标 |
| `gridLineColor` | string | "#CCCCCC" | 网格线颜色 |
| `includeStats` | boolean | true | 包含统计信息 |
| `filename` | string | 自动生成 | 文件名 |

### 请求示例

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
  "selectedColorSystem": "MARD",
  "downloadOptions": {
    "showGrid": true,
    "gridInterval": 5,
    "filename": "my_pattern"
  }
}
```

### 成功响应

- **Content-Type**: `image/png`
- **Content-Disposition**: `attachment; filename="pattern.png"`
- **Body**: PNG图片二进制数据

### 错误响应

| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | 缺少必要的数据参数 | 未提供必需参数 |
| 500 | 图片生成失败 | 服务器内部错误 |

```json
{
  "success": false,
  "error": "图片生成失败",
  "details": "错误详情"
}
```

## GET `/api/download`

获取API文档信息。

### 响应

```json
{
  "endpoint": "/api/download",
  "method": "POST",
  "description": "生成并下载拼豆图纸图片",
  "parameters": {
    "pixelData": {
      "type": "MappedPixel[][]",
      "required": true,
      "description": "像素数据"
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
