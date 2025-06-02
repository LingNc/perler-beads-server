import { NextRequest, NextResponse } from 'next/server';
import { generateImageBuffer } from '../../../utils/serverImageDownloader';
import { generateFilename } from '../../../utils/apiUtils';
import { GridDownloadOptions } from '../../../types/downloadTypes';
import { MappedPixel, PaletteColor } from '../../../utils/pixelation';
import { ColorSystem } from '../../../utils/colorSystemUtils';

// 下载选项类型定义
interface DownloadOptions {
  showGrid?: boolean;
  gridInterval?: number;
  showCoordinates?: boolean;
  gridLineColor?: string;
  includeStats?: boolean;
  filename?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pixelData,
      gridDimensions,
      colorCounts,
      totalBeadCount,
      activeBeadPalette,
      selectedColorSystem,
      downloadOptions = {}
    } = body;

    // 验证必要参数
    if (!pixelData || !gridDimensions || !colorCounts || !activeBeadPalette || !selectedColorSystem) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的数据参数'
      }, { status: 400 });
    }

    // 设置默认下载选项
    const options: GridDownloadOptions = {
      showGrid: true,
      gridInterval: 10,
      showCoordinates: true,
      gridLineColor: '#CCCCCC',
      includeStats: true,
      ...downloadOptions
    };

    // 使用原项目的图片生成功能
    const imageBuffer = await generateImageBuffer({
      mappedPixelData: pixelData,
      gridDimensions,
      colorCounts,
      totalBeadCount,
      options,
      activeBeadPalette,
      selectedColorSystem
    });

    // 生成文件名
    const filename = downloadOptions.filename || generateFilename({
      selectedColorSystem,
      gridDimensions
    });
    const fullFilename = `${filename}.png`;

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="${fullFilename}"`,
        'Content-Length': imageBuffer.length.toString()
      }
    });

  } catch (error) {
    console.error('图片生成错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '图片生成失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持GET请求返回API文档
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/v1/download',
    method: 'POST',
    description: '生成并下载拼豆图纸图片',
    parameters: {
      pixelData: { type: 'MappedPixel[][]', required: true, description: '像素数据' },
      gridDimensions: { type: '{ N: number, M: number }', required: true, description: '网格尺寸' },
      colorCounts: { type: 'object', required: true, description: '颜色统计' },
      totalBeadCount: { type: 'number', required: true, description: '总珠子数' },
      activeBeadPalette: { type: 'PaletteColor[]', required: true, description: '活跃调色板' },
      selectedColorSystem: { type: 'ColorSystem', required: true, description: '选择的颜色系统' },
      downloadOptions: {
        showGrid: { type: 'boolean', default: true, description: '显示网格线' },
        gridInterval: { type: 'number', default: 10, description: '网格间隔' },
        showCoordinates: { type: 'boolean', default: true, description: '显示坐标' },
        gridLineColor: { type: 'string', default: '#CCCCCC', description: '网格线颜色' },
        includeStats: { type: 'boolean', default: true, description: '包含统计信息' },
        filename: { type: 'string', description: '自定义文件名' }
      }
    },
    response: {
      contentType: 'image/png',
      headers: {
        'Content-Disposition': 'attachment; filename="..."'
      }
    }
  });
}
