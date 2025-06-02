# 拼豆图纸生成器 API 文档

## 概述

拼豆图纸生成器 API 是一个基于 Next.js 构建的 RESTful API，提供图片转换为拼豆图纸的完整功能。支持多种颜色系统、调色板管理、自定义调色板、图片处理和高质量图纸生成。

**基础信息:**
- 基础URL: `http://localhost:3000/api`
- 数据格式: JSON
- 编码: UTF-8
- 最大文件大小: 10MB
- 支持图片格式: jpg, jpeg, png, gif, bmp, webp
- 默认调色板: 291色
- 支持自定义调色板: ✅

## API 端点总览

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/status` | GET | 获取API服务状态 | ✅ |
| `/palette` | GET/POST | 获取调色板信息/验证自定义调色板 | ✅ |
| `/convert` | GET/POST | 获取接口文档/图片转换为像素数据 | ✅ |
| `/download` | GET/POST | 获取接口文档/生成并下载图纸文件 | ✅ |
| `/` | GET | API根信息和完整文档 | ✅ |

## 最新功能特性

- ✅ **291色完整调色板**: 支持5种色号系统 (MARD, COCO, 漫漫, 盼盼, 咪小窝)
- ✅ **自定义调色板**: 支持用户上传的调色板，兼容多种格式
- ✅ **调色板验证**: 实时验证自定义调色板的格式和颜色值
- ✅ **新格式支持**: 支持v3.0版本的调色板导出格式
- ✅ **旧格式兼容**: 向后兼容旧版本的调色板格式

## 自定义调色板功能详解

### 📌 功能概述
自定义调色板功能允许用户使用自己选择的颜色来生成拼豆图纸，而不局限于默认的291色调色板。这对于特定项目、品牌配色或有限颜色数量的创作特别有用。

### 🔧 支持的调色板格式

#### 新格式 (v3.0) - 推荐使用
```json
{
  "version": "3.0",
  "selectedHexValues": ["#E7002F", "#FEFFFF", "#00FF00"],
  "exportDate": "2025-06-03T16:09:31.956Z",
  "totalColors": 3
}
```

#### 旧格式 - 向后兼容
```json
[
  {"key": "红色", "hex": "#E7002F"},
  {"key": "白色", "hex": "#FEFFFF"},
  {"key": "绿色", "hex": "#00FF00"}
]
```

### 🚀 使用流程

1. **调色板验证** → 使用 `POST /api/palette` 验证自定义调色板
2. **图片转换** → 使用 `POST /api/convert` 并传入自定义调色板
3. **图纸生成** → 使用 `POST /api/download` 生成最终图纸

### ⚠️ 注意事项

- **颜色数量**: 建议使用3-20种颜色，太少可能导致细节丢失，太多可能增加制作复杂度
- **颜色对比**: 确保颜色之间有足够的对比度，避免相似颜色导致视觉混乱
- **Hex格式**: 所有颜色值必须是有效的hex格式 (#RRGGBB)
- **性能考虑**: 自定义调色板可能略微影响转换速度，属于正常现象

---

## 1. 状态检查 API

### GET `/api/status`

获取API服务的运行状态和系统信息。

#### 请求示例
```python
import requests

response = requests.get("http://localhost:3000/api/status")
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

## 2. 调色板管理 API

### GET `/api/palette`

获取支持的颜色系统和调色板信息，支持详细信息查询。

#### 请求参数 (Query Parameters)

| 参数名 | 类型 | 必需 | 默认值 | 说明 |
|--------|------|------|--------|------|
| `colorSystem` | string | ❌ | "MARD" | 指定颜色系统 |
| `detailed` | string | ❌ | "false" | 是否返回详细颜色信息 |

#### 基础调色板信息请求
```python
import requests

response = requests.get("http://localhost:3000/api/palette")
palette_data = response.json()
color_systems = palette_data['data']['colorSystems']
print(f"可用颜色系统: {[cs['key'] for cs in color_systems]}")
print(f"默认调色板: {palette_data['data']['defaultPalette']}")
print(f"支持自定义调色板: {palette_data['data']['supportsCustomPalette']}")
```

#### 基础响应示例
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

#### 详细调色板信息请求
```python
# 获取详细的颜色信息
response = requests.get("http://localhost:3000/api/palette?detailed=true&colorSystem=MARD")
detailed_data = response.json()
colors = detailed_data['data']['colors']
print(f"总颜色数: {detailed_data['data']['totalColors']}")
for color in colors[:5]:  # 显示前5个颜色
    print(f"色号: {color['key']}, 颜色: {color['hex']}")
```

#### 详细响应示例
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
      },
      {
        "key": "A02",
        "hex": "#FFFFD5",
        "rgb": {"r": 255, "g": 255, "b": 213},
        "colorSystem": "MARD"
      }
    ]
  }
}
```

### POST `/api/palette` - 自定义调色板验证

验证自定义调色板的格式和颜色值，支持新格式（v3.0）和旧格式。

#### 请求参数 (JSON Body)

**新格式 (v3.0) - 推荐使用:**
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

**旧格式 - 向后兼容:**
```json
{
  "colors": [
    {"key": "红色", "hex": "#E7002F"},
    {"key": "白色", "hex": "#FEFFFF"},
    {"key": "绿色", "hex": "#00FF00"}
  ]
}
```

#### 请求示例
```python
import requests

# 使用新格式验证自定义调色板
custom_palette = {
    "version": "3.0",
    "selectedHexValues": ["#E7002F", "#FEFFFF"],
    "exportDate": "2025-06-03T16:09:31.956Z",
    "totalColors": 2
}

response = requests.post(
    "http://localhost:3000/api/palette",
    json={"customPalette": custom_palette},
    headers={"Content-Type": "application/json"}
)

if response.status_code == 200:
    result = response.json()
    print(f"验证成功: {result['data']['totalColors']} 种颜色")
    for color in result['data']['validatedColors']:
        print(f"  {color['key']}: {color['hex']}")
else:
    print(f"验证失败: {response.json()['error']}")
```

#### 成功响应示例
```json
{
  "success": true,
  "data": {
    "validatedColors": [
      {
        "key": "#E7002F",
        "hex": "#E7002F",
        "rgb": {"r": 231, "g": 0, "b": 47}
      },
      {
        "key": "#FEFFFF",
        "hex": "#FEFFFF",
        "rgb": {"r": 254, "g": 255, "b": 255}
      }
    ],
    "totalColors": 2,
    "version": "3.0",
    "message": "自定义调色板验证成功"
  }
}
```

#### 错误响应示例
```json
{
  "success": false,
  "error": "颜色验证失败",
  "details": [
    "第1个颜色的hex值格式无效: #GGGGGG",
    "第3个颜色缺少必要的hex字段"
  ]
}
```

验证自定义调色板数据格式，支持自定义色板上传功能。

#### 请求体参数
```json
{
  "colors": [
    {
      "key": "CUSTOM01",
      "hex": "#FF0000"
    },
    {
      "key": "CUSTOM02",
      "hex": "#00FF00"
    }
  ]
}
```

#### 请求示例
```python
import requests

# 验证自定义调色板
custom_palette = {
    "colors": [
        {"key": "CUSTOM01", "hex": "#FF0000"},
        {"key": "CUSTOM02", "hex": "#00FF00"},
        {"key": "CUSTOM03", "hex": "#0000FF"}
    ]
}

response = requests.post(
    "http://localhost:3000/api/palette",
    json=custom_palette,
    headers={"Content-Type": "application/json"}
)

result = response.json()
if result['success']:
    print(f"验证成功，共 {result['data']['totalColors']} 种颜色")
else:
    print(f"验证失败: {result['error']}")
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "validatedColors": [
      {
        "key": "CUSTOM01",
        "hex": "#FF0000",
        "rgb": {"r": 255, "g": 0, "b": 0}
      }
    ],
    "totalColors": 3,
    "message": "自定义调色板验证成功"
  }
}
```

---

## 3. 图片转换 API

### GET `/api/convert` - 获取接口文档

获取图片转换API的详细文档和参数说明。

#### 请求示例
```python
import requests

