#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CodexPrompt-style transfer baseline for operation-level OCL contracts.

This script intentionally uses a weaker prompt than run_baseline_llm_only.py:
- no Contract Gen agents
- no validation feedback
- no project-specific transformation-rule block
- no JSON schema requirement by default

It tests how a statement-level CodexPrompt-like generation style transfers to
full operation-contract generation on this project's 114-operation benchmark.
Generated artifacts are evaluated with the same REMODEL parser and optional
OCLTSVM/Jest endpoint used by the other baselines.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import run_baseline_llm_only as base


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
    """Lightly adapt common standard-OCL spellings to this project's REMODEL dialect."""
    out = (expr or "").strip()
    out = re.sub(r"\.allInstances\s*\(\s*\)", ".allInstance()", out, flags=re.IGNORECASE)
    out = re.sub(r"\btrue\b", "true", out, flags=re.IGNORECASE)
    out = re.sub(r"\bfalse\b", "false", out, flags=re.IGNORECASE)
    out = re.sub(r"\bnull\b", "null", out, flags=re.IGNORECASE)
    # USE/OCL examples often place @pre after a full operation call. REMODEL
    # supports @pre on property calls, so keep the expression but remove cases
    # the local parser cannot attach, allowing the parser to expose remaining
    # real expression-level incompatibilities.
    out = re.sub(r"(\.allInstance\(\))@pre", r"\1", out)
    out = re.sub(r"(->size\(\))@pre", r"\1", out)
    return out


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
    }


def build_codex_prompt(op: Dict[str, Any], style: str) -> str:
    """Build a CodexPrompt-like prompt without Contract Gen rules."""
    model_context = op.get("model_context") or ""
    operation_signature = op.get("operation_signature") or ""
    description = op.get("description") or ""
    service = op.get("service") or "Service"
    operation_name = op.get("operation_name") or op.get("operation") or "operation"

    if style == "statement":
        return f"""You are an expert in Object Constraint Language (OCL).
Given the UML model context and the natural-language requirement, generate the corresponding OCL constraint.

Return only one OCL expression. Do not explain the answer.

Model context:
{model_context}

Operation:
{service}::{operation_signature or operation_name}

Requirement:
{description}
"""

    return f"""You are an expert in Object Constraint Language (OCL).
Given the UML model context and the natural-language operation requirement, generate the corresponding OCL operation contract.

Return only the OCL contract. Do not explain the answer.

Model context:
{model_context}

Operation:
{service}::{operation_signature or operation_name}

Requirement:
{description}
"""


