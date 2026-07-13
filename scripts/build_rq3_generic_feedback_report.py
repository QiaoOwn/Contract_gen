#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build RQ3 Full vs Generic vs No-feedback ablation tables."""

from __future__ import annotations

import argparse
import csv
import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional


MODELS = [
    "gpt-5.4",
    "gpt-5.4-mini",
    "claude-opus-4-7",
    "qwen3-coder-plus",
    "qwen3-coder-flash",
]

FULL_RESULT_DIRS = {
    "gpt-5.4": "rq_gpt_5_4_full_oracle_fixed",
    "gpt-5.4-mini": "rq_gpt_5_4_mini_full_oracle_fixed",
    "claude-opus-4-7": "rq_claude_opus_4_7_full_oracle_fixed",
    "qwen3-coder-plus": "rq_qwen3_coder_plus_full_oracle_fixed",
    "qwen3-coder-flash": "rq_qwen3_coder_flash_full_oracle_fixed",
}


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def summarize_attempts(path: Path, model: str) -> Optional[Dict[str, Any]]:
    rows = [r for r in read_jsonl(path) if r.get("model") == model or r.get("model_name") == model]
    if not rows:
        return None
    by_op: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        by_op.setdefault(str(row.get("operation_id")), []).append(row)

    valid_count = 0
    pass_count = 0
    feedback_used_count = 0
    attempts_used_total = 0
    for op_rows in by_op.values():
        op_rows.sort(key=lambda r: int(r.get("attempt") or r.get("attempt_id") or 999))
        valid = any(bool(r.get("syntax_valid", r.get("is_valid"))) for r in op_rows)
        passed = any(
            bool(r.get("final_pass", r.get("execution_valid", r.get("test_execution_ok"))))
            for r in op_rows
        )
        valid_count += int(valid)
        pass_count += int(passed)
        feedback_used_count += int(any(bool(r.get("whether_feedback_was_used")) for r in op_rows))
        attempts_used_total += max(int(r.get("attempt") or r.get("attempt_id") or 0) for r in op_rows)

    total = len(by_op)
    return {
        "model": model,
        "total": total,
        "valid_count": valid_count,
        "valid_rate": valid_count / total * 100 if total else 0.0,
        "pass_count": pass_count,
        "pass_rate": pass_count / total * 100 if total else 0.0,
        "avg_attempts_used": attempts_used_total / total if total else 0.0,
        "feedback_used_count": feedback_used_count,
        "attempts_path": str(path),
    }


def find_result_dir(root: Path, model: str) -> Optional[Path]:
    if not root.exists():
        return None
    candidates = []
    model_key = model.replace(".", "_").replace("-", "_")
    for d in root.rglob("*"):
        if not d.is_dir():
            continue
        attempts = d / "attempts.jsonl"
        if not attempts.exists():
            continue
        normalized = d.name.replace(".", "_").replace("-", "_")
        if model_key in normalized or summarize_attempts(attempts, model):
            candidates.append(d)
    if not candidates:
        return None

    def rank(path: Path) -> tuple[int, int, str]:
        summary = summarize_attempts(path / "attempts.jsonl", model) or {}
        name = path.name.lower()
        is_full_114 = int("full_114" in name or summary.get("total") == 114)
        return (is_full_114, int(summary.get("total") or 0), name)

    candidates.sort(key=rank, reverse=True)
    return candidates[0]


