# 拼豆图纸生成器 API 文档

## 概述

拼豆图纸生成器 API 是一个基于 Next.js 构建的 RESTful API，提供图片转换为拼豆图纸的完整功能。支持多种颜色系统、调色板管理、图片处理和高质量图纸生成。

**基础信息:**
- 基础URL: `http://localhost:3000/api/v1`
- 数据格式: JSON
- 编码: UTF-8
- 最大文件大小: 10MB
- 支持图片格式: jpg, jpeg, png, gif, bmp, webp

## API 端点总览

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/status` | GET | 获取API服务状态 | ✅ |
| `/palette` | GET | 获取调色板信息 | ✅ |
| `/convert` | POST | 图片转换为像素数据 | ✅ |
| `/download` | POST | 生成并下载图纸文件 | ✅ |
| `/` | GET | API根信息 | ✅ |

---

## 1. 状态检查 API

### GET `/api/v1/status`

获取API服务的运行状态和系统信息。

#### 请求示例
```python
import requests

response = requests.get("http://localhost:3000/api/v1/status")
print(response.json())
```

#### 响应示例
```json
{
  "service": "perler-beads-api",
  "status": "healthy",
  "timestamp": "2025-06-02T11:19:32.378Z",
  "uptime": 609.90,
  "version": "1.0.0",
  "environment": "development",
  "health": {
    "api": "ok",
    "canvas": "ok",
    "memory": {
      "used": 133,
      "total": 141,
      "percentage": 94.33
    }
  }
}
```

---

## 2. 调色板 API

### GET `/api/v1/palette`

获取支持的颜色系统和调色板信息。

#### 请求示例
```python
import requests

response = requests.get("http://localhost:3000/api/v1/palette")
palette_data = response.json()
color_systems = palette_data['data']['colorSystems']
print(f"可用颜色系统: {[cs['key'] for cs in color_systems]}")
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "colorSystems": [
      {
        "key": "HAMA",
        "name": "Hama",
        "description": "Hama 拼豆色号系统",
        "colorCount": 67
      },
      {
        "key": "MARD",
        "name": "Mars",
        "description": "Mars 拼豆色号系统",
        "colorCount": 71
      }
    ],
    "totalColors": 138
  }
}
```

---

## 3. 图片转换 API

### POST `/api/v1/convert`

将图片转换为拼豆像素数据，支持自定义粒度和颜色系统。

#### 请求参数
- `image` (File): 图片文件
- `granularity` (string): 像素化粒度 (1-50，默认20)
- `selectedColorSystem` (string): 颜色系统 (HAMA/MARD等)

#### 请求示例
```python
import requests
import base64

def encode_image_to_base64(image_path):
    with open(image_path, 'rb') as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# 编码图片
image_base64 = encode_image_to_base64("test_image.png")

# 发送请求
convert_data = {
    "image": image_base64,
    "granularity": "20",
    "selectedColorSystem": "HAMA"
}

response = requests.post(
    "http://localhost:3000/api/v1/convert",
    json=convert_data,
    headers={"Content-Type": "application/json"}
)

result = response.json()
print(f"转换成功: {result['success']}")
print(f"网格尺寸: {result['data']['gridDimensions']}")
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "pixelData": [
      [
        {"color": "#FF0000", "isExternal": false},
        {"color": "#00FF00", "isExternal": false}
      ]
    ],
    "gridDimensions": {
      "width": 20,
      "height": 15
    },
    "colorCounts": {
      "#FF0000": {"color": "#FF0000", "count": 150},
      "#00FF00": {"color": "#00FF00", "count": 150}
    },
    "totalBeadCount": 300,
    "activeBeadPalette": [
      {
        "color": "#FF0000",
        "name": "红色",
        "key": "H2",
        "system": "HAMA"
      }
    ],
    "selectedColorSystem": "HAMA"
  }
}
```

---

## 4. 图纸下载 API

### POST `/api/v1/download`

生成高质量的拼豆图纸PNG文件，支持网格线、坐标系、颜色统计等功能。**已优化边距显示，确保图片布局平衡专业。**

#### 请求参数
```json
{
  "pixelData": "Array<Array<{color: string, isExternal: boolean}>>",
  "gridDimensions": "{width: number, height: number}",
  "colorCounts": "Object<string, {color: string, count: number}>",
  "totalBeadCount": "number",
  "activeBeadPalette": "Array<{color: string, name: string, key: string}>",
  "selectedColorSystem": "string",
  "downloadOptions": {
    "cellSize": "number (默认30)",
    "showGrid": "boolean (默认true)",
    "gridInterval": "number (默认10)",
    "showCoordinates": "boolean (默认true)",
    "gridLineColor": "string (默认#CCCCCC)",
    "includeStats": "boolean (默认true)",
    "filename": "string (可选)"
  }
}
```

#### 请求示例
```python
import requests

