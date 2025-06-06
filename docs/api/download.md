# 生成并下载拼豆图纸图片

## `POST /api/download`

生成并下载拼豆图纸图片

## 参数

- **`pixelData`** (`PixelData`) **[必需]**
  - 描述: 包含所有像素数据和元信息的对象（mappedData, width, height, colorSystem）

- **`downloadOptions`** (对象)
  - **`showGrid`** (`boolean`)
    - 默认值: `True`
    - 描述: 显示网格线
  - **`gridInterval`** (`number`)
    - 默认值: `10`
    - 描述: 网格间隔
  - **`showCoordinates`** (`boolean`)
    - 默认值: `True`
    - 描述: 显示坐标
  - **`gridLineColor`** (`string`)
    - 默认值: `#CCCCCC`
    - 描述: 网格线颜色
  - **`outerBorderColor`** (`string`)
    - 默认值: `#141414`
    - 描述: 外边框颜色 - 围绕网格的边框颜色，可选参数
  - **`includeStats`** (`boolean`)
    - 默认值: `True`
    - 描述: 包含统计信息
  - **`showTransparentLabels`** (`boolean`)
    - 默认值: `False`
    - 描述: 是否在透明色（T01）上显示色号标识
  - **`title`** (`string`)
    - 描述: 图纸标题 - 显示在图片顶部的标题栏中，高度已增加
  - **`dpi`** (`number`)
    - 默认值: `150`
    - 描述: 图片分辨率 (DPI) - DPI模式下使用
  - **`renderMode`** (`string`)
    - 默认值: `dpi`
    - 枚举: `dpi`, `fixed`
    - 描述: 渲染模式：dpi=基于DPI的模式，fixed=固定宽度模式
  - **`fixedWidth`** (`number`)
    - 描述: 固定宽度（像素）- fixed模式下必需，指定图片的横向宽度

## 响应格式

```json
{
  "contentType": "image/png",
  "headers": {
    "Content-Disposition": "attachment; filename=\"...\""
  }
}
```

## 渲染模式

### DPI 模式
- **描述**: DPI模式 - 基于DPI设置图片分辨率
- **参数**: `dpi`
- **使用场景**: 适用于需要特定分辨率的场景，如打印等

### FIXED 模式
- **描述**: 固定宽度模式 - 根据指定的像素宽度渲染
- **参数**: `fixedWidth`
- **使用场景**: 适用于需要固定尺寸的场景，系统会自动计算单元格大小
- **注意**: 如果未指定fixedWidth，将自动使用默认DPI模式

## 使用示例

### DPI模式示例 - 使用DPI控制分辨率

```json
{
  "description": "DPI模式示例 - 使用DPI控制分辨率",
  "downloadOptions": {
    "title": "我的拼豆图纸",
    "renderMode": "dpi",
    "dpi": 300,
    "showGrid": true,
    "gridLineColor": "#CCCCCC",
    "outerBorderColor": "#000000",
    "showTransparentLabels": false
  }
}
```

### 固定宽度模式示例 - 指定图片宽度

```json
{
  "description": "固定宽度模式示例 - 指定图片宽度",
  "downloadOptions": {
    "title": "我的拼豆图纸",
    "renderMode": "fixed",
    "fixedWidth": 1200,
    "showGrid": true,
    "gridLineColor": "#DDDDDD",
    "outerBorderColor": "#141414",
    "showTransparentLabels": true
  }
}
```

### 自定义边框颜色示例

```json
{
  "description": "自定义边框颜色示例",
  "downloadOptions": {
    "title": "彩色边框图纸",
    "renderMode": "dpi",
    "dpi": 150,
    "showGrid": true,
    "gridLineColor": "#CCCCCC",
    "outerBorderColor": "#FF0000",
    "includeStats": true,
    "showTransparentLabels": false
  }
}
```

---

*此文档由 `scripts/generate_docs.py` 自动生成，请勿手动编辑。*
*配置来源: `src/config/apiDocs.ts`*
