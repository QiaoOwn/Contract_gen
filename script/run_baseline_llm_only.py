#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Pure-LLM baseline (standalone).

- Does NOT call Next.js, LangGraph, or run_rq1_validity_experiments.py.
- Exactly K independent OpenAI-compatible generations per operation; no validation result
  changes a later request or stops the fixed sampling schedule.
- Prompt targets the executable REMODEL OCL subset (allInstances() and project rules).
- Optional REMODEL syntax check via external --validate-cmd (e.g. tsx validator).
- Optional execution-grounded validation via Next.js POST /api/evaluate-contract.

Example (114 ops, one model, 5 independent attempts, with syntax check):

  python script/run_baseline_llm_only.py ^
    --models gpt-5.4 ^
  --output-dir results/contractgen-study-v6/baselines/purellm ^
    --max-attempts 5 ^
    --validate-cmd "npx tsx script/validate-remodel-contract.ts {input_file}" ^
    --parser-use-shell

Smoke test:

  python script/run_baseline_llm_only.py --models gpt-5.4-mini --limit 2 --max-attempts 1
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import logging
import os
import random
import re
import shlex
import subprocess
import sys
import time
import urllib.error
import urllib.request
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

ALL_MODELS: Tuple[str, ...] = (
    "gpt-5.5",
    "gpt-5.4",
    "gpt-5.4-mini",
    "gemini-3.5-flash",
    "deepseek-v4-pro",
    "deepseek-v4-flash",
    "claude-opus-4-7",
    "claude-sonnet-4-6",
    "qwen3-coder-plus",
    "qwen3-coder-flash",
)

EXPECTED_INPUT_SCHEMA_VERSION = "contractgen-operation-input-v3"
EXPECTED_MANIFEST_PROMPT_VERSION = "contractgen-system-prompt-v7"
EXPECTED_GENERATION_CONFIG_VERSION = "llm-generation-config-v5"
EXPECTED_GENERATION_GRAMMAR_VERSION = "ocl-generation-grammar-v2"
EXPECTED_GENERATION_RULES_VERSION = "ocl-generation-rules-v4"
EXPECTED_GENERATION_OUTPUT_MODE = "json"
EXPECTED_GENERATION_TEMPERATURE = 0.2
EXPECTED_GENERATION_MAX_TOKENS = 4096
EXPECTED_REASONING_POLICY = {
    "gpt5ReasoningEffort": "none",
    "gemini35FlashThinkingLevel": "minimal",
    "claudeOpus47Effort": "low",
    "qwen3CoderThinkingEnabled": False,
}
PURELLM_PROMPT_VERSION = EXPECTED_MANIFEST_PROMPT_VERSION
PURELLM_PROTOCOL_VERSION = "purellm-fixed-independent-sampling-v1"
STUDY_VERSION = "contractgen-study-v6"
STUDY_RESULTS_ROOT = f"results/{STUDY_VERSION}"
EXPECTED_OPERATION_COUNT = 114


def repo_root() -> Path:
    return Path(__file__).resolve().parent.parent


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def generation_configuration_hash(
    output_mode: str, temperature: float, max_tokens: int
) -> str:
    values = {
        "outputMode": output_mode,
        "temperature": temperature,
        "maxTokens": max_tokens,
        "reasoningPolicy": EXPECTED_REASONING_POLICY,
    }
    return sha256_text(json.dumps(values, ensure_ascii=False, separators=(",", ":")))


def assert_generation_configuration(temperature: float, max_tokens: int) -> None:
    if temperature != EXPECTED_GENERATION_TEMPERATURE:
        raise ValueError(
            f"The study freezes temperature={EXPECTED_GENERATION_TEMPERATURE}; "
            f"got {temperature}. Use a separate study namespace for another setting."
        )
    if max_tokens != EXPECTED_GENERATION_MAX_TOKENS:
        raise ValueError(
            f"The study freezes max_tokens={EXPECTED_GENERATION_MAX_TOKENS}; "
            f"got {max_tokens}. Use a separate study namespace for another setting."
        )


def model_reasoning_parameters(model: str) -> Dict[str, Any]:
    normalized = model.lower()
    if normalized.startswith("gpt-5"):
        return {"reasoning_effort": EXPECTED_REASONING_POLICY["gpt5ReasoningEffort"]}
    if normalized.startswith("gemini-3.5-flash"):
        return {
            "reasoning_effort": EXPECTED_REASONING_POLICY["gemini35FlashThinkingLevel"]
        }
    if normalized.startswith(("claude-opus-4-7", "claude-opus-4.7")):
        return {"reasoning_effort": EXPECTED_REASONING_POLICY["claudeOpus47Effort"]}
    if normalized.startswith("qwen3-coder"):
        return {"enable_thinking": EXPECTED_REASONING_POLICY["qwen3CoderThinkingEnabled"]}
    return {}