# 使用convert API的响应数据
download_data = {
    "pixelData": pixel_data,  # 从convert API获得
    "gridDimensions": grid_dimensions,  # 从convert API获得
    "colorCounts": color_counts,  # 从convert API获得
    "totalBeadCount": total_bead_count,  # 从convert API获得
    "activeBeadPalette": active_bead_palette,  # 从convert API获得
    "selectedColorSystem": "HAMA",
    "downloadOptions": {
        "cellSize": 30,
        "showGrid": True,
        "gridInterval": 5,
        "showCoordinates": True,
        "gridLineColor": "#FF0000",
        "includeStats": True,
        "filename": "my_pattern.png"
    }
}

response = requests.post(
    "http://localhost:3000/api/v1/download",
    json=download_data,
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    # 保存图片文件
    with open("downloaded_pattern.png", "wb") as f:
        f.write(response.content)
    print("✅ 图纸下载成功!")
else:
    print(f"❌ 下载失败: {response.status_code}")
```

#### 响应
- **成功**: 返回PNG图片文件的二进制数据
- **失败**: 返回JSON错误信息

---

## 5. 完整工作流程示例

以下是一个完整的Python示例，展示从图片转换到下载图纸的完整流程：

```python
#!/usr/bin/env python3
import requests
import base64
import os

BASE_URL = "http://localhost:3000/api/v1"

def encode_image_to_base64(image_path):
    """将图片编码为base64"""
    with open(image_path, 'rb') as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def complete_workflow():
    """完整工作流程"""

    # 1. 检查服务状态
    print("🔍 检查服务状态...")
    status_response = requests.get(f"{BASE_URL}/status")
    if status_response.status_code != 200:
        print("❌ 服务不可用")
        return
    print("✅ 服务正常运行")

    # 2. 获取调色板信息
    print("🎨 获取调色板...")
    palette_response = requests.get(f"{BASE_URL}/palette")
    palette_data = palette_response.json()
    color_systems = palette_data['data']['colorSystems']
    color_system = color_systems[0]['key']  # 使用第一个颜色系统
    print(f"✅ 使用颜色系统: {color_system}")

    # 3. 转换图片
    print("🖼️ 转换图片...")
    image_base64 = encode_image_to_base64("test_image.png")

    convert_data = {
        "image": image_base64,
        "granularity": "20",
        "selectedColorSystem": color_system
    }

    convert_response = requests.post(
        f"{BASE_URL}/convert",
        json=convert_data,
        headers={"Content-Type": "application/json"}
    )

    if convert_response.status_code != 200:
        print(f"❌ 转换失败: {convert_response.status_code}")
        return

    convert_result = convert_response.json()['data']
    print(f"✅ 转换成功! 网格尺寸: {convert_result['gridDimensions']}")

    # 4. 下载图纸
    print("📥 下载图纸...")
    download_data = {
        "pixelData": convert_result['pixelData'],
        "gridDimensions": convert_result['gridDimensions'],
        "colorCounts": convert_result['colorCounts'],
        "totalBeadCount": convert_result['totalBeadCount'],
        "activeBeadPalette": convert_result['activeBeadPalette'],
        "selectedColorSystem": convert_result['selectedColorSystem'],
        "downloadOptions": {
            "cellSize": 30,
            "showGrid": True,
            "gridInterval": 5,
            "showCoordinates": True,
            "gridLineColor": "#CCCCCC",
            "includeStats": True
        }
    }

    download_response = requests.post(
        f"{BASE_URL}/download",
        json=download_data,
        headers={"Content-Type": "application/json"}
    )

    if download_response.status_code == 200:
        with open("final_pattern.png", "wb") as f:
            f.write(download_response.content)
        print("✅ 图纸下载成功! 文件: final_pattern.png")
    else:
        print(f"❌ 下载失败: {download_response.status_code}")

if __name__ == "__main__":
    complete_workflow()
```

---

## 错误处理

### 常见错误码

| 状态码 | 说明 | 解决方案 |
|--------|------|----------|
| 400 | 请求参数错误 | 检查请求参数格式和必需字段 |
| 413 | 文件过大 | 压缩图片或选择更小的文件 |
| 422 | 数据验证失败 | 检查数据类型和值范围 |
| 500 | 服务器内部错误 | 联系技术支持 |

### 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息（可选）"
}
```

---

## 性能优化建议

1. **图片大小**: 建议上传图片不超过2MB，分辨率不超过1000x1000
2. **粒度设置**: granularity值越大，处理速度越快，但细节越少
3. **批量处理**: 对于多张图片，建议串行处理避免服务器负载过高
4. **缓存结果**: 相同参数的转换结果可以缓存，避免重复计算

---

## 版本历史

### v1.0.0 (2025-06-02)
- ✅ 实现完整的图片转换功能
- ✅ 支持多种颜色系统
- ✅ 优化图纸生成质量
- ✅ 修复边距不均匀问题，图片布局更专业
- ✅ 完善错误处理机制

---

## 技术支持

如有问题或建议，请提交 Issue 或联系开发团队。

**项目地址**: [GitHub Repository]
**技术栈**: Next.js, Canvas API, TypeScript
**许可证**: MIT
      "unit": "MB"
    },
    "responseTime": 4
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

