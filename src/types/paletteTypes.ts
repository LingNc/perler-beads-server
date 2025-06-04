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

// 颜色统计
export type ColorCount =
    Record<
        string, {
            count: number,
            color: string
        }>;