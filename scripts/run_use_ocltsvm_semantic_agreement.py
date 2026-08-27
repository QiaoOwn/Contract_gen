#!/usr/bin/env python3
"""Prepare and run a USE--OCLTSVM semantic agreement experiment.

The experiment is deliberately scenario based.  ``prepare`` selects a
deterministic, stratified sample and writes scenario templates.  ``run`` only
computes agreement for scenarios for which a validator produced an explicit
Boolean semantic decision.  Missing or unsupported cases remain visible and
are never counted as agreements.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
import re
import subprocess
import sys
import time
from collections import Counter
from pathlib import Path
from typing import Any, Iterable


SCHEMA_VERSION = "use-ocltsvm-semantic-agreement-v1"
DEFAULT_OPERATIONS = "data/operations.jsonl"
DEFAULT_ATTEMPTS = (
    "results/contractgen-study-v6/contract_gen/full_feedback/"
    "gpt-5.5/attempts.jsonl"
)
DEFAULT_OUTPUT = (
    "results/contractgen-study-v6/validation/use_ocltsvm_semantic_agreement"
)
CHECK_BALANCE_ID = "AutomatedTellerMachine_checkBalance_checkBalance"
VALIDATORS = ("use", "ocltsvm", "jest")
DEFAULT_DECISION_REGEX = (
    r"(?:SEMANTIC_DECISION\s*:\s*|->\s*)(true|false)"
    r"(?:\s*:\s*Boolean)?"
)


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_no}: invalid JSON: {exc}") from exc
    return rows


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def safe_name(value: str) -> str:
    return re.sub(r"[^A-Za-z0-9_.-]+", "_", value).strip("_")[:180]


def choose_attempts(
    rows: Iterable[dict[str, Any]], model: str, operation_ids: set[str]
) -> dict[str, dict[str, Any]]:
    """Match the paper's selected-candidate policy: valid first, then earliest."""

    def score(row: dict[str, Any]) -> tuple[int, int, int, int]:
        return (
            int(row.get("syntax_valid") is True),
            int(row.get("extraction_success") is True),
            int(bool(row.get("extracted_ocl") or row.get("contract"))),
            -int(row.get("attempt") or 999),
        )

    selected: dict[str, dict[str, Any]] = {}
    for row in rows:
        if str(row.get("model") or "") != model:
            continue
        operation_id = str(row.get("operation_id") or "")
        if operation_id not in operation_ids:
            continue
        if operation_id not in selected or score(row) > score(selected[operation_id]):
            selected[operation_id] = row
    missing = sorted(operation_ids - set(selected))
    if missing:
        raise ValueError(
            f"Missing {len(missing)} selected candidates for {model}: {missing[:5]}"
        )
    return selected


def contract_text(attempt: dict[str, Any]) -> str:
    return str(attempt.get("extracted_ocl") or attempt.get("contract") or "")


def detect_constructs(contract: str) -> list[str]:
    checks = {
        "definition": r"(?im)^\s*definition\s*:",
        "precondition": r"(?im)^\s*precondition\s*:",
        "postcondition": r"(?im)^\s*postcondition\s*:",
        "allInstances": r"\.allInstances\s*\(",
        "collection": r"->\s*(?:select|collect|any|exists|forAll|includes|excludes|isEmpty|notEmpty|size)\b",
        "iterator": r"->\s*(?:select|collect|any|exists|forAll)\b",
        "conditional": r"\bif\b[\s\S]*?\bthen\b[\s\S]*?\bendif\b",
        "temporal_at_pre": r"@pre\b",
        "new_object": r"\.oclIsNew\s*\(",
        "undefined": r"\.oclIsUndefined\s*\(",
        "type_test": r"\.oclIs(?:Type|Kind)Of\s*\(",
        "enumeration": r"\b[A-Z][A-Za-z0-9_]*::[A-Z][A-Z0-9_]*\b",
        "repository_update": r"allInstances\s*\(\s*\)\s*->\s*(?:includes|excludes)",
        "navigation_update": r"\.[A-Za-z_][A-Za-z0-9_]*\s*->\s*(?:includes|excludes)",
    }
    return [name for name, pattern in checks.items() if re.search(pattern, contract)]


def complexity_score(operation: dict[str, Any], contract: str, constructs: list[str]) -> int:
    return (
        len(contract.splitlines())
        + 4 * len(constructs)
        + 3 * len(operation.get("parameters") or [])
        + len(str(operation.get("model_context") or "")) // 1800
    )


