# GET: 获取调色板信息和预设调色板列表; POST: 验证自定义调色板

## `GET/POST /api/palette`

GET: 获取调色板信息和预设调色板列表; POST: 验证自定义调色板

## 参数

- **`colorSystem`** (`string`)
  - 描述: 色号系统 (可选, GET)

- **`detailed`** (`boolean`)
  - 描述: 是否返回详细信息 (可选, GET)

- **`customPalette`** (`object`)
  - 描述: 自定义调色板对象 (POST验证)

- **`colorSystem_post`** (`string`)
  - 默认值: `MARD`
  - 描述: 色号系统 (POST验证, 可选, 默认MARD)

---

*此文档由 `scripts/generate_docs.py` 自动生成，请勿手动编辑。*
*配置来源: `src/config/apiDocs.ts`*
