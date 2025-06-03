// 服务器端图片生成器 - 基于 imageDownloader.ts 适配
import { GridDownloadOptions } from '../types/downloadTypes';
import { MappedPixel } from './pixelation';
import { getDisplayColorKey, ColorSystem } from './colorSystemUtils';
import { createCanvas } from 'canvas';

// 用于获取对比色的工具函数
function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000';
  const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luma > 0.5 ? '#000000' : '#FFFFFF';
}

// 辅助函数：将十六进制颜色转换为RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const formattedHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(formattedHex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

// 用于排序颜色键的函数
function sortColorKeys(a: string, b: string): number {
  const regex = /^([A-Z]+)(\d+)$/;
  const matchA = a.match(regex);
  const matchB = b.match(regex);

  if (matchA && matchB) {
    const prefixA = matchA[1];
    const numA = parseInt(matchA[2], 10);
    const prefixB = matchB[1];
    const numB = parseInt(matchB[2], 10);

    if (prefixA !== prefixB) {
      return prefixA.localeCompare(prefixB);
    }
    return numA - numB;
  }
  return a.localeCompare(b);
}

// 服务器端下载图片的主函数 - 返回 Buffer 而不是下载文件
export async function generateImageBuffer({
  mappedPixelData,
  gridDimensions,
  colorCounts,
  totalBeadCount,
  options,
  selectedColorSystem,
  title,
  dpi = 150,
  renderMode = 'dpi',
  fixedWidth
}: {
  mappedPixelData: MappedPixel[][] | null;
  gridDimensions: { N: number; M: number } | null;
  colorCounts: { [key: string]: { count: number; color: string } } | null;
  totalBeadCount: number;
  options: GridDownloadOptions;
  selectedColorSystem: ColorSystem;
  title?: string;
  dpi?: number;
  renderMode?: 'dpi' | 'fixed';
  fixedWidth?: number;
}): Promise<Buffer> {

  if (!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0) {
    throw new Error("下载失败: 映射数据或尺寸无效。");
  }
  if (!colorCounts) {
    throw new Error("下载失败: 色号统计数据无效。");
  }

  const { N, M } = gridDimensions;

  // 从下载选项中获取设置
  const { showGrid, gridInterval, showCoordinates, gridLineColor, includeStats } = options;

  // 根据渲染模式计算基础单元格大小
  let downloadCellSize: number;
  let dpiScale: number;

  if (renderMode === 'fixed' && fixedWidth) {
    // 固定宽度模式：根据指定宽度计算单元格大小
    const gridWidthCells = N;
    const axisSpace = showCoordinates ? Math.max(30, 20) : 0;
    const margins = 70; // 左右边距估算
    const availableWidth = fixedWidth - axisSpace - margins;
    downloadCellSize = Math.max(10, Math.floor(availableWidth / gridWidthCells));
    dpiScale = downloadCellSize / 30; // 以30为基准
  } else {
    // DPI模式：根据DPI调整基础单元格大小
    const baseCellSize = 30;
    dpiScale = dpi / 150; // 以150为基准DPI
    downloadCellSize = Math.round(baseCellSize * dpiScale);
  }

  // 设置边距空间用于坐标轴标注（如果需要）
  const axisLabelSize = showCoordinates ? Math.max(30 * dpiScale, Math.floor(downloadCellSize)) : 0;

  // 定义统计区域的基本参数
  const statsPadding = 20 * dpiScale;
  let statsHeight = 0;

  // 计算字体大小的基础值（根据DPI调整）
  const baseStatsFontSize = 13 * dpiScale;
  const preliminaryWidth = N * downloadCellSize + axisLabelSize;
  const preliminaryAvailableWidth = preliminaryWidth - (statsPadding * 2);
  const widthFactor = Math.max(0, preliminaryAvailableWidth - 350 * dpiScale) / (600 * dpiScale);
  const statsFontSize = Math.floor(baseStatsFontSize + (widthFactor * 10 * dpiScale));

  // 计算额外边距，确保坐标数字完全显示
  const coordinateAxisWidth = showCoordinates ? Math.max(20 * dpiScale, statsFontSize * 2) : 0;
  const extraLeftMargin = coordinateAxisWidth + 15 * dpiScale;
  const extraRightMargin = coordinateAxisWidth + 35 * dpiScale;
  const extraTopMargin = showCoordinates ? Math.max(15 * dpiScale, statsFontSize) : 20 * dpiScale;
  const extraBottomMargin = 20 * dpiScale;

  // 计算网格尺寸
  const gridWidth = N * downloadCellSize;
  const gridHeight = M * downloadCellSize;

  // 添加适当高度的标题栏
  const titleBarHeight = title ? 80 * dpiScale : 0; // 减小高度，使布局更紧凑

  // 计算统计区域的大小
  if (includeStats && colorCounts) {
    const colorKeys = Object.keys(colorCounts);
    const statsTopMargin = 24 * dpiScale;
    const finalWidth = gridWidth + axisLabelSize + extraLeftMargin + extraRightMargin;
    const availableStatsWidth = finalWidth - (statsPadding * 2);
    const numColumns = Math.max(1, Math.min(4, Math.floor(availableStatsWidth / (250 * dpiScale))));
    const baseSwatchSize = 18 * dpiScale;
    const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 20 * dpiScale));
    const numRows = Math.ceil(colorKeys.length / numColumns);
    const statsRowHeight = Math.max(swatchSize + 8 * dpiScale, 25 * dpiScale);
    const titleHeight = 40 * dpiScale;
    const footerHeight = 40 * dpiScale;
    statsHeight = titleHeight + (numRows * statsRowHeight) + footerHeight + (statsPadding * 2) + statsTopMargin;
  }

  // 计算基础内容尺寸 - 不再按固定比例调整，而是根据内容自然布局
  const contentWidth = gridWidth + axisLabelSize + extraLeftMargin + extraRightMargin;
  const contentHeight = titleBarHeight + gridHeight + axisLabelSize + statsHeight + extraTopMargin + extraBottomMargin;

  // 直接使用内容尺寸，不再强制调整比例
  const downloadWidth = contentWidth;
  const downloadHeight = contentHeight;

  // 计算偏移量 - 由于不再调整图片比例，这里的偏移量实际上是0
  const offsetX = 0;
  const offsetY = 0;

  // 创建 Node.js Canvas
  const canvas = createCanvas(downloadWidth, downloadHeight);
  const ctx = canvas.getContext('2d');

  // 设置背景色
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, downloadWidth, downloadHeight);

  // 绘制标题栏（如果有标题）
  if (title && titleBarHeight > 0) {
    // 不绘制背景色，直接绘制标题文字
    ctx.fillStyle = '#1F2937';
    // 指定多种字体，包括支持中文的字体
    ctx.font = `bold ${Math.floor(24 * dpiScale)}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, offsetX + contentWidth / 2, offsetY + titleBarHeight / 2);
  }

  // 绘制坐标轴（如果需要）
  if (showCoordinates) {
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.floor(statsFontSize * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // X轴坐标
    for (let i = 0; i < N; i++) {
      const textX = offsetX + extraLeftMargin + i * downloadCellSize + axisLabelSize + downloadCellSize / 2;
      const textY = offsetY + titleBarHeight + extraTopMargin + axisLabelSize / 2;
      ctx.fillText((i + 1).toString(), textX, textY);
    }

    // Y轴坐标
    for (let j = 0; j < M; j++) {
      const textX = offsetX + extraLeftMargin + axisLabelSize / 2;
      const textY = offsetY + titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize + downloadCellSize / 2;
      ctx.fillText((j + 1).toString(), textX, textY);
    }
  }

  // 计算字体大小用于单元格内文本
  const fontSize = Math.max(8 * dpiScale, Math.min(16 * dpiScale, downloadCellSize / 3));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 绘制所有单元格
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const cellData = mappedPixelData[j][i];
      const drawX = offsetX + extraLeftMargin + i * downloadCellSize + axisLabelSize;
      const drawY = offsetY + titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;

      if (cellData && !cellData.isExternal) {
        // 内部单元格：使用珠子颜色填充并绘制文本
        const cellColor = cellData.color || '#FFFFFF';
        const cellKey = getDisplayColorKey(cellData.color || '#FFFFFF', selectedColorSystem);

        ctx.fillStyle = cellColor;
        ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);

        ctx.fillStyle = getContrastColor(cellColor);
        ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2);
      } else {
        // 外部背景：填充白色
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);
      }

      // 绘制单元格边框
      ctx.strokeStyle = '#DDDDDD';
      ctx.lineWidth = 0.5 * dpiScale;
      ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize, downloadCellSize);
    }
  }

  // 绘制分隔网格线（如果需要）
  if (showGrid) {
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1.5 * dpiScale;

    // 垂直分隔线
    for (let i = gridInterval; i < N; i += gridInterval) {
      const lineX = offsetX + extraLeftMargin + i * downloadCellSize + axisLabelSize;
      ctx.beginPath();
      ctx.moveTo(lineX, offsetY + titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.lineTo(lineX, offsetY + titleBarHeight + extraTopMargin + axisLabelSize + M * downloadCellSize);
      ctx.stroke();
    }

    // 水平分隔线
    for (let j = gridInterval; j < M; j += gridInterval) {
      const lineY = offsetY + titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;
      ctx.beginPath();
      ctx.moveTo(offsetX + extraLeftMargin + axisLabelSize, lineY);
      ctx.lineTo(offsetX + extraLeftMargin + axisLabelSize + N * downloadCellSize, lineY);
      ctx.stroke();
    }
  }

  // 绘制统计信息（如果需要）
  if (includeStats && colorCounts) {
    const colorKeys = Object.keys(colorCounts);
    const sortedColorKeys = colorKeys.sort(sortColorKeys);

    // 调整统计区域的起始位置，使布局更紧凑
    const statsStartY = offsetY + titleBarHeight + extraTopMargin + gridHeight + axisLabelSize + 16 * dpiScale;
    const availableWidth = contentWidth - (statsPadding * 2);
    // 根据可用宽度自动计算列数
    const numColumns = Math.max(1, Math.min(4, Math.floor(availableWidth / (250 * dpiScale))));
    const swatchSize = Math.floor(18 * dpiScale + (widthFactor * 20 * dpiScale));

    // 统计标题 - 与Y轴坐标数字的左边对齐
    // Y轴坐标数字是居中显示的，所以要计算数字文本的左边位置
    let statsLeftAlign;
    if (showCoordinates) {
      // 计算最大Y轴坐标数字的宽度
      ctx.font = `${Math.floor(statsFontSize * 0.8)}px sans-serif`;
      const maxYNumber = M.toString();
      const numberWidth = ctx.measureText(maxYNumber).width;
      // Y轴坐标中心位置减去数字宽度的一半
      const yAxisCenterX = offsetX + extraLeftMargin + axisLabelSize / 2;
      statsLeftAlign = yAxisCenterX - numberWidth / 2;
    } else {
      statsLeftAlign = offsetX + statsPadding;
    }

    ctx.fillStyle = '#333333';
    ctx.font = `bold ${statsFontSize + 2 * dpiScale}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('珠子用量统计', statsLeftAlign, statsStartY);

    // 绘制颜色统计
    const itemStartY = statsStartY + 40 * dpiScale;
    const columnWidth = availableWidth / numColumns;

    ctx.font = `${statsFontSize}px sans-serif`;

    sortedColorKeys.forEach((colorKey, index) => {
      const colorData = colorCounts[colorKey];
      const column = index % numColumns;
      const row = Math.floor(index / numColumns);

      const itemX = statsLeftAlign + column * columnWidth;
      const itemY = itemStartY + row * 30 * dpiScale;

      // 绘制色块
      ctx.fillStyle = colorData.color;
      ctx.fillRect(itemX, itemY, swatchSize, swatchSize);

      ctx.strokeStyle = '#DDDDDD';
      ctx.lineWidth = 1;
      ctx.strokeRect(itemX, itemY, swatchSize, swatchSize);

      // 绘制文本
      ctx.fillStyle = '#333333';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      const displayKey = getDisplayColorKey(colorData.color, selectedColorSystem);
      // 使用支持中文的字体
      ctx.font = `${statsFontSize}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
      ctx.fillText(`${displayKey}: ${colorData.count}`, itemX + swatchSize + 8 * dpiScale, itemY + 2 * dpiScale);
    });

    // 总计
    const totalY = itemStartY + Math.ceil(sortedColorKeys.length / numColumns) * 30 * dpiScale + 20 * dpiScale;
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${statsFontSize + 1 * dpiScale}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
    ctx.fillText(`总计: ${totalBeadCount} 颗珠子`, statsLeftAlign, totalY);
  }

  // 返回PNG buffer
  return canvas.toBuffer('image/png');
}
