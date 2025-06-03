#!/usr/bin/env python3
"""
拼豆图纸生成器 API 全功能测试脚本
测试所有API功能，包括自定义调色板
"""

import requests
import json
import os
import time
from datetime import datetime
from pathlib import Path

# API配置
BASE_URL = "http://localhost:3000/api"
TEST_IMAGE = "test_image.png"

def print_header(title):
    """打印美观的标题"""
    print(f"\n{'=' * 70}")
    print(f"🎯 {title}")
    print(f"{'=' * 70}")

def print_step(step, description):
    """打印步骤信息"""
    print(f"\n📋 步骤 {step}: {description}")
    print("-" * 50)

def print_success(message):
    """打印成功信息"""
    print(f"✅ {message}")

def print_error(message):
    """打印错误信息"""
    print(f"❌ {message}")

def print_info(message):
    """打印信息"""
    print(f"ℹ️  {message}")

def test_status_api():
    """测试状态API"""
    print_step(1, "测试API服务状态")

    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/status")
        response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: GET {BASE_URL}/status")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print_success(f"服务状态: {data['status']}")
            print(f"🚀 版本: {data.get('version', 'N/A')}")
            print(f"⏰ 运行时间: {data.get('uptime', 0):.2f}s")

            if 'health' in data:
                health = data['health']
                print(f"💾 内存使用: {health.get('memory_usage', 'N/A')}")

                features = health.get('features', {})
                if features:
                    print("🔧 功能支持:")
                    for feature, status in features.items():
                        status_icon = "✅" if status else "❌"
                        print(f"   {status_icon} {feature}")

            return True
        else:
            print_error(f"状态检查失败: {response.status_code}")
            return False

    except Exception as e:
        print_error(f"状态检查异常: {e}")
        return False

def test_palette_api():
    """测试调色板API"""
    print_step(2, "测试调色板API")

    try:
        # 测试基础调色板信息
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/palette")
        response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: GET {BASE_URL}/palette")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()['data']
            print_success("基础调色板信息获取成功")

            print(f"🎨 可用调色板: {len(data.get('availablePalettes', []))}")
            for palette in data.get('availablePalettes', []):
                print(f"   📦 {palette}")

            print(f"🏷️  颜色系统数量: {len(data.get('colorSystems', []))}")
            for system in data.get('colorSystems', []):
                print(f"   🎯 {system['key']} ({system['name']})")

            print(f"📈 总颜色数: {data.get('totalColors', 'N/A')}")
            print(f"🔧 支持自定义调色板: {data.get('supportsCustomPalette', False)}")

            # 测试详细调色板信息
            print("\n🔍 获取详细调色板信息...")
            detailed_response = requests.get(f"{BASE_URL}/palette?detailed=true")
            if detailed_response.status_code == 200:
                detailed_data = detailed_response.json()['data']
                print_success(f"详细调色板获取成功，包含 {detailed_data['totalColors']} 种颜色")

                # 显示前5种颜色作为示例
                colors = detailed_data.get('colors', [])[:5]
                print("🎨 颜色示例 (前5种):")
                for color in colors:
                    print(f"   {color['key']}: {color['hex']} RGB{color['rgb']}")

                return data
            else:
                print_error(f"获取详细调色板失败: {detailed_response.status_code}")
                return data
        else:
            print_error(f"调色板获取失败: {response.status_code}")
            return None

    except Exception as e:
        print_error(f"调色板测试异常: {e}")
        return None

def test_custom_palette_validation():
    """测试自定义调色板验证"""
    print_step(3, "测试自定义调色板验证")

    # 创建测试调色板
    test_palette = {
        "version": "3.0",
        "selectedHexValues": [
            "#E7002F",
            "#FEFFFF"
        ],
        "exportDate": "2025-06-02T16:09:31.956Z",
        "totalColors": 2
    }

    try:
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/palette",
            json={"customPalette": test_palette},
            headers={"Content-Type": "application/json"}
        )
        response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: POST {BASE_URL}/palette")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")
        print(f"🎨 测试调色板颜色数: {test_palette['totalColors']}")

        if response.status_code == 200:
            data = response.json()['data']
            print_success(f"自定义调色板验证成功")
            print(f"✨ 验证的颜色数: {data['totalColors']}")
            print(f"💬 消息: {data['message']}")

            # 显示验证的颜色
            print("🎨 验证的颜色:")
            for color in data['validatedColors']:
                print(f"   {color['key']}: {color['hex']}")

            return test_palette
        else:
            print_error(f"自定义调色板验证失败: {response.status_code}")
            if response.text:
                error_data = response.json()
                print(f"错误详情: {error_data.get('error', 'N/A')}")
            return None

    except Exception as e:
        print_error(f"自定义调色板验证异常: {e}")
        return None

