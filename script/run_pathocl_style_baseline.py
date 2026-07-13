#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PathOCL-style transfer baseline for operation-level OCL contracts.

This script implements a path-based prompt-augmentation baseline:
- no Contract Gen agents
- no validation feedback
- no REMODEL transformation-rule block
- selected entity/attribute/relationship paths instead of full model_context

It is a transfer baseline inspired by PathOCL's path-based context selection,
adapted to this project's operation-level contract benchmark and evaluated
with the same REMODEL parser and optional OCLTSVM/Jest endpoint.
"""

from __future__ import annotations

import argparse
import json
import logging
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import run_baseline_llm_only as base
import run_codex_prompt_style_baseline as codex_style


@dataclass
class Attribute:
    name: str
    type_name: str
    description: str = ""


@dataclass
class Relationship:
    name: str
    type_name: str
    description: str = ""


@dataclass
class Entity:
    name: str
    attributes: List[Attribute] = field(default_factory=list)
    relationships: List[Relationship] = field(default_factory=list)


STOPWORDS = {
    "the",
    "and",
    "or",
    "for",
    "with",
    "from",
    "into",
    "when",
    "then",
    "this",
    "that",
    "new",
    "old",
    "system",
    "operation",
    "definition",
    "precondition",
    "postcondition",
    "description",
    "name",
    "id",
    "identifier",
    "unique",
    "value",
    "values",
    "information",
    "data",
    "record",
    "records",
    "created",
    "updated",
    "deleted",
    "selected",
    "given",
    "returns",
    "return",
    "true",
    "false",
}


def words(text: str) -> Set[str]:
    return {
        token.lower()
        for token in re.findall(r"[A-Za-z][A-Za-z0-9_]*", text or "")
        if len(token) > 1 and token.lower() not in STOPWORDS
    }


def split_camel(name: str) -> Set[str]:
    spaced = re.sub(r"([a-z0-9])([A-Z])", r"\1 \2", name or "")
    return words(spaced.replace("_", " "))


def parse_model_context(text: str) -> Dict[str, Entity]:
    entities: Dict[str, Entity] = {}
    current: Optional[Entity] = None
    section: Optional[str] = None
    pending_name: Optional[str] = None
    pending_type: Optional[str] = None
    pending_description: str = ""

    def flush_pending() -> None:
        nonlocal pending_name, pending_type, pending_description
        if not current or not section or not pending_name:
            pending_name = None
            pending_type = None
            pending_description = ""
            return
        type_name = pending_type or ""
        if section == "attributes":
            current.attributes.append(Attribute(pending_name, type_name, pending_description))
        elif section == "relationships":
            current.relationships.append(Relationship(pending_name, type_name, pending_description))
        pending_name = None
        pending_type = None
        pending_description = ""

    for raw_line in (text or "").splitlines():
        stripped = raw_line.strip()
        if not stripped:
            continue
        entity_match = re.fullmatch(r"Name:\s*(.+)", stripped)
        if entity_match and raw_line.startswith("    Name:"):
            flush_pending()
            entity_name = entity_match.group(1).strip()
            current = entities.setdefault(entity_name, Entity(entity_name))
            section = None
            continue
        if stripped == "Attributes":
            flush_pending()
            section = "attributes"
            continue
        if stripped == "Relationships":
            flush_pending()
            section = "relationships"
            continue
        item_name_match = re.fullmatch(r"\d+\.Name:\s*(.+)", stripped)
        if item_name_match and current and section:
            flush_pending()
            pending_name = item_name_match.group(1).strip()
            continue
        type_match = re.fullmatch(r"Type:\s*(.+)", stripped)
        if type_match and pending_name:
            pending_type = type_match.group(1).strip()
            continue
        desc_match = re.fullmatch(r"Description:\s*(.+)", stripped)
        if desc_match and pending_name:
            pending_description = desc_match.group(1).strip()
            continue
    flush_pending()
    return entities


def entity_score(entity: Entity, op: Dict[str, Any]) -> int:
    haystack = " ".join(
        [
            op.get("description") or "",
            op.get("operation_signature") or "",
            op.get("operation_name") or "",
            op.get("operation") or "",
            json.dumps(op.get("parameters") or [], ensure_ascii=False),
        ]
    )
    query_words = words(haystack)
    name_words = split_camel(entity.name) | {entity.name.lower()}
    score = 0
    if entity.name.lower() in haystack.lower():
        score += 8
    score += 3 * len(query_words & name_words)
    for attr in entity.attributes:
        attr_words = split_camel(attr.name) | {attr.name.lower()}
        score += len(query_words & attr_words)
        if attr.name.lower() in haystack.lower():
            score += 2
    for rel in entity.relationships:
        target_words = split_camel(re.sub(r"^Set\((.*)\)$", r"\1", rel.type_name))
        rel_words = (split_camel(rel.name) - target_words) | {rel.name.lower()}
        score += len(query_words & rel_words)
        if rel.name.lower() in haystack.lower():
            score += 2
    return score


def select_entities(entities: Dict[str, Entity], op: Dict[str, Any], max_entities: int) -> List[Entity]:
    scored = [(entity_score(entity, op), entity.name, entity) for entity in entities.values()]
    selected = [entity for score, _, entity in sorted(scored, key=lambda x: (-x[0], x[1])) if score >= 3]

    # Add direct operation return type and parameter entity names if present.
    explicit_names = {op.get("return_type", "")}
    for param in op.get("parameters") or []:
        if isinstance(param, dict):
            explicit_names.add(str(param.get("type") or ""))
    for name in list(explicit_names):
        base_name = re.sub(r"^Set\((.*)\)$", r"\1", name)
        if base_name in entities and entities[base_name] not in selected:
            selected.insert(0, entities[base_name])

    # Pull in one-hop relationship targets from selected anchors.
    seen = {e.name for e in selected}
    for entity in list(selected):
        for rel in entity.relationships:
            target = re.sub(r"^Set\((.*)\)$", r"\1", rel.type_name)
            if target in entities and target not in seen:
                selected.append(entities[target])
                seen.add(target)

    if not selected:
        selected = [entity for _, _, entity in sorted(scored, key=lambda x: x[1])]
    return selected[:max_entities]


def build_path_context(op: Dict[str, Any], max_entities: int, max_paths: int) -> str:
    entities = parse_model_context(op.get("model_context") or "")
    selected = select_entities(entities, op, max_entities)
    selected_names = {entity.name for entity in selected}
    lines: List[str] = []
    path_count = 0
    for entity in selected:
        lines.append(f"Entity {entity.name}")
        for attr in entity.attributes:
            if path_count >= max_paths:
                break
            desc = f" -- {attr.description}" if attr.description else ""
            lines.append(f"  {entity.name}.{attr.name} : {attr.type_name}{desc}")
            path_count += 1
        for rel in entity.relationships:
            if path_count >= max_paths:
                break
            target = re.sub(r"^Set\((.*)\)$", r"\1", rel.type_name)
            marker = "selected" if target in selected_names else "external"
            desc = f" -- {rel.description}" if rel.description else ""
            lines.append(f"  {entity.name}.{rel.name} -> {rel.type_name} ({marker}){desc}")
            path_count += 1
        if path_count >= max_paths:
            break
    return "\n".join(lines)


def build_pathocl_prompt(op: Dict[str, Any], max_entities: int, max_paths: int) -> Tuple[str, str]:
    path_context = build_path_context(op, max_entities, max_paths)
    service = op.get("service") or "Service"
    operation_signature = op.get("operation_signature") or op.get("operation_name") or op.get("operation")
    description = op.get("description") or ""
    prompt = f"""You are an expert in Object Constraint Language (OCL).
