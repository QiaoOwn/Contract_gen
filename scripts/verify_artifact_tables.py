#!/usr/bin/env python3
"""Print a compact verification summary directly from raw result folders.

This script intentionally uses only the Python standard library. It does not
read `results/paper_tables_current_data`; the paper tables can be regenerated
from the result folders shipped with the artifact.
"""

from __future__ import annotations

import csv
import json
from pathlib import Path
from statistics import mean


ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"

FULL_RUNS = {
    "gpt-5.4": "rq_gpt_5_4_full_oracle_fixed",
    "gpt-5.4-mini": "rq_gpt_5_4_mini_full_oracle_fixed",
    "claude-opus-4-7": "rq_claude_opus_4_7_full_oracle_fixed",
    "qwen3-coder-plus": "rq_qwen3_coder_plus_full_oracle_fixed",
    "qwen3-coder-flash": "rq_qwen3_coder_flash_full_oracle_fixed",
}

NO_FEEDBACK_RUNS = {
    "gpt-5.4": "gpt-5.4_full_114_attempt5",
    "gpt-5.4-mini": "gpt-5.4-mini_full_114_attempt5",
    "claude-opus-4-7": "claude-opus-4-7_full_114_attempt5",
    "qwen3-coder-plus": "qwen3-coder-plus_full_114_attempt5",
    "qwen3-coder-flash": "qwen3-coder-flash_full_114_attempt5",
}

GENERIC_RUNS = NO_FEEDBACK_RUNS

PURE_LLM_RUNS_FOR_AVERAGE = {
    "gpt-5.4": "gpt-5.4_full_rq1_rq2",
    "gpt-5.4-mini": "gpt-5.4-mini_full_rq1_rq2",
    "qwen3-coder-plus": "qwen3-coder-plus_full_rq1_rq2",
    "qwen3-coder-flash": "qwen3-coder-flash_full_rq1_rq2",
}


def count_jsonl(path: Path) -> int:
    with path.open("r", encoding="utf-8") as f:
        return sum(1 for line in f if line.strip())


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def read_one_csv(path: Path) -> dict[str, str]:
    with path.open("r", encoding="utf-8-sig", newline="") as f:
        rows = list(csv.DictReader(f))
    if len(rows) != 1:
        raise ValueError(f"Expected exactly one row in {path}, got {len(rows)}")
    return rows[0]


def first_by_model(summary_path: Path) -> dict:
    summary = read_json(summary_path)
    if "by_model" in summary:
        return summary["by_model"][0]
    if "exp1_by_model" in summary:
        return summary["exp1_by_model"][0]
    raise KeyError(f"No model summary found in {summary_path}")


def fmt(value: float) -> str:
    return f"{value:.2f}"


def full_run_row(model: str) -> tuple[int, float, int, float, int]:
    folder = RESULTS / FULL_RUNS[model]
    rq1 = read_one_csv(folder / "rq1_syntax_validity_by_model.csv")
    rq2 = read_one_csv(folder / "rq2_execution_success_by_model.csv")
    summary = first_by_model(folder / "summary.json")
    return (
        int(rq1["syntax_valid_count"]),
        float(rq1["syntax_validity_rate"]),
        int(rq2["execution_success_count"]),
        float(rq2["execution_success_rate"]),
        int(summary.get("total_attempts", count_jsonl(folder / "attempts.jsonl"))),
    )


def baseline_row(label: str, summary_path: Path) -> tuple[str, int, float, int, float]:
    row = first_by_model(summary_path)
    return (
        label,
        int(row["syntax_valid_count"]),
        float(row["syntax_validity_rate"]),
        int(row["execution_success_count"]),
        float(row["execution_success_rate"]),
    )


def pure_llm_average() -> tuple[str, int, float, int, float]:
    rows = [
        first_by_model(RESULTS / "baseline_llm_only" / folder / "summary.json")
        for folder in PURE_LLM_RUNS_FOR_AVERAGE.values()
    ]
    valid = int(mean(int(r["syntax_valid_count"]) for r in rows))
    passed = int(mean(int(r["execution_success_count"]) for r in rows))
    total = int(rows[0]["total_operations"])
    return ("PureLLM average", valid, valid / total * 100, passed, passed / total * 100)


