#!/usr/bin/env python3
"""Strengthen operation Jest suites with precondition-rejection cases.

This script rewrites only suites that still have a single Happy Path case and
match a recognized CRUD/query pattern. Complex workflow suites must be updated
by hand (see test/ORACLE.md).
"""

from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "test"


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def already_strengthened(text: str) -> bool:
    return "expectPreconditionRejected" in text or "rejects when" in text


CREATE_RE = re.compile(
    r"import \{(?P<imports>[^}]+)\} from '\./entry';\s*"
    r"describe\('(?P<label>[^']+)', \(\) => \{\s*"
    r"it\('Happy Path', \(\) => \{(?P<body>.*?)\}\);\s*"
    r"\}\);",
    re.S,
)


def extract_service_call(body: str) -> tuple[str, str, str] | None:
    m = re.search(
        r"const service = new (?P<service>\w+)\(\);\s*"
        r"const result = service\.(?P<method>\w+)\((?P<args>.*?)\);",
        body,
        re.S,
    )
    if not m:
        return None
    return m.group("service"), m.group("method"), m.group("args").strip()


def entity_from_create(imports: str, method: str) -> str | None:
    # createBankCard -> BankCard; createItem -> Item
    if not method.startswith("create"):
        return None
    name = method[len("create") :]
    for part in [p.strip() for p in imports.split(",")]:
        if part == name:
            return name
    return name if name else None


def strengthen_create(path: Path, text: str) -> str | None:
    m = CREATE_RE.match(text.strip() + "\n")
    if not m:
        return None
    imports = m.group("imports")
    label = m.group("label")
    body = m.group("body")
    call = extract_service_call(body)
    if not call:
        return None
    service, method, args = call
    if not method.startswith("create"):
        return None
    entity = entity_from_create(imports, method)
    if not entity or "getRepository" not in imports:
        return None

    # Keep original happy-path body, but rename the case.
    happy = body.strip()
    # First positional arg is treated as the identifier for duplicate rejection.
    first_arg = args.split(",")[0].strip()
    return f"""import {{{imports.strip()}}} from './entry';
import {{clearRepositories, expectPreconditionRejected}} from '../helpers/contractOracle';

describe('{label}', () => {{
  beforeEach(() => {{
    clearRepositories(getRepository({entity}));
  }});

  it('Happy Path: creates {entity} and returns true', () => {{
    {happy}
  }});

  it('rejects when {entity} identifier is already used', () => {{
    const service = new {service}();
    expect(service.{method}({args})).toBe(true);
    expectPreconditionRejected(() => service.{method}({args}));
    expect(getRepository({entity})).toHaveLength(1);
  }});
}});
"""


QUERY_RE = CREATE_RE  # same shape


def strengthen_query(path: Path, text: str) -> str | None:
    m = QUERY_RE.match(text.strip() + "\n")
    if not m:
        return None
    imports = m.group("imports")
    label = m.group("label")
    body = m.group("body")
    call = extract_service_call(body)
    if not call:
        # query often assigns differently
        m2 = re.search(
            r"const service = new (?P<service>\w+)\(\);\s*"
            r"(?:const result = )?service\.(?P<method>\w+)\((?P<args>.*?)\);",
            body,
            re.S,
        )
        if not m2:
            return None
        service, method, args = m2.group("service"), m2.group("method"), m2.group("args").strip()
    else:
        service, method, args = call
    if not method.startswith("query"):
        return None
    entity = method[len("query") :]
    missing_arg = "999999"
    return f"""import {{{imports.strip()}}} from './entry';
import {{clearRepositories, expectPreconditionRejected}} from '../helpers/contractOracle';

describe('{label}', () => {{
  beforeEach(() => {{
    clearRepositories(getRepository({entity}));
  }});

  it('Happy Path: returns the referenced {entity}', () => {{
    {body.strip()}
  }});

  it('rejects when {entity} does not exist', () => {{
    const service = new {service}();
    expectPreconditionRejected(() => service.{method}({missing_arg}));
  }});
}});
"""


def strengthen_modify(text: str) -> str | None:
    m = CREATE_RE.match(text.strip() + "\n")
    if not m:
        return None
    imports = m.group("imports")
    label = m.group("label")
    body = m.group("body")
    call = extract_service_call(body)
    if not call:
        return None
    service, method, args = call
    if not method.startswith("modify"):
        return None
    entity = method[len("modify") :]
    if "getRepository" not in imports:
        return None
    missing_args = re.sub(r"^[^,]+", "999999", args, count=1) if args else "999999"
    return f"""import {{{imports.strip()}}} from './entry';
import {{clearRepositories, expectPreconditionRejected}} from '../helpers/contractOracle';

describe('{label}', () => {{
  beforeEach(() => {{
    clearRepositories(getRepository({entity}));
  }});

  it('Happy Path: updates {entity} and returns true', () => {{
    {body.strip()}
  }});

  it('rejects when {entity} does not exist', () => {{
    const service = new {service}();
    expectPreconditionRejected(() => service.{method}({missing_args}));
    expect(getRepository({entity})).toHaveLength(0);
  }});
}});
"""


def strengthen_delete(text: str) -> str | None:
    m = CREATE_RE.match(text.strip() + "\n")
    if not m:
        return None
    imports = m.group("imports")
    label = m.group("label")
    body = m.group("body")
    call = extract_service_call(body)
    if not call:
        return None
    service, method, args = call
    if not method.startswith("delete"):
        return None
    entity = method[len("delete") :]
    if "getRepository" not in imports:
        return None
    missing_args = "999999"
    return f"""import {{{imports.strip()}}} from './entry';
import {{clearRepositories, expectPreconditionRejected}} from '../helpers/contractOracle';

describe('{label}', () => {{
  beforeEach(() => {{
    clearRepositories(getRepository({entity}));
  }});

  it('Happy Path: removes {entity} and returns true', () => {{
    {body.strip()}
  }});

  it('rejects when {entity} does not exist', () => {{
    const service = new {service}();
    expectPreconditionRejected(() => service.{method}({missing_args}));
  }});
}});
"""


def main() -> None:
    changed = []
    skipped = []
    failed = []
    for path in sorted(ROOT.glob("*/index.test.ts")):
        text = read(path)
        if already_strengthened(text):
            skipped.append(path.name)
            continue
        new_text = (
            strengthen_create(path, text)
            or strengthen_query(path, text)
            or strengthen_modify(text)
            or strengthen_delete(text)
        )
        if new_text is None:
            failed.append(str(path.relative_to(ROOT.parent)))
            continue
        path.write_text(new_text, encoding="utf-8")
        changed.append(str(path.relative_to(ROOT.parent)))
    print(f"changed={len(changed)} skipped={len(skipped)} manual={len(failed)}")
    for item in changed:
        print(f"CHANGED\t{item}")
    for item in failed:
        print(f"MANUAL\t{item}")


if __name__ == "__main__":
    main()
