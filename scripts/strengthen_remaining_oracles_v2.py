#!/usr/bin/env python3
"""Classify and strengthen remaining non-CRUD operation oracles."""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST = ROOT / "test"


def weak_dirs() -> list[Path]:
    out = []
    for path in sorted(TEST.iterdir()):
        index = path / "index.test.ts"
        if not index.is_file():
            continue
        if "expectPreconditionRejected" in index.read_text(encoding="utf-8"):
            # already has rejection; may still be incomplete but skip for this pass
            # Exception: vacuous suites won't have it - they stay in weak if no helper
            continue
        # Also treat as strong if already imports contractOracle and documents vacuous
        text = index.read_text(encoding="utf-8")
        if "contractOracle" in text and "vacuous precondition" in text.lower():
            continue
        out.append(path)
    return out


def vacuous(entry: str) -> bool:
    return bool(
        re.search(
            r"/\*Precondition Start\*/[\s\S]{0,250}logic:\s*\(\)\s*=>\s*true\b",
            entry,
        )
    )


def entity_repos(entry: str) -> list[str]:
    return sorted(set(re.findall(r"map\.set\((\w+),", entry)))


def service_name(entry: str) -> str:
    exports = re.findall(r"^export \{(\w+)\};", entry, flags=re.M)
    return exports[-1]


def method_name(dir_name: str) -> str:
    return dir_name.rsplit("-", 1)[-1]


def extract_happy(index_text: str) -> str:
    match = re.search(
        r"it\(\s*['\"]Happy Path['\"][^,]*,\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\}\);",
        index_text,
    )
    if not match:
        match = re.search(r"it\([^)]+,\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\}\);", index_text)
    if not match:
        raise ValueError("no it() body")
    return match.group(1).rstrip()


def describe_label(index_text: str, fallback: str) -> str:
    match = re.search(r"describe\(([^,]+),", index_text)
    return match.group(1) if match else repr(fallback)


def identifiers_used(happy: str) -> set[str]:
    return set(re.findall(r"\b([A-Z][A-Za-z0-9_]*)\b", happy))


def find_call_args(happy: str, method: str) -> str:
    match = re.search(rf"(?:service|svc)\.{re.escape(method)}\(([\s\S]*?)\);", happy)
    return match.group(1).strip() if match else ""


def rewrite(dir_path: Path) -> str:
    index_path = dir_path / "index.test.ts"
    entry_path = dir_path / "entry.ts"
    index_text = index_path.read_text(encoding="utf-8")
    entry = entry_path.read_text(encoding="utf-8")
    entities = entity_repos(entry)
    service = service_name(entry)
    method = method_name(dir_path.name)
    happy = extract_happy(index_text)
    label = describe_label(index_text, dir_path.name)
    used = identifiers_used(happy)
    # Import entities + service + enums/classes referenced in happy path that appear in entry exports
    export_blocks = re.findall(r"export \{([\s\S]*?)\};", entry)
    exported: set[str] = set()
    for block in export_blocks:
        for part in block.split(","):
            name = part.strip().split()[0] if part.strip() else ""
            if name:
                exported.add(name)
    import_names = set(entities) | {service, "getRepository"}
    for name in used:
        if name in exported and name not in {"Map", "Array", "Object", "String", "Number", "Boolean"}:
            import_names.add(name)
    # Keep stable-ish order
    ordered = sorted(n for n in import_names if n != "getRepository") + (
        ["getRepository"] if "getRepository" in import_names else []
    )
    imports = "import {" + ", ".join(ordered) + "} from './entry';"
    clear = ", ".join(f"getRepository({e})" for e in entities)

    if vacuous(entry):
        helper = "import {clearRepositories} from '../helpers/contractOracle';"
        content = f"""{imports}
{helper}

// Vacuous precondition (true): rejection case not required by test/ORACLE.md.
describe({label}, () => {{
  beforeEach(() => {{
    clearRepositories({clear});
  }});

  it('Happy Path', () => {{{happy}
  }});
}});
"""
        index_path.write_text(content, encoding="utf-8")
        return "vacuous"

    helper = (
        "import {clearRepositories, expectPreconditionRejected} "
        "from '../helpers/contractOracle';"
    )
    call_args = find_call_args(happy, method)

    # Heuristic rejection strategies
    rejection_body = ""
    if call_args:
        parts = [p.strip() for p in call_args.split(",")]
        first = parts[0]
        if first.startswith(("'", '"')):
            parts[0] = "''"
        elif re.fullmatch(r"\d+(\.\d+)?", first):
            parts[0] = "99"
        elif re.fullmatch(r"[A-Za-z_][\w\.]*", first):
            parts[0] = "99"
        else:
            parts[0] = "99"
        bad = ", ".join(parts)
        rejection_body = f"""
  it('rejects when precondition is violated', () => {{
    const service = new {service}();
    expectPreconditionRejected(() => service.{method}({bad}));
  }});
"""
    else:
        # no-arg method: call on fresh service with unset state
        rejection_body = f"""
  it('rejects when precondition is violated', () => {{
    const service = new {service}();
    expectPreconditionRejected(() => service.{method}());
  }});
"""

    content = f"""{imports}
{helper}

describe({label}, () => {{
  beforeEach(() => {{
    clearRepositories({clear});
  }});

  it('Happy Path', () => {{{happy}
  }});
{rejection_body}}});
"""
    index_path.write_text(content, encoding="utf-8")
    return "updated"


def classify() -> None:
    for path in weak_dirs():
        entry = (path / "entry.ts").read_text(encoding="utf-8")
        kind = "VAC" if vacuous(entry) else "PRE"
        print(f"{kind}\t{path.name}")


def main() -> None:
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "classify":
        classify()
        return
    updated = vacuous_n = failed = 0
    for path in weak_dirs():
        try:
            status = rewrite(path)
            print(f"{status}\t{path.name}")
            if status == "vacuous":
                vacuous_n += 1
            else:
                updated += 1
        except Exception as exc:  # noqa: BLE001
            failed += 1
            print(f"FAIL\t{path.name}\t{exc}")
    print(f"updated={updated} vacuous={vacuous_n} failed={failed}")


if __name__ == "__main__":
    main()
