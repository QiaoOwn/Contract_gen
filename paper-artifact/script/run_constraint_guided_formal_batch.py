#!/usr/bin/env python3
"""Run the locked v4 constraint-guided treatment with resumable evidence."""

import argparse
import hashlib
import json
from pathlib import Path

import run_constraint_guided_operation as operation
from constraint_oracle_profile import ADJUDICATED_INPUT, ADJUDICATED_PROFILE
from rm2pt_v4_release_profile import DEFAULT_PROFILE, verify_profile

MAX_INFRASTRUCTURE_RETRIES = 3


def read(path):
    return json.loads(path.read_text(encoding="utf-8"))


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def child_args(args, ident, directory, prepare_only):
    return argparse.Namespace(
        input=ADJUDICATED_INPUT, oracle_profile=ADJUDICATED_PROFILE,
        operation_id=ident, output_dir=str(directory), model=args.model,
        max_attempts=5, development_behavior=False, prepare_only=prepare_only,
        release_profile=str(DEFAULT_PROFILE), next_base_url=args.next_base_url,
        next_read_timeout=args.next_read_timeout,
    )


def frozen_manifest(args, ids, release_hash):
    root = operation.rq1.repo_root()
    return {
        "schema_version": "rm2pt-v4-formal-constraint-batch-v2",
        "role": "formal" if args.limit == 0 else "pilot-subset-not-114-result",
        "input": ADJUDICATED_INPUT,
        "input_sha256": digest(root / ADJUDICATED_INPUT),
        "oracle_profile": ADJUDICATED_PROFILE,
        "release_profile_sha256": release_hash,
        "operation_ids": ids,
        "model": args.model,
        "max_generation_attempts": 5,
        "feedback_mode": "full",
        "development_behavior": False,
        "constraint_solving": True,
        "hidden_jest_feedback": False,
        "next_base_url": args.next_base_url,
        "next_read_timeout": args.next_read_timeout,
    }


def verify_child(directory, ident, frozen, prepare_only):
    summary = read(directory / "summary.json")
    expected = {
        "operation_id": ident, "model": frozen["model"],
        "input_sha256": frozen["input_sha256"],
        "oracle_profile": frozen["oracle_profile"],
        "release_profile_sha256": frozen["release_profile_sha256"],
        "development_behavior_enabled": False,
        "formal_experiment_ready": True,
        "max_generation_attempts": 5,
    }
    if any(summary.get(key) != value for key, value in expected.items()):
        raise ValueError(f"{ident}: child configuration differs from frozen batch")
    if summary.get("evaluation_ready") is not True:
        raise ValueError(f"{ident}: selected Oracle binding is not ready")
    if prepare_only:
        if (summary.get("status") != "prepared-only" or summary.get("real_llm_calls") != 0 or
                summary.get("hidden_evaluation_count") != 0):
            raise ValueError(f"{ident}: preflight must not consume a model or Jest call")
        prepared = read(directory / "planning.json")
        if (prepared.get("containsPrecomputedAnswer") is not False or
                prepared.get("evaluation", {}).get("ready") is not True):
            raise ValueError(f"{ident}: task plan contains an answer or lacks evaluation")
        return (prepared["solverPromptVersion"], prepared["solverPromptHash"],
                prepared["plan"]["policyHash"])
    if summary.get("status") not in ("evaluated", "validation-stopped"):
        raise ValueError(f"{ident}: incomplete run; preserve evidence before retrying")
    calls = summary.get("real_llm_calls")
    if type(calls) is not int or not 1 <= calls <= 5:
        raise ValueError(f"{ident}: invalid actual model-call count")
    events = [json.loads(line) for line in (directory / "events.ndjson").read_text(encoding="utf-8").splitlines()
              if line.strip()]
    generated = [event["OCL Generator"] for event in events if "OCL Generator" in event]
    terminal = [event["Test Result"] for event in events if "Test Result" in event]
    if len(generated) != calls or len(terminal) != summary["hidden_evaluation_count"] or len(terminal) > 1:
        raise ValueError(f"{ident}: saved attempts and terminal evaluation disagree")
    return {"operation_id": ident, "status": summary["status"],
            "real_llm_calls": calls, "hidden_evaluation_count": len(terminal),
            "hidden_passed": summary.get("hidden_passed", False),
            "method_accepted": summary.get("method_accepted", False)}


def select_run_directory(output, ident):
    """Keep failed streams, but never score them as completed operation runs."""
    interrupted = []
    for retry in range(MAX_INFRASTRUCTURE_RETRIES + 1):
        directory = output / "runs" / (ident if retry == 0 else f"{ident}__infra_retry_{retry}")
        if not directory.exists():
            return directory, interrupted
        summary_path = directory / "summary.json"
        if not summary_path.is_file():
            raise ValueError(f"{ident}: existing run has no summary; inspect it before resuming")
        summary = read(summary_path)
        if summary.get("status") in ("evaluated", "validation-stopped"):
            return directory, interrupted
        metadata_path = directory / "metadata.json"
        metadata = read(metadata_path) if metadata_path.is_file() else {}
        reason = str(metadata.get("http_error") or "")
        if summary.get("status") != "invalid-or-incomplete" or not (
            reason.startswith("URL error:") or metadata.get("stream_incomplete")
        ):
            raise ValueError(f"{ident}: incomplete run is not a proven transport interruption; inspect {directory}")
        interrupted.append({"operation_id": ident, "directory": str(directory.relative_to(output)),
                            "recorded_model_calls": summary.get("real_llm_calls"),
                            "reason": reason or str(metadata.get("stream_incomplete"))})
    raise ValueError(f"{ident}: infrastructure retry limit reached; inspect preserved runs")


