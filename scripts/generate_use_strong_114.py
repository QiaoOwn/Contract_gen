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
        return "String", set(), many
    if raw in PRIMITIVES:
        return raw, set(), many
    return safe_ident(raw), set(), many


def parse_model_context(text: str) -> tuple[dict[str, Entity], dict[str, set[str]]]:
    entities: dict[str, Entity] = {}
    enums: dict[str, set[str]] = {}
    current: Entity | None = None
    section: str | None = None
    pending_name: str | None = None

    for raw_line in (text or "").splitlines():
        line = raw_line.rstrip()
        stripped = line.strip()
        if stripped == "Entities":
            current = None
            section = None
            continue
        name_match = re.fullmatch(r"\d+\.Name:\s*(.+)", stripped)
        top_name_match = re.fullmatch(r"Name:\s*(.+)", stripped)
        if top_name_match and raw_line.startswith("    Name:"):
            entity_name = safe_ident(top_name_match.group(1))
            current = entities.setdefault(entity_name, Entity(entity_name))
            section = None
            pending_name = None
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
        return f"Set({safe_ident(set_match.group(1))})"
    return safe_ident(raw)


def base_type(type_name: str) -> str:
    set_match = re.fullmatch(r"Set\(([A-Za-z_][A-Za-z0-9_]*)\)", type_name)
    if set_match:
        return safe_ident(set_match.group(1))
    return type_name


def normalize_ocl(expr: str, enum_values: set[str]) -> str:
    expr = (expr or "").strip()
    expr = re.sub(r'"([^"\\]*(?:\\.[^"\\]*)*)"', lambda m: "'" + m.group(1).replace("'", "\\'") + "'", expr)
    expr = re.sub(r"\ballInstance\s*\(", "allInstances(", expr)
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


def make_model(row: dict, attempt: dict | None, index: int) -> tuple[str, str, dict]:
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
    self_attrs, self_navs = infer_self_context(definitions, sections["precondition"], entities, params)
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
        lines.append(f"class {entity.name}")
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

    body = precondition if precondition else "true"
    for name, type_name, expr in reversed(definitions):
        body = f"let {name} : {type_name} = {normalize_ocl(expr, enum_values)} in\n      {body}"
    for param in reversed(params):
        pname = safe_ident(param["name"])
        ptype = use_type_for_param(param["type"])
        body = f"let {pname} : {ptype} = self.{pname} in\n      {body}"

    lines.extend(["constraints", "", "context OperationContext", f"  inv {safe_ident(row['operation_name'])}DefinitionPreconditionTypecheck:"])
    if contract and precondition:
        lines.append("    " + body.replace("\n", "\n    "))
    else:
        lines.append("    true")
    lines.append("")

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
        "entity_count": len(entities),
        "enum_count": len(enums),
    }
    return "\n".join(lines), "\n".join(cmd_lines), meta


def choose_attempts(path: Path) -> dict[str, dict]:
    if not path.exists():
        return {}
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

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
    return best


def run_use(use_bat: Path, model: Path, cmd: Path, operation_id: str, out_dir: Path, timeout: int) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = safe_ident(operation_id)
    stdout_path = out_dir / f"{stem}.stdout.txt"
    stderr_path = out_dir / f"{stem}.stderr.txt"
    started = time.time()
    try:
        proc = subprocess.run(
            [str(use_bat.resolve()), str(model.resolve()), str(cmd.resolve())],
            text=True,
            capture_output=True,
            timeout=timeout,
        )
        stdout_path.write_text(proc.stdout or "", encoding="utf-8")
        stderr_path.write_text(proc.stderr or "", encoding="utf-8")
        return {
            "operation_id": operation_id,
            "status": "pass" if proc.returncode == 0 else "fail",
            "returncode": proc.returncode,
            "duration_sec": round(time.time() - started, 4),
            "run_mode": "semantic_load_only",
            "stdout_file": str(stdout_path),
            "stderr_file": str(stderr_path),
        }
    except subprocess.TimeoutExpired as exc:
        stdout_path.write_text(exc.stdout or "", encoding="utf-8")
        stderr_path.write_text(exc.stderr or "", encoding="utf-8")
        return {
            "operation_id": operation_id,
            "status": "timeout",
            "returncode": "",
            "duration_sec": round(time.time() - started, 4),
            "run_mode": "semantic_load_only",
            "stdout_file": str(stdout_path),
            "stderr_file": str(stderr_path),
        }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--operations", default="data/operations.jsonl")
    parser.add_argument("--attempts", default="results/rq_gpt_5_4_full_oracle_fixed/attempts.jsonl")
    parser.add_argument("--out-dir", default="results/oclvm_sanity_check_114_strong")
    parser.add_argument("--use-bat", default="tools/use-7.5.0/bin/use.bat")
    parser.add_argument("--run-use", action="store_true")
    parser.add_argument("--timeout", type=int, default=30)
    args = parser.parse_args()

    operations = [json.loads(line) for line in Path(args.operations).read_text(encoding="utf-8").splitlines() if line.strip()]
    attempts = choose_attempts(Path(args.attempts))
    out_dir = Path(args.out_dir)
    model_dir = out_dir / "use_models"
    cmd_dir = out_dir / "use_cmds"
    run_dir = out_dir / "use_runs"
    model_dir.mkdir(parents=True, exist_ok=True)
    cmd_dir.mkdir(parents=True, exist_ok=True)

    manifest = []
    for index, row in enumerate(operations, start=1):
        opid = row["id"]
        model, cmd, meta = make_model(row, attempts.get(opid), index)
        stem = f"{index:03d}_{safe_ident(opid)}"
        model_path = model_dir / f"{stem}.use"
        cmd_path = cmd_dir / f"{stem}.cmd"
        model_path.write_text(model, encoding="utf-8")
        cmd_path.write_text(cmd, encoding="utf-8")
        record = {
            "sample_index": index,
            "operation_id": opid,
            "case_study": row.get("case_study", ""),
            "operation_signature": row.get("operation_signature", ""),
            "model_file": str(model_path),
            "cmd_file": str(cmd_path),
            **meta,
        }
        if args.run_use:
            result = run_use(Path(args.use_bat), model_path, cmd_path, opid, run_dir, args.timeout)
            (run_dir / f"{safe_ident(opid)}.result.json").write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
            record.update({f"use_{k}": v for k, v in result.items() if k != "operation_id"})
            print(json.dumps(result, ensure_ascii=False))
        manifest.append(record)

    fieldnames = list(manifest[0].keys())
    with (out_dir / "manifest.csv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(manifest)
    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    summary = {
        "operation_count": len(operations),
        "with_generated_contract": sum(1 for r in manifest if r["has_generated_contract"]),
        "with_precondition_expression": sum(1 for r in manifest if r["has_precondition"]),
        "use_run_mode": "semantic_load_only",
        "scope_note": "USE loads the model_context-derived class model and typechecks generated definition/precondition invariants; operation postconditions are preserved as comments.",
    }
    if args.run_use:
        statuses: dict[str, int] = {}
        for r in manifest:
            statuses[r.get("use_status", "not_run")] = statuses.get(r.get("use_status", "not_run"), 0) + 1
        summary["use_status"] = statuses
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
