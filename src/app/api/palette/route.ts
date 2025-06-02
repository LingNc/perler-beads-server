import { NextRequest, NextResponse } from 'next/server';
import { getMardToHexMapping, getColorSystemOptions } from '../../../utils/colorSystemUtils';
import { hexToRgb } from '../../../utils/pixelation';

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
    const { colors, customPalette } = body;

    // 支持新格式：{ version: "3.0", selectedHexValues: ["#RRGGBB", ...] }
    if (customPalette && customPalette.selectedHexValues) {
      const { selectedHexValues, version, totalColors } = customPalette;

      if (!Array.isArray(selectedHexValues)) {
        return NextResponse.json({
          success: false,
          error: 'selectedHexValues必须是数组格式'
        }, { status: 400 });
      }

      // 验证颜色格式
      const validatedColors = [];
      const errors = [];

      for (let i = 0; i < selectedHexValues.length; i++) {
        const hexValue = selectedHexValues[i];

        if (typeof hexValue !== 'string' || !hexValue.startsWith('#')) {
          errors.push(`第${i + 1}个颜色的hex值格式无效: ${hexValue}`);
          continue;
        }

        const rgb = hexToRgb(hexValue);
        if (!rgb) {
          errors.push(`第${i + 1}个颜色的hex值格式无效: ${hexValue}`);
          continue;
        }

        validatedColors.push({
          key: hexValue,
          hex: hexValue,
          rgb: rgb
        });
      }

      if (errors.length > 0) {
        return NextResponse.json({
          success: false,
          error: '颜色验证失败',
          details: errors
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        data: {
          validatedColors: validatedColors,
          totalColors: validatedColors.length,
          version: version,
          message: '自定义调色板验证成功'
        }
      });
    }

    // 支持旧格式：{ colors: [{ key: "颜色名", hex: "#RRGGBB" }] }
    if (!Array.isArray(colors)) {
      return NextResponse.json({
        success: false,
        error: '颜色数据必须是数组格式'
      }, { status: 400 });
    }

    // 验证颜色格式
    const validatedColors = [];
    const errors = [];

    for (let i = 0; i < colors.length; i++) {
      const color = colors[i];

      if (!color.hex || !color.key) {
        errors.push(`第${i + 1}个颜色缺少必要的hex或key字段`);
        continue;
      }

      const rgb = hexToRgb(color.hex);
      if (!rgb) {
        errors.push(`第${i + 1}个颜色的hex值格式无效: ${color.hex}`);
        continue;
      }

      validatedColors.push({
        key: color.key,
        hex: color.hex,
        rgb: rgb
      });
    }

    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        error: '颜色验证失败',
        details: errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      data: {
        validatedColors: validatedColors,
        totalColors: validatedColors.length,
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
