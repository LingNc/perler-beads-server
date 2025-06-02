# 拼豆图纸生成器 API 使用指南

## 📖 完整文档

**🔥 最新完整API文档请查看: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

该文档包含：
- ✅ 详细的API端点说明
- ✅ 完整的请求/响应示例
- ✅ 错误处理指南
- ✅ 多语言代码示例
- ✅ 性能优化建议
- ✅ 测试工具使用说明

## ⚡ 快速开始

### 1. 检查服务状态
```bash
curl http://localhost:3000/api/v1/status
```

### 2. 获取调色板信息
```bash
curl http://localhost:3000/api/v1/palette
```

### 3. 转换图片
```bash
curl -X POST http://localhost:3000/api/v1/convert \
  -F "image=@your_image.png" \
  -F "granularity=20" \
  -F "selectedColorSystem=MARD"
```

### 4. 下载图纸
```bash
curl -X POST http://localhost:3000/api/v1/download \
  -H "Content-Type: application/json" \
  -d '{"pixelData": [...], "gridDimensions": {...}, ...}'
```

## 🧪 测试工具

项目提供了完整的测试脚本集：

```bash
# 运行完整的API调试测试
python debug_api.py

# 测试完整工作流程
python test_complete_workflow.py

# 单独测试下载功能
python test_download_api.py
```

## 📋 API 端点总览

| 端点 | 方法 | 功能 | 状态 |
|------|------|------|------|
| `/status` | GET | 服务状态检查 | ✅ |
| `/palette` | GET | 获取调色板信息 | ✅ |
| `/convert` | POST | 图片转换 | ✅ |
| `/download` | POST | 图纸下载 | ✅ |

## 🔧 技术特性

- **多颜色系统支持**: MARD, COCO, 漫漫, 盼盼, 咪小窝
- **智能像素化**: 平均色模式 + 主导色模式
- **高质量输出**: PNG格式图纸，包含网格和统计信息
- **完整工作流**: 从图片上传到图纸下载的端到端处理
- **性能监控**: 实时状态检查和性能指标

## 📚 详细信息

更多详细的API使用说明、参数配置、错误处理等信息，请查看：

**👉 [完整API文档 - API_DOCUMENTATION.md](./API_DOCUMENTATION.md)**

---

## 🚀 快速示例 (Python)

```python
import requests

BASE_URL = "http://localhost:3000/api/v1"

# 完整流程示例
def generate_pattern(image_path):
    # 1. 获取调色板
    palette_resp = requests.get(f"{BASE_URL}/palette")
    color_system = palette_resp.json()['data']['colorSystems'][0]['key']

    # 2. 转换图片
    with open(image_path, 'rb') as f:
        files = {'image': f}
        data = {
            'granularity': '20',
            'selectedColorSystem': color_system
        }
        convert_resp = requests.post(f"{BASE_URL}/convert", files=files, data=data)

    # 3. 下载图纸
    convert_data = convert_resp.json()['data']
    download_data = {
        **convert_data,
        "selectedColorSystem": color_system,
        "downloadOptions": {"showGrid": True, "includeStats": True}
    }

    download_resp = requests.post(f"{BASE_URL}/download", json=download_data)

    with open('pattern.png', 'wb') as f:
        f.write(download_resp.content)

    print("✅ 图纸生成完成!")

# 使用示例
generate_pattern('your_image.png')
```

---

*最后更新: 2025年6月2日*
*API版本: v1.0.0*
  - `average`: 真实模式，使用平均色
- `selectedPalette`: 调色板名称 (可选，默认"168色")
- `selectedColorSystem`: 色号系统 (可选，默认"MARD")

#### 响应示例
```json
{
  "success": true,
  "data": {
    "gridDimensions": { "N": 50, "M": 40 },
    "pixelData": [[{"key": "#FF0000", "color": "#FF0000"}]],
    "colorCounts": {
      "#FF0000": { "count": 100, "color": "#FF0000" }
    },
    "totalBeadCount": 2000,
    "processingParams": {
      "granularity": 50,
      "similarityThreshold": 30,
      "pixelationMode": "dominant",
      "selectedPalette": "168色"
    },
    "imageInfo": {
      "originalWidth": 800,
      "originalHeight": 600,
      "aspectRatio": 0.75
    }
  }
}
```

### 3. 图纸下载
```http
POST /api/v1/download
```

