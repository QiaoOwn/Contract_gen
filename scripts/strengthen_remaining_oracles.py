#!/usr/bin/env python3
"""Strengthen CRUD-style operation oracles safely for TOSEM execution grounding.

Only rewrites index.test.ts for create/delete/modify/query/add* suites.
Imports every entity exported from entry.ts so clearRepositories is valid.
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TEST = ROOT / "test"
CRUD_RE = re.compile(
    r"-(create|delete|modify|query|add)[A-Za-z]*$",
    re.I,
)


def exported_names(entry: str) -> list[str]:
    match = re.search(r"export \{([\s\S]*?)\};", entry)
    if not match:
        return []
    names = []
    for part in match.group(1).split(","):
        name = part.strip().split()[0] if part.strip() else ""
        if name and name[0].isupper():
            names.append(name)
    return names


def entity_repos(entry: str) -> list[str]:
    return sorted(set(re.findall(r"map\.set\((\w+),", entry)))


def service_name(entry: str) -> str:
    exports = re.findall(r"^export \{(\w+)\};", entry, flags=re.M)
    return exports[-1]


def method_name(dir_name: str) -> str:
    return dir_name.rsplit("-", 1)[-1]


def is_vacuous_pre(entry: str) -> bool:
    return bool(
        re.search(
            r"/\*Precondition Start\*/[\s\S]{0,200}logic:\s*\(\)\s*=>\s*true\b",
            entry,
        )
    )


def is_create_pre(entry: str) -> bool:
    return bool(
        re.search(
            r"/\*Precondition Start\*/[\s\S]{0,400}oclIsUndefined\([^)]+\)\s*===\s*true",
            entry,
        )
    )


def extract_happy(index_text: str) -> str:
    match = re.search(
        r"it\(\s*['\"]Happy Path['\"][^,]*,\s*\(\)\s*=>\s*\{([\s\S]*?)\n\s*\}\);",
        index_text,
    )
    if not match:
        raise ValueError("happy path not found")
    return match.group(1).rstrip()


def describe_label(index_text: str, fallback: str) -> str:
    match = re.search(r"describe\(([^,]+),", index_text)
    return match.group(1) if match else repr(fallback)


def find_call_args(happy: str, method: str) -> str:
    match = re.search(rf"service\.{re.escape(method)}\(([\s\S]*?)\);", happy)
    return match.group(1).strip() if match else ""


def rewrite(dir_path: Path) -> str:
    index_path = dir_path / "index.test.ts"
    entry_path = dir_path / "entry.ts"
    index_text = index_path.read_text(encoding="utf-8")
    if "expectPreconditionRejected" in index_text:
        return "skip-already"
    entry = entry_path.read_text(encoding="utf-8")
    if is_vacuous_pre(entry):
        return "skip-vacuous"

    entities = entity_repos(entry)
    exported = exported_names(entry)
    # Prefer entity list from map.set, ensure they are exported
    entities = [e for e in entities if e in exported]
    service = service_name(entry)
    method = method_name(dir_path.name)
    happy = extract_happy(index_text)
    label = describe_label(index_text, dir_path.name)
    call_args = find_call_args(happy, method)

    import_names = sorted(set(entities + [service, "getRepository"]))
    imports = "import {" + ", ".join(import_names) + "} from './entry';"
    helper = (
        "import {clearRepositories, expectPreconditionRejected} "
        "from '../helpers/contractOracle';"
    )
    clear = ", ".join(f"getRepository({e})" for e in entities)

    if is_create_pre(entry) or method.lower().startswith(("create", "add")):
        rejection = f"""
  it('rejects when identifier is already used', () => {{
{happy}
    const again = new {service}();
    expectPreconditionRejected(() => again.{method}({call_args}));
  }});
"""
    else:
        bad = call_args
        if bad:
            parts = [p.strip() for p in bad.split(",")]
            first = parts[0]
            if first.startswith(("'", '"')):
                parts[0] = "''"
            else:
                parts[0] = "99"
            bad = ", ".join(parts)
        else:
            bad = "99"
        rejection = f"""
  it('rejects when referenced entity does not exist', () => {{
    const service = new {service}();
    expectPreconditionRejected(() => service.{method}({bad}));
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
{rejection}}});
"""
    index_path.write_text(content, encoding="utf-8")
    return "updated"


def main() -> None:
    updated = skipped = 0
    for path in sorted(TEST.iterdir()):
        if not path.is_dir() or not (path / "index.test.ts").is_file():
            continue
        if path.name.startswith(("Airport-", "AutomatedTellerMachine-")):
            continue
        if not CRUD_RE.search(path.name):
            continue
        try:
            status = rewrite(path)
        except Exception as exc:  # noqa: BLE001
            print(f"FAIL {path.name}: {exc}")
            skipped += 1
            continue
        if status == "updated":
            updated += 1
            print(f"OK {path.name}")
        else:
            skipped += 1
            print(f"{status} {path.name}")
    print(f"updated={updated} skipped={skipped}")


if __name__ == "__main__":
    main()
