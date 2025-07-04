import { NextRequest, NextResponse } from 'next/server';
import { generateImageBuffer } from '../../../utils/serverImageDownloader';
import { GridDownloadOptions } from '../../../types/downloadTypes';
import { getEndpointDoc } from '../../../config/apiDocs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      pixelData,
      downloadOptions = {}
    } = body;

    // 验证必要参数
    if (!pixelData || !pixelData.mappedData || !pixelData.width || !pixelData.height) {
      return NextResponse.json({
        success: false,
        error: '缺少必要的像素数据参数'
      }, { status: 400 });
    }

    // 设置默认下载选项
    const options: GridDownloadOptions = {
      showGrid: true,
      gridInterval: 10,
      showCoordinates: true,
      gridLineColor: '#CCCCCC',
      outerBorderColor: '#141414', // 默认外边框颜色
      includeStats: true,
      showTransparentLabels: false, // 默认不显示透明色标识
      dpi: downloadOptions.dpi || 150,
      fixedWidth: downloadOptions.fixedWidth,
      ...downloadOptions
    };

    // 使用server的图片生成功能
    const imageBuffer = await generateImageBuffer({
      title: downloadOptions.title,
      pixelData,
      renderMode: downloadOptions.renderMode || 'dpi',
      options
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
  const docConfig = getEndpointDoc('download');
  if (!docConfig) {
    return NextResponse.json({ error: 'Documentation not found' }, { status: 404 });
  }
  return NextResponse.json(docConfig);
}
