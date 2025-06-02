#!/usr/bin/env python3
"""
测试下载API - 使用新的数据格式
"""

import requests
import json
import sys
import os

# API基础URL
BASE_URL = "http://localhost:3000/api"

def test_download_api():
    """测试下载API"""
    print("🧪 测试下载API...")

    # 构造完整的测试数据
    test_data = {
        "pixelData": [
            [
                {"color": "#FF0000", "isExternal": False},
                {"color": "#00FF00", "isExternal": False},
                {"color": "#0000FF", "isExternal": False}
            ],
            [
                {"color": "#FFFF00", "isExternal": False},
                {"color": "#FF00FF", "isExternal": False},
                {"color": "#00FFFF", "isExternal": False}
            ],
            [
                {"color": "#FFFFFF", "isExternal": False},
                {"color": "#000000", "isExternal": False},
                {"color": "#808080", "isExternal": False}
            ]
        ],
        "gridDimensions": {
            "N": 3,
            "M": 3
        },
        "colorCounts": {
            "A1": {"count": 1, "color": "#FF0000"},
            "A2": {"count": 1, "color": "#00FF00"},
            "A3": {"count": 1, "color": "#0000FF"},
            "B1": {"count": 1, "color": "#FFFF00"},
            "B2": {"count": 1, "color": "#FF00FF"},
            "B3": {"count": 1, "color": "#00FFFF"},
            "C1": {"count": 1, "color": "#FFFFFF"},
            "C2": {"count": 1, "color": "#000000"},
            "C3": {"count": 1, "color": "#808080"}
        },
        "totalBeadCount": 9,
        "activeBeadPalette": [
            {"name": "Red", "hex": "#FF0000", "key": "A1"},
            {"name": "Green", "hex": "#00FF00", "key": "A2"},
            {"name": "Blue", "hex": "#0000FF", "key": "A3"},
            {"name": "Yellow", "hex": "#FFFF00", "key": "B1"},
            {"name": "Magenta", "hex": "#FF00FF", "key": "B2"},
            {"name": "Cyan", "hex": "#00FFFF", "key": "B3"},
            {"name": "White", "hex": "#FFFFFF", "key": "C1"},
            {"name": "Black", "hex": "#000000", "key": "C2"},
            {"name": "Gray", "hex": "#808080", "key": "C3"}
        ],
        "selectedColorSystem": "hama",
        "downloadOptions": {
            "showGrid": True,
            "gridInterval": 10,
            "showCoordinates": True,
            "gridLineColor": "#CCCCCC",
            "includeStats": True,
            "filename": "test_pattern"
        }
    }

    try:
        print(f"📤 发送请求到 {BASE_URL}/download")
        print(f"📦 数据大小: {len(json.dumps(test_data))} 字节")

        response = requests.post(
            f"{BASE_URL}/download",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        print(f"📊 状态码: {response.status_code}")
        print(f"📋 响应头: {dict(response.headers)}")

        if response.status_code == 200:
            # 检查是否返回了图片数据
            content_type = response.headers.get('content-type', '')
            content_length = len(response.content)

            print(f"✅ 下载成功!")
            print(f"📄 内容类型: {content_type}")
            print(f"📏 文件大小: {content_length} 字节")

            if content_type.startswith('image/'):
                # 保存图片文件
                filename = "downloaded_pattern.png"
                with open(filename, 'wb') as f:
                    f.write(response.content)
                print(f"💾 图片已保存为: {filename}")

                # 验证文件
                if os.path.exists(filename) and os.path.getsize(filename) > 0:
                    print(f"✅ 文件验证成功: {os.path.getsize(filename)} 字节")
                else:
                    print("❌ 文件验证失败")
            else:
                print("❌ 返回的不是图片格式")
                print(f"响应内容: {response.text[:500]}")
        else:
            print(f"❌ 请求失败")
            try:
                error_data = response.json()
                print(f"错误信息: {json.dumps(error_data, indent=2, ensure_ascii=False)}")
            except:
                print(f"响应内容: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ 网络错误: {e}")
    except Exception as e:
        print(f"❌ 其他错误: {e}")

def test_download_api_docs():
    """测试下载API文档"""
    print("\n📖 测试下载API文档...")

    try:
        response = requests.get(f"{BASE_URL}/download")
        print(f"📊 状态码: {response.status_code}")

        if response.status_code == 200:
            docs = response.json()
            print("✅ API文档获取成功:")
            print(json.dumps(docs, indent=2, ensure_ascii=False))
        else:
            print(f"❌ 获取文档失败: {response.text}")

    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    print("🚀 下载API测试开始")
    print("=" * 50)

    # 测试API文档
    test_download_api_docs()

    print("\n" + "=" * 50)

    # 测试下载功能
    test_download_api()

    print("\n" + "=" * 50)
    print("🏁 测试完成")
