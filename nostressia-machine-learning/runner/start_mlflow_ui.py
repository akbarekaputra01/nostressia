import argparse
import os
import socket
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
DEFAULT_MLRUNS_DIR = ROOT / "mlruns"


def _normalize_file_uri(path: Path) -> str:
    return "file:" + str(path.resolve()).replace("\\", "/")


def build_mlflow_ui_command(port: int, workers: int, host: str) -> list[str]:
    mlruns_dir = DEFAULT_MLRUNS_DIR
    mlruns_dir.mkdir(parents=True, exist_ok=True)
    store_uri = _normalize_file_uri(mlruns_dir)
    cmd = [
        "mlflow",
        "ui",
        "--backend-store-uri",
        store_uri,
        "--registry-store-uri",
        store_uri,
        "--workers",
        str(workers),
        "--host",
        host,
        "--port",
        str(port),
    ]
    return cmd


def _is_port_available(host: str, port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            sock.bind((host, port))
        except OSError:
            return False
    return True


def _resolve_port(host: str, port: int, auto_port: bool) -> int:
    if _is_port_available(host, port):
        return port
    if not auto_port:
        raise RuntimeError(
            (
                f"Port {port} on host {host} is already in use. "
                "Close the existing process first, or rerun with --auto-port to pick an available port automatically."
            )
        )
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind((host, 0))
        return int(sock.getsockname()[1])


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Start MLflow UI using the repository-level mlruns directory so training logs "
            "and UI always point to the same backend store."
        )
    )
    parser.add_argument("--port", type=int, default=5000)
    parser.add_argument("--workers", type=int, default=1)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument(
        "--auto-port",
        action="store_true",
        help="If the requested port is busy, automatically select a free port.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the command and exit without starting MLflow UI.",
    )
    args = parser.parse_args()

    selected_port = _resolve_port(host=args.host, port=args.port, auto_port=args.auto_port)
    cmd = build_mlflow_ui_command(port=selected_port, workers=args.workers, host=args.host)
    command_preview = " ".join(cmd)
    print(f"[MLflow UI] Running from repo root: {ROOT}")
    if selected_port != args.port:
        print(f"[MLflow UI] Requested port {args.port} is busy; using available port {selected_port}.")
    print(f"[MLflow UI] Command: {command_preview}")

    if args.dry_run:
        return

    env = os.environ.copy()
    env.setdefault("MLFLOW_TRACKING_URI", _normalize_file_uri(DEFAULT_MLRUNS_DIR))
    subprocess.run(cmd, cwd=ROOT, env=env, check=True)


if __name__ == "__main__":
    main()
