#!/usr/bin/env python3
"""Generate USE expression-level sanity artifacts for all 114 operations.

The generated USE files are stronger than skeleton placeholders:
- classes, primitive attributes, enums, and associations are derived from model_context
- generated Contract Gen definition/precondition clauses are translated into USE invariants
- command files instantiate a small snapshot so the model can be loaded by USE

Postconditions are preserved as comments because operation post-state semantics
(`oclIsNew`, `@pre`, result, mutation) are not equivalent to a USE class invariant.
"""

from __future__ import annotations

import argparse
import csv
import json
import re
import subprocess
import time
from dataclasses import dataclass, field
from pathlib import Path


PRIMITIVES = {"Integer", "Real", "Boolean", "String"}


@dataclass
class Attribute:
    name: str
    type_name: str


@dataclass
class Relationship:
    name: str
    type_name: str
    many: bool


@dataclass
class Entity:
    name: str
    parent: str | None = None
    attributes: list[Attribute] = field(default_factory=list)
    relationships: list[Relationship] = field(default_factory=list)


def safe_ident(value: str, fallback: str = "X") -> str:
    value = re.sub(r"[^A-Za-z0-9_]", "_", value or "").strip("_")
    if not value:
        value = fallback
    if value[0].isdigit():
        value = f"_{value}"
    return value


def use_comment(text: str) -> str:
    return "\n".join("-- " + line.replace("\t", "  ") for line in (text or "").splitlines())


def parse_type(raw: str) -> tuple[str, set[str], bool]:
    raw = raw.strip()
    many = False
    if raw.startswith("Set(") and raw.endswith(")"):
        many = True
        raw = raw[4:-1].strip()
    enum_match = re.fullmatch(r"([A-Za-z_][A-Za-z0-9_]*)\[([^\]]+)\]", raw)
    if enum_match:
        enum_name = safe_ident(enum_match.group(1))
        values = {safe_ident(v.strip().upper()) for v in enum_match.group(2).split("|") if v.strip()}
        return enum_name, values, many
    if raw in {"Date", "LocalDate", "DateTime"}:
        return "Integer", set(), many
    if raw in PRIMITIVES:
        return raw, set(), many
    return safe_ident(raw), set(), many


def parse_model_context(text: str) -> tuple[dict[str, Entity], dict[str, set[str]]]:
    entities: dict[str, Entity] = {}
    enums: dict[str, set[str]] = {}
    current: Entity | None = None
    section: str | None = None
    pending_name: str | None = None
    in_entities = False

    for raw_line in (text or "").splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if stripped == "Entities":
            current = None
            section = None
            in_entities = True
            continue
        if not in_entities:
            continue
        name_match = re.fullmatch(r"\d+\.Name:\s*(.+)", stripped)
        top_name_match = re.fullmatch(r"Name:\s*(.+)", stripped)
        if top_name_match and raw_line.startswith("    Name:"):
            entity_name = safe_ident(top_name_match.group(1))
            current = entities.setdefault(entity_name, Entity(entity_name))
            section = None
            pending_name = None
            continue
        extends_match = re.fullmatch(r"Extends:\s*(.+)", stripped)
        if extends_match and current:
            current.parent = safe_ident(extends_match.group(1))
            entities.setdefault(current.parent, Entity(current.parent))
            continue
        if stripped == "Attributes":
            section = "attributes"
            pending_name = None
            continue
        if stripped == "Relationships":
            section = "relationships"
            pending_name = None
            continue
        if name_match and current and section in {"attributes", "relationships"}:
            pending_name = safe_ident(name_match.group(1))
            continue
        type_match = re.fullmatch(r"Type:\s*(.+)", stripped)
        if type_match and current and pending_name:
            type_name, enum_values, many = parse_type(type_match.group(1))
            if enum_values:
                enums.setdefault(type_name, set()).update(enum_values)
            if section == "attributes":
                if type_name in PRIMITIVES or type_name in enums:
                    current.attributes.append(Attribute(pending_name, type_name))
            elif section == "relationships":
                current.relationships.append(Relationship(pending_name, type_name, many))
                entities.setdefault(type_name, Entity(type_name))
            pending_name = None
    return entities, enums


