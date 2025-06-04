# 拼豆图纸生成器 API 文档

## 概述

拼豆图纸生成器 API 可以将图片转换为拼豆图纸，支持多种颜色系统和自定义调色板。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **数据格式**: JSON
- **最大文件大小**: 10MB
- **支持图片格式**: jpg, jpeg, png, gif, bmp, webp

## API 端点

| 端点 | 方法 | 功能 |
|------|------|------|
| `/api` | GET | [API概述和文档](api/root.md) |
| `/api/status` | GET | [获取API服务状态](api/status.md) |
| `/api/palette` | GET/POST | [调色板管理](api/palette.md) |
| `/api/convert` | GET/POST | [图片转换](api/convert.md) |
| `/api/download` | GET/POST | [图纸下载](api/download.md) |

## 在线文档

每个API端点都支持GET请求获取详细的接口文档：

- `GET /api` - API总览和所有端点文档
- `GET /api/convert` - 图片转换接口使用说明
- `GET /api/download` - 图纸下载接口使用说明
- `GET /api/palette` - 调色板接口使用说明
- `GET /api/status` - 状态接口文档

### 使用示例

```bash
# 获取API总览
curl http://localhost:3000/api

# 获取转换接口文档
curl http://localhost:3000/api/convert

# 获取服务状态
curl http://localhost:3000/api/status
```

## 支持的调色板

- **291色调色板**: 默认调色板，支持MARD、COCO、漫漫、盼盼、咪小窝 5种色号系统
- **自定义调色板**: 支持用户自定义颜色，格式：
  - `{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}`
  - 版本3.0不包含name字段，版本4.0包含name字段

## 错误处理

详细的错误代码和解决方案请参考 [错误代码参考](error-codes.md)
