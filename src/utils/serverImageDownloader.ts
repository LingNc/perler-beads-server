// 服务器端图片生成器 - 基于 imageDownloader.ts 适配
import { DownloadImage } from '../types/downloadTypes';
import { createCanvas } from 'canvas';
import { getContrastColor, sortColorKeys } from './imageDownloader';
import { calculateColorCounts, filterColorCountsForBeadUsage } from './apiUtils';

// 服务器端下载图片的主函数 - 返回 Buffer 而不是下载文件
export async function generateImageBuffer({
  title,
  pixelData,
  renderMode,
  options
}: DownloadImage): Promise<Buffer> {

  if (!pixelData || !pixelData.mappedData || !pixelData.width || !pixelData.height || pixelData.width === 0 || pixelData.height === 0) {
    throw new Error("下载失败: 像素数据或尺寸无效。");
  }

  const mappedPixelData = pixelData.mappedData;
  const N = pixelData.width;
  const M = pixelData.height;

  // 统计色号
  let colorCounts = calculateColorCounts(mappedPixelData);

  // 根据是否显示透明标签过滤统计数据
  const { filteredCounts, filteredTotal } = filterColorCountsForBeadUsage(
    colorCounts,
    !options.showTransparentLabels
  );
  // 使用过滤后的统计数据
  colorCounts = filteredCounts;
  const totalBeadCount = filteredTotal;

  // 从下载选项中获取设置
  const {
    showGrid,
    gridInterval,
    showCoordinates,
    gridLineColor,
    outerBorderColor,
    includeStats,
    dpi = 150, // 设置默认值
    fixedWidth,
    showTransparentLabels
  } = options;


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
  const titleBarHeight = title ? 80 * dpiScale : 0; // 减小高度，使布局更紧凑  // 计算统计区域的大小
  if (includeStats && colorCounts) {
    const colorKeys = Object.keys(colorCounts);
    const statsTopMargin = 24 * dpiScale;
    // const finalWidth = gridWidth + axisLabelSize + extraLeftMargin + extraRightMargin;
    // const availableStatsWidth = finalWidth - (statsPadding * 2);

    // 色块的基础尺寸（适中大小以容纳文字）
    const baseSwatchSize = Math.max(24 * dpiScale, 28 * dpiScale);
    const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 10 * dpiScale)); // 减小增长幅度

    // 动态计算实际需要的文字宽度
    const baseFontSize = Math.max(10 * dpiScale, statsFontSize);
    // 预估最大数字的宽度（假设最大数值为4位数）
    const estimatedTextWidth = Math.max(60 * dpiScale, baseFontSize * 4);
    const itemTotalWidth = swatchSize + 12 * dpiScale + estimatedTextWidth; // 增加间距

    // 根据网格宽度动态计算列数，确保不会太紧密
    const statsAvailableWidth = gridWidth;
    const numColumns = Math.max(1, Math.floor(statsAvailableWidth / itemTotalWidth));
    const numRows = Math.ceil(colorKeys.length / numColumns);

    // 优化行高计算，确保有足够空间
    const statsRowHeight = swatchSize + 16 * dpiScale; // 增加行间距防止覆盖
    const titleHeight = 2 * (statsFontSize + 2 * dpiScale); // 匹配实际的 itemStartY 计算
    const footerHeight = 30 * dpiScale; // 总计部分的高度，与 totalY 后的额外空间匹配
    // const bottomMargin = 30 * dpiScale; // 底部额外边距，确保总计文字不被截断
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

    // X轴坐标 - 只在网格间隔处显示，从第一个间隔开始
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let i = gridInterval; i <= N; i += gridInterval) {
      if (i <= N) { // 确保不超过边界
        const textX = offsetX + extraLeftMargin + (i - 1) * downloadCellSize + axisLabelSize + downloadCellSize / 2;
        const textY = offsetY + titleBarHeight + extraTopMargin + axisLabelSize / 2;
        ctx.fillText(i.toString(), textX, textY);
      }
    }

    // Y轴坐标 - 只在网格间隔处显示，从第一个间隔开始，右对齐避免被格子遮挡
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let j = gridInterval; j <= M; j += gridInterval) {
      if (j <= M) { // 确保不超过边界
        const textX = offsetX + extraLeftMargin + axisLabelSize - 5 * dpiScale; // 右对齐并留出间距
        const textY = offsetY + titleBarHeight + extraTopMargin + (j - 1) * downloadCellSize + axisLabelSize + downloadCellSize / 2;
        ctx.fillText(j.toString(), textX, textY);
      }
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
        const cellKey = cellData.key; // 直接使用像素数据中的 key

        ctx.fillStyle = cellColor;
        ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);

        // 检查是否是透明色，以及是否应该显示字体
        const isTransparent = cellKey === 'T01' || cellKey === 'ERASE';
        const shouldShowLabel = !isTransparent || (isTransparent && showTransparentLabels);

        if (shouldShowLabel) {
          ctx.fillStyle = getContrastColor(cellColor);
          ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2);
        }
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
    ctx.strokeStyle = gridLineColor || '#141414'; // 默认使用纯黑色
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

  // 绘制网格外边框
  if (outerBorderColor) {
    ctx.strokeStyle = outerBorderColor;
    ctx.lineWidth = 2 * dpiScale; // 较粗的外边框

    const borderX = offsetX + extraLeftMargin + axisLabelSize;
    const borderY = offsetY + titleBarHeight + extraTopMargin + axisLabelSize;
    const borderWidth = N * downloadCellSize;
    const borderHeight = M * downloadCellSize;

    ctx.strokeRect(borderX, borderY, borderWidth, borderHeight);
  }  // 绘制统计信息（如果需要）
  if (includeStats && colorCounts) {
    const colorKeys = Object.keys(colorCounts);
    // 按色号排序（恢复原有排序方式）
    const sortedColorKeys = colorKeys.sort(sortColorKeys);

    // 调整统计区域的起始位置，使布局更紧凑
    const statsStartY = offsetY + titleBarHeight + extraTopMargin + gridHeight + axisLabelSize + 16 * dpiScale;
    const availableWidth = contentWidth - (statsPadding * 2);

    // 色块的基础尺寸（适中大小以容纳文字）
    const baseSwatchSize = Math.max(24 * dpiScale, 28 * dpiScale);
    const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 10 * dpiScale)); // 减小增长幅度

    // 优化统计项宽度计算 - 动态计算实际需要的文字宽度
    ctx.font = `${Math.max(10 * dpiScale, statsFontSize)}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
    let maxTextWidth = 0;
    sortedColorKeys.forEach(colorKey => {
      const colorData = colorCounts[colorKey];
      const textWidth = ctx.measureText(`${colorData.count}`).width;
      maxTextWidth = Math.max(maxTextWidth, textWidth);
    });

    // 每个统计项的总宽度（色块 + 间距 + 实际文字宽度 + 额外边距）
    const itemTotalWidth = swatchSize + 12 * dpiScale + maxTextWidth + 20 * dpiScale; // 增加间距

    // 根据可用宽度动态计算列数，确保不会太紧密
    const numColumns = Math.max(1, Math.floor(availableWidth / itemTotalWidth));

    // 统计标题 - 与网格左边对齐
    const gridLeftEdge = offsetX + extraLeftMargin + axisLabelSize;
    const statsLeftAlign = gridLeftEdge;

    ctx.fillStyle = '#333333';
    ctx.font = `bold ${statsFontSize + 2 * dpiScale}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('豆子用量统计', statsLeftAlign, statsStartY);

    // 绘制颜色统计 - 增加标题到色块的间距
    const itemStartY = statsStartY + 2*(statsFontSize+2*dpiScale); // 增加标题到内容的间距，防止覆盖

    // 重新计算可用宽度，确保不会超出边界
    const statsAreaWidth = gridWidth; // 使用网格宽度作为统计区域宽度
    const actualColumnWidth = Math.floor(statsAreaWidth / numColumns);

    // 计算色块内文字的字体大小 - 增大文字大小以提高可读性
    const swatchFontSize = Math.max(10 * dpiScale, Math.min(16 * dpiScale, swatchSize / 3));
    const countFontSize = Math.max(10 * dpiScale, statsFontSize);

    sortedColorKeys.forEach((colorKey, index) => {
      const colorData = colorCounts[colorKey];
      const column = index % numColumns;
      const row = Math.floor(index / numColumns);

      // 统计项与网格左边对齐
      const itemX = gridLeftEdge + column * actualColumnWidth;
      const itemY = itemStartY + row * (swatchSize + 16 * dpiScale); // 增加行间距防止覆盖

      // 绘制色块
      ctx.fillStyle = colorData.color;
      ctx.fillRect(itemX, itemY, swatchSize, swatchSize);

      // 绘制色块边框
      ctx.strokeStyle = '#DDDDDD';
      ctx.lineWidth = 1;
      ctx.strokeRect(itemX, itemY, swatchSize, swatchSize);

      // 在色块内绘制颜色代码 - colorKey就是色号
      ctx.fillStyle = getContrastColor(colorData.color);
      ctx.font = `bold ${swatchFontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(colorKey, itemX + swatchSize / 2, itemY + swatchSize / 2);

      // 在右侧绘制数量，垂直居中对齐
      ctx.fillStyle = '#333333';
      ctx.font = `${countFontSize}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle'; // 垂直居中
      ctx.fillText(`${colorData.count}`, itemX + swatchSize + 12 * dpiScale, itemY + swatchSize / 2);
    });

    // 总计 - 确保有足够的空间，与网格左边对齐
    const totalY = itemStartY + Math.ceil(sortedColorKeys.length / numColumns) * (swatchSize + 16 * dpiScale); // 增加间距
    ctx.fillStyle = '#333333';
    ctx.font = `bold ${statsFontSize + 1 * dpiScale}px "Noto Sans CJK SC", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(`总计: ${totalBeadCount} 颗`, gridLeftEdge, totalY);
  }

  // 返回PNG buffer
  return canvas.toBuffer('image/png');
}
