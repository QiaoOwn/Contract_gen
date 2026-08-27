#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the RQ3 feedback-loop ablation table.

The full-feedback results come from the frozen ``contractgen-study-v6`` runs.
The no-feedback results should be generated with:
``script/run_rq1_validity_experiments.py --backend next --next-graph-mode linear``.
"""

from __future__ import annotations

import argparse
import csv
from pathlib import Path
from typing import Dict, Iterable, List, Optional


MODELS = (
    "gpt-5.4",
    "gpt-5.4-mini",
    "claude-opus-4-7",
    "qwen3-coder-plus",
    "qwen3-coder-flash",
)


def read_first_row(path: Path) -> Optional[Dict[str, str]]:
    if not path.exists():
        return None
    with path.open("r", newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    return rows[0] if rows else None


def read_model_row(path: Path, model: str) -> Optional[Dict[str, str]]:
    if not path.exists():
        return None
    with path.open("r", newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            if row.get("model") == model:
                return row
    return None


def find_no_feedback_dirs(root: Path) -> Dict[str, Path]:
    found: Dict[str, Path] = {}
    if not root.exists():
        return found
    for d in root.rglob("*"):
        if not d.is_dir():
            continue
        rq2_path = d / "rq2_execution_success_by_model.csv"
        if not rq2_path.exists():
            continue
        with rq2_path.open("r", newline="", encoding="utf-8") as f:
            for row in csv.DictReader(f):
                if row.get("model"):
                    found[row["model"]] = d
    return found


def pct(value: str) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def build_rows(results_root: Path, no_feedback_root: Path) -> List[Dict[str, object]]:
    rows: List[Dict[str, object]] = []
    full_dir = results_root / "contract_gen" / "full_feedback"
    for model in MODELS:
        full_rq2 = read_model_row(full_dir / "rq2_execution_success_by_model.csv", model)
        full_rq3 = read_model_row(full_dir / "rq3_feedback_utility_by_model.csv", model)
        no_dir = no_feedback_root
        no_rq2 = read_model_row(no_dir / "rq2_execution_success_by_model.csv", model)
        no_rq3 = read_model_row(no_dir / "rq3_feedback_utility_by_model.csv", model)
        if not full_rq2 or not full_rq3:
            continue

        full_pass = pct(full_rq2.get("execution_success_rate", "0"))
        no_pass = pct(no_rq2.get("execution_success_rate", "0")) if no_rq2 else None
        delta = full_pass - no_pass if no_pass is not None else None
        rows.append(
            {
                "model": model,
                "total_operations": full_rq2.get("total_operations", ""),
                "full_feedback_pass_count": full_rq2.get("execution_success_count", ""),
                "full_feedback_pass_rate": f"{full_pass:.2f}",
                "no_feedback_pass_count": no_rq2.get("execution_success_count", "") if no_rq2 else "",
                "no_feedback_pass_rate": f"{no_pass:.2f}" if no_pass is not None else "",
                "delta_pass_rate": f"{delta:.2f}" if delta is not None else "",
                "full_error_operations": full_rq3.get("operations_with_intermediate_errors", ""),
                "full_repaired_count": full_rq3.get("repaired_after_feedback_count", ""),
                "full_repair_success_rate": f"{pct(full_rq3.get('repair_success_rate', '0')):.2f}",
                "no_feedback_error_operations": no_rq3.get("operations_with_intermediate_errors", "")
                if no_rq3
                else "",
                "no_feedback_repaired_count": no_rq3.get("repaired_after_feedback_count", "")
                if no_rq3
                else "",
                "no_feedback_dir": str(no_dir) if no_dir else "",
            }
        )
    return rows


def write_csv(path: Path, rows: List[Dict[str, object]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fields = [
        "model",
        "total_operations",
        "full_feedback_pass_count",
        "full_feedback_pass_rate",
        "no_feedback_pass_count",
        "no_feedback_pass_rate",
        "delta_pass_rate",
        "full_error_operations",
        "full_repaired_count",
        "full_repair_success_rate",
        "no_feedback_error_operations",
        "no_feedback_repaired_count",
        "no_feedback_dir",
    ]
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def markdown_table(rows: Iterable[Dict[str, object]]) -> str:
    headers = [
        "Model",
        "Full Pass",
        "No Feedback Pass",
        "Delta",
        "Full Error Ops",
        "Full Repaired",
        "Full Repair %",
        "No Feedback Repaired",
    ]
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for r in rows:
        lines.append(
            "| "
            + " | ".join(
                [
                    str(r["model"]),
                    f"{r['full_feedback_pass_count']}/{r['total_operations']} ({r['full_feedback_pass_rate']}%)",
                    (
                        f"{r['no_feedback_pass_count']}/{r['total_operations']} "
                        f"({r['no_feedback_pass_rate']}%)"
                    )
                    if r["no_feedback_pass_count"]
                    else "not run",
                    str(r["delta_pass_rate"]) if r["delta_pass_rate"] else "",
                    str(r["full_error_operations"]),
                    str(r["full_repaired_count"]),
                    str(r["full_repair_success_rate"]),
                    str(r["no_feedback_repaired_count"]) if r["no_feedback_repaired_count"] else "",
                ]
            )
            + " |"
        )
    return "\n".join(lines) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser(description="Build RQ3 no-feedback ablation table.")
    parser.add_argument("--results-root", default="results/contractgen-study-v6")
    parser.add_argument(
        "--no-feedback-root",
        default="results/contractgen-study-v6/contract_gen/no_feedback",
    )
    parser.add_argument(
        "--output-dir",
        default="results/contractgen-study-v6/reports/rq3_ablation",
    )
    args = parser.parse_args()

    rows = build_rows(Path(args.results_root), Path(args.no_feedback_root))
    output_dir = Path(args.output_dir)
    write_csv(output_dir / "rq3_feedback_ablation_by_model.csv", rows)
    (output_dir / "rq3_feedback_ablation_by_model.md").write_text(
        markdown_table(rows), encoding="utf-8"
    )
    print(f"Wrote {len(rows)} rows to {output_dir}")


if __name__ == "__main__":
    main()
