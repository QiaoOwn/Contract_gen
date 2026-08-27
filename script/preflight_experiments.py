#!/usr/bin/env python3
"""Fail-fast preflight for a clean Contract Gen v5 study run."""

from __future__ import annotations

import hashlib
import json
import os
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List


ROOT = Path(__file__).resolve().parents[1]
RESULTS = ROOT / "results"
STUDY_VERSION = "contractgen-study-v6"
STUDY_ROOT = RESULTS / STUDY_VERSION
INPUT_SCHEMA_VERSION = "contractgen-operation-input-v3"
PROMPT_VERSION = "contractgen-system-prompt-v7"
GENERATION_CONFIG_VERSION = "llm-generation-config-v5"
GENERATION_GRAMMAR_VERSION = "ocl-generation-grammar-v2"
GENERATION_RULES_VERSION = "ocl-generation-rules-v4"
GENERATION_OUTPUT_MODE = "json"
GENERATION_TEMPERATURE = 0.2
GENERATION_MAX_TOKENS = 4096
REASONING_POLICY = {
    "gpt5ReasoningEffort": "none",
    "gemini35FlashThinkingLevel": "minimal",
    "claudeOpus47Effort": "low",
    "qwen3CoderThinkingEnabled": False,
}
EXPECTED_OPERATIONS = 114
EXPECTED_ORACLES = 107
EXPECTED_REQUIREMENTS = 106
HASH = re.compile(r"^[0-9a-f]{64}$")


def read_jsonl(path: Path) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    with path.open("r", encoding="utf-8-sig") as handle:
        for line_no, raw in enumerate(handle, 1):
            if not raw.strip():
                continue
            try:
                value = json.loads(raw)
            except json.JSONDecodeError as exc:
                raise ValueError(f"{path}:{line_no}: invalid JSON: {exc}") from exc
            if not isinstance(value, dict):
                raise ValueError(f"{path}:{line_no}: expected a JSON object")
            rows.append(value)
    return rows


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def generation_configuration_hash(
    output_mode: str, temperature: float, max_tokens: int
) -> str:
    values = {
        "outputMode": output_mode,
        "temperature": temperature,
        "maxTokens": max_tokens,
        "reasoningPolicy": REASONING_POLICY,
    }
    return sha256(json.dumps(values, ensure_ascii=False, separators=(",", ":")))


def validate_manifest(path: Path) -> Dict[str, Dict[str, Any]]:
    rows = read_jsonl(path)
    by_id = {str(row.get("id") or ""): row for row in rows}
    if len(rows) != EXPECTED_OPERATIONS or len(by_id) != EXPECTED_OPERATIONS or "" in by_id:
        raise ValueError(
            f"Expected {EXPECTED_OPERATIONS} unique operations; got {len(rows)} rows and "
            f"{len(by_id)} ids"
        )
    prompt_hashes = set()
    oracle_ids = set()
    requirement_group_ids = set()
    for line_no, row in enumerate(rows, 1):
        canonical = str(row.get("canonical_user_message") or "")
        requirement = str(row.get("description") or "")
        context = str(row.get("model_context") or "")
        checks = {
            "input schema": row.get("input_schema_version") == INPUT_SCHEMA_VERSION,
            "prompt version": row.get("prompt_version") == PROMPT_VERSION,
            "oracle isolation": row.get("oracle_available_to_generator") is False,
            "oracle id": bool(str(row.get("oracle_id") or "").strip()),
            "requirement group id": row.get("requirement_group_id")
            == row.get("requirement_hash"),
            "return-value marker": isinstance(row.get("has_return_value"), bool),
            "input hash": row.get("input_hash") == sha256(canonical),
            "requirement hash": row.get("requirement_hash") == sha256(requirement),
            "context hash": row.get("context_hash") == sha256(context),
            "prompt hash shape": bool(HASH.fullmatch(str(row.get("prompt_hash") or ""))),
            "generation config version": row.get("generation_config_version")
            == GENERATION_CONFIG_VERSION,
            "generation grammar version": row.get("generation_grammar_version")
            == GENERATION_GRAMMAR_VERSION,
            "generation grammar hash": bool(
                HASH.fullmatch(str(row.get("generation_grammar_hash") or ""))
            ),
            "generation rules version": row.get("generation_rules_version")
            == GENERATION_RULES_VERSION,
            "generation rules hash": bool(
                HASH.fullmatch(str(row.get("generation_rules_hash") or ""))
            ),
            "generation config hash": row.get("generation_config_hash")
            == generation_configuration_hash(
                GENERATION_OUTPUT_MODE,
                GENERATION_TEMPERATURE,
                GENERATION_MAX_TOKENS,
            ),
            "generation output mode": row.get("generation_output_mode")
            == GENERATION_OUTPUT_MODE,
            "generation temperature": row.get("generation_temperature")
            == GENERATION_TEMPERATURE,
            "generation max tokens": row.get("generation_max_tokens")
            == GENERATION_MAX_TOKENS,
            "intent section": "Operation intent:" in requirement,
            "precondition section": "Preconditions:" in requirement,
            "postcondition section": "Postconditions:" in requirement,
            "requirement embedded": requirement in canonical,
            "context embedded": context in canonical,
            "temporal environment declared": "Today: Date" in context
            and "Now: Date" in context,
        }
        failed = [name for name, ok in checks.items() if not ok]
        if failed:
            raise ValueError(
                f"{path}:{line_no} ({row.get('id')}): failed {', '.join(failed)}"
            )
        prompt_hashes.add(str(row["prompt_hash"]))
        oracle_ids.add(str(row["oracle_id"]))
        requirement_group_ids.add(str(row["requirement_group_id"]))
    if len(prompt_hashes) != 1:
        raise ValueError(f"Expected one frozen system-prompt hash, found {len(prompt_hashes)}")
    if len(oracle_ids) != EXPECTED_ORACLES:
        raise ValueError(
            f"Expected {EXPECTED_ORACLES} distinct service-operation oracles, found {len(oracle_ids)}"
        )
    if len(requirement_group_ids) != EXPECTED_REQUIREMENTS:
        raise ValueError(
            f"Expected {EXPECTED_REQUIREMENTS} distinct requirement specifications, "
            f"found {len(requirement_group_ids)}"
        )
    return by_id