response = requests.get("http://localhost:3000/api/convert")
doc = response.json()
print(f"接口: {doc['endpoint']}")
print(f"描述: {doc['description']}")
```

### POST `/api/convert` - 图片转换

将图片转换为拼豆像素数据，支持默认调色板和自定义调色板。

#### 请求参数 (multipart/form-data)

| 参数名 | 类型 | 必需 | 默认值 | 范围 | 说明 |
|--------|------|------|--------|------|------|
| `image` | File | ✅ | - | - | 图片文件 (jpg, png, gif, bmp, webp) |
| `granularity` | string | ❌ | "50" | 1-200 | 像素化粒度，值越大图片越精细 |
| `similarityThreshold` | string | ❌ | "30" | 0-100 | 颜色相似度阈值，控制颜色合并程度 |
| `pixelationMode` | string | ❌ | "dominant" | dominant/average | 像素化模式：dominant=卡通模式, average=真实模式 |
| `selectedPalette` | string | ❌ | "291色" | 291色/自定义 | 调色板选择 |
| `selectedColorSystem` | string | ❌ | "MARD" | MARD/COCO/漫漫/盼盼/咪小窝 | 色号系统 |
| `customPalette` | string | ❌ | - | - | 自定义调色板JSON数据（当selectedPalette为"自定义"时使用） |

#### 自定义调色板格式

**新格式 (v3.0) - 推荐:**
```json
{
  "version": "3.0",
  "selectedHexValues": ["#E7002F", "#FEFFFF", "#00FF00"],
  "exportDate": "2025-06-03T16:09:31.956Z",
  "totalColors": 3
}
```

**旧格式 - 向后兼容:**
```json
[
  {"key": "红色", "hex": "#E7002F"},
  {"key": "白色", "hex": "#FEFFFF"},
  {"key": "绿色", "hex": "#00FF00"}
]
```

#### 参数详细说明

**granularity (粒度)**
- 控制图纸的精细程度，数值越大越精细
- 推荐范围：10-50（日常使用），50-100（精细作品），100+（超精细作品）
- 影响最终珠子数量和制作难度

**similarityThreshold (相似度阈值)**
- 控制颜色合并的激进程度，用于减少颜色种类
- 0：不合并任何颜色，保持原始色彩丰富度
- 30：推荐值，适度合并相近颜色
- 50+：积极合并，显著减少颜色种类

**pixelationMode (像素化模式)**
- `dominant`：主色模式，保持图像轮廓清晰，适合卡通、logo等
- `average`：平均色模式，色彩过渡自然，适合照片、风景等

**selectedColorSystem (色号系统)**
- 支持291色完整调色板
- 各品牌色号对照：MARD、COCO、漫漫、盼盼、咪小窝

#### 使用默认调色板的请求示例
```python
import requests

# 使用默认291色调色板
with open('test_image.png', 'rb') as f:
    files = {'image': ('image.png', f, 'image/png')}
    form_data = {
        'granularity': '50',           # 图纸粒度
        'similarityThreshold': '30',   # 颜色合并阈值
        'pixelationMode': 'dominant',  # 像素化模式
        'selectedPalette': '291色',    # 使用默认调色板
        'selectedColorSystem': 'MARD'  # 色号系统
    }

    response = requests.post(
        "http://localhost:3000/api/convert",
        files=files,
        data=form_data
    )
```

#### 使用自定义调色板的请求示例
```python
import requests
import json

# 自定义调色板数据
custom_palette = {
    "version": "3.0",
    "selectedHexValues": ["#E7002F", "#FEFFFF", "#00FF00"],
    "exportDate": "2025-06-03T16:09:31.956Z",
    "totalColors": 3
}

with open('test_image.png', 'rb') as f:
    files = {'image': ('image.png', f, 'image/png')}
    form_data = {
        'granularity': '40',
        'selectedPalette': '自定义',
        'customPalette': json.dumps(custom_palette)  # 转换为JSON字符串
    }

    response = requests.post(
        "http://localhost:3000/api/convert",
        files=files,
        data=form_data
    )

#### 成功响应示例

**使用默认调色板的响应:**
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
      "#FFFFFF": {"count": 369, "color": "#FFFFFF"},
      "#E7002F": {"count": 225, "color": "#E7002F"},
      "#FD7C72": {"count": 30, "color": "#FD7C72"},
      "#F3C1C0": {"count": 1, "color": "#F3C1C0"}
    },
    "totalBeadCount": 625,
    "activeBeadPalette": [
      {"key": "#FFFFFF", "hex": "#FFFFFF", "rgb": {"r": 255, "g": 255, "b": 255}},
      {"key": "#E7002F", "hex": "#E7002F", "rgb": {"r": 231, "g": 0, "b": 47}}
    ],
    "processingParams": {
      "granularity": 50,
      "similarityThreshold": 30,
      "pixelationMode": "dominant",
      "selectedPalette": "291色",
      "selectedColorSystem": "MARD",
      "paletteSource": "default"
    },
    "imageInfo": {
      "originalWidth": 500,
      "originalHeight": 500,
      "processedWidth": 25,
      "processedHeight": 25
    }
  }
}
```

**使用自定义调色板的响应:**
```json
{
  "success": true,
  "data": {
    "gridDimensions": {
      "N": 20,
      "M": 20,
      "width": 20,
      "height": 20
    },
    "pixelData": [
      [
        {"key": "#FFFFFF", "color": "#FFFFFF"},
        {"key": "#FF0000", "color": "#FF0000"}
      ]
    ],
    "colorCounts": {
      "#FFFFFF": {"count": 256, "color": "#FFFFFF"},
      "#FF0000": {"count": 144, "color": "#FF0000"}
    },
    "totalBeadCount": 400,
    "activeBeadPalette": [
      {"key": "#FFFFFF", "hex": "#FFFFFF", "rgb": {"r": 255, "g": 255, "b": 255}},
      {"key": "#FF0000", "hex": "#FF0000", "rgb": {"r": 255, "g": 0, "b": 0}}
    ],
    "processingParams": {
      "granularity": 40,
      "selectedPalette": "自定义",
      "paletteSource": "custom",
      "customPaletteColors": 3
    }
  }
}
```

#### 新增响应字段说明

- **`paletteSource`**: 指示调色板来源 ("default" 或 "custom")
- **`customPaletteColors`**: 自定义调色板的颜色数量（仅在使用自定义调色板时出现）
- **`imageInfo`**: 包含原始图片和处理后的尺寸信息
    },
    "imageInfo": {
      "originalWidth": 800,
      "originalHeight": 600,
      "aspectRatio": 0.75
    }
  }
}
```

#### 字段说明
- `gridDimensions`: 网格尺寸
  - `N`: 横向珠子数量
  - `M`: 纵向珠子数量
- `pixelData`: 二维像素数据数组
  - `key`: 珠子色号（根据选择的色号系统）
  - `color`: 珠子颜色十六进制值
- `colorCounts`: 颜色使用统计，便于购买珠子
- `totalBeadCount`: 总珠子数量
- `activeBeadPalette`: 实际使用的调色板颜色
- `processingParams`: 处理参数记录，便于复现
- `imageInfo`: 原图信息

---

## 4. 图纸下载 API

### GET `/api/download` - 获取接口文档

获取图纸下载API的详细文档和参数说明。

### POST `/api/download` - 生成图纸

生成高质量的拼豆图纸PNG文件，支持网格线、坐标系、颜色统计等功能。**已优化边距显示，确保图片布局平衡专业。**

#### 请求参数 (JSON Body)
```json
{
  "pixelData": "Array<Array<{key: string, color: string}>>",
  "gridDimensions": "{N: number, M: number, width: number, height: number}",
  "colorCounts": "Object<string, {color: string, count: number}>",
  "totalBeadCount": "number",
  "activeBeadPalette": "Array<{key: string, hex: string, rgb: object}>",
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

#### 完整工作流示例

**步骤1: 图片转换**
```python
import requests
import json

# 1. 转换图片
with open('test_image.png', 'rb') as f:
    files = {'image': ('image.png', f, 'image/png')}
    form_data = {
        'granularity': '50',
        'selectedPalette': '291色',
        'selectedColorSystem': 'MARD'
    }

    convert_response = requests.post(
        "http://localhost:3000/api/convert",
        files=files,
        data=form_data
    )

convert_data = convert_response.json()['data']
```

**步骤2: 生成图纸**
```python
# 2. 使用转换结果生成图纸
download_data = {
  "pixelData": convert_data['pixelData'],
  "gridDimensions": convert_data['gridDimensions'],
  "colorCounts": convert_data['colorCounts'],
  "totalBeadCount": convert_data['totalBeadCount'],
  "activeBeadPalette": convert_data['activeBeadPalette'],
  "selectedColorSystem": "MARD",
  "downloadOptions": {
      "cellSize": 30,
      "showGrid": True,
      "gridInterval": 10,
      "showCoordinates": True,
      "includeStats": True,
      "filename": "my_perler_pattern.png"
  }
}

download_response = requests.post(
    "http://localhost:3000/api/download",
    json=download_data,
    headers={"Content-Type": "application/json"}
)

# 3. 保存图纸文件
if download_response.status_code == 200:
    with open('generated_pattern.png', 'wb') as f:
        f.write(download_response.content)
    print("图纸下载成功!")
else:
    print(f"下载失败: {download_response.status_code}")
```

**使用自定义调色板的完整示例:**
```python
import requests
import json

# 1. 准备自定义调色板
custom_palette = {
    "version": "3.0",
    "selectedHexValues": ["#E7002F", "#FEFFFF", "#00FF00", "#0000FF"],
    "exportDate": "2025-06-03T16:09:31.956Z",
    "totalColors": 4
}

