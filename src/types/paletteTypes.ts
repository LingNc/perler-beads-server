// 自定义调色板类型
// 版本3.0没有name字段，4.0包含name字段
export interface CustomPalette{
    version: string,
    // 4.0 必须包含
    name?: string,
    selectedHexValues: string[],
    exportDate?: string,
    totalColors?: number
}

// 预制调色板接口
export interface PresetPalette {
  id: string;
  name: string;
  description?: string;
  data: CustomPalette;
}

// 颜色统计
export type ColorCount =
    Record<
        string, {
            count: number,
            color: string
        }>;

// 验证结果接口
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  validatedColors?: Array<{
    key: string;
    hex: string;
    rgb: { r: number; g: number; b: number };
  }>;
}