def validate_manifest_row(row: Dict[str, Any], line_no: int) -> None:
    required = (
        "id",
        "oracle_id",
        "requirement_group_id",
        "description",
        "model_context",
        "canonical_user_message",
        "input_hash",
        "requirement_hash",
        "context_hash",
        "prompt_hash",
        "generation_config_version",
        "generation_config_hash",
        "generation_grammar_version",
        "generation_grammar_hash",
        "generation_rules_version",
        "generation_rules_hash",
        "generation_output_mode",
    )
    missing = [name for name in required if not str(row.get(name) or "").strip()]
    if missing:
        raise ValueError(f"line {line_no}: missing current manifest fields: {', '.join(missing)}")
    if not isinstance(row.get("has_return_value"), bool):
        raise ValueError(f"line {line_no}: has_return_value must be a Boolean")
    if row.get("input_schema_version") != EXPECTED_INPUT_SCHEMA_VERSION:
        raise ValueError(
            f"line {line_no}: expected {EXPECTED_INPUT_SCHEMA_VERSION}, "
            f"got {row.get('input_schema_version')!r}"
        )
    if row.get("prompt_version") != EXPECTED_MANIFEST_PROMPT_VERSION:
        raise ValueError(
            f"line {line_no}: expected {EXPECTED_MANIFEST_PROMPT_VERSION}, "
            f"got {row.get('prompt_version')!r}"
        )
    if row.get("oracle_available_to_generator") is not False:
        raise ValueError(f"line {line_no}: oracle isolation flag must be false")
    if row.get("generation_config_version") != EXPECTED_GENERATION_CONFIG_VERSION:
        raise ValueError(
            f"line {line_no}: expected {EXPECTED_GENERATION_CONFIG_VERSION}, "
            f"got {row.get('generation_config_version')!r}"
        )
    if row.get("generation_grammar_version") != EXPECTED_GENERATION_GRAMMAR_VERSION:
        raise ValueError(f"line {line_no}: generation grammar version mismatch")
    if row.get("generation_rules_version") != EXPECTED_GENERATION_RULES_VERSION:
        raise ValueError(f"line {line_no}: generation rule catalog version mismatch")
    if row.get("generation_output_mode") != EXPECTED_GENERATION_OUTPUT_MODE:
        raise ValueError(f"line {line_no}: Contract Gen output mode must be json")
    if row.get("generation_temperature") != EXPECTED_GENERATION_TEMPERATURE:
        raise ValueError(f"line {line_no}: Contract Gen temperature must be 0.2")
    if row.get("generation_max_tokens") != EXPECTED_GENERATION_MAX_TOKENS:
        raise ValueError(f"line {line_no}: Contract Gen max tokens must be 4096")
    expected_config_hash = generation_configuration_hash(
        EXPECTED_GENERATION_OUTPUT_MODE,
        EXPECTED_GENERATION_TEMPERATURE,
        EXPECTED_GENERATION_MAX_TOKENS,
    )
    if row.get("generation_config_hash") != expected_config_hash:
        raise ValueError(f"line {line_no}: generation configuration hash mismatch")
    for name in (
        "input_hash",
        "requirement_hash",
        "context_hash",
        "prompt_hash",
        "generation_config_hash",
        "generation_grammar_hash",
        "generation_rules_hash",
    ):
        if not re.fullmatch(r"[0-9a-f]{64}", str(row.get(name) or "")):
            raise ValueError(f"line {line_no}: invalid SHA-256 field {name}")
    canonical = str(row.get("canonical_user_message") or "")
    for section in ("Operation intent:", "Preconditions:", "Postconditions:"):
        if section not in canonical:
            raise ValueError(f"line {line_no}: canonical input is missing {section}")
    if row.get("prompt_hash") != sha256_text(CONTRACTGEN_SYSTEM_PROMPT):
        raise ValueError(
            f"line {line_no}: frozen manifest prompt does not match Contract Gen"
        )


def assert_existing_records_match_manifest(
    records: List[Dict[str, Any]],
    operations: List[Dict[str, Any]],
    generation_prompt_version: str,
    generation_output_mode: str,
    temperature: float,
    max_tokens: int,
    *,
    sampling_protocol_version: Optional[str] = None,
    expected_generation_prompt_hashes: Optional[Dict[Any, str]] = None,
    uses_shared_generation_assets: bool = True,
) -> None:
    expected = {op["id"]: op for op in operations}
    mismatches: List[str] = []
    for record in records:
        operation_id = str(record.get("operation_id") or "")
        operation = expected.get(operation_id)
        if operation is None:
            if len(expected) == EXPECTED_OPERATION_COUNT:
                mismatches.append(f"unknown operation id in existing results: {operation_id!r}")
            continue
        checks = (
            ("study version", record.get("study_version"), STUDY_VERSION),
            ("input schema", record.get("input_schema_version"), operation["input_schema_version"]),
            ("input hash", record.get("input_hash"), operation["input_hash"]),
            ("oracle id", record.get("oracle_id"), operation["oracle_id"]),
            (
                "requirement group id",
                record.get("requirement_group_id"),
                operation["requirement_group_id"],
            ),
            (
                "has return value",
                record.get("has_return_value"),
                operation["has_return_value"],
            ),
            (
                "manifest prompt hash",
                record.get("shared_prompt_hash") or record.get("prompt_hash"),
                operation["prompt_hash"],
            ),
            (
                "generation prompt version",
                record.get("generation_prompt_version"),
                generation_prompt_version,
            ),
            (
                "generation config version",
                record.get("generation_config_version"),
                EXPECTED_GENERATION_CONFIG_VERSION,
            ),
            (
                "generation config hash",
                record.get("generation_config_hash"),
                generation_configuration_hash(
                    generation_output_mode, temperature, max_tokens
                ),
            ),
            ("generation output mode", record.get("generation_output_mode"), generation_output_mode),
            ("generation temperature", record.get("generation_temperature"), temperature),
            ("generation max tokens", record.get("generation_max_tokens"), max_tokens),
        )
        for name, actual, wanted in checks:
            if actual != wanted:
                mismatches.append(
                    f"{operation_id} {name}: existing={actual!r}, expected={wanted!r}"
                )
                break
        if uses_shared_generation_assets:
            for name, actual, wanted in (
                (
                    "generation grammar version",
                    record.get("generation_grammar_version"),
                    operation["generation_grammar_version"],
                ),
                (
                    "generation grammar hash",
                    record.get("generation_grammar_hash"),
                    operation["generation_grammar_hash"],
                ),
                (
                    "generation rules version",
                    record.get("generation_rules_version"),
                    operation["generation_rules_version"],
                ),
                (
                    "generation rules hash",
                    record.get("generation_rules_hash"),
                    operation["generation_rules_hash"],
                ),
            ):
                if actual != wanted:
                    mismatches.append(
                        f"{operation_id} {name}: existing={actual!r}, expected={wanted!r}"
                    )
                    break
        if (
            sampling_protocol_version is not None
            and record.get("sampling_protocol_version") != sampling_protocol_version
        ):
            mismatches.append(
                f"{operation_id} sampling protocol version: "
                f"existing={record.get('sampling_protocol_version')!r}, "
                f"expected={sampling_protocol_version!r}"
            )
        prompt_hashes = expected_generation_prompt_hashes or {}
        expected_prompt_hash = prompt_hashes.get(
            (operation_id, int(record.get("attempt") or 0)),
            prompt_hashes.get(operation_id),
        )
        if (
            expected_prompt_hash is not None
            and record.get("generation_prompt_hash") != expected_prompt_hash
        ):
            mismatches.append(
                f"{operation_id} generation prompt hash: "
                f"existing={record.get('generation_prompt_hash')!r}, "
                f"expected={expected_prompt_hash!r}"
            )
        if len(mismatches) >= 5:
            break
    if mismatches:
        raise RuntimeError(
            f"Existing results do not match the frozen {STUDY_VERSION} configuration. "
            f"Use a new --output-dir under {STUDY_RESULTS_ROOT}. "
            + " | ".join(mismatches)
        )


