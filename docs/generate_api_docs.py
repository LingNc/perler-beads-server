#!/usr/bin/env python3
"""
API 文档生成器
直接通过 HTTP 请求从运行中的服务器获取 API 文档数据
"""

import os
import sys
import json
import requests
import argparse
import time
from typing import Dict, Any, List, Optional

def get_api_docs_data(base_url: str) -> Dict[str, Any]:
    """通过 HTTP 请求获取 API 文档数据"""
    print(f"📡 从服务器获取 API 文档: {base_url}")

    # API 端点配置
    endpoints = {
        'convert': '/api/convert',
        'download': '/api/download',
        'palette': '/api/palette?docs=true',
        'status': '/api/status?docs=true'
    }

    api_docs = {}
    api_info = None

    try:
        # 首先获取根 API 信息
        print("  📋 获取根 API 信息...")
        response = requests.get(f"{base_url}/api", timeout=10)
        response.raise_for_status()
        api_info = response.json()
        print("  ✅ 根 API 信息获取成功")

        # 获取各端点的文档
        for name, path in endpoints.items():
            print(f"  📄 获取 {name} 端点文档...")
            response = requests.get(f"{base_url}{path}", timeout=10)
            response.raise_for_status()
            api_docs[name] = response.json()
            print(f"  ✅ {name} 文档获取成功")

        return {
            'API_DOCS': api_docs,
            'API_INFO': api_info
        }

    except requests.exceptions.ConnectionError:
        print(f"❌ 无法连接到服务器: {base_url}")
        print("💡 请确保开发服务器正在运行：npm run dev")
        return {}
    except requests.exceptions.Timeout:
        print(f"❌ 请求超时: {base_url}")
        return {}
    except requests.exceptions.RequestException as e:
        print(f"❌ 请求失败: {e}")
        return {}
    except Exception as e:
        print(f"❌ 获取 API 文档失败: {e}")
        return {}

def format_type_description(param_type: str, description: str = "") -> str:
    """格式化类型描述"""
    type_map = {
        'File': '文件',
        'number': '数字',
        'string': '字符串',
        'boolean': '布尔值',
        'object': '对象',
        'array': '数组',
        'binary': '二进制数据'
    }

    display_type = type_map.get(param_type, param_type)
    return f"{display_type} - {description}" if description else display_type

def parse_method_indicators(description: str) -> tuple[str, str]:
    """解析描述中的方法指示符，返回 (适用方法, 清理后的描述)"""
    import re

    # 匹配如 [GET]、[POST]、[GET,detail=false] 等模式
    method_pattern = r'\[([^\]]+)\]'
    matches = re.findall(method_pattern, description)

    if not matches:
        return "ALL", description

    # 解析方法标记
    methods = set()
    conditions = []

    for match in matches:
        # 处理如 "GET,detail=false" 的情况
        if ',' in match:
            parts = match.split(',')
            method_part = parts[0].strip()
            condition_part = ','.join(parts[1:]).strip()
            methods.add(method_part)
            if condition_part:
                conditions.append(condition_part)
        else:
            # 检查是否是纯方法名
            if match.upper() in ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']:
                methods.add(match.upper())
            else:
                # 可能是条件，如 "detail=true"
                conditions.append(match)

    # 移除方法标记，清理描述
    clean_description = re.sub(method_pattern, '', description).strip()

    # 格式化方法列表
    if methods:
        method_list = sorted(list(methods))
        if conditions:
            # 如果有条件，添加到方法后面
            result_method = "/".join(method_list) + f" ({','.join(conditions)})"
        else:
            result_method = "/".join(method_list) if len(method_list) > 1 else method_list[0]
    elif conditions:
        # 只有条件，没有明确的方法
        result_method = f"({','.join(conditions)})"
    else:
        result_method = "ALL"

    return result_method, clean_description

