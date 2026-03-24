"""postToolUse hook: auto-format frontend files with Prettier after edits."""

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

    if "frontend/" not in normalized and "frontend\\" not in file_path:
        sys.exit(0)

    EXTENSIONS = (".ts", ".tsx", ".js", ".jsx", ".json", ".css", ".html")
    if not normalized.endswith(EXTENSIONS):
        sys.exit(0)

    repo_root = event.get("cwd", os.getcwd())
    frontend_dir = os.path.join(repo_root, "frontend")
    abs_path = os.path.join(repo_root, file_path) if not os.path.isabs(file_path) else file_path

    if not os.path.isfile(abs_path):
        sys.exit(0)

    result = subprocess.run(
        ["npx", "prettier", "--write", abs_path],
        cwd=frontend_dir,
        capture_output=True,
        text=True,
        timeout=30,
        shell=True,
    )

    if result.returncode != 0:
        sys.stderr.write(f"Prettier failed:\n{result.stderr}")

    sys.exit(0)


if __name__ == "__main__":
    main()
