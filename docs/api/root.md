# API 根端点文档

## 端点信息

- **URL**: `/api`
- **方法**: `GET`
- **功能**: 获取API概述和所有端点的详细文档

## 请求参数

无需参数。

## 响应格式

```json
{
  "name": "七卡瓦拼豆图纸生成器API",
  "version": "1.0.0",
  "description": "提供图片转拼豆图纸的API服务",
  "status": "active",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "endpoints": {
    "/api/convert": {
      "method": "POST",
      "description": "将图片转换为拼豆图纸",
      "parameters": {
        "image": "File - 图片文件",
        "granularity": "number - 精细度 (1-200, 默认50)",
        "similarityThreshold": "number - 相似度阈值 (0-100, 默认30)",
        "pixelationMode": "string - 像素化模式 (dominant/average, 默认dominant)",
        "selectedPalette": "string - 调色板名称 (290色/custom/预设调色板名称, 默认290色)",
        "selectedColorSystem": "string - 色号系统 (默认MARD)",
        "customPalette": "string - 自定义调色板JSON"
      }
    },
    "/api/download": {
      "method": "POST",
      "description": "生成并下载图纸图片",
      "parameters": {
        "pixelData": "PixelData - 包含所有像素数据和元信息的对象",
        "downloadOptions": {
          "showGrid": "boolean - 显示网格线 (默认true)",
          "gridInterval": "number - 网格间隔 (默认10)",
          "showCoordinates": "boolean - 显示坐标 (默认true)",
          "gridLineColor": "string - 网格线颜色 (默认#CCCCCC)",
          "outerBorderColor": "string - 外边框颜色 (默认#141414)",
          "includeStats": "boolean - 包含统计信息 (默认true)",
          "showTransparentLabels": "boolean - 显示透明色标识 (默认false)",
          "title": "string - 图纸标题",
          "dpi": "number - 图片分辨率 (默认150)",
          "renderMode": "string - 渲染模式 (dpi/fixed, 默认dpi)",
          "fixedWidth": "number - 固定宽度(px) - fixed模式必需"
        }
      }
    },
    "/api/palette": {
      "method": "GET/POST",
      "description": "GET: 获取调色板信息和预设调色板列表; POST: 验证自定义调色板",
      "parameters": {
        "colorSystem": "string - 色号系统 (可选, GET)",
        "detailed": "boolean - 是否返回详细信息 (可选, GET)",
        "customPalette": "object - 自定义调色板对象 (POST验证)",
        "colorSystem": "string - 色号系统 (POST验证, 可选, 默认MARD)"
      }
    },
    "/api/status": {
      "method": "GET",
      "description": "获取API状态信息"
    }
  },
  "features": [
    "图片转拼豆图纸",
    "多种像素化模式",
    "自定义调色板支持",
    "预设调色板支持 (144色/97色/120色/168色)",
    "290色完整调色板",
    "5种色号系统",
    "图纸下载",
    "颜色统计",
    "自定义调色板验证",
    "多种输出格式"
  ],
  "supportedFormats": {
    "input": ["jpg", "jpeg", "png", "gif", "bmp", "webp"],
    "output": ["png", "jpg"]
  },
  "limits": {
    "maxFileSize": "10MB",
    "maxImageDimensions": "4000x4000",
    "maxGranularity": 200,
    "minGranularity": 1
  },
  "examples": {
    "convertImage": {
      "url": "/api/convert",
      "method": "POST",
      "contentType": "multipart/form-data",
      "formData": {
        "image": "[图片文件]",
        "granularity": 50,
        "pixelationMode": "dominant",
        "selectedPalette": "290色"
      }
    },
    "convertWithCustomPalette": {
      "url": "/api/convert",
      "method": "POST",
      "contentType": "multipart/form-data",
      "formData": {
        "image": "[图片文件]",
        "granularity": 50,
        "selectedPalette": "custom",
        "customPalette": "[{\"key\":\"红色\",\"hex\":\"#FF0000\"}]"
      }
    },
    "convertWithPresetPalette": {
      "url": "/api/convert",
      "method": "POST",
      "contentType": "multipart/form-data",
      "formData": {
        "image": "[图片文件]",
        "granularity": 50,
        "selectedPalette": "144色拼豆调色板",
        "pixelationMode": "dominant"
      }
    },
    "downloadPattern": {
      "url": "/api/download",
      "method": "POST",
      "contentType": "application/json",
      "body": {
        "pixelData": {
          "mappedData": "[[...]]",
          "width": 50,
          "height": 40,
          "colorSystem": "MARD"
        },
        "downloadOptions": {
          "showGrid": true,
          "gridLineColor": "#CCCCCC",
          "outerBorderColor": "#141414",
          "showTransparentLabels": false,
          "title": "我的拼豆图纸",
          "dpi": 300,
          "renderMode": "dpi"
        }
      }
    },
    "downloadPatternCustomBorder": {
      "url": "/api/download",
      "method": "POST",
      "contentType": "application/json",
      "description": "自定义边框颜色的下载示例",
      "body": {
        "pixelData": {
          "mappedData": "[[...]]",
          "width": 50,
          "height": 40,
          "colorSystem": "MARD"
        },
        "downloadOptions": {
          "showGrid": true,
          "gridLineColor": "#DDDDDD",
          "outerBorderColor": "#FF0000",
          "showTransparentLabels": true,
          "title": "彩色边框图纸",
          "renderMode": "fixed",
          "fixedWidth": 1200
        }
      }
    }
  }
}
```

## 使用说明

这个端点提供API的完整概述，包括：

1. **服务信息** - API名称、版本、状态
2. **端点列表** - 所有可用的API端点和参数说明
3. **功能特性** - 支持的功能列表
4. **格式限制** - 支持的文件格式和大小限制
5. **使用示例** - 常见操作的示例代码

## 响应字段说明

- `name` - API服务名称
- `version` - API版本号
- `status` - 服务状态 (active/maintenance/error)
- `endpoints` - 所有端点的详细参数说明
- `features` - 支持的功能列表
- `supportedFormats` - 输入输出格式支持
- `limits` - 文件大小和尺寸限制
- `examples` - 使用示例
