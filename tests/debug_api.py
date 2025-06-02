#!/usr/bin/env python3
"""
拼豆图纸生成器 API 调试测试脚本
用于测试所有API端点的功能和性能
"""

import requests
import json
import time
import os
from datetime import datetime

# API配置
BASE_URL = "http://localhost:3000/api/v1"
TEST_IMAGE = "test_image.png"

def print_header(title):
    """打印美观的标题"""
    print(f"\n{'=' * 60}")
    print(f"🔍 {title}")
    print(f"{'=' * 60}")

def print_step(step, description):
    """打印步骤信息"""
    print(f"\n📋 步骤{step}: {description}")
    print("-" * 40)

def test_status_api():
    """测试状态API"""
    print_step(1, "测试状态API")
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/status")
        response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: GET {BASE_URL}/status")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            print(f"✅ 服务状态: {data.get('status', 'unknown')}")
            print(f"🚀 版本: {data.get('version', 'unknown')}")
            print(f"⏰ 运行时间: {data.get('uptime', 0):.2f}s")

            # 显示详细健康状态
            health = data.get('health', {})
            print(f"💾 内存使用: {health.get('memory', {}).get('used', 'unknown')} / {health.get('memory', {}).get('total', 'unknown')} MB")

            # 显示功能支持
            features = data.get('features', {})
            print("🔧 功能支持:")
            for feature, enabled in features.items():
                status = "✅" if enabled else "❌"
                print(f"   {status} {feature}")

            return True
        else:
            print(f"❌ 状态API失败: {response.status_code}")
            print(f"📄 错误信息: {response.text}")
            return False
    except Exception as e:
        print(f"❌ 状态API异常: {e}")
        return False

def test_palette_api():
    """测试调色板API"""
    print_step(2, "测试调色板API")
    try:
        start_time = time.time()
        response = requests.get(f"{BASE_URL}/palette")
        response_time = (time.time() - start_time) * 1000

        print(f"🌐 URL: GET {BASE_URL}/palette")
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                palette_data = data['data']
                color_systems = palette_data.get('colorSystems', [])
                print(f"✅ 调色板获取成功")
                print(f"🎨 颜色系统数量: {len(color_systems)}")

                print("🏷️  支持的颜色系统:")
                for i, system in enumerate(color_systems, 1):
                    print(f"   {i}. {system.get('name', 'unknown')} ({system.get('key', 'unknown')})")

                palettes = palette_data.get('palettes', [])
                print(f"🎯 调色板数量: {len(palettes)}")

                return color_systems[0]['key'] if color_systems else None
            else:
                print(f"❌ 调色板API返回失败")
                return None
        else:
            print(f"❌ 调色板API失败: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ 调色板API异常: {e}")
        return None

