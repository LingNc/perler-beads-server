import { NextResponse, NextRequest } from 'next/server';
import { getEndpointDoc } from '../../../config/apiDocs';

export async function GET(request?: NextRequest) {
  // 如果请求文档，返回API文档
  if (request) {
    const { searchParams } = new URL(request.url);
    const docs = searchParams.get('docs') === 'true';

    if (docs) {
      const docConfig = getEndpointDoc('status');
      return NextResponse.json(docConfig);
    }
  }

  const startTime = Date.now();

  try {
    // 检查系统状态
    const status = {
      service: 'perler-beads-api',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      health: {
        api: 'ok',
        canvas: 'ok', // 检查canvas库是否可用
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          unit: 'MB'
        },
        responseTime: 0 // 将在最后计算
      },
      features: {
        imageConversion: true,
        downloadGeneration: true,
        paletteManagement: true,
        multipleFormats: true
      },
      limits: {
        maxFileSize: '10MB',
        supportedFormats: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
        maxGranularity: 200
      }
    };

    // 检查canvas库
    try {
      const { createCanvas } = await import('canvas');
      const testCanvas = createCanvas(10, 10);
      if (!testCanvas) {
        status.health.canvas = 'error';
        status.status = 'degraded';
      }
    } catch {
      status.health.canvas = 'error';
      status.status = 'degraded';
    }

    // 计算响应时间
    status.health.responseTime = Date.now() - startTime;

    return NextResponse.json(status);

  } catch (error) {
    return NextResponse.json({
      service: 'perler-beads-api',
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : '未知错误',
      health: {
        api: 'error',
        responseTime: Date.now() - startTime
      }
    }, { status: 500 });
  }
}
