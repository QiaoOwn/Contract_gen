#!/usr/bin/env python3

import argparse
import csv
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple

import run_rq1_validity_experiments as rq1


PAIRED_STUDY_VERSION = "paired-feedback-ablation-v1"
TREATMENTS = ("none", "generic", "full")


def load_operations(path: Path, limit: int = 0) -> List[Dict[str, Any]]:
    operations: List[Dict[str, Any]] = []
    for line_no, raw in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not raw.strip():
            continue
        operation = rq1.safe_operation(json.loads(raw), line_no)
        if operation:
            operations.append(operation)
    if len(operations) != rq1.EXPECTED_OPERATION_COUNT:
        raise RuntimeError(
            f"Expected {rq1.EXPECTED_OPERATION_COUNT} canonical operations in {path}, "
            f"found {len(operations)}"
        )
    if len({operation["id"] for operation in operations}) != len(operations):
        raise RuntimeError(f"Duplicate operation ids in {path}")
    return operations[:limit] if limit > 0 else operations


def operation_request(operation: Dict[str, Any]) -> Tuple[str, str, str, Optional[str]]:
    project = str(operation.get("project") or "").strip()
    use_case = str(operation.get("useCase") or "").strip()
    operation_name = str(operation.get("operation") or "").strip()
    if not (project and use_case and operation_name):
        raise RuntimeError(f"{operation['id']}: missing project/useCase/operation routing fields")
    raw_user_input = operation.get("userInput")
    user_input = (
        str(raw_user_input).strip()
        if raw_user_input is not None and str(raw_user_input).strip()
        else str(operation.get("description") or "").strip() or None
    )
    return project, use_case, operation_name, user_input


def normalize_ocl(value: Any) -> Dict[str, str]:
    if not isinstance(value, dict):
        raise RuntimeError("Pipeline did not return a structured OCL candidate")
    normalized = {
        "definition": "" if value.get("definition") is None else str(value.get("definition")),
        "precondition": str(value.get("precondition") or ""),
        "postcondition": str(value.get("postcondition") or ""),
    }
    if not normalized["precondition"] or not normalized["postcondition"]:
        raise RuntimeError("OCL candidate is missing precondition or postcondition")
    return normalized


