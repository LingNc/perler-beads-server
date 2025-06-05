// 下载网格的选项类型定义
export type GridDownloadOptions = {
  showGrid: boolean;
  gridInterval: number;
  showCoordinates: boolean;
  gridLineColor: string;
  includeStats: boolean;
  title?: string;
  dpi?: number;
  renderMode?: 'dpi' | 'fixed';  // 渲染模式：dpi=基于DPI的模式，fixed=固定宽度模式
  fixedWidth?: number;           // 固定宽度（像素）
  showTransparentLabels?: boolean; // 是否在T01透明色上显示字体标识
};