def test_image_conversion_default_palette(palette_data):
    """测试使用默认调色板的图片转换"""
    print_step(4, "测试图片转换 (默认291色调色板)")

    if not os.path.exists(TEST_IMAGE):
        print_error(f"测试图片 {TEST_IMAGE} 不存在")
        return None

    try:
        # 使用默认调色板
        color_system = palette_data['colorSystems'][0]['key']
        default_palette = palette_data['defaultPalette']

        print(f"📷 图片文件: {TEST_IMAGE}")
        print(f"🎯 使用调色板: {default_palette}")
        print(f"🎨 颜色系统: {color_system}")

        with open(TEST_IMAGE, 'rb') as f:
            files = {'image': (TEST_IMAGE, f, 'image/png')}
            form_data = {
                'granularity': 20,
                'pixelationMode': 'average',
                'selectedPalette': default_palette,
                'selectedColorSystem': color_system,
                'similarityThreshold': '0'
            }

            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/convert",
                files=files,
                data=form_data
            )
            response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: POST {BASE_URL}/convert")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()['data']
            print_success("默认调色板图片转换成功")

            grid_dims = data['gridDimensions']
            print(f"📐 网格尺寸: {grid_dims['width']}x{grid_dims['height']}")
            print(f"🔢 总珠子数: {data['totalBeadCount']}")
            print(f"🎨 使用颜色数: {len(data['colorCounts'])}")

            # 显示处理参数
            params = data['processingParams']
            print(f"⚙️  调色板来源: {params['paletteSource']}")

            # 显示前5种使用的颜色
            color_counts = data['colorCounts']
            sorted_colors = sorted(color_counts.items(), key=lambda x: x[1]['count'], reverse=True)[:5]
            print("🎨 使用最多的颜色 (前5种):")
            for color_key, info in sorted_colors:
                print(f"   {info['color']}: {info['count']} 颗")

            return data
        else:
            print_error(f"默认调色板转换失败: {response.status_code}")
            if response.text:
                error_data = response.json()
                print(f"错误详情: {error_data.get('error', 'N/A')}")
            return None

    except Exception as e:
        print_error(f"默认调色板转换异常: {e}")
        return None

def test_image_conversion_custom_palette(custom_palette):
    """测试使用自定义调色板的图片转换"""
    print_step(5, "测试图片转换 (自定义调色板)")

    if not custom_palette:
        print_error("没有有效的自定义调色板，跳过测试")
        return None

    if not os.path.exists(TEST_IMAGE):
        print_error(f"测试图片 {TEST_IMAGE} 不存在")
        return None

    try:
        print(f"📷 图片文件: {TEST_IMAGE}")
        print(f"🎨 自定义调色板颜色数: {len(custom_palette)}")

        with open(TEST_IMAGE, 'rb') as f:
            files = {'image': (TEST_IMAGE, f, 'image/png')}
            form_data = {
                'granularity': '20',
                'pixelationMode': 'dominant',
                'selectedPalette': '自定义',
                'selectedColorSystem': 'MARD',
                'similarityThreshold': '70',
                'customPalette': json.dumps(custom_palette)
            }

            start_time = time.time()
            response = requests.post(
                f"{BASE_URL}/convert",
                files=files,
                data=form_data
            )
            response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: POST {BASE_URL}/convert")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()['data']
            print_success("自定义调色板图片转换成功")

            grid_dims = data['gridDimensions']
            print(f"📐 网格尺寸: {grid_dims['width']}x{grid_dims['height']}")
            print(f"🔢 总珠子数: {data['totalBeadCount']}")
            print(f"🎨 使用颜色数: {len(data['colorCounts'])}")

            # 显示处理参数
            params = data['processingParams']
            print(f"⚙️  调色板来源: {params['paletteSource']}")
            print(f"🎯 自定义调色板颜色数: {params.get('customPaletteColors', 'N/A')}")

            # 显示所有使用的颜色（因为自定义调色板颜色较少）
            color_counts = data['colorCounts']
            print("🎨 使用的颜色分布:")
            for color_key, info in color_counts.items():
                print(f"   {info['color']}: {info['count']} 颗")

            return data
        else:
            print_error(f"自定义调色板转换失败: {response.status_code}")
            if response.text:
                error_data = response.json()
                print(f"错误详情: {error_data.get('error', 'N/A')}")
            return None

    except Exception as e:
        print_error(f"自定义调色板转换异常: {e}")
        return None