def assert_force_target_is_current_study(records: List[Dict[str, Any]]) -> None:
    legacy = [
        str(record.get("operation_id") or "<unknown>")
        for record in records
        if record.get("study_version") != STUDY_VERSION
    ]
    if legacy:
        raise RuntimeError(
            "Refusing --force because the target contains legacy or foreign results. "
            f"Preserve that directory and choose a path under {STUDY_RESULTS_ROOT}. "
            f"First mismatches: {', '.join(legacy[:5])}"
        )


def load_env_file(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8-sig").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key = key.strip().lstrip("\ufeff")
        val = val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def setup_logging(log_dir: Path) -> None:
    log_dir.mkdir(parents=True, exist_ok=True)
    root = logging.getLogger()
    root.setLevel(logging.DEBUG)
    root.handlers.clear()
    fmt = logging.Formatter("%(asctime)s [%(levelname)s] %(message)s")
    fh = logging.FileHandler(log_dir / "run.log", encoding="utf-8")
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(fmt)
    sh = logging.StreamHandler(sys.stdout)
    sh.setLevel(logging.INFO)
    sh.setFormatter(fmt)
    root.addHandler(fh)
    root.addHandler(sh)


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    if not path.exists():
        return []
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8") as f:
        for line_no, line in enumerate(f, 1):
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError as exc:
                    raise ValueError(f"{path}:{line_no}: invalid JSON: {exc}") from exc
    return rows


def append_jsonl(path: Path, obj: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a", encoding="utf-8") as f:
        f.write(json.dumps(obj, ensure_ascii=False) + "\n")



def _read_shared_prompt_asset(relative_path: str) -> str:
    path = repo_root() / relative_path
    if path.suffix == ".json":
        values = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(values, list) and all(isinstance(value, str) for value in values):
            return "\n".join(values)
        if isinstance(values, dict) and isinstance(values.get("sections"), list):
            rendered: List[str] = []
            for section in values["sections"]:
                if not isinstance(section, dict) or not isinstance(section.get("rules"), list):
                    raise RuntimeError(f"Invalid generation-rule section in {path}")
                rendered.append(f"{section.get('heading', 'Rules')}:")
                for rule in section["rules"]:
                    if not isinstance(rule, dict) or not rule.get("id") or not rule.get("text"):
                        raise RuntimeError(f"Invalid generation rule in {path}")
                    rendered.append(f"[{rule['id']}] {rule['text']}")
            return "\n".join(rendered)
        raise RuntimeError(f"Unsupported prompt asset structure in {path}")
    return path.read_text(encoding="utf-8").strip()


# These assets are the same source files consumed by Contract Gen. Keeping the
# method wrapper separate while sharing grammar and generation rules makes the
# PureLLM comparison differ in workflow, not in hidden input knowledge.
REMODEL_GENERATION_GRAMMAR = _read_shared_prompt_asset(
    "src/app/service/prompts/generationGrammar.txt"
)
REMODEL_GENERATION_RULES = _read_shared_prompt_asset(
    "src/app/service/prompts/generationRules.json"
)
REMODEL_COMMON_MISTAKES = _read_shared_prompt_asset(
    "src/app/service/prompts/commonContractErrors.json"
)


CONTRACT_FIELD_SEMANTICS = "\n".join(
    [
        "Contract-field semantics:",
        "definition: The optional definition field introduces query-only helper bindings used by the precondition or postcondition.\n"
        "Each binding has the form name:Type = expression, uses lowerCamelCase for name, and is separated from the next binding by a comma.\n"
        "Do not encode state changes in definition. Return null when no helper binding is needed.",
        "precondition: The precondition is a non-mutating Boolean expression over the state before operation execution.\n"
        "Use it only for input admissibility, existence, status, quota, and other conditions that must already hold.\n"
        "It may use operation parameters, service state, and helper bindings from definition.",
        "postcondition: The postcondition is a Boolean expression describing the required state after successful operation execution.\n"
        "It may create or remove repository objects, update attributes and associations, update service state, and constrain result.\n"
        "Use @pre only when an effect depends on a value from before execution.",
    ]
)


def build_system_prompt() -> str:
    grammar_prompt = "\n".join(
        [
            "Generate only the definition, precondition, and postcondition fields of one executable REMODEL operation contract.",
            'In a postcondition, "=" on attributes, associations, service state, or result denotes an update obligation; never write chained equalities such as result = a = b.',
            "Generate only constructs admitted by this executable operation-contract generation subset:",
            REMODEL_GENERATION_GRAMMAR,
        ]
    )
    return "\n\n".join(
        [
            "You are the OCL Generator in Contract Gen. Translate one structured natural-language operation requirement into an executable REMODEL OCL contract.",
            "The caller supplies operation metadata, the structured requirement, model context, and read-only environment values. Preserve the stated semantics and remain grounded in those declarations.",
            "\n".join(
                [
                    "Requirement-to-field mapping:",
                    "- Preconditions bullets go only into precondition.",
                    "- Operation intent and Postconditions bullets go into postcondition.",
                    "- Reusable query helpers go into definition; otherwise set definition to JSON null.",
                ]
            ),
            grammar_prompt,
            CONTRACT_FIELD_SEMANTICS,
            "OCL generation rule catalog:",
            REMODEL_GENERATION_RULES,
            "Return exactly one JSON object with keys definition, precondition, and postcondition.",
            "Use JSON null for definition when no helper binding is required. The other two values must be expression strings.",
            "Do not return a Contract wrapper, Markdown, comments, explanations, or additional keys.",
            REMODEL_COMMON_MISTAKES,
        ]
    )


CONTRACTGEN_SYSTEM_PROMPT = build_system_prompt()


def normalize_definition_value(defn: Any) -> Optional[str]:
    if defn is None:
        return None
    if not isinstance(defn, str):
        return None
    s = defn.strip()
    if not s or s.lower() in ("null", "none", "n/a", "undefined", '""', "''"):
        return None
    return s


def safe_operation(row: Dict[str, Any], line_no: int) -> Optional[Dict[str, Any]]:
    oid = row.get("id") or row.get("operation_id")
    if not oid:
        raise ValueError(f"line {line_no}: missing operation id")
    validate_manifest_row(row, line_no)
    return {
        "id": str(oid),
        "oracle_id": str(row.get("oracle_id") or ""),
        "requirement_group_id": str(row.get("requirement_group_id") or ""),
        "case_study": str(row.get("case_study") or row.get("case") or "unknown"),
        "project": str(row.get("project") or row.get("case_study") or row.get("case") or ""),
        "useCase": str(row.get("useCase") or row.get("use_case") or ""),
        "operation": str(row.get("operation") or row.get("operation_name") or row.get("name") or ""),
        "service": str(row.get("service") or ""),
        "operation_name": str(row.get("operation_name") or row.get("name") or ""),
        "operation_signature": str(
            row.get("operation_signature") or row.get("signature") or ""
        ),
        "description": str(row.get("description") or ""),
        "parameters": row.get("parameters") or [],
        "return_type": str(row.get("return_type") or ""),
        "has_return_value": bool(row.get("has_return_value")),
        "model_context": str(row.get("model_context") or row.get("context") or ""),
        "canonical_user_message": str(row.get("canonical_user_message") or ""),
        "input_schema_version": str(row.get("input_schema_version") or ""),
        "input_hash": str(row.get("input_hash") or ""),
        "requirement_hash": str(row.get("requirement_hash") or ""),
        "context_hash": str(row.get("context_hash") or ""),
        "prompt_version": str(row.get("prompt_version") or ""),
        "prompt_hash": str(row.get("prompt_hash") or ""),
        "generation_config_version": str(row.get("generation_config_version") or ""),
        "generation_config_hash": str(row.get("generation_config_hash") or ""),
        "generation_grammar_version": str(row.get("generation_grammar_version") or ""),
        "generation_grammar_hash": str(row.get("generation_grammar_hash") or ""),
        "generation_rules_version": str(row.get("generation_rules_version") or ""),
        "generation_rules_hash": str(row.get("generation_rules_hash") or ""),
        "generation_output_mode": str(row.get("generation_output_mode") or ""),
        "generation_temperature": row.get("generation_temperature"),
        "generation_max_tokens": row.get("generation_max_tokens"),
    }


def build_prompt(op: Dict[str, Any]) -> str:
    return json.dumps(build_messages(op), ensure_ascii=False, separators=(",", ":"))


def build_messages(op: Dict[str, Any]) -> List[Dict[str, str]]:
    return [
        {"role": "system", "content": CONTRACTGEN_SYSTEM_PROMPT},
        {"role": "user", "content": op["canonical_user_message"]},
    ]


def wrap_contract(
    op: Dict[str, Any],
    *,
    definition: Optional[str],
    precondition: str,
    postcondition: str,
) -> str:
    params = op.get("parameters") or []
    param_str = ",".join(
        f"{p.get('name', '')}:{p.get('type', '')}"
        for p in params
        if isinstance(p, dict) and p.get("name")
    )
    ret = (op.get("return_type") or "").strip()
    ret_suffix = f": {ret}" if ret else ""
    service = op.get("service") or "Service"
    op_name = op.get("operation_name") or "operation"
    def_block = ""
    if definition and str(definition).strip():
        def_block = f"definition:\n          {definition}\n            "
    pre_block = ""
    if precondition and str(precondition).strip():
        pre_block = f"precondition:\n          {precondition}\n            "
    post_block = ""
    if postcondition and str(postcondition).strip():
        post_block = f"postcondition:\n          {postcondition}\n            "
    return (
        f"Contract {service}::{op_name}({param_str}){ret_suffix} {{\n"
        f"          {def_block}{pre_block}{post_block}\n        }}"
    )


def parse_json_from_llm(text: str) -> Optional[Dict[str, Any]]:
    text = (text or "").strip()
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*([\s\S]*?)```", text, re.IGNORECASE)
    if fence:
        text = fence.group(1).strip()
    try:
        obj = json.loads(text)
        return obj if isinstance(obj, dict) else None
    except json.JSONDecodeError:
        pass
    start, end = text.find("{"), text.rfind("}")
    if start >= 0 and end > start:
        try:
            obj = json.loads(text[start : end + 1])
            return obj if isinstance(obj, dict) else None
        except json.JSONDecodeError:
            return None
    return None


def extract_contract_text(raw: str, op: Dict[str, Any]) -> Dict[str, Any]:
    obj = parse_json_from_llm(raw)
    schema_ok = bool(
        obj
        and set(("definition", "precondition", "postcondition")).issubset(obj)
        and (obj.get("definition") is None or isinstance(obj.get("definition"), str))
        and isinstance(obj.get("precondition"), str)
        and isinstance(obj.get("postcondition"), str)
    )
    if schema_ok:
        pre = obj["precondition"].strip()
        post = obj["postcondition"].strip()
        defn_s = normalize_definition_value(obj.get("definition"))
        contract = wrap_contract(
            op, definition=defn_s, precondition=pre, postcondition=post
        )
        return {
            "contract": contract,
            "definition": defn_s,
            "precondition": pre,
            "postcondition": post,
            "json_parsed": True,
            "extraction_ok": True,
        }
    return {
        "contract": "",
        "definition": None,
        "precondition": "",
        "postcondition": "",
        "json_parsed": False,
        "extraction_ok": False,
    }


def _http_json(
    url: str, payload: Dict[str, Any], headers: Dict[str, str], timeout: float
) -> Dict[str, Any]:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {e.code}: {body[:2000]}") from e


def call_llm(
    model: str,
    messages: Any,
    *,
    temperature: float,
    max_tokens: int,
    timeout: float,
    json_mode: bool = True,
    stop_sequences: Optional[List[str]] = None,
) -> str:
    key = os.environ.get("OPENAI_API_KEY", "")
    if not key:
        raise RuntimeError("OPENAI_API_KEY is not set")
    base = os.environ.get("OPENAI_BASE_URL", "").strip() or "https://api.openai.com/v1"
    url = base.rstrip("/") + "/chat/completions"

    last_err: Optional[BaseException] = None
    for attempt in range(1, 4):
        try:
            normalized_messages = (
                [{"role": "user", "content": messages}]
                if isinstance(messages, str)
                else messages
            )
            payload: Dict[str, Any] = {
                "model": model,
                "messages": normalized_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }
            if json_mode:
                payload["response_format"] = {"type": "json_object"}
            if stop_sequences:
                payload["stop"] = stop_sequences
            payload.update(model_reasoning_parameters(model))
            out = _http_json(
                url,
                payload,
                {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {key}",
                },
                timeout,
            )
            return str((out.get("choices") or [{}])[0].get("message", {}).get("content") or "")
        except Exception as e:
            last_err = e
            logging.warning("LLM attempt %s failed: %s", attempt, e)
            time.sleep((2 ** (attempt - 1)) + random.random())
    raise RuntimeError(f"call_llm failed: {last_err}")


def validate_contract_file(
    contract: str,
    path: Path,
    cmd_template: str,
    timeout: int,
    use_shell: bool,
) -> Dict[str, Any]:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(contract, encoding="utf-8")
    cmd_str = cmd_template.replace("{input_file}", str(path.resolve()))
    try:
        if use_shell:
            proc = subprocess.run(
                cmd_str,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
            )
        else:
            proc = subprocess.run(
                shlex.split(cmd_str, posix=os.name != "nt"),
                capture_output=True,
                text=True,
                timeout=timeout,
                encoding="utf-8",
                errors="replace",
            )
    except subprocess.TimeoutExpired:
        return {
            "syntax_valid": False,
            "validate_skipped": False,
            "validate_returncode": None,
            "validate_stderr": "timeout",
        }
    except Exception as e:
        return {
            "syntax_valid": False,
            "validate_skipped": False,
            "validate_returncode": None,
            "validate_stderr": str(e),
        }
    ok = proc.returncode == 0
    return {
        "syntax_valid": ok,
        "validate_skipped": False,
        "validate_returncode": proc.returncode,
        "validate_stdout": proc.stdout or "",
        "validate_stderr": proc.stderr or "",
    }


def evaluate_contract_with_next(
    base_url: str,
    op: Dict[str, Any],
    contract: str,
    ext: Dict[str, Any],
    timeout: float,
) -> Dict[str, Any]:
    url = base_url.rstrip("/") + "/api/evaluate-contract"
    payload = {
        "project": op.get("project") or op.get("case_study"),
        "useCase": op.get("useCase"),
        "operation": op.get("operation") or op.get("operation_name"),
        "contract": contract,
        "ocl": {
            "definition": ext.get("definition"),
            "precondition": ext.get("precondition") or "",
            "postcondition": ext.get("postcondition") or "",
        },
    }
    if not payload["project"] or not payload["useCase"] or not payload["operation"]:
        return {
            "execution_eval_skipped": True,
            "execution_infrastructure_error": False,
            "execution_eval_error": "missing project/useCase/operation fields",
            "execution_valid": False,
        }
    if not payload["ocl"]["precondition"] or not payload["ocl"]["postcondition"]:
        return {
            "execution_eval_skipped": True,
            "execution_infrastructure_error": False,
            "execution_eval_error": "missing extracted precondition/postcondition",
            "execution_valid": False,
        }
    try:
        out = _http_json(
            url,
            payload,
            {"Content-Type": "application/json"},
            timeout,
        )
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        return {
            "execution_eval_skipped": False,
            "execution_infrastructure_error": True,
            "execution_eval_error": f"HTTP {e.code}: {body[:1000]}",
            "execution_valid": False,
        }
    except Exception as e:
        return {
            "execution_eval_skipped": False,
            "execution_infrastructure_error": True,
            "execution_eval_error": str(e),
            "execution_valid": False,
        }
    execution_valid = (
        bool(out.get("contract_parse_ok"))
        and bool(out.get("typescript_generation_ok"))
        and bool(out.get("typescript_parse_ok"))
        and bool(out.get("test_execution_ok"))
    )
    return {
        "execution_eval_skipped": False,
        "execution_infrastructure_error": False,
        "execution_eval_error": "",
        "execution_valid": execution_valid,
        "contract_parse_ok": bool(out.get("contract_parse_ok")),
        "contract_errors": out.get("contract_errors") or [],
        "typescript_generation_ok": bool(out.get("typescript_generation_ok")),
        "typescript_generation_error": out.get("typescript_generation_error", ""),
        "typescript_parse_ok": bool(out.get("typescript_parse_ok")),
        "typescript_errors": out.get("typescript_errors") or [],
        "test_execution_ok": bool(out.get("test_execution_ok")),
        "test_execution_error": out.get("test_execution_error", ""),
        "test_passing_count": int(out.get("test_passing_count") or 0),
        "test_failing_count": int(out.get("test_failing_count") or 0),
    }


def raise_if_evaluation_infrastructure_error(
    result: Dict[str, Any], operation_id: str, model: str, attempt: int
) -> None:
    if result.get("execution_infrastructure_error"):
        raise RuntimeError(
            "Execution evaluator infrastructure failed; no experimental attempt was consumed "
            f"(op={operation_id}, model={model}, attempt={attempt}): "
            f"{result.get('execution_eval_error', 'unknown evaluator error')}"
        )


def pair_is_complete(
    operation_id: str,
    model: str,
    attempts: List[Dict[str, Any]],
    max_attempts: int,
    require_execution: bool = False,
) -> bool:
    rows = [
        r
        for r in attempts
        if r.get("operation_id") == operation_id and r.get("model") == model
    ]
    del require_execution
    attempts_recorded = {int(r["attempt"]) for r in rows}
    return all(attempt in attempts_recorded for attempt in range(1, max_attempts + 1))


def count_completed_pairs(
    operations: List[Dict[str, Any]],
    models: List[str],
    attempts: List[Dict[str, Any]],
    max_attempts: int,
    require_execution: bool = False,
) -> int:
    return sum(
        1
        for op in operations
        for model in models
        if pair_is_complete(op["id"], model, attempts, max_attempts, require_execution)
    )


def format_progress_bar(done: int, total: int, width: int = 24) -> str:
    if total <= 0:
        return f"[{'-' * width}]"
    ratio = min(1.0, done / total)
    filled = int(width * ratio)
    if filled >= width:
        bar = "=" * width
    elif filled == 0:
        bar = ">" + "-" * (width - 1)
    else:
        bar = "=" * filled + ">" + "-" * (width - filled - 1)
    return f"[{bar}]"


def print_progress(done: int, total: int, rec: Dict[str, Any], *, max_attempts: int) -> None:
    pct = (done / total * 100.0) if total else 0.0
    if not rec.get("execution_eval_skipped", True):
        status = "exec_valid" if rec.get("execution_valid") else str(rec.get("error_type") or "exec_invalid")
    else:
        status = "valid" if rec.get("syntax_valid") else str(rec.get("error_type") or "invalid")
    att = int(rec.get("attempt") or 0)
    print(
        "{bar} {done}/{total} ({pct:5.1f}%) "
        "model={model} op={op} att={att}/{max_att} status={status} latency={latency:.2f}s".format(
            bar=format_progress_bar(done, total),
            done=done,
            total=total,
            pct=pct,
            model=rec.get("model", ""),
            op=rec.get("operation_id", ""),
            att=att,
            max_att=max_attempts,
            status=status,
            latency=float(rec.get("latency_sec") or 0.0),
        ),
        flush=True,
    )


def reindex(
    attempts: List[Dict[str, Any]], max_attempts: int
) -> Tuple[Dict[Tuple[str, str], List[Dict[str, Any]]], Set[Tuple[str, str]]]:
    by_key: Dict[Tuple[str, str], List[Dict[str, Any]]] = defaultdict(list)
    for row in attempts:
        by_key[(row["operation_id"], row["model"])].append(row)
    succeeded: Set[Tuple[str, str]] = set()
    for key, rows in by_key.items():
        rows.sort(key=lambda r: int(r["attempt"]))
        if any(r.get("syntax_valid") for r in rows):
            succeeded.add(key)
    return by_key, succeeded


def write_summary(
    output_dir: Path,
    operations: List[Dict[str, Any]],
    models: List[str],
    max_attempts: int,
) -> None:
    attempts = read_jsonl(output_dir / "attempts.jsonl")
    op_ids = {op["id"] for op in operations}
    op_case = {op["id"]: op["case_study"] for op in operations}
    op_requirement = {
        op["id"]: op.get("requirement_group_id") or op.get("requirement_hash") or op["id"]
        for op in operations
    }
    by_key, succeeded = reindex(attempts, max_attempts)

    def agg(model: str, op_set: Set[str]) -> Dict[str, Any]:
        total = len(op_set)
        valid = sum(1 for oid in op_set if (oid, model) in succeeded)
        execution_valid = sum(
            1
            for oid in op_set
            if any(
                r.get("execution_valid")
                for r in by_key.get((oid, model), [])
            )
        )
        valid_at = {k: 0 for k in range(1, max_attempts + 1)}
        pass_at = {k: 0 for k in range(1, max_attempts + 1)}
        for oid in op_set:
            rows = sorted(by_key.get((oid, model), []), key=lambda r: int(r["attempt"]))
            for k in range(1, max_attempts + 1):
                if any(int(r["attempt"]) <= k and r.get("syntax_valid") for r in rows):
                    valid_at[k] += 1
                if any(int(r["attempt"]) <= k and r.get("execution_valid") for r in rows):
                    pass_at[k] += 1
        rates = {k: (100.0 * valid_at[k] / total) if total else 0.0 for k in valid_at}
        pass_rates = {k: (100.0 * pass_at[k] / total) if total else 0.0 for k in pass_at}
        return {
            "model": model,
            "total_operations": total,
            "syntax_valid_count": valid,
            "syntax_validity_rate": (100.0 * valid / total) if total else 0.0,
            "execution_success_count": execution_valid,
            "execution_success_rate": (100.0 * execution_valid / total) if total else 0.0,
            "valid_at_counts": valid_at,
            "valid_at_rates": rates,
            "pass_at_counts": pass_at,
            "pass_at_rates": pass_rates,
        }

    model_rows = [agg(m, op_ids) for m in models]
    case_rows: List[Dict[str, Any]] = []
    cases = sorted({op_case[oid] for oid in op_ids})
    for m in models:
        for c in cases:
            ops_c = {oid for oid in op_ids if op_case.get(oid) == c}
            if ops_c:
                case_rows.append({**agg(m, ops_c), "case_study": c})

    with (output_dir / "baseline_validity_by_model.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "model",
                "total_operations",
                "syntax_valid_count",
                "syntax_validity_rate",
            ]
        )
        for r in model_rows:
            w.writerow(
                [
                    r["model"],
                    r["total_operations"],
                    r["syntax_valid_count"],
                    f"{r['syntax_validity_rate']:.4f}",
                ]
            )

    with (output_dir / "baseline_execution_by_model.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "model",
                "total_operations",
                "execution_success_count",
                "execution_success_rate",
            ]
        )
        for r in model_rows:
            w.writerow(
                [
                    r["model"],
                    r["total_operations"],
                    r["execution_success_count"],
                    f"{r['execution_success_rate']:.4f}",
                ]
            )

    def write_evaluation_unit_metric(
        path: Path,
        metric_field: str,
        success_name: str,
        rate_name: str,
    ) -> None:
        requirement_groups: Dict[str, Set[str]] = defaultdict(set)
        for operation_id in op_ids:
            requirement_groups[str(op_requirement[operation_id])].add(operation_id)

        def operation_succeeds(operation_id: str, model: str) -> bool:
            return any(
                bool(row.get(metric_field))
                for row in by_key.get((operation_id, model), [])
            )

        with path.open("w", newline="", encoding="utf-8") as f:
            w = csv.writer(f)
            w.writerow(
                [
                    "model",
                    "evaluation_unit",
                    "total_units",
                    success_name,
                    f"non_{success_name}",
                    rate_name,
                ]
            )
            for model in models:
                instance_success = sum(
                    1 for operation_id in op_ids if operation_succeeds(operation_id, model)
                )
                instance_rate = 100.0 * instance_success / len(op_ids) if op_ids else 0.0
                w.writerow(
                    [
                        model,
                        "operation_context_instance",
                        len(op_ids),
                        instance_success,
                        len(op_ids) - instance_success,
                        f"{instance_rate:.4f}",
                    ]
                )

                requirement_success = sum(
                    1
                    for group in requirement_groups.values()
                    if all(operation_succeeds(operation_id, model) for operation_id in group)
                )
                requirement_total = len(requirement_groups)
                requirement_rate = (
                    100.0 * requirement_success / requirement_total
                    if requirement_total
                    else 0.0
                )
                w.writerow(
                    [
                        model,
                        "distinct_requirement_strict",
                        requirement_total,
                        requirement_success,
                        requirement_total - requirement_success,
                        f"{requirement_rate:.4f}",
                    ]
                )

    write_evaluation_unit_metric(
        output_dir / "rq1_syntax_validity_by_evaluation_unit.csv",
        "syntax_valid",
        "syntax_valid_count",
        "syntax_validity_rate",
    )
    write_evaluation_unit_metric(
        output_dir / "rq2_execution_success_by_evaluation_unit.csv",
        "execution_valid",
        "execution_success_count",
        "execution_success_rate",
    )

    hdr = ["model", "total_operations"] + [f"valid_at_{k}_rate" for k in range(1, max_attempts + 1)]
    with (output_dir / "baseline_valid_at_k_by_model.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(hdr)
        for r in model_rows:
            w.writerow(
                [r["model"], r["total_operations"]]
                + [f"{r['valid_at_rates'][k]:.4f}" for k in range(1, max_attempts + 1)]
            )

    hdr = ["model", "total_operations"] + [f"pass_at_{k}_rate" for k in range(1, max_attempts + 1)]
    with (output_dir / "baseline_pass_at_k_by_model.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(hdr)
        for r in model_rows:
            w.writerow(
                [r["model"], r["total_operations"]]
                + [f"{r['pass_at_rates'][k]:.4f}" for k in range(1, max_attempts + 1)]
            )

    with (output_dir / "baseline_validity_by_case.csv").open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(
            [
                "model",
                "case_study",
                "total_operations",
                "syntax_valid_count",
                "syntax_validity_rate",
                "execution_success_count",
                "execution_success_rate",
            ]
        )
        for r in case_rows:
            w.writerow(
                [
                    r["model"],
                    r["case_study"],
                    r["total_operations"],
                    r["syntax_valid_count"],
                    f"{r['syntax_validity_rate']:.4f}",
                    r["execution_success_count"],
                    f"{r['execution_success_rate']:.4f}",
                ]
            )

    summary = {
        "study_version": STUDY_VERSION,
        "experiment": "baseline_llm_only",
        "treatment": "purellm_fixed_independent_sampling",
        "sampling_protocol_version": PURELLM_PROTOCOL_VERSION,
        "sampling_protocol": {
            "samples_per_operation_model_pair": max_attempts,
            "feedback_to_model": False,
            "validation_guided_early_stopping": False,
            "selection": "post_hoc_valid_at_k_and_pass_at_k",
        },
        "generated_at": utc_now_iso(),
        "max_attempts": max_attempts,
        "by_model": model_rows,
        "by_case": case_rows,
    }
    (output_dir / "summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8"
    )


def parse_models(s: str) -> List[str]:
    parts = [x.strip() for x in s.split(",") if x.strip()]
    for m in parts:
        if m not in ALL_MODELS:
            raise argparse.ArgumentTypeError(f"unknown model {m}; allowed: {ALL_MODELS}")
    return parts


def main() -> None:
    p = argparse.ArgumentParser(description="Pure-LLM baseline (standalone script).")
    p.add_argument("--input", default="data/operations.jsonl")
    p.add_argument(
        "--output-dir",
        default=f"{STUDY_RESULTS_ROOT}/baselines/purellm",
    )
    p.add_argument("--models", default="gpt-5.4", type=parse_models)
    p.add_argument(
        "--max-attempts",
        type=int,
        default=5,
        help="Fixed number of independent samples per operation-model pair (1-5).",
    )
    p.add_argument("--limit", type=int, default=0)
    p.add_argument("--temperature", type=float, default=0.2)
    p.add_argument("--max-tokens", type=int, default=4096)
    p.add_argument("--http-timeout", type=float, default=120.0)
    p.add_argument("--sleep-between-calls", type=float, default=1.0)
    p.add_argument(
        "--validate-cmd",
        default="npx tsx script/validate-remodel-contract.ts {input_file}",
        help='External validator with {input_file}, e.g. npx tsx script/validate-remodel-contract.ts {input_file}',
    )
    p.add_argument("--parser-use-shell", action="store_true")
    p.add_argument("--parser-timeout", type=int, default=60)
    p.add_argument(
        "--eval-next-base-url",
        default=os.environ.get("NEXT_EVAL_BASE_URL", "http://127.0.0.1:3000"),
        help="Required Next.js app origin for common OCLTSVM/Jest post-hoc evaluation.",
    )
    p.add_argument("--eval-timeout", type=float, default=600.0)
    p.add_argument("--force", action="store_true")
    p.add_argument("--analyze-only", action="store_true")
    args = p.parse_args()
    if args.max_attempts < 1 or args.max_attempts > 5:
        p.error("--max-attempts must be between 1 and 5 independent samples")
    if not args.eval_next_base_url.strip():
        p.error("--eval-next-base-url is required for the frozen PureLLM study")

    load_env_file(repo_root() / ".env")
    output_dir = Path(args.output_dir)
    setup_logging(output_dir / "logs")

    attempts_path = output_dir / "attempts.jsonl"
    tmp_dir = output_dir / "_tmp_contracts"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    input_path = Path(args.input)
    operations: List[Dict[str, Any]] = []
    if input_path.exists():
        with input_path.open("r", encoding="utf-8") as f:
            for i, line in enumerate(f, 1):
                line = line.strip()
                if not line:
                    continue
                try:
                    row = json.loads(line)
                except json.JSONDecodeError as exc:
                    raise ValueError(f"{input_path}:{i}: invalid JSON: {exc}") from exc
                op = safe_operation(row, i)
                if op:
                    operations.append(op)
    if len(operations) != EXPECTED_OPERATION_COUNT:
        raise RuntimeError(
            f"Expected {EXPECTED_OPERATION_COUNT} canonical operations in {input_path}, "
            f"found {len(operations)}"
        )
    if len({op["id"] for op in operations}) != len(operations):
        raise RuntimeError(f"Duplicate operation ids in {input_path}")
    assert_generation_configuration(args.temperature, args.max_tokens)
    if args.limit > 0:
        operations = operations[: args.limit]

    existing = read_jsonl(attempts_path)
    assert_existing_records_match_manifest(
        existing,
        operations,
        PURELLM_PROMPT_VERSION,
        "json",
        args.temperature,
        args.max_tokens,
        sampling_protocol_version=PURELLM_PROTOCOL_VERSION,
        expected_generation_prompt_hashes={
            operation["id"]: sha256_text(CONTRACTGEN_SYSTEM_PROMPT)
            for operation in operations
        },
    )

    if args.analyze_only:
        if not attempts_path.is_file():
            raise FileNotFoundError(f"analyze-only requires {attempts_path}")
        if not operations:
            logging.error("analyze-only needs --input with operations")
            sys.exit(1)
        write_summary(output_dir, operations, args.models, args.max_attempts)
        logging.info("Wrote summary under %s", output_dir)
        return

    if not operations:
        logging.error("No operations loaded from %s", input_path)
        sys.exit(1)

    if args.force:
        assert_force_target_is_current_study(existing)
        for fp in [attempts_path, output_dir / "summary.json"]:
            if fp.exists():
                fp.unlink()
        for pat in ("baseline_*.csv",):
            for f in output_dir.glob(pat):
                f.unlink()
        existing = []

    validate_cmd = args.validate_cmd.strip() or None
    eval_next_base_url = args.eval_next_base_url.strip()
    require_execution_success = bool(eval_next_base_url)
    planned = len(operations) * len(args.models)
    pairs_completed = count_completed_pairs(
        operations,
        args.models,
        existing,
        args.max_attempts,
        require_execution_success,
    )
    print(f"Baseline LLM: {len(operations)} ops x {len(args.models)} models = {planned} pairs")
    if pairs_completed:
        print(
            f"Resuming: {pairs_completed}/{planned} pairs already complete "
            f"({format_progress_bar(pairs_completed, planned)})",
            flush=True,
        )

    for op in operations:
        oid = op["id"]
        for model in args.models:
            if pair_is_complete(
                oid, model, existing, args.max_attempts, require_execution_success
            ):
                continue
            start_att = (
                max(
                    (int(r["attempt"]) for r in existing if r["operation_id"] == oid and r["model"] == model),
                    default=0,
                )
                + 1
            )
            prompt = build_prompt(op)
            messages = build_messages(op)
            for att in range(start_att, args.max_attempts + 1):
                t0 = time.perf_counter()
                err_type = ""
                raw = ""
                try:
                    raw = call_llm(
                        model,
                        messages,
                        temperature=args.temperature,
                        max_tokens=args.max_tokens,
                        timeout=args.http_timeout,
                    )
                except Exception as exc:
                    logging.exception("LLM failed op=%s model=%s att=%s", oid, model, att)
                    raise RuntimeError(
                        "LLM infrastructure failed; no experimental attempt was consumed "
                        f"(op={oid}, model={model}, attempt={att})"
                    ) from exc
                ext = extract_contract_text(raw, op)
                contract = ext["contract"]
                if validate_cmd and contract:
                    safe_oid = re.sub(r"[^\w\-.]", "_", oid)[:100]
                    safe_model = re.sub(r"[^\w\-.]", "_", model)[:60]
                    vpath = tmp_dir / f"{safe_oid}__{safe_model}__{att}.contract"
                    val = validate_contract_file(
                        contract,
                        vpath,
                        validate_cmd,
                        args.parser_timeout,
                        args.parser_use_shell,
                    )
                elif validate_cmd:
                    val = {
                        "syntax_valid": False,
                        "validate_skipped": False,
                        "validate_stderr": "empty_contract",
                    }
                else:
                    val = {
                        "syntax_valid": ext["extraction_ok"],
                        "validate_skipped": True,
                        "validate_stderr": "",
                    }
                if err_type:
                    val["syntax_valid"] = False
                if not ext["extraction_ok"] and not err_type:
                    err_type = "extraction_failed"
                eval_res: Dict[str, Any] = {
                    "execution_eval_skipped": not bool(eval_next_base_url),
                    "execution_valid": False,
                }
                if eval_next_base_url and ext["extraction_ok"]:
                    eval_res = evaluate_contract_with_next(
                        eval_next_base_url,
                        op,
                        contract,
                        ext,
                        args.eval_timeout,
                    )
                raise_if_evaluation_infrastructure_error(eval_res, oid, model, att)
                syntax_valid = (
                    bool(eval_res.get("contract_parse_ok"))
                    if eval_next_base_url and not eval_res.get("execution_eval_skipped")
                    else bool(val.get("syntax_valid"))
                )
                pre_execution_valid = (
                    syntax_valid
                    and bool(eval_res.get("typescript_generation_ok"))
                    and bool(eval_res.get("typescript_parse_ok"))
                    if eval_next_base_url
                    else syntax_valid
                )
                if not ext["extraction_ok"]:
                    validation_stage = "output_extraction"
                    final_error_type = "extraction_failed"
                elif not syntax_valid:
                    validation_stage = "parser"
                    final_error_type = "syntax_invalid"
                elif not bool(eval_res.get("typescript_generation_ok")):
                    validation_stage = "typescript_generator"
                    final_error_type = "typescript_generation_invalid"
                elif not bool(eval_res.get("typescript_parse_ok")):
                    validation_stage = "typescript_parser"
                    final_error_type = "typescript_parse_invalid"
                elif not bool(eval_res.get("test_execution_ok")):
                    validation_stage = "jest"
                    final_error_type = "execution_invalid"
                else:
                    validation_stage = "passed"
                    final_error_type = "none"
                rec = {
                    "study_version": STUDY_VERSION,
                    "treatment": "purellm",
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
                    "generation_prompt_version": PURELLM_PROMPT_VERSION,
                    "generation_prompt_hash": sha256_text(CONTRACTGEN_SYSTEM_PROMPT),
                    "generation_request_hash": sha256_text(prompt),
                    "sampling_protocol": "fixed_independent_samples",
                    "sampling_protocol_version": PURELLM_PROTOCOL_VERSION,
                    "generation_config_version": EXPECTED_GENERATION_CONFIG_VERSION,
                    "generation_config_hash": generation_configuration_hash(
                        "json", args.temperature, args.max_tokens
                    ),
                    "generation_grammar_version": op.get("generation_grammar_version", ""),
                    "generation_grammar_hash": op.get("generation_grammar_hash", ""),
                    "generation_rules_version": op.get("generation_rules_version", ""),
                    "generation_rules_hash": op.get("generation_rules_hash", ""),
                    "generation_output_mode": "json",
                    "generation_temperature": args.temperature,
                    "generation_max_tokens": args.max_tokens,
                    "model": model,
                    "attempt": att,
                    "prompt": prompt,
                    "raw_output": raw,
                    "contract": contract,
                    "definition": ext.get("definition"),
                    "precondition": ext.get("precondition", ""),
                    "postcondition": ext.get("postcondition", ""),
                    "json_parsed": ext["json_parsed"],
                    "extraction_ok": ext["extraction_ok"],
                    "syntax_valid": syntax_valid,
                    "pre_execution_valid": pre_execution_valid,
                    "external_syntax_valid": bool(val.get("syntax_valid")),
                    "execution_valid": bool(eval_res.get("execution_valid")),
                    "typescript_valid": bool(eval_res.get("typescript_generation_ok"))
                    and bool(eval_res.get("typescript_parse_ok")),
                    "jest_passed": bool(eval_res.get("test_execution_ok")),
                    "final_pass": bool(eval_res.get("execution_valid")),
                    "validation_stage": validation_stage,
                    "validate_skipped": bool(val.get("validate_skipped")),
                    "error_type": err_type or final_error_type,
                    "latency_sec": round(time.perf_counter() - t0, 4),
                    "timestamp": utc_now_iso(),
                    **{k: v for k, v in val.items() if k != "syntax_valid"},
                    **eval_res,
                }
                append_jsonl(attempts_path, rec)
                existing.append(rec)
                pair_done = att >= args.max_attempts
                if pair_done and not pair_is_complete(
                    oid,
                    model,
                    existing[:-1],
                    args.max_attempts,
                    require_execution_success,
                ):
                    pairs_completed += 1
                print_progress(
                    pairs_completed, planned, rec, max_attempts=args.max_attempts
                )
                time.sleep(max(0.0, args.sleep_between_calls))

    write_summary(output_dir, operations, args.models, args.max_attempts)
    logging.info("Done. Results: %s", output_dir.resolve())


if __name__ == "__main__":
    main()
