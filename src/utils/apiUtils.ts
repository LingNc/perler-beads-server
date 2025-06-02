// API工具函数
import { createCanvas, loadImage, Image } from 'canvas';
import { calculatePixelGrid, PixelationMode, PaletteColor, MappedPixel, hexToRgb } from './pixelation';
import { getMardToHexMapping } from './colorSystemUtils';
import type { ColorSystem } from './pixelation';

// 获取调色板数据
export function getPaletteByName(paletteName: string = '168色'): PaletteColor[] {
  const mardToHexMapping = getMardToHexMapping();

  // 从colorSystemMapping.json获取所有MARD色号并转换为PaletteColor格式
  const fullBeadPalette: PaletteColor[] = Object.entries(mardToHexMapping)
    .map(([mardKey, hex]) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return null;
      return { key: hex, hex, rgb };
    })
    .filter((color): color is PaletteColor => color !== null);

  return fullBeadPalette;
}

// 计算颜色统计
export function calculateColorCounts(pixelData: MappedPixel[][]): { [key: string]: { count: number; color: string } } {
  const colorCounts: { [key: string]: { count: number; color: string } } = {};

  for (const row of pixelData) {
    for (const pixel of row) {
      if (colorCounts[pixel.key]) {
        colorCounts[pixel.key].count++;
      } else {
        colorCounts[pixel.key] = {
          count: 1,
          color: pixel.color
        };
      }
    }
  }

  return colorCounts;
}

// 从Buffer创建Canvas图像
export async function createImageFromBuffer(buffer: Buffer): Promise<{ image: Image; canvas: any; ctx: any }> {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  return { image, canvas, ctx };
}

// 验证API参数
export function validateConvertParams(params: any): { isValid: boolean; error?: string } {
  const { granularity, similarityThreshold, pixelationMode } = params;

  if (granularity && (isNaN(granularity) || granularity < 1 || granularity > 200)) {
    return { isValid: false, error: '粒度参数必须在1-200之间' };
  }

  if (similarityThreshold && (isNaN(similarityThreshold) || similarityThreshold < 0 || similarityThreshold > 100)) {
    return { isValid: false, error: '相似度阈值必须在0-100之间' };
  }

  if (pixelationMode && !Object.values(PixelationMode).includes(pixelationMode)) {
    return { isValid: false, error: '无效的像素化模式' };
  }

  return { isValid: true };
}

// 生成文件名
export function generateFilename(params: any): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const { granularity, pixelationMode, selectedPalette } = params;
  return `perler-beads-${granularity}px-${pixelationMode}-${selectedPalette}-${timestamp}`;
}