def check_if_all_methods_same(parameters: Dict[str, Any]) -> bool:
    """检查是否所有参数的适用方法都相同（都是ALL或其他相同值）"""
    if not parameters:
        return True

    methods = set()
    for param_name, param_data in parameters.items():
        if isinstance(param_data, dict) and 'type' in param_data:
            description = param_data.get('description', '')
            applicable_methods, _ = parse_method_indicators(description)
            methods.add(applicable_methods)

    # 如果只有一种方法类型，且是ALL，则返回True
    return len(methods) <= 1 and ('ALL' in methods or len(methods) == 0)

def format_parameter_table(parameters: Dict[str, Any], title: str = "请求参数") -> str:
    """生成参数表格，智能决定是否包含适用方法列"""
    if not parameters:
        return ""

    # 检查是否所有参数都是ALL
    all_methods_same = check_if_all_methods_same(parameters)

    lines = [f"\n### {title}\n"]

    if all_methods_same:
        # 简化表格，不包含适用方法列
        lines.append("| 参数名 | 类型 | 必需 | 默认值 | 说明 |")
        lines.append("|--------|------|------|--------|------|")
    else:
        # 完整表格，包含适用方法列
        lines.append("| 参数名 | 类型 | 必需 | 默认值 | 适用方法 | 说明 |")
        lines.append("|--------|------|------|--------|----------|------|")

    for param_name, param_data in parameters.items():
        if isinstance(param_data, dict) and 'type' in param_data:
            required = "✅" if param_data.get('required', False) else "❌"
            default_val = param_data.get('default', '-')
            if default_val is not None and default_val != '-':
                default_val = f"`{default_val}`"
            else:
                default_val = '-'

            description = param_data.get('description', '')
            param_type = param_data.get('type', 'unknown')

            # 解析方法指示符
            applicable_methods, clean_description = parse_method_indicators(description)

            # 如果有选项，添加到描述中
            if 'options' in param_data:
                options = ', '.join([f"`{opt}`" for opt in param_data['options']])
                clean_description += f" (可选值: {options})"

            # 如果有范围，添加到描述中
            if 'range' in param_data:
                clean_description += f" (范围: {param_data['range']})"

            if all_methods_same:
                # 简化行格式
                lines.append(f"| `{param_name}` | {param_type} | {required} | {default_val} | {clean_description} |")
            else:
                # 完整行格式
                lines.append(f"| `{param_name}` | {param_type} | {required} | {default_val} | {applicable_methods} | {clean_description} |")

    return "\n".join(lines)

def format_nested_parameters(param_name: str, param_data: Dict[str, Any], level: int = 0) -> str:
    """格式化嵌套参数，智能决定是否包含适用方法列"""
    if not param_data.get('Parameters'):
        return ""

    # 检查是否所有参数都是ALL
    all_methods_same = check_if_all_methods_same(param_data['Parameters'])

    indent = "  " * level
    lines = [f"\n{'#' * (4 + level)} {param_name} 结构\n"]

    if all_methods_same:
        # 简化表格
        lines.append("| 字段名 | 类型 | 必需 | 默认值 | 说明 |")
        lines.append("|--------|------|------|--------|------|")
    else:
        # 完整表格
        lines.append("| 字段名 | 类型 | 必需 | 默认值 | 适用方法 | 说明 |")
        lines.append("|--------|------|------|--------|----------|------|")

    for sub_name, sub_data in param_data['Parameters'].items():
        if isinstance(sub_data, dict) and 'type' in sub_data:
            required = "✅" if sub_data.get('required', False) else "❌"
            default_val = sub_data.get('default', '-')
            if default_val is not None and default_val != '-':
                default_val = f"`{default_val}`"
            else:
                default_val = '-'

            description = sub_data.get('description', '')
            param_type = sub_data.get('type', 'unknown')

            # 解析方法指示符
            applicable_methods, clean_description = parse_method_indicators(description)

            # 如果有选项，添加到描述中
            if 'options' in sub_data:
                options = ', '.join([f"`{opt}`" for opt in sub_data['options']])
                clean_description += f" (可选值: {options})"

            # 如果有范围，添加到描述中
            if 'range' in sub_data:
                clean_description += f" (范围: {sub_data['range']})"

            if all_methods_same:
                # 简化行格式
                lines.append(f"| `{sub_name}` | {param_type} | {required} | {default_val} | {clean_description} |")
            else:
                # 完整行格式
                lines.append(f"| `{sub_name}` | {param_type} | {required} | {default_val} | {applicable_methods} | {clean_description} |")

            # 如果有选项描述，添加详细说明
            if 'optionDescription' in sub_data:
                lines.append(format_enum_description(sub_data['optionDescription']))

    return "\n".join(lines)

