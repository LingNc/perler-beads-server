import { NextRequest, NextResponse } from 'next/server';
import { calculatePixelGrid, PixelationMode, PaletteColor } from '../../../utils/pixelation';
import {
  getDefaultPalette,
  parseCustomPalette,
  parsePresetPalette,
  calculateColorCounts,
  createImageFromBuffer,
  validateConvertParams
} from '../../../utils/apiUtils';
import { ColorSystem, findTransparentFallbackColor } from '../../../utils/colorSystemUtils';
import { CustomPalette } from '@/types/paletteTypes';
import { getEndpointDoc } from '../../../config/apiDocs';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    // 获取参数，设置默认值
    const granularity = parseInt(formData.get('granularity') as string) || 50;
    const similarityThreshold = parseInt(formData.get('similarityThreshold') as string) || 30;
    const pixelationMode = (formData.get('pixelationMode') as PixelationMode) || PixelationMode.Dominant;
    const selectedColorSystem = formData.get('selectedColorSystem') as ColorSystem || 'MARD';
    const selectedPalette = formData.get('selectedPalette') as string || '290色';

    // 获取自定义调色板数据（仅当选择 custom 时使用）
    const customPaletteData = formData.get('customPalette') as string;

    // 验证必要参数
    if (!imageFile) {
      return NextResponse.json({
        success: false,
        error: '缺少图片文件'
      }, { status: 400 });
    }

    // 验证参数范围
    const validation = validateConvertParams({ granularity, similarityThreshold, pixelationMode });
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error
      }, { status: 400 });
    }

    // 将文件转换为buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 创建图像和canvas
    const { image, ctx } = await createImageFromBuffer(buffer);

    // 获取调色板数据
    let palette: PaletteColor[];
    let paletteSource = 'default';
    let paletteName = '290色';

    if (selectedPalette === 'custom') {
      // 使用自定义调色板
      if (!customPaletteData) {
        return NextResponse.json({
          success: false,
          error: '选择了自定义调色板但未提供调色板数据'
        }, { status: 400 });
      }

      try {
        const customColors = JSON.parse(customPaletteData) as CustomPalette;
        palette = parseCustomPalette(customColors, selectedColorSystem);
        paletteSource = 'custom';
        paletteName = customColors.name || `${palette.length}色`;
        console.log(`使用自定义调色板，包含 ${palette.length} 种颜色`);
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: '自定义调色板格式错误',
          details: error instanceof Error ? error.message : '未知错误'
        }, { status: 400 });
      }
    } else if (selectedPalette !== '290色') {
      // 使用预制调色板（非默认调色板的其他选项）
      try {
        palette = parsePresetPalette(selectedPalette, selectedColorSystem);
        paletteSource = 'preset';
        paletteName = `${selectedPalette}`;
        console.log(`使用预制调色板 ${selectedPalette}，包含 ${palette.length} 种颜色`);
      } catch (error) {
        return NextResponse.json({
          success: false,
          error: `预制调色板加载错误: ${selectedPalette}`,
          details: error instanceof Error ? error.message : '未知错误'
        }, { status: 400 });
      }
    } else {
      // 使用默认调色板 (290色)
      palette = getDefaultPalette(selectedColorSystem);
      if (palette.length === 0) {
        return NextResponse.json({
          success: false,
          error: '无效的调色板'
        }, { status: 400 });
      }
      paletteName = '290色';
    }
    // 计算网格尺寸
    const aspectRatio = image.height / image.width;
    const N = granularity;
    const M = Math.max(1, Math.round(N * aspectRatio));

    // 使用优化的透明色查找函数
    const defaultColor = findTransparentFallbackColor(palette, selectedColorSystem as ColorSystem || 'MARD');

    // 执行像素化处理
    const processedData = calculatePixelGrid(
      ctx,
      image.width,
      image.height,
      N,
      M,
      palette,
      pixelationMode,
      defaultColor
    );

    // 计算颜色统计
    const colorCounts = calculateColorCounts(processedData);

    // 计算总珠子数量
    const totalBeadCount = Object.values(colorCounts).reduce((sum, { count }) => sum + count, 0);

    // 创建符合新 PixelData 接口的数据结构
    const pixelData = {
      mappedData: processedData,
      width: N,
      height: M,
      colorSystem: selectedColorSystem as ColorSystem
    };

    // 返回完整的调色板
    return NextResponse.json({
      success: true,
      data: {
        pixelData: pixelData,
        colorCounts: colorCounts,
        totalBeadCount: totalBeadCount,
        paletteName,
        processingParams: {
          granularity,
          similarityThreshold,
          pixelationMode,
          selectedColorSystem,
          paletteSource,
          customPaletteColors: paletteSource === 'custom' ? palette.length : undefined
        },
        imageInfo: {
          originalWidth: image.width,
          originalHeight: image.height,
          aspectRatio: aspectRatio
        }
      }
    });

  } catch (error) {
    console.error('图片处理错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '图片处理失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持GET请求返回API文档
export async function GET() {
  const docConfig = getEndpointDoc('convert');
  return NextResponse.json(docConfig);
}
