// 中央化的API文档配置
// 所有API端点的文档从这里读取，避免重复定义

import { colorDistance } from "@/utils/pixelation";

interface Mode {
  enumName: string;
  description: string;
  usage: string;
  note?: string;
}
interface MapString {
  [key: string]: string | MapString;
}

interface ApiParameter {
  type: string;
  description?: string;
  // 子参数（如果是对象或数组类型）
  Parameters?: Record<string, ApiParameter>;
  required?: boolean;
  default?: any;
  range?: string;
  options?: string[];
  enum?: string[];
  enumDescription?: Mode;
  examples?: any[];
}

export type Parameter = Record<string, ApiParameter> | ApiParameter;

export interface ApiEndpointDoc {
  endpoint: string;
  method: string;
  description: string;
  parameters?: Parameter;
  response?: Parameter;
  examples?: MapString;
  notes?: string[];
}

// API端点文档定义
export const API_DOCS: Record<string, ApiEndpointDoc> = {
  convert: {
    endpoint: '/api/convert',
    method: 'POST',
    description: '将图片转换为拼豆图纸',
    parameters: {
      image: {
        type: 'File',
        required: true,
        description: '要转换的图片文件'
      },
      granularity: {
        type: 'number',
        default: 50,
        range: '1-200',
        description: '图纸精细度'
      },
      similarityThreshold: {
        type: 'number',
        default: 30,
        range: '0-100',
        description: '颜色相似度阈值'
      },
      pixelationMode: {
        type: 'string',
        default: 'dominant',
        options: ['dominant', 'average'],
        description: '像素化模式：dominant=卡通模式, average=真实模式'
      },
      selectedPalette: {
        type: 'string',
        default: '290色',
        description: '使用的调色板：290色(默认全色板)、custom(自定义调色板)或预设调色板名称',
        examples: ['290色', 'custom', '144-perler-palette', '120-perler-palette']
      },
      selectedColorSystem: {
        type: 'string',
        default: 'MARD',
        description: '色号系统'
      },
      customPalette: {
        type: 'string',
        required: false,
        description: 'JSON格式的自定义调色板数据，格式：{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}'
      }
    },
    response: {
      type: 'object',
      description: '转换结果',
      Parameters: {
        success: {
          type: 'boolean',
          description: '转换是否成功'
        },
        data: {
          type: 'object',
          Parameters: {
            pixelData: {
              type: 'PixelData',
              description: 'PixelData (包含 mappedData, width, height, colorSystem)',
              Parameters: {
                mappedData: {
                  type: 'MappedPixel[][]',
                  description: '像素网格数据，二维数组，每个元素包含色号，色值和额外属性',
                  examples: [
                    [
                      [
                        { "key": "H07", "color": "#000000" },
                        { "key": "F11", "color": "#5A2121" },  // ...更多像素数据
                      ],
                      [
                        { "key": "H07", "color": "#000000" },
                        { "key": "F11", "color": "#5A2121" },  // ...更多像素数据
                      ]
                    ]
                  ]
                },
                width: {
                  type: 'number',
                  description: '网格宽度'
                },
                height: {
                  type: 'number',
                  description: '网格高度'
                },
                colorSystem: {
                  type: 'string',
                  description: '色号系统 (MARD、COCO等)'
                }
              }
            },
            colorCounts: {
              type: 'Record<string, object>',
              description: '颜色统计信息，key为色号，value为包含count和color的对象',
              Parameters: {
                A01: {
                  type: 'object',
                  description: '颜色统计信息对象',
                  Parameters: {
                    count: {
                      type: 'number',
                      description: '该色号的数量'
                    },
                    color: {
                      type: 'string',
                      description: '该色号的颜色值'
                    }
                  }
                }
              },
              examples: [
                {
                  "A01": { "count": 10, "color": "#FFFFFF" },
                  "B02": { "count": 5, "color": "#FF0000" }
                }
              ]
            },
            totalBeadCount: {
              type: 'number',
              description: '总拼豆数量'
            },
            paletteName: {
              type: 'string',
              description: '使用的调色板名称'
            },
            processingParams: {
              type: 'object',
              description: '处理参数对象，包含调色板来源和自定义调色板颜色',
              Parameters: {
                paletteSource: {
                  type: 'string',
                  description: '调色板来源：default（默认调色板）、custom（自定义调色板）或preset（预设调色板）'
                },
                customPaletteColors: {
                  type: 'string',
                  description: '自定义调色板颜色数据，格式为JSON字符串'
                }
              }
            },
            imageInfo: {
              type: 'object',
              description: '图片信息对象，包含原始图片尺寸和宽高比',
              Parameters: {
                originalWidth: {
                  type: 'number',
                  description: '原始图片宽度'
                },
                originalHeight: {
                  type: 'number',
                  description: '原始图片高度'
                },
                aspectRatio: {
                  type: 'number',
                  description: '图片宽高比 (width / height)'
                }
              }
            }
          }
        }
      },
      examples: [
        {
          success: true,
          data: {
            pixelData: {
              mappedData: [
                [
                  { key: 'H07', color: '#000000' },
                  { key: 'F11', color: '#5A2121' }
                ],
                [
                  { key: 'H07', color: '#000000' },
                  { key: 'F11', color: '#5A2121' }
                ]
              ],
              width: 50,
              height: 40,
              colorSystem: 'MARD'
            },
            colorCounts: {
              A01: { count: 10, color: '#FFFFFF' },
              B02: { count: 5, color: '#FF0000' }
            },
            totalBeadCount: 1000,
            paletteName: '290色',
            processingParams: {
              paletteSource: 'default',
              customPaletteColors: ''
            },
            imageInfo: {
              originalWidth: 800,
              originalHeight: 600,
              aspectRatio: 1.33
            }
          }
        }
      ]
    },
    examples: {
      basic: {
        description: '基本转换示例',
        parameters: {
          image: '[图片文件]',
          granularity: '50',
          similarityThreshold: '30',
          pixelationMode: 'dominant',
          selectedPalette: '290色',
          selectedColorSystem: 'MARD'
        }
      },
      customPalette: {
        description: '使用自定义调色板转换示例',
        parameters: {
          image: '[图片文件]',
          granularity: '50',
          selectedPalette: 'custom',
          customPalette: '{"version":"4.0","selectedHexValues":["#FF0000","#00FF00","#0000FF"]}'
        }
      },
      presetPalette: {
        description: '使用预设调色板转换示例',
        parameters: {
          image: '[图片文件]',
          granularity: '50',
          selectedPalette: '144-perler-palette',
          pixelationMode: 'dominant'
        }
      }
    },
    notes: [
      '支持三种调色板类型：默认调色板(290色)、自定义调色板(custom)和预设调色板',
      '预制调色板：使用预设的颜色组合，如"144-perler-palette"、"120-perler-palette"等',
      '自定义调色板：通过customPalette参数传入JSON格式的颜色数据',
      '默认使用290色调色板，支持MARD、COCO、漫漫、盼盼、咪小窝等色号系统',
      '自定义调色板格式：{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}',
      '版本3.0不包含name字段，版本4.0包含name字段',
      '调色板中的key字段表示色号，用于生成图纸时显示',
      'colorCounts返回结果中的key为对应色号系统的色号标识',
      'processingParams.paletteSource指示调色板来源：default、custom或preset'
    ]
  },

  download: {
    endpoint: '/api/download',
    method: 'POST',
    description: '生成并下载拼豆图纸图片',
    parameters: {
      pixelData: {
        type: 'PixelData',
        required: true,
        description: '像素数据对象 (来自convert API，包含mappedData、width、height、colorSystem)',
        subParameters: {
          mappedData: {
            type: 'MappedPixel[][]',
            description: '像素网格数据，二维数组，每个元素包含色号和坐标',
            examples: [
              '[{"color":"#FF0000","x":0,"y":0},{"color":"#00FF00","x":1,"y":0},...]'
            ]
          }
        }
      },
      // PixelData结构定义
      _pixelData_structure: {
        _title: 'PixelData',
        _structure: `interface PixelData {
  mappedData: MappedPixel[][] | null;  // 像素网格数据
  width: number | null;                 // 网格宽度
  height: number | null;                // 网格高度
  colorSystem: ColorSystem;             // 色号系统 (MARD、COCO等)
}`,
      },
      downloadOptions: {
        showGrid: {
          type: 'boolean',
          default: true,
          description: '显示网格线'
        },
        gridInterval: {
          type: 'number',
          default: 10,
          description: '网格间隔'
        },
        showCoordinates: {
          type: 'boolean',
          default: true,
          description: '显示坐标'
        },
        gridLineColor: {
          type: 'string',
          default: '#CCCCCC',
          description: '网格线颜色'
        },
        outerBorderColor: {
          type: 'string',
          default: '#141414',
          description: '外边框颜色 - 围绕网格的边框颜色，可选参数'
        },
        includeStats: {
          type: 'boolean',
          default: true,
          description: '包含统计信息'
        },
        showTransparentLabels: {
          type: 'boolean',
          default: false,
          description: '是否在透明色（T01）上显示色号标识'
        },
        title: {
          type: 'string',
          description: '图纸标题 - 显示在图片顶部的标题栏中，高度已增加'
        },
        dpi: {
          type: 'number',
          default: 150,
          description: '图片分辨率 (DPI) - DPI模式下使用'
        },
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
          showGrid: true,
          gridLineColor: '#CCCCCC',
          outerBorderColor: '#000000',
          showTransparentLabels: false
        }
      },
      fixedMode: {
        description: '固定宽度模式示例 - 指定图片宽度',
        downloadOptions: {
          title: '我的拼豆图纸',
          renderMode: 'fixed',
          fixedWidth: 1200,
          showGrid: true,
          gridLineColor: '#DDDDDD',
          outerBorderColor: '#141414',
          showTransparentLabels: true
        }
      },
      customBorder: {
        description: '自定义边框颜色示例',
        downloadOptions: {
          title: '彩色边框图纸',
          renderMode: 'dpi',
          dpi: 150,
          showGrid: true,
          gridLineColor: '#CCCCCC',
          outerBorderColor: '#FF0000',
          includeStats: true,
          showTransparentLabels: false
        }
      }
    }
  },

  palette: {
    endpoint: '/api/palette',
    method: 'GET/POST',
    description: 'GET: 获取调色板信息和预设调色板列表; POST: 验证自定义调色板',
    parameters: {
      // GET 参数
      colorSystem: {
        type: 'string',
        required: false,
        description: '色号系统 (可选, GET)'
      },
      detailed: {
        type: 'boolean',
        required: false,
        description: '是否返回详细信息 (可选, GET)'
      },
      // POST 参数
      customPalette: {
        type: 'object',
        required: false,
        description: '自定义调色板对象 (POST验证)'
      },
      colorSystem_post: {
        type: 'string',
        required: false,
        default: 'MARD',
        description: '色号系统 (POST验证, 可选, 默认MARD)'
      }
    }
  },

  status: {
    endpoint: '/api/status',
    method: 'GET',
    description: '获取API状态信息',
    response: {
      service: 'string',
      status: 'string',
      timestamp: 'string',
      uptime: 'number',
      version: 'string',
      health: 'object'
    }
  }
};

