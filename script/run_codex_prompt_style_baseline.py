#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""UML-enriched zero-shot CodexPrompt-style transfer baseline.

The source study used prefix prompts containing a task description, natural-
language specification, optional UML information, and an ``OCL:`` completion
prefix. This adaptation uses its UML-enriched zero-shot design, but changes the
target artifact from one OCL constraint to one complete operation contract.
It is therefore a transfer baseline, not an exact rerun of the original system.

Every operation-model pair receives exactly K independent generations. The
common OCLTSVM/Jest pipeline is post-hoc only: it supplies no feedback and never
changes or terminates the fixed sampling schedule.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import run_baseline_llm_only as base

CODEX_PROMPT_VERSION = "codexprompt-uml-zero-shot-contract-transfer-v3"
CODEX_PROTOCOL_VERSION = "codexprompt-fixed-independent-sampling-v1"
CODEX_SOURCE_DOI = "10.1109/MSR59073.2023.00033"
CODEX_DATASET_DOI = "10.5281/zenodo.7749795"


def comment_prefix_block(text: str) -> str:
    """Render source material as the comment-prefixed CodexPrompt input."""
    return "\n".join(f"// {line}" if line else "//" for line in (text or "").splitlines())


def strip_fences(text: str) -> str:
    text = (text or "").strip()
    fence = re.search(r"```(?:ocl|json|text)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    return fence.group(1).strip() if fence else text


def parse_contract_sections(contract: str) -> Dict[str, Optional[str]]:
    sections: Dict[str, Optional[str]] = {
        "definition": None,
        "precondition": "",
        "postcondition": "",
    }
    if not contract:
        return sections
    for name in ("definition", "precondition", "postcondition"):
        others = "|".join(n for n in ("definition", "precondition", "postcondition") if n != name)
        match = re.search(
            rf"{name}\s*:\s*(.*?)(?=\n\s*(?:{others})\s*:|\n\s*\}}|\Z)",
            contract,
            re.IGNORECASE | re.DOTALL,
        )
        if match:
            value = match.group(1).strip()
            sections[name] = value if value else (None if name == "definition" else "")
    return sections


def normalize_remodel_dialect(expr: str) -> str:
    """Preserve the generated expression; wrapper conversion must not repair it."""
    return (expr or "").strip()


def context_matches_operation(context_header: str, op: Dict[str, Any]) -> bool:
    service = re.escape(str(op.get("service") or ""))
    operation = re.escape(str(op.get("operation_name") or op.get("operation") or ""))
    if not service or not operation:
        return False
    return bool(
        re.search(
            rf"\b{service}\s*::\s*{operation}\b",
            context_header,
            re.IGNORECASE,
        )
    )


def collect_standard_ocl_sections(text: str, section_name: str) -> str:
    """Collect standard OCL pre/post sections, including named constraints.

    Standard OCL commonly uses both `pre:` and `pre Name:` forms. The baseline
    should be allowed to emit either form; this helper only groups the clauses
    so the existing REMODEL parser can evaluate the expressions.
    """
    marker_re = re.compile(
        r"(?im)^\s*(pre|post)\b(?:\s+[A-Za-z_][\w]*)?\s*:\s*",
    )
    markers = list(marker_re.finditer(text))
    matches = [
        (idx, marker)
        for idx, marker in enumerate(markers)
        if marker.group(1).lower() == section_name.lower()
    ]
    clauses: List[str] = []
    for marker_idx, match in matches:
        start = match.end()
        end = markers[marker_idx + 1].start() if marker_idx + 1 < len(markers) else len(text)
        clause = text[start:end].strip()
        if clause:
            clauses.append(normalize_remodel_dialect(clause))
    return " and\n".join(clauses)


def parse_standard_context_contract(text: str, op: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Convert standard OCL context/pre/post output into a REMODEL Contract wrapper.

    This is intentionally a shallow wrapper conversion. It does not invent a
    definition section or repair expression semantics, so failures after this
    point still reflect the CodexPrompt-style transfer gap.
    """
    context_match = re.search(
        r"^\s*context\s+([\s\S]*?)(?=\n\s*(?:pre|post)\b(?:\s+[A-Za-z_][\w]*)?\s*:)",
        text,
        re.IGNORECASE,
    )
    if not context_match:
        return None
    if not context_matches_operation(context_match.group(1), op):
        return {
            "contract": "",
            "definition": None,
            "precondition": "",
            "postcondition": "",
            "json_parsed": False,
            "extraction_ok": False,
            "output_shape": "incorrect_standard_context",
            "statement_wrapped_as_precondition": False,
            "context_match": False,
        }

    body = text[context_match.end() :]
    precondition = collect_standard_ocl_sections(body, "pre")
    postcondition = collect_standard_ocl_sections(body, "post")
    if not precondition and not postcondition:
        return None

    contract = base.wrap_contract(
        op,
        definition=None,
        precondition=precondition,
        postcondition=postcondition,
    )
    return {
        "contract": contract,
        "definition": None,
        "precondition": precondition,
        "postcondition": postcondition,
        "json_parsed": False,
        "extraction_ok": True,
        "output_shape": "standard_context_contract",
        "statement_wrapped_as_precondition": False,
        "context_match": True,
    }


def build_codex_prompt(op: Dict[str, Any], style: str) -> str:
    """Adapt the source study's UML-enriched zero-shot prefix prompt."""
    model_context = op.get("model_context") or ""
    operation_signature = op.get("operation_signature") or ""
    description = op.get("description") or ""
    service = op.get("service") or "Service"
    operation_name = op.get("operation_name") or op.get("operation") or "operation"

    if style != "uml-zero-shot-contract":
        raise ValueError(f"Unsupported CodexPrompt transfer style: {style}")
    commented_context = comment_prefix_block(model_context)
    commented_description = comment_prefix_block(description)
    return f"""// This file contains the UML classes and associations of the target model.
// UML model information:
{commented_context}

// The task is to generate an object constraint language (OCL) operation contract according to the given specification.
// The contract must use standard OCL context syntax and contain the required preconditions and postconditions.
// Operation: {service}::{operation_signature or operation_name}
// Specification:
{commented_description}
OCL:
"""


def extract_codex_prompt_output(raw: str, op: Dict[str, Any], style: str) -> Dict[str, Any]:
    """Perform format-only wrapper conversion without repairing expressions."""
    text = strip_fences(raw)

    contract_match = re.search(
        r"Contract\s+([^\s:{]+)\s*::\s*([^\s({]+)[\s\S]*?\}\s*$",
        text,
        re.IGNORECASE,
    )
    if contract_match:
        original_contract = contract_match.group(0).strip()
        generated_context = f"{contract_match.group(1)}::{contract_match.group(2)}"
        if not context_matches_operation(generated_context, op):
            return {
                "contract": "",
                "definition": None,
                "precondition": "",
                "postcondition": "",
                "json_parsed": False,
                "extraction_ok": False,
                "output_shape": "incorrect_contract_context",
                "statement_wrapped_as_precondition": False,
                "context_match": False,
            }
        sections = parse_contract_sections(original_contract)
        precondition = normalize_remodel_dialect(sections.get("precondition") or "")
        postcondition = normalize_remodel_dialect(sections.get("postcondition") or "")
        return {
            "contract": original_contract,
            "definition": sections.get("definition"),
            "precondition": precondition,
            "postcondition": postcondition,
            "json_parsed": False,
            "extraction_ok": True,
            "output_shape": "contract",
            "statement_wrapped_as_precondition": False,
            "context_match": True,
        }

    standard = parse_standard_context_contract(text, op)
    if standard:
        return standard

    return {
        "contract": "",
        "definition": None,
        "precondition": "",
        "postcondition": "",
        "json_parsed": False,
        "extraction_ok": False,
        "output_shape": "unrecognized",
        "statement_wrapped_as_precondition": False,
        "context_match": False,
    }


def parse_models(value: str) -> List[str]:
    return base.parse_models(value)


def rewrite_summary_experiment(output_dir: Path, prompt_style: str) -> None:
    summary_path = output_dir / "summary.json"
    if not summary_path.exists():
        return
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    summary["experiment"] = "codex_prompt_style_baseline"
    summary["prompt_style"] = prompt_style
    summary["treatment"] = "codexprompt_uml_zero_shot_contract_transfer"
    summary["sampling_protocol_version"] = CODEX_PROTOCOL_VERSION
    summary["sampling_protocol"] = {
        "samples_per_operation_model_pair": summary.get("max_attempts"),
        "feedback_to_model": False,
        "validation_guided_early_stopping": False,
        "selection": "post_hoc_valid_at_k_and_pass_at_k",
    }
    summary["source_method"] = {
        "paper_doi": CODEX_SOURCE_DOI,
        "dataset_doi": CODEX_DATASET_DOI,
        "source_prompt_setting": "UML-enriched zero-shot prefix prompt",
        "adaptation": "statement-level constraint to complete operation contract",
        "exact_rerun": False,
        "few_shot_examples": False,
        "oracle_available_to_generator": False,
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="CodexPrompt-style OCL baseline.")
    parser.add_argument("--input", default="data/operations.jsonl")
    parser.add_argument(
        "--output-dir",
        default=f"{base.STUDY_RESULTS_ROOT}/baselines/codexprompt-uml-zero-shot-fixed5",
    )
    parser.add_argument("--models", default="gpt-5.5", type=parse_models)
    parser.add_argument(
        "--prompt-style",
        choices=["uml-zero-shot-contract"],
        default="uml-zero-shot-contract",
    )
    parser.add_argument(
        "--max-attempts",
        type=int,
        default=5,
        help="Fixed number of independent samples per operation-model pair (1-5).",
    )
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--max-tokens", type=int, default=4096)
    parser.add_argument("--http-timeout", type=float, default=120.0)
    parser.add_argument("--sleep-between-calls", type=float, default=1.0)
    parser.add_argument(
        "--validate-cmd",
        default="npx tsx script/validate-remodel-contract.ts {input_file}",
        help='External validator with {input_file}, e.g. npx tsx script/validate-remodel-contract.ts {input_file}',
    )
    parser.add_argument("--parser-use-shell", action="store_true")
    parser.add_argument("--parser-timeout", type=int, default=60)
    parser.add_argument(
        "--eval-next-base-url",
        default=os.environ.get("NEXT_EVAL_BASE_URL", "http://127.0.0.1:3000"),
        help="Required Next.js app origin for common OCLTSVM/Jest post-hoc evaluation.",
    )
    parser.add_argument("--eval-timeout", type=float, default=600.0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--analyze-only", action="store_true")
    args = parser.parse_args()
    if args.max_attempts < 1 or args.max_attempts > 5:
        parser.error("--max-attempts must be between 1 and 5 independent samples")
    if not args.eval_next_base_url.strip():
        parser.error("--eval-next-base-url is required for the frozen CodexPrompt study")

    base.load_env_file(base.repo_root() / ".env")
    output_dir = Path(args.output_dir)
    base.setup_logging(output_dir / "logs")

    attempts_path = output_dir / "attempts.jsonl"
    tmp_dir = output_dir / "_tmp_contracts"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    operations: List[Dict[str, Any]] = []
    input_path = Path(args.input)
    if input_path.exists():
        with input_path.open("r", encoding="utf-8") as handle:
            for line_no, line in enumerate(handle, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ValueError(f"{input_path}:{line_no}: invalid JSON: {exc}") from exc
                op = base.safe_operation(row, line_no)
                if op:
                    operations.append(op)
    if len(operations) != base.EXPECTED_OPERATION_COUNT:
        raise RuntimeError(
            f"Expected {base.EXPECTED_OPERATION_COUNT} canonical operations in {input_path}, "
            f"found {len(operations)}"
        )
    if len({op["id"] for op in operations}) != len(operations):
        raise RuntimeError(f"Duplicate operation ids in {input_path}")
    base.assert_generation_configuration(args.temperature, args.max_tokens)
    if args.limit > 0:
        operations = operations[: args.limit]

    generation_prompt_version = f"{CODEX_PROMPT_VERSION}:{args.prompt_style}"
    existing = base.read_jsonl(attempts_path)
    base.assert_existing_records_match_manifest(
        existing,
        operations,
        generation_prompt_version,
        "text",
        args.temperature,
        args.max_tokens,
        sampling_protocol_version=CODEX_PROTOCOL_VERSION,
        expected_generation_prompt_hashes={
            operation["id"]: base.sha256_text(
                build_codex_prompt(operation, args.prompt_style)
            )
            for operation in operations
        },
        uses_shared_generation_assets=False,
    )

    if args.analyze_only:
        if not attempts_path.is_file():
            raise FileNotFoundError(f"analyze-only requires {attempts_path}")
        if not operations:
            logging.error("analyze-only needs --input with operations")
            sys.exit(1)
        base.write_summary(output_dir, operations, args.models, args.max_attempts)
        rewrite_summary_experiment(output_dir, args.prompt_style)
        logging.info("Wrote summary under %s", output_dir)
        return

    if not operations:
        logging.error("No operations loaded from %s", input_path)
        sys.exit(1)

    if args.force:
        base.assert_force_target_is_current_study(existing)
        for fp in [attempts_path, output_dir / "summary.json"]:
            if fp.exists():
                fp.unlink()
        for csv_path in output_dir.glob("baseline_*.csv"):
            csv_path.unlink()
        existing = []

    validate_cmd = args.validate_cmd.strip() or None
    eval_base_url = args.eval_next_base_url.strip()
    require_execution_success = bool(eval_base_url)

    planned = len(operations) * len(args.models)
    pairs_completed = base.count_completed_pairs(
        operations,
        args.models,
        existing,
        args.max_attempts,
        require_execution_success,
    )
    print(
        f"CodexPrompt-style baseline ({args.prompt_style}): "
        f"{len(operations)} ops x {len(args.models)} models = {planned} pairs"
    )
    if pairs_completed:
        print(
            f"Resuming: {pairs_completed}/{planned} pairs already complete "
            f"({base.format_progress_bar(pairs_completed, planned)})",
            flush=True,
        )

    for op in operations:
        oid = op["id"]
        for model in args.models:
            if base.pair_is_complete(
                oid, model, existing, args.max_attempts, require_execution_success
            ):
                continue
            start_att = (
                max(
                    (
                        int(r["attempt"])
                        for r in existing
                        if r["operation_id"] == oid and r["model"] == model
                    ),
                    default=0,
                )
                + 1
            )
            prompt = build_codex_prompt(op, args.prompt_style)
            messages = [{"role": "user", "content": prompt}]
            for attempt in range(start_att, args.max_attempts + 1):
                started = time.perf_counter()
                error_type = ""
                raw = ""
                try:
                    raw = base.call_llm(
                        model,
                        messages,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                        timeout=args.http_timeout,
                        json_mode=False,
                        stop_sequences=["//"],
                    )
                except Exception as exc:
                    logging.exception("LLM failed op=%s model=%s att=%s", oid, model, attempt)
                    raise RuntimeError(
                        "LLM infrastructure failed; no experimental attempt was consumed "
                        f"(op={oid}, model={model}, attempt={attempt})"
                    ) from exc

                ext = extract_codex_prompt_output(raw, op, args.prompt_style)
                contract = ext["contract"]

                if validate_cmd and contract:
                    safe_oid = re.sub(r"[^\w\-.]", "_", oid)[:100]
                    safe_model = re.sub(r"[^\w\-.]", "_", model)[:60]
                    contract_path = tmp_dir / f"{safe_oid}__{safe_model}__{attempt}.contract"
                    validation = base.validate_contract_file(
                        contract,
                        contract_path,
                        validate_cmd,
                        args.parser_timeout,
                        args.parser_use_shell,
                    )
                elif validate_cmd:
                    validation = {
                        "syntax_valid": False,
                        "validate_skipped": False,
                        "validate_stderr": "empty_contract",
                    }
                else:
                    validation = {
                        "syntax_valid": ext["extraction_ok"],
                        "validate_skipped": True,
                        "validate_stderr": "",
                    }

                if error_type:
                    validation["syntax_valid"] = False
                if not ext["extraction_ok"] and not error_type:
                    error_type = "extraction_failed"

                eval_result: Dict[str, Any] = {
                    "execution_eval_skipped": not bool(eval_base_url),
                    "execution_valid": False,
                }
                if eval_base_url and ext["extraction_ok"]:
                    eval_result = base.evaluate_contract_with_next(
                        eval_base_url,
                        op,
                        contract,
                        ext,
                        args.eval_timeout,
                    )
                base.raise_if_evaluation_infrastructure_error(
                    eval_result, oid, model, attempt
                )
                syntax_valid = (
                    bool(eval_result.get("contract_parse_ok"))
                    if not eval_result.get("execution_eval_skipped")
                    else bool(validation.get("syntax_valid"))
                )
                pre_execution_valid = (
                    syntax_valid
                    and bool(eval_result.get("typescript_generation_ok"))
                    and bool(eval_result.get("typescript_parse_ok"))
                )
                if not ext["extraction_ok"]:
                    validation_stage = "output_extraction"
                    final_error_type = "extraction_failed"
                elif not syntax_valid:
                    validation_stage = "parser"
                    final_error_type = "syntax_invalid"
                elif not bool(eval_result.get("typescript_generation_ok")):
                    validation_stage = "typescript_generator"
                    final_error_type = "typescript_generation_invalid"
                elif not bool(eval_result.get("typescript_parse_ok")):
                    validation_stage = "typescript_parser"
                    final_error_type = "typescript_parse_invalid"
                elif not bool(eval_result.get("test_execution_ok")):
                    validation_stage = "jest"
                    final_error_type = "execution_invalid"
                else:
                    validation_stage = "passed"
                    final_error_type = "none"

                record = {
                    "study_version": base.STUDY_VERSION,
                    "treatment": "codexprompt_style",
                    "experiment": "codex_prompt_style_baseline",
                    "prompt_style": args.prompt_style,
                    "operation_id": oid,
                    "oracle_id": op.get("oracle_id", ""),
                    "requirement_group_id": op.get("requirement_group_id", ""),
                    "case_study": op["case_study"],
                    "project": op.get("project", ""),
                    "useCase": op.get("useCase", ""),
                    "operation": op.get("operation", ""),
                    "has_return_value": op.get("has_return_value", False),
                    "input_schema_version": op.get("input_schema_version", ""),
                    "input_hash": op.get("input_hash", ""),
                    "requirement_hash": op.get("requirement_hash", ""),
                    "context_hash": op.get("context_hash", ""),
                    "shared_prompt_version": op.get("prompt_version", ""),
                    "shared_prompt_hash": op.get("prompt_hash", ""),
                    "generation_prompt_version": (
                        generation_prompt_version
                    ),
                    "generation_prompt_hash": base.sha256_text(prompt),
                    "generation_request_hash": base.sha256_text(
                        json.dumps(messages, ensure_ascii=False, separators=(",", ":"))
                    ),
                    "sampling_protocol": "fixed_independent_samples",
                    "sampling_protocol_version": CODEX_PROTOCOL_VERSION,
                    "source_paper_doi": CODEX_SOURCE_DOI,
                    "source_dataset_doi": CODEX_DATASET_DOI,
                    "source_prompt_setting": "uml_enriched_zero_shot",
                    "exact_source_rerun": False,
                    "oracle_available_to_generator": False,
                    "generation_config_version": base.EXPECTED_GENERATION_CONFIG_VERSION,
                    "generation_config_hash": base.generation_configuration_hash(
                        "text", args.temperature, args.max_tokens
                    ),
                    "generation_grammar_version": "",
                    "generation_grammar_hash": "",
                    "generation_rules_version": "",
                    "generation_rules_hash": "",
                    "generation_output_mode": "text",
                    "generation_temperature": args.temperature,
                    "generation_max_tokens": args.max_tokens,
                    "model": model,
                    "attempt": attempt,
                    "prompt": prompt,
                    "raw_output": raw,
                    "contract": contract,
                    "definition": ext.get("definition"),
                    "precondition": ext.get("precondition"),
                    "postcondition": ext.get("postcondition"),
                    "json_parsed": ext.get("json_parsed", False),
                    "extraction_ok": ext.get("extraction_ok", False),
                    "output_shape": ext.get("output_shape"),
                    "statement_wrapped_as_precondition": ext.get(
                        "statement_wrapped_as_precondition", False
                    ),
                    "context_match": ext.get("context_match", False),
                    **validation,
                    **eval_result,
                    "syntax_valid": syntax_valid,
                    "pre_execution_valid": pre_execution_valid,
                    "external_syntax_valid": bool(validation.get("syntax_valid")),
                    "typescript_valid": bool(eval_result.get("typescript_generation_ok"))
                    and bool(eval_result.get("typescript_parse_ok")),
                    "jest_passed": bool(eval_result.get("test_execution_ok")),
                    "final_pass": bool(eval_result.get("execution_valid")),
                    "validation_stage": validation_stage,
                    "error_type": error_type or final_error_type,
                    "latency_sec": round(time.perf_counter() - started, 4),
                    "timestamp": base.utc_now_iso(),
                }
                base.append_jsonl(attempts_path, record)
                existing.append(record)
                completed = base.count_completed_pairs(
                    operations,
                    args.models,
                    existing,
                    args.max_attempts,
                    require_execution_success,
                )
                base.print_progress(completed, planned, record, max_attempts=args.max_attempts)
                time.sleep(args.sleep_between_calls)

    base.write_summary(output_dir, operations, args.models, args.max_attempts)
    rewrite_summary_experiment(output_dir, args.prompt_style)
    logging.info("Done. Outputs under %s", output_dir)


if __name__ == "__main__":
    main()