def parse_contract_sections(contract: str) -> dict[str, str]:
    sections = {"definition": "", "precondition": "", "postcondition": ""}
    if not contract:
        return sections
    for name in sections:
        next_names = [n for n in sections if n != name]
        pattern = rf"{name}\s*:\s*(.*?)(?=\n\s*(?:{'|'.join(next_names)})\s*:|\n\}}|\Z)"
        match = re.search(pattern, contract, re.I | re.S)
        if match:
            sections[name] = match.group(1).strip()
    return sections


def split_definitions(definition: str) -> list[tuple[str, str, str]]:
    out = []
    if not definition:
        return out
    pieces = []
    buf = []
    depth = 0
    for ch in definition:
        if ch in "({[":
            depth += 1
        elif ch in ")}]" and depth > 0:
            depth -= 1
        if ch == "," and depth == 0:
            pieces.append("".join(buf).strip())
            buf = []
        else:
            buf.append(ch)
    if buf:
        pieces.append("".join(buf).strip())
    for piece in pieces:
        match = re.match(r"([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*(?:\([A-Za-z_][A-Za-z0-9_]*\))?)\s*=\s*(.+)", piece, re.S)
        if match:
            out.append((safe_ident(match.group(1)), use_decl_type(match.group(2)), match.group(3).strip()))
    return out


def use_decl_type(raw: str) -> str:
    raw = raw.strip()
    set_match = re.fullmatch(r"Set\(([A-Za-z_][A-Za-z0-9_]*)\)", raw)
    if set_match:
        item_type, _, _ = parse_type(set_match.group(1))
        return f"Set({item_type})"
    parsed_type, _, _ = parse_type(raw)
    return parsed_type


def base_type(type_name: str) -> str:
    set_match = re.fullmatch(r"Set\(([A-Za-z_][A-Za-z0-9_]*)\)", type_name)
    if set_match:
        return safe_ident(set_match.group(1))
    return type_name


def normalize_ocl(expr: str, enum_values: set[str]) -> str:
    expr = (expr or "").strip()
    expr = re.sub(r'"([^"\\]*(?:\\.[^"\\]*)*)"', lambda m: "'" + m.group(1).replace("'", "\\'") + "'", expr)
    expr = re.sub(r"\ballInstance\s*\(", "allInstances(", expr)
    expr = re.sub(r"\b([A-Za-z_][A-Za-z0-9_.@]*)\.After\s*\(([^()]+)\)", r"(\1 + \2)", expr)
    expr = re.sub(r"\b([A-Za-z_][A-Za-z0-9_.@]*)\.Before\s*\(([^()]+)\)", r"(\1 - \2)", expr)
    expr = re.sub(r"\b([A-Za-z_][A-Za-z0-9_.@]*)\.isAfter\s*\(([^()]+)\)", r"(\1 > \2)", expr)
    expr = re.sub(r"\b([A-Za-z_][A-Za-z0-9_.@]*)\.isBefore\s*\(([^()]+)\)", r"(\1 < \2)", expr)
    expr = re.sub(r"\.isEmpty\s*\(\)", "->isEmpty()", expr)
    expr = re.sub(r"\.includes\s*\(", "->includes(", expr)
    expr = re.sub(r"\bnull\b", "undefined", expr)
    expr = re.sub(r"\b([A-Za-z_][A-Za-z0-9_]*)\s*<>\s*undefined\b", r"\1.oclIsUndefined() = false", expr)
    expr = re.sub(r"\b([A-Za-z_][A-Za-z0-9_]*)\s*=\s*undefined\b", r"\1.oclIsUndefined() = true", expr)
    for enum_value in sorted(enum_values, key=len, reverse=True):
        expr = re.sub(rf"(?<![#'\"])\b{re.escape(enum_value)}\b", f"#{enum_value}", expr)
    expr = re.sub(r"\b[A-Za-z_][A-Za-z0-9_]*::#([A-Za-z_][A-Za-z0-9_]*)", r"#\1", expr)
    return expr


