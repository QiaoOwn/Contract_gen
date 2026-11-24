"""Bind a development run to one explicit input and evaluation profile."""
import hashlib
import json
from pathlib import Path

from oracle_suite_lock import verify_lock

CURRENT_INPUT = "data/benchmark/rm2pt_authoritative_114/operations.jsonl"
CURRENT_PROFILE = "rm2pt-authoritative-preparation"
REVISED_INPUT = "data/benchmark/rm2pt_authoritative_114_v2/operations.jsonl"
REVISED_PROFILE = "rm2pt-authoritative-preparation-v2"
FINAL_INPUT = "data/benchmark/rm2pt_authoritative_114_v3/operations.jsonl"
FINAL_PROFILE = "rm2pt-authoritative-preparation-v3"
ADJUDICATED_INPUT = "data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl"
ADJUDICATED_PROFILE = "rm2pt-authoritative-preparation-v4"
ACTIVE_STUDY_VERSION = "contractgen-rm2pt-v4"
ACTIVE_INPUT = ADJUDICATED_INPUT
ACTIVE_ORACLE_PROFILE = ADJUDICATED_PROFILE
DIRECT_VIEW_INPUT = "data/benchmark/rm2pt_authoritative_114_v4/views/direct-contract-v1.jsonl"
LEGACY_INPUT = "data/benchmark/lab_adjudicated_114_v2/operations-lab-adjudicated-114-v2.jsonl"
LEGACY_PROFILE = "lab-adjudicated-114-v1"
PROFILES = (CURRENT_PROFILE, REVISED_PROFILE, FINAL_PROFILE, ADJUDICATED_PROFILE, LEGACY_PROFILE)


def suite_identity(root: Path, source: Path, profile: str) -> dict:
    root, source = root.resolve(), source.resolve()
    expected = {CURRENT_PROFILE: CURRENT_INPUT, REVISED_PROFILE: REVISED_INPUT,
                FINAL_PROFILE: FINAL_INPUT, ADJUDICATED_PROFILE: ADJUDICATED_INPUT,
                LEGACY_PROFILE: LEGACY_INPUT}.get(profile)
    if profile not in PROFILES or source != (root / expected).resolve():
        raise ValueError("Input and Oracle profile do not match; do not mix evaluation standards")
    if profile == LEGACY_PROFILE:
        revision, sha = verify_lock(root)
        return dict(profile=profile, revision=revision, lock_sha256=sha,
                    role="historical-development-replay", formal_experiment_ready=False)
    base = root / ("data/benchmark/rm2pt_authoritative_114_v4" if profile == ADJUDICATED_PROFILE else
                   "data/benchmark/rm2pt_authoritative_114_v3" if profile == FINAL_PROFILE else
                   "data/benchmark/rm2pt_authoritative_114_v2" if profile == REVISED_PROFILE
                   else "data/benchmark/rm2pt_authoritative_114")
    prepared = json.loads((base / "manifest.json").read_text(encoding="utf-8"))
    manifest_path = base / "oracles/manifest.json"
    content = manifest_path.read_bytes()
    manifest = json.loads(content)
    sha = hashlib.sha256(source.read_bytes()).hexdigest()
    rows = [json.loads(line) for line in source.read_text(encoding="utf-8").splitlines() if line.strip()]
    records = manifest.get("records", [])
    if (manifest.get("role") != "preparation-only-not-formal-suite"
            or manifest.get("formal_experiment_ready") is not False
            or manifest.get("input") != expected
            or manifest.get("input_sha256") != sha or prepared.get("output_sha256") != sha
            or len(rows) != 114 or len({row["id"] for row in rows}) != 114
            or manifest.get("operation_count") != 114
            or manifest.get("version") != ("rm2pt-authoritative-oracle-preparation-v4" if profile == ADJUDICATED_PROFILE
                                            else "rm2pt-authoritative-oracle-preparation-v3" if profile == FINAL_PROFILE
                                            else "rm2pt-authoritative-oracle-preparation-v2"
                                            if profile == REVISED_PROFILE else "rm2pt-authoritative-oracle-preparation-v1")
            or len(records) != manifest.get("prepared_operation_count")
            or len({row["id"] for row in records}) != len(records)):
        raise ValueError("Current input/Oracle preparation manifest integrity mismatch")
    return dict(profile=profile, revision=manifest["version"],
                lock_sha256=hashlib.sha256(content).hexdigest(),
                role="source-aligned-development-preparation", formal_experiment_ready=False)


def direct_view_identity(root: Path, view: Path) -> dict:
    root, view = root.resolve(), view.resolve()
    if view != (root / DIRECT_VIEW_INPUT).resolve():
        raise ValueError("Direct-contract view path differs from the current v4 bundle")
    metadata = json.loads(view.with_suffix(".manifest.json").read_text(encoding="utf-8"))
    registry = json.loads((root / "config/study-versions.json").read_text(encoding="utf-8"))
    if registry.get("default_study") != ACTIVE_STUDY_VERSION or registry.get("default_generation_profile") != ACTIVE_STUDY_VERSION:
        raise ValueError("Current study and generation defaults do not identify the same v4 bundle")
    components = registry["studies"][ACTIVE_STUDY_VERSION]["components"]
    source = root / ADJUDICATED_INPUT
    oracle = suite_identity(root, source, ADJUDICATED_PROFILE)
    source_bytes, view_bytes = source.read_bytes(), view.read_bytes()
    if (metadata.get("version") != "rm2pt-v4-direct-contract-view-v1"
            or metadata.get("source") != ADJUDICATED_INPUT
            or metadata.get("output") != DIRECT_VIEW_INPUT
            or metadata.get("source_sha256") != hashlib.sha256(source_bytes).hexdigest()
            or metadata.get("output_sha256") != hashlib.sha256(view_bytes).hexdigest()
            or metadata.get("operation_count") != 114
            or metadata.get("generation_profile") != ACTIVE_STUDY_VERSION
            or metadata.get("oracle_profile") != ADJUDICATED_PROFILE
            or metadata.get("formal_experiment_ready") is not False):
        raise ValueError("Current direct-contract view differs from its v4 source or manifest")
    originals = {row["id"]: row for row in (json.loads(line) for line in source_bytes.splitlines() if line.strip())}
    rows = [json.loads(line) for line in view_bytes.splitlines() if line.strip()]
    if len(rows) != 114 or len(originals) != 114 or len({row["id"] for row in rows}) != 114:
        raise ValueError("Current direct-contract view must retain 114 distinct v4 operations")
    for row in rows:
        original = originals.get(row["id"])
        if not original or any(row.get(key) != original.get(key) for key in
                ("description", "model_context", "operation_signature", "parameters", "return_type", "requirement_hash", "context_hash")):
            raise ValueError(f"Direct-contract view changed frozen v4 semantics: {row['id']}")
        if (row.get("input_hash") != hashlib.sha256(row["canonical_user_message"].encode("utf-8")).hexdigest()
                or row.get("prompt_version") != components["prompt"]["version"]
                or row.get("prompt_hash") != components["prompt"]["sha256"]
                or row.get("generation_grammar_version") != components["generation_grammar"]["version"]
                or row.get("generation_grammar_hash") != components["generation_grammar"]["sha256"]
                or row.get("generation_rules_version") != components["generation_rules"]["version"]
                or row.get("generation_rules_hash") != components["generation_rules"]["sha256"]):
            raise ValueError(f"Direct-contract view has a different generation profile: {row['id']}")
    return oracle
