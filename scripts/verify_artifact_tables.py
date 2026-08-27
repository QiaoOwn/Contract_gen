#!/usr/bin/env python3
"""Recompute the paper-facing metrics from frozen Contract Gen v5 attempts.

Legacy result directories are deliberately invisible to this script. Every
consumed attempt must match the canonical 114-operation manifest and carry the
``contractgen-study-v6`` marker.
"""

from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple


ROOT = Path(__file__).resolve().parents[1]
STUDY_VERSION = "contractgen-study-v6"
INPUT_SCHEMA_VERSION = "contractgen-operation-input-v2"
RESULTS = ROOT / "results" / STUDY_VERSION
PAPER_MODELS = (
    "gpt-5.5",
    "gpt-5.4",
    "gemini-3.5-flash",
    "claude-opus-4-7",
)

RUNS = {
    "full_feedback": RESULTS / "contract_gen" / "full_feedback" / "attempts.jsonl",
    "generic_feedback": RESULTS / "contract_gen" / "generic_feedback" / "attempts.jsonl",
    "no_feedback": RESULTS / "contract_gen" / "no_feedback" / "attempts.jsonl",
    "pure_llm": RESULTS / "baselines" / "purellm" / "attempts.jsonl",
    "codex_prompt_style": RESULTS / "baselines" / "codexprompt" / "attempts.jsonl",
    "pathocl_style": RESULTS / "baselines" / "pathocl" / "attempts.jsonl",
    "end_to_end_full_feedback": (
        RESULTS / "ablations" / "end_to_end_full_feedback" / "attempts.jsonl"
    ),
}


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.is_file():
        raise FileNotFoundError(f"Required v5 result is missing: {path}")
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, raw in enumerate(handle, 1):
            if not raw.strip():
                continue
            try:
                row = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSON: {exc}") from exc
            if not isinstance(row, dict):
                raise ValueError(f"{path}:{line_no}: expected a JSON object")
            rows.append(row)
    return rows


def load_manifest() -> Dict[str, Dict[str, Any]]:
    rows = read_jsonl(ROOT / "data" / "operations.jsonl")
    manifest = {str(row.get("id") or ""): row for row in rows}
    if len(rows) != 114 or len(manifest) != 114 or "" in manifest:
        raise ValueError(
            f"Expected 114 unique canonical operations, got {len(rows)} rows and "
            f"{len(manifest)} ids"
        )
    return manifest


MANIFEST = load_manifest()


def validated_attempts(setting: str) -> List[Dict[str, Any]]:
    path = RUNS[setting]
    rows = read_jsonl(path)
    seen: set[Tuple[str, str, int]] = set()
    for line_no, row in enumerate(rows, 1):
        operation_id = str(row.get("operation_id") or "")
        model = str(row.get("model") or row.get("model_name") or "")
        attempt = int(row.get("attempt") or row.get("attempt_id") or 0)
        manifest = MANIFEST.get(operation_id)
        shared_prompt_hash = row.get("shared_prompt_hash") or row.get("prompt_hash")
        checks = {
            "study_version": row.get("study_version") == STUDY_VERSION,
            "input_schema_version": row.get("input_schema_version") == INPUT_SCHEMA_VERSION,
            "known_operation": manifest is not None,
            "input_hash": bool(manifest) and row.get("input_hash") == manifest.get("input_hash"),
            "prompt_hash": bool(manifest)
            and shared_prompt_hash == manifest.get("prompt_hash"),
            "generation_prompt_version": bool(row.get("generation_prompt_version")),
            "model": bool(model),
            "attempt": attempt > 0,
        }
        failed = [name for name, ok in checks.items() if not ok]
        if failed:
            raise ValueError(
                f"{path}:{line_no}: incompatible record ({', '.join(failed)})"
            )
        key = (operation_id, model, attempt)
        if key in seen:
            raise ValueError(f"{path}:{line_no}: duplicate attempt key {key}")
        seen.add(key)
        if row.get("execution_eval_skipped") is True:
            raise ValueError(f"{path}:{line_no}: execution validation was skipped")
    return rows


