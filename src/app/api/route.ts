import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: '七卡瓦拼豆图纸生成器API',
    version: '1.0.0',
    description: '提供图片转拼豆图纸的API服务',
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: {
      '/api/convert': {
        method: 'POST',
        description: '将图片转换为拼豆图纸',
        parameters: {
          image: 'File - 图片文件',
          granularity: 'number - 精细度 (1-200, 默认50)',
          similarityThreshold: 'number - 相似度阈值 (0-100, 默认30)',
          pixelationMode: 'string - 像素化模式 (dominant/average, 默认dominant)',
          selectedPalette: 'string - 调色板名称 (默认291色)',
          selectedColorSystem: 'string - 色号系统 (默认MARD)',
          customPalette: 'string - 自定义调色板JSON (可选，新格式: {"version":"3.0","selectedHexValues":["#RRGGBB"],"exportDate":"...","totalColors":N} 或旧格式: [{"key":"颜色名","hex":"#RRGGBB"}])'
        }
      },
      '/api/download': {
        method: 'POST',
        description: '生成并下载图纸图片',
        parameters: {
          pixelData: 'array - 像素数据',
          gridDimensions: 'object - 网格尺寸',
          colorCounts: 'object - 颜色统计',
          downloadOptions: 'object - 下载选项 (包含title标题和dpi分辨率)'
        }
      },
      '/api/palette': {
        method: 'GET/POST',
        description: 'GET: 获取调色板信息; POST: 验证自定义调色板',
        parameters: {
          colorSystem: 'string - 色号系统 (可选, GET)',
          detailed: 'boolean - 是否返回详细信息 (可选, GET)',
          colors: 'array - 自定义颜色数组 (POST验证，旧格式)',
          customPalette: 'object - 自定义调色板对象 (POST验证，新格式)'
        }
      },
      '/api/status': {
        method: 'GET',
        description: '获取API状态信息'
      }
    },
    features: [
      '图片转拼豆图纸',
      '多种像素化模式',
      '自定义调色板支持',
      '291色完整调色板',
      '5种色号系统',
      '图纸下载',
      '颜色统计',
      '自定义调色板验证',
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
        url: '/api/convert',
        method: 'POST',
        contentType: 'multipart/form-data',
        formData: {
          image: '[图片文件]',
          granularity: 50,
          pixelationMode: 'dominant',
          selectedPalette: '291色'
        }
      },
      convertWithCustomPalette: {
        url: '/api/convert',
        method: 'POST',
        contentType: 'multipart/form-data',
        formData: {
          image: '[图片文件]',
          granularity: 50,
          selectedPalette: '自定义',
          customPalette: '[{"key":"红色","hex":"#FF0000"},{"key":"绿色","hex":"#00FF00"}]'
        }
      },
      downloadPattern: {
        url: '/api/download',
        method: 'POST',
        contentType: 'application/json',
        body: {
          pixelData: '[[...]]',
          gridDimensions: '{ N: 50, M: 40 }',
          colorCounts: '{ "颜色1": { count: 100, color: "#FF0000" } }',
          downloadOptions: {
            showGrid: true,
            title: '我的拼豆图纸',
            dpi: 300
          }
        }
      }
    }
  });
}