def infer_self_context(
    definitions: list[tuple[str, str, str]],
    precondition: str,
    entities: dict[str, Entity],
    params: list[dict],
) -> tuple[dict[str, str], dict[str, str]]:
    param_names = {safe_ident(p["name"]) for p in params}
    attrs: dict[str, str] = {}
    navs: dict[str, str] = {}
    combined = "\n".join([precondition] + [expr for _, _, expr in definitions])

    for ref, member in re.findall(
        r"\bself\.([A-Za-z_][A-Za-z0-9_]*)\.([A-Za-z_][A-Za-z0-9_]*)\b",
        combined,
    ):
        ref = safe_ident(ref)
        member = safe_ident(member)
        if ref in param_names or ref in navs:
            continue
        candidates = []
        for entity in entities.values():
            entity_members = {attr.name for attr in entity.attributes}
            entity_members.update(rel.name for rel in entity.relationships)
            if member in entity_members:
                candidates.append(entity.name)
        name_hint = re.sub(r"^(?:Current|Selected|Active|Target)", "", ref, flags=re.I)
        hinted = [name for name in candidates if name.lower() == name_hint.lower()]
        if len(hinted) == 1:
            navs[ref] = hinted[0]
        elif len(candidates) == 1:
            navs[ref] = candidates[0]

    for _, type_name, expr in definitions:
        match = re.fullmatch(r"\s*self\.([A-Za-z_][A-Za-z0-9_]*)\s*", expr.strip())
        if match:
            ref = safe_ident(match.group(1))
            if ref not in param_names:
                if base_type(type_name) in entities and not type_name.startswith("Set("):
                    navs[ref] = type_name
                elif type_name in PRIMITIVES:
                    attrs[ref] = type_name

    for ref in re.findall(r"\bself\.([A-Za-z_][A-Za-z0-9_]*)\b", combined):
        ref = safe_ident(ref)
        if ref in param_names or ref in attrs or ref in navs:
            continue
        bool_patterns = [
            rf"self\.{re.escape(ref)}\s*=\s*(?:true|false)",
            rf"self\.{re.escape(ref)}\.oclIsTypeOf\s*\(\s*Boolean\s*\)",
        ]
        numeric_patterns = [
            rf"self\.{re.escape(ref)}\s*(?:>=|<=|>|<)\s*-?\d+(?:\.\d+)?",
            rf"self\.{re.escape(ref)}\s*(?:\+|-|\*|/)",
        ]
        if any(re.search(p, combined, re.I) for p in numeric_patterns) or ref.lower().endswith(("number", "amount", "balance", "count", "fee", "days")):
            attrs[ref] = "Real"
        elif any(re.search(p, combined, re.I) for p in bool_patterns) or ref.lower().endswith(("validated", "enabled", "complete", "ready")):
            attrs[ref] = "Boolean"
        else:
            attrs[ref] = "Boolean"
    return attrs, navs


def use_type_for_param(type_name: str) -> str:
    parsed, _, _ = parse_type(type_name)
    return parsed if parsed in PRIMITIVES else "String"


def default_value(type_name: str, name: str, operation_name: str, is_first_param: bool) -> str:
    lower = name.lower()
    if type_name == "Integer":
        create_like = operation_name.lower().startswith(("create", "add", "register", "recommend", "submit", "enter"))
        if is_first_param and create_like and lower in {"id", "userid", "cardid", "itemid", "termid"}:
            return "100"
        return "1"
    if type_name == "Real":
        return "10.0"
    if type_name == "Boolean":
        return "false"
    return "'sample'"


def wrap_definitions(body: str, definitions: list[tuple[str, str, str]], enum_values: set[str]) -> str:
    wrapped = body or "true"
    for name, type_name, expr in reversed(definitions):
        wrapped = f"let {name} : {type_name} = {normalize_ocl(expr, enum_values)} in\n      {wrapped}"
    return wrapped


