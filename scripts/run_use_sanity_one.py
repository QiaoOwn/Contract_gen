#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Run one USE model/cmd pair and persist the raw result."""

from __future__ import annotations

import argparse
import json
import subprocess
import time
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser(description="Run one USE sanity check and save logs.")
    parser.add_argument("--use-bat", default="tools/use-7.5.0/bin/use.bat")
    parser.add_argument("--model", required=True)
    parser.add_argument("--cmd", required=True)
    parser.add_argument("--operation-id", required=True)
    parser.add_argument(
        "--output-dir",
        default="results/contractgen-study-v6/validation/ocltsvm_sanity_samples/use_runs",
    )
    parser.add_argument("--timeout", type=int, default=60)
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = args.operation_id
    stdout_path = out_dir / f"{stem}.stdout.txt"
    stderr_path = out_dir / f"{stem}.stderr.txt"
    result_path = out_dir / f"{stem}.result.json"

    started = time.time()
    use_bat = str(Path(args.use_bat).resolve())
    model = str(Path(args.model).resolve())
    cmd = str(Path(args.cmd).resolve())

    try:
        proc = subprocess.run(
            [use_bat, "-q", model, cmd],
            text=True,
            capture_output=True,
            timeout=args.timeout,
        )
        result = {
            "operation_id": args.operation_id,
            "status": "pass" if proc.returncode == 0 else "fail",
            "returncode": proc.returncode,
            "use_bat": use_bat,
            "model": model,
            "cmd": cmd,
            "duration_sec": round(time.time() - started, 4),
            "stdout_file": str(stdout_path),
            "stderr_file": str(stderr_path),
        }
        stdout_path.write_text(proc.stdout or "", encoding="utf-8")
        stderr_path.write_text(proc.stderr or "", encoding="utf-8")
    except subprocess.TimeoutExpired as exc:
        result = {
            "operation_id": args.operation_id,
            "status": "timeout",
            "returncode": "",
            "use_bat": use_bat,
            "model": model,
            "cmd": cmd,
            "duration_sec": round(time.time() - started, 4),
            "stdout_file": str(stdout_path),
            "stderr_file": str(stderr_path),
        }
        stdout_path.write_text(exc.stdout or "", encoding="utf-8")
        stderr_path.write_text(exc.stderr or "", encoding="utf-8")

    result_path.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
