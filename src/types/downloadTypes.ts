import { PixelData } from "./pixelTypes";

// 下载网格的选项类型定义
export type GridDownloadOptions = {
  showGrid: boolean;
  gridInterval: number;
  showCoordinates: boolean;
  gridLineColor: string;
  includeStats: boolean;
  dpi?: number;
  fixedWidth?: number;           // 固定宽度（像素）
  showTransparentLabels?: boolean; // 是否在T01透明色上显示字体标识
};

// 下载选项类型定义
export interface DownloadImage{
  title?: string;
  pixelData: PixelData | null;
  renderMode?: 'dpi' | 'fixed';  // 渲染模式：dpi=基于DPI的模式，fixed=固定宽度模式
  options: GridDownloadOptions;
}