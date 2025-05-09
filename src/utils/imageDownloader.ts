import { GridDownloadOptions } from '../types/downloadTypes';
import { MappedPixel, PaletteColor } from './pixelation';

// 用于获取对比色的工具函数 - 从page.tsx复制
function getContrastColor(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return '#000000'; // Default to black
  // Simple brightness check (Luma formula Y = 0.2126 R + 0.7152 G + 0.0722 B)
  const luma = (0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b) / 255;
  return luma > 0.5 ? '#000000' : '#FFFFFF'; // Dark background -> white text, Light background -> black text
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

// 用于排序颜色键的函数 - 从page.tsx复制
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
      return prefixA.localeCompare(prefixB); // Sort by prefix first (A, B, C...)
    }
    return numA - numB; // Then sort by number (1, 2, 10...)
  }
  // Fallback for keys that don't match the standard pattern (e.g., T1, ZG1)
  return a.localeCompare(b);
}

// 下载图片的主函数
export function downloadImage({
  mappedPixelData,
  gridDimensions,
  colorCounts,
  totalBeadCount,
  options,
  activeBeadPalette,
  selectedPaletteKeySet
}: {
  mappedPixelData: MappedPixel[][] | null;
  gridDimensions: { N: number; M: number } | null;
  colorCounts: { [key: string]: { count: number; color: string } } | null;
  totalBeadCount: number;
  options: GridDownloadOptions;
  activeBeadPalette: PaletteColor[];
  selectedPaletteKeySet: string;
}): void {
  if (!mappedPixelData || !gridDimensions || gridDimensions.N === 0 || gridDimensions.M === 0 || activeBeadPalette.length === 0) {
    console.error("下载失败: 映射数据或尺寸无效。");
    alert("无法下载图纸，数据未生成或无效。");
    return;
  }
  if (!colorCounts) {
    console.error("下载失败: 色号统计数据无效。");
    alert("无法下载图纸，色号统计数据未生成或无效。");
    return;
  }
  
  // 加载二维码图片
  const qrCodeImage = new Image();
  qrCodeImage.src = '/website_qrcode.png'; // 使用public目录中的图片
  
  // 主要下载处理函数
  const processDownload = () => {
    const { N, M } = gridDimensions; // 此时已确保gridDimensions不为null
    const downloadCellSize = 30;
  
    // 从下载选项中获取设置
    const { showGrid, gridInterval, showCoordinates, gridLineColor, includeStats } = options;
  
    // 设置边距空间用于坐标轴标注（如果需要）
    const axisLabelSize = showCoordinates ? Math.max(30, Math.floor(downloadCellSize)) : 0;
    
    // 定义统计区域的基本参数
    const statsPadding = 20;
    let statsHeight = 0;
    
    // 预先计算用于字体大小的变量
    const preCalcWidth = N * downloadCellSize + axisLabelSize;
    const preCalcAvailableWidth = preCalcWidth - (statsPadding * 2);
    
    // 计算字体大小 - 与颜色统计区域保持一致
    const baseStatsFontSize = 13;
    const widthFactor = Math.max(0, preCalcAvailableWidth - 350) / 600;
    const statsFontSize = Math.floor(baseStatsFontSize + (widthFactor * 10));
    
    // 计算额外边距，确保坐标数字完全显示
    const extraLeftMargin = showCoordinates ? Math.max(20, statsFontSize * 2) : 0; // 左侧额外边距
    const extraTopMargin = showCoordinates ? Math.max(15, statsFontSize) : 0; // 顶部额外边距
    
    // 计算网格尺寸
    const gridWidth = N * downloadCellSize;
    const gridHeight = M * downloadCellSize;
  
    // 计算标题栏高度（根据图片大小自动调整）
    const baseTitleBarHeight = 80; // 增大基础高度
    
    // 先计算一个初始下载宽度来确定缩放比例
    const initialWidth = gridWidth + axisLabelSize + extraLeftMargin;
    // 使用总宽度而不是单元格大小来计算比例，确保字体在大尺寸图片上也足够大
    const titleBarScale = Math.max(1.0, Math.min(2.0, initialWidth / 1000)); // 更激进的缩放策略
    const titleBarHeight = Math.floor(baseTitleBarHeight * titleBarScale);
    
    // 计算标题文字大小 - 与总体宽度相关而不是单元格大小
    const titleFontSize = Math.max(28, Math.floor(28 * titleBarScale)); // 最小28px，确保可读性
    
    // 计算二维码大小
    const qrSize = Math.floor(titleBarHeight * 0.85); // 增大二维码比例
    
    // 计算统计区域的大小
    if (includeStats && colorCounts) {
      const colorKeys = Object.keys(colorCounts);
      
      // 统计区域顶部额外间距
      const statsTopMargin = 24; // 与下方渲染时保持一致
      
      // 根据可用宽度动态计算列数
      let numColumns = Math.max(1, Math.min(4, Math.floor(preCalcAvailableWidth / 250)));
      
      // 根据可用宽度动态计算样式参数，使用更积极的线性缩放
      const baseSwatchSize = 18; // 略微增大基础大小
      // baseStatsFontSize 和 statsFontSize 在前面已经计算了，这里不需要重复
      const baseItemPadding = 10;
      
      // 调整缩放公式，使大宽度更明显增大
      // widthFactor 在前面已经计算了，这里不需要重复
      const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 20)); // 增大最大增量幅度
      // statsFontSize 在前面已经计算了，这里不需要重复
      const itemPadding = Math.floor(baseItemPadding + (widthFactor * 12)); // 增大最大增量幅度
      
      // 计算实际需要的行数
      const numRows = Math.ceil(colorKeys.length / numColumns);
      
      // 计算单行高度 - 根据色块大小和内边距动态调整
      const statsRowHeight = Math.max(swatchSize + 8, 25);
      
      // 标题和页脚高度
      const titleHeight = 40; // 标题和分隔线的总高度
      const footerHeight = 40; // 总计部分的高度
      
      // 计算统计区域的总高度 - 需要包含顶部间距
      statsHeight = titleHeight + (numRows * statsRowHeight) + footerHeight + (statsPadding * 2) + statsTopMargin;
    }
  
    // 调整画布大小，包含标题栏、坐标轴和统计区域
    const downloadWidth = gridWidth + axisLabelSize + extraLeftMargin;
    let downloadHeight = titleBarHeight + gridHeight + axisLabelSize + statsHeight + extraTopMargin;
  
    let downloadCanvas = document.createElement('canvas');
    downloadCanvas.width = downloadWidth;
    downloadCanvas.height = downloadHeight;
    const context = downloadCanvas.getContext('2d');
    if (!context) {
      console.error("下载失败: 无法创建临时 Canvas Context。");
      alert("无法下载图纸。");
      return;
    }
    
    // 使用非空的context变量
    let ctx = context;
    ctx.imageSmoothingEnabled = false;
  
    // 设置背景色
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, downloadWidth, downloadHeight);
  
    // 绘制标题栏背景
    const gradientHeight = titleBarHeight;
    const gradient = ctx.createLinearGradient(0, 0, downloadWidth, 0); // 水平渐变更美观
    gradient.addColorStop(0, '#4F46E5'); // 靛蓝色 (indigo-600)
    gradient.addColorStop(0.5, '#7C3AED'); // 紫色 (violet-600)
    gradient.addColorStop(1, '#C026D3'); // 洋红色 (fuchsia-600)
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, downloadWidth, titleBarHeight);
    
    // 添加装饰元素 - 左侧圆点图案
    const dotSize = titleBarHeight / 20;
    const dotSpacing = titleBarHeight / 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    
    for (let y = dotSpacing; y < titleBarHeight - dotSpacing; y += dotSpacing) {
      for (let x = dotSpacing; x < titleBarHeight; x += dotSpacing) {
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
    // 添加右侧装饰线条
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    const lineOffset = downloadWidth / 3; // 线条从右三分之一处开始
    
    for (let i = 0; i < 3; i++) {
      const startX = lineOffset + (i * 60 * titleBarScale);
      ctx.beginPath();
      ctx.moveTo(startX, 0);
      ctx.lineTo(startX + titleBarHeight, titleBarHeight);
      ctx.stroke();
    }
    
    // 绘制标题文字
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `bold ${titleFontSize}px sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // 添加文字阴影效果
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 5;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    // 居中绘制标题
    ctx.fillText('七卡瓦 拼豆底稿生成器', titleBarHeight / 2, titleBarHeight / 2);
    
    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // 预留二维码位置
    const qrX = downloadWidth - qrSize - titleBarHeight / 4;
    const qrY = (titleBarHeight - qrSize) / 2;
    
    // 绘制二维码背景
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(qrX, qrY, qrSize, qrSize);
    
    // 绘制二维码图片或占位符
    if (qrCodeImage.complete && qrCodeImage.naturalWidth !== 0) {
      // 图片加载成功，绘制图片
      ctx.drawImage(qrCodeImage, qrX, qrY, qrSize, qrSize);
    } else {
      // 图片加载失败，绘制占位文字
      ctx.fillStyle = '#6D28D9'; // 紫色文字
      const qrFontSize = Math.max(14, Math.floor(14 * titleBarScale));
      ctx.font = `${qrFontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('扫码访问', qrX + qrSize / 2, qrY + qrSize / 2);
    }
  
    console.log(`Generating download grid image: ${downloadWidth}x${downloadHeight}`);
    const fontSize = Math.max(8, Math.floor(downloadCellSize * 0.4));
    
    // 如果需要，先绘制坐标轴和网格背景
    if (showCoordinates) {
      // 绘制坐标轴背景
      ctx.fillStyle = '#F5F5F5'; // 浅灰色背景
      // 横轴背景 (顶部)
      ctx.fillRect(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin, gridWidth, axisLabelSize);
      // 纵轴背景 (左侧)
      ctx.fillRect(extraLeftMargin, titleBarHeight + extraTopMargin + axisLabelSize, axisLabelSize, gridHeight);
      
      // 绘制坐标轴数字
      ctx.fillStyle = '#333333'; // 坐标数字颜色
      // 使用与颜色统计区域相同的字体大小，但不使用粗体
      const axisFontSize = statsFontSize;
      ctx.font = `${axisFontSize}px sans-serif`;

      // X轴（顶部）数字
      ctx.textAlign = 'center';
      for (let i = 0; i < N; i++) {
        if ((i + 1) % gridInterval === 0 || i === 0 || i === N - 1) { // 在间隔处、起始处和结束处标注
          // 将数字放在轴线之上，考虑额外边距
          const numX = extraLeftMargin + axisLabelSize + (i * downloadCellSize) + (downloadCellSize / 2);
          const numY = titleBarHeight + extraTopMargin + (axisLabelSize / 2);
          ctx.fillText((i + 1).toString(), numX, numY);
        }
      }
      
      // Y轴（左侧）数字
      ctx.textAlign = 'right';
      for (let j = 0; j < M; j++) {
        if ((j + 1) % gridInterval === 0 || j === 0 || j === M - 1) { // 在间隔处、起始处和结束处标注
          // 将数字放在轴线之左，留出间距并考虑额外边距
          const numX = extraLeftMargin + axisLabelSize - 8;
          const numY = titleBarHeight + extraTopMargin + axisLabelSize + (j * downloadCellSize) + (downloadCellSize / 2);
          ctx.fillText((j + 1).toString(), numX, numY);
        }
      }
      
      // 绘制坐标轴边框
      ctx.strokeStyle = '#AAAAAA';
      ctx.lineWidth = 1;
      // 横轴底边
      ctx.beginPath();
      ctx.moveTo(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.lineTo(extraLeftMargin + axisLabelSize + gridWidth, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.stroke();
      // 纵轴右侧边
      ctx.beginPath();
      ctx.moveTo(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize);
      ctx.lineTo(extraLeftMargin + axisLabelSize, titleBarHeight + extraTopMargin + axisLabelSize + gridHeight);
      ctx.stroke();
    }
    
    // 恢复默认文本对齐和基线，为后续绘制做准备
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 设置用于绘制单元格内容的字体
    ctx.font = `bold ${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 绘制所有单元格
    for (let j = 0; j < M; j++) {
      for (let i = 0; i < N; i++) {
        const cellData = mappedPixelData[j][i];
        // 计算绘制位置，考虑额外边距和标题栏高度
        const drawX = extraLeftMargin + i * downloadCellSize + axisLabelSize;
        const drawY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;

        // 根据是否是外部背景确定填充颜色
        if (cellData && !cellData.isExternal) {
          // 内部单元格：使用珠子颜色填充并绘制文本
          const cellColor = cellData.color || '#FFFFFF';
          const cellKey = cellData.key || '?';

          ctx.fillStyle = cellColor;
          ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);

          ctx.fillStyle = getContrastColor(cellColor);
          ctx.fillText(cellKey, drawX + downloadCellSize / 2, drawY + downloadCellSize / 2);
        } else {
          // 外部背景：填充白色
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(drawX, drawY, downloadCellSize, downloadCellSize);
        }

        // 绘制所有单元格的边框
        ctx.strokeStyle = '#DDDDDD'; // 浅色线条作为基础网格
        ctx.lineWidth = 0.5;
        ctx.strokeRect(drawX + 0.5, drawY + 0.5, downloadCellSize, downloadCellSize);
      }
    }

    // 如果需要，绘制分隔网格线
    if (showGrid) {
      ctx.strokeStyle = gridLineColor; // 使用用户选择的颜色
      ctx.lineWidth = 1.5;
      
      // 绘制垂直分隔线 - 在单元格之间而不是边框上
      for (let i = gridInterval; i < N; i += gridInterval) {
        const lineX = extraLeftMargin + i * downloadCellSize + axisLabelSize;
        ctx.beginPath();
        ctx.moveTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize);
        ctx.lineTo(lineX, titleBarHeight + extraTopMargin + axisLabelSize + M * downloadCellSize);
        ctx.stroke();
      }
      
      // 绘制水平分隔线 - 在单元格之间而不是边框上
      for (let j = gridInterval; j < M; j += gridInterval) {
        const lineY = titleBarHeight + extraTopMargin + j * downloadCellSize + axisLabelSize;
        ctx.beginPath();
        ctx.moveTo(extraLeftMargin + axisLabelSize, lineY);
        ctx.lineTo(extraLeftMargin + axisLabelSize + N * downloadCellSize, lineY);
        ctx.stroke();
      }
    }

    // 绘制整个网格区域的主边框
    ctx.strokeStyle = '#000000'; // 黑色边框
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      extraLeftMargin + axisLabelSize + 0.5, 
      titleBarHeight + extraTopMargin + axisLabelSize + 0.5, 
      N * downloadCellSize, 
      M * downloadCellSize
    );

    // 绘制统计信息
    if (includeStats && colorCounts) {
      const colorKeys = Object.keys(colorCounts).sort(sortColorKeys);
      
      // 增加额外的间距，防止标题文字侵入画布
      const statsTopMargin = 24; // 增加间距，防止文字侵入画布
      const statsY = titleBarHeight + extraTopMargin + M * downloadCellSize + axisLabelSize + statsPadding + statsTopMargin;
      
      // 计算统计区域的可用宽度
      const availableStatsWidth = downloadWidth - (statsPadding * 2);
      
      // 根据可用宽度动态计算列数 - 这里使用实际渲染时的宽度
      const renderNumColumns = Math.max(1, Math.min(4, Math.floor(availableStatsWidth / 250)));
      
      // 根据可用宽度动态计算样式参数，使用更积极的线性缩放
      const baseSwatchSize = 18; // 略微增大基础大小
      // baseStatsFontSize 和 statsFontSize 在前面已经计算了，这里不需要重复
      const baseItemPadding = 10;
      
      // 调整缩放公式，使大宽度更明显增大
      // widthFactor 在前面已经计算了，这里不需要重复
      const swatchSize = Math.floor(baseSwatchSize + (widthFactor * 20)); // 增大最大增量幅度
      // statsFontSize 在前面已经计算了，这里不需要重复
      const itemPadding = Math.floor(baseItemPadding + (widthFactor * 12)); // 增大最大增量幅度
      
      // 计算每个项目所占的宽度
      const itemWidth = Math.floor(availableStatsWidth / renderNumColumns);
      
      // 绘制统计区域标题
      ctx.fillStyle = '#333333';
      ctx.font = `bold ${Math.max(16, statsFontSize)}px sans-serif`;
      ctx.textAlign = 'left';
      
      // 绘制分隔线
      ctx.strokeStyle = '#DDDDDD';
      ctx.beginPath();
      ctx.moveTo(statsPadding, statsY + 20);
      ctx.lineTo(downloadWidth - statsPadding, statsY + 20);
      ctx.stroke();
      
      const titleHeight = 30; // 标题和分隔线的总高度
      // 根据色块大小动态调整行高
      const statsRowHeight = Math.max(swatchSize + 8, 25); // 确保行高足够放下色块和文字
      
      // 设置表格字体
      ctx.font = `${statsFontSize}px sans-serif`;
      
      // 绘制每行统计信息
      colorKeys.forEach((key, index) => {
        // 计算当前项目应该在哪一行和哪一列
        const rowIndex = Math.floor(index / renderNumColumns);
        const colIndex = index % renderNumColumns;
        
        // 计算当前项目的X起始位置
        const itemX = statsPadding + (colIndex * itemWidth);
        
        // 计算当前行的Y位置
        const rowY = statsY + titleHeight + (rowIndex * statsRowHeight) + (swatchSize / 2);
        
        const cellData = colorCounts[key];
        
        // 绘制色块
        ctx.fillStyle = cellData.color;
        ctx.strokeStyle = '#CCCCCC';
        ctx.fillRect(itemX, rowY - (swatchSize / 2), swatchSize, swatchSize);
        ctx.strokeRect(itemX + 0.5, rowY - (swatchSize / 2) + 0.5, swatchSize - 1, swatchSize - 1);
        
        // 绘制色号
        ctx.fillStyle = '#333333';
        ctx.textAlign = 'left';
        ctx.fillText(key, itemX + swatchSize + 5, rowY);
        
        // 绘制数量 - 在每个项目的右侧
        const countText = `${cellData.count} 颗`;
        ctx.textAlign = 'right';
        
        // 根据列数计算数字的位置
        // 如果只有一列，就靠右绘制
        if (renderNumColumns === 1) {
          ctx.fillText(countText, downloadWidth - statsPadding, rowY);
        } else {
          // 多列时，在每个单元格右侧偏内绘制
          ctx.fillText(countText, itemX + itemWidth - itemPadding, rowY);
        }
      });
      
      // 计算实际需要的行数
      const numRows = Math.ceil(colorKeys.length / renderNumColumns);
      
      // 绘制总量
      const totalY = statsY + titleHeight + (numRows * statsRowHeight) + 10;
      ctx.font = `bold ${statsFontSize}px sans-serif`;
      ctx.textAlign = 'right';
      ctx.fillText(`总计: ${totalBeadCount} 颗`, downloadWidth - statsPadding, totalY);
      
      // 更新统计区域高度的计算 - 需要包含新增的顶部间距
      const footerHeight = 30; // 总计部分高度
      statsHeight = titleHeight + (numRows * statsRowHeight) + footerHeight + (statsPadding * 2) + statsTopMargin;
    }

    // 重新计算画布高度并调整
    if (includeStats && colorCounts) {
      // 调整画布大小，包含计算后的统计区域
      const newDownloadHeight = titleBarHeight + extraTopMargin + M * downloadCellSize + axisLabelSize + statsHeight;
      
      if (downloadHeight !== newDownloadHeight) {
        // 如果高度变化了，需要创建新的画布并复制当前内容
        const newCanvas = document.createElement('canvas');
        newCanvas.width = downloadWidth;
        newCanvas.height = newDownloadHeight;
        const newContext = newCanvas.getContext('2d');
        
        if (newContext) {
          // 复制原画布内容
          newContext.drawImage(downloadCanvas, 0, 0);
          
          // 更新画布和上下文引用
          downloadCanvas = newCanvas;
          ctx = newContext;
          ctx.imageSmoothingEnabled = false;
          
          // 更新高度
          downloadHeight = newDownloadHeight;
        }
      }
    }

    try {
      const dataURL = downloadCanvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `bead-grid-${N}x${M}-keys-palette_${selectedPaletteKeySet}.png`; // 文件名包含调色板
      link.href = dataURL;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      console.log("Grid image download initiated.");
    } catch (e) {
      console.error("下载图纸失败:", e);
      alert("无法生成图纸下载链接。");
    }
  };
  
  // 图片加载后处理，或在加载失败时使用占位符
  if (qrCodeImage.complete) {
    processDownload();
  } else {
    qrCodeImage.onload = processDownload;
    qrCodeImage.onerror = () => {
      console.warn("二维码图片加载失败，将使用占位符");
      processDownload();
    };
  }
} 