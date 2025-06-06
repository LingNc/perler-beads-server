#!/usr/bin/env python3
"""
API文档一致性验证脚本
确保所有API端点都使用中央配置，避免重复维护
"""

import requests
import json
import sys
from typing import Dict, List, Any, Optional

API_BASE = 'http://localhost:3000'

ENDPOINTS = [
    {'name': 'root', 'path': '/api', 'method': 'GET'},
    {'name': 'convert', 'path': '/api/convert', 'method': 'GET'},
    {'name': 'download', 'path': '/api/download', 'method': 'GET'},
    {'name': 'palette', 'path': '/api/palette?docs=true', 'method': 'GET'},
    {'name': 'status', 'path': '/api/status?docs=true', 'method': 'GET'}
]

def fetch_json(url: str) -> Optional[Dict[str, Any]]:
    """获取API响应JSON数据"""
    try:
        response = requests.get(url, timeout=5)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        print(f"ERROR: 网络错误: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"ERROR: JSON解析错误: {e}")
        return None

def validate_endpoint(endpoint: Dict[str, str]) -> Dict[str, Any]:
    """验证单个端点"""
    print(f"检查 {endpoint['name']} ({endpoint['path']})")

    url = f"{API_BASE}{endpoint['path']}"
    response = fetch_json(url)

    if response is None:
        return {
            'endpoint': endpoint['name'],
            'passed': False,
            'error': '无法获取响应'
        }

    # 基本检查
    checks = {
        'hasDescription': bool(response.get('description')),
        'hasEndpoint': bool(response.get('endpoint')) or endpoint['name'] == 'root',
        'hasParameters': bool(response.get('parameters')) or bool(response.get('endpoints')) or endpoint['name'] == 'status',
        'hasValidStructure': isinstance(response, dict)
    }

    # 特定检查
    if endpoint['name'] == 'download':
        download_options = response.get('parameters', {}).get('downloadOptions', {})
        checks['hasOuterBorderColor'] = bool(download_options.get('outerBorderColor'))
        checks['hasShowTransparentLabels'] = bool(download_options.get('showTransparentLabels'))

    if endpoint['name'] == 'root':
        features = response.get('features', [])
        checks['hasNewFeatures'] = (
            '外边框颜色控制' in features and
            '透明色标识控制' in features
        )

    passed = all(checks.values())

    if passed:
        print(f"SUCCESS: {endpoint['name']}: 通过")
    else:
        print(f"FAILED: {endpoint['name']}: 失败")
        print(f"   详情: {json.dumps(checks, indent=2, ensure_ascii=False)}")

    # 准备响应摘要
    if endpoint['name'] == 'root':
        response_summary = {'features': response.get('features', [])[:3]}
    else:
        response_summary = {
            'description': response.get('description'),
            'endpoint': response.get('endpoint')
        }

    return {
        'endpoint': endpoint['name'],
        'passed': passed,
        'checks': checks,
        'response': response_summary
    }

def validate_all_docs() -> bool:
    """验证所有API文档"""
    print('验证API文档一致性...\n')

    results = []
    all_passed = True

    for endpoint in ENDPOINTS:
        result = validate_endpoint(endpoint)
        results.append(result)

        if not result['passed']:
            all_passed = False

        print()  # 空行分隔

    # 打印汇总结果
    print('验证结果汇总:')
    print('=' * 20)

    for result in results:
        status = 'PASS' if result['passed'] else 'FAIL'
        print(f"{status} {result['endpoint']}")

        if 'response' in result and result['response']:
            response_str = json.dumps(result['response'], indent=2, ensure_ascii=False)
            # 添加缩进
            indented_response = '\n'.join(f"   {line}" for line in response_str.split('\n'))
            print(indented_response)

    # 关键新功能检查
    print('\n关键新功能检查:')

    download_result = next((r for r in results if r['endpoint'] == 'download'), None)
    if download_result and 'checks' in download_result:
        checks = download_result['checks']
        print(f"   外边框颜色参数: {'PASS' if checks.get('hasOuterBorderColor') else 'FAIL'}")
        print(f"   透明标识参数: {'PASS' if checks.get('hasShowTransparentLabels') else 'FAIL'}")

    root_result = next((r for r in results if r['endpoint'] == 'root'), None)
    if root_result and 'checks' in root_result:
        checks = root_result['checks']
        print(f"   根API新功能: {'PASS' if checks.get('hasNewFeatures') else 'FAIL'}")

    # 总体结果
    print(f"\n总体结果: {'SUCCESS: 全部通过!' if all_passed else 'WARNING: 存在问题'}")

    if all_passed:
        print('\nSUCCESS: API文档重构成功完成！')
        print('现在只需要在 src/config/apiDocs.ts 中维护文档')
        print('添加新参数时无需更新多个文件')

    return all_passed

def main():
    """主函数"""
    try:
        success = validate_all_docs()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print('\n\n验证已取消')
        sys.exit(1)
    except Exception as e:
        print(f'\nERROR: 验证脚本执行失败: {e}')
        sys.exit(1)

if __name__ == '__main__':
    main()