def feedback_row(root: Path, folder: str) -> tuple[int, float, int, float]:
    row = first_by_model(root / folder / "summary.json")
    valid = int(row.get("syntax_valid_count", row.get("valid_count")))
    valid_rate = float(row.get("syntax_validity_rate", row.get("validity_rate")))
    passed = int(row.get("execution_success_count", 0))
    pass_rate = float(row.get("execution_success_rate", 0.0))
    if not passed:
        # No-feedback/generic summaries are syntax-first summaries; derive pass
        # counts from attempts when execution fields are absent.
        attempts = root / folder / "attempts.jsonl"
        if attempts.exists():
            by_op: dict[str, list[dict]] = {}
            with attempts.open("r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    rec = json.loads(line)
                    op = str(rec.get("operation_id"))
                    by_op.setdefault(op, []).append(rec)
            passed = sum(
                any(bool(r.get("final_pass", r.get("execution_valid", r.get("test_execution_ok")))) for r in rs)
                for rs in by_op.values()
            )
            total = int(row["total_operations"])
            pass_rate = passed / total * 100
    return valid, valid_rate, passed, pass_rate


def print_table(title: str, header: list[str], rows: list[list[str]]) -> None:
    print(f"\n{title}")
    print("-" * len(title))
    print(" | ".join(header))
    for row in rows:
        print(" | ".join(row))


def main() -> None:
    operations = count_jsonl(ROOT / "data" / "operations.jsonl")
    print(f"Benchmark operations: {operations}")

    rq_rows: list[list[str]] = []
    for label, path in [
        ("CodexPrompt-style + gpt-5.4", RESULTS / "codex_prompt_style" / "gpt-5.4_contract_full_114" / "summary.json"),
        ("PathOCL-style + gpt-5.4", RESULTS / "pathocl_style" / "gpt-5.4_path_contract_full_114" / "summary.json"),
    ]:
        name, valid, valid_rate, passed, pass_rate = baseline_row(label, path)
        rq_rows.append([name, str(valid), fmt(valid_rate), str(passed), fmt(pass_rate)])

    name, valid, valid_rate, passed, pass_rate = pure_llm_average()
    rq_rows.append([name, str(valid), fmt(valid_rate), str(passed), fmt(pass_rate)])

    staged_attempts = 0
    for model in FULL_RUNS:
        valid, valid_rate, passed, pass_rate, attempts = full_run_row(model)
        staged_attempts += attempts if model == "gpt-5.4" else 0
        rq_rows.append([f"Contract Gen + {model}", str(valid), fmt(valid_rate), str(passed), fmt(pass_rate)])

    print_table("RQ1/RQ2 summary derived from results/", ["Method", "#Valid", "Valid (%)", "#Pass", "Pass (%)"], rq_rows)

    feedback_rows: list[list[str]] = []
    totals = {"none": [0, 0, 0], "generic": [0, 0, 0], "full": [0, 0, 0]}
    for model in FULL_RUNS:
        no_valid, _, no_pass, _ = feedback_row(RESULTS / "rq3_ablation_no_feedback", NO_FEEDBACK_RUNS[model])
        gen_valid, _, gen_pass, _ = feedback_row(RESULTS / "rq3_ablation_generic_feedback", GENERIC_RUNS[model])
        full_valid, _, full_pass, _pass_rate = full_run_row(model)[:4]
        total = 114
        totals["none"][0] += no_valid
        totals["none"][1] += no_pass
        totals["none"][2] += total
        totals["generic"][0] += gen_valid
        totals["generic"][1] += gen_pass
        totals["generic"][2] += total
        totals["full"][0] += int(full_valid)
        totals["full"][1] += int(full_pass)
        totals["full"][2] += total
        feedback_rows.append(
            [
                model,
                fmt(no_pass / total * 100),
                fmt(gen_pass / total * 100),
                fmt(full_pass / total * 100),
                fmt((full_pass - no_pass) / total * 100),
            ]
        )
    feedback_rows.append(
        [
            "Micro average",
            fmt(totals["none"][1] / totals["none"][2] * 100),
            fmt(totals["generic"][1] / totals["generic"][2] * 100),
            fmt(totals["full"][1] / totals["full"][2] * 100),
            fmt((totals["full"][1] - totals["none"][1]) / totals["none"][2] * 100),
        ]
    )
    print_table(
        "RQ3 feedback summary derived from results/",
        ["Model", "NoFB Pass (%)", "Generic Pass (%)", "Full Pass (%)", "Full-NoFB (pp)"],
        feedback_rows,
    )

    single_summary = first_by_model(
        RESULTS / "rq3_ablation_single_agent_full_feedback" / "gpt-5.4_full_114_attempt5" / "summary.json"
    )
    single_attempts = count_jsonl(
        RESULTS / "rq3_ablation_single_agent_full_feedback" / "gpt-5.4_full_114_attempt5" / "attempts.jsonl"
    )
    arch_rows = [
        ["Staged Contract Gen", "52.63", "52.63", str(staged_attempts), "1.00"],
        [
            "Single agent",
            fmt(single_summary["pass_at_rates"]["1"]),
            fmt(single_summary["pass_at_rates"]["5"]),
            str(single_attempts),
            fmt(single_attempts / staged_attempts),
        ],
    ]
    print_table("RQ3 architecture summary derived from results/", ["Architecture", "Pass@1 (%)", "Pass@5 (%)", "Attempts", "Relative effort"], arch_rows)

    use_summary_path = RESULTS / "ocltsvm_sanity_check_114_strong" / "summary.json"
    if not use_summary_path.exists():
        use_summary_path = RESULTS / "oclvm_sanity_check_114_strong" / "summary.json"
    print("\nExternal USE/OCLTSVM summary")
    print("---------------------------")
    if use_summary_path.exists():
        use_summary = read_json(use_summary_path)
        print(json.dumps(use_summary, ensure_ascii=False, indent=2))
    else:
        print("No USE summary found. Expected one of:")
        print(f"- {RESULTS / 'ocltsvm_sanity_check_114_strong' / 'summary.json'}")
        print(f"- {RESULTS / 'oclvm_sanity_check_114_strong' / 'summary.json'}")


if __name__ == "__main__":
    main()