#### 字段说明
- `service`: 服务名称
- `status`: 服务状态 (healthy/unhealthy)
- `uptime`: 服务运行时间（秒）
- `health.memory`: 内存使用情况
- `features`: 支持的功能特性
- `limits`: API限制信息

---

## 2. 调色板管理 API

### GET `/api/v1/palette`

获取所有可用的颜色系统和调色板信息。

#### 请求
```bash
curl -X GET http://localhost:3000/api/v1/palette
```

#### 响应
```json
{
  "success": true,
  "data": {
    "colorSystems": [
      {
        "key": "MARD",
        "name": "MARD"
      },
      {
        "key": "COCO",
        "name": "COCO"
      },
      {
        "key": "漫漫",
        "name": "漫漫"
      },
      {
        "key": "盼盼",
        "name": "盼盼"
      },
      {
        "key": "咪小窝",
        "name": "咪小窝"
      }
    ],
    "palettes": [
      {
        "key": "168色",
        "name": "168色标准调色板",
        "colorCount": 168
      },
      {
        "key": "96色",
        "name": "96色精简调色板",
        "colorCount": 96
      }
    ]
  }
}
```

#### 字段说明
- `colorSystems`: 支持的颜色系统列表
  - `key`: 颜色系统标识符
  - `name`: 颜色系统显示名称
- `palettes`: 可用调色板列表
  - `colorCount`: 调色板包含的颜色数量

---

## 3. 图片转换 API

### POST `/api/v1/convert`

将上传的图片转换为拼豆像素数据。

#### 请求
```bash
curl -X POST http://localhost:3000/api/v1/convert \
  -F "image=@your_image.png" \
  -F "granularity=20" \
  -F "pixelationMode=average" \
  -F "selectedPalette=168色" \
  -F "selectedColorSystem=MARD"
```

#### 请求参数 (multipart/form-data)

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `image` | File | ✅ | - | 图片文件 (jpg, png, gif等) |
| `granularity` | string | ❌ | "20" | 像素化粒度 (5-200) |
| `pixelationMode` | string | ❌ | "average" | 像素化模式: "average"(平均) / "dominant"(主导) |
| `selectedPalette` | string | ❌ | "168色" | 调色板选择 |
| `selectedColorSystem` | string | ❌ | "MARD" | 颜色系统 |
| `similarityThreshold` | string | ❌ | "8" | 颜色相似度阈值 (1-20) |

#### 响应
```json
{
  "success": true,
  "data": {
    "gridDimensions": {
      "N": 20,
      "M": 20
    },
    "pixelData": [
      [
        {"key": "T1", "color": "#FFFFFF"},
        {"key": "T26", "color": "#E7002F"}
      ]
    ],
    "colorCounts": {
      "#FFFFFF": {"count": 231, "color": "#FFFFFF"},
      "#E7002F": {"count": 144, "color": "#E7002F"}
    },
    "totalBeadCount": 400,
    "activeBeadPalette": [
      {"key": "T1", "color": "#FFFFFF"},
      {"key": "T26", "color": "#E7002F"}
    ],
    "processingParams": {
      "granularity": 20,
      "similarityThreshold": 8,
      "pixelationMode": "average",
      "selectedPalette": "168色",
      "selectedColorSystem": "MARD"
    },
    "imageInfo": {
      "originalWidth": 400,
      "originalHeight": 400,
      "aspectRatio": 1
    }
  }
}
```

#### 字段说明
- `gridDimensions`: 网格尺寸
  - `N`: 横向网格数
  - `M`: 纵向网格数