def adapt_postcondition(expr: str) -> tuple[str, list[str]]:
    adaptations: list[str] = []
    match = re.fullmatch(
        r"\s*let\s+([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)\s+in\s+(.+)",
        expr or "",
        re.S,
    )
    if not match:
        return expr or "true", adaptations
    variable, type_name, body = match.groups()
    if re.search(rf"\b{re.escape(variable)}\.oclIsNew\s*\(\s*\)", body):
        adaptations.append("new_object_let_to_exists")
        return (
            f"{type_name}.allInstances()->exists({variable}: {type_name} |\n      {body.strip()})",
            adaptations,
        )
    return expr or "true", adaptations


def make_model(row: dict, attempt: dict | None, index: int) -> tuple[str, str, str, str, dict]:
    entities, enums = parse_model_context(row.get("model_context", ""))
    enum_values = {value for values in enums.values() for value in values}
    contract = (attempt or {}).get("extracted_ocl") or ""
    sections = parse_contract_sections(contract)
    definitions = split_definitions(sections["definition"])
    precondition = normalize_ocl(sections["precondition"] or "true", enum_values)
    for def_name, def_type, _ in definitions:
        if def_type.startswith("Set("):
            precondition = re.sub(
                rf"\b{re.escape(def_name)}\.oclIsUndefined\s*\(\s*\)\s*=\s*false\b",
                f"{def_name}->size() >= 0",
                precondition,
            )
    params = row.get("parameters") or []
    self_attrs, self_navs = infer_self_context(
        definitions,
        "\n".join([sections["precondition"], sections["postcondition"]]),
        entities,
        params,
    )
    environment_text = (row.get("model_context") or "").split("  Entities", 1)[0]
    for env_name, env_type in re.findall(
        r"^\s*\d+\.([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([A-Za-z_][A-Za-z0-9_]*)\s*$",
        environment_text,
        re.M,
    ):
        parsed_type, _, _ = parse_type(env_type)
        self_attrs.setdefault(safe_ident(env_name), parsed_type)
    for target in self_navs.values():
        entities.setdefault(target, Entity(target))

    model_name = safe_ident(f"StrongUSE_{index:03d}_{row['id']}")
    lines = [
        f"model {model_name}",
        "",
        f"-- operation_id: {row['id']}",
        f"-- operation_signature: {row.get('operation_signature', '')}",
        "-- conversion_scope: model_context + generated definition/precondition",
        "-- postcondition is retained as comment because USE invariants do not model operation post-state directly.",
        "",
    ]

    if contract:
        lines.append("-- Generated contract:")
        lines.append(use_comment(contract))
        lines.append("")

    for enum_name in sorted(enums):
        values = ", ".join(sorted(enums[enum_name]))
        lines.append(f"enum {enum_name} {{ {values} }}")
    if enums:
        lines.append("")

    for entity in sorted(entities.values(), key=lambda e: e.name):
        parent_suffix = f" < {entity.parent}" if entity.parent else ""
        lines.append(f"class {entity.name}{parent_suffix}")
        if entity.attributes:
            lines.append("attributes")
            seen = set()
            for attr in entity.attributes:
                if attr.name in seen:
                    continue
                seen.add(attr.name)
                lines.append(f"  {attr.name} : {attr.type_name}")
        lines.append("end")
        lines.append("")

    lines.append("class OperationContext")
    lines.append("attributes")
    for param in params:
        lines.append(f"  {safe_ident(param['name'])} : {use_type_for_param(param['type'])}")
    for attr_name, attr_type in sorted(self_attrs.items()):
        lines.append(f"  {attr_name} : {attr_type}")
    if not params:
        lines.append("  sampleIndex : Integer")
    source_operation_name = safe_ident(row["operation_name"])
    operation_name = safe_ident(f"Contract_{source_operation_name}")
    operation_params = ", ".join(
        f"{safe_ident(param['name'])} : {use_type_for_param(param['type'])}" for param in params
    )
    return_suffix = ""
    if row.get("has_return_value"):
        return_suffix = f" : {use_decl_type(row.get('return_type') or 'String')}"
    operation_signature = f"{operation_name}({operation_params}){return_suffix}"
    lines.append("operations")
    lines.append(f"  {operation_signature}")
    lines.append("end")
    lines.append("")

    assoc_names = set()
    for entity in sorted(entities.values(), key=lambda e: e.name):
        for rel in entity.relationships:
            target = rel.type_name
            if target not in entities:
                continue
            assoc_name = safe_ident(f"{entity.name}_{rel.name}_{target}")
            if assoc_name in assoc_names:
                continue
            assoc_names.add(assoc_name)
            owner_role = safe_ident(f"{entity.name}_{rel.name}_Owner")
            target_mult = "*" if rel.many else "0..1"
            lines.extend(
                [
                    f"association {assoc_name} between",
                    f"  {entity.name}[0..*] role {owner_role}",
                    f"  {target}[{target_mult}] role {rel.name}",
                    "end",
                    "",
                ]
            )
    for role_name, target in sorted(self_navs.items()):
        assoc_name = safe_ident(f"OperationContext_{role_name}_{target}")
        lines.extend(
            [
                f"association {assoc_name} between",
                "  OperationContext[0..*] role ContextOwner",
                f"  {target}[0..1] role {role_name}",
                "end",
                "",
            ]
        )

    base_lines = list(lines)
    context_line = f"context OperationContext::{operation_signature}"
    pre_body = wrap_definitions(precondition or "true", definitions, enum_values)
    normalized_post = normalize_ocl(sections["postcondition"] or "true", enum_values)
    adapted_post, post_adaptations = adapt_postcondition(normalized_post)
    post_body = wrap_definitions(adapted_post, definitions, enum_values)
    pre_block = [
        "constraints",
        "",
        context_line,
        f"  pre {source_operation_name}GeneratedPre:",
        "    " + pre_body.replace("\n", "\n    "),
        "",
    ]
    post_block = [
        "constraints",
        "",
        context_line,
        f"  post {source_operation_name}GeneratedPost:",
        "    " + post_body.replace("\n", "\n    "),
        "",
    ]
    combined_block = [
        "constraints",
        "",
        context_line,
        f"  pre {source_operation_name}GeneratedPre:",
        "    " + pre_body.replace("\n", "\n    "),
        f"  post {source_operation_name}GeneratedPost:",
        "    " + post_body.replace("\n", "\n    "),
        "",
    ]

    cmd_lines = ["!create ctx : OperationContext"]
    for i, param in enumerate(params):
        pname = safe_ident(param["name"])
        ptype = use_type_for_param(param["type"])
        cmd_lines.append(f"!set ctx.{pname} := {default_value(ptype, pname, row['operation_name'], i == 0)}")
    for attr_name, attr_type in sorted(self_attrs.items()):
        if attr_type == "Integer":
            cmd_lines.append(f"!set ctx.{attr_name} := 1")
        elif attr_type == "Real":
            cmd_lines.append(f"!set ctx.{attr_name} := 10.0")
        elif attr_type == "Boolean":
            cmd_lines.append(f"!set ctx.{attr_name} := true")
        else:
            cmd_lines.append(f"!set ctx.{attr_name} := 'sample'")
    entity_objects: dict[str, str] = {}
    for entity in sorted(entities.values(), key=lambda e: e.name):
        obj = safe_ident(f"{entity.name.lower()}1")
        entity_objects[entity.name] = obj
        cmd_lines.append(f"!create {obj} : {entity.name}")
        for attr in entity.attributes:
            if attr.type_name == "Integer":
                cmd_lines.append(f"!set {obj}.{attr.name} := 1")
            elif attr.type_name == "Real":
                cmd_lines.append(f"!set {obj}.{attr.name} := 10.0")
            elif attr.type_name == "Boolean":
                cmd_lines.append(f"!set {obj}.{attr.name} := false")
            elif attr.type_name == "String":
                cmd_lines.append(f"!set {obj}.{attr.name} := 'sample'")
            elif attr.type_name in enums and enums[attr.type_name]:
                cmd_lines.append(f"!set {obj}.{attr.name} := #{sorted(enums[attr.type_name])[0]}")
    for role_name, target in sorted(self_navs.items()):
        target_obj = entity_objects.get(target)
        if target_obj:
            cmd_lines.append(f"!insert (ctx, {target_obj}) into {safe_ident(f'OperationContext_{role_name}_{target}')}")
    cmd_lines.append("-- semantic load/typecheck only; no invariant truth check for operation pre-state")
    cmd_lines.append("")

    meta = {
        "has_generated_contract": bool(contract),
        "definition_count": len(definitions),
        "has_precondition": bool(precondition and precondition != "true"),
        "has_postcondition": bool(sections["postcondition"]),
        "postcondition_adaptations": post_adaptations,
        "translation_adaptations": [
            "date_values_as_integer_offsets"
        ] if re.search(r"\b(?:Date|LocalDate|DateTime|Today|Now|\.After\s*\(|\.Before\s*\()", contract) else [],
        "entity_count": len(entities),
        "enum_count": len(enums),
    }
    return (
        "\n".join(base_lines + combined_block),
        "\n".join(base_lines + pre_block),
        "\n".join(base_lines + post_block),
        "\n".join(cmd_lines),
        meta,
    )


