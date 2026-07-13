#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Single-Agent Full-Feedback ablation for RQ3.

This experiment removes ContractGen's staged generation graph while preserving
the rest of the evaluation setting:
- one LLM agent directly generates the complete REMODEL Contract
- same operation inputs, project context, transformation rules, and 5-attempt budget
- same parser, TypeScript generation/compile, and Jest execution evaluator
- full diagnostic feedback from the previous failed contract is fed back to the
  same single agent before the next attempt

It is intentionally separate from the Next/LangGraph ContractGen pipeline so it
does not modify the system under evaluation.
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


def read_project_prompt_assets() -> Dict[str, str]:
    root = base.repo_root()

    def read(path: str) -> str:
        return (root / path).read_text(encoding="utf-8")

    def template_literals(path: str) -> str:
        source = read(path)
        literals = re.findall(r"`((?:\\.|[^`])*)`", source)
        if not literals:
            raise RuntimeError(f"No TypeScript template literals found in {path}")
        return "\n".join(
            value.replace(r"\`", "`").replace(r"\\", "\\") for value in literals
        )

    constants = read("src/app/constant.ts")

    def exported_template(name: str) -> str:
        match = re.search(
            rf"export\s+const\s+{re.escape(name)}\s*=\s*`((?:\\.|[^`])*)`\s*;",
            constants,
            re.DOTALL,
        )
        if not match:
            raise RuntimeError(f"Unable to load {name} from src/app/constant.ts")
        return match.group(1).replace(r"\`", "`").replace(r"\\", "\\").strip()

    return {
        "g4": read("antlr4/REMODEL.g4"),
        "definition": exported_template("whatIsDefination"),
        "precondition": exported_template("whatIsPrecondition"),
        "postcondition": exported_template("whatIsPostcondition"),
        "transform_rules": template_literals(
            "src/app/service/createTransformRulesPrompt.ts"
        ),
        "common_contract_errors": template_literals(
            "src/app/service/createCommonContractErrorPrompt.ts"
        ),
    }


PROJECT_PROMPT_ASSETS = read_project_prompt_assets()


def parse_models(value: str) -> List[str]:
    return base.parse_models(value)


def strip_fences(text: str) -> str:
    text = (text or "").strip()
    fence = re.search(r"```(?:ocl|remodel|text)?\s*([\s\S]*?)```", text, re.IGNORECASE)
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


def extract_full_contract(raw: str) -> Dict[str, Any]:
    text = strip_fences(raw)
    match = re.search(r"Contract\s+[\s\S]*?\}\s*$", text, re.IGNORECASE)
    contract = match.group(0).strip() if match else text.strip()
    if not contract.lower().startswith("contract "):
        return {
            "contract": "",
            "definition": None,
            "precondition": "",
            "postcondition": "",
            "json_parsed": False,
            "extraction_ok": False,
            "output_shape": "unrecognized",
        }
    sections = parse_contract_sections(contract)
    missing_sections = [
        name
        for name in ("definition", "precondition", "postcondition")
        if not re.search(rf"(?im)^\s*{name}\s*:", contract)
    ]
    return {
        "contract": contract,
        "definition": sections.get("definition"),
        "precondition": sections.get("precondition") or "",
        "postcondition": sections.get("postcondition") or "",
        "json_parsed": False,
        "extraction_ok": not missing_sections,
        "missing_sections": missing_sections,
        "output_shape": "full_contract" if not missing_sections else "incomplete_contract",
    }