// 全局API信息
export const API_INFO = {
  name: '七卡瓦拼豆图纸生成器API',
  version: '1.0.0',
  description: '提供图片转拼豆图纸的API服务',
  features: [
    '图片转拼豆图纸',
    '多种像素化模式',
    '自定义调色板支持',
    '预设调色板支持 (144色/97色/120色/168色)',
    '290色完整调色板',
    '5种色号系统',
    '图纸下载',
    '颜色统计',
    '自定义调色板验证',
    '增强的标题功能（高度增加）',
    '双重渲染模式（DPI/Fixed）',
    '固定宽度支持',
    'DPI分辨率控制',
    '外边框颜色控制',
    '透明色标识控制',
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
  }
};

// 从单个端点配置生成完整文档的辅助函数
export function getEndpointDoc(endpointName: string): ApiEndpointDoc | null {
  return API_DOCS[endpointName] || null;
}

// 获取所有端点的简化信息（用于根API）
export function getAllEndpointsInfo(): Record<string, any> {
  const endpoints: Record<string, any> = {};

  Object.entries(API_DOCS).forEach(([key, doc]) => {
    endpoints[doc.endpoint] = {
      method: doc.method,
      description: doc.description,
      parameters: simplifyParameters(doc.parameters || {})
    };
  });

  return endpoints;
}