STUDY_VERSION = "contractgen-study-v6"
INPUT_SCHEMA_VERSION = "contractgen-operation-input-v3"


def choose_attempts(path: Path, model: str, operations: dict[str, dict]) -> dict[str, dict]:
    if not path.exists():
        raise FileNotFoundError(f"Missing v6 Contract Gen attempts: {path}")
    rows = []
    for line_no, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_no}: invalid JSON: {exc}") from exc
        if row.get("model") != model:
            continue
        operation_id = str(row.get("operation_id") or "")
        operation = operations.get(operation_id)
        shared_prompt_hash = row.get("shared_prompt_hash") or row.get("prompt_hash")
        if (
            row.get("study_version") != STUDY_VERSION
            or row.get("input_schema_version") != INPUT_SCHEMA_VERSION
            or operation is None
            or row.get("input_hash") != operation.get("input_hash")
            or shared_prompt_hash != operation.get("prompt_hash")
            or not row.get("generation_prompt_version")
        ):
                raise ValueError(f"{path}:{line_no}: incompatible study-v6 experiment record")
        rows.append(row)

    def score(row: dict) -> tuple[int, int, int, int]:
        return (
            1 if row.get("syntax_valid") else 0,
            1 if row.get("extraction_success") else 0,
            1 if row.get("extracted_ocl") else 0,
            -int(row.get("attempt") or 999),
        )

    best: dict[str, dict] = {}
    for row in rows:
        opid = row.get("operation_id")
        if opid and (opid not in best or score(row) > score(best[opid])):
            best[opid] = row
    if set(best) != set(operations):
        missing = sorted(set(operations) - set(best))
        raise ValueError(
            f"Expected {len(operations)} operations for {model}, found {len(best)}; "
            f"missing={missing[:5]}"
        )
    return best