# 2. 转换图片（使用自定义调色板）
with open('test_image.png', 'rb') as f:
    files = {'image': ('image.png', f, 'image/png')}
    form_data = {
        'granularity': '40',
        'selectedPalette': '自定义',
        'customPalette': json.dumps(custom_palette)
    }

    convert_response = requests.post(
        "http://localhost:3000/api/convert",
        files=files,
        data=form_data
    )

convert_data = convert_response.json()['data']

# 3. 生成图纸
download_data = {
    "pixelData": convert_data['pixelData'],
    "gridDimensions": convert_data['gridDimensions'],
    "colorCounts": convert_data['colorCounts'],
    "totalBeadCount": convert_data['totalBeadCount'],
    "activeBeadPalette": convert_data['activeBeadPalette'],
    "downloadOptions": {
        "cellSize": 25,
        "showGrid": True,
        "includeStats": True,
        "filename": "custom_palette_pattern.png"
    }
}

download_response = requests.post(
    "http://localhost:3000/api/download",
    json=download_data
)

# 4. 保存文件
if download_response.status_code == 200:
    with open('custom_palette_pattern.png', 'wb') as f:
        f.write(download_response.content)
    print(f"自定义调色板图纸生成成功!")
    print(f"使用了 {convert_data['processingParams']['customPaletteColors']} 种自定义颜色")
else:
    print(f"生成失败: {download_response.status_code}")
```
        "gridInterval": 5,
        "showCoordinates": True,
        "gridLineColor": "#FF0000",
        "includeStats": True,
        "filename": "my_pattern.png"
    }
}

response = requests.post(
    "http://localhost:3000/api/download",
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

## 6. 自定义色板管理

虽然API本身不提供文件上传下载端点，但支持通过前端界面进行自定义色板的导入导出管理。

### 自定义色板导出格式

```json
{
  "version": "3.0",
  "selectedHexValues": [
    "#FAF4C8",
    "#FFFFD5",
    "#FEFF8B",
    "#FBED56"
  ],
  "exportDate": "2025-06-02T11:19:32.378Z",
  "totalColors": 4
}
```

### 支持的色板管理功能

1. **色板编辑器**: 通过Web界面选择/取消选择颜色
2. **预设色板**: 支持168色、144色、96色等预设
3. **搜索功能**: 按色号搜索特定颜色
4. **分组显示**: 按色号前缀自动分组
5. **批量操作**: 全选、全不选、按组操作
6. **导入导出**: JSON格式的色板配置文件

### 色号系统对照

API支持5种主流拼豆品牌的色号系统，包含291种颜色的完整映射：

| 颜色 | MARD | COCO | 漫漫 | 盼盼 | 咪小窝 |
|------|------|------|------|------|--------|
| #FAF4C8 | A01 | E02 | E2 | 65 | 77 |
| #FFFFD5 | A02 | E01 | B1 | 2 | 2 |
| #FEFF8B | A03 | E05 | B2 | 28 | 28 |

### 颜色相似度合并算法

`similarityThreshold` 参数控制颜色合并的算法行为：

- **阈值 0-10**: 几乎不合并，保持最多颜色种类
- **阈值 10-30**: 合并非常相近的颜色，推荐日常使用
- **阈值 30-50**: 积极合并相似颜色，显著减少种类
- **阈值 50+**: 大幅合并，适合简化色彩的设计

合并过程使用RGB欧氏距离算法：
```
distance = √[(r1-r2)² + (g1-g2)² + (b1-b2)²]
```

当两个颜色的距离小于阈值时，低频颜色会被合并到高频颜色中。

以下是一个完整的Python示例，展示从图片转换到下载图纸的完整流程：

```python
#!/usr/bin/env python3
import requests
import base64
import os

BASE_URL = "http://localhost:3000/api"

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
    available_palettes = palette_data['data']['availablePalettes']

    # 选择颜色系统（默认使用第一个）
    color_system = color_systems[0]['key']
    palette_name = available_palettes[0]

    print(f"✅ 使用颜色系统: {color_system}")
    print(f"✅ 使用调色板: {palette_name}")
    print(f"📈 总颜色数: {palette_data['data']['totalColors']}")

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
            "gridInterval": 10,
            "showCoordinates": True,
            "includeStats": True,
            "filename": "my_perler_pattern.png"
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

### Python 示例（完整工作流程）
```python
import requests
import json
from pathlib import Path

BASE_URL = "http://localhost:3000/api"

def generate_perler_pattern(image_path, output_path="pattern.png"):
    """
    完整的拼豆图纸生成工作流程
    """
    try:
        print("🔍 步骤 1: 检查API服务状态...")

        # 1. 检查服务状态
        status_resp = requests.get(f"{BASE_URL}/status")
        if status_resp.status_code != 200:
            raise Exception(f"API服务不可用: {status_resp.status_code}")

        status_data = status_resp.json()
        print(f"✅ 服务状态: {status_data['status']}")
        print(f"📊 运行时间: {status_data.get('uptime', 0):.2f}秒")

        print("\n🎨 步骤 2: 获取调色板信息...")

        # 2. 获取调色板信息
        palette_resp = requests.get(f"{BASE_URL}/palette")
        if palette_resp.status_code != 200:
            raise Exception(f"获取调色板失败: {palette_resp.status_code}")

        palette_data = palette_resp.json()['data']
        color_systems = palette_data['colorSystems']
        available_palettes = palette_data['availablePalettes']

        # 选择颜色系统（默认使用第一个）
        color_system = color_systems[0]['key']
        palette_name = available_palettes[0]

        print(f"✅ 使用颜色系统: {color_system}")
        print(f"✅ 使用调色板: {palette_name}")
        print(f"📈 总颜色数: {palette_data['totalColors']}")

        print(f"\n🖼️ 步骤 3: 转换图片 '{image_path}'...")
        # 3. 转换图片
        if not Path(image_path).exists():
            raise FileNotFoundError(f"图片文件不存在: {image_path}")

        with open(image_path, 'rb') as f:
            files = {'image': ('image.png', f, 'image/png')}
            form_data = {
                'granularity': '25',  # 中等细度
                'pixelationMode': 'average',
                'selectedPalette': palette_name,
                'selectedColorSystem': color_system,
                'similarityThreshold': '0.8'  # 中等相似度阈值
            }

            convert_resp = requests.post(
                f"{BASE_URL}/convert",
                files=files,
                data=form_data
            )

        if convert_resp.status_code != 200:
            print(f"❌ 转换失败: {convert_resp.status_code}")
            return

        convert_result = convert_resp.json()['data']
        print(f"✅ 转换成功! 网格尺寸: {convert_result['gridDimensions']}")

        print("📥 步骤 4: 下载图纸...")
        # 4. 下载图纸
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
                "gridInterval": 10,
                "showCoordinates": True,
                "includeStats": True,
                "filename": "my_perler_pattern.png"
            }
        }

        download_resp = requests.post(
            f"{BASE_URL}/download",
            json=download_data,
            headers={"Content-Type": "application/json"}
        )

        if download_resp.status_code == 200:
            with open(output_path, 'wb') as f:
                f.write(download_resp.content)
            print(f"✅ 图纸下载成功! 文件: {output_path}")
        else:
            print(f"❌ 下载失败: {download_resp.status_code}")

    except requests.exceptions.RequestException as e:
        print(f"❌ 网络请求错误: {e}")
    except Exception as e:
        print(f"❌ 处理错误: {e}")

# 使用示例
if __name__ == "__main__":
    generate_perler_pattern('your_image.png', 'my_pattern.png')
```

