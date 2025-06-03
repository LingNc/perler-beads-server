# 状态检查 API

## GET `/api/status`

获取API服务的运行状态和系统信息。本接口本身就是状态文档，无需额外的文档端点。

### 请求

- **方法**: GET
- **URL**: `/api/status`
- **参数**: 无

### 响应

```json
{
  "service": "perler-beads-api",
  "status": "healthy",
  "timestamp": "2025-06-03T10:00:00.000Z",
  "uptime": 3600.5,
  "version": "1.0.0",
  "environment": "development",
  "health": {
    "api": "ok",
    "canvas": "ok",
    "memory": {
      "used": 128,
      "total": 256,
      "unit": "MB"
    },
    "responseTime": 15
  },
  "features": {
    "imageConversion": true,
    "downloadGeneration": true,
    "paletteManagement": true,
    "multipleFormats": true
  },
  "limits": {
    "maxFileSize": "10MB",
    "supportedFormats": ["jpg", "jpeg", "png", "gif", "bmp", "webp"],
    "maxGranularity": 200
  }
}
```

### 状态说明

- `status`: `"healthy"` (正常) / `"degraded"` (降级) / `"error"` (错误)
- `health.api`: API服务状态
- `health.canvas`: Canvas库状态
- `health.memory`: 内存使用情况

### 错误响应

```json
{
  "service": "perler-beads-api",
  "status": "error",
  "timestamp": "2025-06-03T10:00:00.000Z",
  "error": "错误描述",
  "health": {
    "api": "error",
    "responseTime": 20
  }
}
```
