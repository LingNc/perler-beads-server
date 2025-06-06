#!/usr/bin/env python3
"""
API Markdown文档自动生成器
从运行中的API服务器获取中央配置数据，自动生成所有的 markdown 文档
"""

import json
import os
import sys
import requests
from typing import Dict, Any, List
from pathlib import Path

API_BASE = 'http://localhost:3000'

def get_api_docs_data() -> Dict[str, Any]:
    """从运行中的API服务器获取文档数据"""
    endpoints = {
        'root': '/api',
        'convert': '/api/convert',
        'download': '/api/download',
        'palette': '/api/palette?docs=true',
        'status': '/api/status?docs=true'
    }

    api_docs = {}
    api_info = None

    try:
        for name, path in endpoints.items():
            print(f"  获取 {name} 端点数据...")
            response = requests.get(f"{API_BASE}{path}", timeout=5)
            response.raise_for_status()
            data = response.json()

            if name == 'root':
                api_info = data
            else:
                api_docs[name] = data

        return {'API_DOCS': api_docs, 'API_INFO': api_info}

    except requests.RequestException as e:
        print(f"ERROR: 获取API数据失败: {e}")
        print("HINT: 请确保开发服务器正在运行: npm run dev")
        return None
    except Exception as e:
        print(f"ERROR: 处理API数据失败: {e}")
        return None

def format_parameter(name: str, param: Dict[str, Any], indent: str = "") -> str:
    """格式化单个参数为markdown"""
    lines = [f"{indent}- **`{name}`** (`{param.get('type', 'unknown')}`){' **[必需]**' if param.get('required') else ''}"]

    if param.get('default') is not None:
        lines.append(f"{indent}  - 默认值: `{param['default']}`")

    if param.get('range'):
        lines.append(f"{indent}  - 范围: `{param['range']}`")

    if param.get('options'):
        options_str = ', '.join([f"`{opt}`" for opt in param['options']])
        lines.append(f"{indent}  - 选项: {options_str}")

    if param.get('enum'):
        enum_str = ', '.join([f"`{opt}`" for opt in param['enum']])
        lines.append(f"{indent}  - 枚举: {enum_str}")

    if param.get('description'):
        lines.append(f"{indent}  - 描述: {param['description']}")

    if param.get('examples'):
        examples_str = ', '.join([f"`{ex}`" for ex in param['examples']])
        lines.append(f"{indent}  - 示例: {examples_str}")

    return '\n'.join(lines)

def format_parameters_section(parameters: Dict[str, Any]) -> str:
    """格式化参数部分为markdown"""
    if not parameters:
        return "此端点不需要参数。\n"

    lines = []
    for name, param in parameters.items():
        if isinstance(param, dict) and 'type' in param:
            # 这是一个直接的参数
            lines.append(format_parameter(name, param))
        elif isinstance(param, dict):
            # 这是一个参数组（如downloadOptions）
            lines.append(f"- **`{name}`** (对象)")
            for sub_name, sub_param in param.items():
                if isinstance(sub_param, dict) and 'type' in sub_param:
                    lines.append(format_parameter(sub_name, sub_param, "  "))
        lines.append("")  # 空行分隔

    return '\n'.join(lines)

def format_response_section(response: Dict[str, Any]) -> str:
    """格式化响应部分为markdown"""
    if not response:
        return "响应格式未定义。\n"

    # 将响应转为格式化的JSON
    response_json = json.dumps(response, indent=2, ensure_ascii=False)
    return f"```json\n{response_json}\n```\n"

def format_examples_section(examples: Dict[str, Any]) -> str:
    """格式化示例部分为markdown"""
    if not examples:
        return ""

    lines = ["## 使用示例\n"]

    for example_name, example_data in examples.items():
        lines.append(f"### {example_data.get('description', example_name)}\n")

        # 格式化示例代码
        example_json = json.dumps(example_data, indent=2, ensure_ascii=False)
        lines.append(f"```json\n{example_json}\n```\n")

    return '\n'.join(lines)

def format_notes_section(notes: List[str]) -> str:
    """格式化注意事项部分为markdown"""
    if not notes:
        return ""

    lines = ["## 注意事项\n"]
    for note in notes:
        lines.append(f"- {note}")
    lines.append("")

    return '\n'.join(lines)