- `pixelData`: 二维像素数据数组
  - `key`: 珠子颜色编号
  - `color`: 珠子颜色十六进制值
- `colorCounts`: 颜色使用统计
- `totalBeadCount`: 总珠子数量
- `activeBeadPalette`: 使用的调色板颜色
- `processingParams`: 处理参数记录
- `imageInfo`: 原图信息

#### 错误响应
```json
{
  "success": false,
  "error": "图片处理失败",
  "details": "Invalid image format"
}
```

---

## 4. 图纸下载 API

### POST `/api/v1/download`

基于转换结果生成并返回拼豆图纸PNG文件。

#### 请求
```bash
curl -X POST http://localhost:3000/api/v1/download \
  -H "Content-Type: application/json" \
  -d '{
    "pixelData": [...],
    "gridDimensions": {"N": 20, "M": 20},
    "colorCounts": {...},
    "totalBeadCount": 400,
    "activeBeadPalette": [...],
    "selectedColorSystem": "MARD",
    "downloadOptions": {
      "showGrid": true,
      "gridInterval": 10,
      "showCoordinates": true,
      "gridLineColor": "#CCCCCC",
      "includeStats": true,
      "filename": "my_pattern"
    }
  }'
```

#### 请求体参数 (JSON)

| 参数名 | 类型 | 必需 | 说明 |
|--------|------|------|------|
| `pixelData` | Array | ✅ | 从convert API获取的像素数据 |
| `gridDimensions` | Object | ✅ | 网格尺寸 {N, M} |
| `colorCounts` | Object | ✅ | 颜色统计数据 |
| `totalBeadCount` | Number | ✅ | 总珠子数量 |
| `activeBeadPalette` | Array | ✅ | 活跃调色板 |
| `selectedColorSystem` | String | ✅ | 颜色系统 |
| `downloadOptions` | Object | ❌ | 下载选项配置 |

#### downloadOptions 配置

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showGrid` | Boolean | true | 显示网格线 |
| `gridInterval` | Number | 10 | 网格间隔 |
| `showCoordinates` | Boolean | true | 显示坐标 |
| `gridLineColor` | String | "#CCCCCC" | 网格线颜色 |
| `includeStats` | Boolean | true | 包含统计信息 |
| `filename` | String | "perler_pattern" | 文件名前缀 |

#### 响应
- **成功**: 返回PNG图片文件 (Content-Type: image/png)
- **失败**: 返回JSON错误信息

```json
{
  "success": false,
  "error": "缺少必要的数据参数"
}
```

#### 生成的图纸特性
- 高分辨率PNG格式
- 包含颜色编号标记
- 可选网格线和坐标
- 颜色统计表
- 标题信息

---

## 5. API根信息

### GET `/api/v1/`

获取API基本信息和文档链接。

#### 请求
```bash
curl -X GET http://localhost:3000/api/v1/
```

#### 响应
```json
{
  "name": "拼豆图纸生成器 API",
  "version": "1.0.0",
  "description": "将图片转换为拼豆图纸的RESTful API服务",
  "endpoints": {
    "status": "GET /api/v1/status",
    "palette": "GET /api/v1/palette",
    "convert": "POST /api/v1/convert",
    "download": "POST /api/v1/download"
  },
  "documentation": "请参考 API_DOCUMENTATION.md",
  "support": {
    "maxFileSize": "10MB",
    "formats": ["jpg", "jpeg", "png", "gif", "bmp", "webp"],
    "colorSystems": ["MARD", "COCO", "漫漫", "盼盼", "咪小窝"]
  }
}
```

---

## 完整工作流程示例

### Python 示例
```python
import requests
import json

BASE_URL = "http://localhost:3000/api/v1"

# 1. 检查服务状态
status = requests.get(f"{BASE_URL}/status")
print(f"服务状态: {status.json()['status']}")

# 2. 获取调色板信息
palette_resp = requests.get(f"{BASE_URL}/palette")
color_systems = palette_resp.json()['data']['colorSystems']
color_system = color_systems[0]['key']  # 使用第一个颜色系统

# 3. 转换图片
with open('your_image.png', 'rb') as f:
    files = {'image': ('image.png', f, 'image/png')}
    form_data = {
        'granularity': '20',
        'pixelationMode': 'average',
        'selectedPalette': '168色',
        'selectedColorSystem': color_system
    }

    convert_resp = requests.post(
        f"{BASE_URL}/convert",
        files=files,
        data=form_data
    )

convert_data = convert_resp.json()['data']