def test_pattern_download(convert_data, output_filename, test_options=None):
    """测试图纸下载"""
    print_step(6, f"测试图纸下载 ({output_filename})")

    if not convert_data:
        print_error("没有转换数据，跳过下载测试")
        return False

    try:
        # 准备下载数据
        download_options = {
            "showGrid": True,
            "gridInterval": 10,
            "showCoordinates": True,
            "includeStats": True,
            "filename": Path(output_filename).stem
        }

        # 添加测试选项
        if test_options:
            download_options.update(test_options)

        download_data = {
            "pixelData": convert_data['pixelData'],
            "gridDimensions": convert_data['gridDimensions'],
            "colorCounts": convert_data['colorCounts'],
            "totalBeadCount": convert_data['totalBeadCount'],
            "activeBeadPalette": convert_data['activeBeadPalette'],
            "selectedColorSystem": convert_data['processingParams']['selectedColorSystem'],
            "downloadOptions": download_options
        }

        print(f"🎯 下载选项:")
        if 'title' in download_options:
            print(f"   📝 标题: {download_options['title']}")
        if 'dpi' in download_options:
            print(f"   🔍 DPI: {download_options['dpi']}")
        print(f"   📐 网格: {download_options['showGrid']}")
        print(f"   📊 统计: {download_options['includeStats']}")

        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/download",
            json=download_data,
            headers={'Content-Type': 'application/json'}
        )
        response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: POST {BASE_URL}/download")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            # 保存文件
            with open(output_filename, 'wb') as f:
                f.write(response.content)

            file_size = len(response.content) / 1024  # KB
            print_success(f"图纸下载成功")
            print(f"💾 保存到: {output_filename}")
            print(f"📁 文件大小: {file_size:.1f} KB")

            return True
        else:
            print_error(f"图纸下载失败: {response.status_code}")
            if response.text:
                error_data = response.json()
                print(f"错误详情: {error_data.get('error', 'N/A')}")
            return False

    except Exception as e:
        print_error(f"图纸下载异常: {e}")
        return False

def test_download_with_title_and_dpi(default_convert_data, custom_convert_data):
    """测试带标题和DPI的下载功能"""
    print_step("6.5", "测试标题和DPI功能")

    if not default_convert_data and not custom_convert_data:
        print_error("没有可用的转换数据，跳过标题和DPI测试")
        return False

    # 优先使用默认调色板数据，如果没有则使用自定义调色板数据
    test_data = default_convert_data if default_convert_data else custom_convert_data
    data_type = "默认调色板" if default_convert_data else "自定义调色板"

    print(f"📊 使用 {data_type} 转换数据进行测试")
    print(f"📐 网格尺寸: {test_data['gridDimensions']['width']}x{test_data['gridDimensions']['height']}")
    print(f"🔢 总珠子数: {test_data['totalBeadCount']}")

    test_cases = [
        {
            "name": "标准DPI无标题",
            "filename": "test_standard_dpi.png",
            "options": {"dpi": 150}
        },
        {
            "name": "高DPI有标题",
            "filename": "test_high_dpi_with_title.png",
            "options": {"dpi": 300, "title": "测试拼豆图纸"}
        },
        {
            "name": "低DPI长标题",
            "filename": "test_low_dpi_long_title.png",
            "options": {"dpi": 72, "title": "这是一个很长的拼豆图纸标题用来测试布局"}
        },
        {
            "name": "超高DPI短标题",
            "filename": "test_ultra_high_dpi.png",
            "options": {"dpi": 600, "title": "高清图纸"}
        }
    ]

    success_count = 0
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 子测试 {i}: {test_case['name']}")
        success = test_pattern_download(
            test_data,
            test_case['filename'],
            test_case['options']
        )
        if success:
            success_count += 1

    print(f"\n📊 标题和DPI测试: {success_count}/{len(test_cases)} 通过")
    return success_count == len(test_cases)

