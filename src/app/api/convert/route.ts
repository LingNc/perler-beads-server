import { NextRequest, NextResponse } from 'next/server';
import { calculatePixelGrid, PixelationMode, PaletteColor } from '../../../utils/pixelation';
import {
  getDefaultPalette,
  parseCustomPalette,
  calculateColorCounts,
  createImageFromBuffer,
  validateConvertParams
} from '../../../utils/apiUtils';
import { ColorSystem, findTransparentFallbackColor } from '../../../utils/colorSystemUtils';
import { CustomPalette } from '@/types/paletteTypes';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    // 获取参数，设置默认值
    const granularity = parseInt(formData.get('granularity') as string) || 50;
    const similarityThreshold = parseInt(formData.get('similarityThreshold') as string) || 30;
    const pixelationMode = (formData.get('pixelationMode') as PixelationMode) || PixelationMode.Dominant;
    const selectedColorSystem = formData.get('selectedColorSystem') as ColorSystem || 'MARD';

    // 获取自定义调色板数据（如果提供的话）
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

    // 调色板名字
    let paletteName = '291色';

    if (customPaletteData) {
      // 使用自定义调色板
      try {
        const customColors = JSON.parse(customPaletteData) as CustomPalette;
        palette = parseCustomPalette(customColors,selectedColorSystem);
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
    } else {
      // 使用默认调色板
      palette = getDefaultPalette(selectedColorSystem);
      if (palette.length === 0) {
        return NextResponse.json({
          success: false,
          error: '无效的调色板'
        }, { status: 400 });
      }
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
  return NextResponse.json({
    endpoint: '/api/convert',
    method: 'POST',
    description: '将图片转换为拼豆图纸',
    parameters: {
      image: { type: 'File', required: true, description: '要转换的图片文件' },
      granularity: { type: 'number', default: 50, range: '1-200', description: '图纸精细度' },
      similarityThreshold: { type: 'number', default: 30, range: '0-100', description: '颜色相似度阈值' },
      pixelationMode: {
        type: 'string',
        default: 'dominant',
        options: ['dominant', 'average'],
        description: '像素化模式：dominant=卡通模式, average=真实模式'
      },
      selectedPalette: { type: 'string', default: '291色', description: '使用的调色板' },
      selectedColorSystem: { type: 'string', default: 'MARD', description: '色号系统' },
      customPalette: {
        type: 'string',
        required: false,
        description: 'JSON格式的自定义调色板数据，格式：{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}'
      }
    },
    response: {
      success: 'boolean',
      data: {
        pixelData: 'PixelData (包含 mappedData, width, height, colorSystem)',
        colorCounts: '{ [key: string]: { count: number, color: string } } (key为色号)',
        totalBeadCount: 'number',
        paletteName: 'string (使用的调色板名称)',
        processingParams: 'object (包含paletteSource和customPaletteColors)',
        imageInfo: 'object'
      }
    },
    notes: [
      '支持自定义调色板，通过customPalette参数传入JSON格式的颜色数据',
      '默认使用291色调色板，支持MARD、COCO、漫漫、盼盼、咪小窝等色号系统',
      '自定义调色板格式：{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}',
      '版本3.0不包含name字段，版本4.0包含name字段',
      '调色板中的key字段表示色号，用于生成图纸时显示',
      'colorCounts返回结果中的key为对应色号系统的色号标识'
    ]
  });
}
