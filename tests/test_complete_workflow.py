#!/usr/bin/env python3
"""
完整API流程测试 - 从图片转换到下载
"""

import requests
import json
import base64
import os

# API基础URL
BASE_URL = "http://localhost:3000/api"

def encode_image_to_base64(image_path):
    """将图片编码为base64"""
    try:
        with open(image_path, 'rb') as image_file:
            return base64.b64encode(image_file.read()).decode('utf-8')
    except Exception as e:
        print(f"❌ 图片编码失败: {e}")
        return None

def test_complete_workflow():
    """测试完整的工作流程"""
    print("🚀 完整API工作流程测试")
    print("=" * 60)

    # 1. 检查测试图片
    test_image = "test_image.png"
    if not os.path.exists(test_image):
        print(f"❌ 测试图片 {test_image} 不存在")
        return

    print(f"📷 使用测试图片: {test_image}")

    # 2. 获取调色板列表
    print("\n🎨 步骤1: 获取调色板...")
    try:
        palette_response = requests.get(f"{BASE_URL}/palette")
        if palette_response.status_code != 200:
            print(f"❌ 获取调色板失败: {palette_response.status_code}")
            return

        palette_data = palette_response.json()
        color_systems = palette_data['data']['colorSystems']
        print(f"✅ 获取到 {len(color_systems)} 个颜色系统")

        # 使用第一个颜色系统
        color_system = color_systems[0]['key']
        print(f"🎯 使用颜色系统: {color_system}")

    except Exception as e:
        print(f"❌ 调色板请求失败: {e}")
        return

    # 3. 编码图片
    print("\n📤 步骤2: 编码图片...")
    image_base64 = encode_image_to_base64(test_image)
    if not image_base64:
        return

    print(f"✅ 图片编码完成: {len(image_base64)} 字符")

    # 4. 转换图片
    print("\n🔄 步骤3: 转换图片...")

    # 准备FormData
    with open(test_image, 'rb') as image_file:
        files = {'image': (test_image, image_file, 'image/png')}
        form_data = {
            'granularity': '20',
            'pixelationMode': 'average',
            'selectedPalette': '168色',
            'selectedColorSystem': color_system
        }

        try:
            convert_response = requests.post(
                f"{BASE_URL}/convert",
                files=files,
                data=form_data,
                timeout=30
            )

            if convert_response.status_code != 200:
                print(f"❌ 图片转换失败: {convert_response.status_code}")
                try:
                    error_data = convert_response.json()
                    print(f"错误信息: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
                except:
                    print(f"响应内容: {convert_response.text}")
                return

            convert_result = convert_response.json()

            # 检查响应结构
            if not convert_result.get('success'):
                print(f"❌ 转换失败: {convert_result}")
                return

            # 获取实际数据
            data = convert_result['data']
            print(f"✅ 图片转换成功!")
            print(f"📏 网格尺寸: {data['gridDimensions']['N']}x{data['gridDimensions']['M']}")
            print(f"🎨 颜色数量: {len(data['colorCounts'])}")
            print(f"🔢 总珠子数: {data['totalBeadCount']}")

        except Exception as e:
            print(f"❌ 转换请求失败: {e}")
            return

    # 5. 下载图纸
    print("\n⬇️ 步骤4: 下载图纸...")
    download_data = {
        "pixelData": data['pixelData'],
        "gridDimensions": data['gridDimensions'],
        "colorCounts": data['colorCounts'],
        "totalBeadCount": data['totalBeadCount'],
        "activeBeadPalette": data['activeBeadPalette'],
        "selectedColorSystem": color_system,
        "downloadOptions": {
            "showGrid": True,
            "gridInterval": 10,
            "showCoordinates": True,
            "gridLineColor": "#CCCCCC",
            "includeStats": True,
            "filename": "complete_workflow_test"
        }
    }

    try:
        download_response = requests.post(
            f"{BASE_URL}/download",
            json=download_data,
            timeout=30
        )

        if download_response.status_code != 200:
            print(f"❌ 下载失败: {download_response.status_code}")
            try:
                error_data = download_response.json()
                print(f"错误信息: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"响应内容: {download_response.text}")
            return

        # 保存下载的图片
        output_filename = "complete_workflow_result.png"
        with open(output_filename, 'wb') as f:
            f.write(download_response.content)

        file_size = len(download_response.content)
        print(f"✅ 下载成功!")
        print(f"📄 文件大小: {file_size} 字节")
        print(f"💾 保存为: {output_filename}")

        # 验证文件
        if os.path.exists(output_filename) and os.path.getsize(output_filename) > 0:
            print(f"✅ 文件验证成功")
        else:
            print(f"❌ 文件验证失败")

    except Exception as e:
        print(f"❌ 下载请求失败: {e}")
        return

    print("\n" + "=" * 60)
    print("🎉 完整工作流程测试成功!")
    print("📋 流程总结:")
    print("  1. ✅ 获取调色板")
    print("  2. ✅ 编码图片")
    print("  3. ✅ 转换图片")
    print("  4. ✅ 下载图纸")

if __name__ == "__main__":
    test_complete_workflow()