def test_api_documentation():
    """测试API文档端点"""
    print_step(7, "测试API文档端点")

    # 测试主API文档
    print("🔍 测试主API入口文档...")
    try:
        response = requests.get(BASE_URL)
        if response.status_code == 200:
            data = response.json()
            if 'name' in data and 'endpoints' in data:
                print_success("主API文档: 可用")
                print(f"   📦 API名称: {data.get('name', 'N/A')}")
                print(f"   📋 端点数: {len(data.get('endpoints', {}))}")
            else:
                print_info("主API文档: 格式不完整")
        else:
            print_error(f"主API文档: HTTP {response.status_code}")
    except Exception as e:
        print_error(f"主API文档: 异常 - {e}")

    # 测试各个端点的GET文档功能
    endpoints = [
        ("convert", "图片转换API文档", lambda d: "endpoint" in d and "method" in d),
        ("palette", "调色板API文档", lambda d: "success" in d and "data" in d),
        ("download", "下载API文档", lambda d: "endpoint" in d and "method" in d),
        ("status", "状态API文档", lambda d: "service" in d and "status" in d)
    ]

    docs_available = 0
    total_endpoints = len(endpoints)

    for endpoint, description, validator in endpoints:
        try:
            start_time = time.time()
            response = requests.get(f"{BASE_URL}/{endpoint}")
            response_time = (time.time() - start_time) * 1000

            print(f"\n🌐 GET {BASE_URL}/{endpoint}")
            print(f"⏱️  响应时间: {response_time:.2f}ms")
            print(f"📊 状态码: {response.status_code}")

            if response.status_code == 200:
                data = response.json()
                if validator(data):
                    print_success(f"{description}: 可用且格式正确")
                    docs_available += 1

                    # 显示一些关键信息
                    if endpoint == "convert":
                        print(f"   📝 描述: {data.get('description', 'N/A')}")
                        params = data.get('parameters', {})
                        print(f"   🔧 参数数: {len(params)}")
                    elif endpoint == "palette":
                        palette_data = data.get('data', {})
                        print(f"   🎨 调色板数: {len(palette_data.get('availablePalettes', []))}")
                        print(f"   🌈 总颜色数: {palette_data.get('totalColors', 'N/A')}")
                    elif endpoint == "download":
                        print(f"   📝 描述: {data.get('description', 'N/A')}")
                        params = data.get('parameters', {})
                        print(f"   🔧 参数数: {len(params)}")
                    elif endpoint == "status":
                        print(f"   🚀 服务: {data.get('service', 'N/A')}")
                        print(f"   📊 状态: {data.get('status', 'N/A')}")
                        print(f"   ⏰ 运行时间: {data.get('uptime', 0):.2f}s")
                else:
                    print_info(f"{description}: 可用但格式需改进")
            else:
                print_error(f"{description}: HTTP {response.status_code}")
        except Exception as e:
            print_error(f"{description}: 异常 - {e}")

    print(f"\n📊 GET文档端点可用性: {docs_available}/{total_endpoints}")
    return docs_available == total_endpoints

def main():
    """主函数"""
    print_header("拼豆图纸生成器 API 全功能测试")
    print(f"🕐 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 API基础URL: {BASE_URL}")
    print(f"📷 测试图片: {TEST_IMAGE}")

    results = {
        'status': False,
        'palette': False,
        'custom_palette': False,
        'default_convert': False,
        'custom_convert': False,
        'default_download': False,
        'custom_download': False,
        'title_dpi_download': False,
        'documentation': False
    }

    # 1. 测试状态API
    results['status'] = test_status_api()

    # 2. 测试调色板API
    palette_data = test_palette_api()
    results['palette'] = palette_data is not None

    # 3. 测试自定义调色板验证
    custom_palette = test_custom_palette_validation()
    results['custom_palette'] = custom_palette is not None

    # 4. 测试默认调色板图片转换
    default_convert_data = None
    if palette_data:
        default_convert_data = test_image_conversion_default_palette(palette_data)
        results['default_convert'] = default_convert_data is not None

    # 5. 测试自定义调色板图片转换
    custom_convert_data = None
    if custom_palette:
        custom_convert_data = test_image_conversion_custom_palette(custom_palette)
        results['custom_convert'] = custom_convert_data is not None

    # 6. 测试图纸下载
    if default_convert_data:
        results['default_download'] = test_pattern_download(
            default_convert_data,
            "default_palette_pattern.png"
        )

    if custom_convert_data:
        results['custom_download'] = test_pattern_download(
            custom_convert_data,
            "custom_palette_pattern.png"
        )

    # 6.5 测试标题和DPI功能 - 使用真实转换数据
    results['title_dpi_download'] = test_download_with_title_and_dpi(
        default_convert_data,
        custom_convert_data
    )

    # 7. 测试API文档
    results['documentation'] = test_api_documentation()

    # 生成总结报告
    print_header("测试结果总结")

    test_items = [
        ('状态API', results['status']),
        ('调色板API', results['palette']),
        ('自定义调色板验证', results['custom_palette']),
        ('默认调色板转换', results['default_convert']),
        ('自定义调色板转换', results['custom_convert']),
        ('默认调色板下载', results['default_download']),
        ('自定义调色板下载', results['custom_download']),
        ('标题和DPI下载', results['title_dpi_download']),
        ('API文档', results['documentation'])
    ]

    passed_tests = 0
    for test_name, passed in test_items:
        status_icon = "✅" if passed else "❌"
        print(f"{status_icon} {test_name}")
        if passed:
            passed_tests += 1

    success_rate = (passed_tests / len(test_items)) * 100
    print(f"\n📊 测试通过率: {passed_tests}/{len(test_items)} ({success_rate:.1f}%)")

    if success_rate >= 90:
        print("🎉 所有主要功能测试通过！API完全可用")
    elif success_rate >= 70:
        print("⚠️  大部分功能正常，部分功能需要检查")
    else:
        print("❌ 多个功能存在问题，需要调试")

    print_header("全功能测试完成")

if __name__ == "__main__":
    main()