def collect(results_root: Path, generic_root: Path, no_feedback_root: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    for model in MODELS:
        full_path = results_root / FULL_RESULT_DIRS[model] / "attempts.jsonl"
        generic_dir = find_result_dir(generic_root, model)
        nofb_dir = find_result_dir(no_feedback_root, model)
        full = summarize_attempts(full_path, model)
        generic = summarize_attempts(generic_dir / "attempts.jsonl", model) if generic_dir else None
        nofb = summarize_attempts(nofb_dir / "attempts.jsonl", model) if nofb_dir else None
        total = (full or generic or nofb or {}).get("total", "")
        rows.append(
            {
                "model": model,
                "total": total,
                "full_valid": full["valid_count"] if full else "",
                "generic_valid": generic["valid_count"] if generic else "",
                "nofb_valid": nofb["valid_count"] if nofb else "",
                "full_pass": full["pass_count"] if full else "",
                "generic_pass": generic["pass_count"] if generic else "",
                "nofb_pass": nofb["pass_count"] if nofb else "",
                "full_pass_rate": f"{full['pass_rate']:.2f}" if full else "",
                "generic_pass_rate": f"{generic['pass_rate']:.2f}" if generic else "",
                "nofb_pass_rate": f"{nofb['pass_rate']:.2f}" if nofb else "",
                "full_minus_generic": (
                    f"{full['pass_count'] - generic['pass_count']}"
                    if full and generic
                    else ""
                ),
                "generic_minus_nofb": (
                    f"{generic['pass_count'] - nofb['pass_count']}"
                    if generic and nofb
                    else ""
                ),
                "generic_feedback_used_ops": generic["feedback_used_count"] if generic else "",
                "full_attempts_path": full["attempts_path"] if full else "",
                "generic_attempts_path": generic["attempts_path"] if generic else "",
                "nofb_attempts_path": nofb["attempts_path"] if nofb else "",
            }
        )
    return rows


def write_csv(path: Path, rows: List[Dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def markdown(rows: Iterable[Dict[str, Any]]) -> str:
    lines = [
        "| Model | Full Pass | Generic Pass | NoFB Pass | Full - Generic | Generic - NoFB |",
        "| --- | ---: | ---: | ---: | ---: | ---: |",
    ]
    for r in rows:
        total = r["total"]
        lines.append(
            "| {model} | {full}/{total} | {generic}/{total} | {nofb}/{total} | {fg} | {gn} |".format(
                model=r["model"],
                full=r["full_pass"] if r["full_pass"] != "" else "NA",
                generic=r["generic_pass"] if r["generic_pass"] != "" else "NA",
                nofb=r["nofb_pass"] if r["nofb_pass"] != "" else "NA",
                total=total or "NA",
                fg=r["full_minus_generic"],
                gn=r["generic_minus_nofb"],
            )
        )
    return "\n".join(lines) + "\n"


def markdown_valid_pass(rows: Iterable[Dict[str, Any]]) -> str:
    lines = [
        "| Model | Full Valid | Generic Valid | NoFB Valid | Full Pass | Generic Pass | NoFB Pass |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: |",
    ]
    for r in rows:
        total = r["total"] or "NA"
        lines.append(
            "| {model} | {fv}/{total} | {gv}/{total} | {nv}/{total} | {fp}/{total} | {gp}/{total} | {np}/{total} |".format(
                model=r["model"],
                fv=r["full_valid"] if r["full_valid"] != "" else "NA",
                gv=r["generic_valid"] if r["generic_valid"] != "" else "NA",
                nv=r["nofb_valid"] if r["nofb_valid"] != "" else "NA",
                fp=r["full_pass"] if r["full_pass"] != "" else "NA",
                gp=r["generic_pass"] if r["generic_pass"] != "" else "NA",
                np=r["nofb_pass"] if r["nofb_pass"] != "" else "NA",
                total=total,
            )
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build Generic-feedback RQ3 ablation report.")
    parser.add_argument("--results-root", default="results")
    parser.add_argument("--generic-root", default="results/rq3_ablation_generic_feedback")
    parser.add_argument("--no-feedback-root", default="results/rq3_ablation_no_feedback")
    parser.add_argument("--output-dir", default="results/rq3_generic_feedback_report")
    args = parser.parse_args()

    rows = collect(Path(args.results_root), Path(args.generic_root), Path(args.no_feedback_root))
    out = Path(args.output_dir)
    write_csv(out / "rq3_generic_feedback_by_model.csv", rows)
    (out / "rq3_generic_feedback_by_model.md").write_text(markdown(rows), encoding="utf-8")
    (out / "rq3_generic_feedback_valid_pass_by_model.md").write_text(
        markdown_valid_pass(rows), encoding="utf-8"
    )
    print(f"Wrote {len(rows)} rows to {out}")


if __name__ == "__main__":
    main()