def summarize(setting: str, model: str) -> Dict[str, float]:
    rows = [
        row
        for row in validated_attempts(setting)
        if str(row.get("model") or row.get("model_name")) == model
    ]
    by_operation: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for row in rows:
        by_operation[str(row["operation_id"])].append(row)
    if set(by_operation) != set(MANIFEST):
        missing = sorted(set(MANIFEST) - set(by_operation))
        extra = sorted(set(by_operation) - set(MANIFEST))
        raise ValueError(
            f"{setting}/{model} is incomplete: {len(by_operation)}/114 operations; "
            f"missing={missing[:5]}, extra={extra[:5]}"
        )

    valid = sum(
        any(bool(row.get("syntax_valid", row.get("is_valid"))) for row in group)
        for group in by_operation.values()
    )
    passed = sum(
        any(bool(row.get("execution_valid", row.get("test_execution_ok"))) for row in group)
        for group in by_operation.values()
    )
    pass_at_1 = sum(
        any(
            bool(row.get("execution_valid", row.get("test_execution_ok")))
            and int(row.get("cumulative_llm_generation_count") or row.get("attempt") or 0) <= 1
            for row in group
        )
        for group in by_operation.values()
    )
    generations = sum(
        int(row.get("llm_generation_count") or 1) for row in rows
    )
    return {
        "valid": valid,
        "valid_rate": 100.0 * valid / 114,
        "passed": passed,
        "pass_rate": 100.0 * passed / 114,
        "pass_at_1": pass_at_1,
        "pass_at_1_rate": 100.0 * pass_at_1 / 114,
        "generations": generations,
    }


def fmt(value: float) -> str:
    return f"{value:.2f}"


def print_table(title: str, header: Iterable[str], rows: Iterable[Iterable[str]]) -> None:
    print(f"\n{title}\n{'-' * len(title)}")
    print(" | ".join(header))
    for row in rows:
        print(" | ".join(row))


def main() -> None:
    comparison = []
    for label, setting in (
        ("CodexPrompt-style + gpt-5.4", "codex_prompt_style"),
        ("PathOCL-style + gpt-5.4", "pathocl_style"),
        ("PureLLM + gpt-5.4", "pure_llm"),
    ):
        row = summarize(setting, "gpt-5.4")
        comparison.append(
            [label, str(int(row["valid"])), fmt(row["valid_rate"]),
             str(int(row["passed"])), fmt(row["pass_rate"])]
        )
    for model in PAPER_MODELS:
        row = summarize("full_feedback", model)
        comparison.append(
            [f"Contract Gen + {model}", str(int(row["valid"])), fmt(row["valid_rate"]),
             str(int(row["passed"])), fmt(row["pass_rate"])]
        )
    print_table(
        "RQ1/RQ2 summary from frozen v5 attempts",
        ["Method", "#Valid", "Valid (%)", "#Pass", "Pass (%)"],
        comparison,
    )

    feedback_rows = []
    totals = {name: 0.0 for name in ("no_feedback", "generic_feedback", "full_feedback")}
    for model in PAPER_MODELS:
        no_feedback = summarize("no_feedback", model)
        generic = summarize("generic_feedback", model)
        full = summarize("full_feedback", model)
        for name, row in (
            ("no_feedback", no_feedback),
            ("generic_feedback", generic),
            ("full_feedback", full),
        ):
            totals[name] += row["passed"]
        feedback_rows.append(
            [model, fmt(no_feedback["pass_rate"]), fmt(generic["pass_rate"]),
             fmt(full["pass_rate"]), fmt(full["pass_rate"] - no_feedback["pass_rate"])]
        )
    denominator = 114 * len(PAPER_MODELS)
    feedback_rows.append(
        ["Micro average", fmt(100 * totals["no_feedback"] / denominator),
         fmt(100 * totals["generic_feedback"] / denominator),
         fmt(100 * totals["full_feedback"] / denominator),
         fmt(100 * (totals["full_feedback"] - totals["no_feedback"]) / denominator)]
    )
    print_table(
        "RQ3 feedback summary from frozen v5 attempts",
        ["Model", "NoFB Pass (%)", "Generic Pass (%)", "Full Pass (%)", "Full-NoFB (pp)"],
        feedback_rows,
    )

    staged = summarize("full_feedback", "gpt-5.4")
    end_to_end = summarize("end_to_end_full_feedback", "gpt-5.4")
    print_table(
        "RQ3 pipeline-structure summary from frozen v5 attempts",
        ["Architecture", "Pass@1 (%)", "Pass@5 (%)", "LLM generations"],
        [
            ["Staged Contract Gen", fmt(staged["pass_at_1_rate"]),
             fmt(staged["pass_rate"]), str(int(staged["generations"]))],
            ["End-to-end full feedback", fmt(end_to_end["pass_at_1_rate"]),
             fmt(end_to_end["pass_rate"]), str(int(end_to_end["generations"]))],
        ],
    )

    use_summary = RESULTS / "validation" / "use_strong_114" / "summary.json"
    if not use_summary.is_file():
        raise FileNotFoundError(f"Required USE validation summary is missing: {use_summary}")
    print("\nExternal USE/OCLTSVM summary\n---------------------------")
    print(json.dumps(json.loads(use_summary.read_text(encoding="utf-8")), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    try:
        main()
    except (FileNotFoundError, ValueError) as error:
        raise SystemExit(f"Artifact verification failed: {error}") from None
