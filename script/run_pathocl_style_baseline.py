#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PathOCL-style transfer baseline for operation-level OCL contracts.

This script implements a PathOCL-inspired Jaccard top-k transfer baseline:
- no Contract Gen staged generation or validation loop
- no validation feedback
- no REMODEL transformation-rule block
- one independently generated contract for each ranked UML simple-path prompt

It is a transfer baseline inspired by PathOCL's path-based context selection,
adapted to this project's operation-level contract benchmark and evaluated
with the same REMODEL parser and optional OCLTSVM/Jest endpoint.
"""

from __future__ import annotations

import argparse
import json
import logging
import os
import re
import sys
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

import run_baseline_llm_only as base
import run_codex_prompt_style_baseline as codex_style

PATHOCL_PROMPT_VERSION = "pathocl-jaccard-topk-contract-transfer-v4"
PATHOCL_PROTOCOL_VERSION = "pathocl-ranked-path-fixed-budget-v1"
PATHOCL_SOURCE_DOI = "10.1145/3650105.3652290"
PATHOCL_DATASET_DOI = "10.5281/zenodo.10841785"


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
    in_entities = False
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
        if stripped == "Entities":
            flush_pending()
            current = None
            section = None
            in_entities = True
            continue
        if not in_entities:
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


def target_class(type_name: str) -> str:
    return re.sub(r"^Set\((.*)\)$", r"\1", type_name or "")


def generate_simple_paths(entities: Dict[str, Entity]) -> List[Tuple[str, ...]]:
    """Generate every directed simple path, including each class as a path."""
    graph: Dict[str, List[str]] = {name: [] for name in entities}
    for source, entity in entities.items():
        for relationship in entity.relationships:
            target = target_class(relationship.type_name)
            if target in entities and target not in graph[source]:
                graph[source].append(target)
        graph[source].sort()

    paths: Set[Tuple[str, ...]] = set()

    def visit(path: Tuple[str, ...]) -> None:
        paths.add(path)
        for successor in graph[path[-1]]:
            if successor not in path:
                visit(path + (successor,))

    for start in sorted(graph):
        visit((start,))
    return sorted(paths)


def query_terms(op: Dict[str, Any]) -> Set[str]:
    """Deterministic lexical adaptation of PathOCL's preprocessed UML elements."""
    text = " ".join(
        [
            str(op.get("description") or ""),
            str(op.get("operation_name") or op.get("operation") or ""),
            " ".join(str(param.get("name") or "") for param in op.get("parameters") or []),
        ]
    )
    return words(text) | split_camel(str(op.get("operation_name") or op.get("operation") or ""))


def path_terms(path: Tuple[str, ...], entities: Dict[str, Entity]) -> Set[str]:
    terms: Set[str] = set()
    for index, class_name in enumerate(path):
        entity = entities[class_name]
        terms |= split_camel(class_name) | {class_name.lower()}
        for attribute in entity.attributes:
            terms |= split_camel(attribute.name) | {attribute.name.lower()}
        if index + 1 < len(path):
            next_class = path[index + 1]
            for relationship in entity.relationships:
                if target_class(relationship.type_name) == next_class:
                    terms |= split_camel(relationship.name) | {relationship.name.lower()}
    return terms


def jaccard_score(left: Set[str], right: Set[str]) -> float:
    union = left | right
    return len(left & right) / len(union) if union else 0.0


def rank_simple_paths(op: Dict[str, Any]) -> List[Tuple[Tuple[str, ...], float]]:
    entities = parse_model_context(op.get("model_context") or "")
    terms = query_terms(op)
    ranked = [
        (path, jaccard_score(terms, path_terms(path, entities)))
        for path in generate_simple_paths(entities)
    ]
    return sorted(ranked, key=lambda item: (-item[1], len(item[0]), item[0]))


