# 图片转换 API

## GET `/api/convert`

获取图片转换接口的详细文档和参数说明。

### 响应示例

```json
{
  "endpoint": "/api/convert",
  "method": "POST",
  "description": "将图片转换为拼豆图纸",
  "parameters": {
    "image": { "type": "File", "required": true, "description": "要转换的图片文件" },
    "granularity": { "type": "number", "default": 50, "range": "1-200", "description": "图纸精细度" },
    "similarityThreshold": { "type": "number", "default": 30, "range": "0-100", "description": "颜色相似度阈值" },
    "pixelationMode": {
      "type": "string",
      "default": "dominant",
      "options": ["dominant", "average"],
      "description": "像素化模式：dominant=卡通模式, average=真实模式"
    },
    "selectedPalette": { "type": "string", "default": "291色", "description": "使用的调色板" },
    "selectedColorSystem": { "type": "string", "default": "MARD", "description": "色号系统" },
    "customPalette": {
      "type": "string",
      "required": false,
      "description": "JSON格式的自定义调色板数据"
    }
  },
  "response": {
    "success": "boolean",
    "data": {
      "gridDimensions": "{ N: number, M: number, width: number, height: number }",
      "pixelData": "MappedPixel[][]",
      "colorCounts": "{ [key: string]: { count: number, color: string } }",
      "totalBeadCount": "number",
      "activeBeadPalette": "string (调色板名称)",
      "processingParams": "object",
      "imageInfo": "object"
    }
  },
  "notes": [
    "支持自定义调色板，通过customPalette参数传入JSON格式的颜色数据",
    "默认使用291色调色板",
    "自定义调色板格式：[{\"key\": \"颜色名称\", \"hex\": \"#RRGGBB\"}]"
  ]
}
```

---

## POST `/api/convert`

将图片转换为拼豆像素数据。

### 请求参数 (multipart/form-data)

| 参数 | 类型 | 必需 | 默认值 | 范围 | 说明 |
|------|------|------|--------|------|------|
| `image` | File | ✅ | - | - | 图片文件 |
| `granularity` | string | ❌ | "50" | 1-200 | 像素化粒度 |
| `similarityThreshold` | string | ❌ | "30" | 0-100 | 颜色相似度阈值 |
| `pixelationMode` | string | ❌ | "dominant" | dominant/average | 像素化模式 |
| `selectedPalette` | string | ❌ | "291色" | 291色/自定义 | 调色板选择 |
| `selectedColorSystem` | string | ❌ | "MARD" | MARD/COCO/漫漫/盼盼/咪小窝 | 色号系统 |
| `customPalette` | string | ❌ | - | - | 自定义调色板JSON |

### 自定义调色板格式

**新格式:**
```json
{
  "version": "3.0",
  "selectedHexValues": ["#E7002F", "#FEFFFF"],
  "exportDate": "2025-06-03T16:09:31.956Z",
  "totalColors": 2
}
```

**旧格式:**
```json
[
  {"key": "红色", "hex": "#E7002F"},
  {"key": "白色", "hex": "#FEFFFF"}
]
```

### 成功响应

```json
{
  "success": true,
  "data": {
    "gridDimensions": {
      "N": 25,
      "M": 25,
      "width": 25,
      "height": 25
    },
    "pixelData": [
      [
        {"key": "#FFFFFF", "color": "#FFFFFF"},
        {"key": "#E7002F", "color": "#E7002F"}
      ]
    ],
    "colorCounts": {
      "#FFFFFF": {"count": 300, "color": "#FFFFFF"},
      "#E7002F": {"count": 325, "color": "#E7002F"}
    },
    "totalBeadCount": 625,
    "activeBeadPalette": "291色",
    "processingParams": {
      "granularity": 50,
      "similarityThreshold": 30,
      "pixelationMode": "dominant",
      "selectedPalette": "291色",
      "selectedColorSystem": "MARD",
      "paletteSource": "default"
    },
    "imageInfo": {
      "originalWidth": 800,
      "originalHeight": 600,
      "aspectRatio": 0.75
    }
  }
}
```

> **API更新说明:**
> - `activeBeadPalette` 参数格式已更改：原先返回颜色数组，现在仅返回调色板名称字符串
> - 此更改减少了API响应大小，提高了效率
> - 下载API已不再需要调色板信息，因为所有颜色映射在转换阶段已完成
```

### 错误响应

| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | 缺少图片文件 | 未提供image参数 |
| 400 | 参数范围错误 | granularity不在1-200范围内 |
| 400 | 自定义调色板格式错误 | JSON格式无效 |
| 500 | 图片处理失败 | 文件损坏或不支持的格式 |