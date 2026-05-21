from __future__ import annotations

import csv
import json
from collections import defaultdict
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
RESULTS_DIR = ROOT / "results"
OPERATIONS_PATH = ROOT / "data" / "operations.jsonl"
OUT_DIR = RESULTS_DIR / "llm_api_error_rerun"


def read_jsonl(path: Path) -> list[dict]:
    rows: list[dict] = []
    if not path.exists():
        return rows
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def write_jsonl(path: Path, rows: list[dict]) -> None:
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    operations = {row["id"]: row for row in read_jsonl(OPERATIONS_PATH)}

    final_failures: list[dict] = []
    for folder in sorted(RESULTS_DIR.iterdir()):
        if not folder.is_dir():
            continue
        failed_path = folder / "exp3_failed_cases_with_error_type.jsonl"
        for row in read_jsonl(failed_path):
            if row.get("error_type") != "llm_api_error":
                continue
            op_id = row.get("operation_id")
            model = row.get("model")
            if not op_id or not model:
                continue
            final_failures.append(
                {
                    "source_result_dir": folder.name,
                    "model": model,
                    "operation_id": op_id,
                    "case_study": row.get("case_study", ""),
                    "final_attempt": row.get("attempt", ""),
                    "error_type": row.get("error_type", ""),
                }
            )

    by_model: dict[str, list[dict]] = defaultdict(list)
    seen_pairs: set[tuple[str, str]] = set()
    for row in final_failures:
        pair = (row["model"], row["operation_id"])
        if pair in seen_pairs:
            continue
        seen_pairs.add(pair)
        operation = operations.get(row["operation_id"])
        if operation is None:
            row["missing_from_operations_jsonl"] = True
            continue
        by_model[row["model"]].append(operation)

    with (OUT_DIR / "llm_api_error_final_failures.csv").open("w", newline="", encoding="utf-8") as f:
        fieldnames = [
            "source_result_dir",
            "model",
            "operation_id",
            "case_study",
            "final_attempt",
            "error_type",
        ]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(final_failures)

    summary_rows = []
    commands = []
    for model, rows in sorted(by_model.items()):
        input_path = OUT_DIR / f"{model}_llm_api_error_operations.jsonl"
        write_jsonl(input_path, rows)
        summary_rows.append(
            {
                "model": model,
                "operation_count": len(rows),
                "input_file": str(input_path.relative_to(ROOT)),
                "output_dir": f"results/llm_api_error_rerun/{model}",
            }
        )
        commands.append(
            "python script/run_rq1_validity_experiments.py "
            f"--input {input_path.as_posix()} "
            f"--output-dir {(OUT_DIR / model).as_posix()} "
            f"--models {model} "
            "--backend next "
            "--max-attempts 5 "
            "--next-read-timeout 300 "
            "--sleep-between-calls 1 "
            "--force"
        )

    with (OUT_DIR / "rerun_summary.csv").open("w", newline="", encoding="utf-8") as f:
        fieldnames = ["model", "operation_count", "input_file", "output_dir"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(summary_rows)

    (OUT_DIR / "rerun_commands.ps1").write_text("\n".join(commands) + "\n", encoding="utf-8")
    print(f"Wrote {len(final_failures)} llm_api_error final failures to {OUT_DIR}")
    for row in summary_rows:
        print(f"{row['model']}: {row['operation_count']} operations")


if __name__ == "__main__":
    main()