def render_path_context(path: Tuple[str, ...], entities: Dict[str, Entity]) -> str:
    selected = set(path)
    classes: List[Dict[str, Any]] = []
    for class_name in path:
        entity = entities[class_name]
        associations = []
        for relationship in entity.relationships:
            target = target_class(relationship.type_name)
            if target not in selected:
                continue
            associations.append(
                {
                    "target": target,
                    "role": relationship.name,
                    "multiplicity": "*" if relationship.type_name.startswith("Set(") else "1",
                }
            )
        classes.append(
            {
                "class": class_name,
                "attributes": [
                    {attribute.name: attribute.type_name} for attribute in entity.attributes
                ],
                "operations": [],
                "associations": associations,
            }
        )
    return json.dumps(classes, ensure_ascii=False, indent=2)


def build_pathocl_messages(
    op: Dict[str, Any], path: Tuple[str, ...]
) -> Tuple[List[Dict[str, str]], str]:
    entities = parse_model_context(op.get("model_context") or "")
    path_context = render_path_context(path, entities)
    service = op.get("service") or "Service"
    signature = op.get("operation_signature") or op.get("operation_name") or op.get("operation")
    system_prompt = (
        "As a system designer with expertise in UML modeling and OCL constraints, "
        "assist the user in writing an OCL operation contract. The user provides a "
        "natural-language specification, the target operation, and UML classes along "
        "one ranked simple path. Generate a complete operation contract containing the "
        "required preconditions and postconditions. Do not provide an explanation. "
        "Put only the solution in an <OCL> tag."
    )
    user_prompt = f"""-- OCL specification
{op.get('description') or ''}

-- Target operation
{service}::{signature}

-- UML classes and properties in the selected simple path
{path_context}

-- OCL operation contract
"""
    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ], path_context


def extract_pathocl_output(raw: str, op: Dict[str, Any]) -> Dict[str, Any]:
    tagged = re.search(r"<OCL>\s*([\s\S]*?)\s*</OCL>", raw or "", re.IGNORECASE)
    text = tagged.group(1).strip() if tagged else (raw or "").strip()
    text = re.sub(r"^\s*<OCL>\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*</OCL>\s*$", "", text, flags=re.IGNORECASE)
    return codex_style.extract_codex_prompt_output(
        text, op, "uml-zero-shot-contract"
    )


def parse_models(value: str) -> List[str]:
    return base.parse_models(value)


