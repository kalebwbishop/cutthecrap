"""postToolUse hook: run backend pytest when a backend file is edited."""

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

    # Normalize to forward slashes for consistent matching
    normalized = file_path.replace("\\", "/")

    # Only run when a backend source file was edited
    if "backend/" not in normalized and "backend\\" not in file_path:
        sys.exit(0)
    if normalized.endswith((".md", ".txt", ".env", ".yml", ".yaml")):
        sys.exit(0)

    repo_root = event.get("cwd", os.getcwd())
    backend_dir = os.path.join(repo_root, "backend")

    # Find the Python executable in the venv
    venv_python = os.path.join(backend_dir, "venv", "Scripts", "python.exe")
    if not os.path.exists(venv_python):
        venv_python = os.path.join(backend_dir, "venv", "bin", "python")
    if not os.path.exists(venv_python):
        sys.exit(0)  # No venv found, skip silently

    result = subprocess.run(
        [venv_python, "-m", "pytest", "tests/", "-x", "--tb=short", "-q"],
        cwd=backend_dir,
        capture_output=True,
        text=True,
        timeout=60,
    )

    if result.returncode != 0:
        sys.stderr.write(f"Backend tests failed:\n{result.stdout}\n{result.stderr}")
        sys.exit(2)  # exit 2 = feed failure back to agent

    sys.exit(0)


if __name__ == "__main__":
    main()
