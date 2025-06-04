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
    "selectedColorSystem": { "type": "string", "default": "MARD", "description": "色号系统：MARD/COCO/漫漫/盼盼/咪小窝" },
    "customPalette": {
      "type": "string",
      "required": false,
      "description": "JSON格式的自定义调色板数据，格式：{\"version\":\"3.0/4.0\",\"selectedHexValues\":[\"#RRGGBB\",...]}"
    }
  },
  "response": {
    "success": "boolean",
    "data": {
      "pixelData": {
        "mappedData": "MappedPixel[][]",
        "width": "number",
        "height": "number",
        "colorSystem": "string"
        },
      "colorCounts": "{ [key: string]: { count: number, color: string } } - key为色号",
      "totalBeadCount": "number",
      "paletteName": "string (使用的调色板名称)",
      "processingParams": "object",
      "imageInfo": "object"
    }
  },
  "notes": [
    "支持自定义调色板，通过customPalette参数传入JSON格式的颜色数据",
    "默认使用291色调色板，支持5种色号系统：MARD、COCO、漫漫、盼盼、咪小窝",
    "colorCounts中的key为对应色号系统的色号标识",
    "自定义调色板格式：{\"version\":\"3.0/4.0\",\"selectedHexValues\":[\"#RRGGBB\",...]}",
    "版本3.0不包含name字段，版本4.0包含name字段"
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

```json
{
  "version": "3.0",
  "selectedHexValues": ["#E7002F", "#FEFFFF"],
  "exportDate": "2025-06-03T16:09:31.956Z",
  "totalColors": 2
}
```

**版本说明:**
- 版本3.0：不包含name字段
- 版本4.0：包含name字段

### 成功响应

```json
{
  "success": true,
  "data": {
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
    },
    "colorCounts": {
      "P12": {"count": 300, "color": "#FFFFFF"},
      "M01": {"count": 325, "color": "#E7002F"}
    },
    "totalBeadCount": 625,
    "paletteName": "291色",
    "processingParams": {
      "granularity": 50,
      "similarityThreshold": 30,
      "pixelationMode": "dominant",
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
> - **PixelData 结构优化**: 原先分离的 `gridDimensions` 和 `pixelData` 现在统一为 `PixelData` 对象
> - **数据完整性**: `PixelData` 包含所有必要信息（mappedData、尺寸、色号系统）
> - **下载API简化**: 现在只需要传递 `pixelData` 对象即可，无需额外的色号系统参数
> - **向后兼容**: 保持了 `colorCounts` 和其他统计信息的独立返回
```

### 错误响应

| 状态码 | 错误 | 说明 |
|--------|------|------|
| 400 | 缺少图片文件 | 未提供image参数 |
| 400 | 参数范围错误 | granularity不在1-200范围内 |
| 400 | 自定义调色板格式错误 | JSON格式无效 |
| 500 | 图片处理失败 | 文件损坏或不支持的格式 |