// 简化参数结构（用于概览）
function simplifyParameters(params: Record<string, any>): Record<string, string> {
  const simplified: Record<string, string> = {};

  Object.entries(params).forEach(([key, param]) => {
    if (typeof param === 'object' && param.type) {
      // 单个参数
      const defaultText = param.default ? ` (默认${param.default})` : '';
      simplified[key] = `${param.type} - ${param.description}${defaultText}`;
    } else if (typeof param === 'object') {
      // 嵌套参数对象
      Object.entries(param).forEach(([subKey, subParam]: [string, any]) => {
        const defaultText = subParam.default ? ` (默认${subParam.default})` : '';
        simplified[subKey] = `${subParam.type} - ${subParam.description}${defaultText}`;
      });
    }
  });

  return simplified;
}

// 生成完整的根API响应
export function generateRootApiResponse(): any {
  return {
    ...API_INFO,
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: getAllEndpointsInfo(),
    examples: {
      convertImage: {
        url: '/api/convert',
        method: 'POST',
        contentType: 'multipart/form-data',
        formData: {
          image: '[图片文件]',
          granularity: 50,
          pixelationMode: 'dominant',
          selectedPalette: '290色'
        }
      },
      convertWithCustomPalette: {
        url: '/api/convert',
        method: 'POST',
        contentType: 'multipart/form-data',
        formData: {
          image: '[图片文件]',
          granularity: 50,
          selectedPalette: 'custom',
          customPalette: '[{"key":"红色","hex":"#FF0000"},{"key":"绿色","hex":"#00FF00"}]'
        }
      },
      convertWithPresetPalette: {
        url: '/api/convert',
        method: 'POST',
        contentType: 'multipart/form-data',
        formData: {
          image: '[图片文件]',
          granularity: 50,
          selectedPalette: '144色拼豆调色板',
          pixelationMode: 'dominant'
        }
      },
      downloadPattern: {
        url: '/api/download',
        method: 'POST',
        contentType: 'application/json',
        body: {
          pixelData: {
            mappedData: '[[...]]',
            width: 50,
            height: 40,
            colorSystem: 'MARD'
          },
          downloadOptions: {
            showGrid: true,
            gridLineColor: '#CCCCCC',
            outerBorderColor: '#141414',
            showTransparentLabels: false,
            title: '我的拼豆图纸',
            renderMode: 'dpi',
            dpi: 300
          }
        }
      },
      downloadPatternCustomBorder: {
        url: '/api/download',
        method: 'POST',
        contentType: 'application/json',
        description: '自定义边框颜色的下载示例',
        body: {
          pixelData: {
            mappedData: '[[...]]',
            width: 50,
            height: 40,
            colorSystem: 'MARD'
          },
          downloadOptions: {
            showGrid: true,
            gridLineColor: '#DDDDDD',
            outerBorderColor: '#FF0000',
            showTransparentLabels: true,
            title: '彩色边框图纸',
            renderMode: 'fixed',
            fixedWidth: 1200
          }
        }
      }
    }
  };
}