def extract_codex_prompt_output(raw: str, op: Dict[str, Any], style: str) -> Dict[str, Any]:
    """Normalize CodexPrompt-style output into a contract when possible."""
    text = strip_fences(raw)

    # Some models still return JSON; accept it but do not require it.
    json_obj = base.parse_json_from_llm(text)
    if json_obj and ("precondition" in json_obj or "postcondition" in json_obj):
        ext = base.extract_contract_text(text, op)
        ext["precondition"] = normalize_remodel_dialect(ext.get("precondition") or "")
        ext["postcondition"] = normalize_remodel_dialect(ext.get("postcondition") or "")
        ext["contract"] = base.wrap_contract(
            op,
            definition=ext.get("definition"),
            precondition=ext.get("precondition") or "",
            postcondition=ext.get("postcondition") or "",
        )
        ext.update(
            {
                "output_shape": "json_sections",
                "statement_wrapped_as_precondition": False,
            }
        )
        return ext

    contract_match = re.search(r"Contract\s+[\s\S]*?\}\s*$", text, re.IGNORECASE)
    if contract_match:
        original_contract = contract_match.group(0).strip()
        sections = parse_contract_sections(original_contract)
        precondition = normalize_remodel_dialect(sections.get("precondition") or "")
        postcondition = normalize_remodel_dialect(sections.get("postcondition") or "")
        contract = base.wrap_contract(
            op,
            definition=sections.get("definition"),
            precondition=precondition,
            postcondition=postcondition,
        )
        return {
            "contract": contract,
            "definition": sections.get("definition"),
            "precondition": precondition,
            "postcondition": postcondition,
            "json_parsed": False,
            "extraction_ok": True,
            "output_shape": "contract",
            "statement_wrapped_as_precondition": False,
        }

    standard = parse_standard_context_contract(text, op)
    if standard:
        return standard

    # Statement-level transfer mode: preserve the expression and wrap it as a
    # precondition so it can be passed through the same parser. This is expected
    # to expose the granularity mismatch with operation-level contracts.
    expr = text.strip()
    if style == "statement" and expr:
        expr = normalize_remodel_dialect(expr)
        postcondition = "result = true" if (op.get("return_type") or "").strip() == "Boolean" else ""
        contract = base.wrap_contract(
            op,
            definition=None,
            precondition=expr,
            postcondition=postcondition,
        )
        return {
            "contract": contract,
            "definition": None,
            "precondition": expr,
            "postcondition": postcondition,
            "json_parsed": False,
            "extraction_ok": True,
            "output_shape": "statement_expression",
            "statement_wrapped_as_precondition": True,
        }

    return {
        "contract": "",
        "definition": None,
        "precondition": "",
        "postcondition": "",
        "json_parsed": False,
        "extraction_ok": False,
        "output_shape": "unrecognized",
        "statement_wrapped_as_precondition": False,
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
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="CodexPrompt-style OCL baseline.")
    parser.add_argument("--input", default="data/operations.jsonl")
    parser.add_argument("--output-dir", default="results/codex_prompt_style")
    parser.add_argument("--models", default="gpt-5.4", type=parse_models)
    parser.add_argument("--prompt-style", choices=["contract", "statement"], default="contract")
    parser.add_argument("--max-attempts", type=int, default=5)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--max-tokens", type=int, default=2048)
    parser.add_argument("--http-timeout", type=float, default=120.0)
    parser.add_argument("--sleep-between-calls", type=float, default=1.0)
    parser.add_argument(
        "--validate-cmd",
        default="",
        help='External validator with {input_file}, e.g. npx tsx script/validate-remodel-contract.ts {input_file}',
    )
    parser.add_argument("--parser-use-shell", action="store_true")
    parser.add_argument("--parser-timeout", type=int, default=60)
    parser.add_argument(
        "--eval-next-base-url",
        default="",
        help="Optional Next.js app origin for execution-grounded validation via /api/evaluate-contract.",
    )
    parser.add_argument("--eval-timeout", type=float, default=600.0)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--analyze-only", action="store_true")
    args = parser.parse_args()

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
                except json.JSONDecodeError:
                    continue
                op = base.safe_operation(row, line_no)
                if op:
                    operations.append(op)
    if args.limit > 0:
        operations = operations[: args.limit]

    if args.analyze_only:
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
        for fp in [attempts_path, output_dir / "summary.json"]:
            if fp.exists():
                fp.unlink()
        for csv_path in output_dir.glob("baseline_*.csv"):
            csv_path.unlink()

    validate_cmd = args.validate_cmd.strip() or None
    eval_base_url = args.eval_next_base_url.strip()
    require_execution_success = bool(eval_base_url)
    existing = base.read_jsonl(attempts_path)
    done_success: Set[Tuple[str, str]] = set()
    for row in existing:
        ok = row.get("execution_valid") if require_execution_success else row.get("syntax_valid")
        if ok:
            done_success.add((row["operation_id"], row["model"]))

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
            for attempt in range(start_att, args.max_attempts + 1):
                if (oid, model) in done_success:
                    break
                started = time.perf_counter()
                error_type = ""
                raw = ""
                try:
                    raw = base.call_llm(
                        model,
                        prompt,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                        timeout=args.http_timeout,
                    )
                except Exception:
                    logging.exception("LLM failed op=%s model=%s att=%s", oid, model, attempt)
                    error_type = "llm_api_error"

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
                if eval_base_url and validation.get("syntax_valid"):
                    eval_result = base.evaluate_contract_with_next(
                        eval_base_url,
                        op,
                        contract,
                        ext,
                        args.eval_timeout,
                    )

                record = {
                    "experiment": "codex_prompt_style_baseline",
                    "prompt_style": args.prompt_style,
                    "operation_id": oid,
                    "case_study": op["case_study"],
                    "project": op.get("project", ""),
                    "useCase": op.get("useCase", ""),
                    "operation": op.get("operation", ""),
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
                    **validation,
                    **eval_result,
                    "error_type": error_type,
                    "latency_sec": round(time.perf_counter() - started, 4),
                    "timestamp": base.utc_now_iso(),
                }
                if not record["error_type"] and not record.get("syntax_valid"):
                    record["error_type"] = "syntax_invalid"
                if (
                    not record["error_type"]
                    and not record.get("execution_eval_skipped", True)
                    and not record.get("execution_valid")
                ):
                    record["error_type"] = "execution_invalid"

                base.append_jsonl(attempts_path, record)
                existing.append(record)
                if record.get("execution_valid") if require_execution_success else record.get("syntax_valid"):
                    done_success.add((oid, model))
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
