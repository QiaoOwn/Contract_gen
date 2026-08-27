import argparse
import json
import re
import shutil
from collections import Counter
from pathlib import Path


CLASS_RE = re.compile(r"\bclass\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{(?P<body>.*?)\n\}", re.S)
FIELD_RE = re.compile(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*([^;]+);", re.M)


def safe_name(value: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9_]+", "_", value).strip("_")
    return cleaned or "unnamed"


def use_comment(text: str) -> str:
    lines = []
    for line in (text or "").splitlines():
        lines.append("-- " + line.replace("\t", "  "))
    return "\n".join(lines)


def parse_json_fragments(raw: str) -> list[dict]:
    out = []
    for line in (raw or "").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return out


def extract_original_entity(row: dict) -> str:
    for fragment in parse_json_fragments(row.get("raw_output", "")):
        ts = fragment.get("TypeScript Generator", {}).get("typescript")
        if isinstance(ts, dict) and ts.get("originalEntity"):
            return ts["originalEntity"]
        parser_ts = fragment.get("TypeScript Parser", {}).get("typescript")
        if isinstance(parser_ts, dict) and parser_ts.get("originalEntity"):
            return parser_ts["originalEntity"]
    return ""


def infer_use_type(ts_type: str, attr: str) -> str | None:
    t = ts_type.strip()
    t = t.replace("dayjs.Dayjs", "String")
    t = re.sub(r"\s*\|\s*undefined", "", t)
    if t.endswith("[]") or t.startswith("Array<"):
        return None
    if t in {"string", "String"}:
        return "String"
    if t in {"boolean", "Boolean"}:
        return "Boolean"
    if t in {"number", "Number"}:
        if re.search(r"(id|num|count|quantity|status|role|score|age|times)$", attr, re.I):
            return "Integer"
        return "Real"
    if t in {"integer", "Integer"}:
        return "Integer"
    if t in {"real", "Real", "float", "double"}:
        return "Real"
    return None


def extract_classes(entity_ts: str) -> dict[str, list[tuple[str, str]]]:
    classes: dict[str, list[tuple[str, str]]] = {}
    for match in CLASS_RE.finditer(entity_ts or ""):
        class_name = safe_name(match.group(1))
        attrs: list[tuple[str, str]] = []
        for field, ts_type in FIELD_RE.findall(match.group("body")):
            use_type = infer_use_type(ts_type, field)
            if use_type:
                attrs.append((safe_name(field), use_type))
        classes[class_name] = attrs
    return classes


def extract_ocl_classes(contract: str) -> set[str]:
    names = set(re.findall(r"\b([A-Z][A-Za-z0-9_]*)\.allInstance(?:s)?\s*\(", contract or ""))
    names.update(re.findall(r"\blet\s+[A-Za-z_][A-Za-z0-9_]*\s*:\s*([A-Z][A-Za-z0-9_]*)\b", contract or ""))
    names.update(re.findall(r"\b([A-Z][A-Za-z0-9_]*)\s*=", contract or ""))
    return {safe_name(n) for n in names if n not in {"Boolean", "Integer", "Real", "String"}}


def choose_rows(path: Path) -> list[dict]:
    rows = [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]

    def score(row: dict) -> tuple[int, int, int, int]:
        return (
            1 if row.get("execution_valid") else 0,
            1 if row.get("syntax_valid") else 0,
            1 if row.get("extraction_success") else 0,
            -int(row.get("attempt") or 999),
        )

    best: dict[str, dict] = {}
    for row in rows:
        opid = row.get("operation_id", "")
        if not opid:
            continue
        if opid not in best or score(row) > score(best[opid]):
            best[opid] = row
    return [best[k] for k in sorted(best)]


def manual_sample_map(manual_dir: Path) -> dict[str, tuple[Path, Path]]:
    mapping: dict[str, tuple[Path, Path]] = {}
    model_dir = manual_dir / "use_models"
    cmd_dir = manual_dir / "use_cmds"
    if not model_dir.exists():
        return mapping
    for model_path in model_dir.glob("*.use"):
        stem = model_path.stem
        logical = re.sub(r"^\d+_", "", stem)
        cmd_path = cmd_dir / f"{stem}.cmd"
        if cmd_path.exists():
            mapping[logical] = (model_path, cmd_path)
    return mapping


def make_skeleton(row: dict, index: int) -> tuple[str, str]:
    opid = row["operation_id"]
    contract = row.get("extracted_ocl") or ""
    entity_ts = extract_original_entity(row)
    classes = extract_classes(entity_ts)
    for class_name in extract_ocl_classes(contract):
        classes.setdefault(class_name, [])
    if not classes:
        classes["ContractContext"] = []
    classes.setdefault("ContractContext", [("SampleIndex", "Integer")])

    model_name = safe_name(f"USE114_{index:03d}_{opid}")
    lines = [
        f"model {model_name}",
        "",
        "-- Automatic USE skeleton conversion for corpus-level traceability.",
        "-- This file records the generated contract in a USE-loadable model.",
        "-- It is not a hand-authored semantic translation of the full operation behavior.",
        f"-- operation_id: {opid}",
        f"-- case_study: {row.get('case_study', '')}",
        f"-- operation_signature: {row.get('operation_signature', '')}",
        "",
        "-- Original generated contract:",
        use_comment(contract),
        "",
    ]

    for class_name in sorted(classes):
        attrs = classes[class_name]
        lines.append(f"class {class_name}")
        if attrs:
            lines.append("attributes")
            seen = set()
            for attr, typ in attrs:
                if attr in seen:
                    continue
                seen.add(attr)
                lines.append(f"  {attr} : {typ}")
        lines.append("end")
        lines.append("")

    lines.extend(
        [
            "constraints",
            "",
            "context ContractContext",
            "  inv GeneratedContractIsRepresented:",
            "    true",
            "",
        ]
    )

    cmd = "\n".join(
        [
            "!create ctx : ContractContext",
            f"!set ctx.SampleIndex := {index}",
            "check",
            "",
        ]
    )
    return "\n".join(lines), cmd


def main() -> None:
    raise SystemExit(
        "This legacy skeleton exporter is disabled for the v3 study. "
        "Use scripts/generate_use_strong_114.py, which validates study, input, prompt, and model provenance."
    )
    # Historical implementation retained below for auditability.
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--attempts",
        default="results/contractgen-study-v6/contract_gen/full_feedback/attempts.jsonl",
    )
    parser.add_argument(
        "--out-dir",
        default="results/contractgen-study-v6/validation/legacy_use_skeleton_114",
    )
    parser.add_argument(
        "--manual-dir",
        default="results/contractgen-study-v6/validation/ocltsvm_sanity_samples",
    )
    args = parser.parse_args()

    attempts = Path(args.attempts)
    out_dir = Path(args.out_dir)
    model_dir = out_dir / "use_models"
    cmd_dir = out_dir / "use_cmds"
    model_dir.mkdir(parents=True, exist_ok=True)
    cmd_dir.mkdir(parents=True, exist_ok=True)

    rows = choose_rows(attempts)
    manual = manual_sample_map(Path(args.manual_dir))
    manifest = []
    counts = Counter()

    for i, row in enumerate(rows, start=1):
        opid = row["operation_id"]
        stem = f"{i:03d}_{safe_name(opid)}"
        model_path = model_dir / f"{stem}.use"
        cmd_path = cmd_dir / f"{stem}.cmd"
        if opid in manual:
            src_model, src_cmd = manual[opid]
            shutil.copyfile(src_model, model_path)
            shutil.copyfile(src_cmd, cmd_path)
            mode = "manual_reused_from_20_sample"
        else:
            model, cmd = make_skeleton(row, i)
            model_path.write_text(model, encoding="utf-8")
            cmd_path.write_text(cmd, encoding="utf-8")
            mode = "automatic_skeleton"
        counts[mode] += 1
        manifest.append(
            {
                "sample_index": i,
                "operation_id": opid,
                "case_study": row.get("case_study"),
                "operation_signature": row.get("operation_signature"),
                "model_file": str(model_path),
                "cmd_file": str(cmd_path),
                "conversion_mode": mode,
                "source_attempt": row.get("attempt"),
                "source_syntax_valid": row.get("syntax_valid"),
                "source_execution_valid": row.get("execution_valid"),
            }
        )

    (out_dir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    with (out_dir / "manifest.csv").open("w", encoding="utf-8", newline="") as f:
        import csv

        writer = csv.DictWriter(f, fieldnames=list(manifest[0].keys()))
        writer.writeheader()
        writer.writerows(manifest)

    summary = {
        "source_attempts": str(attempts),
        "operation_count": len(rows),
        "conversion_mode_counts": dict(counts),
    }
    (out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
