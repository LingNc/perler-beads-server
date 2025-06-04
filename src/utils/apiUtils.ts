// API工具函数
import { createCanvas, loadImage, Image, Canvas, CanvasRenderingContext2D } from 'canvas';
import { PixelationMode, PaletteColor, MappedPixel, hexToRgb } from './pixelation';
import { getMardToHexMapping, getColorKeyByHex, ColorSystem, isValidColorInSystem } from './colorSystemUtils';
import { ColorCount, CustomPalette, ValidationResult } from '@/types/paletteTypes';

// 通用调色板验证函数
export function validateCustomPalette(
  customPaletteData: CustomPalette,
  colorSystem: ColorSystem,
  options: {
    checkColorSystemExistence?: boolean; // 是否检查颜色在色号系统中的存在性
    allowEmptyPalette?: boolean; // 是否允许空调色板
  } = {}
): ValidationResult {
  const errors: string[] = [];
  const validatedColors: Array<{
    key: string;
    hex: string;
    rgb: { r: number; g: number; b: number };
  }> = [];

  const {
    checkColorSystemExistence = false,
    allowEmptyPalette = false
  } = options;

  // 1. 验证 colorSystem 参数
  if (!['MARD', 'COCO', '漫漫', '盼盼', '咪小窝'].includes(colorSystem)) {
    errors.push(`不支持的色号系统: ${colorSystem}`);
    return { isValid: false, errors };
  }

  // 2. 验证必需字段
  if (!customPaletteData || !customPaletteData.selectedHexValues) {
    errors.push('缺少必要的 selectedHexValues 字段');
    return { isValid: false, errors };
  }

  const { selectedHexValues, version } = customPaletteData;

  // 3. 验证版本支持
  const supportedVersions = ['3.0', '4.0'];
  if (!supportedVersions.includes(version)) {
    errors.push(`不支持的调色板版本: ${version}，支持的版本: ${supportedVersions.join(', ')}`);
  }

  // 4. 验证数组格式
  if (!Array.isArray(selectedHexValues)) {
    errors.push('selectedHexValues必须是数组格式');
    return { isValid: false, errors };
  }

  // 5. 验证调色板是否为空
  if (!allowEmptyPalette && selectedHexValues.length === 0) {
    errors.push('自定义调色板不能为空');
  }

  // 6. 验证每个颜色
  for (let i = 0; i < selectedHexValues.length; i++) {
    const hexValue = selectedHexValues[i];

    // 6.1 验证 hex 格式
    if (typeof hexValue !== 'string' || !hexValue.startsWith('#')) {
      errors.push(`第${i + 1}个颜色的hex值格式无效: ${hexValue}`);
      continue;
    }

    // 6.2 验证 RGB 转换
    const rgb = hexToRgb(hexValue);
    if (!rgb) {
      errors.push(`第${i + 1}个颜色的hex值转换RGB失败: ${hexValue}`);
      continue;
    }

    const normalizedHex = hexValue.toUpperCase();

    // 6.3 验证颜色在色号系统中的存在性（可选）
    if (checkColorSystemExistence && !isValidColorInSystem(normalizedHex, colorSystem)) {
      errors.push(`第${i + 1}个颜色 ${hexValue} 在 ${colorSystem} 色号系统中不存在`);
      continue;
    }

    // 6.4 获取色号并添加到验证结果
    const colorKey = getColorKeyByHex(normalizedHex, colorSystem);
    validatedColors.push({
      key: colorKey,
      hex: normalizedHex,
      rgb: rgb
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    validatedColors: errors.length === 0 ? validatedColors : undefined
  };
}

// 获取标准调色板数据
export function getDefaultPalette(colorSystem: ColorSystem): PaletteColor[] {
  const mardToHexMapping = getMardToHexMapping();

  // 从colorSystemMapping.json获取所有MARD色号并转换为PaletteColor格式
  const fullBeadPalette: PaletteColor[] = Object.entries(mardToHexMapping)
    .map(([, hex]) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return null;
      return {
        // 获取指定Hex在色号系统对应的色号
        key: getColorKeyByHex(hex, colorSystem),
        hex, rgb
      };
    })
    .filter((color): color is PaletteColor => color !== null);

  return fullBeadPalette;
}

// 解析自定义调色板
export function parseCustomPalette(
  customPaletteData: CustomPalette,
  colorSystem: ColorSystem
): PaletteColor[] {
  // 使用通用验证函数
  const validationResult = validateCustomPalette(customPaletteData, colorSystem, {
    checkColorSystemExistence: false, // parseCustomPalette 不检查色号系统存在性
    allowEmptyPalette: false
  });

  // 如果验证失败，抛出第一个错误
  if (!validationResult.isValid) {
    throw new Error(validationResult.errors[0]);
  }

  // 转换为 PaletteColor 格式
  const palette: PaletteColor[] = validationResult.validatedColors!.map(color => ({
    key: color.key,
    hex: color.hex,
    rgb: color.rgb
  }));

  console.log(`成功解析自定义调色板：版本${customPaletteData.version}，${customPaletteData.name ? `名称"${customPaletteData.name}"，` : ''}包含${palette.length}种颜色`);
  return palette;
}

// 计算颜色统计
export function calculateColorCounts(pixelData: MappedPixel[][]): ColorCount {
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
export async function createImageFromBuffer(buffer: Buffer): Promise<{ image: Image; canvas: Canvas; ctx: CanvasRenderingContext2D }> {
  const image = await loadImage(buffer);
  const canvas = createCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, 0, 0);

  return { image, canvas, ctx };
}

// 验证API参数
export function validateConvertParams(params: {
  granularity?: number;
  similarityThreshold?: number;
  pixelationMode?: PixelationMode;
}): { isValid: boolean; error?: string } {
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
export function generateFilename(params: {
  granularity?: number;
  pixelationMode?: string;
  selectedPalette?: string;
}): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const { granularity, pixelationMode, selectedPalette } = params;
  return `perler-beads-${granularity}px-${pixelationMode}-${selectedPalette}-${timestamp}`;
}

// 过滤透明色统计
export function filterTransparentColorCounts(colorCounts: { [key: string]: { count: number; color: string } }, showTransparentLabels: boolean): { [key: string]: { count: number; color: string } } {
  if (showTransparentLabels) {
    return colorCounts;
  }

  const filteredCounts: { [key: string]: { count: number; color: string } } = {};

  for (const key in colorCounts) {
    if (colorCounts.hasOwnProperty(key)) {
      const colorInfo = colorCounts[key];
      // 过滤掉T01透明色
      if (key !== 'T01') {
        filteredCounts[key] = colorInfo;
      }
    }
  }

  return filteredCounts;
}

// 过滤颜色统计，排除 T01 透明色（当 showTransparentLabels 为 false 时）
export function filterColorCountsForBeadUsage(
  colorCounts: { [key: string]: { count: number; color: string } },
  selectedColorSystem: ColorSystem,
  excludeTransparent: boolean = true
): { filteredCounts: { [key: string]: { count: number; color: string } }; filteredTotal: number } {
  if (!excludeTransparent) {
    const total = Object.values(colorCounts).reduce((sum, { count }) => sum + count, 0);
    return { filteredCounts: colorCounts, filteredTotal: total };
  }

  const filteredCounts: { [key: string]: { count: number; color: string } } = {};
  let filteredTotal = 0;

  for (const [hexColor, colorData] of Object.entries(colorCounts)) {
    const colorKey = getColorKeyByHex(hexColor, selectedColorSystem);

    // 如果不是 T01 透明色，则包含在统计中
    if (colorKey !== 'T01') {
      filteredCounts[hexColor] = colorData;
      filteredTotal += colorData.count;
    }
  }  return { filteredCounts, filteredTotal };
}