def build_initial_prompt(op: Dict[str, Any]) -> str:
    params_str = json.dumps(op.get("parameters") or [], ensure_ascii=False)
    return f"""You are a single-agent REMODEL OCL contract generator.

Your task is to directly generate one complete executable REMODEL operation contract.

Do NOT split the work into agents.
Do NOT output only definition/precondition/postcondition JSON.
Do NOT explain your answer.

You must output exactly one complete Contract block in this format:

Contract ServiceName::operationName(param: Type): ReturnType {{
  definition:
    helper: Type = expression
  precondition:
    expression
  postcondition:
    expression
}}

The contract must contain definition, precondition, and postcondition sections.
If no helper variable is needed, keep the definition section empty but still include the section header.

The following grammar and guidance are loaded directly from the same project
sources used by ContractGen's OCL Generator.

ANTLR4 grammar:
{PROJECT_PROMPT_ASSETS["g4"]}

Section guidance:
definition: {PROJECT_PROMPT_ASSETS["definition"]}
precondition: {PROJECT_PROMPT_ASSETS["precondition"]}
postcondition: {PROJECT_PROMPT_ASSETS["postcondition"]}

Transformation rules:
{PROJECT_PROMPT_ASSETS["transform_rules"]}

Common mistakes to avoid:
{PROJECT_PROMPT_ASSETS["common_contract_errors"]}

Operation input:
Case Study: {op["case_study"]}
Project: {op.get("project", "")}
Use Case: {op.get("useCase", "")}
Service: {op["service"]}
Operation Name: {op.get("operation_name") or op.get("operation")}
Operation Signature: {op["operation_signature"]}
Description: {op["description"]}
Parameters: {params_str}
Return Type: {op["return_type"]}

Project Context:
{op["model_context"]}

Return only the complete Contract block.
"""


def concise_json(value: Any, limit: int = 3000) -> str:
    text = json.dumps(value, ensure_ascii=False, indent=2)
    if len(text) <= limit:
        return text
    return text[:limit] + "\n... [truncated]"


def build_feedback(record: Dict[str, Any]) -> str:
    lines = [
        "The previous complete Contract failed validation.",
        "Regenerate the entire complete Contract block from scratch.",
        "Return only the complete Contract block, no explanation.",
        "",
        "Failed contract:",
        record.get("contract") or "[empty or unrecognized contract]",
        "",
        "Diagnostics:",
    ]

    if not record.get("extraction_ok"):
        lines.append("- Stage: extraction")
        missing = record.get("missing_sections") or []
        if missing:
            lines.append(f"- Missing sections: {', '.join(missing)}")
        else:
            lines.append("- Error: the output was not a complete REMODEL Contract block.")
    elif not record.get("syntax_valid"):
        lines.append("- Stage: OCL parser")
        stderr = (record.get("validate_stderr") or "").strip()
        stdout = (record.get("validate_stdout") or "").strip()
        if stderr:
            lines.append(f"- Parser stderr:\n{stderr}")
        if stdout:
            lines.append(f"- Parser stdout:\n{stdout}")
    elif not record.get("execution_eval_skipped", True) and not record.get("execution_valid"):
        if not record.get("contract_parse_ok", True):
            lines.append("- Stage: OCLTSVM contract parser")
            lines.append(f"- Contract errors:\n{concise_json(record.get('contract_errors') or [])}")
        elif not record.get("typescript_generation_ok", True):
            lines.append("- Stage: TypeScript generation")
            lines.append(f"- TypeScript generation error: {record.get('typescript_generation_error') or ''}")
        elif not record.get("typescript_parse_ok", True):
            lines.append("- Stage: TypeScript compile")
            lines.append(f"- TypeScript errors:\n{concise_json(record.get('typescript_errors') or [])}")
        elif not record.get("test_execution_ok", True):
            lines.append("- Stage: Jest execution")
            lines.append(f"- Execution error: {record.get('test_execution_error') or ''}")
            lines.append(f"- Passing tests: {record.get('test_passing_count', 0)}")
            lines.append(f"- Failing tests: {record.get('test_failing_count', 0)}")
        else:
            lines.append("- Stage: execution-grounded validation")
            lines.append(f"- Error: {record.get('execution_eval_error') or 'execution did not pass'}")
    else:
        lines.append(f"- Stage: {record.get('error_type') or 'unknown'}")
        lines.append("- Error: validation failed.")

    return "\n".join(lines)


