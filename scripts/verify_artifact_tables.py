#!/usr/bin/env python3
"""Read-only reconstruction of selected retained v6 metrics; no API calls or writes.

This checks recorded provenance and decisions, not backend semantics or every
manuscript table. Offline replay is not a newly executed controlled experiment.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
STUDY_VERSION = "contractgen-study-v6"
RESULTS = ROOT / "results" / STUDY_VERSION
MODELS = ("gpt-5.5", "gpt-5.4", "gemini-3.5-flash", "claude-opus-4-7")
RUNS = {
    "full_feedback": "contract_gen/full_feedback",
    "generic_feedback": "contract_gen/generic_feedback",
    "no_feedback": "contract_gen/no_feedback",
    "purellm_fixed5": "baselines/purellm-fixed5",
    "codexprompt_transfer": "baselines/codexprompt-uml-zero-shot-fixed5",
    "pathocl_transfer": "baselines/pathocl-jaccard-top5",
}
TRANSFER_PROMPTS = {
    "codexprompt_transfer": "codexprompt-uml-zero-shot-contract-transfer-v3:uml-zero-shot-contract",
    "pathocl_transfer": "pathocl-jaccard-topk-contract-transfer-v4",
}
TRANSFER_CONFIG_HASH = "60c869257aaf4dc09aa8ed8d1729af680f90f4f8f96f58ea825b288c7eec2364"


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text(encoding="utf-8"))


def read_jsonl(path):
    rows = []
    for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
        if line.strip():
            try:
                row = json.loads(line)
            except json.JSONDecodeError as error:
                raise ValueError(f"{path}:{number}: {error}") from error
            require(isinstance(row, dict), f"{path}:{number}: expected an object")
            rows.append(row)
    return rows


def index_unique(rows, fields):
    indexed = {}
    for row in rows:
        key = tuple(row.get(field) for field in fields)
        require(all(value is not None and value != "" for value in key), f"Missing key: {key}")
        require(key not in indexed, f"Duplicate key: {key}")
        indexed[key] = row
    return indexed


def load_manifest():
    rows = read_jsonl(ROOT / "data/operations.jsonl")
    manifest = {key[0]: row for key, row in index_unique(rows, ("id",)).items()}
    require(len(manifest) == 114, "Expected 114 canonical operation-context instances")
    require(all(row.get("input_schema_version") == "contractgen-operation-input-v3"
                and row.get("prompt_version") == "contractgen-system-prompt-v7"
                for row in rows), "Unexpected canonical input/prompt version")
    return manifest


def pre_execution_valid(row):
    if "pre_execution_valid" in row:
        return row["pre_execution_valid"] is True
    return (row.get("syntax_valid") is True
            and row.get("typescript_generation_ok") is True
            and row.get("typescript_parse_ok") is True
            and not row.get("parser_skipped"))


def generation_count(row):
    if "llm_generation_count" in row:
        return row["llm_generation_count"]
    # Both archived fixed-budget baseline protocols log one request per row.
    require(row.get("sampling_protocol") in ("fixed_independent_samples", "ranked_path_fixed_budget"),
            "Missing generation count outside a known fixed-budget baseline")
    return 1


def validate_rows(rows, manifest, model, fixed_five=False, transfer=None):
    require(bool(rows), "Empty attempt file")
    index_unique(rows, ("operation_id", "model", "attempt"))
    groups = defaultdict(list)
    for row in rows:
        operation_id = row.get("operation_id")
        require(operation_id in manifest, f"Unknown operation: {operation_id}")
        canonical = manifest[operation_id]
        require(row.get("study_version") == STUDY_VERSION, f"{operation_id}: study mismatch")
        require(row.get("model") == model, f"{operation_id}: model mismatch")
        for key in ("input_schema_version", "input_hash", "requirement_hash", "context_hash"):
            require(bool(canonical.get(key)) and row.get(key) == canonical[key],
                    f"{operation_id}: {key} mismatch")
        shared_hash = row.get("shared_prompt_hash") or row.get("prompt_hash")
        require(shared_hash == canonical["prompt_hash"], f"{operation_id}: shared prompt mismatch")
        require(bool(row.get("generation_prompt_version")) and bool(row.get("generation_prompt_hash")),
                f"{operation_id}: missing method prompt provenance")
        if transfer:
            require(row["generation_prompt_version"] == TRANSFER_PROMPTS[transfer],
                    f"{operation_id}: unexpected transfer prompt version")
            require(row["generation_prompt_hash"] == hashlib.sha256(row["prompt"].encode("utf-8")).hexdigest(),
                    f"{operation_id}: transfer prompt hash mismatch")
            require(row.get("generation_config_hash") == TRANSFER_CONFIG_HASH
                    and row.get("generation_output_mode") == "text"
                    and row.get("generation_grammar_hash") == ""
                    and row.get("generation_rules_hash") == "",
                    f"{operation_id}: unexpected archived transfer configuration")
        else:
            for key in ("generation_config_hash", "generation_grammar_hash", "generation_rules_hash"):
                require(row.get(key) == canonical[key], f"{operation_id}: {key} mismatch")
            require(row["generation_prompt_hash"] == canonical["prompt_hash"],
                    f"{operation_id}: controlled method prompt mismatch")
        for key in ("syntax_valid", "execution_valid"):
            require(type(row.get(key)) is bool, f"{operation_id}: {key} must be Boolean")
        if "pre_execution_valid" in row:
            require(type(row["pre_execution_valid"]) is bool,
                    f"{operation_id}: pre_execution_valid must be Boolean")
        require(not pre_execution_valid(row) or row["syntax_valid"],
                f"{operation_id}: pre-execution success without parser acceptance")
        require(not row["execution_valid"] or pre_execution_valid(row),
                f"{operation_id}: execution success without pre-execution validity")
        require(not row.get("parser_skipped") and not row.get("validate_skipped"),
                f"{operation_id}: skipped parser evaluation")
        require(not row.get("execution_eval_skipped") or (
            row["syntax_valid"] is False and row["execution_valid"] is False
            and row.get("validation_stage") == "parser"
        ), f"{operation_id}: execution skipped without a recorded parser failure")
        require(type(row.get("attempt")) is int and row["attempt"] > 0,
                f"{operation_id}: invalid attempt index")
        calls = generation_count(row)
        require(type(calls) is int and calls >= 0, f"{operation_id}: invalid generation count")
        groups[operation_id].append(row)
    require(set(groups) == set(manifest), "Incomplete operation coverage")
    for operation_id, group in groups.items():
        group.sort(key=lambda row: row["attempt"])
        require([row["attempt"] for row in group] == list(range(1, len(group) + 1)),
                f"{operation_id}: non-contiguous attempts")
        total = 0
        for row in group:
            total += generation_count(row)
            if row.get("budget_unit") == "llm_generation":
                require(row.get("cumulative_llm_generation_count") == total,
                        f"{operation_id}: inconsistent cumulative generation count")
        require(0 < total <= 5, f"{operation_id}: generation budget outside 1..5")
        if fixed_five:
            require(len(group) == total == 5, f"{operation_id}: incomplete fixed-five sampling")
        else:
            require(not any(pre_execution_valid(row) for row in group[:-1]),
                    f"{operation_id}: generation continued after the stopping boundary")
            require(pre_execution_valid(group[-1]) or total == 5,
                    f"{operation_id}: unfinished trajectory")
    return dict(groups)


def summarize(groups):
    return {
        "operations": len(groups),
        "parse_at_5": sum(any(row["syntax_valid"] for row in group) for group in groups.values()),
        "pass_at_5": sum(any(row["execution_valid"] for row in group) for group in groups.values()),
        "generations": sum(generation_count(row) for group in groups.values() for row in group),
        "execution_skips_after_parser_failure": sum(bool(row.get("execution_eval_skipped"))
                                                     for group in groups.values() for row in group),
    }


def early_stop_replay(groups):
    """Stop only at pre-execution validity, never at a favorable Jest outcome."""
    prefixes, selections = {}, []
    for operation_id, group in groups.items():
        require(len(group) == 5 and all(generation_count(row) == 1
                and row.get("sampling_protocol") == "fixed_independent_samples" for row in group),
                "Replay requires complete fixed-five independent candidate sequences")
        ordered = sorted(group, key=lambda row: row["attempt"])
        require([row["attempt"] for row in ordered] == [1, 2, 3, 4, 5], "Invalid replay order")
        stop = next((i for i, row in enumerate(ordered) if pre_execution_valid(row)), 4)
        prefixes[operation_id] = ordered[:stop + 1]
        selected = ordered[stop]
        selections.append({
            "operation_id": operation_id, "selected_attempt": selected["attempt"],
            "pre_execution_valid": pre_execution_valid(selected),
            "selected_candidate_pass": selected["execution_valid"],
        })
    return {"analysis_kind": "offline_counterfactual_replay", **summarize(prefixes),
            "selected_candidate_pass_count": sum(row["selected_candidate_pass"] for row in selections),
            "selections": selections}


def candidate_hash(candidate):
    value = json.dumps(candidate, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def paired_recovery(shared, repairs, manifest):
    initial = index_unique(shared, ("operation_id",))
    require({key[0] for key in initial} == set(manifest), "Incomplete paired initial candidates")
    for row in shared + repairs:
        require(row.get("paired_study_version") == "paired-feedback-ablation-v1",
                "Paired protocol version mismatch")
        require(all(type(row.get(key)) is bool for key in (
            "syntax_valid", "pre_execution_valid", "execution_valid")),
            "Paired decisions must be Boolean")
        require(not row["pre_execution_valid"] or row["syntax_valid"], "Invalid paired parser decision")
        require(not row["execution_valid"] or row["pre_execution_valid"], "Invalid paired execution decision")
    for row in shared:
        canonical = manifest[row["operation_id"]]
        require(row.get("study_version") == STUDY_VERSION and row.get("model") == "gpt-5.5",
                "Paired study/model mismatch")
        for field in ("input_schema_version", "input_hash", "prompt_hash", "generation_config_hash"):
            require(row.get(field) == canonical[field], f"Paired {field} mismatch")
        require(row.get("generation_count") == 1, "Paired initial candidate must cost one generation")
        require(row.get("initial_candidate_hash") == candidate_hash(row["initial_ocl"]),
                "Paired initial candidate hash mismatch")
    failures = {row["operation_id"] for row in shared if not pre_execution_valid(row)}
    branches = index_unique(repairs, ("operation_id", "treatment"))
    require(set(branches) == {(op, treatment) for op in failures for treatment in ("none", "generic", "full")},
            "Incomplete or unexpected paired repair branches")
    for (operation_id, _), row in branches.items():
        source = initial[(operation_id,)]
        require(row.get("study_version") == STUDY_VERSION and row.get("model") == source["model"],
                "Paired repair study/model mismatch")
        require(row.get("input_hash") == source["input_hash"], "Paired repair input mismatch")
        require(row.get("initial_candidate_hash") == source["initial_candidate_hash"]
                and candidate_hash(row["initial_ocl"]) == source["initial_candidate_hash"],
                "Repair does not use the shared initial candidate")
        require(row.get("final_candidate_hash") == candidate_hash(row["final_ocl"]),
                "Paired final candidate hash mismatch")
        extra = row.get("additional_generation_count")
        require(type(extra) is int and 1 <= extra <= 4
                and row.get("total_generation_count") == extra + 1, "Invalid paired budget")
        require(pre_execution_valid(row) or extra == 4, "Unfinished paired branch")
    return [{
        "treatment": treatment, "shared_initial_candidates": len(shared),
        "shared_initial_failures": len(failures),
        "recovered_count": sum(pre_execution_valid(row) for row in repairs if row["treatment"] == treatment),
        "final_pass_count": sum(row["execution_valid"] for row in shared)
                            + sum(row["execution_valid"] for row in repairs if row["treatment"] == treatment),
        "total_generation_count": len(shared)
                                  + sum(row["additional_generation_count"] for row in repairs
                                        if row["treatment"] == treatment),
    } for treatment in ("none", "generic", "full")]


def agreement(rows, left, right, clause):
    decisions = [row for row in rows if row["clause"] == clause
                 and row.get(f"{left}_status") == ("ok" if left == "use" else "recorded")
                 and row.get(f"{right}_status") == ("ok" if right == "use" else "recorded")
                 and type(row.get(f"{left}_decision")) is bool
                 and type(row.get(f"{right}_decision")) is bool]
    return {"planned": sum(row["clause"] == clause for row in rows), "decidable": len(decisions),
            "agree": sum(row[f"{left}_decision"] == row[f"{right}_decision"] for row in decisions)}


def build_report():
    manifest = load_manifest()
    metrics, groups = [], {}
    for setting, relative in RUNS.items():
        for model in MODELS if setting == "full_feedback" else ("gpt-5.5",):
            source = RESULTS / relative / model / "attempts.jsonl"
            try:
                group = validate_rows(read_jsonl(source), manifest, model,
                                      relative.startswith("baselines/"),
                                      setting if setting in TRANSFER_PROMPTS else None)
            except ValueError as error:
                raise ValueError(f"{source}: {error}") from error
            groups[(setting, model)] = group
            metrics.append({"setting": setting, "model": model, **summarize(group),
                            "source": source.relative_to(ROOT).as_posix(),
                            "comparison_scope": "text-output prompting transfer without generation grammar/rules"
                            if setting in TRANSFER_PROMPTS else "shared generation guidance"})
    replay = early_stop_replay(groups[("purellm_fixed5", "gpt-5.5")])
    fixed = summarize(groups[("purellm_fixed5", "gpt-5.5")])["generations"]
    full = summarize(groups[("full_feedback", "gpt-5.5")])["generations"]
    paired_dir = RESULTS / "rq3_paired/gpt-5.5"
    paired = paired_recovery(read_jsonl(paired_dir / "shared_initial_candidates.jsonl"),
                             read_jsonl(paired_dir / "paired_attempts.jsonl"), manifest)
    stored_paired = {row["treatment"]: row for row in read_json(paired_dir / "paired_summary.json")["results"]}
    for row in paired:
        for key in ("recovered_count", "final_pass_count", "total_generation_count"):
            require(row[key] == stored_paired[row["treatment"]][key], f"Paired summary mismatch: {key}")
    use_dir = RESULTS / "validation/use-external-gpt-5.5-v2"
    use_rows = read_json(use_dir / "manifest.json")
    require({key[0] for key in index_unique(use_rows, ("operation_id",))} == set(manifest),
            "Incomplete USE conversion manifest")
    use_counts = {field: dict(Counter(row[field] for row in use_rows)) for field in (
        "use_model_load_status", "use_definition_precondition_status",
        "use_definition_postcondition_status", "use_complete_contract_status")}
    stored_use = read_json(use_dir / "summary.json")
    for key, counts in use_counts.items():
        require(counts == stored_use[key], f"USE summary mismatch: {key}")
    scenarios = read_json(RESULTS / "validation/use_ocltsvm_semantic_agreement/final_30ops/scenario_results.json")
    index_unique(scenarios, ("scenario_id",))
    require(len(scenarios) == 90 and len({row["operation_id"] for row in scenarios}) == 30,
            "Incomplete retained 30-operation shared-state study")
    require(all(row["operation_id"] in manifest for row in scenarios)
            and Counter(row["clause"] for row in scenarios) == {"precondition": 60, "postcondition": 30},
            "Unexpected shared-state operations or clause coverage")
    return {
        "study_version": STUDY_VERSION,
        "scope": "Selected recorded metrics only; not a backend rerun or proof of semantic correctness.",
        "runs": metrics, "early_stop_replay": replay,
        "call_accounting": {
            "fixed_five_calls": fixed, "replay_calls": replay["generations"], "primary_full_calls": full,
            "fixed_to_full_difference": fixed - full,
            "fixed_to_replay_difference": fixed - replay["generations"],
            "replay_to_full_difference_not_a_causal_effect": replay["generations"] - full,
        },
        "paired_pilot": paired,
        "use_compile_only": use_counts,
        "shared_state_agreement": {
            "external_precondition": agreement(scenarios, "use", "ocltsvm", "precondition"),
            "external_postcondition": agreement(scenarios, "use", "ocltsvm", "postcondition"),
            "internal_precondition": agreement(scenarios, "ocltsvm", "jest", "precondition"),
            "internal_postcondition": agreement(scenarios, "ocltsvm", "jest", "postcondition"),
        },
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="Print full audit including replay selections as JSON")
    args = parser.parse_args()
    report = build_report()
    if args.json:
        print(json.dumps(report, indent=2, ensure_ascii=True))
        return
    print(report["scope"])
    print("\nSetting | Model | Operations | Parse@5 | Pass@5 | LLM calls")
    for row in report["runs"]:
        print(" | ".join(str(row[key]) for key in ("setting", "model", "operations", "parse_at_5", "pass_at_5", "generations")))
    replay = report["early_stop_replay"]
    print(f"\nOFFLINE EarlyStop-NoFB replay: calls={replay['generations']}, Parse@5={replay['parse_at_5']}, Pass@5={replay['pass_at_5']}")
    for section in ("call_accounting", "paired_pilot", "use_compile_only", "shared_state_agreement"):
        print(f"\n{section}\n{json.dumps(report[section], indent=2)}")
    print("\nNo files written. No model requests made. Paired recovery is a small pilot; USE compilation is not execution.")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, KeyError, TypeError) as error:
        raise SystemExit(f"Artifact verification failed: {error}") from None