def format_enum_description(option_description: Dict[str, Any]) -> str:
    """格式化选项描述（原 enumDescription，现在是 optionDescription）"""
    if not option_description:
        return ""

    lines = ["\n#### 选项说明\n"]

    for option_key, option_info in option_description.items():
        if isinstance(option_info, dict):
            name = option_info.get('enumName', option_key)
            desc = option_info.get('description', '')
            usage = option_info.get('usage', '')
            note = option_info.get('note', '')

            lines.append(f"**{option_key}** ({name})")
            if desc:
                lines.append(f"- 描述: {desc}")
            if usage:
                lines.append(f"- 用途: {usage}")
            if note:
                lines.append(f"- 注意: {note}")
            lines.append("")

    return "\n".join(lines)

def format_examples_section(examples: Dict[str, Any]) -> str:
    """格式化示例部分"""
    if not examples:
        return ""

    lines = ["\n## 请求示例\n"]

    for example_name, example_data in examples.items():
        if isinstance(example_data, dict):
            description = example_data.get('description', example_name)
            lines.append(f"### {description}\n")

            # 显示参数
            if 'parameters' in example_data:
                lines.append("```json")
                lines.append(json.dumps(example_data['parameters'], indent=2, ensure_ascii=False))
                lines.append("```\n")

            # 显示下载选项
            if 'downloadOptions' in example_data:
                lines.append("**下载选项:**")
                lines.append("```json")
                lines.append(json.dumps(example_data['downloadOptions'], indent=2, ensure_ascii=False))
                lines.append("```\n")

    return "\n".join(lines)

def format_response_section(response_data: Dict[str, Any]) -> str:
    """格式化响应部分"""
    if not response_data:
        return ""

    lines = ["\n## 响应格式\n"]

    response_type = response_data.get('type', 'unknown')
    description = response_data.get('description', '')

    if response_type == 'binary':
        lines.append("**响应类型:** 二进制数据 (图片文件)")
        lines.append("**Content-Type:** image/png")
        lines.append("**响应头:** Content-Disposition: attachment; filename=\"...\"")
    else:
        lines.append(f"**响应类型:** {response_type}")
        if description:
            lines.append(f"**说明:** {description}")

        # 如果有参数结构，显示响应结构
        if 'Parameters' in response_data:
            lines.append(format_response_structure(response_data['Parameters']))

    # 显示示例
    if 'examples' in response_data and response_data['examples']:
        lines.append("\n### 响应示例\n")
        lines.append("```json")
        if isinstance(response_data['examples'], list) and response_data['examples']:
            lines.append(json.dumps(response_data['examples'][0], indent=2, ensure_ascii=False))
        else:
            lines.append(json.dumps(response_data['examples'], indent=2, ensure_ascii=False))
        lines.append("```")

    return "\n".join(lines)