### JavaScript/Node.js 示例（完整工作流程）
```javascript
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const BASE_URL = 'http://localhost:3000/api';

async function generatePerlerPattern(imagePath, outputPath = 'pattern.png') {
    try {
        console.log('🔍 步骤 1: 检查API服务状态...');

        // 1. 检查服务状态
        const statusResp = await fetch(`${BASE_URL}/status`);
        if (!statusResp.ok) {
            throw new Error(`API服务不可用: ${statusResp.status}`);
        }

        const statusData = await statusResp.json();
        console.log(`✅ 服务状态: ${statusData.status}`);
        console.log(`📊 运行时间: ${statusData.uptime?.toFixed(2)}秒`);

        console.log('\n🎨 步骤 2: 获取调色板信息...');

        // 2. 获取调色板信息
        const paletteResp = await fetch(`${BASE_URL}/palette`);
        if (!paletteResp.ok) {
            throw new Error(`获取调色板失败: ${paletteResp.status}`);
        }

        const paletteData = (await paletteResp.json()).data;
        const colorSystem = paletteData.colorSystems[0].key;
        const paletteName = paletteData.availablePalettes[0];

        console.log(`✅ 使用颜色系统: ${colorSystem}`);
        console.log(`✅ 使用调色板: ${paletteName}`);
        console.log(`📈 总颜色数: ${paletteData.totalColors}`);

        console.log(`\n🖼️ 步骤 3: 转换图片 '${imagePath}'...`);

        // 3. 转换图片
        if (!fs.existsSync(imagePath)) {
            throw new Error(`图片文件不存在: ${imagePath}`);
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(imagePath));
        formData.append('granularity', '25');
        formData.append('pixelationMode', 'average');
        formData.append('selectedPalette', paletteName);
        formData.append('selectedColorSystem', colorSystem);
        formData.append('similarityThreshold', '0.8');

        const convertResp = await fetch(`${BASE_URL}/convert`, {
            method: 'POST',
            body: formData
        });

        if (!convertResp.ok) {
            const errorData = await convertResp.json();
            throw new Error(`图片转换失败: ${errorData.error || '未知错误'}`);
        }

        const convertData = (await convertResp.json()).data;

        console.log('✅ 转换完成!');
        console.log(`📐 网格尺寸: ${convertData.gridDimensions.width}x${convertData.gridDimensions.height}`);
        console.log(`🔢 总珠子数: ${convertData.totalBeadCount}`);
        console.log(`🎨 使用颜色数: ${Object.keys(convertData.colorCounts).length}`);

        console.log('\n📥 步骤 4: 生成并下载图纸');

        // 4. 下载图纸
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
                filename: path.parse(outputPath).name
            }
        };

        const downloadResp = await fetch(`${BASE_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(downloadData)
        });

        if (!downloadResp.ok) {
            throw new Error(`图纸生成失败: ${downloadResp.status}`);
        }

        // 保存文件
        const buffer = await downloadResp.arrayBuffer();
        fs.writeFileSync(outputPath, Buffer.from(buffer));

        const fileSize = buffer.byteLength / 1024; // KB
        console.log('✅ 图纸生成完成!');
        console.log(`💾 保存到: ${outputPath}`);
        console.log(`📁 文件大小: ${fileSize.toFixed(1)} KB`);

        return {
            success: true,
            outputPath: outputPath,
            gridDimensions: convertData.gridDimensions,
            totalBeads: convertData.totalBeadCount,
            colorsUsed: Object.keys(convertData.colorCounts).length,
            fileSize: fileSize
        };

    } catch (error) {
        console.error(`❌ 处理错误: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// 使用示例
async function main() {
    const result = await generatePerlerPattern('your_image.png', 'my_pattern.png');
    if (result.success) {
        console.log('\n🎉 成功生成拼豆图纸!');
        console.log('📊 统计信息:');
        console.log(`   - 网格尺寸: ${result.gridDimensions.width}x${result.gridDimensions.height}`);
        console.log(`   - 珠子总数: ${result.totalBeads}`);
        console.log(`   - 颜色数量: ${result.colorsUsed}`);
    } else {
        console.log(`❌ 生成失败: ${result.error}`);
    }
}

// 如果直接运行此文件
if (require.main === module) {
    main();
}

module.exports = { generatePerlerPattern };
```

### 浏览器端 JavaScript 示例
```javascript
const BASE_URL = 'http://localhost:3000/api';

class PerlerPatternGenerator {
    constructor() {
        this.baseUrl = BASE_URL;
    }

    async generateFromFileInput(fileInput, options = {}) {
        const file = fileInput.files[0];
        if (!file) {
            throw new Error('请选择图片文件');
        }

        const defaultOptions = {
            granularity: 25,
            pixelationMode: 'average',
            similarityThreshold: 0.8,
            downloadOptions: {
                showGrid: true,
                gridInterval: 10,
                showCoordinates: true,
                includeStats: true,
                filename: 'pattern'
            }
        };

        const config = { ...defaultOptions, ...options };

        try {
            // 获取调色板信息
            const paletteResp = await fetch(`${this.baseUrl}/palette`);
            const paletteData = (await paletteResp.json()).data;
            const colorSystem = paletteData.colorSystems[0].key;
            const paletteName = paletteData.availablePalettes[0];

            // 转换图片
            const formData = new FormData();
            formData.append('image', file);
            formData.append('granularity', config.granularity.toString());
            formData.append('pixelationMode', config.pixelationMode);
            formData.append('selectedPalette', paletteName);
            formData.append('selectedColorSystem', colorSystem);
            formData.append('similarityThreshold', config.similarityThreshold.toString());

            const convertResp = await fetch(`${this.baseUrl}/convert`, {
                method: 'POST',
                body: formData
            });

            if (!convertResp.ok) {
                const errorData = await convertResp.json();
                throw new Error(errorData.error || '转换失败');
            }

            const convertData = (await convertResp.json()).data;

            // 生成图纸
            const downloadData = {
                ...convertData,
                selectedColorSystem: colorSystem,
                downloadOptions: config.downloadOptions
            };

            const downloadResp = await fetch(`${this.baseUrl}/download`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(downloadData)
            });

            if (!downloadResp.ok) {
                throw new Error('图纸生成失败');
            }

            // 下载文件
            const blob = await downloadResp.blob();
            this.downloadBlob(blob, `${config.downloadOptions.filename}.png`);

            return {
                success: true,
                dimensions: convertData.gridDimensions,
                totalBeads: convertData.totalBeadCount,
                colorsUsed: Object.keys(convertData.colorCounts).length
            };

        } catch (error) {
            console.error('生成图纸失败:', error);
            throw error;
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// 使用示例
const generator = new PerlerPatternGenerator();

// HTML中的文件输入处理
document.getElementById('fileInput').addEventListener('change', async (event) => {
    try {
        const result = await generator.generateFromFileInput(event.target, {
            granularity: 30,
            downloadOptions: {
                showGrid: true,
                gridInterval: 5,
                filename: 'my_perler_pattern'
            }
        });

        console.log('生成成功:', result);
        alert(`图纸生成完成!\n尺寸: ${result.dimensions.width}x${result.dimensions.height}\n珠子数: ${result.totalBeads}`);
    } catch (error) {
        alert(`生成失败: ${error.message}`);
    }
});
```

---

## 高级错误处理和最佳实践

### 详细错误代码表

| 状态码 | 错误类型 | 常见原因 | 解决方案 |
|--------|----------|----------|----------|
| 200 | 成功 | 请求处理成功 | 无需处理 |
| 400 | 请求错误 | 参数缺失、格式错误、值超出范围 | 检查请求参数和格式 |
| 413 | 文件过大 | 文件大小超过10MB限制 | 压缩图片或选择较小文件 |
| 415 | 格式不支持 | 图片格式不受支持 | 使用支持的格式: jpg, jpeg, png, gif, bmp, webp |
| 422 | 处理错误 | 图片损坏、无法解析 | 检查图片文件完整性 |
| 429 | 请求过多 | 超出频率限制 | 减少请求频率，添加重试逻辑 |
| 500 | 服务器错误 | 内部处理错误、内存不足 | 重试请求，检查服务状态 |
| 503 | 服务不可用 | 服务器维护或过载 | 稍后重试 |

### 错误响应格式详解
```json
{
  "success": false,
  "error": "错误的简短描述",
  "details": "详细错误信息和可能的解决方案",
  "code": "ERROR_CODE",
  "timestamp": "2025-06-02T11:19:32.378Z",
  "requestId": "req_12345"
}
```

### Python 高级错误处理示例
```python
import requests
import time
import logging
import os
import gc
from typing import Dict, Any, Optional

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PerlerAPIClient:
    def __init__(self, base_url: str = "http://localhost:3000/api", timeout: int = 30):
        self.base_url = base_url
        self.timeout = timeout
        self.session = requests.Session()

    def _make_request(self, method: str, endpoint: str, **kwargs) -> Dict[Any, Any]:
        """带重试和错误处理的请求方法"""
        url = f"{self.base_url}{endpoint}"
        max_retries = 3
        backoff_factor = 1

        for attempt in range(max_retries):
            try:
                response = self.session.request(
                    method, url, timeout=self.timeout, **kwargs
                )

                # 检查HTTP状态码
                if response.status_code == 200:
                    return response.json() if 'json' in response.headers.get('content-type', '') else response
                elif response.status_code == 429:
                    # 频率限制，等待后重试
                    wait_time = backoff_factor * (2 ** attempt)
                    logger.warning(f"请求频率过高，等待 {wait_time} 秒后重试...")
                    time.sleep(wait_time)
                    continue
                elif response.status_code in [500, 502, 503, 504]:
                    # 服务器错误，重试
                    if attempt < max_retries - 1:
                        wait_time = backoff_factor * (2 ** attempt)
                        logger.warning(f"服务器错误 {response.status}，{wait_time} 秒后重试...")
                        time.sleep(wait_time)
                        continue

                # 处理其他错误
                error_data = {}
                try:
                    error_data = response.json()
                except:
                    pass

                raise requests.HTTPError(
                    f"请求失败 {response.status_code}: {error_data.get('error', response.text)}"
                )

            except requests.exceptions.Timeout:
                logger.error(f"请求超时 (第 {attempt + 1} 次尝试)")
                if attempt == max_retries - 1:
                    raise
                time.sleep(backoff_factor * (2 ** attempt))

            except requests.exceptions.ConnectionError:
                logger.error(f"连接错误 (第 {attempt + 1} 次尝试)")
                if attempt == max_retries - 1:
                    raise
                time.sleep(backoff_factor * (2 ** attempt))

        raise Exception(f"请求失败，已重试 {max_retries} 次")

    def check_service_health(self) -> Dict[str, Any]:
        """检查服务健康状态"""
        try:
            response = self._make_request('GET', '/status')
            return response
        except Exception as e:
            logger.error(f"服务健康检查失败: {e}")
            return {'status': 'unhealthy', 'error': str(e)}

    def convert_image_safe(self, image_path: str, **params) -> Optional[Dict[str, Any]]:
        """安全的图片转换方法，包含完整的错误处理"""
        try:
            # 验证文件
            if not os.path.exists(image_path):
                raise FileNotFoundError(f"图片文件不存在: {image_path}")

            file_size = os.path.getsize(image_path)
            if file_size > 10 * 1024 * 1024:  # 10MB
                raise ValueError(f"文件过大: {file_size / 1024 / 1024:.2f}MB，最大支持 10MB")

            # 验证参数
            granularity = params.get('granularity', 25)
            if not (1 <= granularity <= 200):
                raise ValueError(f"粒度值无效: {granularity}，范围应为 1-200")

            similarity_threshold = params.get('similarityThreshold', 0.8)
            if not (0.1 <= similarity_threshold <= 1.0):
                raise ValueError(f"相似度阈值无效: {similarity_threshold}，范围应为 0.1-1.0")

            # 获取调色板信息
            palette_data = self._make_request('GET', '/palette')['data']
            color_system = palette_data['colorSystems'][0]['key']
            palette_name = palette_data['availablePalettes'][0]

            # 准备请求数据
            with open(image_path, 'rb') as f:
                files = {'image': (os.path.basename(image_path), f, 'image/png')}
                form_data = {
                    'granularity': str(granularity),
                    'pixelationMode': params.get('pixelationMode', 'average'),
                    'selectedPalette': palette_name,
                    'selectedColorSystem': color_system,
                    'similarityThreshold': str(similarity_threshold)
                }

                response = self._make_request('POST', '/convert', files=files, data=form_data)

            return response['data']

        except FileNotFoundError as e:
            logger.error(f"文件错误: {e}")
            return None
        except ValueError as e:
            logger.error(f"参数错误: {e}")
            return None
        except requests.HTTPError as e:
            logger.error(f"HTTP错误: {e}")
            return None
        except Exception as e:
            logger.error(f"未知错误: {e}")
            return None

# 使用示例
def robust_pattern_generation():
    client = PerlerAPIClient()

    # 1. 健康检查
    health = client.check_service_health()
    if health.get('status') != 'healthy':
        print(f"⚠️ 服务状态异常: {health}")
        return

    # 2. 安全转换
    convert_result = client.convert_image_safe(
        'test_image.png',
        granularity=30,
        similarityThreshold=0.85,
        pixelationMode='average'
    )

    if convert_result:
        print(f"✅ 转换成功: {convert_result['gridDimensions']}")
    else:
        print("❌ 转换失败")
```

### JavaScript/Node.js 高级错误处理示例
```javascript
class PerlerAPIError extends Error {
    constructor(message, statusCode, details = null) {
        super(message);
        this.name = 'PerlerAPIError';
        this.statusCode = statusCode;
        this.details = details;
    }
}

class PerlerAPIClient {
    constructor(baseUrl = 'http://localhost:3000/api', timeout = 30000) {
        this.baseUrl = baseUrl;
        this.timeout = timeout;
    }

    async makeRequest(method, endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const maxRetries = 3;
        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), this.timeout);

                const response = await fetch(url, {
                    method,
                    signal: controller.signal,
                    ...options
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    return contentType?.includes('application/json')
                        ? await response.json()
                        : response;
                }

                // 处理特定错误状态码
                if (response.status === 429) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.warn(`请求频率过高，等待 ${waitTime}ms 后重试...`);
                    await this.sleep(waitTime);
                    continue;
                }

                if ([500, 502, 503, 504].includes(response.status) && attempt < maxRetries - 1) {
                    const waitTime = Math.pow(2, attempt) * 1000;
                    console.warn(`服务器错误 ${response.status}，${waitTime}ms 后重试...`);
                    await this.sleep(waitTime);
                    continue;
                }

                // 解析错误响应
                let errorData = {};
                try {
                    errorData = await response.json();
                } catch {
                    errorData = { error: await response.text() };
                }

                throw new PerlerAPIError(
                    errorData.error || `HTTP ${response.status}`,
                    response.status,
                    errorData.details
                );

            } catch (error) {
                lastError = error;

                if (error.name === 'AbortError') {
                    console.error(`请求超时 (第 ${attempt + 1} 次尝试)`);
                } else if (error instanceof PerlerAPIError) {
                    throw error; // 重新抛出API错误
                } else {
                    console.error(`网络错误 (第 ${attempt + 1} 次尝试):`, error.message);
                }

                if (attempt < maxRetries - 1) {
                    await this.sleep(Math.pow(2, attempt) * 1000);
                }
            }
        }

        throw lastError;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async validateImageFile(file) {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
        const maxSize = 10 * 1024 * 1024; // 10MB

        if (!allowedTypes.includes(file.type)) {
            throw new PerlerAPIError(
                `不支持的文件格式: ${file.type}`,
                415,
                `支持的格式: ${allowedTypes.join(', ')}`
            );
        }

        if (file.size > maxSize) {
            throw new PerlerAPIError(
                `文件过大: ${(file.size / 1024 / 1024).toFixed(2)}MB`,
                413,
                `最大支持 ${maxSize / 1024 / 1024}MB`
            );
        }
    }

    async convertImageSafe(imageFile, options = {}) {
        try {
            // 验证文件
            await this.validateImageFile(imageFile);

            // 验证参数
            const granularity = options.granularity || 25;
            if (granularity < 1 || granularity > 200) {
                throw new PerlerAPIError(
                    `粒度值无效: ${granularity}`,
                    400,
                    '范围应为 1-200'
                );
            }

            const similarityThreshold = options.similarityThreshold || 0.8;
            if (similarityThreshold < 0.1 || similarityThreshold > 1.0) {
                throw new PerlerAPIError(
                    `相似度阈值无效: ${similarityThreshold}`,
                    400,
                    '范围应为 0.1-1.0'
                );
            }

            // 获取调色板信息
            const paletteData = await this.makeRequest('GET', '/palette');
            const colorSystem = paletteData.data.colorSystems[0].key;
            const paletteName = paletteData.data.availablePalettes[0];

            // 准备表单数据
            const formData = new FormData();
            formData.append('image', imageFile);
            formData.append('granularity', granularity.toString());
            formData.append('pixelationMode', options.pixelationMode || 'average');
            formData.append('selectedPalette', paletteName);
            formData.append('selectedColorSystem', colorSystem);
            formData.append('similarityThreshold', similarityThreshold.toString());

            const response = await this.makeRequest('POST', '/convert', {
                body: formData
            });

            return response.data;

        } catch (error) {
            if (error instanceof PerlerAPIError) {
                console.error(`API错误: ${error.message}`, error.details);
                throw error;
            } else {
                console.error('未知错误:', error);
                throw new PerlerAPIError('图片转换失败', 500, error.message);
            }
        }
    }

    async checkServiceHealth() {
        try {
            const response = await this.makeRequest('GET', '/status');
            return response;
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

// 使用示例
async function robustPatternGeneration(imageFile) {
    const client = new PerlerAPIClient();

    try {
        // 1. 健康检查
        const health = await client.checkServiceHealth();
        if (health.status !== 'healthy') {
            console.warn('⚠️ 服务状态异常:', health);
        }

        // 2. 安全转换
        const result = await client.convertImageSafe(imageFile, {
            granularity: 30,
            similarityThreshold: 0.85,
            pixelationMode: 'average'
        });

        console.log('✅ 转换成功:', result.gridDimensions);
        return result;

    } catch (error) {
        if (error instanceof PerlerAPIError) {
            console.error(`❌ 转换失败 (${error.statusCode}): ${error.message}`);
            if (error.details) {
                console.error('详细信息:', error.details);
            }
        } else {
            console.error('❌ 系统错误:', error);
        }
    }
}
```

---

## 性能优化和限制

### 系统限制
- **最大文件大小**: 10MB
- **最大分辨率**: 推荐不超过 2000x2000 像素
- **最大粒度**: 200
- **并发限制**: 建议同时处理不超过5个请求
- **超时设置**: 30秒
- **内存限制**: 每个转换请求约占用 100-500MB 内存

### 性能优化指南

#### 1. 图片预处理优化
```python
from PIL import Image
import os

def optimize_image_for_api(input_path, output_path=None, max_size=(1500, 1500), quality=85):
    """
    为API优化图片：调整尺寸和压缩
    """
    if output_path is None:
        name, ext = os.path.splitext(input_path)
        output_path = f"{name}_optimized{ext}"

    with Image.open(input_path) as img:
        # 转换为RGB模式（去除透明度）
        if img.mode in ('RGBA', 'LA', 'P'):
            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
            img = rgb_img

        # 调整尺寸
        img.thumbnail(max_size, Image.Resampling.LANCZOS)

        # 保存为JPEG以减小文件大小
        img.save(output_path, 'JPEG', quality=quality, optimize=True)

        original_size = os.path.getsize(input_path)
        optimized_size = os.path.getsize(output_path)

        print(f"原始文件: {original_size / 1024:.1f} KB")
        print(f"优化后: {optimized_size / 1024:.1f} KB")
        print(f"压缩率: {(1 - optimized_size / original_size) * 100:.1f}%")

        return output_path

# 使用示例
optimized_path = optimize_image_for_api('large_image.png')
```

#### 2. 参数调优建议

| 图片类型 | 推荐粒度 | 相似度阈值 | 像素化模式 | 预期效果 |
|----------|----------|------------|------------|----------|
| 简单图标 | 10-20 | 0.9-1.0 | dominant | 保持清晰度 |
| 人物头像 | 25-40 | 0.7-0.8 | average | 平衡细节和颜色 |
| 风景照片 | 30-50 | 0.6-0.7 | average | 保留色彩层次 |
| 抽象艺术 | 15-30 | 0.8-0.9 | dominant | 强调色彩对比 |
| 像素艺术 | 5-15 | 0.9-1.0 | nearest | 保持像素风格 |

#### 3. 批量处理优化
```python
import asyncio
import aiohttp
import time
from pathlib import Path

class BatchPerlerProcessor:
    def __init__(self, base_url="http://localhost:3000/api", max_concurrent=3):
        self.base_url = base_url
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def process_single_image(self, session, image_path, output_dir):
        async with self.semaphore:  # 限制并发数
            try:
                # 优化图片
                optimized_path = optimize_image_for_api(image_path)

                # 转换图片
                with open(optimized_path, 'rb') as f:
                    form_data = aiohttp.FormData();
                    form_data.add_field('image', f, filename=Path(image_path).name);
                    form_data.add_field('
optimized_path = optimize_image_for_api('large_image.png')
```

#### 2. 参数调优建议

| 图片类型 | 推荐粒度 | 相似度阈值 | 像素化模式 | 预期效果 |
|----------|----------|------------|------------|----------|
| 简单图标 | 10-20 | 0.9-1.0 | dominant | 保持清晰度 |
| 人物头像 | 25-40 | 0.7-0.8 | average | 平衡细节和颜色 |
| 风景照片 | 30-50 | 0.6-0.7 | average | 保留色彩层次 |
| 抽象艺术 | 15-30 | 0.8-0.9 | dominant | 强调色彩对比 |
| 像素艺术 | 5-15 | 0.9-1.0 | nearest | 保持像素风格 |

#### 3. 批量处理优化
```python
import asyncio
import aiohttp
import time
from pathlib import Path

class BatchPerlerProcessor:
    def __init__(self, base_url="http://localhost:3000/api", max_concurrent=3):
        self.base_url = base_url
        self.semaphore = asyncio.Semaphore(max_concurrent)

    async def process_single_image(self, session, image_path, output_dir):
        async with self.semaphore:  # 限制并发数
            try:
                # 优化图片
                optimized_path = optimize_image_for_api(image_path)

                # 转换图片
                with open(optimized_path, 'rb') as f:
                    form_data = aiohttp.FormData()
                    form_data.add_field('image', f, filename=Path(image_path).name)
                    form_data.add_field('granularity', '25')
                    form_data.add_field('pixelationMode', 'average')

                    async with session.post(f'{self.base_url}/convert', data=form_data) as resp:
                        if resp.status != 200:
                            raise Exception(f"转换失败: {resp.status}")
                        convert_data = await resp.json()

                # 生成图纸
                download_data = {
                    **convert_data['data'],
                    'downloadOptions': {
                        'showGrid': True,
                        'filename': Path(image_path).stem
                    }
                }

                async with session.post(f'{self.base_url}/download', json=download_data) as resp:
                    if resp.status != 200:
                        raise Exception(f"下载失败: {resp.status}")

                    output_path = Path(output_dir) / f"{Path(image_path).stem}_pattern.png"
                    with open(output_path, 'wb') as f:
                        f.write(await resp.read())

                return {'success': True, 'input': image_path, 'output': output_path}

            except Exception as e:
                return {'success': False, 'input': image_path, 'error': str(e)}

    async def process_batch(self, image_paths, output_dir):
        Path(output_dir).mkdir(exist_ok=True)

        async with aiohttp.ClientSession() as session:
            tasks = [
                self.process_single_image(session, path, output_dir)
                for path in image_paths
            ]

            results = await asyncio.gather(*tasks, return_exceptions=True)

        return results

# 使用示例
async def batch_process_example():
    processor = BatchPerlerProcessor(max_concurrent=2)
    image_files = ['image1.jpg', 'image2.png', 'image3.gif']

    start_time = time.time()
    results = await processor.process_batch(image_files, 'output_patterns')
    end_time = time.time()

    successful = sum(1 for r in results if r.get('success'))
    print(f"处理完成: {successful}/{len(image_files)} 成功")
    print(f"总耗时: {end_time - start_time:.2f} 秒")

    for result in results:
        if result['success']:
            print(f"✅ {result['input']} -> {result['output']}")
        else:
            print(f"❌ {result['input']}: {result['error']}")

# 运行批量处理
# asyncio.run(batch_process_example())
```

#### 4. 内存和缓存优化
```python
import psutil
import gc
from functools import lru_cache

class OptimizedPerlerClient:
    def __init__(self):
        self.base_url = "http://localhost:3000/api"

    @lru_cache(maxsize=10)
    def get_palette_info(self):
        """缓存调色板信息"""
        response = requests.get(f"{self.base_url}/palette")
        return response.json()['data']

    def monitor_memory(self):
        """监控内存使用"""
        process = psutil.Process()
        memory_info = process.memory_info()
        return {
            'rss_mb': memory_info.rss / 1024 / 1024,
            'vms_mb': memory_info.vms / 1024 / 1024,
            'percent': process.memory_percent()
        }

    def process_with_memory_management(self, image_path, **params):
        """带内存管理的图片处理"""
        initial_memory = self.monitor_memory()

        try:
            # 检查可用内存
            if initial_memory['percent'] > 80:
                gc.collect()  # 强制垃圾回收
                print("⚠️ 内存使用率较高，执行垃圾回收")

            # 使用缓存的调色板信息
            palette_data = self.get_palette_info()

            # 处理图片
            result = self.convert_image_safe(image_path, **params)

            # 检查内存增长
            final_memory = self.monitor_memory()
            memory_growth = final_memory['rss_mb'] - initial_memory['rss_mb']

            if memory_growth > 100:  # 如果内存增长超过100MB
                print(f"⚠️ 内存增长较大: {memory_growth:.1f} MB")
                gc.collect()

            return result

        except Exception as e:
            # 错误时清理内存
            gc.collect()
            raise e
```

### 缓存策略详解

#### 1. 客户端缓存
- **调色板信息**: 缓存1小时，减少重复请求
- **颜色映射**: 长期缓存，提高转换速度
- **处理结果**: 不建议缓存，文件较大

#### 2. 服务端缓存
- **颜色系统数据**: 应用启动时加载
- **调色板数据**: 内存常驻
- **图片处理**: 不缓存，避免内存溢出

---

## 开发、测试和监控

### 本地开发环境设置

#### 1. 基础设置
```bash
# 克隆项目
git clone [repository-url]
cd perler-beads-server

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# API将在 http://localhost:3000 启动
```

#### 2. 环境配置
```bash
# 创建环境配置文件
cat > .env.local << EOF
# 开发环境配置
NODE_ENV=development
API_BASE_URL=http://localhost:3000
MAX_FILE_SIZE=10485760
REQUEST_TIMEOUT=30000
LOG_LEVEL=debug
EOF
```

### 完整测试套件

#### 1. 单元测试脚本
项目提供了完整的测试脚本：

**基础API测试** (`tests/debug_api.py`):
```python
# 测试所有基本API端点
python tests/debug_api.py

# 输出示例:
# ✅ 状态检查通过
# ✅ 调色板获取成功
# ✅ 图片转换测试通过
# ✅ 下载功能正常
```

**完整工作流程测试** (`tests/test_complete_workflow.py`):
```python
# 测试端到端工作流程
python tests/test_complete_workflow.py

# 测试内容:
# - 文件上传和验证
# - 参数边界测试
# - 错误处理验证
# - 性能基准测试
```

**下载功能专项测试** (`tests/test_download_api.py`):
```python
# 专门测试下载功能
python tests/test_download_api.py

# 测试内容:
# - 不同下载选项
# - 文件格式验证
# - 大文件处理
# - 并发下载测试
```

#### 2. 压力测试脚本
```python
import asyncio
import aiohttp
import time
import statistics
from concurrent.futures import ThreadPoolExecutor

async def stress_test_api(concurrent_requests=5, total_requests=50):
    """API压力测试"""
    base_url = "http://localhost:3000/api"
    response_times = []
    errors = []

    async def single_request(session, request_id):
        start_time = time.time()
        try:
            async with session.get(f"{base_url}/status") as response:
                await response.json()
                response_time = time.time() - start_time
                response_times.append(response_time)
                return {'success': True, 'time': response_time, 'id': request_id}
        except Exception as e:
            errors.append(str(e))
            return {'success': False, 'error': str(e), 'id': request_id}

    # 创建信号量控制并发
    semaphore = asyncio.Semaphore(concurrent_requests)

    async def controlled_request(session, request_id):
        async with semaphore:
            return await single_request(session, request_id)

    # 执行测试
    start_time = time.time()

    async with aiohttp.ClientSession() as session:
        tasks = [controlled_request(session, i) for i in range(total_requests)]
        results = await asyncio.gather(*tasks)

    end_time = time.time()

    # 统计结果
    successful_requests = [r for r in results if r['success']]
    failed_requests = [r for r in results if not r['success']]

    print(f"\n📊 压力测试结果:")
    print(f"总请求数: {total_requests}")
    print(f"并发数: {concurrent_requests}")
    print(f"成功请求: {len(successful_requests)}")
    print(f"失败请求: {len(failed_requests)}")
    print(f"成功率: {len(successful_requests)/total_requests*100:.1f}%")
    print(f"总耗时: {end_time - start_time:.2f} 秒")

    if response_times:
        print(f"平均响应时间: {statistics.mean(response_times)*1000:.1f} ms")
        print(f"最快响应时间: {min(response_times)*1000:.1f} ms")
        print(f"最慢响应时间: {max(response_times)*1000:.1f} ms")
        print(f"95%分位数: {statistics.quantiles(response_times, n=20)[18]*1000:.1f} ms")

# 运行压力测试
# asyncio.run(stress_test_api(concurrent_requests=10, total_requests=100))
```

#### 3. 性能基准测试
```python
import time
import psutil
import os
from pathlib import Path

def benchmark_conversion_performance():
    """图片转换性能基准测试"""
    test_images = [
        {'path': 'test_small.jpg', 'size': '500x500', 'expected_time': 2},
        {'path': 'test_medium.jpg', 'size': '1000x1000', 'expected_time': 5},
        {'path': 'test_large.jpg', 'size': '1500x1500', 'expected_time': 10}
    ]

    client = PerlerAPIClient()
    results = []

    for test_img in test_images:
        if not os.path.exists(test_img['path']):
            print(f"⚠️ 测试图片不存在: {test_img['path']}")
            continue

        print(f"\n🧪 测试图片: {test_img['path']} ({test_img['size']})")

        # 监控系统资源
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024
        initial_cpu = process.cpu_percent()

        start_time = time.time()

        try:
            result = client.convert_image_safe(test_img['path'], granularity=25)

            end_time = time.time()
            elapsed_time = end_time - start_time

            final_memory = process.memory_info().rss / 1024 / 1024
            memory_used = final_memory - initial_memory

            # 记录结果
            test_result = {
                'image': test_img['path'],
                'size': test_img['size'],
                'elapsed_time': elapsed_time,
                'expected_time': test_img['expected_time'],
                'memory_used': memory_used,
                'grid_size': f"{result['gridDimensions']['width']}x{result['gridDimensions']['height']}",
                'bead_count': result['totalBeadCount'],
                'performance_ratio': elapsed_time / test_img['expected_time']
            }

            results.append(test_result)

            # 输出结果
            status = "✅" if elapsed_time <= test_img['expected_time'] * 1.2 else "⚠️"
            print(f"{status} 处理时间: {elapsed_time:.2f}s (预期: {test_img['expected_time']}s)")
            print(f"   内存使用: {memory_used:.1f} MB")
            print(f"   网格大小: {test_result['grid_size']}")
            print(f"   珠子数量: {test_result['bead_count']:,}")

        except Exception as e:
            print(f"❌ 测试失败: {e}")
            results.append({
                'image': test_img['path'],
                'error': str(e),
                'elapsed_time': None
            })

    # 生成报告
    print(f"\n📈 性能基准报告:")
    print(f"{'图片':<15} {'预期时间':<8} {'实际时间':<8} {'性能比':<8} {'状态':<6}")
    print("-" * 50)

    for result in results:
        if 'error' not in result:
            ratio = result['performance_ratio']
            status = "优秀" if ratio < 0.8 else "良好" if ratio < 1.2 else "需优化"
            print(f"{result['image']:<15} {result['expected_time']:<8.1f}s {result['elapsed_time']:<8.2f}s {ratio:<8.2f} {status:<6}")
        else:
            print(f"{result['image']:<15} {'N/A':<8} {'失败':<8} {'N/A':<8} {'错误':<6}")

# 运行基准测试
# benchmark_conversion_performance()
```

### 监控和日志

#### 1. 实时监控脚本
```python
import requests
import time
import json
from datetime import datetime

def monitor_api_health(interval=60, duration=3600):
    """实时监控API健康状态"""
    base_url = "http://localhost:3000/api"
    end_time = time.time() + duration

    print(f"🔍 开始监控API健康状态 (间隔: {interval}s, 持续: {duration/60:.1f}分钟)")
    print(f"{'时间':<20} {'状态':<10} {'响应时间':<10} {'内存使用':<10}")
    print("-" * 60)

    while time.time() < end_time:
        try:
            start_time = time.time()
            response = requests.get(f"{base_url}/status", timeout=10)
            response_time = (time.time() - start_time) * 1000

            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                uptime = data.get('uptime', 0)
                memory_usage = data.get('health', {}).get('memory_usage', 'N/A')

                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"{timestamp} {status:<10} {response_time:<10.1f}ms {memory_usage}")

                # 记录到日志文件
                log_entry = {
                    'timestamp': timestamp,
                    'status': status,
                    'response_time_ms': response_time,
                    'uptime': uptime,
                    'memory_usage': memory_usage
                }

                with open('api_health_log.jsonl', 'a') as f:
                    f.write(json.dumps(log_entry) + '\n')

            else:
                print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ERROR      {response.status_code}     N/A")

        except requests.exceptions.RequestException as e:
            print(f"{datetime.now().strftime('%Y-%m-%d %H:%M:%S')} OFFLINE    N/A        N/A")

        time.sleep(interval)

# 使用示例
# monitor_api_health(interval=30, duration=1800)  # 监控30分钟，每30秒检查一次
```

#### 2. 日志分析工具
```python
import json
import pandas as pd
import matplotlib.pyplot as plt
from datetime import datetime, timedelta

def analyze_api_logs(log_file='api_health_log.jsonl'):
    """分析API健康日志"""
    logs = []

    try:
        with open(log_file, 'r') as f:
            for line in f:
                logs.append(json.loads(line.strip()))
    except FileNotFoundError:
        print(f"日志文件不存在: {log_file}")
        return

    if not logs:
        print("没有找到日志数据")
        return

    df = pd.DataFrame(logs)
    df['timestamp'] = pd.to_datetime(df['timestamp'])

    print(f"📊 API健康日志分析 ({len(logs)} 条记录)")
    print(f"时间范围: {df['timestamp'].min()} 到 {df['timestamp'].max()}")

    # 状态统计
    status_counts = df['status'].value_counts()
    print(f"\n状态分布:")
    for status, count in status_counts.items():
        percentage = count / len(df) * 100
        print(f"  {status}: {count} ({percentage:.1f}%)")

    # 响应时间统计
    if 'response_time_ms' in df.columns:
        response_times = df['response_time_ms'].dropna()
        print(f"\n响应时间统计:")
        print(f"  平均: {response_times.mean():.1f} ms")
        print(f"  中位数: {response_times.median():.1f} ms")
        print(f"  95%分位数: {response_times.quantile(0.95):.1f} ms")
        print(f"  最大: {response_times.max():.1f} ms")

        # 慢请求警告
        slow_requests = response_times[response_times > 1000]
        if len(slow_requests) > 0:
            print(f"  ⚠️ 慢请求 (>1s): {len(slow_requests)} 次")

    # 可用性计算
    healthy_logs = df[df['status'] == 'healthy']
    availability = len(healthy_logs) / len(df) * 100
    print(f"\n可用性: {availability:.2f}%")

    if availability < 99:
        print("⚠️ 可用性低于99%，需要关注！")

# 使用示例
# analyze_api_logs()
```

---

## 完整使用示例

### 🎯 基础工作流程

```python
import requests
import json
from datetime import datetime

def complete_perler_workflow():
    """完整的拼豆图纸生成工作流程"""

    # 1. 检查API状态
    print("1️⃣ 检查API状态...")
    status_response = requests.get("http://localhost:3000/api/status")
    if status_response.status_code == 200:
        print("✅ API服务正常")
    else:
        print("❌ API服务异常")
        return

    # 2. 获取调色板信息
    print("2️⃣ 获取调色板信息...")
    palette_response = requests.get("http://localhost:3000/api/palette")
    palette_data = palette_response.json()
    print(f"✅ 支持 {palette_data['data']['totalColors']} 种颜色")
    print(f"✅ 自定义调色板支持: {palette_data['data']['supportsCustomPalette']}")

    # 3. 转换图片
    print("3️⃣ 转换图片...")
    with open('test_image.png', 'rb') as f:
        files = {'image': ('image.png', f, 'image/png')}
        form_data = {
            'granularity': '50',
            'selectedPalette': '291色',
            'selectedColorSystem': 'MARD'
        }

        convert_response = requests.post(
            "http://localhost:3000/api/convert",
            files=files,
            data=form_data
        )

    if convert_response.status_code == 200:
        convert_data = convert_response.json()['data']
        print(f"✅ 转换成功: {convert_data['gridDimensions']['N']}x{convert_data['gridDimensions']['M']}")
        print(f"✅ 总珠子数: {convert_data['totalBeadCount']}")
        print(f"✅ 使用颜色数: {len(convert_data['colorCounts'])}")
    else:
        print("❌ 图片转换失败")
        return

    # 4. 生成图纸
    print("4️⃣ 生成图纸...")
    download_data = {
        "pixelData": convert_data['pixelData'],
        "gridDimensions": convert_data['gridDimensions'],
        "colorCounts": convert_data['colorCounts'],
        "totalBeadCount": convert_data['totalBeadCount'],
        "activeBeadPalette": convert_data['activeBeadPalette'],
        "downloadOptions": {
            "cellSize": 30,
            "showGrid": True,
            "includeStats": True,
            "filename": f"perler_pattern_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        }
    }

    download_response = requests.post(
        "http://localhost:3000/api/download",
        json=download_data
    )

    if download_response.status_code == 200:
        filename = "generated_pattern.png"
        with open(filename, 'wb') as f:
            f.write(download_response.content)
        print(f"✅ 图纸生成成功: {filename}")
        print(f"✅ 文件大小: {len(download_response.content) / 1024:.1f} KB")
    else:
        print("❌ 图纸生成失败")

# 运行完整工作流程
complete_perler_workflow()
```

### 🎨 自定义调色板工作流程

```python
def custom_palette_workflow():
    """使用自定义调色板的完整工作流程"""

    # 1. 定义自定义调色板
    custom_palette = {
        "version": "3.0",
        "selectedHexValues": [
            "#E7002F",  # 红色
            "#FEFFFF",  # 白色
            "#00FF00",  # 绿色
            "#0000FF",  # 蓝色
            "#FFFF00"   # 黄色
        ],
        "exportDate": datetime.now().isoformat(),
        "totalColors": 5
    }

    # 2. 验证自定义调色板
    print("1️⃣ 验证自定义调色板...")
    validation_response = requests.post(
        "http://localhost:3000/api/palette",
        json={"customPalette": custom_palette}
    )

    if validation_response.status_code == 200:
        validation_data = validation_response.json()['data']
        print(f"✅ 调色板验证成功: {validation_data['totalColors']} 种颜色")
    else:
        print("❌ 调色板验证失败")
        print(validation_response.json())
        return

    # 3. 使用自定义调色板转换图片
    print("2️⃣ 使用自定义调色板转换图片...")
    with open('test_image.png', 'rb') as f:
        files = {'image': ('image.png', f, 'image/png')}
        form_data = {
            'granularity': '40',
            'selectedPalette': '自定义',
            'customPalette': json.dumps(custom_palette)
        }

        convert_response = requests.post(
            "http://localhost:3000/api/convert",
            files=files,
            data=form_data
        )

    if convert_response.status_code == 200:
        convert_data = convert_response.json()['data']
        print(f"✅ 自定义调色板转换成功")
        print(f"✅ 网格尺寸: {convert_data['gridDimensions']['N']}x{convert_data['gridDimensions']['M']}")
        print(f"✅ 调色板来源: {convert_data['processingParams']['paletteSource']}")
        print(f"✅ 自定义颜色数: {convert_data['processingParams']['customPaletteColors']}")

        # 4. 生成自定义调色板图纸
        print("3️⃣ 生成自定义调色板图纸...")
        download_data = {
            "pixelData": convert_data['pixelData'],
            "gridDimensions": convert_data['gridDimensions'],
            "colorCounts": convert_data['colorCounts'],
            "totalBeadCount": convert_data['totalBeadCount'],
            "activeBeadPalette": convert_data['activeBeadPalette'],
            "downloadOptions": {
                "cellSize": 25,
                "showGrid": True,
                "includeStats": True,
                "filename": "custom_palette_pattern.png"
            }
        }

        download_response = requests.post(
            "http://localhost:3000/api/download",
            json=download_data
        )

        if download_response.status_code == 200:
            with open('custom_palette_pattern.png', 'wb') as f:
                f.write(download_response.content)
            print("✅ 自定义调色板图纸生成成功!")
        else:
            print("❌ 图纸生成失败")
    else:
        print("❌ 图片转换失败")
        print(convert_response.json())

# 运行自定义调色板工作流程
custom_palette_workflow()
```

---

## 更新历史

### v1.1.0 (2025-06-03) - 自定义调色板版本
- ✅ **自定义调色板支持**: 完整实现用户自定义调色板功能
- ✅ **新格式支持**: 支持v3.0版本调色板格式 (`selectedHexValues` 数组)
- ✅ **向后兼容**: 保持对旧格式调色板的完全兼容
- ✅ **调色板验证**: 新增 `POST /api/palette` 验证端点
- ✅ **API文档更新**: 完整的自定义调色板使用文档和示例
- ✅ **测试覆盖**: 全面的自定义调色板测试用例
- ✅ **响应增强**: convert API 响应中新增 `paletteSource` 和 `customPaletteColors` 字段

### v1.0.0 (2025-06-02) - 初始版本
- ✅ 初始版本发布
- ✅ 支持图片转换功能 (支持 jpg, jpeg, png, gif, bmp, webp)
- ✅ 支持多种颜色系统 (291种颜色)
- ✅ 支持高质量图纸生成
- ✅ API路径从 `/api/v1/` 重构为 `/api/`
- ✅ 修复服务端图片下载边距不均衡问题
- ✅ 完整的API文档 (包含工作流程示例和错误处理)
- ✅ 全面的测试套件
- ✅ 性能优化指南和监控工具
- ✅ 高级错误处理和重试机制

### 主要特性
- **完整的工作流程**: 从图片上传到图纸下载的端到端处理
- **智能颜色匹配**: 支持291种珠子颜色的精确匹配 + 自定义调色板
- **灵活的参数控制**: 可调节粒度、相似度阈值、像素化模式
- **多种下载选项**: 支持网格显示、坐标标注、统计信息
- **自定义调色板**: 支持用户定义的颜色组合，适用于特定项目需求
- **健壮的错误处理**: 包含重试机制和详细错误信息
- **性能优化**: 内存管理、批量处理、缓存策略
- **全面的监控**: 健康检查、性能基准、实时监控

### 技术规格
- **后端框架**: Next.js with TypeScript
- **图片处理**: Canvas API + 自定义算法
- **颜色匹配**: 基于欧几里得距离的颜色空间计算
- **文件支持**: 多种主流图片格式，最大10MB
- **调色板系统**: 默认291色 + 无限制自定义调色板
- **并发处理**: 支持多请求并发，建议不超过5个同时请求
- **响应格式**: 标准化JSON响应，包含详细状态信息

---

## 技术支持

### 文档和资源
- **项目文档**: `README.md` - 项目概述和快速开始
- **API文档**: 本文档 - 完整的API参考和使用指南
- **测试脚本**:
  - `tests/debug_api.py` - 基础API功能测试
  - `tests/test_complete_workflow.py` - 端到端工作流程测试
  - `tests/test_download_api.py` - 下载功能专项测试

### 故障排除
1. **服务启动问题**: 检查Node.js版本和依赖安装
2. **图片转换失败**: 验证图片格式和文件大小
3. **响应缓慢**: 检查图片尺寸和系统资源
4. **内存不足**: 优化图片尺寸，减少并发请求

### 联系方式
- **问题反馈**: GitHub Issues
- **功能建议**: GitHub Discussions
- **技术交流**: 项目Wiki

### 开源许可
本项目采用 MIT 许可证，详见 `LICENSE` 文件。

---

**最后更新**: 2025年6月2日
**API版本**: v1.0.0
**文档版本**: v1.0.0 (完整版)
**支持的图片格式**: JPG, JPEG, PNG, GIF, BMP, WEBP
**珠子颜色数量**: 291种
**API基础路径**: `/api` (已从 `/api/v1` 更新)
