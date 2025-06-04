import { NextRequest, NextResponse } from 'next/server';
import { getMardToHexMapping, getColorSystemOptions, ColorSystem } from '../../../utils/colorSystemUtils';
import { hexToRgb } from '../../../utils/pixelation';
import { validateCustomPalette } from '../../../utils/apiUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const colorSystem = searchParams.get('colorSystem') || 'MARD';
    const detailed = searchParams.get('detailed') === 'true';

    // 获取调色板数据
    const mardToHexMapping = getMardToHexMapping();

    if (detailed) {
      // 返回详细的调色板信息
      const paletteColors = Object.entries(mardToHexMapping).map(([mardKey, hex]) => {
        const rgb = hexToRgb(hex);
        return {
          key: mardKey,
          hex: hex,
          rgb: rgb,
          colorSystem: colorSystem
        };
      });

      return NextResponse.json({
        success: true,
        data: {
          colorSystem: colorSystem,
          totalColors: paletteColors.length,
          colors: paletteColors
        }
      });
    } else {
      // 返回简单的调色板选项
      const totalColors = Object.keys(mardToHexMapping).length;
      const paletteOptions = [
        { name: '291色', description: '完整色板', colorCount: totalColors },
        { name: '自定义', description: '用户上传的调色板', colorCount: 0 }
      ];

      const colorSystems = getColorSystemOptions();

      return NextResponse.json({
        success: true,
        data: {
          availablePalettes: paletteOptions.map(p => p.name),
          paletteOptions: paletteOptions,
          colorSystems: colorSystems,
          defaultColorSystem: 'MARD',
          defaultPalette: '291色',
          totalColors: totalColors,
          supportsCustomPalette: true
        }
      });
    }

  } catch (error) {
    console.error('获取调色板数据错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '获取调色板失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

// 支持POST请求用于自定义调色板验证
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customPalette, colorSystem = 'MARD' } = body;

    // 使用通用验证函数进行验证
    const validationResult = validateCustomPalette(customPalette, colorSystem as ColorSystem, {
      checkColorSystemExistence: true, // API 验证时需要检查色号系统存在性
      allowEmptyPalette: false
    });

    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: validationResult.errors.length === 1 ? '颜色验证失败' : '颜色验证失败',
        details: validationResult.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        validatedColors: validationResult.validatedColors,
        totalColors: validationResult.validatedColors!.length,
        version: customPalette.version,
        colorSystem: colorSystem,
        message: '自定义调色板验证成功'
      }
    });

  } catch (error) {
    console.error('调色板验证错误:', error);
    return NextResponse.json(
      {
        success: false,
        error: '调色板验证失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}
