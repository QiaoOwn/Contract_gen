"""Lock the v4 input, Oracle evidence and implementation for formal runs."""

import argparse
import hashlib
import json
import sys
from pathlib import Path

import run_rq1_validity_experiments as rq1

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
from check_rm2pt_v4_experiment_readiness import audit  # noqa: E402

DEFAULT_PROFILE = ROOT / "config/rm2pt-v4-formal-release-v4-hotfix2.json"
FILES = (
    "data/benchmark/rm2pt_authoritative_114_v4/operations.jsonl",
    "data/benchmark/rm2pt_authoritative_114_v4/manifest.json",
    "data/benchmark/rm2pt_authoritative_114_v4/views/direct-contract-v1.jsonl",
    "data/benchmark/rm2pt_authoritative_114_v4/views/direct-contract-v1.manifest.json",
    "data/benchmark/rm2pt_authoritative_114_v4/oracles/manifest.json",
    "data/benchmark/rm2pt_authoritative_114_v4/source_lab_replay_differences.json",
    "results/contractgen-rm2pt-v4/validation/oracle-review-ledger-post-final-library-20261108/obligation-review-ledger.jsonl",
    "results/contractgen-rm2pt-v4/validation/global-lab-release-witnesses-v2-20261108.jsonl",
    "results/contractgen-rm2pt-v4/validation/global-lab-release-witnesses-v2-20261108.summary.json",
    "config/constraint-solving-policy.json",
    "src/app/service/prompts/generationRules.v5.json",
    "src/app/service/prompts/generationGrammar.txt",
    "script/run_constraint_guided_formal_batch.py",
    "script/run_constraint_guided_operation.py",
    "script/rm2pt_v4_release_profile.py",
    "script/run_rq1_validity_experiments.py",
    "script/constraint_oracle_profile.py",
    "scripts/inspect_constraint_task_plan.ts",
    "src/app/service/graph.ts",
    "src/app/service/generationConfiguration.ts",
    "src/app/service/generateOclWithJsonMode.ts",
    "src/app/service/summarizeJestResults.ts",
    "src/app/api/generate-ocl/route.ts",
)


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def current_profile():
    checked = audit()
    if (not checked["static_integrity_ok"] or checked["release_witness_passed"] != 114 or
            checked["judgments"] != {"REVIEWED_IN_REPORT": 390}):
        raise ValueError("v4 input/Oracle/witness evidence is not complete")
    from constraint_oracle_profile import ADJUDICATED_INPUT, ADJUDICATED_PROFILE, direct_view_identity
    direct_view_identity(ROOT, ROOT / "data/benchmark/rm2pt_authoritative_114_v4/views/direct-contract-v1.jsonl")
    _, implementation_hash = rq1.development_repair_protocol_fingerprint()
    return {
        "schema_version": "rm2pt-v4-formal-release-v4-hotfix2",
        "role": "formal-experiment-protocol-not-independent-review",
        "formal_experiment_ready": True,
        "input": ADJUDICATED_INPUT,
        "oracle_profile": ADJUDICATED_PROFILE,
        "direct_view": "data/benchmark/rm2pt_authoritative_114_v4/views/direct-contract-v1.jsonl",
        "operation_count": 114,
        "reviewed_obligations": 390,
        "selected_oracle_witnesses": 114,
        "witness_scope": "finite-selected-jest-scenarios-not-semantic-equivalence",
        "source_candidate_witnesses": 105,
        "laboratory_candidate_witnesses": 9,
        "independent_expert_review_claimed": False,
        "generation_protocol": {
            "constraint_solving": True,
            "development_behavior": False,
            "feedback_mode": "full",
            "max_generation_attempts": 5,
            "stopping_rule": "first-preexecution-valid-or-five-generations",
            "hidden_jest_feedback": False,
        },
        "direct_control_protocol": {
            "constraint_solving": False,
            "development_behavior": False,
            "feedback_mode": "full",
            "max_generation_attempts": 5,
            "stopping_rule": "first-preexecution-valid-or-five-generations",
            "hidden_jest_feedback": False,
        },
        "implementation_hash": implementation_hash,
        "files": {name: sha256(ROOT / name) for name in FILES},
    }


def verify_profile(path=DEFAULT_PROFILE):
    path = Path(path).resolve()
    if path != DEFAULT_PROFILE or not path.is_file():
        raise ValueError("Use the canonical immutable v4 release profile")
    saved = json.loads(path.read_text(encoding="utf-8"))
    if saved != current_profile():
        raise ValueError("Formal release profile or a pinned file has changed")
    return saved, sha256(path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--write", action="store_true", help="Create the canonical profile once")
    args = parser.parse_args()
    if args.write:
        if DEFAULT_PROFILE.exists():
            parser.error("Release profile already exists; do not overwrite it")
        DEFAULT_PROFILE.write_text(json.dumps(current_profile(), indent=2) + "\n", encoding="utf-8")
    profile, digest = verify_profile()
    print(json.dumps({"profile": str(DEFAULT_PROFILE), "sha256": digest,
                      "operation_count": profile["operation_count"],
                      "formal_experiment_ready": profile["formal_experiment_ready"]}, indent=2))


if __name__ == "__main__":
    main()
