#!/usr/bin/env python3
"""Model solves a source-linked task plan without precomputed OCL answers."""
import argparse
import hashlib
import json
import os
import subprocess
from pathlib import Path

import run_rq1_validity_experiments as rq1
from oracle_suite_lock import verify_lock
from constraint_oracle_profile import ADJUDICATED_INPUT, ADJUDICATED_PROFILE, PROFILES, suite_identity


def write_json(path, value):
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def run(args):
    root = rq1.repo_root()
    source = Path(args.input).resolve()
    output = Path(args.output_dir).resolve()
    release_profile_path = getattr(args, "release_profile", None)
    release_profile_hash = None
    if release_profile_path:
        from rm2pt_v4_release_profile import verify_profile
        release_profile, release_profile_hash = verify_profile(release_profile_path)
        if args.development_behavior or source != (root / release_profile["input"]).resolve():
            raise ValueError("Formal release requires the frozen v4 input and no development validator")
        if args.oracle_profile != release_profile["oracle_profile"] or args.max_attempts != 5:
            raise ValueError("Formal release Oracle or generation budget differs from the lock")
    if output.exists():
        raise ValueError("Use a new output directory; existing evidence is never overwritten")
    if not 1 <= args.max_attempts <= 5:
        raise ValueError("max-attempts must be between 1 and 5")
    rows = rq1.read_jsonl(source)
    matching = [row for row in rows if row["id"] == args.operation_id]
    if len(matching) != 1:
        raise ValueError("Select exactly one operation from the supplied input")
    operation = matching[0]
    oracle = suite_identity(root, source, args.oracle_profile)
    inspect_args = [
        "node", "--import", "tsx", "scripts/inspect_constraint_task_plan.ts",
        "--input", str(source), "--operation-id", args.operation_id,
        "--oracle-profile", args.oracle_profile,
    ]
    inspected = subprocess.run(inspect_args, cwd=root, capture_output=True, text=True, encoding="utf-8", check=True)
    prepared = json.loads(inspected.stdout)
    evaluation = prepared.get("evaluation")
    if not evaluation or evaluation.get("profile") != args.oracle_profile:
        raise ValueError("Preflight did not verify the selected Oracle profile")
    revision, lock_hash = oracle["revision"], oracle["lock_sha256"]
    version, fingerprint = rq1.development_repair_protocol_fingerprint()
    output.mkdir(parents=True)
    write_json(output / "planning.json", prepared)
    summary = {
        "operation_id": args.operation_id, "model": args.model,
        "input_sha256": prepared["inputSha256"], "plan_hash": prepared["plan"]["hash"],
        "solver_prompt_version": prepared["solverPromptVersion"],
        "solver_prompt_hash": prepared["solverPromptHash"],
        "implementation_hash": fingerprint, "oracle_revision": revision, "oracle_lock_hash": lock_hash,
        "oracle_profile": args.oracle_profile, "oracle_binding": evaluation,
        "role": "formal-constraint-guided-evaluation" if release_profile_hash else oracle["role"],
        "formal_experiment_ready": bool(release_profile_hash),
        "release_profile_sha256": release_profile_hash,
        "evaluation_ready": evaluation.get("ready") is True,
        "development_behavior_enabled": args.development_behavior,
        "max_generation_attempts": args.max_attempts,
        "provenance": "program-issued-constraints-model-solved-expressions",
        "real_llm_calls": 0,
        "hidden_evaluation_count": 0, "method_accepted": False,
    }
    try:
        if args.prepare_only:
            summary["status"] = "prepared-only"
            return summary
        if not summary["evaluation_ready"]:
            raise ValueError("No prepared Oracle for this operation; no historical fallback or model call is allowed")
        if args.development_behavior and args.operation_id not in rq1.registered_development_operation_ids():
            raise ValueError("No development validator registered; do not imply development coverage for this operation")
        rq1.load_env_file(root / ".env")
        key = os.environ.get("OPENAI_API_KEY", "")
        if not key:
            raise ValueError("OPENAI_API_KEY is required; this solver has no automatic answer-completion path")
        rq1.check_next_server(args.next_base_url)
        summary["real_llm_calls"] = None
        raw, metadata = rq1.call_next_generate_ndjson(
            args.next_base_url, key, operation["project"], operation["useCase"], operation["operation_name"],
            args.model, operation["description"], args.next_read_timeout,
            feedback_mode="full", max_generation_attempts=args.max_attempts,
            context_strategy="full", oracle_profile=args.oracle_profile, model_grounding=True,
            development_behavior=args.development_behavior, constraint_solving=True,
        )
        (output / "events.ndjson").write_text(raw + "\n", encoding="utf-8")
        write_json(output / "metadata.json", metadata)
        events = [json.loads(line) for line in raw.splitlines() if line.strip()]
        generated = [event["OCL Generator"] for event in events if "OCL Generator" in event]
        hidden = [event["Test Result"] for event in events if "Test Result" in event]
        traces = [node.get("generationRequestTrace") for node in generated]
        audits = [node.get("taskSolutionAudit") for node in generated]
        for filename, records in (("request_messages.jsonl", traces), ("proposal_audit.jsonl", audits)):
            (output / filename).write_text("".join(json.dumps(record, ensure_ascii=False) + "\n" for record in records), encoding="utf-8")
        summary.update(real_llm_calls=len(generated), hidden_evaluation_count=len(hidden))
        if metadata.get("http_error") or metadata.get("stream_incomplete") or any("Pipeline Error" in event for event in events):
            raise RuntimeError("Pipeline or infrastructure failure; inspect the preserved events and metadata")
        actual = metadata.get("input_metadata") or {}
        for field in ("inputHash", "requirementHash", "contextHash", "constraintTaskPlanHash", "constraintPolicyHash"):
            if actual.get(field) != prepared["inputMetadata"].get(field):
                raise RuntimeError(f"Server/preflight mismatch for {field}; restart the service")
        prompt = metadata.get("prompt_metadata") or {}
        if prompt.get("version") != prepared["solverPromptVersion"] or prompt.get("hash") != prepared["solverPromptHash"]:
            raise RuntimeError("Server is not using the current constraint-solving prompt")
        protocol = metadata.get("repair_protocol") or {}
        if release_profile_path and protocol.get("implementationFingerprint") != fingerprint:
            raise RuntimeError("Server implementation differs from the frozen formal release; restart the service")
        if args.development_behavior and (protocol.get("version") != version or protocol.get("fingerprint") != fingerprint):
            raise RuntimeError("Server/preflight implementation mismatch; restart the service")
        if protocol.get("hiddenEvaluationFeedback") is not False:
            raise RuntimeError("Hidden evaluation feedback boundary was not recorded")
        if not 1 <= len(generated) <= args.max_attempts or len(hidden) > 1:
            raise RuntimeError("Model budget or terminal evaluation boundary violated")
        for node, trace, audit in zip(generated, traces, audits):
            if not trace or not audit or audit.get("actualLlmCalls") != 1 or "proposal" not in audit:
                raise RuntimeError("Missing actual model request/proposal evidence")
            if audit.get("planHash") != summary["plan_hash"] or audit.get("requestMessagesHash") != trace.get("messagesHash"):
                raise RuntimeError("Proposal audit does not belong to its immutable task plan and request")
            if node.get("semanticContractPlan") or node.get("planExecution"):
                raise RuntimeError("Target-expression execution must not replace constraint solving")
        if generated[-1].get("generationCount") != len(generated):
            raise RuntimeError("Shared generation count disagrees with actual model calls")
        after = json.loads(subprocess.run(inspect_args, cwd=root, capture_output=True,
            text=True, encoding="utf-8", check=True).stdout)
        if release_profile_path:
            from rm2pt_v4_release_profile import verify_profile
            _, after_release_hash = verify_profile(release_profile_path)
            if after_release_hash != release_profile_hash:
                raise RuntimeError("Formal release profile changed during the run")
        if (suite_identity(root, source, args.oracle_profile) != oracle
                or after.get("evaluation") != evaluation
                or after.get("inputMetadata") != prepared.get("inputMetadata")
                or after.get("solverPromptHash") != prepared.get("solverPromptHash")
                or hashlib.sha256(source.read_bytes()).hexdigest() != summary["input_sha256"]):
            raise RuntimeError("Input or Oracle changed during the run")
        summary.update(
            status="evaluated" if hidden else "validation-stopped",
            protocol_accepted=(audits[-1] or {}).get("protocolAccepted") is True,
            hidden_passed=bool(hidden and (hidden[-1].get("result") or {}).get("success") is True),
            method_accepted=bool(hidden and hidden[-1].get("methodAccepted") is True),
            semantic_evidence_scope="development-and-terminal-scenarios" if args.development_behavior else "terminal-scenarios-only",
        )
        return summary
    except Exception as error:
        summary.update(status="invalid-or-incomplete", error=str(error))
        raise
    finally:
        write_json(output / "summary.json", summary)


def parser():
    result = argparse.ArgumentParser(description=__doc__)
    result.add_argument("--input", default=ADJUDICATED_INPUT)
    result.add_argument("--oracle-profile", choices=PROFILES, default=ADJUDICATED_PROFILE)
    result.add_argument("--operation-id", required=True)
    result.add_argument("--output-dir", required=True)
    result.add_argument("--model", default="gpt-5.5", choices=rq1.ALL_MODELS)
    result.add_argument("--max-attempts", type=int, default=5)
    result.add_argument("--development-behavior", action=argparse.BooleanOptionalAction, default=True)
    result.add_argument("--release-profile", default="")
    result.add_argument("--prepare-only", action="store_true")
    result.add_argument("--next-base-url", default="http://127.0.0.1:3000")
    result.add_argument("--next-read-timeout", type=float, default=600)
    return result


if __name__ == "__main__":
    print(json.dumps(run(parser().parse_args()), ensure_ascii=False, indent=2))