def candidate_hash(candidate: Dict[str, str]) -> str:
    canonical = json.dumps(candidate, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return rq1.sha256_text(canonical)


def validation_outcome(meta: Dict[str, Any]) -> Dict[str, Any]:
    syntax_valid = bool(meta.get("contract_parse_ok"))
    pre_execution_valid = (
        syntax_valid
        and bool(meta.get("typescript_generation_ok"))
        and bool(meta.get("typescript_parse_ok"))
    )
    execution_valid = pre_execution_valid and bool(meta.get("test_execution_ok"))
    if not syntax_valid:
        stage = "parser"
    elif not bool(meta.get("typescript_generation_ok")):
        stage = "typescript_generator"
    elif not bool(meta.get("typescript_parse_ok")):
        stage = "typescript_parser"
    elif not bool(meta.get("test_execution_ok")):
        stage = "jest"
    else:
        stage = "passed"
    return {
        "syntax_valid": syntax_valid,
        "pre_execution_valid": pre_execution_valid,
        "execution_valid": execution_valid,
        "validation_stage": stage,
        "contract_errors": meta.get("last_contract_errors") or [],
        "typescript_generation_errors": meta.get("last_typescript_generation_errors") or [],
        "typescript_parse_errors": meta.get("last_typescript_parse_errors") or [],
        "test_passing_count": int(meta.get("test_passing_count") or 0),
        "test_failing_count": int(meta.get("test_failing_count") or 0),
    }


def assert_pipeline_success(meta: Dict[str, Any], operation_id: str, phase: str) -> None:
    if meta.get("http_error"):
        raise RuntimeError(f"{operation_id}: {phase} pipeline failed: {meta['http_error']}")
    if not meta.get("last_ocl"):
        raise RuntimeError(f"{operation_id}: {phase} pipeline returned no OCL candidate")


def index_unique(rows: Iterable[Dict[str, Any]], fields: Tuple[str, ...]) -> Dict[Tuple[str, ...], Dict[str, Any]]:
    indexed: Dict[Tuple[str, ...], Dict[str, Any]] = {}
    for row in rows:
        key = tuple(str(row.get(field) or "") for field in fields)
        if not all(key):
            raise RuntimeError(f"Incomplete result key {key}")
        if key in indexed:
            raise RuntimeError(f"Duplicate result key {key}")
        indexed[key] = row
    return indexed


def validate_shared_row(row: Dict[str, Any], operation: Dict[str, Any], model: str) -> None:
    if row.get("paired_study_version") != PAIRED_STUDY_VERSION:
        raise RuntimeError(f"{operation['id']}: incompatible paired study version")
    if row.get("model") != model:
        raise RuntimeError(f"{operation['id']}: frozen candidate uses a different model")
    if row.get("input_hash") != operation.get("input_hash"):
        raise RuntimeError(f"{operation['id']}: frozen candidate input hash mismatch")
    candidate = normalize_ocl(row.get("initial_ocl"))
    if row.get("initial_candidate_hash") != candidate_hash(candidate):
        raise RuntimeError(f"{operation['id']}: frozen candidate hash mismatch")


def write_raw_stream(path: Path, record: Dict[str, Any]) -> None:
    rq1.append_jsonl(path, record)


def prepare(args: argparse.Namespace, operations: List[Dict[str, Any]]) -> None:
    output_dir = Path(args.output_dir)
    shared_path = output_dir / "shared_initial_candidates.jsonl"
    raw_path = output_dir / "raw_streams.jsonl"
    existing_rows = rq1.read_jsonl(shared_path)
    existing = index_unique(existing_rows, ("operation_id", "model"))
    operation_map = {operation["id"]: operation for operation in operations}
    for (operation_id, model), row in existing.items():
        if operation_id not in operation_map or model != args.model:
            continue
        validate_shared_row(row, operation_map[operation_id], args.model)

    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    for index, operation in enumerate(operations, 1):
        key = (operation["id"], args.model)
        if key in existing:
            continue
        project, use_case, operation_name, user_input = operation_request(operation)
        started = time.perf_counter()
        raw_stream, meta = rq1.call_next_generate_ndjson(
            args.next_base_url,
            api_key,
            project,
            use_case,
            operation_name,
            args.model,
            user_input,
            args.next_read_timeout,
            graph_mode="linear",
            feedback_mode="none",
            max_generation_attempts=1,
        )
        assert_pipeline_success(meta, operation["id"], "prepare")
        initial_ocl = normalize_ocl(meta["last_ocl"])
        outcome = validation_outcome(meta)
        record = {
            "paired_study_version": PAIRED_STUDY_VERSION,
            "study_version": rq1.STUDY_VERSION,
            "phase": "prepare",
            "operation_id": operation["id"],
            "requirement_group_id": operation.get("requirement_group_id", ""),
            "case_study": operation.get("case_study", ""),
            "project": project,
            "use_case": use_case,
            "operation": operation_name,
            "model": args.model,
            "input_schema_version": operation.get("input_schema_version", ""),
            "input_hash": operation.get("input_hash", ""),
            "prompt_version": (meta.get("prompt_metadata") or {}).get("version", ""),
            "prompt_hash": (meta.get("prompt_metadata") or {}).get("hash", ""),
            "generation_config_hash": (meta.get("prompt_metadata") or {}).get(
                "generationConfigHash", ""
            ),
            "initial_ocl": initial_ocl,
            "initial_candidate_hash": candidate_hash(initial_ocl),
            "generation_count": 1,
            "feedback_mode": "none",
            "feedback_used": False,
            "latency_sec": round(time.perf_counter() - started, 4),
            "timestamp": rq1.utc_now_iso(),
            **outcome,
        }
        rq1.append_jsonl(shared_path, record)
        write_raw_stream(
            raw_path,
            {
                "phase": "prepare",
                "operation_id": operation["id"],
                "model": args.model,
                "raw_stream": raw_stream,
                "timestamp": record["timestamp"],
            },
        )
        print(
            f"prepare {index}/{len(operations)} {operation['id']} "
            f"stage={record['validation_stage']}",
            flush=True,
        )
        time.sleep(max(0.0, args.sleep_between_calls))


def parse_treatments(value: str) -> List[str]:
    treatments = [part.strip() for part in value.split(",") if part.strip()]
    if not treatments or any(treatment not in TREATMENTS for treatment in treatments):
        raise argparse.ArgumentTypeError(f"treatments must be selected from {TREATMENTS}")
    if len(treatments) != len(set(treatments)):
        raise argparse.ArgumentTypeError("duplicate treatments are not allowed")
    return treatments


def repair(args: argparse.Namespace, operations: List[Dict[str, Any]]) -> None:
    output_dir = Path(args.output_dir)
    shared_path = output_dir / "shared_initial_candidates.jsonl"
    attempts_path = output_dir / "paired_attempts.jsonl"
    raw_path = output_dir / "raw_streams.jsonl"
    shared_rows = rq1.read_jsonl(shared_path)
    shared = index_unique(shared_rows, ("operation_id", "model"))
    operation_map = {operation["id"]: operation for operation in operations}
    for operation in operations:
        key = (operation["id"], args.model)
        if key not in shared:
            raise RuntimeError(f"{operation['id']}: missing frozen initial candidate; run prepare first")
        validate_shared_row(shared[key], operation, args.model)

    existing_rows = rq1.read_jsonl(attempts_path)
    existing = index_unique(existing_rows, ("operation_id", "model", "treatment"))
    api_key = os.environ.get("OPENAI_API_KEY", "")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    failures = [
        shared[(operation["id"], args.model)]
        for operation in operations
        if not shared[(operation["id"], args.model)].get("pre_execution_valid")
    ]
    total = len(failures) * len(args.treatments)
    progress = 0
    for initial in failures:
        operation = operation_map[str(initial["operation_id"])]
        project, use_case, operation_name, user_input = operation_request(operation)
        initial_ocl = normalize_ocl(initial["initial_ocl"])
        for treatment in args.treatments:
            progress += 1
            key = (operation["id"], args.model, treatment)
            if key in existing:
                continue
            started = time.perf_counter()
            raw_stream, meta = rq1.call_next_generate_ndjson(
                args.next_base_url,
                api_key,
                project,
                use_case,
                operation_name,
                args.model,
                user_input,
                args.next_read_timeout,
                graph_mode="paired",
                feedback_mode=treatment,
                max_generation_attempts=args.max_attempts,
                initial_ocl=initial_ocl,
                initial_generation_count=1,
            )
            assert_pipeline_success(meta, operation["id"], f"repair/{treatment}")
            final_ocl = normalize_ocl(meta["last_ocl"])
            outcome = validation_outcome(meta)
            additional_generations = int(meta.get("repair_round_count") or 0)
            feedback_used = bool(meta.get("feedback_used"))
            expected_feedback = treatment != "none" and additional_generations > 0
            if feedback_used != expected_feedback:
                raise RuntimeError(
                    f"{operation['id']}: feedback isolation mismatch for {treatment} "
                    f"(observed={feedback_used}, expected={expected_feedback})"
                )
            record = {
                "paired_study_version": PAIRED_STUDY_VERSION,
                "study_version": rq1.STUDY_VERSION,
                "phase": "repair",
                "operation_id": operation["id"],
                "requirement_group_id": operation.get("requirement_group_id", ""),
                "case_study": operation.get("case_study", ""),
                "model": args.model,
                "treatment": treatment,
                "input_hash": operation.get("input_hash", ""),
                "initial_candidate_hash": initial["initial_candidate_hash"],
                "initial_validation_stage": initial["validation_stage"],
                "initial_ocl": initial_ocl,
                "final_ocl": final_ocl,
                "final_candidate_hash": candidate_hash(final_ocl),
                "initial_generation_count": 1,
                "additional_generation_count": additional_generations,
                "total_generation_count": 1 + additional_generations,
                "feedback_used": feedback_used,
                "recovered_after_retry": outcome["pre_execution_valid"],
                "latency_sec": round(time.perf_counter() - started, 4),
                "timestamp": rq1.utc_now_iso(),
                **outcome,
            }
            rq1.append_jsonl(attempts_path, record)
            write_raw_stream(
                raw_path,
                {
                    "phase": "repair",
                    "operation_id": operation["id"],
                    "model": args.model,
                    "treatment": treatment,
                    "initial_candidate_hash": initial["initial_candidate_hash"],
                    "raw_stream": raw_stream,
                    "timestamp": record["timestamp"],
                },
            )
            print(
                f"repair {progress}/{total} {treatment} {operation['id']} "
                f"stage={record['validation_stage']} generations={record['total_generation_count']}",
                flush=True,
            )
            time.sleep(max(0.0, args.sleep_between_calls))


def summarize(args: argparse.Namespace, operations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    output_dir = Path(args.output_dir)
    shared_rows = rq1.read_jsonl(output_dir / "shared_initial_candidates.jsonl")
    attempt_rows = rq1.read_jsonl(output_dir / "paired_attempts.jsonl")
    shared = index_unique(shared_rows, ("operation_id", "model"))
    attempts = index_unique(attempt_rows, ("operation_id", "model", "treatment"))
    selected_shared: List[Dict[str, Any]] = []
    for operation in operations:
        key = (operation["id"], args.model)
        if key not in shared:
            continue
        validate_shared_row(shared[key], operation, args.model)
        selected_shared.append(shared[key])
    failures = [row for row in selected_shared if not row.get("pre_execution_valid")]
    initial_valid = sum(1 for row in selected_shared if row.get("pre_execution_valid"))
    initial_pass = sum(1 for row in selected_shared if row.get("execution_valid"))
    summary_rows: List[Dict[str, Any]] = []
    failure_rows: List[Dict[str, Any]] = []
    for treatment in args.treatments:
        treatment_rows = [
            attempts[(row["operation_id"], args.model, treatment)]
            for row in failures
            if (row["operation_id"], args.model, treatment) in attempts
        ]
        recovered = sum(1 for row in treatment_rows if row.get("pre_execution_valid"))
        repair_pass = sum(1 for row in treatment_rows if row.get("execution_valid"))
        additional_generations = sum(
            int(row.get("additional_generation_count") or 0) for row in treatment_rows
        )
        complete = len(selected_shared) == len(operations) and len(treatment_rows) == len(failures)
        failure_count = len(failures)
        summary_rows.append(
            {
                "treatment": treatment,
                "model": args.model,
                "complete": complete,
                "total_operations": len(selected_shared),
                "shared_initial_failures": failure_count,
                "completed_repair_branches": len(treatment_rows),
                "recovered_count": recovered,
                "unrecovered_count": len(treatment_rows) - recovered,
                "recovery_rate": (
                    100.0 * recovered / len(treatment_rows) if treatment_rows else 0.0
                ),
                "final_valid_count": initial_valid + recovered,
                "final_validity_rate": (
                    100.0 * (initial_valid + recovered) / len(selected_shared)
                    if selected_shared
                    else 0.0
                ),
                "final_pass_count": initial_pass + repair_pass,
                "final_pass_rate": (
                    100.0 * (initial_pass + repair_pass) / len(selected_shared)
                    if selected_shared
                    else 0.0
                ),
                "total_generation_count": len(selected_shared) + additional_generations,
                "avg_generation_count": (
                    (len(selected_shared) + additional_generations) / len(selected_shared)
                    if selected_shared
                    else 0.0
                ),
                "avg_extra_generations_per_failed_case": (
                    additional_generations / failure_count if failure_count else 0.0
                ),
                "avg_extra_generations_per_recovery": (
                    additional_generations / recovered if recovered else 0.0
                ),
            }
        )
        for initial in failures:
            result = attempts.get((initial["operation_id"], args.model, treatment))
            failure_rows.append(
                {
                    "operation_id": initial["operation_id"],
                    "case_study": initial.get("case_study", ""),
                    "model": args.model,
                    "treatment": treatment,
                    "initial_candidate_hash": initial["initial_candidate_hash"],
                    "initial_validation_stage": initial["validation_stage"],
                    "completed": result is not None,
                    "recovered": bool(result and result.get("pre_execution_valid")),
                    "final_validation_stage": result.get("validation_stage", "") if result else "",
                    "additional_generation_count": (
                        int(result.get("additional_generation_count") or 0) if result else 0
                    ),
                }
            )

    output_dir.mkdir(parents=True, exist_ok=True)
    summary_path = output_dir / "paired_summary.csv"
    if summary_rows:
        with summary_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(summary_rows[0].keys()))
            writer.writeheader()
            writer.writerows(summary_rows)
    failure_path = output_dir / "paired_failures.csv"
    if failure_rows:
        with failure_path.open("w", newline="", encoding="utf-8") as handle:
            writer = csv.DictWriter(handle, fieldnames=list(failure_rows[0].keys()))
            writer.writeheader()
            writer.writerows(failure_rows)
    (output_dir / "paired_summary.json").write_text(
        json.dumps(
            {
                "paired_study_version": PAIRED_STUDY_VERSION,
                "generated_at": rq1.utc_now_iso(),
                "model": args.model,
                "max_generation_attempts": args.max_attempts,
                "shared_candidate_count": len(selected_shared),
                "shared_initial_failure_count": len(failures),
                "results": summary_rows,
            },
            ensure_ascii=False,
            indent=2,
        )
        + "\n",
        encoding="utf-8",
    )
    return summary_rows


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Paired feedback ablation with one frozen initial candidate per operation."
    )
    parser.add_argument("phase", choices=["prepare", "repair", "summarize", "all"])
    parser.add_argument("--input", default="data/operations.jsonl")
    parser.add_argument("--model", default="gpt-5.5", choices=rq1.ALL_MODELS)
    parser.add_argument(
        "--output-dir",
        default="results/contractgen-study-v6/rq3_paired/gpt-5.5",
    )
    parser.add_argument("--next-base-url", default="http://127.0.0.1:3000")
    parser.add_argument("--next-read-timeout", type=float, default=600.0)
    parser.add_argument("--max-attempts", type=int, default=5)
    parser.add_argument("--treatments", type=parse_treatments, default=list(TREATMENTS))
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--sleep-between-calls", type=float, default=1.0)
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    if args.max_attempts != 5:
        parser.error("paired ablation uses a frozen total budget of exactly five generations")
    input_path = Path(args.input)
    if not input_path.exists():
        parser.error(f"input not found: {input_path}")
    rq1.load_env_file(rq1.repo_root() / ".env")
    operations = load_operations(input_path, args.limit)
    if args.phase in {"prepare", "all"}:
        prepare(args, operations)
    if args.phase in {"repair", "all"}:
        repair(args, operations)
    if args.phase in {"repair", "summarize", "all"}:
        rows = summarize(args, operations)
        for row in rows:
            print(
                f"{row['treatment']}: recovered={row['recovered_count']}/"
                f"{row['shared_initial_failures']} valid={row['final_validity_rate']:.2f}% "
                f"pass={row['final_pass_rate']:.2f}% generations={row['total_generation_count']}",
                flush=True,
            )


if __name__ == "__main__":
    main()
