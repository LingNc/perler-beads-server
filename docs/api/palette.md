# 调色板管理 API

## GET `/api/palette`

获取调色板信息。

### 请求参数

| 参数 | 类型 | 必需 | 默认值 | 说明 |
|------|------|------|--------|------|
| `colorSystem` | string | 否 | "MARD" | 颜色系统 |
| `detailed` | string | 否 | "false" | 是否返回详细颜色信息 |

### 基础响应

```json
{
  "success": true,
  "data": {
    "availablePalettes": ["291色", "自定义"],
    "paletteOptions": [
      {
        "name": "291色",
        "description": "完整色板",
        "colorCount": 291
      },
      {
        "name": "自定义",
        "description": "用户上传的调色板",
        "colorCount": 0
      }
    ],
    "colorSystems": [
      {"key": "MARD", "name": "MARD"},
      {"key": "COCO", "name": "COCO"},
      {"key": "漫漫", "name": "漫漫"},
      {"key": "盼盼", "name": "盼盼"},
      {"key": "咪小窝", "name": "咪小窝"}
    ],
    "defaultColorSystem": "MARD",
    "defaultPalette": "291色",
    "totalColors": 291,
    "supportsCustomPalette": true
  }
}
```

### 详细响应 (detailed=true)

```json
{
  "success": true,
  "data": {
    "colorSystem": "MARD",
    "totalColors": 291,
    "colors": [
      {
        "key": "A01",
        "hex": "#FAF4C8",
        "rgb": {"r": 250, "g": 244, "b": 200},
        "colorSystem": "MARD"
      }
    ]
  }
}
```

## POST `/api/palette`

验证自定义调色板。

### 请求格式

**自定义调色板格式:**
```json
{
  "customPalette": {
    "version": "3.0",
    "selectedHexValues": ["#E7002F", "#FEFFFF", "#00FF00"],
    "exportDate": "2025-06-03T16:09:31.956Z",
    "totalColors": 3
  }
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
    "validatedColors": [
      {
        "key": "M01",
        "hex": "#E7002F",
        "rgb": {"r": 231, "g": 0, "b": 47}
      }
    ],
    "totalColors": 2,
    "version": "3.0",
    "message": "自定义调色板验证成功"
  }
}
```

### 错误响应

```json
{
  "success": false,
  "error": "颜色验证失败",
  "details": [
    "第1个颜色的hex值格式无效: #GGGGGG"
  ]
}
```