Given the natural-language requirement and the relevant UML model paths, generate the corresponding OCL operation contract.

Return only the OCL contract. Do not explain the answer.

Operation:
{service}::{operation_signature}

Relevant UML paths:
{path_context}

Requirement:
{description}
"""
    return prompt, path_context


def parse_models(value: str) -> List[str]:
    return base.parse_models(value)


def rewrite_summary(output_dir: Path, max_entities: int, max_paths: int) -> None:
    summary_path = output_dir / "summary.json"
    if not summary_path.exists():
        return
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    summary["experiment"] = "pathocl_style_baseline"
    summary["context_selection"] = {
        "max_entities": max_entities,
        "max_paths": max_paths,
        "mode": "lexical_anchor_plus_one_hop_paths",
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="PathOCL-style path-context OCL baseline.")
    parser.add_argument("--input", default="data/operations.jsonl")
    parser.add_argument("--output-dir", default="results/pathocl_style")
    parser.add_argument("--models", default="gpt-5.4", type=parse_models)
    parser.add_argument("--max-attempts", type=int, default=5)
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--temperature", type=float, default=0.2)
    parser.add_argument("--max-tokens", type=int, default=2048)
    parser.add_argument("--http-timeout", type=float, default=120.0)
    parser.add_argument("--sleep-between-calls", type=float, default=1.0)
    parser.add_argument("--max-path-entities", type=int, default=4)
    parser.add_argument("--max-paths", type=int, default=40)
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
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Continue from an existing attempts.jsonl without deleting previous attempts.",
    )
    parser.add_argument("--analyze-only", action="store_true")
    args = parser.parse_args()

    if args.force and args.resume:
        logging.error("--force and --resume cannot be used together")
        sys.exit(1)

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
        rewrite_summary(output_dir, args.max_path_entities, args.max_paths)
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
        f"PathOCL-style baseline: {len(operations)} ops x {len(args.models)} models = {planned} pairs"
    )
    if pairs_completed:
        print(
            f"Resuming: {pairs_completed}/{planned} pairs already complete "
            f"({base.format_progress_bar(pairs_completed, planned)})",
            flush=True,
        )
    elif args.resume:
        print("Resume requested, but no completed pairs were found in attempts.jsonl.", flush=True)

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
            prompt, path_context = build_pathocl_prompt(op, args.max_path_entities, args.max_paths)
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

                ext = codex_style.extract_codex_prompt_output(raw, op, "contract")
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
                    "experiment": "pathocl_style_baseline",
                    "context_selection": "lexical_anchor_plus_one_hop_paths",
                    "max_path_entities": args.max_path_entities,
                    "max_paths": args.max_paths,
                    "path_context": path_context,
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
    rewrite_summary(output_dir, args.max_path_entities, args.max_paths)
    logging.info("Done. Outputs under %s", output_dir)


if __name__ == "__main__":
    main()
