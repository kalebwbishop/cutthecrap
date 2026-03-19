"""postToolUse hook: auto-format backend Python files with Ruff after edits."""

import json
import subprocess
import sys
import os


def main():
    event = json.load(sys.stdin)

    tool_name = event.get("toolName", "")
    if tool_name not in ("edit", "create"):
        sys.exit(0)

    tool_args = json.loads(event.get("toolArgs", "{}"))
    file_path = tool_args.get("path", "")

    normalized = file_path.replace("\\", "/")

    if "backend/" not in normalized and "backend\\" not in file_path:
        sys.exit(0)

    if not normalized.endswith(".py"):
        sys.exit(0)

    repo_root = event.get("cwd", os.getcwd())
    backend_dir = os.path.join(repo_root, "backend")
    abs_path = os.path.join(repo_root, file_path) if not os.path.isabs(file_path) else file_path

    if not os.path.isfile(abs_path):
        sys.exit(0)

    # Use ruff from the venv
    venv_ruff = os.path.join(backend_dir, "venv", "Scripts", "ruff.exe")
    if not os.path.exists(venv_ruff):
        venv_ruff = os.path.join(backend_dir, "venv", "bin", "ruff")
    if not os.path.exists(venv_ruff):
        sys.exit(0)

    result = subprocess.run(
        [venv_ruff, "format", abs_path],
        cwd=backend_dir,
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode != 0:
        sys.stderr.write(f"Ruff format failed:\n{result.stderr}")
        sys.exit(0)

    # Run ruff check --fix for auto-fixable lint issues (e.g., import sorting)
    subprocess.run(
        [venv_ruff, "check", "--fix", abs_path],
        cwd=backend_dir,
        capture_output=True,
        text=True,
        timeout=30,
    )

    sys.exit(0)


if __name__ == "__main__":
    main()