def format_response_structure(parameters: Dict[str, Any], level: int = 0) -> str:
    """递归格式化响应结构，智能决定是否包含适用方法列"""
    if not parameters or level > 2:  # 限制递归深度
        return ""

    # 检查是否所有字段都是ALL
    all_methods_same = check_if_all_methods_same(parameters)

    level_header = "#" * (3 + level)
    lines = [f"\n{level_header} 响应字段\n"]

    if all_methods_same:
        # 简化表格
        lines.append("| 字段名 | 类型 | 说明 |")
        lines.append("|--------|------|------|")
    else:
        # 完整表格
        lines.append("| 字段名 | 类型 | 适用方法 | 说明 |")
        lines.append("|--------|------|----------|------|")

    for field_name, field_data in parameters.items():
        if isinstance(field_data, dict):
            field_type = field_data.get('type', 'unknown')
            field_desc = field_data.get('description', '')

            # 解析方法指示符
            applicable_methods, clean_description = parse_method_indicators(field_desc)

            if all_methods_same:
                # 简化行格式
                lines.append(f"| `{field_name}` | {field_type} | {clean_description} |")
            else:
                # 完整行格式
                lines.append(f"| `{field_name}` | {field_type} | {applicable_methods} | {clean_description} |")

    # 分别处理嵌套结构，但不递归太深
    for field_name, field_data in parameters.items():
        if isinstance(field_data, dict) and 'Parameters' in field_data and level < 2:
            lines.append(f"\n{level_header}# {field_name} 详细结构")
            nested_lines = format_response_structure(field_data['Parameters'], level + 1)
            lines.append(nested_lines)

    return "\n".join(lines)

def generate_endpoint_markdown(endpoint_name: str, endpoint_data: Dict[str, Any]) -> str:
    """生成单个端点的 Markdown 文档"""

    endpoint = endpoint_data.get('endpoint', '')
    method = endpoint_data.get('method', 'GET')
    content_type = endpoint_data.get('contentType', '')
    description = endpoint_data.get('description', '')
    parameters = endpoint_data.get('parameters', {})
    response = endpoint_data.get('response', {})
    examples = endpoint_data.get('examples', {})
    notes = endpoint_data.get('notes', [])

    lines = [
        f"# {description}",
        f"\n## {method} `{endpoint}`",
        f"\n{description}\n"
    ]

    # 添加请求内容类型
    if content_type:
        lines.append(f"**Content-Type:** `{content_type}`\n")

    # 请求参数
    if parameters:
        # 主要参数表格
        main_params = {}
        nested_params = {}
        option_params = {}

        for param_name, param_data in parameters.items():
            if isinstance(param_data, dict) and 'type' in param_data:
                main_params[param_name] = param_data
                # 检查是否有嵌套参数
                if 'Parameters' in param_data:
                    nested_params[param_name] = param_data
                # 检查是否有选项描述
                if 'optionDescription' in param_data:
                    option_params[param_name] = param_data

        if main_params:
            lines.append(format_parameter_table(main_params, "请求参数"))

        # 选项描述（在嵌套参数之前显示）
        for param_name, param_data in option_params.items():
            if param_name not in nested_params:  # 避免重复显示
                lines.append(f"\n#### {param_name} 选项说明")
                lines.append(format_enum_description(param_data['optionDescription']))

        # 嵌套参数详细说明
        for param_name, param_data in nested_params.items():
            lines.append(format_nested_parameters(param_name, param_data))

    # 响应格式
    if response:
        lines.append(format_response_section(response))

    # 示例
    if examples:
        lines.append(format_examples_section(examples))

    # 注意事项
    if notes:
        lines.append("\n## 注意事项\n")
        for note in notes:
            lines.append(f"- {note}")

    # 页脚
    lines.append("\n---\n")
    lines.append("*此文档由 `scripts/generate_api_docs.py` 自动生成*  ")
    lines.append("*配置来源: `src/config/apiDocs.ts`*")

    return "\n".join(lines)