def test_convert_api(color_system):
    """测试转换API"""
    print_step(3, "测试图片转换API")

    if not os.path.exists(TEST_IMAGE):
        print(f"❌ 测试图片 {TEST_IMAGE} 不存在")
        return None

    try:
        start_time = time.time()

        with open(TEST_IMAGE, 'rb') as f:
            files = {'image': (TEST_IMAGE, f, 'image/png')}
            form_data = {
                'granularity': '20',
                'pixelationMode': 'average',
                'selectedPalette': '168色',
                'selectedColorSystem': color_system or 'MARD'
            }

            print(f"🌐 URL: POST {BASE_URL}/convert")
            print(f"📷 图片: {TEST_IMAGE}")
            print(f"⚙️  参数: {form_data}")

            response = requests.post(
                f"{BASE_URL}/convert",
                files=files,
                data=form_data,
                timeout=30
            )

        response_time = (time.time() - start_time) * 1000
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                result = data['data']
                print(f"✅ 转换成功")
                print(f"📏 网格尺寸: {result['gridDimensions']['N']}x{result['gridDimensions']['M']}")
                print(f"🎨 使用颜色数: {len(result['colorCounts'])}")
                print(f"🔢 总珠子数: {result['totalBeadCount']}")
                print(f"🎯 活跃调色板: {len(result.get('activeBeadPalette', []))} 种颜色")

                # 显示颜色统计摘要
                print("🌈 颜色使用统计 (前5种):")
                color_items = list(result['colorCounts'].items())[:5]
                for color_hex, color_info in color_items:
                    count = color_info.get('count', 0)
                    print(f"   {color_hex}: {count} 颗")

                return result
            else:
                print(f"❌ 转换返回失败: {data}")
                return None
        else:
            print(f"❌ 转换API失败: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"📄 错误内容: {response.text}")
            return None
    except Exception as e:
        print(f"❌ 转换API异常: {e}")
        return None

def test_download_api(convert_data, color_system):
    """测试下载API"""
    print_step(4, "测试图纸下载API")

    if not convert_data:
        print("❌ 没有转换数据，跳过下载测试")
        return False

    try:
        start_time = time.time()

        download_data = {
            "pixelData": convert_data['pixelData'],
            "gridDimensions": convert_data['gridDimensions'],
            "colorCounts": convert_data['colorCounts'],
            "totalBeadCount": convert_data['totalBeadCount'],
            "activeBeadPalette": convert_data.get('activeBeadPalette', []),
            "selectedColorSystem": color_system or 'MARD',
            "downloadOptions": {
                "showGrid": True,
                "gridInterval": 10,
                "showCoordinates": True,
                "gridLineColor": "#CCCCCC",
                "includeStats": True,
                "filename": "debug_test"
            }
        }

        print(f"🌐 URL: POST {BASE_URL}/download")
        print(f"📊 数据大小: ~{len(str(download_data))} 字符")

        response = requests.post(
            f"{BASE_URL}/download",
            json=download_data,
            timeout=30
        )

        response_time = (time.time() - start_time) * 1000
        print(f"⏱️  响应时间: {response_time:.2f}ms")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            file_size = len(response.content)
            output_file = "debug_download_test.png"

            with open(output_file, 'wb') as f:
                f.write(response.content)

            print(f"✅ 下载成功")
            print(f"📄 文件大小: {file_size:,} 字节")
            print(f"💾 保存为: {output_file}")

            # 验证文件
            if os.path.exists(output_file) and os.path.getsize(output_file) > 0:
                print(f"✅ 文件验证通过")
                return True
            else:
                print(f"❌ 文件验证失败")
                return False
        else:
            print(f"❌ 下载API失败: {response.status_code}")
            try:
                error_data = response.json()
                print(f"📄 错误详情: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"📄 错误内容: {response.text[:200]}...")
            return False
    except Exception as e:
        print(f"❌ 下载API异常: {e}")
        return False

def main():
    """主测试函数"""
    print_header(f"拼豆图纸生成器 API 调试测试")
    print(f"🕐 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 API基础URL: {BASE_URL}")

    # 测试统计
    tests = []

    # 1. 测试状态API
    status_ok = test_status_api()
    tests.append(("状态API", status_ok))

    # 2. 测试调色板API
    color_system = test_palette_api()
    tests.append(("调色板API", color_system is not None))

    # 3. 测试转换API
    convert_data = test_convert_api(color_system)
    tests.append(("转换API", convert_data is not None))

    # 4. 测试下载API
    download_ok = test_download_api(convert_data, color_system)
    tests.append(("下载API", download_ok))

    # 测试结果总结
    print_header("测试结果总结")
    passed = 0
    for test_name, result in tests:
        status = "✅ 通过" if result else "❌ 失败"
        print(f"{status} {test_name}")
        if result:
            passed += 1

    print(f"\n📊 测试通过率: {passed}/{len(tests)} ({passed/len(tests)*100:.1f}%)")

    if passed == len(tests):
        print("🎉 所有API测试通过！系统运行正常。")
    else:
        print("⚠️  部分API测试失败，请检查系统状态。")

    print_header("调试测试完成")

if __name__ == "__main__":
    main()
