#!/usr/bin/env python3
"""
API文档示例验证脚本
验证API文档中的示例代码是否能正常工作
"""

import requests
import json
import time
from datetime import datetime

BASE_URL = "http://localhost:3000/api"
TEST_IMAGE = "test_image.png"

def print_header(title):
    print(f"\n{'='*60}")
    print(f"🧪 {title}")
    print(f"{'='*60}")

def print_step(step, description):
    print(f"\n📋 步骤 {step}: {description}")
    print("-" * 50)

def print_success(message):
    print(f"✅ {message}")

def print_error(message):
    print(f"❌ {message}")

def test_basic_workflow():
    """测试基础工作流程 - 按照文档示例"""
    print_step(1, "测试基础工作流程")

    try:
        # 1. 检查API状态
        print("1️⃣ 检查API状态...")
        status_response = requests.get(f"{BASE_URL}/status")
        if status_response.status_code == 200:
            print_success("API服务正常")
        else:
            print_error("API服务异常")
            return False

        # 2. 获取调色板信息
        print("2️⃣ 获取调色板信息...")
        palette_response = requests.get(f"{BASE_URL}/palette")
        if palette_response.status_code == 200:
            palette_data = palette_response.json()
            print_success(f"支持 {palette_data['data']['totalColors']} 种颜色")
            print_success(f"自定义调色板支持: {palette_data['data']['supportsCustomPalette']}")
        else:
            print_error("获取调色板信息失败")
            return False

        # 3. 转换图片
        print("3️⃣ 转换图片...")
        with open(TEST_IMAGE, 'rb') as f:
            files = {'image': ('image.png', f, 'image/png')}
            form_data = {
                'granularity': '50',
                'selectedPalette': '291色',
                'selectedColorSystem': 'MARD'
            }

            convert_response = requests.post(
                f"{BASE_URL}/convert",
                files=files,
                data=form_data
            )

        if convert_response.status_code == 200:
            convert_data = convert_response.json()['data']
            print_success(f"转换成功: {convert_data['gridDimensions']['N']}x{convert_data['gridDimensions']['M']}")
            print_success(f"总珠子数: {convert_data['totalBeadCount']}")
            print_success(f"使用颜色数: {len(convert_data['colorCounts'])}")
        else:
            print_error("图片转换失败")
            return False

        # 4. 生成图纸
        print("4️⃣ 生成图纸...")
        download_data = {
            "pixelData": convert_data['pixelData'],
            "gridDimensions": convert_data['gridDimensions'],
            "colorCounts": convert_data['colorCounts'],
            "totalBeadCount": convert_data['totalBeadCount'],
            "activeBeadPalette": convert_data['activeBeadPalette'],
            "selectedColorSystem": convert_data['processingParams']['selectedColorSystem'],
            "downloadOptions": {
                "cellSize": 30,
                "showGrid": True,
                "includeStats": True,
                "filename": f"doc_test_pattern_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            }
        }

        download_response = requests.post(
            f"{BASE_URL}/download",
            json=download_data
        )

        if download_response.status_code == 200:
            filename = "doc_test_basic_pattern.png"
            with open(filename, 'wb') as f:
                f.write(download_response.content)
            print_success(f"图纸生成成功: {filename}")
            print_success(f"文件大小: {len(download_response.content) / 1024:.1f} KB")
            return True
        else:
            print_error("图纸生成失败")
            return False

    except Exception as e:
        print_error(f"基础工作流程异常: {e}")
        return False

def test_custom_palette_workflow():
    """测试自定义调色板工作流程 - 按照文档示例"""
    print_step(2, "测试自定义调色板工作流程")

    try:
        # 1. 定义自定义调色板 - 按照文档格式
        custom_palette = {
            "version": "3.0",
            "selectedHexValues": [
                "#E7002F",  # 红色
                "#FEFFFF",  # 白色
                "#00FF00",  # 绿色
                "#0000FF",  # 蓝色
                "#FFFF00"   # 黄色
            ],
            "exportDate": datetime.now().isoformat(),
            "totalColors": 5
        }

        # 2. 验证自定义调色板
        print("1️⃣ 验证自定义调色板...")
        validation_response = requests.post(
            f"{BASE_URL}/palette",
            json={"customPalette": custom_palette}
        )

        if validation_response.status_code == 200:
            validation_data = validation_response.json()['data']
            print_success(f"调色板验证成功: {validation_data['totalColors']} 种颜色")
        else:
            print_error("调色板验证失败")
            print(validation_response.json())
            return False

        # 3. 使用自定义调色板转换图片
        print("2️⃣ 使用自定义调色板转换图片...")
        with open(TEST_IMAGE, 'rb') as f:
            files = {'image': ('image.png', f, 'image/png')}
            form_data = {
                'granularity': '40',
                'selectedPalette': '自定义',
                'customPalette': json.dumps(custom_palette)
            }

            convert_response = requests.post(
                f"{BASE_URL}/convert",
                files=files,
                data=form_data
            )

        if convert_response.status_code == 200:
            convert_data = convert_response.json()['data']
            print_success("自定义调色板转换成功")
            print_success(f"网格尺寸: {convert_data['gridDimensions']['N']}x{convert_data['gridDimensions']['M']}")
            print_success(f"调色板来源: {convert_data['processingParams']['paletteSource']}")
            print_success(f"自定义颜色数: {convert_data['processingParams']['customPaletteColors']}")

            # 4. 生成自定义调色板图纸
            print("3️⃣ 生成自定义调色板图纸...")
            download_data = {
                "pixelData": convert_data['pixelData'],
                "gridDimensions": convert_data['gridDimensions'],
                "colorCounts": convert_data['colorCounts'],
                "totalBeadCount": convert_data['totalBeadCount'],
                "activeBeadPalette": convert_data['activeBeadPalette'],
                "selectedColorSystem": convert_data['processingParams']['selectedColorSystem'],
                "downloadOptions": {
                    "cellSize": 25,
                    "showGrid": True,
                    "includeStats": True,
                    "filename": "doc_test_custom_palette_pattern.png"
                }
            }

            download_response = requests.post(
                f"{BASE_URL}/download",
                json=download_data
            )

            if download_response.status_code == 200:
                with open('doc_test_custom_palette_pattern.png', 'wb') as f:
                    f.write(download_response.content)
                print_success("自定义调色板图纸生成成功!")
                return True
            else:
                print_error("图纸生成失败")
                return False
        else:
            print_error("图片转换失败")
            print(convert_response.json())
            return False

    except Exception as e:
        print_error(f"自定义调色板工作流程异常: {e}")
        return False

def test_api_endpoints_documentation():
    """测试API端点文档是否正确"""
    print_step(3, "测试API端点文档")

    endpoints = [
        ("status", "状态API"),
        ("palette", "调色板API"),
        ("convert", "转换API"),
        ("download", "下载API"),
        ("", "根API文档")
    ]

    success_count = 0

    for endpoint, description in endpoints:
        try:
            response = requests.get(f"{BASE_URL}/{endpoint}")
            if response.status_code == 200:
                print_success(f"{description}: 可访问")
                success_count += 1
            else:
                print_error(f"{description}: HTTP {response.status_code}")
        except Exception as e:
            print_error(f"{description}: 异常 - {e}")

    print(f"\n📊 端点可用性: {success_count}/{len(endpoints)}")
    return success_count == len(endpoints)

def main():
    """主函数 - 验证API文档示例"""
    print_header("API文档示例验证")
    print(f"🕐 测试时间: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🔗 API基础URL: {BASE_URL}")
    print(f"📷 测试图片: {TEST_IMAGE}")

    results = {
        'basic_workflow': False,
        'custom_palette': False,
        'endpoints': False
    }

    # 执行测试
    results['basic_workflow'] = test_basic_workflow()
    results['custom_palette'] = test_custom_palette_workflow()
    results['endpoints'] = test_api_endpoints_documentation()

    # 统计结果
    print_header("API文档验证结果")
    success_count = sum(results.values())
    total_tests = len(results)

    for test_name, success in results.items():
        status = "✅" if success else "❌"
        print(f"{status} {test_name.replace('_', ' ').title()}")

    print(f"\n📊 文档示例验证通过率: {success_count}/{total_tests} ({success_count/total_tests*100:.1f}%)")

    if success_count == total_tests:
        print("\n🎉 所有API文档示例验证通过！")
    else:
        print("\n⚠️ 部分文档示例需要检查修正")

    print("\n" + "="*60)

if __name__ == "__main__":
    main()
