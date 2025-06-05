import { NextRequest, NextResponse } from 'next/server';
import { generateImageBuffer } from '../../../utils/serverImageDownloader';
import { GridDownloadOptions } from '../../../types/downloadTypes';
import { filterColorCountsForBeadUsage } from '../../../utils/apiUtils';

// 下载选项类型定义

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pixelData,
      gridDimensions,
      colorCounts,
      selectedColorSystem,
      downloadOptions = {}
    } = body;

    // 验证必要参数
    if (!pixelData || !gridDimensions || !colorCounts || !selectedColorSystem) {
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
      showTransparentLabels: false, // 默认不显示透明色标识
      title: downloadOptions.title,
      dpi: downloadOptions.dpi || 150,
      renderMode: downloadOptions.renderMode || 'dpi',
      fixedWidth: downloadOptions.fixedWidth,
      ...downloadOptions
    };

    // 如果不显示透明标识，则从统计中排除 T01 透明色
    const { filteredCounts, filteredTotal } = filterColorCountsForBeadUsage(
      colorCounts,
      selectedColorSystem,
      !options.showTransparentLabels
    );

    // 使用原项目的图片生成功能
    const imageBuffer = await generateImageBuffer({
      mappedPixelData: pixelData,
      gridDimensions,
      colorCounts: filteredCounts,
      totalBeadCount: filteredTotal,
      options,
      selectedColorSystem,
      title: options.title,
      dpi: options.dpi,
      renderMode: options.renderMode,
      fixedWidth: options.fixedWidth
    });

    // 不再生成文件名，客户端会自己处理
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="pattern.png"`,
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
    endpoint: '/api/download',
    method: 'POST',
    description: '生成并下载拼豆图纸图片',
    parameters: {
      pixelData: { type: 'MappedPixel[][]', required: true, description: '像素数据（转换完成后的网格数据）' },
      gridDimensions: { type: '{ N: number, M: number }', required: true, description: '网格尺寸（宽度和高度）' },
      colorCounts: { type: 'object', required: true, description: '颜色统计（各颜色使用数量）' },
      totalBeadCount: { type: 'number', required: true, description: '总珠子数量' },
      selectedColorSystem: { type: 'string', required: true, description: '选择的颜色系统（如MARD、COCO等）' },
      downloadOptions: {
        showGrid: { type: 'boolean', default: true, description: '显示网格线' },
        gridInterval: { type: 'number', default: 10, description: '网格间隔' },
        showCoordinates: { type: 'boolean', default: true, description: '显示坐标' },
        gridLineColor: { type: 'string', default: '#CCCCCC', description: '网格线颜色' },
        includeStats: { type: 'boolean', default: true, description: '包含统计信息' },
        title: { type: 'string', description: '图纸标题 - 显示在图片顶部的标题栏中，高度已增加' },
        dpi: { type: 'number', default: 150, description: '图片分辨率 (DPI) - DPI模式下使用' },
        renderMode: {
          type: 'string',
          default: 'dpi',
          enum: ['dpi', 'fixed'],
          description: '渲染模式：dpi=基于DPI的模式，fixed=固定宽度模式'
        },
        fixedWidth: {
          type: 'number',
          description: '固定宽度（像素）- fixed模式下必需，指定图片的横向宽度'
        }
      }
    },
    renderModes: {
      dpi: {
        description: 'DPI模式 - 基于DPI设置图片分辨率',
        parameters: ['dpi'],
        defaultDpi: 150,
        usage: '适用于需要特定分辨率的场景，如打印等'
      },
      fixed: {
        description: '固定宽度模式 - 根据指定的像素宽度渲染',
        parameters: ['fixedWidth'],
        usage: '适用于需要固定尺寸的场景，系统会自动计算单元格大小',
        note: '如果未指定fixedWidth，将自动使用默认DPI模式'
      }
    },
    response: {
      contentType: 'image/png',
      headers: {
        'Content-Disposition': 'attachment; filename="..."'
      }
    },
    examples: {
      dpiMode: {
        description: 'DPI模式示例 - 使用DPI控制分辨率',
        downloadOptions: {
          title: '我的拼豆图纸',
          renderMode: 'dpi',
          dpi: 300,
          showGrid: true
        }
      },
      fixedMode: {
        description: '固定宽度模式示例 - 指定图片宽度',
        downloadOptions: {
          title: '我的拼豆图纸',
          renderMode: 'fixed',
          fixedWidth: 1200,
          showGrid: true
        }
      }
    }
  });
}