def rewrite_summary(output_dir: Path) -> None:
    summary_path = output_dir / "summary.json"
    if not summary_path.exists():
        return
    summary = json.loads(summary_path.read_text(encoding="utf-8"))
    summary["experiment"] = "pathocl_style_baseline"
    summary["treatment"] = "pathocl_jaccard_topk_contract_transfer"
    summary["sampling_protocol_version"] = PATHOCL_PROTOCOL_VERSION
    summary["context_selection"] = {
        "mode": "all_directed_simple_paths_ranked_by_lexical_jaccard",
        "one_ranked_path_per_generation": True,
        "small_graph_fallback": "cycle_ranked_paths_to_fill_fixed_budget",
    }
    summary["source_method"] = {
        "paper_doi": PATHOCL_SOURCE_DOI,
        "dataset_doi": PATHOCL_DATASET_DOI,
        "source_ranking": "Jaccard",
        "adaptation": "isolated OCL constraint to complete operation contract",
        "exact_rerun": False,
        "oracle_available_to_generator": False,
    }
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="PathOCL-style path-context OCL baseline.")
    parser.add_argument("--input", default="data/operations.jsonl")
    parser.add_argument(
        "--output-dir",
        default=f"{base.STUDY_RESULTS_ROOT}/baselines/pathocl-jaccard-top5",
    )
    parser.add_argument("--models", default="gpt-5.5", type=parse_models)
    parser.add_argument(
        "--max-attempts",
        type=int,
        default=5,
        help="Fixed top-k path-generation budget per operation-model pair (1-5).",
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
        parser.error("--max-attempts must be between 1 and 5 ranked path prompts")
    if not args.eval_next_base_url.strip():
        parser.error("--eval-next-base-url is required for the frozen PathOCL study")

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

    generation_prompt_version = PATHOCL_PROMPT_VERSION
    ranked_by_operation = {op["id"]: rank_simple_paths(op) for op in operations}
    if any(not ranked for ranked in ranked_by_operation.values()):
        raise RuntimeError("Every operation must have at least one PathOCL simple path")
    expected_prompt_hashes: Dict[Any, str] = {}
    for operation in operations:
        ranked = ranked_by_operation[operation["id"]]
        for attempt in range(1, args.max_attempts + 1):
            path, _ = ranked[(attempt - 1) % len(ranked)]
            messages, _ = build_pathocl_messages(operation, path)
            expected_prompt_hashes[(operation["id"], attempt)] = base.sha256_text(
                json.dumps(messages, ensure_ascii=False, separators=(",", ":"))
            )
    existing = base.read_jsonl(attempts_path)
    base.assert_existing_records_match_manifest(
        existing,
        operations,
        generation_prompt_version,
        "text",
        args.temperature,
        args.max_tokens,
        sampling_protocol_version=PATHOCL_PROTOCOL_VERSION,
        expected_generation_prompt_hashes=expected_prompt_hashes,
        uses_shared_generation_assets=False,
    )

    if args.analyze_only:
        if not attempts_path.is_file():
            raise FileNotFoundError(f"analyze-only requires {attempts_path}")
        if not operations:
            logging.error("analyze-only needs --input with operations")
            sys.exit(1)
        base.write_summary(output_dir, operations, args.models, args.max_attempts)
        rewrite_summary(output_dir)
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
        f"PathOCL-style baseline: {len(operations)} ops x {len(args.models)} models = {planned} pairs"
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
            ranked_paths = ranked_by_operation[oid]
            for attempt in range(start_att, args.max_attempts + 1):
                path_rank_index = (attempt - 1) % len(ranked_paths)
                selected_path, path_score = ranked_paths[path_rank_index]
                messages, path_context = build_pathocl_messages(op, selected_path)
                prompt = json.dumps(messages, ensure_ascii=False, separators=(",", ":"))
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
                    )
                except Exception as exc:
                    logging.exception("LLM failed op=%s model=%s att=%s", oid, model, attempt)
                    raise RuntimeError(
                        "LLM infrastructure failed; no experimental attempt was consumed "
                        f"(op={oid}, model={model}, attempt={attempt})"
                    ) from exc

                ext = extract_pathocl_output(raw, op)
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
                    "treatment": "pathocl_style",
                    "experiment": "pathocl_style_baseline",
                    "context_selection": "all_simple_paths_lexical_jaccard",
                    "path_ranking_metric": "jaccard",
                    "path_rank": path_rank_index + 1,
                    "path_reused_to_fill_budget": attempt > len(ranked_paths),
                    "path_score": path_score,
                    "selected_path": list(selected_path),
                    "available_simple_paths": len(ranked_paths),
                    "path_context": path_context,
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
                    "generation_prompt_version": generation_prompt_version,
                    "generation_prompt_hash": base.sha256_text(prompt),
                    "generation_request_hash": base.sha256_text(prompt),
                    "sampling_protocol": "ranked_path_fixed_budget",
                    "sampling_protocol_version": PATHOCL_PROTOCOL_VERSION,
                    "source_paper_doi": PATHOCL_SOURCE_DOI,
                    "source_dataset_doi": PATHOCL_DATASET_DOI,
                    "source_ranking_setting": "jaccard",
                    "exact_source_rerun": False,
                    "oracle_available_to_generator": False,
                    "generation_config_version": base.EXPECTED_GENERATION_CONFIG_VERSION,
                    "generation_config_hash": base.generation_configuration_hash(
                        "text", args.temperature, args.max_tokens
                    ),
                    "generation_output_mode": "text",
                    "generation_grammar_version": "",
                    "generation_grammar_hash": "",
                    "generation_rules_version": "",
                    "generation_rules_hash": "",
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
    rewrite_summary(output_dir)
    logging.info("Done. Outputs under %s", output_dir)


if __name__ == "__main__":
    main()
