// API工具函数
import { createCanvas, loadImage, Image } from 'canvas';
import { calculatePixelGrid, PixelationMode, PaletteColor, MappedPixel, hexToRgb } from './pixelation';
import { getMardToHexMapping } from './colorSystemUtils';
import type { ColorSystem } from './pixelation';

// 获取调色板数据
export function getPaletteByName(paletteName: string = '291色'): PaletteColor[] {
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

// 解析自定义调色板
export function parseCustomPalette(customPaletteData: any): PaletteColor[] {
  // 支持新格式：{ version: "3.0", selectedHexValues: ["#RRGGBB", ...], exportDate: "...", totalColors: N }
  if (customPaletteData && typeof customPaletteData === 'object' && customPaletteData.selectedHexValues) {
    const { selectedHexValues, version, totalColors } = customPaletteData;

    if (!Array.isArray(selectedHexValues)) {
      throw new Error('selectedHexValues必须是数组格式');
    }

    if (selectedHexValues.length === 0) {
      throw new Error('自定义调色板不能为空');
    }

    const palette: PaletteColor[] = [];

    for (let i = 0; i < selectedHexValues.length; i++) {
      const hexValue = selectedHexValues[i];

      if (typeof hexValue !== 'string' || !hexValue.startsWith('#')) {
        throw new Error(`第${i + 1}个颜色的hex值格式无效: ${hexValue}`);
      }

      const rgb = hexToRgb(hexValue);
      if (!rgb) {
        throw new Error(`第${i + 1}个颜色的hex值格式无效: ${hexValue}`);
      }

      palette.push({
        key: hexValue, // 使用hex值作为key
        hex: hexValue,
        rgb: rgb
      });
    }

    return palette;
  }

  // 支持旧格式：[{ key: "颜色名", hex: "#RRGGBB" }, ...]
  if (Array.isArray(customPaletteData)) {
    const palette: PaletteColor[] = [];

    for (let i = 0; i < customPaletteData.length; i++) {
      const color = customPaletteData[i];

      if (!color.hex || !color.key) {
        throw new Error(`第${i + 1}个颜色缺少必要的hex或key字段`);
      }

      const rgb = hexToRgb(color.hex);
      if (!rgb) {
        throw new Error(`第${i + 1}个颜色的hex值格式无效: ${color.hex}`);
      }

      palette.push({
        key: color.key,
        hex: color.hex,
        rgb: rgb
      });
    }

    if (palette.length === 0) {
      throw new Error('自定义调色板不能为空');
    }

    return palette;
  }

  throw new Error('自定义调色板格式无效，请使用正确的JSON格式');
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