# 4. 下载图纸
download_data = {
    "pixelData": convert_data['pixelData'],
    "gridDimensions": convert_data['gridDimensions'],
    "colorCounts": convert_data['colorCounts'],
    "totalBeadCount": convert_data['totalBeadCount'],
    "activeBeadPalette": convert_data['activeBeadPalette'],
    "selectedColorSystem": color_system,
    "downloadOptions": {
        "showGrid": True,
        "gridInterval": 10,
        "showCoordinates": True,
        "includeStats": True,
        "filename": "my_pattern"
    }
}

download_resp = requests.post(
    f"{BASE_URL}/download",
    json=download_data
)

with open('pattern.png', 'wb') as f:
    f.write(download_resp.content)

print("图纸生成完成!")
```

### JavaScript 示例
```javascript
const BASE_URL = 'http://localhost:3000/api/v1';

async function generatePattern(imageFile) {
  try {
    // 1. 获取调色板信息
    const paletteResp = await fetch(`${BASE_URL}/palette`);
    const paletteData = await paletteResp.json();
    const colorSystem = paletteData.data.colorSystems[0].key;

    // 2. 转换图片
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('granularity', '20');
    formData.append('pixelationMode', 'average');
    formData.append('selectedPalette', '168色');
    formData.append('selectedColorSystem', colorSystem);

    const convertResp = await fetch(`${BASE_URL}/convert`, {
      method: 'POST',
      body: formData
    });

    const convertData = (await convertResp.json()).data;

    // 3. 下载图纸
    const downloadData = {
      pixelData: convertData.pixelData,
      gridDimensions: convertData.gridDimensions,
      colorCounts: convertData.colorCounts,
      totalBeadCount: convertData.totalBeadCount,
      activeBeadPalette: convertData.activeBeadPalette,
      selectedColorSystem: colorSystem,
      downloadOptions: {
        showGrid: true,
        gridInterval: 10,
        showCoordinates: true,
        includeStats: true,
        filename: 'my_pattern'
      }
    };

    const downloadResp = await fetch(`${BASE_URL}/download`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(downloadData)
    });

    const blob = await downloadResp.blob();

    // 下载文件
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pattern.png';
    a.click();
    URL.revokeObjectURL(url);

  } catch (error) {
    console.error('生成图纸失败:', error);
  }
}
```

---

## 错误处理

### 常见错误代码

| 状态码 | 错误类型 | 说明 |
|--------|----------|------|
| 200 | 成功 | 请求处理成功 |
| 400 | 请求错误 | 参数错误或格式不正确 |
| 413 | 文件过大 | 文件大小超过10MB限制 |
| 415 | 格式不支持 | 图片格式不受支持 |
| 500 | 服务器错误 | 内部处理错误 |

### 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息",
  "code": "ERROR_CODE"
}
```

---

## 性能和限制

### 系统限制
- **最大文件大小**: 10MB
- **最大分辨率**: 推荐不超过 2000x2000 像素
- **最大粒度**: 200
- **并发限制**: 建议同时处理不超过5个请求
- **超时设置**: 30秒

### 性能优化建议
1. **图片预处理**: 建议将图片压缩到合适尺寸
2. **粒度选择**: 粒度越高处理时间越长，建议10-50之间
3. **颜色系统**: 不同颜色系统处理速度基本相同
4. **批量处理**: 避免同时提交大量请求

### 缓存策略
- 调色板信息会被缓存
- 颜色映射关系会被缓存
- 转换结果不会被缓存

---

## 开发和测试

### 本地开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# API将在 http://localhost:3000 启动
```

### API测试工具
项目提供了完整的测试脚本：

1. **调试测试**: `python debug_api.py`
2. **完整流程测试**: `python test_complete_workflow.py`
3. **下载功能测试**: `python test_download_api.py`

### 监控和日志
- API响应时间会在状态端点中报告
- 错误日志会输出到控制台
- 内存使用情况实时监控

---

## 更新历史

### v1.0.0 (2025-06-02)
- ✅ 初始版本发布
- ✅ 支持图片转换功能
- ✅ 支持多种颜色系统
- ✅ 支持高质量图纸生成
- ✅ 完整的API文档
- ✅ 全面的测试套件

---

## 技术支持

### 联系方式
- 项目文档: `README.md`
- API测试: `debug_api.py`
- 问题反馈: GitHub Issues

### 开源许可
本项目采用 MIT 许可证，详见 `LICENSE` 文件。

---

**最后更新**: 2025年6月2日
**API版本**: v1.0.0
**文档版本**: v1.0.0
