// 中央化的API文档配置
// 所有API端点的文档从这里读取，避免重复定义W

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
  optionDescription?: Mode;
  examples?: BaseType[];
}

export type Parameter = Record<string, ApiParameter> | ApiParameter;

export interface ApiEndpointDoc {
  endpoint: string;
  method: string;
  contentType: string; // 请求内容类型，如 'application/json' 或 'multipart/form-data'
  description: string;
  parameters?: Parameter;
  response?: Parameter;
  examples?: Record<string, UnknownType>; // 使用 UnknownType 替代 unknown 保持命名一致性
  notes?: string[];
}

// 结构前置定义
const sharePixelData: Parameter = {
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
}

const shareCustomPalette: Parameter = {
  type: 'CustomPalette',
  required: false,
  description: '[POST]自定义调色板对象',
  Parameters: {
    version: {
      type: 'string',
      required: true,
      description: '调色板版本，支持"3.0"或"4.0"',
      examples: ["3.0", "4.0"]
    },
    selectedHexValues: {
      type: 'string[]',
      required: true,
      description: '调色板颜色值数组，包含十六进制颜色值',
      examples: [["#FF0000", "#00FF00", "#0000FF"]]
    },
    name: {
      type: 'string',
      description: '调色板名称 (仅4.0版本)',
      required: false
    },
    exportDate: {
      type: 'string',
      description: '导出日期 (可选)',
      examples: ["2023-10-01T12:00:00Z"]
    },
    totalColors: {
      type: 'number',
      description: '调色板颜色总数 (可选)',
      examples: [144]
    }
  }
}
// API端点文档定义
export const API_DOCS: Record<string, ApiEndpointDoc> = {
  convert: {
    endpoint: '/api/convert',
    method: 'POST',
    contentType: 'multipart/form-data',
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
        description: '像素化模式：dominant=卡通模式, average=真实模式',
        optionDescription: {
          dominant: {
            enumName: '卡通模式',
            description: '主导色模式 - 选择区域内最主要的颜色',
            usage: '适用于卡通图片、插画等色彩鲜明的图像，能保持颜色的鲜艳度和对比度'
          },
          average: {
            enumName: '真实模式',
            description: '平均色模式 - 对区域内所有颜色进行平均',
            usage: '适用于真实照片、风景图等色彩过渡自然的图像，能产生更平滑的色彩过渡'
          }
        }
      },
      selectedPalette: {
        type: 'string',
        default: '290色',
        description: '使用的调色板：290色(默认全色板)、custom(自定义调色板)或预设调色板名称',
        examples: ['290色', 'custom', '144色', '120色']
      },
      selectedColorSystem: {
        type: 'string',
        default: 'MARD',
        description: '色号系统'
      },
      customPalette: shareCustomPalette
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
            pixelData: sharePixelData,
            colorCounts: {
              type: 'Record<string, object>',
              description: '颜色统计信息，key为色号，value为包含count和color的对象',
              Parameters: {
                "A01": {
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
                },
                "...": {
                  type: 'object',
                  description: '其他色号的统计信息',
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
              description: '处理参数对象，包含颗粒度，相似阈值，像素模式，色号系统和色板来源',
              Parameters: {
                granularity: {
                  type: 'number',
                  description: '图纸精细度'
                },
                similarityThreshold: {
                  type: 'number',
                  description: '颜色相似度阈值'
                },
                pixelationMode: {
                  type: 'string',
                  description: '像素化模式：dominant=卡通模式, average=真实模式'
                },
                selectedColorSystem: {
                  type: 'string',
                  description: '色号系统'
                },
                paletteSource: {
                  type: 'string',
                  description: '调色板来源：default=默认调色板, custom=自定义调色板, preset=预设调色板',
                  examples: ['default', 'custom', 'preset']
                },
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
              granularity: 50,
              similarityThreshold: 30,
              pixelationMode: 'dominant',
              selectedColorSystem: 'MARD',
              paletteSource: 'default'
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
          customPalette: {
            version: '4.0',
            name: '我的调色板',
            selectedHexValues: ['#FF0000', '#00FF00', '#0000FF'],
            exportDate: '2023-10-01T12:00:00Z',
            totalColors: 3
          }
        }
      },
      presetPalette: {
        description: '使用预设调色板转换示例',
        parameters: {
          image: '[图片文件]',
          granularity: '50',
          selectedPalette: '144色',
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
    contentType: 'application/json',
    description: '生成并下载拼豆图纸图片',
    parameters: {
      title: {
        type: 'string',
        default: 'none',
        description: '图纸标题 - 显示在图片顶部的标题栏中，高度已增加'
      },
      pixelData: sharePixelData,
      renderMode: {
        type: 'string',
        default: 'dpi',
        options: ['dpi', 'fixed'],
        description: '渲染模式：dpi=基于DPI的模式，fixed=固定宽度模式',
        optionDescription: {
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
          dpi: {
            type: 'number',
            default: 150,
            description: '图片分辨率 (DPI) - DPI模式下使用'
          },
          fixedWidth: {
            type: 'number',
            description: '固定宽度（像素）- fixed模式下必需，指定图片的横向宽度'
          },
          showTransparentLabels: {
            type: 'boolean',
            default: false,
            description: '是否在透明色（T01）上显示色号标识'
          },
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
    contentType: 'application/json',
    description: 'GET: 获取调色板信息和预设调色板列表; POST: 验证自定义调色板',
    parameters: {
      // GET 参数
      colorSystem: {
        type: 'string',
        required: false,
        default: 'MARD',
        description: '色号系统 (可选)'
      },
      detailed: {
        type: 'boolean',
        required: false,
        description: '[GET]是否返回详细信息 (可选)'
      },
      // POST 参数
      customPalette: shareCustomPalette
    },
    response: {
      type: 'object',
      description: '调色板信息',
      Parameters: {
        // GET 响应
        success: {
          type: 'boolean',
          description: '[GET]请求是否成功'
        },
        defaultPalette: {
          type: "string",
          description: '[GET]默认调色板名称',
          default: '290色',
        },
        data: {
          type: 'object',
          description: '[GET/POST]返回数据',
          Parameters: {
            // GET
            availablePalettes: {
              type: 'array<string>',
              description: '[GET,detail=false]预设调色板列表名字',
              examples: [
                ['290色', '144色', '120色', '168色', '97色', 'custom']
              ]
            },
            colorSystems: {
              type: 'array<object>',
              description: '[GET,detail=false]支持的色号系统列表',
              Parameters: {
                key: {
                  type: 'string',
                  description: '色号系统标识'
                },
                name: {
                  type: 'string',
                  description: '色号系统名称'
                }
              },
              examples: [
                [
                  { "key": "MARD", "name": "MARD" },
                  { "key": "COCO", "name": "COCO" },
                  { "key": "漫漫", "name": "漫漫" },
                  { "key": "盼盼", "name": "盼盼" },
                  { "key": "咪小窝", "name": "咪小窝" }
                ]
              ]
            },
            defaultColorSystem: {
              type: 'string',
              description: '[GET,detail=false]默认色号系统',
              default: 'MARD'
            },
            defaultPalette: {
              type: 'string',
              description: '[GET,detail=false]默认调色板名称',
              default: '290色'
            },
            supportsCustomPalette: {
              type: 'boolean',
              description: '[GET,detail=false]是否支持自定义调色板',
              examples: [true]
            },
            colors: {
              type: 'array',
              description: '[GET,detail=true]调色板颜色数据',
              Parameters: {
                key: {
                  type: 'string',
                  description: '色号标识'
                },
                color: {
                  type: 'string',
                  description: '颜色值 (十六进制)'
                },
                name: {
                  type: 'string',
                  description: '颜色名称 (可选)'
                }
              },
              examples: [
                [
                  { "key": "A01", "color": "#FFFFFF", "name": "白色" },
                  { "key": "B02", "color": "#FF0000", "name": "红色" }
                ]
              ]
            },
            // POST
            validatedColors: {
              type: 'array<object>',
              description: '[POST]验证后的颜色数据',
              Parameters: {
                key: {
                  type: 'string',
                  description: '色号标识'
                },
                hex: {
                  type: 'string',
                  description: '颜色值 (十六进制)'
                },
                rgb: {
                  type: 'object',
                  description: 'RGB颜色值',
                  Parameters: {
                    r: { type: 'number', description: '红色分量' },
                    g: { type: 'number', description: '绿色分量' },
                    b: { type: 'number', description: '蓝色分量' }
                  }
                }
              },
              examples: [
                [
                  {
                    "key": "F05",
                    "hex": "#E7002F",
                    "rgb": {
                      "r": 231,
                      "g": 0,
                      "b": 47
                    }
                  },
                  {
                    "key": "H02",
                    "hex": "#FEFFFF",
                    "rgb": {
                      "r": 254,
                      "g": 255,
                      "b": 255
                    }
                  }
                ]
              ]
            },
            version: {
              type: 'string',
              description: '[POST]调色板版本',
            },
            message: {
              type: 'string',
              description: '[POST]验证结果消息，成功时为"验证通过"，失败时为错误信息'
            },
            colorSystem: {
              type: 'string',
              description: '[detail=true]色号系统'
            },
            totalColors: {
              type: 'number',
              description: '颜色总数'
            }
          }
        },
        errors: {
          type: 'array',
          description: '[POST,发生错误时]验证错误信息',
          examples: [
            ["颜色格式无效", "调色板为空"]
          ]
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
          colorSystem: 'MARD'
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
    contentType: 'none',
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
        environment: {
          type: 'string',
          description: '运行环境（如development、production）',
          default: 'development'
        },
        health: {
          type: 'object',
          description: '健康状态对象',
          Parameters: {
            api: {
              type: 'string',
              description: 'API健康状态',
              examples: ['ok', 'error']
            },
            canvas: {
              type: 'string',
              description: 'canvas库健康状态',
              examples: ['ok', 'error']
            },
            memory: {
              type: 'object',
              description: '内存使用情况',
              Parameters: {
                used: {
                  type: 'number',
                  description: '已用内存（MB）'
                },
                total: {
                  type: 'number',
                  description: '总内存（MB）'
                },
                unit: {
                  type: 'string',
                  description: '内存单位，通常为MB'
                }
              }
            },
            responseTime: {
              type: 'string',
              description: '响应时间（毫秒）',
            }
          }
        },
        features: {
          type: 'object',
          description: 'API功能列表',
          Parameters: {
            imageConversion: {
              type: 'boolean',
              description: '是否支持图片转换'
            },
            downloadGeneration: {
              type: 'boolean',
              description: '是否支持下载生成图纸'
            },
            paletteManagement: {
              type: 'boolean',
              description: '是否支持调色板管理'
            },
            multipleFormats: {
              type: 'boolean',
              description: '是否支持多种输出格式'
            }
          }
        },
        limits: {
          type: 'object',
          description: 'API限制信息',
          Parameters: {
            maxFileSize: {
              type: 'string',
              description: '最大文件大小限制'
            },
            supportedFormats: {
              type: 'array<string>',
              description: '支持的输入格式列表',
              examples: [['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp']]
            },
            maxGranularity: {
              type: 'number',
              description: '最大精细度限制'
            }
          }
        }
      },
      examples: [
        {
          service: "七卡瓦拼豆图纸生成器API",
          status: "healthy",
          timestamp: "2025-06-07T16:39:39.572Z",
          uptime: 3772.772483407,
          version: "1.0.0",
          environment: "production",
          health: {
            api: "ok",
            canvas: "ok",
            memory: {
              used: 50,
              total: 200,
              unit: "MB"
            },
            responseTime: 1
          },
          features: {
            imageConversion: true,
            downloadGeneration: true,
            paletteManagement: true,
            multipleFormats: true
          },
          limits: {
            maxFileSize: "10MB",
            supportedFormats: ["jpg", "jpeg", "png", "gif", "bmp", "webp"],
            maxGranularity: 200
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
      contentType: doc.contentType,
      description: doc.description,
      parameters: simplifyParameters(doc.parameters || {})
    };
  });

  return endpoints;
}

// 简化参数结构（用于概览）
function simplifyParameters(params: Parameter): Record<string, string> {
  const simplified: Record<string, string> = {};

  // 如果params本身就是一个ApiParameter（单个参数的情况）
  if ('type' in params) {
    const param = params as ApiParameter;
    const defaultText = param.default ? ` (默认: ${param.default})` : '';
    const rangeText = param.range ? ` [范围: ${param.range}]` : '';
    const optionsText = param.options ? ` [可选: ${param.options.join(', ')}]` : '';
    simplified.parameter = `${param.type} - ${param.description || ''}${defaultText}${rangeText}${optionsText}`;
    return simplified;
  }

  // 处理参数对象
  Object.entries(params).forEach(([key, param]) => {
    if (typeof param === 'object' && param !== null && 'type' in param) {
      // 单个参数
      const apiParam = param as ApiParameter;
      const defaultText = apiParam.default !== undefined ? ` (默认: ${apiParam.default})` : '';
      const rangeText = apiParam.range ? ` [范围: ${apiParam.range}]` : '';
      const optionsText = apiParam.options ? ` [可选: ${apiParam.options.join(', ')}]` : '';
      const requiredText = apiParam.required ? ' [必需]' : '';

      simplified[key] = `${apiParam.type} - ${apiParam.description || ''}${defaultText}${rangeText}${optionsText}${requiredText}`;
    } else if (typeof param === 'object' && param !== null) {
      // 这可能是嵌套的参数对象，递归处理
      const nestedParams = simplifyParameters(param as Parameter);
      Object.entries(nestedParams).forEach(([nestedKey, nestedValue]) => {
        simplified[`${key}.${nestedKey}`] = nestedValue;
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

// 从API_DOCS动态生成示例
function generateApiExamples(): Record<string, unknown> {
  const examples: Record<string, unknown> = {};

  Object.entries(API_DOCS).forEach(([endpointName, doc]) => {
    if (doc.examples) {
      Object.entries(doc.examples).forEach(([exampleName, exampleData]) => {
        const exampleKey = `${endpointName}_${exampleName}`;
        // 确保exampleData是对象类型
        if (typeof exampleData === 'object' && exampleData !== null) {
          const exampleObj = exampleData as Record<string, unknown>;
          examples[exampleKey] = {
            url: doc.endpoint,
            method: doc.method,
            contentType: doc.contentType,
            description: (exampleObj.description as string) || `${doc.description} - ${exampleName}示例`,
            ...exampleObj
          };
        }
      });
    } else {
      // 如果没有预定义示例，创建一个基本示例
      examples[`${endpointName}_basic`] = {
        url: doc.endpoint,
        method: doc.method,
        contentType: doc.contentType,
        description: `${doc.description} - 基本示例`,
        parameters: doc.parameters ? extractBasicExampleParams(doc.parameters) : {}
      };
    }
  });

  return examples;
}

// 从参数定义中提取基本示例参数
function extractBasicExampleParams(params: Parameter): Record<string, unknown> {
  const exampleParams: Record<string, unknown> = {};

  // 如果params本身就是一个ApiParameter
  if ('type' in params) {
    const param = params as ApiParameter;
    return { parameter: param.default || `[${param.type}]` };
  }

  Object.entries(params).forEach(([key, param]) => {
    if (typeof param === 'object' && param !== null && 'type' in param) {
      const apiParam = param as ApiParameter;
      if (apiParam.examples && apiParam.examples.length > 0) {
        exampleParams[key] = apiParam.examples[0];
      } else if (apiParam.default !== undefined) {
        exampleParams[key] = apiParam.default;
      } else {
        exampleParams[key] = `[${apiParam.type}]`;
      }
    }
  });

  return exampleParams;
}

// 生成完整的根API响应
export function generateRootApiResponse(): RootApiResponse {
  return {
    ...API_INFO,
    status: 'active',
    timestamp: new Date().toISOString(),
    endpoints: getAllEndpointsInfo(),
    examples: generateApiExamples()
  };
}
