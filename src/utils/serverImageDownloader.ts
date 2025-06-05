// 服务器端图片生成器 - 基于 imageDownloader.ts 适配
import { GridDownloadOptions } from '../types/downloadTypes';
import { MappedPixel, PaletteColor } from './pixelation';
import { getDisplayColorKey, getColorKeyByHex, ColorSystem } from './colorSystemUtils';
import { createCanvas, loadImage, CanvasRenderingContext2D } from 'canvas';
import fs from 'fs';
import path from 'path';

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

// Node.js Canvas 的 roundRect 兼容性实现
function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// 服务器端下载图片的主函数 - 返回 Buffer 而不是下载文件
export async function generateImageBuffer({
  mappedPixelData,
  gridDimensions,
  colorCounts,
  totalBeadCount,
  options,
  activeBeadPalette,
  selectedColorSystem
}: {
  mappedPixelData: MappedPixel[][] | null;
  gridDimensions: { N: number; M: number } | null;
  colorCounts: { [key: string]: { count: number; color: string } } | null;
  totalBeadCount: number;
  options: GridDownloadOptions;
  activeBeadPalette: PaletteColor[];
  selectedColorSystem: ColorSystem;
}): Promise<Buffer> {

  if (!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0 || activeBeadPalette.length === 0) {
    throw new Error("下载失败: 映射数据或尺寸无效。");
  }
  if (!colorCounts) {
    throw new Error("下载失败: 色号统计数据无效。");
  }

  const { N, M } = gridDimensions;
  const downloadCellSize = 30;

  // 从下载选项中获取设置
  const { showGrid, gridInterval, showCoordinates, gridLineColor, includeStats } = options;

  // 设置边距空间用于坐标轴标注（如果需要）
  const axisLabelSize = showCoordinates ? Math.max(30, Math.floor(downloadCellSize)) : 0;

  // 定义统计区域的基本参数
  const statsPadding = 20;
  let statsHeight = 0;

  // 计算字体大小的基础值（先使用临时值）
  const baseStatsFontSize = 13;
  const preliminaryWidth = N * downloadCellSize + axisLabelSize;
  const preliminaryAvailableWidth = preliminaryWidth - (statsPadding * 2);
  const widthFactor = Math.max(0, preliminaryAvailableWidth - 350) / 600;
  const statsFontSize = Math.floor(baseStatsFontSize + (widthFactor * 10));

  // 计算额外边距，确保坐标数字完全显示
  const extraLeftMargin = showCoordinates ? Math.max(20, statsFontSize * 2) : 0;
  const extraRightMargin = showCoordinates ? Math.max(20, statsFontSize * 2) : 20; // 添加右边距以平衡布局
  const extraTopMargin = showCoordinates ? Math.max(15, statsFontSize) : 0;

  // 计算网格尺寸
  const gridWidth = N * downloadCellSize;
  const gridHeight = M * downloadCellSize;

  // 计算小红书标识区域的高度
  const xiaohongshuAreaHeight = 35;

  // 计算标题栏高度
  const baseTitleBarHeight = 80;
  const initialWidth = gridWidth + axisLabelSize + extraLeftMargin + extraRightMargin;
  const titleBarScale = Math.max(1.0, Math.min(2.0, initialWidth / 1000));
  const titleBarHeight = Math.floor(baseTitleBarHeight * titleBarScale);

  // 计算标题文字大小
  const titleFontSize = Math.max(28, Math.floor(28 * titleBarScale));

  // 计算二维码大小
  const qrSize = Math.floor(titleBarHeight * 0.85);

  // 计算统计区域的大小
  if (includeStats && colorCounts) {
    const colorKeys = Object.keys(colorCounts);
    const statsTopMargin = 24;
    // 使用最终的宽度来计算统计区域
    const finalWidth = gridWidth + axisLabelSize + extraLeftMargin + extraRightMargin;
    const availableStatsWidth = finalWidth - (statsPadding * 2);
    const numColumns = Math.max(1, Math.min(4, Math.floor(availableStatsWidth / 250)));
    const baseSwatchSize = 18;
    const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 20));
    const numRows = Math.ceil(colorKeys.length / numColumns);
    const statsRowHeight = Math.max(swatchSize + 8, 25);
    const titleHeight = 40;
    const footerHeight = 40;
    statsHeight = titleHeight + (numRows * statsRowHeight) + footerHeight + (statsPadding * 2) + statsTopMargin;
  }

  // 调整画布大小
  const downloadWidth = gridWidth + axisLabelSize + extraLeftMargin + extraRightMargin;
  const downloadHeight = titleBarHeight + gridHeight + axisLabelSize + statsHeight + extraTopMargin + xiaohongshuAreaHeight;

  // 创建 Node.js Canvas
  const canvas = createCanvas(downloadWidth, downloadHeight);
  const ctx = canvas.getContext('2d');

  // 设置背景色
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, downloadWidth, downloadHeight);

  // 绘制标题栏
  ctx.fillStyle = '#1F2937';
  ctx.fillRect(0, 0, downloadWidth, titleBarHeight);

  // 左侧品牌色块
  const brandBlockWidth = titleBarHeight * 0.8;
  const brandGradient = ctx.createLinearGradient(0, 0, brandBlockWidth, titleBarHeight);
  brandGradient.addColorStop(0, '#6366F1');
  brandGradient.addColorStop(1, '#8B5CF6');

  ctx.fillStyle = brandGradient;
  ctx.fillRect(0, 0, brandBlockWidth, titleBarHeight);

  // 绘制现代Logo
  const logoSize = titleBarHeight * 0.4;
  const logoX = brandBlockWidth / 2;
  const logoY = titleBarHeight / 2;

  ctx.fillStyle = '#FFFFFF';
  const beadSize = logoSize / 4;
  const beadSpacing = beadSize * 1.2;

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const beadX = logoX - logoSize/2 + col * beadSpacing;
      const beadY = logoY - logoSize/2 + row * beadSpacing;

      // 绘制圆角方块
      drawRoundRect(ctx, beadX, beadY, beadSize, beadSize, beadSize * 0.2);
      ctx.fill();

      // 添加中心小圆点
      ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.beginPath();
      ctx.arc(beadX + beadSize/2, beadY + beadSize/2, beadSize * 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#FFFFFF';
    }
  }

  // 主标题
  const mainTitleFontSize = Math.max(20, Math.floor(titleFontSize * 0.8));
  const subTitleFontSize = Math.max(12, Math.floor(titleFontSize * 0.45));

  ctx.fillStyle = '#FFFFFF';
  ctx.font = `600 ${mainTitleFontSize}px sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const titleStartX = brandBlockWidth + titleBarHeight * 0.3;
  const mainTitleY = titleBarHeight * 0.4;

  ctx.fillText('七卡瓦', titleStartX, mainTitleY);

  // 副标题
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.font = `400 ${subTitleFontSize}px sans-serif`;
  const subTitleY = titleBarHeight * 0.65;
  ctx.fillText('拼豆图纸生成器', titleStartX, subTitleY);

  // 尝试加载并绘制二维码
  try {
    const qrCodePath = path.join(process.cwd(), 'public', 'website_qrcode.png');
    if (fs.existsSync(qrCodePath)) {
      const qrCodeImage = await loadImage(qrCodePath);
      const qrX = downloadWidth - qrSize - 15;
      const qrY = (titleBarHeight - qrSize) / 2;
      ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);
    }
  } catch (error) {
    console.warn('二维码加载失败:', error);
  }

  // 绘制坐标轴（如果需要）
  if (showCoordinates) {
    ctx.fillStyle = '#666666';
    ctx.font = `${Math.floor(statsFontSize * 0.8)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // X轴坐标
    for (let i = 0; i < N; i++) {
      const textX = extraLeftMargin + i * downloadCellSize + axisLabelSize + downloadCellSize / 2;
      const textY = titleBarHeight + extraTopMargin + axisLabelSize / 2;
      ctx.fillText((i + 1).toString(), textX, textY);
    }

    // Y轴坐标
    ctx.textAlign = 'center';
    for (let j = 0; j < M; j++) {
      const textX = extraLeftMargin + axisLabelSize / 2;
      const textY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize + downloadCellSize / 2;
      ctx.fillText((j + 1).toString(), textX, textY);
    }
  }

  // 计算字体大小用于单元格内文本
  const fontSize = Math.max(8, Math.min(16, downloadCellSize / 3));
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 绘制所有单元格
  for (let j = 0; j < M; j++) {
    for (let i = 0; i < N; i++) {
      const cellData = mappedPixelData[j][i];
      const drawX = extraLeftMargin + i * downloadCellSize + axisLabelSize;
      const drawY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;

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
      ctx.lineWidth = 0.5;
      ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize, downloadCellSize);
    }
  }

  // 绘制分隔网格线（如果需要）
  if (showGrid) {
    ctx.strokeStyle = gridLineColor;
    ctx.lineWidth = 1.5;

    // 垂直分隔线
    for (let i = gridInterval; i < N; i += gridInterval) {
      const lineX = extraLeftMargin + i * downloadCellSize + axisLabelSize;
      ctx.beginPath();
      ctx.moveTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.lineTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize + M * downloadCellSize);
      ctx.stroke();
    }

    // 水平分隔线
    for (let j = gridInterval; j < M; j += gridInterval) {
      const lineY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;
      ctx.beginPath();
      ctx.moveTo(extraLeftMargin + axisLabelSize, lineY);
      ctx.lineTo(extraLeftMargin + axisLabelSize + N * downloadCellSize, lineY);
      ctx.stroke();
    }
  }

  // 绘制统计信息（如果需要）
  if (includeStats && colorCounts) {
    const colorKeys = Object.keys(colorCounts);
    const sortedColorKeys = colorKeys.sort(sortColorKeys);

    const statsStartY = titleBarHeight + extraTopMargin + gridHeight + axisLabelSize + 24;
    const availableWidth = downloadWidth - (statsPadding * 2);
    const numColumns = Math.max(1, Math.min(4, Math.floor(availableWidth / 250)));
    const swatchSize = Math.floor(18 + (widthFactor * 20));

    // 统计标题
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${statsFontSize + 2}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('珠子用量统计', statsPadding, statsStartY);

    // 绘制颜色统计
    const itemStartY = statsStartY + 40;
    const columnWidth = availableWidth / numColumns;

    ctx.font = `${statsFontSize}px sans-serif`;

    sortedColorKeys.forEach((colorKey, index) => {
      const colorData = colorCounts[colorKey];
      const column = index % numColumns;
      const row = Math.floor(index / numColumns);

      const itemX = statsPadding + column * columnWidth;
      const itemY = itemStartY + row * 30;

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
      ctx.fillText(`${displayKey}: ${colorData.count}`, itemX + swatchSize + 8, itemY + 2);
    });

    // 总计
    const totalY = itemStartY + Math.ceil(sortedColorKeys.length / numColumns) * 30 + 20;
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${statsFontSize + 1}px sans-serif`;
    ctx.fillText(`总计: ${totalBeadCount} 颗珠子`, statsPadding, totalY);
  }

  // 绘制小红书标识
  const xiaohongshuY = downloadHeight - xiaohongshuAreaHeight + 10;
  ctx.fillStyle = '#999999';
  ctx.font = `${Math.max(12, Math.floor(titleFontSize * 0.4))}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('@七卡瓦', downloadWidth / 2, xiaohongshuY);

  // 返回PNG buffer
  return canvas.toBuffer('image/png');
}