def run(args):
    release, release_hash = verify_profile()
    root = operation.rq1.repo_root()
    rows = operation.rq1.read_jsonl(root / ADJUDICATED_INPUT)
    ids = [row["id"] for row in rows]
    if len(ids) != 114 or len(set(ids)) != 114:
        raise ValueError("Formal v4 input must contain exactly 114 distinct operations")
    if not 0 <= args.limit <= 114:
        raise ValueError("--limit must be 0 for the full suite or 1..114 for a pilot")
    if args.limit:
        ids = ids[:args.limit]
    frozen = frozen_manifest(args, ids, release_hash)
    output = Path(args.output_dir).resolve()
    if output.exists():
        if not args.resume or read(output / "batch_manifest.json") != frozen:
            raise ValueError("Use a new directory or --resume with exactly the same configuration")
    else:
        output.mkdir(parents=True)
        operation.write_json(output / "batch_manifest.json", frozen)

    summary = {"role": frozen["role"], "model": args.model, "operation_count": len(ids),
               "status": "preflighting", "preflight_count": 0, "completed_count": 0,
               "results": [], "interrupted_runs": [], "real_llm_calls": 0,
               "interrupted_recorded_llm_calls": 0,
               "interrupted_runs_with_unknown_call_count": 0,
               "hidden_evaluation_count": 0}

    def save():
        operation.write_json(output / "summary.json", summary)

    save()
    try:
        common = None
        for index, ident in enumerate(ids, 1):
            directory = output / "preflight" / ident
            if not directory.exists():
                operation.run(child_args(args, ident, directory, True))
            identity = verify_child(directory, ident, frozen, True)
            if common is not None and identity != common:
                raise ValueError(f"{ident}: solver prompt or task policy differs within the batch")
            common = identity
            summary["preflight_count"] = index
            save()
        if verify_profile()[1] != release_hash or frozen_manifest(args, ids, release_hash) != frozen:
            raise ValueError("Release profile or frozen batch changed during preflight")
        summary["solver_prompt_version"], summary["solver_prompt_hash"], summary["constraint_policy_hash"] = common
        summary["status"] = "prepared-only" if args.prepare_only else "running"
        save()
        if args.prepare_only:
            return summary
        operation.rq1.check_next_server(args.next_base_url)
        for index, ident in enumerate(ids, 1):
            summary["active_operation"] = ident
            save()
            if verify_profile()[1] != release_hash or frozen_manifest(args, ids, release_hash) != frozen:
                raise ValueError("Release profile or frozen batch changed during execution")
            directory, interrupted = select_run_directory(output, ident)
            summary["interrupted_runs"].extend(interrupted)
            summary["interrupted_recorded_llm_calls"] += sum(
                item["recorded_model_calls"] for item in interrupted
                if isinstance(item["recorded_model_calls"], int)
            )
            summary["interrupted_runs_with_unknown_call_count"] += sum(
                item["recorded_model_calls"] is None for item in interrupted
            )
            save()
            print(f"[{index}/{len(ids)}] {ident}", flush=True)
            if not directory.exists():
                operation.run(child_args(args, ident, directory, False))
            result = verify_child(directory, ident, frozen, False)
            summary["results"].append(result)
            summary["completed_count"] = index
            summary["real_llm_calls"] += result["real_llm_calls"]
            summary["hidden_evaluation_count"] += result["hidden_evaluation_count"]
            save()
        summary.update(status="completed", active_operation=None,
                       accepted_count=sum(row["method_accepted"] for row in summary["results"]),
                       hidden_passed_count=sum(row["hidden_passed"] for row in summary["results"]))
        return summary
    except Exception as error:
        summary.update(status="invalid-or-incomplete", error=str(error))
        raise
    finally:
        save()


def parser():
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--output-dir", required=True)
    result.add_argument("--model", default="gpt-5.5", choices=operation.rq1.ALL_MODELS)
    result.add_argument("--limit", type=int, default=0,
                        help="First N operations for a pilot; 0 means all 114")
    result.add_argument("--prepare-only", action="store_true")
    result.add_argument("--resume", action="store_true")
    result.add_argument("--next-base-url", default="http://127.0.0.1:3000")
    result.add_argument("--next-read-timeout", type=float, default=600)
    return result


if __name__ == "__main__":
    print(json.dumps(run(parser().parse_args()), ensure_ascii=False, indent=2))
