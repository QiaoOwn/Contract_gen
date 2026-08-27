#!/usr/bin/env python3
import json
from collections import defaultdict
from pathlib import Path

root = Path(__file__).resolve().parents[1]
ops = []
with (root / "data" / "operations.jsonl").open(encoding="utf-8-sig") as handle:
    for line in handle:
        if line.strip():
            ops.append(json.loads(line))

keys = []
for op in ops:
    key = f"{op['project']}-{op['service']}-{op['operation']}"
    keys.append((op["id"], key))

unique = sorted({key for _, key in keys})
grouped = defaultdict(list)
for oid, key in keys:
    grouped[key].append(oid)
shared = {key: ids for key, ids in grouped.items() if len(ids) > 1}

test_root = root / "test"
actual = sorted(
    path.name
    for path in test_root.iterdir()
    if path.is_dir() and (path / "index.test.ts").exists()
)
root_tests = sorted(path.name for path in test_root.glob("*.test.ts"))
missing = [key for key in unique if key not in actual]
extra = [name for name in actual if name not in set(unique)]

print(f"operations={len(ops)}")
print(f"unique_test_dir_keys={len(unique)}")
print(f"shared_test_dirs={len(shared)}")
print(f"actual_operation_test_dirs={len(actual)}")
print(f"root_level_test_files={len(root_tests)}")
print(f"missing={len(missing)}")
print(f"extra={len(extra)}")
for key, ids in sorted(shared.items()):
    print(f"SHARED\t{key}\t{len(ids)}\t{','.join(ids)}")
for key in missing:
    print(f"MISSING\t{key}")
for name in extra:
    print(f"EXTRA\t{name}")
for name in root_tests:
    print(f"ROOT\t{name}")
