import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: '七卡瓦拼豆图纸生成器API',
    version: '1.0.0',
    description: '提供图片转拼豆图纸的API服务',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      '/api/v1/convert': {
        method: 'POST',
        description: '将图片转换为拼豆图纸',
        parameters: {
          image: 'File - 图片文件',
          granularity: 'number - 精细度 (1-200, 默认50)',
          similarityThreshold: 'number - 相似度阈值 (0-100, 默认30)',
          pixelationMode: 'string - 像素化模式 (dominant/average, 默认dominant)',
          selectedPalette: 'string - 调色板名称 (默认168色)',
          selectedColorSystem: 'string - 色号系统 (默认MARD)'
        }
      },
      '/api/v1/download': {
        method: 'POST',
        description: '生成并下载图纸图片',
        parameters: {
          pixelData: 'array - 像素数据',
          gridDimensions: 'object - 网格尺寸',
          colorCounts: 'object - 颜色统计',
          downloadOptions: 'object - 下载选项'
        }
      },
      '/api/v1/palette': {
        method: 'GET',
        description: '获取调色板信息',
        parameters: {
          colorSystem: 'string - 色号系统 (可选)',
          detailed: 'boolean - 是否返回详细信息 (可选)'
        }
      },
      '/api/v1/status': {
        method: 'GET',
        description: '获取API状态信息'
      }
    },
    features: [
      '图片转拼豆图纸',
      '多种像素化模式',
      '自定义调色板',
      '图纸下载',
      '颜色统计',
      '多种输出格式'
    ],
    supportedFormats: {
      input: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'],
      output: ['png', 'jpg']
    },
    limits: {
      maxFileSize: '10MB',
      maxImageDimensions: '4000x4000',
      maxGranularity: 200,
      minGranularity: 1
    },
    examples: {
      convertImage: {
        url: '/api/v1/convert',
        method: 'POST',
        contentType: 'multipart/form-data',
        formData: {
          image: '[图片文件]',
          granularity: 50,
          pixelationMode: 'dominant',
          selectedPalette: '168色'
        }
      },
      downloadPattern: {
        url: '/api/v1/download',
        method: 'POST',
        contentType: 'application/json',
        body: {
          pixelData: '[[...]]',
          gridDimensions: '{ N: 50, M: 40 }',
          colorCounts: '{ "颜色1": { count: 100, color: "#FF0000" } }',
          downloadOptions: {
            showGrid: true,
            format: 'png'
          }
        }
      }
    }
  });
}