def generate_endpoint_markdown(endpoint_name: str, endpoint_data: Dict[str, Any]) -> str:
    """生成单个端点的markdown文档"""

    endpoint_path = endpoint_data.get('endpoint', f'/api/{endpoint_name}')
    method = endpoint_data.get('method', 'GET')
    description = endpoint_data.get('description', '未定义描述')

    # 构建markdown内容
    lines = [
        f"# {description}",
        "",
        f"## `{method} {endpoint_path}`",
        "",
        description,
        "",
        "## 参数",
        "",
        format_parameters_section(endpoint_data.get('parameters', {})),
    ]

    # 添加响应部分
    if endpoint_data.get('response'):
        lines.extend([
            "## 响应格式",
            "",
            format_response_section(endpoint_data['response']),
        ])

    # 添加渲染模式（仅下载端点）
    if endpoint_data.get('renderModes'):
        lines.extend([
            "## 渲染模式",
            "",
        ])
        for mode_name, mode_data in endpoint_data['renderModes'].items():
            lines.append(f"### {mode_name.upper()} 模式")
            lines.append(f"- **描述**: {mode_data.get('description', '未定义')}")
            if mode_data.get('parameters'):
                params_str = ', '.join([f"`{p}`" for p in mode_data['parameters']])
                lines.append(f"- **参数**: {params_str}")
            if mode_data.get('usage'):
                lines.append(f"- **使用场景**: {mode_data['usage']}")
            if mode_data.get('note'):
                lines.append(f"- **注意**: {mode_data['note']}")
            lines.append("")

    # 添加示例
    if endpoint_data.get('examples'):
        lines.append(format_examples_section(endpoint_data['examples']))

    # 添加注意事项
    if endpoint_data.get('notes'):
        lines.append(format_notes_section(endpoint_data['notes']))

    # 添加自动生成标记
    lines.extend([
        "---",
        "",
        "*此文档由 `scripts/generate_docs.py` 自动生成，请勿手动编辑。*",
        f"*配置来源: `src/config/apiDocs.ts`*",
        ""
    ])

    return '\n'.join(lines)

def generate_root_api_markdown(api_info: Dict[str, Any]) -> str:
    """生成根API文档"""
    lines = [
        f"# {api_info.get('name', 'API文档')}",
        "",
        f"版本: {api_info.get('version', '1.0.0')}",
        "",
        api_info.get('description', ''),
        "",
        "## 功能特性",
        "",
    ]

    for feature in api_info.get('features', []):
        lines.append(f"- {feature}")

    lines.extend([
        "",
        "## 支持的格式",
        "",
        f"**输入格式**: {', '.join([f'`{fmt}`' for fmt in api_info.get('supportedFormats', {}).get('input', [])])}",
        "",
        f"**输出格式**: {', '.join([f'`{fmt}`' for fmt in api_info.get('supportedFormats', {}).get('output', [])])}",
        "",
        "## 系统限制",
        "",
    ])

    limits = api_info.get('limits', {})
    for limit_name, limit_value in limits.items():
        readable_name = {
            'maxFileSize': '最大文件大小',
            'maxImageDimensions': '最大图片尺寸',
            'maxGranularity': '最大精细度',
            'minGranularity': '最小精细度'
        }.get(limit_name, limit_name)
        lines.append(f"- **{readable_name}**: `{limit_value}`")

    lines.extend([
        "",
        "## API端点",
        "",
        "| 端点 | 方法 | 描述 |",
        "|------|------|------|",
    ])

    # 这里需要从API_DOCS获取端点信息，暂时先占位
    lines.extend([
        "| `/api/convert` | POST | 图片转拼豆图纸 |",
        "| `/api/download` | POST | 生成并下载图纸 |",
        "| `/api/palette` | GET/POST | 调色板管理 |",
        "| `/api/status` | GET | 系统状态检查 |",
        "",
        "---",
        "",
        "*此文档由 `scripts/generate_docs.py` 自动生成，请勿手动编辑。*",
        f"*配置来源: `src/config/apiDocs.ts`*",
        ""
    ])

    return '\n'.join(lines)

def main():
    """主函数"""
    print("开始生成API Markdown文档...")

    # 获取API配置数据
    print("读取API配置...")
    data = get_api_docs_data()
    if not data:
        print("ERROR: 无法获取API配置数据")
        sys.exit(1)

    api_docs = data.get('API_DOCS', {})
    api_info = data.get('API_INFO', {})

    print(f"SUCCESS: 获取到 {len(api_docs)} 个端点的配置")

    # 确保输出目录存在
    docs_dir = Path('docs/api')
    docs_dir.mkdir(parents=True, exist_ok=True)

    # 生成各个端点的文档
    for endpoint_name, endpoint_data in api_docs.items():
        print(f"生成 {endpoint_name} 文档...")

        markdown_content = generate_endpoint_markdown(endpoint_name, endpoint_data)

        # 写入文件
        output_file = docs_dir / f"{endpoint_name}.md"
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(markdown_content)

        print(f"SUCCESS: 已生成 {output_file}")

    # 生成根API文档
    print("生成根API文档...")
    root_markdown = generate_root_api_markdown(api_info)
    root_file = docs_dir / "root.md"
    with open(root_file, 'w', encoding='utf-8') as f:
        f.write(root_markdown)
    print(f"SUCCESS: 已生成 {root_file}")

    print(f"\nSUCCESS: 文档生成完成！共生成 {len(api_docs) + 1} 个文档文件")
    print(f"输出目录: {docs_dir.absolute()}")
    print("\n现在只需要:")
    print("   1. 在 src/config/apiDocs.ts 中修改配置")
    print("   2. 运行 python3 scripts/generate_docs.py 重新生成文档")
    print("   3. 不再需要手动维护markdown文件！")

if __name__ == '__main__':
    main()