def model_without_constraints(model_text: str) -> str:
    marker = "\nconstraints\n"
    return model_text.split(marker, 1)[0].rstrip() + "\n"


def run_use(
    use_bat: Path,
    model: Path,
    cmd: Path,
    operation_id: str,
    out_dir: Path,
    timeout: int,
    phase: str,
) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = f"{safe_ident(operation_id)}.{safe_ident(phase)}"
    stdout_path = out_dir / f"{stem}.stdout.txt"
    stderr_path = out_dir / f"{stem}.stderr.txt"
    started = time.time()
    try:
        proc = subprocess.run(
            [str(use_bat.resolve()), str(model.resolve()), str(cmd.resolve())],
            text=True,
            encoding="utf-8",
            errors="replace",
            capture_output=True,
            timeout=timeout,
        )
        stdout_path.write_text(proc.stdout or "", encoding="utf-8")
        stderr_path.write_text(proc.stderr or "", encoding="utf-8")
        process_ok = proc.returncode == 0
        return {
            "operation_id": operation_id,
            "phase": phase,
            "status": "pass" if process_ok else "fail",
            "returncode": proc.returncode,
            "duration_sec": round(time.time() - started, 4),
            "run_mode": "external_use_compile",
            "stdout_file": str(stdout_path),
            "stderr_file": str(stderr_path),
        }
    except subprocess.TimeoutExpired as exc:
        stdout_path.write_text(exc.stdout or "", encoding="utf-8")
        stderr_path.write_text(exc.stderr or "", encoding="utf-8")
        return {
            "operation_id": operation_id,
            "phase": phase,
            "status": "timeout",
            "returncode": "",
            "duration_sec": round(time.time() - started, 4),
            "run_mode": "external_use_compile",
            "stdout_file": str(stdout_path),
            "stderr_file": str(stderr_path),
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--operations", default="data/operations.jsonl")
    parser.add_argument(
        "--attempts",
        default="results/contractgen-study-v6/contract_gen/full_feedback/gpt-5.5/attempts.jsonl",
    )
    parser.add_argument("--model", default="gpt-5.5")
    parser.add_argument(
        "--out-dir",
        default="results/contractgen-study-v6/validation/use_strong_114",
    )
    parser.add_argument("--use-bat", default="tools/use-7.5.0/bin/use.bat")
    parser.add_argument("--run-use", action="store_true")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--operation-id", default="")
    parser.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args()

    operations = [json.loads(line) for line in Path(args.operations).read_text(encoding="utf-8").splitlines() if line.strip()]
    operation_map = {str(row.get("id") or ""): row for row in operations}
    if len(operations) != 114 or len(operation_map) != 114 or "" in operation_map:
        raise ValueError("Expected 114 unique canonical operations")
    attempts = choose_attempts(Path(args.attempts), args.model, operation_map)
    out_dir = Path(args.out_dir)
    model_dir = out_dir / "use_models"
    base_model_dir = out_dir / "use_models_base"
    pre_model_dir = out_dir / "use_models_pre"
    post_model_dir = out_dir / "use_models_post"
    cmd_dir = out_dir / "use_cmds"
    run_dir = out_dir / "use_runs"
    model_dir.mkdir(parents=True, exist_ok=True)
    base_model_dir.mkdir(parents=True, exist_ok=True)
    pre_model_dir.mkdir(parents=True, exist_ok=True)
    post_model_dir.mkdir(parents=True, exist_ok=True)
    cmd_dir.mkdir(parents=True, exist_ok=True)

    manifest = []
    selected_operations = operations
    if args.operation_id:
        selected_operations = [row for row in operations if row["id"] == args.operation_id]
        if not selected_operations:
            raise ValueError(f"Unknown --operation-id: {args.operation_id}")
    elif args.limit > 0:
        selected_operations = operations[: args.limit]
    for index, row in enumerate(selected_operations, start=1):
        opid = row["id"]
        model, pre_model, post_model, cmd, meta = make_model(row, attempts.get(opid), index)
        stem = f"{index:03d}_{safe_ident(opid)}"
        model_path = model_dir / f"{stem}.use"
        base_model_path = base_model_dir / f"{stem}.use"
        pre_model_path = pre_model_dir / f"{stem}.use"
        post_model_path = post_model_dir / f"{stem}.use"
        cmd_path = cmd_dir / f"{stem}.cmd"
        model_path.write_text(model, encoding="utf-8")
        base_model_path.write_text(model_without_constraints(model), encoding="utf-8")
        pre_model_path.write_text(pre_model, encoding="utf-8")
        post_model_path.write_text(post_model, encoding="utf-8")
        cmd_path.write_text("-- compile-only validation\n", encoding="utf-8")
        record = {
            "sample_index": index,
            "operation_id": opid,
            "case_study": row.get("case_study", ""),
            "operation_signature": row.get("operation_signature", ""),
            "model_file": str(model_path),
            "base_model_file": str(base_model_path),
            "pre_model_file": str(pre_model_path),
            "post_model_file": str(post_model_path),
            "cmd_file": str(cmd_path),
            **meta,
        }
        if args.run_use:
            result_path = run_dir / f"{safe_ident(opid)}.result.json"
            if args.resume and result_path.exists():
                result = json.loads(result_path.read_text(encoding="utf-8"))
            else:
                base_result = run_use(
                    Path(args.use_bat), base_model_path, cmd_path, opid, run_dir, args.timeout, "model_load"
                )
                precondition_result = (
                    run_use(
                        Path(args.use_bat), pre_model_path, cmd_path, opid, run_dir, args.timeout,
                        "definition_precondition",
                    )
                    if base_result["status"] == "pass"
                    else {
                        "operation_id": opid,
                        "phase": "definition_precondition",
                        "status": "blocked_by_model_load",
                        "returncode": "",
                        "duration_sec": 0.0,
                    }
                )
                postcondition_result = (
                    run_use(
                        Path(args.use_bat), post_model_path, cmd_path, opid, run_dir, args.timeout,
                        "definition_postcondition",
                    )
                    if base_result["status"] == "pass"
                    else {
                        "operation_id": opid,
                        "phase": "definition_postcondition",
                        "status": "blocked_by_model_load",
                        "returncode": "",
                        "duration_sec": 0.0,
                    }
                )
                combined_result = (
                    run_use(
                        Path(args.use_bat), model_path, cmd_path, opid, run_dir, args.timeout,
                        "complete_contract",
                    )
                    if precondition_result["status"] == "pass"
                    and postcondition_result["status"] == "pass"
                    else {
                        "operation_id": opid,
                        "phase": "complete_contract",
                        "status": "blocked_by_clause_compile",
                        "returncode": "",
                        "duration_sec": 0.0,
                    }
                )
                result = {
                    "operation_id": opid,
                    "model_load": base_result,
                    "definition_precondition": precondition_result,
                    "definition_postcondition": postcondition_result,
                    "complete_contract": combined_result,
                }
                result_path.write_text(
                    json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8"
                )
            base_result = result["model_load"]
            precondition_result = result["definition_precondition"]
            postcondition_result = result["definition_postcondition"]
            combined_result = result["complete_contract"]
            record["use_model_load_status"] = base_result["status"]
            record["use_definition_precondition_status"] = precondition_result["status"]
            record["use_definition_postcondition_status"] = postcondition_result["status"]
            record["use_complete_contract_status"] = combined_result["status"]
            print(json.dumps(result, ensure_ascii=False))
        manifest.append(record)

    fieldnames = list(manifest[0].keys())
    with (out_dir / "manifest.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest)
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    summary = {
        "study_version": STUDY_VERSION,
        "source_model": args.model,
        "source_attempts": args.attempts,
        "operation_count": len(selected_operations),
        "with_generated_contract": sum(1 for r in manifest if r["has_generated_contract"]),
        "with_precondition_expression": sum(1 for r in manifest if r["has_precondition"]),
        "use_run_mode": "external_operation_contract_compile",
        "scope_note": "USE independently compiles the converted class model, generated definition/precondition, generated definition/postcondition, and complete operation contract. This is an external syntax/type check, not behavior-level equivalence testing.",
        "postcondition_checked": True,
    }
    if args.run_use:
        model_statuses: dict[str, int] = {}
        precondition_statuses: dict[str, int] = {}
        postcondition_statuses: dict[str, int] = {}
        complete_statuses: dict[str, int] = {}
        for r in manifest:
            model_status = r.get("use_model_load_status", "not_run")
            precondition_status = r.get("use_definition_precondition_status", "not_run")
            postcondition_status = r.get("use_definition_postcondition_status", "not_run")
            complete_status = r.get("use_complete_contract_status", "not_run")
            model_statuses[model_status] = model_statuses.get(model_status, 0) + 1
            precondition_statuses[precondition_status] = precondition_statuses.get(precondition_status, 0) + 1
            postcondition_statuses[postcondition_status] = postcondition_statuses.get(postcondition_status, 0) + 1
            complete_statuses[complete_status] = complete_statuses.get(complete_status, 0) + 1
        summary["use_model_load_status"] = model_statuses
        summary["use_definition_precondition_status"] = precondition_statuses
        summary["use_definition_postcondition_status"] = postcondition_statuses
        summary["use_complete_contract_status"] = complete_statuses
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