def validate_attempt_file(path: Path, manifest: Dict[str, Dict[str, Any]]) -> int:
    rows = read_jsonl(path)
    seen = set()
    for line_no, row in enumerate(rows, 1):
        operation_id = str(row.get("operation_id") or "")
        operation = manifest.get(operation_id)
        shared_prompt_hash = row.get("shared_prompt_hash") or row.get("prompt_hash")
        attempt = int(row.get("attempt") or row.get("attempt_id") or 0)
        model = str(row.get("model") or row.get("model_name") or "")
        checks = {
            "study version": row.get("study_version") == STUDY_VERSION,
            "input schema": row.get("input_schema_version") == INPUT_SCHEMA_VERSION,
            "known operation": operation is not None,
            "input hash": bool(operation) and row.get("input_hash") == operation.get("input_hash"),
            "shared prompt hash": bool(operation)
            and shared_prompt_hash == operation.get("prompt_hash"),
            "generation prompt version": bool(row.get("generation_prompt_version")),
            "generation prompt hash": bool(
                HASH.fullmatch(str(row.get("generation_prompt_hash") or ""))
            ),
            "generation config version": row.get("generation_config_version")
            == GENERATION_CONFIG_VERSION,
            "generation config hash": row.get("generation_config_hash")
            == generation_configuration_hash(
                str(row.get("generation_output_mode") or ""),
                row.get("generation_temperature"),
                row.get("generation_max_tokens"),
            ),
            "generation output mode": row.get("generation_output_mode") in {"json", "text"},
            "generation temperature": row.get("generation_temperature")
            == GENERATION_TEMPERATURE,
            "generation max tokens": row.get("generation_max_tokens")
            == GENERATION_MAX_TOKENS,
            "model": bool(model),
            "attempt": attempt > 0,
        }
        failed = [name for name, ok in checks.items() if not ok]
        if failed:
            raise ValueError(f"{path}:{line_no}: failed {', '.join(failed)}")
        key = (operation_id, model, attempt)
        if key in seen:
            raise ValueError(f"{path}:{line_no}: duplicate attempt key {key}")
        seen.add(key)
    return len(rows)


def load_env(path: Path) -> Dict[str, str]:
    values = dict(os.environ)
    if path.is_file():
        for raw in path.read_text(encoding="utf-8-sig").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            values.setdefault(key.strip(), value.strip().strip('"').strip("'"))
    return values


def iter_attempt_files(root: Path) -> Iterable[Path]:
    return root.rglob("attempts.jsonl") if root.exists() else ()


def read_first_record_for_inventory(path: Path) -> Dict[str, Any]:
    """Read only enough legacy data to detect a misplaced current-study file."""
    with path.open("r", encoding="utf-8-sig") as handle:
        for raw in handle:
            if not raw.strip():
                continue
            try:
                value = json.loads(raw)
            except json.JSONDecodeError:
                return {}
            return value if isinstance(value, dict) else {}
    return {}


def main() -> None:
    manifest = validate_manifest(ROOT / "data" / "operations.jsonl")
    current_files = list(iter_attempt_files(STUDY_ROOT))
    current_rows = sum(validate_attempt_file(path, manifest) for path in current_files)

    misplaced_current: List[Path] = []
    legacy_files = 0
    for path in iter_attempt_files(RESULTS):
        if STUDY_ROOT in path.parents:
            continue
        legacy_files += 1
        first = read_first_record_for_inventory(path)
        if first.get("study_version") == STUDY_VERSION:
            misplaced_current.append(path)
    if misplaced_current:
        raise ValueError(
            f"Current-study results exist outside the isolated {STUDY_VERSION} root: "
            + ", ".join(str(path) for path in misplaced_current[:5])
        )

    env = load_env(ROOT / ".env")
    missing_env = [name for name in ("OPENAI_API_KEY", "OPENAI_BASE_URL") if not env.get(name)]
    if missing_env:
        raise ValueError("Missing experiment environment variables: " + ", ".join(missing_env))

    prompt_hash = next(iter({row["prompt_hash"] for row in manifest.values()}))
    print(
        f"PASS canonical manifest: {len(manifest)} operation-context instances, "
        f"{EXPECTED_ORACLES} distinct service operations, "
        f"{EXPECTED_REQUIREMENTS} distinct requirement specifications"
    )
    print(f"PASS input schema: {INPUT_SCHEMA_VERSION}")
    print(f"PASS system prompt: {PROMPT_VERSION} ({prompt_hash})")
    print(
        "PASS generation configuration: "
        f"{GENERATION_CONFIG_VERSION} "
        f"({GENERATION_OUTPUT_MODE}, temperature={GENERATION_TEMPERATURE}, "
        f"max_tokens={GENERATION_MAX_TOKENS})"
    )
    print(f"PASS oracle isolation: reference contracts are unavailable to the generator")
    print(
        f"PASS {STUDY_VERSION} result namespace: "
        f"{len(current_files)} files, {current_rows} records"
    )
    print(
        f"INFO legacy result files excluded from {STUDY_VERSION} tools: {legacy_files}"
    )
    print("PASS provider configuration: OPENAI_API_KEY and OPENAI_BASE_URL are set")


if __name__ == "__main__":
    main()