def rewrite_summary(output_dir: Path) -> None:
    summary_path = output_dir / "summary.json"
    if not summary_path.exists():
        return
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    summary["experiment"] = "single_agent_full_feedback_ablation"
    summary["variant"] = {
        "staged_agent": False,
        "direct_full_contract_generation": True,
        "feedback": "full_diagnostic",
        "prompt_sources": [
            "antlr4/REMODEL.g4",
            "src/app/constant.ts",
            "src/app/service/createTransformRulesPrompt.ts",
            "src/app/service/createCommonContractErrorPrompt.ts",
            "operations.jsonl:model_context",
        ],
        "infrastructure_errors_consume_attempt_budget": False,
        "description": "One LLM directly generates the complete REMODEL Contract and receives full diagnostics after failed validation.",
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def load_operations(path: Path, limit: int) -> List[Dict[str, Any]]:
    operations: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as handle:
        for line_no, line in enumerate(handle, 1):
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                logging.warning("line %s: invalid JSON, skipped", line_no)
                continue
            op = base.safe_operation(row, line_no)
            if op:
                operations.append(op)
    if limit > 0:
        operations = operations[:limit]
    return operations


def main() -> None:
    parser = argparse.ArgumentParser(description="RQ3 Single-Agent Full-Feedback ablation.")
    parser.add_argument("--input", default="data/operations.jsonl")
    parser.add_argument("--output-dir", default="results/rq3_ablation_single_agent_full_feedback")
    parser.add_argument("--models", default="gpt-5.4", type=parse_models)
    parser.add_argument("--max-attempts", type=int, default=5)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--max-tokens", type=int, default=4096)
    parser.add_argument("--http-timeout", type=float, default=600.0)
    parser.add_argument("--sleep-between-calls", type=float, default=1.0)
    parser.add_argument(
        "--validate-cmd",
        default="",
        help='External REMODEL parser command with {input_file}.',
    )
    parser.add_argument("--parser-use-shell", action="store_true")
    parser.add_argument("--parser-timeout", type=int, default=60)
    parser.add_argument("--eval-next-base-url", default="")
    parser.add_argument("--eval-timeout", type=float, default=600.0)
    parser.add_argument(
        "--max-infrastructure-retries",
        type=int,
        default=5,
        help="Retries for API/network failures; these do not consume the generation budget.",
    )
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--analyze-only", action="store_true")
    args = parser.parse_args()
    if args.max_attempts < 1:
        parser.error("--max-attempts must be at least 1")
    if args.max_infrastructure_retries < 1:
        parser.error("--max-infrastructure-retries must be at least 1")

    base.load_env_file(base.repo_root() / ".env")
    output_dir = Path(args.output_dir)
    base.setup_logging(output_dir / "logs")
    attempts_path = output_dir / "attempts.jsonl"
    infrastructure_errors_path = output_dir / "infrastructure_errors.jsonl"
    tmp_dir = output_dir / "_tmp_contracts"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    operations = load_operations(Path(args.input), args.limit)
    if not operations:
        logging.error("No operations loaded from %s", args.input)
        sys.exit(1)

    if args.analyze_only:
        base.write_summary(output_dir, operations, args.models, args.max_attempts)
        rewrite_summary(output_dir)
        logging.info("Wrote summary under %s", output_dir)
        return

    if args.force:
        for fp in [attempts_path, infrastructure_errors_path, output_dir / "summary.json"]:
            if fp.exists():
                fp.unlink()
        for csv_path in output_dir.glob("baseline_*.csv"):
            csv_path.unlink()

    existing = base.read_jsonl(attempts_path)
    validate_cmd = args.validate_cmd.strip() or None
    eval_next_base_url = args.eval_next_base_url.strip()
    require_execution_success = bool(eval_next_base_url)
    planned = len(operations) * len(args.models)
    completed = base.count_completed_pairs(
        operations,
        args.models,
        existing,
        args.max_attempts,
        require_execution_success,
    )
    print(
        f"Single-Agent Full-Feedback: {len(operations)} ops x {len(args.models)} models = {planned} pairs",
        flush=True,
    )
    if completed:
        print(
            f"Resuming: {completed}/{planned} pairs already complete "
            f"({base.format_progress_bar(completed, planned)})",
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
                        if r.get("operation_id") == oid and r.get("model") == model
                    ),
                    default=0,
                )
                + 1
            )
            initial_prompt = build_initial_prompt(op)
            previous = [
                r
                for r in existing
                if r.get("operation_id") == oid and r.get("model") == model
            ]
            last_record = max(previous, key=lambda r: int(r["attempt"]), default=None)

            for att in range(start_att, args.max_attempts + 1):
                started = time.perf_counter()
                feedback = build_feedback(last_record) if last_record else ""
                prompt = initial_prompt if not feedback else initial_prompt + "\n\n" + feedback
                raw: Optional[str] = None
                for infrastructure_try in range(1, args.max_infrastructure_retries + 1):
                    try:
                        raw = base.call_llm(
                            model,
                            prompt,
                            temperature=args.temperature,
                            max_tokens=args.max_tokens,
                            timeout=args.http_timeout,
                        )
                        break
                    except Exception as exc:
                        logging.exception(
                            "LLM infrastructure failure op=%s model=%s att=%s retry=%s/%s",
                            oid,
                            model,
                            att,
                            infrastructure_try,
                            args.max_infrastructure_retries,
                        )
                        base.append_jsonl(
                            infrastructure_errors_path,
                            {
                                "operation_id": oid,
                                "model": model,
                                "attempt": att,
                                "infrastructure_retry": infrastructure_try,
                                "error_type": "llm_api_error",
                                "error": str(exc),
                                "timestamp": base.utc_now_iso(),
                            },
                        )
                        if infrastructure_try < args.max_infrastructure_retries:
                            time.sleep(args.sleep_between_calls)
                if raw is None:
                    raise RuntimeError(
                        f"LLM API remained unavailable after "
                        f"{args.max_infrastructure_retries} infrastructure retries "
                        f"(op={oid}, model={model}, attempt={att}). "
                        "No experimental attempt was consumed; rerun to resume."
                    )

                ext = extract_full_contract(raw)
                contract = ext["contract"]

                if validate_cmd and ext["extraction_ok"]:
                    safe_oid = re.sub(r"[^\w\-.]", "_", oid)[:100]
                    safe_model = re.sub(r"[^\w\-.]", "_", model)[:60]
                    contract_path = tmp_dir / f"{safe_oid}__{safe_model}__{att}.contract"
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
                        "validate_stderr": (
                            "incomplete_contract_sections"
                            if contract
                            else "empty_contract"
                        ),
                    }
                else:
                    validation = {
                        "syntax_valid": ext["extraction_ok"],
                        "validate_skipped": True,
                        "validate_stderr": "",
                    }

                error_type = "extraction_failed" if not ext["extraction_ok"] else ""

                eval_res: Dict[str, Any] = {
                    "execution_eval_skipped": not bool(eval_next_base_url),
                    "execution_valid": False,
                }
                if (
                    eval_next_base_url
                    and ext["extraction_ok"]
                    and validation.get("syntax_valid")
                ):
                    eval_res = base.evaluate_contract_with_next(
                        eval_next_base_url,
                        op,
                        contract,
                        ext,
                        args.eval_timeout,
                    )

                rec = {
                    "experiment": "single_agent_full_feedback_ablation",
                    "operation_id": oid,
                    "case_study": op["case_study"],
                    "project": op.get("project", ""),
                    "useCase": op.get("useCase", ""),
                    "operation": op.get("operation", ""),
                    "model": model,
                    "attempt": att,
                    "prompt": prompt,
                    "feedback": feedback,
                    "raw_output": raw,
                    "contract": contract,
                    "definition": ext.get("definition"),
                    "precondition": ext.get("precondition"),
                    "postcondition": ext.get("postcondition"),
                    "json_parsed": ext.get("json_parsed", False),
                    "extraction_ok": ext.get("extraction_ok", False),
                    "missing_sections": ext.get("missing_sections") or [],
                    "output_shape": ext.get("output_shape"),
                    "syntax_valid": bool(validation.get("syntax_valid")),
                    **validation,
                    "execution_valid": bool(eval_res.get("execution_valid")),
                    **eval_res,
                    "error_type": error_type,
                    "latency_sec": round(time.perf_counter() - started, 4),
                    "timestamp": base.utc_now_iso(),
                }
                if not rec["error_type"] and not rec.get("syntax_valid"):
                    rec["error_type"] = "syntax_invalid"
                if (
                    not rec["error_type"]
                    and not rec.get("execution_eval_skipped", True)
                    and not rec.get("execution_valid")
                ):
                    rec["error_type"] = "execution_invalid"

                base.append_jsonl(attempts_path, rec)
                existing.append(rec)
                last_record = rec
                completed = base.count_completed_pairs(
                    operations,
                    args.models,
                    existing,
                    args.max_attempts,
                    require_execution_success,
                )
                base.print_progress(completed, planned, rec, max_attempts=args.max_attempts)

                success = rec["execution_valid"] if require_execution_success else rec["syntax_valid"]
                if success:
                    break
                time.sleep(args.sleep_between_calls)

    base.write_summary(output_dir, operations, args.models, args.max_attempts)
    rewrite_summary(output_dir)
    logging.info("Done. Results: %s", output_dir.resolve())


if __name__ == "__main__":
    main()
