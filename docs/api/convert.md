# 将图片转换为拼豆图纸

## `POST /api/convert`

将图片转换为拼豆图纸

## 参数

- **`image`** (`File`) **[必需]**
  - 描述: 要转换的图片文件

- **`granularity`** (`number`)
  - 默认值: `50`
  - 范围: `1-200`
  - 描述: 图纸精细度

- **`similarityThreshold`** (`number`)
  - 默认值: `30`
  - 范围: `0-100`
  - 描述: 颜色相似度阈值

- **`pixelationMode`** (`string`)
  - 默认值: `dominant`
  - 选项: `dominant`, `average`
  - 描述: 像素化模式：dominant=卡通模式, average=真实模式

- **`selectedPalette`** (`string`)
  - 默认值: `290色`
  - 描述: 使用的调色板：290色(默认全色板)、custom(自定义调色板)或预设调色板名称
  - 示例: `290色`, `custom`, `144-perler-palette`, `120-perler-palette`

- **`selectedColorSystem`** (`string`)
  - 默认值: `MARD`
  - 描述: 色号系统

- **`customPalette`** (`string`)
  - 描述: JSON格式的自定义调色板数据，格式：{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}

## 响应格式

```json
{
  "success": "boolean",
  "data": {
    "pixelData": "PixelData (包含 mappedData, width, height, colorSystem)",
    "colorCounts": "{ [key: string]: { count: number, color: string } } (key为色号)",
    "totalBeadCount": "number",
    "paletteName": "string (使用的调色板名称)",
    "processingParams": "object (包含paletteSource和customPaletteColors)",
    "imageInfo": "object"
  }
}
```

## 注意事项

- 支持三种调色板类型：默认调色板(290色)、自定义调色板(custom)和预设调色板
- 预制调色板：使用预设的颜色组合，如"144-perler-palette"、"120-perler-palette"等
- 自定义调色板：通过customPalette参数传入JSON格式的颜色数据
- 默认使用290色调色板，支持MARD、COCO、漫漫、盼盼、咪小窝等色号系统
- 自定义调色板格式：{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}
- 版本3.0不包含name字段，版本4.0包含name字段
- 调色板中的key字段表示色号，用于生成图纸时显示
- colorCounts返回结果中的key为对应色号系统的色号标识
- processingParams.paletteSource指示调色板来源：default、custom或preset

---

*此文档由 `scripts/generate_docs.py` 自动生成，请勿手动编辑。*
*配置来源: `src/config/apiDocs.ts`*