def generate_root_api_markdown(api_info: Dict[str, Any]) -> str:
    """生成根 API 文档"""
    lines = [
        f"# {api_info.get('name', 'API 文档')}",
        f"\n**版本:** {api_info.get('version', '1.0.0')}",
        f"\n{api_info.get('description', '')}\n"
    ]

    # 功能特性
    if 'features' in api_info:
        lines.append("## 主要功能\n")
        for feature in api_info['features']:
            lines.append(f"- {feature}")

    # 支持格式
    if 'supportedFormats' in api_info:
        formats = api_info['supportedFormats']
        lines.append("\n## 支持格式\n")
        if 'input' in formats:
            lines.append(f"**输入格式:** {', '.join(formats['input'])}")
        if 'output' in formats:
            lines.append(f"**输出格式:** {', '.join(formats['output'])}")

    # 限制说明
    if 'limits' in api_info:
        limits = api_info['limits']
        lines.append("\n## 使用限制\n")
        for key, value in limits.items():
            key_name = {
                'maxFileSize': '最大文件大小',
                'maxImageDimensions': '最大图片尺寸',
                'maxGranularity': '最大精细度',
                'minGranularity': '最小精细度'
            }.get(key, key)
            lines.append(f"- {key_name}: {value}")

    # API 端点列表
    if 'endpoints' in api_info:
        lines.append("\n## API 端点\n")
        lines.append("| 端点 | 方法 | 说明 |")
        lines.append("|------|------|------|")

        for endpoint_path, endpoint_info in api_info['endpoints'].items():
            method = endpoint_info.get('method', 'GET')
            description = endpoint_info.get('description', '无描述')
            lines.append(f"| `{endpoint_path}` | {method} | {description} |")
    else:
        # 默认端点列表
        lines.append("\n## API 端点\n")
        lines.append("| 端点 | 方法 | 说明 |")
        lines.append("|------|------|------|")
        lines.append("| `/api/convert` | POST | 图片转换为拼豆图纸 |")
        lines.append("| `/api/download` | POST | 生成并下载图纸图片 |")
        lines.append("| `/api/palette` | GET/POST | 调色板信息和验证 |")
        lines.append("| `/api/status` | GET | 获取API状态信息 |")

    # 页脚
    lines.append("\n---\n")
    lines.append("*此文档由 `scripts/generate_api_docs.py` 自动生成*  ")
    lines.append("*配置来源: API 端点动态获取*")

    return "\n".join(lines)

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description='生成 API 文档')
    parser.add_argument('--output', '-o',
                       help='输出目录 (默认: docs/api)')
    parser.add_argument('--server-url', '-s',
                       default='http://localhost:3000',
                       help='服务器地址 (默认: http://localhost:3000)')

    args = parser.parse_args()

    print("🚀 开始生成 API 文档...")

    # 获取数据
    data = get_api_docs_data(args.server_url)

    if not data:
        print("❌ ERROR: 无法获取 API 配置数据")
        print("💡 提示: 请确保开发服务器正在运行：npm run dev")
        print(f"💡 服务器地址: {args.server_url}")
        sys.exit(1)

    # 从 API 响应中提取文档数据
    api_docs = data.get('API_DOCS', {})
    api_info = data.get('API_INFO', {})

    print(f"✅ SUCCESS: 获取到 {len(api_docs)} 个端点的配置")

    # 确定输出目录
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)

    output_dir = args.output
    if not output_dir:
        output_dir = os.path.join(project_root, 'docs', 'api')
    elif not os.path.isabs(output_dir):
        output_dir = os.path.join(project_root, output_dir)

    os.makedirs(output_dir, exist_ok=True)

    # 生成根 API 文档
    print("📝 生成根 API 文档...")
    root_markdown = generate_root_api_markdown(api_info)
    root_file = os.path.join(output_dir, 'README.md')
    with open(root_file, 'w', encoding='utf-8') as f:
        f.write(root_markdown)
    print(f"✅ SUCCESS: 已生成 {root_file}")

    # 生成各端点文档
    for endpoint_name, endpoint_data in api_docs.items():
        print(f"📝 生成 {endpoint_name} 文档...")
        try:
            markdown_content = generate_endpoint_markdown(endpoint_name, endpoint_data)

            output_file = os.path.join(output_dir, f'{endpoint_name}.md')
            with open(output_file, 'w', encoding='utf-8') as f:
                f.write(markdown_content)

            print(f"✅ SUCCESS: 已生成 {output_file}")

        except Exception as e:
            print(f"❌ ERROR: 生成 {endpoint_name} 文档时出错: {e}")
            import traceback
            traceback.print_exc()
            continue

    print("\n🎉 所有文档生成完成!")
    print(f"📁 文档目录: {output_dir}")
    print("💡 提示: 你可以在输出目录下查看生成的文档")
    print(f"💡 服务器地址: {args.server_url}")

if __name__ == "__main__":
    main()
