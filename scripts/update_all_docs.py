#!/usr/bin/env python3
"""
API文档完整更新工作流
自动生成markdown文档并验证API文档一致性
"""

import sys
import subprocess
import time
from pathlib import Path

def run_command(command: str, description: str) -> bool:
    """运行命令并返回是否成功"""
    print(f"运行: {description}...")
    try:
        result = subprocess.run(
            command,
            shell=True,
            capture_output=True,
            text=True,
            cwd='.'
        )

        if result.returncode == 0:
            print(f"SUCCESS: {description}完成")
            if result.stdout.strip():
                # 只显示关键输出行
                lines = result.stdout.strip().split('\n')
                for line in lines[-3:]:  # 显示最后几行
                    if any(keyword in line for keyword in ['SUCCESS', 'ERROR', 'FAILED', 'WARNING']):
                        print(f"   {line}")
            return True
        else:
            print(f"ERROR: {description}失败")
            if result.stderr:
                print(f"   错误: {result.stderr.strip()}")
            return False

    except Exception as e:
        print(f"ERROR: {description}执行失败: {e}")
        return False

def check_server_running() -> bool:
    """检查开发服务器是否运行"""
    try:
        import requests
        response = requests.get('http://localhost:3000/api', timeout=2)
        return response.status_code == 200
    except:
        return False

def main():
    """主工作流"""
    print("开始API文档完整更新工作流\n")

    # 检查开发服务器状态
    if not check_server_running():
        print("HINT: 开发服务器未运行，正在启动...")
        print("   请在另一个终端运行: npm run dev")
        print("   等待服务器启动后再次运行此脚本")
        return False

    print("SUCCESS: 开发服务器运行正常\n")

    success = True

    # 步骤1：生成Markdown文档
    if not run_command(
        "python3 scripts/generate_docs.py",
        "生成Markdown文档"
    ):
        success = False

    print()

    # 步骤2：验证API文档一致性
    if not run_command(
        "python3 tests/validate_docs.py",
        "验证API文档一致性"
    ):
        success = False

    print()

    # 总结
    if success:
        print("SUCCESS: API文档更新工作流完成！")
        print("\n完成的任务:")
        print("   SUCCESS: 从中央配置生成了所有Markdown文档")
        print("   SUCCESS: 验证了所有API端点的文档一致性")
        print("   SUCCESS: 确认新参数已正确集成")

        print("\n现在的工作流程:")
        print("   1. 只需编辑 src/config/apiDocs.ts")
        print("   2. 运行 python3 scripts/update_all_docs.py")
        print("   3. 所有文档自动更新完成！")

        print("\n生成的文档:")
        docs_dir = Path("docs/api")
        if docs_dir.exists():
            for md_file in sorted(docs_dir.glob("*.md")):
                print(f"   {md_file}")
    else:
        print("ERROR: 工作流程中有步骤失败")
        print("HINT: 请检查上面的错误信息并修复问题")

    return success

if __name__ == '__main__':
    success = main()
    sys.exit(0 if success else 1)
