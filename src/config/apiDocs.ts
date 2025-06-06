// 中央化的API文档配置
// 所有API端点的文档从这里读取，避免重复定义

// 定义基础类型别名，用于各处需要表示基本数据类型的场景
type BaseType = string | number | boolean | object | null;
// 定义未知类型别名，用于表示未知的复杂结构
type UnknownType = unknown;

interface EnumValue {
  enumName: string;
  description: string;
  usage: string;
  note?: string;
}

interface Mode {
  [key: string]: EnumValue;
}


interface ApiParameter {
  type: string;
  description?: string;
  // 子参数（如果是对象或数组类型）
  Parameters?: Record<string, ApiParameter>;
  required?: boolean;
  default?: BaseType;
  range?: string;
  options?: string[];
  enum?: string[];
  enumDescription?: Mode;
  examples?: BaseType[];
}

export type Parameter = Record<string, ApiParameter> | ApiParameter;

export interface ApiEndpointDoc {
  endpoint: string;
  method: string;
  description: string;
  parameters?: Parameter;
  response?: Parameter;
  examples?: Record<string, UnknownType>; // 使用 UnknownType 替代 unknown 保持命名一致性
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
        Parameters: {
          mappedData: {
            type: 'MappedPixel[][]',
            description: '像素网格数据，二维数组，每个元素包含色号和坐标',
            examples: [
              '[{"color":"#FF0000","x":0,"y":0},{"color":"#00FF00","x":1,"y":0},...]'
            ]
          }
        }
      },
      // PixelData结构定义已移入pixelData.Parameters
      downloadOptions: {
        type: 'object',
        description: '下载选项配置',
        Parameters: {
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
            description: '渲染模式：dpi=基于DPI的模式，fixed=固定宽度模式',
            enumDescription: {
              dpi: {
                enumName: 'DPI模式',
                description: 'DPI模式 - 基于DPI设置图片分辨率',
                usage: '适用于需要特定分辨率的场景，如打印等'
              },
              fixed: {
                enumName: '固定宽度模式',
                description: '固定宽度模式 - 根据指定的像素宽度渲染',
                usage: '适用于需要固定尺寸的场景，系统会自动计算单元格大小',
                note: '如果未指定fixedWidth，将自动使用默认DPI模式'
              }
            }
          },
          fixedWidth: {
            type: 'number',
            description: '固定宽度（像素）- fixed模式下必需，指定图片的横向宽度'
          }
        }
      }
    },
    response: {
      type: 'binary',
      description: '图片数据',
      Parameters: {
        contentType: {
          type: 'string',
          description: '内容类型',
          default: 'image/png'
        },
        headers: {
          type: 'object',
          description: '响应头信息',
          Parameters: {
            'Content-Disposition': {
              type: 'string',
              description: '内容处理方式，指示浏览器下载文件',
              default: 'attachment; filename="..."'
            }
          }
        }
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
        description: '自定义调色板对象 (POST验证)',
        Parameters: {
          version: {
            type: 'string',
            description: '调色板版本，支持"3.0"或"4.0"',
            examples: ["3.0", "4.0"]
          },
          selectedHexValues: {
            type: 'string[]',
            description: '调色板颜色值数组，包含十六进制颜色值',
            examples: [["#FF0000", "#00FF00", "#0000FF"]]
          },
          name: {
            type: 'string',
            description: '调色板名称 (仅4.0版本)',
            required: false
          }
        }
      },
      colorSystem_post: {
        type: 'string',
        required: false,
        default: 'MARD',
        description: '色号系统 (POST验证, 可选, 默认MARD)'
      }
    },
    response: {
      type: 'object',
      description: '调色板信息',
      Parameters: {
        // GET 响应
        success: {
          type: 'boolean',
          description: '请求是否成功'
        },
        defaultPalette: {
          type: 'object',
          description: '默认调色板信息',
          Parameters: {
            paletteData: {
              type: 'array',
              description: '调色板颜色数据',
              examples: [
                [
                  { "key": "A01", "color": "#FFFFFF", "name": "白色" },
                  { "key": "B02", "color": "#FF0000", "name": "红色" }
                ]
              ]
            },
            totalColors: {
              type: 'number',
              description: '颜色总数'
            },
            colorSystem: {
              type: 'string',
              description: '色号系统'
            }
          }
        },
        presetPalettes: {
          type: 'array',
          description: '预设调色板列表',
          examples: [
            [
              { "id": "144-perler-palette", "name": "144色拼豆调色板", "colors": 144 },
              { "id": "120-perler-palette", "name": "120色拼豆调色板", "colors": 120 }
            ]
          ]
        },
        // POST 验证响应
        isValid: {
          type: 'boolean',
          description: '自定义调色板是否有效（POST验证）'
        },
        errors: {
          type: 'array',
          description: '验证错误信息（POST验证）',
          examples: [
            ["颜色格式无效", "调色板为空"]
          ]
        },
        processedPalette: {
          type: 'object',
          description: '处理后的调色板（POST验证）',
          Parameters: {
            totalColors: {
              type: 'number',
              description: '颜色总数'
            },
            paletteData: {
              type: 'array',
              description: '处理后的调色板数据',
              examples: [
                [
                  { "key": "C01", "color": "#FF0000", "name": "红色" },
                  { "key": "C02", "color": "#00FF00", "name": "绿色" }
                ]
              ]
            }
          }
        }
      }
    },
    examples: {
      getDefault: {
        description: '获取默认调色板',
        parameters: {
          colorSystem: 'MARD',
          detailed: 'false'
        }
      },
      getDetailed: {
        description: '获取详细调色板信息',
        parameters: {
          colorSystem: 'MARD',
          detailed: 'true'
        }
      },
      validateCustomPalette: {
        description: '验证自定义调色板',
        parameters: {
          customPalette: '{"version":"4.0","selectedHexValues":["#FF0000","#00FF00","#0000FF"],"name":"我的调色板"}',
          colorSystem_post: 'MARD'
        }
      }
    },
    notes: [
      'GET请求用于获取调色板信息和预设调色板列表',
      'POST请求用于验证自定义调色板',
      '支持的色号系统包括：MARD、COCO、漫漫、盼盼、咪小窝等',
      '自定义调色板格式：{"version":"3.0/4.0","selectedHexValues":["#RRGGBB",...]}',
      '版本3.0不包含name字段，版本4.0包含name字段',
      'detailed=true参数会返回更多颜色信息，包括RGB值和HSV值'
    ]
  },

  status: {
    endpoint: '/api/status',
    method: 'GET',
    description: '获取API状态信息',
    response: {
      type: 'object',
      description: 'API状态信息',
      Parameters: {
        service: {
          type: 'string',
          description: '服务名称'
        },
        status: {
          type: 'string',
          description: '服务状态（active、degraded、maintenance等）'
        },
        timestamp: {
          type: 'string',
          description: '当前时间戳，ISO格式'
        },
        uptime: {
          type: 'number',
          description: '服务运行时间（秒）'
        },
        version: {
          type: 'string',
          description: 'API版本号'
        },
        health: {
          type: 'object',
          description: '健康状态对象',
          Parameters: {
            database: {
              type: 'string',
              description: '数据库连接状态'
            },
            storage: {
              type: 'string',
              description: '存储服务状态'
            },
            cache: {
              type: 'string',
              description: '缓存服务状态'
            }
          }
        }
      },
      examples: [
        {
          service: "七卡瓦拼豆图纸生成器API",
          status: "active",
          timestamp: "2023-06-01T12:00:00Z",
          uptime: 3600,
          version: "1.0.0",
          health: {
            database: "healthy",
            storage: "healthy",
            cache: "healthy"
          }
        }
      ]
    },
    examples: {
      standardStatus: {
        description: '标准状态查询',
        parameters: {}
      }
    },
    notes: [
      '此端点提供API服务的实时状态信息',
      '正常运行时status字段应为"active"',
      '如需监控服务健康状态，建议定期检查此端点'
    ]
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
export function getAllEndpointsInfo(): Record<string, unknown> {
  const endpoints: Record<string, unknown> = {};

  Object.entries(API_DOCS).forEach(([, doc]) => {
    endpoints[doc.endpoint] = {
      method: doc.method,
      description: doc.description,
      parameters: simplifyParameters(doc.parameters || {})
    };
  });

  return endpoints;
}

// 简化参数结构（用于概览）
function simplifyParameters(params: Parameter): Record<string, string> {
  const simplified: Record<string, string> = {};

  Object.entries(params).forEach(([key, param]) => {
    if (typeof param === 'object' && param.type) {
      // 单个参数
      const defaultText = param.default ? ` (默认${param.default})` : '';
      simplified[key] = `${param.type} - ${param.description}${defaultText}`;
    } else if (typeof param === 'object') {
      // 嵌套参数对象
      Object.entries(param).forEach(([subKey, subParam]) => {
        // 确保是 ApiParameter 类型
        if (typeof subParam === 'object' && subParam !== null && 'type' in subParam) {
          const paramType = subParam as ApiParameter;
          const defaultText = paramType.default ? ` (默认${paramType.default})` : '';
          simplified[subKey] = `${paramType.type} - ${paramType.description || ''}${defaultText}`;
        }
      });
    }
  });

  return simplified;
}

// 定义根API响应的类型
interface RootApiResponse {
  name: string;
  version: string;
  description: string;
  features: string[];
  supportedFormats: {
    input: string[];
    output: string[];
  };
  limits: {
    maxFileSize: string;
    maxImageDimensions: string;
    maxGranularity: number;
    minGranularity: number;
  };
  status: string;
  timestamp: string;
  endpoints: Record<string, unknown>;
  examples: Record<string, unknown>;
}

// 生成完整的根API响应
export function generateRootApiResponse(): RootApiResponse {
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
