import { NextRequest, NextResponse } from 'next/server';
import { calculatePixelGrid, PixelationMode, PaletteColor } from '../../../../utils/pixelation';
import {
  getPaletteByName,
  calculateColorCounts,
  createImageFromBuffer,
  validateConvertParams
} from '../../../../utils/apiUtils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;

    // 获取参数，设置默认值
    const granularity = parseInt(formData.get('granularity') as string) || 50;
    const similarityThreshold = parseInt(formData.get('similarityThreshold') as string) || 30;
    const pixelationMode = (formData.get('pixelationMode') as PixelationMode) || PixelationMode.Dominant;
    const selectedPalette = formData.get('selectedPalette') as string || '168色';
    const selectedColorSystem = formData.get('selectedColorSystem') as string || 'MARD';

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
    const { image, canvas, ctx } = await createImageFromBuffer(buffer);

    // 获取调色板数据
    const palette = getPaletteByName(selectedPalette);
    if (palette.length === 0) {
      return NextResponse.json({
        success: false,
        error: '无效的调色板'
      }, { status: 400 });
    }

    // 计算网格尺寸
    const aspectRatio = image.height / image.width;
    const N = granularity;
    const M = Math.max(1, Math.round(N * aspectRatio));

    // 获取默认颜色（使用调色板中的第一个颜色作为备用）
    const defaultColor = palette[0];

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

    // 生成activeBeadPalette - 从实际使用的颜色中构建
    const activeBeadPalette = palette.map(color => ({
      key: color.key,
      color: color.hex
    }));

    return NextResponse.json({
      success: true,
      data: {
        gridDimensions: { N, M },
        pixelData: processedData,
        colorCounts: colorCounts,
        totalBeadCount: totalBeadCount,
        activeBeadPalette: activeBeadPalette,
        processingParams: {
          granularity,
          similarityThreshold,
          pixelationMode,
          selectedPalette,
          selectedColorSystem
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
    endpoint: '/api/v1/convert',
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
      selectedPalette: { type: 'string', default: '168色', description: '使用的调色板' },
      selectedColorSystem: { type: 'string', default: 'MARD', description: '色号系统' }
    },
    response: {
      success: 'boolean',
      data: {
        gridDimensions: '{ N: number, M: number }',
        pixelData: 'MappedPixel[][]',
        colorCounts: '{ [key: string]: { count: number, color: string } }',
        totalBeadCount: 'number',
        processingParams: 'object',
        imageInfo: 'object'
      }
    }
  });
}