#### 请求参数 (application/json)
```json
{
  "pixelData": [[{"key": "#FF0000", "color": "#FF0000"}]],
  "gridDimensions": { "N": 50, "M": 40 },
  "colorCounts": {
    "#FF0000": { "count": 100, "color": "#FF0000" }
  },
  "totalBeadCount": 2000,
  "processingParams": {
    "granularity": 50,
    "pixelationMode": "dominant"
  },
  "downloadOptions": {
    "showGrid": true,
    "gridInterval": 10,
    "showCoordinates": true,
    "gridLineColor": "#CCCCCC",
    "includeStats": true,
    "format": "png",
    "filename": "my-pattern"
  }
}
```

#### 响应
返回图片文件，Content-Type为 `image/png` 或 `image/jpeg`

### 4. 调色板管理
```http
GET /api/v1/palette
GET /api/v1/palette?detailed=true
GET /api/v1/palette?colorSystem=MARD
```

#### 响应示例
```json
{
  "success": true,
  "data": {
    "paletteOptions": [
      { "name": "168色", "description": "完整色板", "colorCount": 168 }
    ],
    "colorSystems": ["MARD", "COCO", "漫漫", "盼盼", "咪小窝"],
    "defaultColorSystem": "MARD",
    "defaultPalette": "168色"
  }
}
```

## 使用示例

### JavaScript/Node.js 示例

```javascript
// 1. 转换图片
async function convertImage(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('granularity', '50');
  formData.append('pixelationMode', 'dominant');

  const response = await fetch('http://localhost:3000/api/v1/convert', {
    method: 'POST',
    body: formData
  });

  const result = await response.json();
  return result;
}

// 2. 下载图纸
async function downloadPattern(patternData) {
  const response = await fetch('http://localhost:3000/api/v1/download', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(patternData)
  });

  const blob = await response.blob();
  return blob;
}

// 3. 获取调色板信息
async function getPaletteInfo() {
  const response = await fetch('http://localhost:3000/api/v1/palette');
  const result = await response.json();
  return result;
}
```

### Python 示例

```python
import requests
import json

# 1. 转换图片
def convert_image(image_path):
    url = 'http://localhost:3000/api/v1/convert'

    with open(image_path, 'rb') as f:
        files = {'image': f}
        data = {
            'granularity': '50',
            'pixelationMode': 'dominant',
            'selectedPalette': '168色'
        }

        response = requests.post(url, files=files, data=data)
        return response.json()

# 2. 下载图纸
def download_pattern(pattern_data, output_path):
    url = 'http://localhost:3000/api/v1/download'

    response = requests.post(url, json=pattern_data)

    if response.status_code == 200:
        with open(output_path, 'wb') as f:
            f.write(response.content)
        return True
    return False

# 3. 获取调色板信息
def get_palette_info():
    url = 'http://localhost:3000/api/v1/palette'
    response = requests.get(url)
    return response.json()

# 使用示例
if __name__ == "__main__":
    # 转换图片
    result = convert_image('test.jpg')
    print("转换结果:", result)

    # 下载图纸
    if result['success']:
        download_data = {
            'pixelData': result['data']['pixelData'],
            'gridDimensions': result['data']['gridDimensions'],
            'colorCounts': result['data']['colorCounts'],
            'totalBeadCount': result['data']['totalBeadCount'],
            'downloadOptions': {
                'showGrid': True,
                'format': 'png'
            }
        }
        download_pattern(download_data, 'pattern.png')
```

### cURL 示例

```bash
# 1. 检查API状态
curl -X GET http://localhost:3000/api/v1/status

# 2. 转换图片
curl -X POST http://localhost:3000/api/v1/convert \
  -F "image=@test.jpg" \
  -F "granularity=50" \
  -F "pixelationMode=dominant" \
  -F "selectedPalette=168色"

# 3. 获取调色板信息
curl -X GET http://localhost:3000/api/v1/palette

# 4. 下载图纸 (需要先获取转换结果)
curl -X POST http://localhost:3000/api/v1/download \
  -H "Content-Type: application/json" \
  -d '{"pixelData":[[]],"gridDimensions":{"N":50,"M":40},"colorCounts":{},"totalBeadCount":0}' \
  --output pattern.png
```

## 错误处理

API使用标准的HTTP状态码：

- `200`: 成功
- `400`: 请求参数错误
- `500`: 服务器内部错误

错误响应格式：
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息"
}
```

## 注意事项

1. 图片文件大小限制：10MB
2. 支持的图片格式：JPG, PNG, GIF, BMP, WebP
3. 精细度范围：1-200
4. 相似度阈值范围：0-100
5. API响应时间取决于图片大小和精细度设置

## 部署说明

确保安装了必要的依赖：
```bash
npm install canvas multer
```

启动服务：
```bash
npm run dev  # 开发模式
npm run build && npm start  # 生产模式
```