def assign_tiers(candidates: list[dict[str, Any]]) -> None:
    ordered = sorted(candidates, key=lambda row: (row["complexity_score"], row["operation_id"]))
    total = len(ordered)
    for index, row in enumerate(ordered):
        third = min(2, (3 * index) // max(1, total))
        row["complexity_tier"] = ("simple", "medium", "complex")[third]


def stratified_sample(
    candidates: list[dict[str, Any]], sample_size: int, seed: int
) -> list[dict[str, Any]]:
    if sample_size <= 0 or sample_size > len(candidates):
        raise ValueError(f"sample size must be between 1 and {len(candidates)}")
    rng = random.Random(seed)
    tiers = ("simple", "medium", "complex")
    tier_quota = {tier: sample_size // 3 for tier in tiers}
    for tier in tiers[: sample_size % 3]:
        tier_quota[tier] += 1

    selected: list[dict[str, Any]] = []
    covered_constructs: set[str] = set()
    case_counts: Counter[str] = Counter()
    for tier in tiers:
        pool = [row for row in candidates if row["complexity_tier"] == tier]
        rng.shuffle(pool)
        while pool and sum(row["complexity_tier"] == tier for row in selected) < tier_quota[tier]:
            minimum_case_count = min(case_counts[row["case_study"]] for row in pool)

            def priority(row: dict[str, Any]) -> tuple[int, int, int, str]:
                new_constructs = len(set(row["constructs"]) - covered_constructs)
                case_bonus = int(case_counts[row["case_study"]] == minimum_case_count)
                edge_score = row["complexity_score"] if tier == "complex" else -row["complexity_score"]
                return (new_constructs, case_bonus, edge_score, row["operation_id"])

            chosen = max(pool, key=priority)
            pool.remove(chosen)
            selected.append(chosen)
            covered_constructs.update(chosen["constructs"])
            case_counts[chosen["case_study"]] += 1

    if len(selected) != sample_size:
        raise RuntimeError(f"Could only select {len(selected)} of {sample_size} operations")
    return sorted(selected, key=lambda row: (tiers.index(row["complexity_tier"]), row["case_study"], row["operation_id"]))


def blank_validator() -> dict[str, Any]:
    return {
        "decision": None,
        "command": [],
        "working_directory": ".",
        "decision_regex": DEFAULT_DECISION_REGEX,
        "timeout_seconds": 120,
    }


def build_scenario_templates(row: dict[str, Any]) -> list[dict[str, Any]]:
    scenarios = [
        ("pre-positive", "precondition", True, "A state satisfying the generated precondition."),
        ("pre-negative", "precondition", False, "A boundary or negative state violating one precondition conjunct."),
        ("post-positive", "postcondition", True, "A paired pre/post state produced by OCLTSVM from a valid pre-state."),
    ]
    return [
        {
            "scenario_id": f"{row['operation_id']}::{suffix}",
            "clause": clause,
            "expected_decision": expected,
            "description": description,
            "status": "pending",
            "validators": {name: blank_validator() for name in VALIDATORS},
        }
        for suffix, clause, expected, description in scenarios
    ]


def configure_smoke(args: argparse.Namespace) -> None:
    """Configure a fully executable three-validator checkBalance pilot."""
    output = Path(args.output_dir)
    scenario_files = sorted((output / "scenarios").glob("*.json"))
    scenario_file = next(
        (
            path
            for path in scenario_files
            if json.loads(path.read_text(encoding="utf-8")).get("operation_id")
            == CHECK_BALANCE_ID
        ),
        None,
    )
    if scenario_file is None:
        raise FileNotFoundError(
            f"The prepared sample does not contain {CHECK_BALANCE_ID}; rerun prepare with the default seed"
        )

    smoke_dir = output / "smoke" / "check_balance"
    model_path = smoke_dir / "check_balance.use"
    command_dir = smoke_dir / "use_cmds"
    command_dir.mkdir(parents=True, exist_ok=True)
    model_path.write_text(
        """model SemanticAgreementCheckBalance

class BankCard
attributes
  Balance : Real
end

class OperationContext
attributes
  PasswordValidated : Boolean
  CardIDValidated : Boolean
  result : Real
  preBalance : Real
end

association ContextInputCard between
  OperationContext[0..1] role ContextOwner
  BankCard[0..1] role InputCard
end
""",
        encoding="utf-8",
    )
    use_commands = {
        "pre-positive": """!create ctx : OperationContext
!create card : BankCard
!set ctx.PasswordValidated := true
!set ctx.CardIDValidated := true
!set ctx.result := 9999.0
!set ctx.preBalance := 9999.0
!set card.Balance := 9999.0
!insert (ctx, card) into ContextInputCard
? ctx.PasswordValidated = true and ctx.CardIDValidated = true and ctx.InputCard.oclIsUndefined() = false
exit
""",
        "pre-negative": """!create ctx : OperationContext
!create card : BankCard
!set ctx.PasswordValidated := false
!set ctx.CardIDValidated := true
!set ctx.result := 9999.0
!set ctx.preBalance := 9999.0
!set card.Balance := 9999.0
!insert (ctx, card) into ContextInputCard
? ctx.PasswordValidated = true and ctx.CardIDValidated = true and ctx.InputCard.oclIsUndefined() = false
exit
""",
        "post-positive": """!create ctx : OperationContext
!create card : BankCard
!set ctx.PasswordValidated := true
!set ctx.CardIDValidated := true
!set ctx.result := 9999.0
!set ctx.preBalance := 9999.0
!set card.Balance := 9999.0
!insert (ctx, card) into ContextInputCard
? ctx.result = ctx.InputCard.Balance and ctx.InputCard.Balance = ctx.preBalance
exit
""",
    }
    document = json.loads(scenario_file.read_text(encoding="utf-8"))
    for scenario in document["scenarios"]:
        suffix = str(scenario["scenario_id"]).rsplit("::", 1)[-1]
        command_path = command_dir / f"{suffix}.cmd"
        command_path.write_text(use_commands[suffix], encoding="utf-8")
        scenario["status"] = "ready"
        scenario["state_provenance"] = "hand-authored shared checkBalance state v1"
        scenario["validators"]["use"].update(
            {
                "model_file": str(model_path),
                "command_file": str(command_path),
                "decision": None,
            }
        )
        for validator in ("ocltsvm", "jest"):
            scenario["validators"][validator].update(
                {
                    "decision": None,
                    "command": [
                        "npx.cmd",
                        "tsx",
                        "scripts/run-semantic-agreement-check-balance.ts",
                        "--validator",
                        validator,
                        "--scenario",
                        suffix,
                    ],
                }
            )
    document["semantic_adaptations"] = [
        "OCL @pre balance is represented by the explicit USE preBalance slot",
        "OCL result is represented by the explicit USE result slot",
    ]
    write_json(scenario_file, document)
    print(f"Configured executable checkBalance smoke scenarios in {scenario_file}")


def load_use_export() -> Any:
    script_dir = str(Path(__file__).resolve().parent)
    if script_dir not in sys.path:
        sys.path.insert(0, script_dir)
    import generate_use_strong_114

    return generate_use_strong_114


def encoded_items(value: Any) -> list[Any]:
    if isinstance(value, dict) and value.get("kind") == "collection":
        return list(value.get("items") or [])
    return []


def encoded_ref(value: Any) -> str | None:
    if isinstance(value, dict) and value.get("kind") == "ref":
        return str(value.get("id") or "") or None
    return None


def use_literal(value: Any, type_name: str, enums: dict[str, set[str]]) -> str | None:
    if isinstance(value, dict):
        if value.get("kind") == "date":
            if "epochMillis" in value:
                return str(int(value["epochMillis"]) // 1000)
            return str(int(value["epochDay"]))
        return None
    if value is None:
        return "undefined"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, int):
        return str(value)
    if isinstance(value, float):
        return str(value) if not value.is_integer() else f"{int(value)}.0"
    if isinstance(value, str):
        if type_name in enums and value in enums[type_name]:
            return f"#{value}"
        escaped = value.replace("\\", "\\\\").replace("'", "\\'")
        return f"'{escaped}'"
    return None


def inherited_members(
    entities: dict[str, Any], class_name: str, member_name: str
) -> list[Any]:
    members: list[Any] = []
    seen: set[str] = set()
    current = entities.get(class_name)
    lineage: list[Any] = []
    while current is not None:
        lineage.append(current)
        current = entities.get(current.parent) if current.parent else None
    for entity in reversed(lineage):
        for member in getattr(entity, member_name):
            if member.name not in seen:
                seen.add(member.name)
                members.append(member)
    return members


def infer_context_shape(
    operation: dict[str, Any], contract: str, use_export: Any
) -> tuple[dict[str, str], dict[str, str], dict[str, Any], dict[str, set[str]], list[tuple[str, str, str]], dict[str, str]]:
    entities, enums = use_export.parse_model_context(operation.get("model_context", ""))
    sections = use_export.parse_contract_sections(contract)
    definitions = use_export.split_definitions(sections["definition"])
    params = operation.get("parameters") or []
    self_attrs, self_navs = use_export.infer_self_context(
        definitions,
        "\n".join([sections["precondition"], sections["postcondition"]]),
        entities,
        params,
    )
    environment_text = (operation.get("model_context") or "").split("  Entities", 1)[0]
    for env_name, env_type in re.findall(
        r"^\s*\d+\.([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)\s*$",
        environment_text,
        re.M,
    ):
        parsed_type, _, _ = use_export.parse_type(env_type)
        self_attrs.setdefault(use_export.safe_ident(env_name), parsed_type)
    param_types = {
        use_export.safe_ident(param["name"]): use_export.use_type_for_param(param["type"])
        for param in params
    }
    for navigation_name in self_navs:
        self_attrs.pop(navigation_name, None)
    return self_attrs, self_navs, entities, enums, definitions, param_types


def strip_context_navigation_attributes(
    model: str, navigation_names: Iterable[str]
) -> str:
    navigation_names = set(navigation_names)
    if not navigation_names:
        return model
    lines = model.splitlines()
    in_context = False
    in_attributes = False
    retained: list[str] = []
    for line in lines:
        stripped = line.strip()
        if stripped == "class OperationContext":
            in_context = True
            in_attributes = False
        elif in_context and stripped == "attributes":
            in_attributes = True
        elif in_context and stripped in {"operations", "end"}:
            in_attributes = False
            if stripped == "end":
                in_context = False
        if in_context and in_attributes:
            match = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:", line)
            if match and match.group(1) in navigation_names:
                continue
        retained.append(line)
    return "\n".join(retained) + ("\n" if model.endswith("\n") else "")


def runtime_navigation_types(
    snapshot: dict[str, Any], entities: dict[str, Any]
) -> dict[str, str]:
    objects = {str(row["id"]): row for row in snapshot.get("objects") or []}
    root = objects.get(str(snapshot.get("rootId") or ""), {})
    runtime_navs: dict[str, str] = {}
    for name, value in (root.get("properties") or {}).items():
        target_id = encoded_ref(value)
        target = objects.get(target_id or "")
        class_name = str((target or {}).get("className") or "")
        if class_name in entities:
            runtime_navs[safe_name(str(name))] = class_name
    return runtime_navs


def append_context_associations(
    model: str, navigation_types: dict[str, str], use_export: Any
) -> str:
    additions: list[str] = []
    for role_name, target_type in sorted(navigation_types.items()):
        association = use_export.safe_ident(
            f"OperationContext_{role_name}_{target_type}"
        )
        if re.search(rf"^association\s+{re.escape(association)}\b", model, re.M):
            continue
        additions.extend(
            [
                f"association {association} between",
                "  OperationContext[0..*] role ContextOwner",
                f"  {target_type}[0..1] role {role_name}",
                "end",
                "",
            ]
        )
    if not additions:
        return model
    return model.rstrip() + "\n\n" + "\n".join(additions)


def direct_precondition_expression(
    operation: dict[str, Any], contract: str, use_export: Any
) -> str:
    self_attrs, self_navs, _, enums, definitions, param_types = infer_context_shape(
        operation, contract, use_export
    )
    enum_values = {value for values in enums.values() for value in values}
    sections = use_export.parse_contract_sections(contract)
    precondition = use_export.normalize_ocl(sections["precondition"] or "true", enum_values)
    for name, type_name, _ in definitions:
        if type_name.startswith("Set("):
            precondition = re.sub(
                rf"\b{re.escape(name)}\.oclIsUndefined\s*\(\s*\)\s*=\s*false\b",
                f"{name}->size() >= 0",
                precondition,
            )
    expression = use_export.wrap_definitions(precondition, definitions, enum_values)
    expression = re.sub(r"\bself\s*\.", "ctx.", expression)
    context_names = sorted(
        set(param_types) | set(self_attrs) | set(self_navs), key=len, reverse=True
    )
    for name in context_names:
        expression = re.sub(
            rf"(?<![A-Za-z0-9_.]){re.escape(name)}\b", f"ctx.{name}", expression
        )
    return re.sub(r"\s+", " ", expression).strip()


def state_commands(
    operation: dict[str, Any], contract: str, snapshot: dict[str, Any], use_export: Any
) -> list[str]:
    self_attrs, self_navs, entities, enums, _, param_types = infer_context_shape(
        operation, contract, use_export
    )
    objects = {str(row["id"]): row for row in snapshot.get("objects") or []}
    root = objects.get(str(snapshot.get("rootId") or ""), {})
    root_properties = root.get("properties") or {}
    self_navs.update(runtime_navigation_types(snapshot, entities))
    for navigation_name in self_navs:
        self_attrs.pop(navigation_name, None)
    commands = ["!create ctx : OperationContext"]

    for index, param in enumerate(operation.get("parameters") or []):
        name = use_export.safe_ident(param["name"])
        args = snapshot.get("args") or []
        value = args[index] if index < len(args) else {"kind": "undefined"}
        literal = use_literal(value, param_types[name], enums)
        if literal is not None:
            commands.append(f"!set ctx.{name} := {literal}")
    for name, type_name in sorted(self_attrs.items()):
        value = root_properties.get(name)
        if name not in root_properties and name in {"Today", "Now"}:
            if "capturedNowMillis" in snapshot:
                value = {"kind": "date", "epochMillis": snapshot["capturedNowMillis"]}
            else:
                value = snapshot.get("capturedEpochDay")
        if value is None and name not in root_properties:
            continue
        literal = use_literal(value, type_name, enums)
        if literal is not None and literal != "undefined":
            commands.append(f"!set ctx.{name} := {literal}")

    created: set[str] = set()
    for object_id, row in sorted(objects.items()):
        class_name = str(row.get("className") or "")
        if class_name not in entities:
            continue
        object_name = use_export.safe_ident(object_id.lower())
        commands.append(f"!create {object_name} : {class_name}")
        created.add(object_id)
    for object_id in sorted(created):
        row = objects[object_id]
        class_name = str(row["className"])
        properties = row.get("properties") or {}
        object_name = use_export.safe_ident(object_id.lower())
        for attribute in inherited_members(entities, class_name, "attributes"):
            if attribute.name not in properties:
                continue
            literal = use_literal(properties[attribute.name], attribute.type_name, enums)
            if literal is not None and literal != "undefined":
                commands.append(f"!set {object_name}.{attribute.name} := {literal}")

    inserted: set[tuple[str, str, str]] = set()
    for object_id in sorted(created):
        row = objects[object_id]
        class_name = str(row["className"])
        properties = row.get("properties") or {}
        owner_name = use_export.safe_ident(object_id.lower())
        for relationship in inherited_members(entities, class_name, "relationships"):
            encoded = properties.get(relationship.name)
            targets = [encoded] if encoded_ref(encoded) else encoded_items(encoded)
            for target in targets:
                target_id = encoded_ref(target)
                if not target_id or target_id not in created:
                    continue
                defining_class = class_name
                current = entities.get(class_name)
                while current is not None:
                    if any(rel.name == relationship.name for rel in current.relationships):
                        defining_class = current.name
                        break
                    current = entities.get(current.parent) if current.parent else None
                association = use_export.safe_ident(
                    f"{defining_class}_{relationship.name}_{relationship.type_name}"
                )
                insertion = (
                    association,
                    owner_name,
                    use_export.safe_ident(target_id.lower()),
                )
                if insertion not in inserted:
                    inserted.add(insertion)
                    commands.append(
                        f"!insert ({insertion[1]}, {insertion[2]}) into {association}"
                    )
    for role_name, target_type in sorted(self_navs.items()):
        target_id = encoded_ref(root_properties.get(role_name))
        if target_id and target_id in created:
            association = use_export.safe_ident(
                f"OperationContext_{role_name}_{target_type}"
            )
            commands.append(
                f"!insert (ctx, {use_export.safe_ident(target_id.lower())}) into {association}"
            )
    return commands


def configure_use_precondition(
    operation: dict[str, Any],
    document: dict[str, Any],
    capture: dict[str, Any],
    suffix: str,
    sample_index: int,
    output: Path,
) -> tuple[Path, Path]:
    use_export = load_use_export()
    contract = str(document.get("contract") or "")
    combined_model, _, _, _, _ = use_export.make_model(
        operation, {"extracted_ocl": contract}, sample_index
    )
    model = use_export.model_without_constraints(combined_model)
    _, self_navs, entities, _, _, _ = infer_context_shape(
        operation, contract, use_export
    )
    self_navs.update(runtime_navigation_types(capture["before"], entities))
    model = strip_context_navigation_attributes(model, self_navs)
    model = append_context_associations(model, self_navs, use_export)
    operation_dir = output / "batch" / safe_name(str(document["operation_id"]))
    model_path = operation_dir / f"{suffix}.use"
    command_path = operation_dir / f"{suffix}.cmd"
    model_path.parent.mkdir(parents=True, exist_ok=True)
    model_path.write_text(model, encoding="utf-8")
    commands = state_commands(operation, contract, capture["before"], use_export)
    commands.append(f"? {direct_precondition_expression(operation, contract, use_export)}")
    commands.append("exit")
    command_path.write_text("\n".join(commands) + "\n", encoding="utf-8")
    return model_path, command_path


def mark_unsupported(spec: dict[str, Any], reason: str) -> None:
    spec.update({"status": "unsupported", "decision": None, "command": [], "reason": reason})


def configure_batch(args: argparse.Namespace) -> None:
    output = Path(args.output_dir)
    operations = read_jsonl(Path(args.operations))
    operation_map = {str(row["id"]): row for row in operations}
    scenario_files = sorted((output / "scenarios").glob("*.json"))
    if args.operation_id:
        scenario_files = [
            path
            for path in scenario_files
            if json.loads(path.read_text(encoding="utf-8")).get("operation_id")
            == args.operation_id
        ]
    if args.limit > 0:
        scenario_files = scenario_files[: args.limit]
    capture_dir = output / "captures"
    log_dir = output / "capture_logs"
    capture_dir.mkdir(parents=True, exist_ok=True)
    log_dir.mkdir(parents=True, exist_ok=True)
    configured = Counter()

    for sample_index, scenario_file in enumerate(scenario_files, 1):
        document = json.loads(scenario_file.read_text(encoding="utf-8"))
        operation_id = str(document["operation_id"])
        operation = operation_map[operation_id]
        capture_path = capture_dir / f"{safe_name(operation_id)}.json"
        capture_failure = ""
        if args.refresh_captures or not capture_path.exists():
            command = [
                "npx.cmd",
                "tsx",
                "scripts/capture-semantic-operation.ts",
                "--operation-id",
                operation_id,
                "--model",
                args.model,
                "--attempts",
                args.attempts,
                "--output",
                str(capture_path),
            ]
            process = subprocess.run(
                command,
                text=True,
                encoding="utf-8",
                errors="replace",
                capture_output=True,
                timeout=args.capture_timeout,
                shell=False,
            )
            (log_dir / f"{safe_name(operation_id)}.log").write_text(
                (process.stdout or "") + "\n" + (process.stderr or ""), encoding="utf-8"
            )
            if process.returncode != 0:
                capture_failure = f"Jest state capture exited with code {process.returncode}"
        if not capture_path.exists():
            capture_failure = capture_failure or "Jest state capture produced no JSON output"
        if capture_failure:
            for scenario in document["scenarios"]:
                for validator in VALIDATORS:
                    mark_unsupported(scenario["validators"][validator], capture_failure)
                scenario["status"] = "unsupported"
            document["batch_configuration"] = {
                "scope": "same-pre-state positive/negative agreement",
                "capture_file": str(capture_path),
                "capture_status": "failed",
                "reason": capture_failure,
            }
            write_json(scenario_file, document)
            configured["capture_failed"] += 1
            print(f"Skipped {operation_id}: {capture_failure}")
            continue
        try:
            capture_result = json.loads(capture_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            for scenario in document["scenarios"]:
                for validator in VALIDATORS:
                    mark_unsupported(
                        scenario["validators"][validator],
                        f"Invalid Jest state capture: {exc}",
                    )
                scenario["status"] = "unsupported"
            write_json(scenario_file, document)
            configured["capture_invalid"] += 1
            print(f"Skipped {operation_id}: invalid capture JSON")
            continue
        captures = list(capture_result.get("captures") or [])
        positive = next(
            (row for row in captures if not row.get("errorName") and row.get("testStatus") == "passed"),
            next((row for row in captures if not row.get("errorName")), None),
        )
        negative = next(
            (
                row
                for row in captures
                if row.get("errorName") == "PreconditionError"
                and row.get("testStatus") == "passed"
            ),
            next((row for row in captures if row.get("errorName") == "PreconditionError"), None),
        )
        by_suffix = {
            str(row["scenario_id"]).rsplit("::", 1)[-1]: row
            for row in document["scenarios"]
        }
        for suffix, capture, decision in (
            ("pre-positive", positive, True),
            ("pre-negative", negative, False),
        ):
            scenario = by_suffix[suffix]
            if capture is None:
                reason = f"No captured {'successful' if decision else 'PreconditionError'} call in the Jest oracle"
                for validator in VALIDATORS:
                    mark_unsupported(scenario["validators"][validator], reason)
                scenario["status"] = "unsupported"
                configured["unsupported_pre"] += 1
                continue
            try:
                model_path, command_path = configure_use_precondition(
                    operation, document, capture, suffix, sample_index, output
                )
                scenario["validators"]["use"].update(
                    {
                        "status": "ready",
                        "decision": None,
                        "model_file": str(model_path),
                        "command_file": str(command_path),
                    }
                )
            except Exception as exc:
                mark_unsupported(
                    scenario["validators"]["use"], f"USE state export failed: {exc}"
                )
                configured["use_export_failed"] += 1
            scenario["validators"]["ocltsvm"].update(
                {
                    "status": "recorded",
                    "decision": decision,
                    "provenance": str(capture_path),
                    "test_name": capture.get("currentTestName"),
                }
            )
            scenario["validators"]["jest"].update(
                {
                    "status": "recorded",
                    "decision": decision,
                    "provenance": str(capture_path),
                    "test_name": capture.get("currentTestName"),
                    "test_status": capture.get("testStatus"),
                }
            )
            scenario["status"] = "ready"
            scenario["state_provenance"] = str(capture_path)
            configured[f"configured_{suffix}"] += 1

        post = by_suffix["post-positive"]
        mark_unsupported(
            post["validators"]["use"],
            "The batch adapter performs same-pre-state validation only; USE post-state compilation is reported separately.",
        )
        if positive is not None:
            post["validators"]["ocltsvm"].update(
                {"status": "recorded", "decision": True, "provenance": str(capture_path)}
            )
            post["validators"]["jest"].update(
                {
                    "status": "recorded",
                    "decision": positive.get("testStatus") == "passed",
                    "provenance": str(capture_path),
                }
            )
            post["status"] = "partial"
        else:
            mark_unsupported(post["validators"]["ocltsvm"], "No successful captured call")
            mark_unsupported(post["validators"]["jest"], "No successful captured call")
            post["status"] = "unsupported"
        document["batch_configuration"] = {
            "scope": "same-pre-state positive/negative agreement",
            "capture_file": str(capture_path),
            "postcondition_use_status": "unsupported_in_batch; use complete-contract compilation separately",
        }
        write_json(scenario_file, document)
        print(f"Configured {operation_id}")

    write_json(
        output / "batch_configuration_summary.json",
        {
            "schema_version": SCHEMA_VERSION,
            "operation_count": len(scenario_files),
            "counts": dict(configured),
            "scope_note": "The batch experiment compares same-state precondition decisions. It does not claim USE execution agreement for postconditions.",
        },
    )
    print(json.dumps(dict(configured), ensure_ascii=False, indent=2))


def prepare(args: argparse.Namespace) -> None:
    operations = read_jsonl(Path(args.operations))
    operation_ids = {str(row.get("id") or "") for row in operations}
    if "" in operation_ids or len(operation_ids) != len(operations):
        raise ValueError("Operation manifest contains missing or duplicate ids")
    if args.expected_operations and len(operations) != args.expected_operations:
        raise ValueError(
            f"Expected {args.expected_operations} operations, found {len(operations)}"
        )
    selected_attempts = choose_attempts(read_jsonl(Path(args.attempts)), args.model, operation_ids)

    candidates: list[dict[str, Any]] = []
    for operation in operations:
        operation_id = str(operation["id"])
        attempt = selected_attempts[operation_id]
        contract = contract_text(attempt)
        if not contract.strip():
            continue
        constructs = detect_constructs(contract)
        candidates.append(
            {
                "operation_id": operation_id,
                "case_study": str(operation.get("case_study") or operation.get("project") or "unknown"),
                "project": operation.get("project"),
                "use_case": operation.get("useCase"),
                "operation": operation.get("operation") or operation.get("operation_name"),
                "operation_signature": operation.get("operation_signature"),
                "source_model": args.model,
                "source_attempt": attempt.get("attempt"),
                "source_input_hash": attempt.get("input_hash"),
                "source_prompt_hash": attempt.get("shared_prompt_hash") or attempt.get("prompt_hash"),
                "constructs": constructs,
                "complexity_score": complexity_score(operation, contract, constructs),
                "contract": contract,
            }
        )
    assign_tiers(candidates)
    selected = stratified_sample(candidates, args.sample_size, args.seed)

    output = Path(args.output_dir)
    scenarios_dir = output / "scenarios"
    scenarios_dir.mkdir(parents=True, exist_ok=True)
    for index, row in enumerate(selected, 1):
        scenario_document = {
            "schema_version": SCHEMA_VERSION,
            "sample_index": index,
            **row,
            "scenarios": build_scenario_templates(row),
        }
        write_json(
            scenarios_dir / f"{index:02d}_{safe_name(row['operation_id'])}.json",
            scenario_document,
        )

    manifest_rows = [
        {key: (";".join(value) if isinstance(value, list) else value) for key, value in row.items() if key != "contract"}
        for row in selected
    ]
    with (output / "sample_manifest.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(manifest_rows[0]))
        writer.writeheader()
        writer.writerows(manifest_rows)
    write_json(output / "sample_manifest.json", manifest_rows)
    write_json(
        output / "prepare_summary.json",
        {
            "schema_version": SCHEMA_VERSION,
            "source_model": args.model,
            "sample_size": len(selected),
            "seed": args.seed,
            "tier_counts": dict(Counter(row["complexity_tier"] for row in selected)),
            "case_counts": dict(Counter(row["case_study"] for row in selected)),
            "construct_counts": dict(Counter(tag for row in selected for tag in row["constructs"])),
            "scenario_template_count": 3 * len(selected),
            "scope_note": "Prepared templates are not observations. Run mode excludes pending and unsupported validators from all agreement denominators.",
        },
    )
    print(f"Prepared {len(selected)} operations and {3 * len(selected)} scenario templates in {output}")


def expand_args(values: list[str], replacements: dict[str, str]) -> list[str]:
    return [
        re.sub(r"\{([A-Za-z_][A-Za-z0-9_]*)\}", lambda match: replacements.get(match.group(1), match.group(0)), value)
        for value in values
    ]


def parse_decision(text: str, pattern: str) -> bool | None:
    matches = re.findall(pattern, text, flags=re.I | re.M)
    if not matches:
        return None
    value = matches[-1]
    if isinstance(value, tuple):
        value = next((part for part in value if part), "")
    normalized = str(value).strip().lower()
    if normalized == "true":
        return True
    if normalized == "false":
        return False
    return None


def execute_validator(
    name: str,
    spec: dict[str, Any],
    scenario_file: Path,
    document: dict[str, Any],
    scenario: dict[str, Any],
    use_bat: Path,
    logs_dir: Path,
) -> dict[str, Any]:
    if str(spec.get("status") or "").lower() == "unsupported":
        return {
            "status": "unsupported",
            "decision": None,
            "duration_seconds": 0.0,
            "error": str(spec.get("reason") or "unsupported by this validator"),
        }
    if isinstance(spec.get("decision"), bool):
        return {"status": "recorded", "decision": spec["decision"], "duration_seconds": 0.0}

    replacements = {
        "scenario_file": str(scenario_file.resolve()),
        "operation_id": str(document["operation_id"]),
        "scenario_id": str(scenario["scenario_id"]),
    }
    command = list(spec.get("command") or [])
    if name == "use" and not command:
        model_file = str(spec.get("model_file") or "")
        command_file = str(spec.get("command_file") or "")
        if model_file and command_file:
            command = [str(use_bat), "-nogui", model_file, command_file]
    if not command:
        return {"status": "pending", "decision": None, "duration_seconds": 0.0}

    command = expand_args(command, replacements)
    cwd = Path(str(spec.get("working_directory") or "."))
    timeout = int(spec.get("timeout_seconds") or 120)
    started = time.time()
    try:
        process = subprocess.run(
            command,
            cwd=cwd,
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=timeout,
            shell=False,
        )
        output = (process.stdout or "") + "\n" + (process.stderr or "")
        decision = parse_decision(output, str(spec.get("decision_regex") or DEFAULT_DECISION_REGEX))
        status = "ok" if process.returncode == 0 and decision is not None else "error"
        error = "" if status == "ok" else (
            f"returncode={process.returncode}" if process.returncode else "semantic decision marker not found"
        )
    except subprocess.TimeoutExpired as exc:
        output = ((exc.stdout or "") if isinstance(exc.stdout, str) else "") + "\n" + ((exc.stderr or "") if isinstance(exc.stderr, str) else "")
        decision = None
        status = "timeout"
        error = f"timeout after {timeout}s"
        process = None
    log_path = logs_dir / f"{safe_name(str(scenario['scenario_id']))}.{name}.log"
    log_path.parent.mkdir(parents=True, exist_ok=True)
    log_path.write_text(output, encoding="utf-8")
    return {
        "status": status,
        "decision": decision,
        "duration_seconds": round(time.time() - started, 4),
        "returncode": "" if process is None else process.returncode,
        "error": error,
        "log_file": str(log_path),
        "command": command,
    }


def wilson_interval(successes: int, total: int, z: float = 1.959963984540054) -> tuple[float, float]:
    if total == 0:
        return (math.nan, math.nan)
    proportion = successes / total
    denominator = 1 + z * z / total
    center = (proportion + z * z / (2 * total)) / denominator
    margin = z * math.sqrt(proportion * (1 - proportion) / total + z * z / (4 * total * total)) / denominator
    return (max(0.0, center - margin), min(1.0, center + margin))


def rate_record(label: str, successes: int, total: int) -> dict[str, Any]:
    low, high = wilson_interval(successes, total)
    return {
        "label": label,
        "successes": successes,
        "total": total,
        "rate_percent": None if total == 0 else round(100 * successes / total, 2),
        "wilson_95_low_percent": None if total == 0 else round(100 * low, 2),
        "wilson_95_high_percent": None if total == 0 else round(100 * high, 2),
    }


def summarize(rows: list[dict[str, Any]]) -> dict[str, Any]:
    metrics: list[dict[str, Any]] = []
    for validator in VALIDATORS:
        comparable = [row for row in rows if isinstance(row.get(f"{validator}_decision"), bool)]
        successes = sum(row[f"{validator}_decision"] == row["expected_decision"] for row in comparable)
        metrics.append(rate_record(f"{validator}_vs_expected", successes, len(comparable)))
    for left, right in (("use", "ocltsvm"), ("use", "jest"), ("ocltsvm", "jest")):
        comparable = [
            row for row in rows
            if isinstance(row.get(f"{left}_decision"), bool) and isinstance(row.get(f"{right}_decision"), bool)
        ]
        successes = sum(row[f"{left}_decision"] == row[f"{right}_decision"] for row in comparable)
        metrics.append(rate_record(f"{left}_{right}_agreement", successes, len(comparable)))
    comparable_three = [row for row in rows if all(isinstance(row.get(f"{name}_decision"), bool) for name in VALIDATORS)]
    three_successes = sum(len({row[f"{name}_decision"] for name in VALIDATORS}) == 1 for row in comparable_three)
    metrics.append(rate_record("three_way_agreement", three_successes, len(comparable_three)))
    return {
        "schema_version": SCHEMA_VERSION,
        "scenario_count": len(rows),
        "clause_counts": dict(Counter(row["clause"] for row in rows)),
        "validator_status_counts": {
            name: dict(Counter(row[f"{name}_status"] for row in rows)) for name in VALIDATORS
        },
        "metrics": metrics,
        "scope_note": "Agreement is calculated only over scenarios with explicit Boolean decisions from both compared validators. Pending, timeout, error, and unsupported observations are reported but excluded from denominators.",
    }


def markdown_summary(summary: dict[str, Any]) -> str:
    lines = [
        "# USE--OCLTSVM Semantic Agreement",
        "",
        "| Metric | Agreements / Decisions | Rate (%) | Wilson 95% CI (%) |",
        "|---|---:|---:|---:|",
    ]
    for metric in summary["metrics"]:
        rate = "--" if metric["rate_percent"] is None else f"{metric['rate_percent']:.2f}"
        interval = "--" if metric["wilson_95_low_percent"] is None else f"[{metric['wilson_95_low_percent']:.2f}, {metric['wilson_95_high_percent']:.2f}]"
        lines.append(f"| {metric['label']} | {metric['successes']} / {metric['total']} | {rate} | {interval} |")
    lines.extend(["", summary["scope_note"], ""])
    return "\n".join(lines)


def run(args: argparse.Namespace) -> None:
    scenarios_dir = Path(args.scenarios_dir)
    scenario_files = sorted(scenarios_dir.glob("*.json"))
    if not scenario_files:
        raise FileNotFoundError(f"No scenario JSON files in {scenarios_dir}")
    output = Path(args.output_dir)
    rows: list[dict[str, Any]] = []
    for scenario_file in scenario_files:
        document = json.loads(scenario_file.read_text(encoding="utf-8"))
        if document.get("schema_version") != SCHEMA_VERSION:
            raise ValueError(f"{scenario_file}: unsupported schema version")
        if args.operation_id and document.get("operation_id") != args.operation_id:
            continue
        for scenario in document.get("scenarios") or []:
            row: dict[str, Any] = {
                "operation_id": document["operation_id"],
                "case_study": document["case_study"],
                "complexity_tier": document["complexity_tier"],
                "constructs": ";".join(document.get("constructs") or []),
                "scenario_id": scenario["scenario_id"],
                "clause": scenario["clause"],
                "expected_decision": scenario["expected_decision"],
            }
            for validator in VALIDATORS:
                result = execute_validator(
                    validator,
                    (scenario.get("validators") or {}).get(validator) or {},
                    scenario_file,
                    document,
                    scenario,
                    Path(args.use_bat),
                    output / "logs",
                )
                for key, value in result.items():
                    row[f"{validator}_{key}"] = value
            row["use_ocltsvm_agree"] = (
                row.get("use_decision") == row.get("ocltsvm_decision")
                if isinstance(row.get("use_decision"), bool) and isinstance(row.get("ocltsvm_decision"), bool)
                else ""
            )
            row["use_jest_agree"] = (
                row.get("use_decision") == row.get("jest_decision")
                if isinstance(row.get("use_decision"), bool) and isinstance(row.get("jest_decision"), bool)
                else ""
            )
            rows.append(row)

    fieldnames = list(rows[0])
    output.mkdir(parents=True, exist_ok=True)
    with (output / "scenario_results.csv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)
    disagreements = [
        row for row in rows
        if row["use_ocltsvm_agree"] is False or row["use_jest_agree"] is False
    ]
    write_json(output / "scenario_results.json", rows)
    write_json(output / "disagreements.json", disagreements)
    summary = summarize(rows)
    write_json(output / "summary.json", summary)
    (output / "summary.md").write_text(markdown_summary(summary), encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    subparsers = parser.add_subparsers(dest="command", required=True)
    prepare_parser = subparsers.add_parser("prepare", help="select operations and create scenario templates")
    prepare_parser.add_argument("--operations", default=DEFAULT_OPERATIONS)
    prepare_parser.add_argument("--attempts", default=DEFAULT_ATTEMPTS)
    prepare_parser.add_argument("--model", default="gpt-5.5")
    prepare_parser.add_argument("--sample-size", type=int, default=30)
    prepare_parser.add_argument("--seed", type=int, default=20260810)
    prepare_parser.add_argument("--expected-operations", type=int, default=114)
    prepare_parser.add_argument("--output-dir", default=DEFAULT_OUTPUT)
    prepare_parser.set_defaults(handler=prepare)

    configure_parser = subparsers.add_parser(
        "configure-smoke", help="configure the executable checkBalance pilot"
    )
    configure_parser.add_argument("--output-dir", default=DEFAULT_OUTPUT)
    configure_parser.set_defaults(handler=configure_smoke)

    batch_parser = subparsers.add_parser(
        "configure-batch",
        help="capture Jest oracle states and configure batch precondition scenarios",
    )
    batch_parser.add_argument("--output-dir", default=DEFAULT_OUTPUT)
    batch_parser.add_argument("--operations", default=DEFAULT_OPERATIONS)
    batch_parser.add_argument("--attempts", default=DEFAULT_ATTEMPTS)
    batch_parser.add_argument("--model", default="gpt-5.5")
    batch_parser.add_argument("--operation-id", default="")
    batch_parser.add_argument("--limit", type=int, default=0)
    batch_parser.add_argument("--capture-timeout", type=int, default=180)
    batch_parser.add_argument("--refresh-captures", action="store_true")
    batch_parser.set_defaults(handler=configure_batch)

    run_parser = subparsers.add_parser("run", help="execute completed semantic scenarios")
    run_parser.add_argument("--scenarios-dir", default=f"{DEFAULT_OUTPUT}/scenarios")
    run_parser.add_argument("--output-dir", default=f"{DEFAULT_OUTPUT}/run")
    run_parser.add_argument("--use-bat", default="tools/use-7.5.0/bin/use.bat")
    run_parser.add_argument("--operation-id", default="")
    run_parser.set_defaults(handler=run)
    return parser


def main() -> None:
    args = build_parser().parse_args()
    args.handler(args)


if __name__ == "__main__":
    main()
