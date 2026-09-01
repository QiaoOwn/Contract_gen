"""Apply one evidence-reviewed use case at a time; never infer requirements.

Annotations are handwritten in data/operation_revision/annotations. This program
only checks anchors, preserves immutable fields, copies existing reference text,
serializes JSONL, and produces the audit report. It never calls a model or tests.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
from collections import Counter
from functools import lru_cache
from pathlib import Path
try:
    from . import operation_resolution_support as resolutions
except ImportError:
    import operation_resolution_support as resolutions

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "data/operations_v2_scaffold.jsonl"
WORK = ROOT / "data/operation_revision"
ORIGINAL = WORK / "operations_v2_scaffold.original.jsonl"
LOG = WORK / "use_case_audits.jsonl"
IMMUTABLE = ("id", "case_study", "project", "useCase", "operation", "service", "entity",
             "operation_name", "operation_signature", "parameters", "return_type", "model_context",
             "description_original", "description")
FEATURES = {"query", "result_constraint", "attribute_update", "state_transition", "object_creation",
            "object_deletion", "association_add", "association_remove", "collection_operation",
            "pre_state_relation", "conditional_effect", "multi_object_effect", "temporary_state",
            "recursive_or_nested_call"}
LEAK = re.compile(r"allInstances\s*\(|\b(?:includes|excludes|ocl\w+|select|collect|forAll|exists|any)\s*\(|@pre|->|::|\bcontext\s+\w+\s+(?:inv|pre|post)\s*:", re.I)
GENERIC = re.compile(r"required inputs are present|referenced data is valid|applies the requested outcome|keeps data consistent|handles its intended business action", re.I)


def reject_constant(value):
    raise ValueError(f"Non-JSON numeric constant: {value}")


def unique_object(pairs):
    value = {}
    for key, item in pairs:
        require(key not in value, f"Duplicate JSON key: {key}")
        value[key] = item
    return value


def read_rows(path):
    return [json.loads(line, parse_constant=reject_constant, object_pairs_hook=unique_object)
            for line in path.read_text(encoding="utf-8-sig").splitlines() if line.strip()]


def require(ok, message):
    if not ok:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


@lru_cache(maxsize=None)
def sources(project, use_case, oracle_v2=False):
    command = ["node", str(ROOT / "scripts/inspect_operation_sources.cjs"), project, use_case]
    if oracle_v2:
        command.append("--oracle-v2")
    return json.loads(subprocess.run(command, cwd=ROOT, check=True, capture_output=True,
                                     encoding="utf-8").stdout)


def groups(rows):
    return list(dict.fromkeys((row["project"], row["useCase"]) for row in rows))


def anchor(source, field, quote):
    require(field in source["fields"], f"Missing source field {field}")
    data = source["fields"][field]
    require(bool(quote) and quote in data["value"], f"Source quote not found in {source['name']}.{field}: {quote}")
    return {"kind": "in_repository_description" if field == "description" else "encoded_reference_ocl",
            "path": data["path"], "start_line": data["start_line"], "end_line": data["end_line"],
            "field": field, "quote": quote, "source_sha256": sha(ROOT / data["path"])}


def review_findings(annotation):
    findings = []
    for finding in annotation.get("review_findings", []):
        require(bool(finding["assessment"]) and bool(finding["evidence"]), "Review finding needs evidence")
        evidence = []
        for item in finding["evidence"]:
            path = (ROOT / item["path"]).resolve()
            require(path.is_relative_to(ROOT), "Review evidence must stay inside repository")
            content = path.read_text(encoding="utf-8")
            quote = item["quote"]
            require(bool(quote) and quote in content, "Review evidence quote not found")
            start = content[:content.index(quote)].count("\n") + 1
            evidence.append({"path": path.relative_to(ROOT).as_posix(), "quote": quote,
                             "start_line": start, "end_line": start + quote.count("\n"),
                             "source_sha256": sha(path)})
        findings.append({"assessment": finding["assessment"], "evidence": evidence})
    return findings


def build_row(original, annotation, source):
    require(annotation["name"] == source["name"] == original["operation_name"], "Operation mapping mismatch")
    require(annotation["status"] in {"VERIFIED", "NEEDS_REVIEW", "NEEDS_SOURCE"}, "Invalid status")
    row = dict(original)
    historical_source = source
    resolution = annotation.get("resolution")
    upstream = resolutions.upstream_reference(source, resolution) if resolution else None
    if resolution and resolution.get("oracle_edits"):
        resolutions.check_oracle(source, resolution)
        source = next(s for s in sources(original["project"], original["useCase"], True)["operations"]
                      if s["name"] == original["operation_name"])
    require(original["parameters"] == source["parameters"] and original["return_type"] == source["return_type"],
            "Local declaration mismatch: retain metadata and review the source before applying")
    evidence = []
    for output, key, field in (("operation_intent", "intent", "postcondition"),
                               ("preconditions_nl", "pre", "precondition"),
                               ("postconditions_nl", "post", "postcondition")):
        clauses = [annotation[key]] if key == "intent" and annotation.get(key) else annotation.get(key, [])
        values = []
        for number, clause in enumerate(clauses):
            text, quote, *override = clause
            require(isinstance(text, str) and text.strip(), "Empty obligation")
            require(not LEAK.search(text), f"OCL surface leak: {text}")
            require(not GENERIC.search(text), f"Generic requirement: {text}")
            support = anchor(source, override[0] if override else field, quote)
            evidence.append({"target": output if key == "intent" else f"{output}[{number}]",
                             "claim": text, "evidence": [support],
                             "confidence": "explicit_in_local_source_not_upstream_certification"})
            values.append(text)
        row[output] = values[0] if key == "intent" and values else "" if key == "intent" else values
    row["quality_status"] = annotation["status"]
    row["missing_evidence"] = annotation.get("missing", [])
    row["source_conflicts"] = annotation.get("conflicts", [])
    row["review_findings"] = review_findings(annotation)
    require(row["quality_status"] != "NEEDS_SOURCE" or row["missing_evidence"], "NEEDS_SOURCE requires an explanation")
    require(row["quality_status"] != "VERIFIED" or (not row["missing_evidence"] and not row["source_conflicts"]),
            "Unresolved evidence cannot be VERIFIED")
    row["context_owner"] = source["service"]
    require(row["context_owner"] == original["service"], "Service owner mismatch; do not repair metadata automatically")
    reference_ok = annotation.get("reference_accepted", True)
    if reference_ok:
        require(bool(source["fields"].get("precondition", {}).get("value"))
                and bool(source["fields"].get("postcondition", {}).get("value")), "Incomplete reference")
        row["reference_contract"] = {
            target: [source["fields"][field]["value"]] if source["fields"].get(field, {}).get("value") else []
            for target, field in (("definitions", "definition"), ("preconditions", "precondition"), ("postconditions", "postcondition"))
        }
    else:
        row["reference_contract"] = original["reference_contract"]
        require(row["quality_status"] == "NEEDS_SOURCE", "Unaccepted reference must remain NEEDS_SOURCE")
    scenarios = source["scenarios"]
    audits = annotation["scenarios"]
    require(len(audits) == len(scenarios), f"Audit every scenario for {source['name']}: {len(scenarios)}")
    scenario_audits = []
    valid_targets = {item["target"] for item in evidence}
    for scenario, audit in zip(scenarios, audits):
        kind, targets, assessment = audit
        targets = [re.sub(r"^p(\d+)$", r"preconditions_nl[\1]", re.sub(r"^q(\d+)$", r"postconditions_nl[\1]", target)) for target in targets]
        require(kind in {"positive", "negative", "mixed"}, "Invalid scenario class")
        require(bool(assessment), "Missing scenario assessment")
        require(all(target in valid_targets for target in targets), f"Unknown obligation in {source['name']}")
        scenario_audits.append({"title": scenario["title"], "kind": kind, "path": source["test_path"],
                                "static_case_count": scenario["case_count"],
                                "start_line": scenario["start_line"], "end_line": scenario["end_line"],
                                "obligations": targets, "assessment": assessment})
    row["oracle_refs"] = {"jest_scenarios": [{k: item[k] for k in ("path", "title", "start_line", "end_line")}
                                           for item in scenario_audits], "external_engine": None}
    if resolution:
        row["resolution_audit"] = {"assessment": resolution["assessment"],
                                   "previous_issues": annotation["previous_issues"],
                                   "historical_test_source": historical_source["test_path"],
                                   "historical_test_sha256": sha(ROOT / historical_source["test_path"]),
                                   "oracle_edits": resolution.get("oracle_edits", []),
                                   "oracle_version": "v2-source-aligned-v1" if resolution.get("oracle_edits") else "historical-unchanged"}
    row["source_provenance"] = {
        "family": "RM2PT", "project": row["project"], "requirement_source": upstream,
        "reference_ocl_source": source["source"] if reference_ok else None,
        "reference_ocl_candidate_source": source["source"],
        "test_source": source["test_path"],
        "existing_description_source": {"path": "data/operation_revision/operations_v2_scaffold.original.jsonl", "operation_id": row["id"]},
        "source_note": "A pinned upstream formal operation specification was reviewed; its generated prose is not independent NL evidence. Local reference and upstream differences are documented in resolution_audit." if upstream else "Local encoded reference; no upstream operation fidelity review claimed for this record. Author-maintained Jest is corroboration, not independent ground truth.",
        "reference_acceptance_scope": "local encoded reference for clause traceability; no upstream or independent human certification" if reference_ok else "unresolved candidate; not accepted as ground truth",
        "source_sha256": sha(ROOT / source["source"]["path"]),
        "test_sha256": sha(ROOT / source["test_path"]) if source["test_path"] else None,
    }
    row["annotation_basis"] = ["reference_ocl" if reference_ok else "reference_ocl_candidate"]
    if upstream:
        row["annotation_basis"].insert(0, "upstream_formal_operation_specification")
    if scenarios:
        row["annotation_basis"].append("jest")
    if original["revision_status"] == "KEEP + NORMALIZE":
        row["annotation_basis"].append("existing_description_not_native_requirement")
    feature_evidence = {}
    for feature, field, quote in annotation.get("features", []):
        require(feature in FEATURES, f"Unknown feature: {feature}")
        feature_evidence[feature] = anchor(source, field, quote)
    row["semantic_features"] = list(feature_evidence)
    row["semantic_feature_evidence"] = feature_evidence
    row["semantic_feature_scope"] = "Features evidenced in the local source; an unresolved record can have known features without fully resolved NL semantics."
    row["difficulty"] = annotation.get("difficulty")
    require(row["difficulty"] in {None, "Easy", "Medium", "Hard"}, "Invalid difficulty")
    require(bool(annotation["difficulty_basis"]), "Explain difficulty from actual obligations")
    row["difficulty_basis"] = annotation["difficulty_basis"]
    row["difficulty_status"] = "UNRESOLVED" if row["difficulty"] is None else "LOCAL_EVIDENCE_ASSESSED"
    row["clause_evidence"] = evidence
    row["binding_context_evidence"] = anchor(source, "definition", source["fields"]["definition"]["value"]) if source["fields"].get("definition", {}).get("value") else None
    row["quality_status_scope"] = "VERIFIED means static consistency with available local reference and audited Jest declarations, not native-source certification, independent human sign-off, exhaustive coverage or runtime success."
    row["fidelity_audit"] = {
        "mode": "static_clause_and_scenario_review; no runtime execution or independent human review",
        "native_requirement_check": "PINNED_FORMAL_SPEC_REVIEWED_SEE_RESOLUTION" if upstream else "NOT_REVIEWED_FOR_THIS_RECORD",
        "local_declaration_check": "PARAMETERS_AND_RETURN_TYPE_MATCH; immutable signature/context retained",
        "model_context_usage": "Retained schema context, not an independently sourced behavioral requirement",
        "existing_description_check": annotation.get("description_audit", "Generic original retained verbatim for traceability; structured clauses reconstructed only from the cited local evidence."),
        "reference_check": annotation.get("reference_audit", "Listed clauses checked against verbatim local reference; unresolved issues are separately recorded. This is not an upstream fidelity certification."),
        "scenario_checks": scenario_audits,
        "effect_completeness_check": annotation["effects_audit"],
        "ocl_surface_leak_check": "PASS_ON_STRUCTURED_NL_ONLY",
        "unresolved_items": row["missing_evidence"] + row["source_conflicts"],
    }
    row["description_compatibility_status"] = "ORIGINAL_RETAINED_NOT_V2_GENERATION_INPUT"
    row["structured_input_ready"] = row["quality_status"] == "VERIFIED"
    row["generation_ready"] = False
    row["generation_boundary_note"] = "Use only locally verified structured NL plus immutable model/signature fields. Never send references, evidence, review findings or original descriptions to the generator. A separate generation-only view can be prepared; current-runner compatibility and publication approval are separate gates."
    row["revision_status"] = original["revision_status"] + " / EVIDENCE_REVIEWED"
    for key in IMMUTABLE:
        require(row.get(key) == original.get(key), f"Immutable field changed: {key}")
    return row


def resolve_annotation(annotation, source):
    return resolutions.apply_resolution(resolve_base_annotation(annotation, source), source)


def resolve_base_annotation(annotation, source):
    if "literal_contract_review" in annotation:
        return expand_literal_review(annotation, source)
    if "reuse" not in annotation:
        return annotation
    project, use_case = annotation["reuse"]
    require(any(event["project"] == project and event["useCase"] == use_case for event in read_rows(LOG)),
            "Only previously audited annotations may be reused")
    previous = next(op for op in sources(project, use_case)["operations"] if op["name"] == source["name"])
    require(previous["service"] == source["service"] and previous["test_path"] == source["test_path"], "Reuse owner/test mismatch")
    for field in ("definition", "precondition", "postcondition"):
        left, right = previous["fields"].get(field, {}).get("value"), source["fields"].get(field, {}).get("value")
        if annotation.get("allow_whitespace_only") and left is not None and right is not None:
            require(not re.search(r"['\"]", left + right), "Whitespace reuse excludes string literals")
            left, right = re.sub(r"\s+", " ", left).strip(), re.sub(r"\s+", " ", right).strip()
        require(left == right, "Reuse requires identical decoded reference fields (or explicitly reviewed whitespace-only differences)")
    require(previous["scenarios"] == source["scenarios"], "Reuse scenario mismatch")
    annotations = json.loads((WORK / "annotations" / project / (use_case + ".json")).read_text(encoding="utf-8"))
    return resolve_base_annotation(next(item for item in annotations if item["name"] == source["name"]), previous)


def expand_literal_review(annotation, source):
    """Expand reviewed literal clauses only after a full-reference equality check.

    Entity, key, action, fields and test assessments are explicitly annotated,
    never inferred from the operation name, parameter list or CRUD convention.
    """
    config = annotation["literal_contract_review"]
    action, noun, entity, variable, selected = (config[k] for k in ("action", "noun", "entity", "variable", "selected"))
    attribute, parameter = config["key"]
    binding = config["binding"]
    definition = f"{selected}:{entity} = {entity}.allInstances()->any({binding}:{entity} | {binding}.{attribute} = {parameter})"
    guard = f"{selected}.oclIsUndefined() = {'true' if action == 'create' else 'false'}"
    expected_pre = guard
    if config.get("membership_guard"):
        expected_pre += f" and {entity}.allInstances()->includes({selected})"
    fields = config.get("assignments", [])
    assignments = [f"{variable}.{field} = {param}" for field, param, _ in fields]
    if action == "create":
        expected_post = f"let {variable}:{entity} in {variable}.oclIsNew() and " + " and ".join(assignments + [f"{entity}.allInstances()->includes({variable})", "result = true"])
    elif action == "modify":
        expected_post = " and ".join(assignments + ["result = true"])
    elif action == "query":
        expected_post = f"result = {selected}"
    elif action == "delete":
        expected_post = f"{entity}.allInstances()->excludes({selected}) and result = true"
    else:
        raise ValueError("Unsupported literal action")
    for field, expected in (("definition", definition), ("precondition", expected_pre), ("postcondition", expected_post)):
        actual = source["fields"][field]["value"]
        require(not re.search(r"['\"]", actual), "Literal review excludes string expressions")
        require(re.sub(r"\s+", "", actual) == re.sub(r"\s+", "", expected), f"Complete literal contract mismatch: {source['name']}.{field}")
    pre = [[f"No {noun} with the supplied {parameter} exists." if action == "create" else f"A {noun} with the supplied {parameter} exists.", guard]]
    if config.get("membership_guard"):
        pre.append([f"The selected {noun} is among the stored {noun} records.", f"{entity}.allInstances()->includes({selected})"])
    post = []
    if action == "create":
        post.append([f"Create a new {noun}.", f"{variable}.oclIsNew()"])
    post.extend([[f"Set the {'new' if action == 'create' else 'selected'} {noun}'s {label} to the supplied {param}.", assignment] for (_, param, label), assignment in zip(fields, assignments)])
    if action == "create":
        post.append([f"Store the new {noun} in the system's {noun} records.", f"{entity}.allInstances()->includes({variable})"])
    if action == "delete":
        post.append([f"Remove the selected {noun} from the system's stored {noun} records.", f"{entity}.allInstances()->excludes({selected})"])
    post.append([f"Return the selected {noun}." if action == "query" else "Return true.", f"result = {selected}" if action == "query" else "result = true"])
    intent = {"create": f"Register a new {noun} with the specified fields.", "modify": f"Update the specified fields of the selected {noun}.", "query": f"Retrieve the {noun} identified by {parameter}.", "delete": f"Remove the {noun} identified by {parameter} from the stored records."}[action]
    feature = {"create": "object_creation", "modify": "attribute_update", "query": "query", "delete": "object_deletion"}[action]
    return {"name": annotation["name"], "status": config.get("status", "VERIFIED"),
            "intent": [intent, post[0][1]], "pre": pre, "post": post,
            "features": [[feature, "postcondition", post[0][1]], ["result_constraint", "postcondition", post[-1][1]]],
            "difficulty": config.get("difficulty", "Easy" if action == "query" else "Medium"),
            "difficulty_basis": config.get("difficulty_basis", "Exact reviewed lookup and scalar result." if action == "query" else "Exact reviewed single-object effect; no branching, pre-state arithmetic or association effects."),
            "conflicts": config.get("conflicts", []),
            "scenarios": [["positive", [f"q{i}" for i in range(len(post))], config["positive_audit"]], ["negative", ["p0"], config["negative_audit"]]],
            "effects_audit": "Entire definition/pre/post checked by literal equality after whitespace normalization. No additional guards, links, cascading deletion, frame guarantees or parameter assignments inferred."}


def apply_group(project, use_case, refresh=False):
    if not ORIGINAL.exists():
        WORK.mkdir(parents=True, exist_ok=True)
        ORIGINAL.write_bytes(TARGET.read_bytes())
    original = read_rows(ORIGINAL)
    current = read_rows(TARGET)
    require(len(original) == len(current) == 114, "Expected exactly 114 operations")
    require([row['id'] for row in original] == [row['id'] for row in current], "IDs/order changed")
    progress = read_rows(LOG) if LOG.exists() else []
    order = groups(original)
    key = (project, use_case)
    index = order.index(key)
    require(index < len(progress) if refresh else index == len(progress), "Review use cases sequentially; refresh only completed groups")
    data = sources(project, use_case)
    source_map = {op["name"]: op for op in data["operations"]}
    ann_path = WORK / "annotations" / project / (use_case + ".json")
    annotations = json.loads(ann_path.read_text(encoding="utf-8"))
    annotations = {item["name"]: item for item in annotations}
    target_rows = [row for row in original if (row["project"], row["useCase"]) == key]
    require(set(annotations) == {row["operation_name"] for row in target_rows}, "Annotate the whole use case")
    replacement = {row["id"]: build_row(row, resolve_annotation(annotations[row["operation_name"]], source_map[row["operation_name"]]), source_map[row["operation_name"]])
                   for row in target_rows}
    output = [replacement.get(row["id"], row) for row in current]
    for before, after in zip(original, output):
        require(all(before.get(field) == after.get(field) for field in IMMUTABLE), f"Immutable mismatch: {before['id']}")
    event = {"sequence": index + 1, "project": project, "useCase": use_case,
             "operations": list(replacement), "statuses": dict(Counter(row["quality_status"] for row in replacement.values())),
             "annotation_path": ann_path.relative_to(ROOT).as_posix(), "annotation_sha256": sha(ann_path),
             "fidelity_audit": "completed static per-clause/per-scenario review before next use case",
             "cross_operation_check": "Shared metadata retained; each operation checked against its own encoded contract and test. No inferred cross-operation preconditions.",
             "remaining_unresolved": sum(bool(row["missing_evidence"] or row["source_conflicts"]) for row in replacement.values())}
    resolution_file = resolutions.resolution_path(project, use_case)
    event["resolution_sha256"] = sha(resolution_file) if resolution_file.exists() else None
    TARGET.write_text("".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n" for row in output), encoding="utf-8")
    if refresh:
        event["superseded_annotation_hashes"] = progress[index].get("superseded_annotation_hashes", []) + [progress[index]["annotation_sha256"]]
        progress[index] = event
        LOG.write_text("".join(json.dumps(item, ensure_ascii=False) + "\n" for item in progress), encoding="utf-8")
    else:
        with LOG.open("a", encoding="utf-8") as stream:
            stream.write(json.dumps(event, ensure_ascii=False) + "\n")
    print(json.dumps(event, ensure_ascii=True))


def verify():
    original, rows, progress = read_rows(ORIGINAL), read_rows(TARGET), read_rows(LOG)
    physical = TARGET.read_text(encoding="utf-8").splitlines()
    require(len(physical) == 114 and all(line.strip() for line in physical), "JSONL must have exactly 114 nonblank physical lines")
    require(all(isinstance(json.loads(line), dict) for line in physical), "Each JSONL line must be an object")
    require(len(rows) == len(original) == 114, "Count mismatch")
    require(len({row['id'] for row in rows}) == 114, "Duplicate IDs")
    require(len(progress) == len(groups(original)), "Some use cases are not audited")
    require([(p["project"], p["useCase"]) for p in progress] == groups(original), "Use-case audit order mismatch")
    annotations = {}
    for sequence, event in enumerate(progress, 1):
        require(sequence == event["sequence"], "Use-case sequence mismatch")
        path = ROOT / event["annotation_path"]
        require(sha(path) == event["annotation_sha256"], "Annotation changed after use-case audit")
        resolution_file = resolutions.resolution_path(event["project"], event["useCase"])
        require(event.get("resolution_sha256") == (sha(resolution_file) if resolution_file.exists() else None),
                "Resolution changed after use-case audit")
        group_rows = [row for row in rows if (row["project"], row["useCase"]) == (event["project"], event["useCase"])]
        require([row["id"] for row in group_rows] == event["operations"], "Use-case operation audit mismatch")
        require(dict(Counter(row["quality_status"] for row in group_rows)) == event["statuses"], "Use-case status audit mismatch")
        annotations[(event["project"], event["useCase"])] = {a["name"]: a for a in json.loads(path.read_text(encoding="utf-8"))}
    for before, row in zip(original, rows):
        require(all(before.get(key) == row.get(key) for key in IMMUTABLE), f"Immutable drift: {row['id']}")
        text = "\n".join([row["operation_intent"], *row["preconditions_nl"], *row["postconditions_nl"]])
        require(not LEAK.search(text) and not GENERIC.search(text), f"NL check failed: {row['id']}")
        source = next(s for s in sources(row["project"], row["useCase"])["operations"] if s["name"] == row["operation_name"])
        annotation = resolve_annotation(annotations[(row["project"], row["useCase"])][row["operation_name"]], source)
        expected = build_row(before, annotation, source)
        require(expected == row, f"Evidence/annotation/reference/scenario replay differs: {row['id']}")
        require(not row["generation_ready"], "Unapproved dataset cannot be generation-ready")
    summary = {"operations": len(rows), "use_cases_audited": len(progress),
               "quality_status": dict(Counter(row['quality_status'] for row in rows)),
               "difficulty": dict(Counter(str(row['difficulty']) for row in rows)),
               "immutable_fields": "PASS", "structured_NL_leak_and_template_scan": "PASS",
               "source_hashes_verbatim_references_clause_anchors_and_scenario_mappings": "PASS",
               "local_parameters_and_return_types": "114/114 MATCH",
               "structured_input_ready": sum(row["structured_input_ready"] for row in rows),
               "generation_ready": sum(row["generation_ready"] for row in rows),
               "original_sha256": sha(ORIGINAL), "output_sha256": sha(TARGET),
               "runtime_tests_executed": False, "independent_human_review": False,
               "publication_ready": False}
    print(json.dumps(summary))
    return summary


def write_report(summary):
    rows, original, progress = read_rows(TARGET), read_rows(ORIGINAL), read_rows(LOG)
    count = Counter(row["quality_status"] for row in rows)
    difficulties = Counter(row["difficulty"] for row in rows)
    features = Counter(feature for row in rows for feature in row["semantic_features"])
    verified_features = Counter(feature for row in rows if row["quality_status"] == "VERIFIED" for feature in row["semantic_features"])
    accepted = sum(bool(row["reference_contract"]) for row in rows)
    upstream_rows = [row for row in rows if row["source_provenance"].get("requirement_source")]
    upstream_files = {row["source_provenance"]["requirement_source"]["path"] for row in upstream_rows}
    v2_oracle_rows = [row for row in rows if row.get("resolution_audit", {}).get("oracle_edits")]
    v2_oracle_files = {row["source_provenance"]["test_source"] for row in v2_oracle_rows}
    mapped = sum(bool(row["oracle_refs"]["jest_scenarios"]) for row in rows)
    unique_tests = {row["source_provenance"]["test_source"] for row in rows if row["source_provenance"]["test_source"]}
    unique_scenarios = {(s["path"], s["start_line"]): s for row in rows for s in row["fidelity_audit"]["scenario_checks"]}
    clauses = sum(len(row["clause_evidence"]) for row in rows)
    lines = ["# ContractGen 114-Operation V2 Revision Audit", "",
             "## Scope and Release Gate", "",
             "This is an evidence-constrained annotation revision, not a new experiment and not a claim that the benchmark is publication-ready.",
             "All 114 original operations were processed in original Project / Use Case / Operation order, with one completed use-case audit before the next (47 use cases, 5 projects, one RM2PT source family). No external USE dataset is mixed in.",
             "",
             "**VERIFIED is STATIC verification only:** the recovered NL is consistent with the available encoded Operation reference and reviewed scenario declarations. For the explicitly source-pinned subset, the corresponding original RM2PT formal operation specification was also inspected. VERIFIED does not mean independent human confirmation, exhaustive behavioral coverage, standard-OCL conformance or successful generation/runtime execution.",
             f"Original RM2PT formal specifications were pinned to commit 3c08c41dc8671f857169e82cce662a075a306aa3 and reviewed for {len(upstream_rows)} operations across {len(upstream_files)} project model files. The remaining operations retain local encoded-reference scope only. RM2DOC prose embedded beside the formal contracts is generated documentation, not independent natural-language evidence. Author-maintained Jest corroborates the contracts but is not independent ground truth.",
             "NEEDS_REVIEW means additional oracle/representation/fixture review is needed. NEEDS_SOURCE means a concrete semantic conflict, missing effect, stub or unresolved source interpretation prevents a complete reliable requirement; such references remain empty, with candidate pointers retained.",
             "",
             "## Summary", "", "| Measure | Count |", "|---|---:|", "| Total operations | 114 |"]
    lines += [f"| {key} | {count[key]} |" for key in ("VERIFIED", "NEEDS_REVIEW", "NEEDS_SOURCE")]
    lines += [f"| {key} | {difficulties[key]} |" for key in ("Easy", "Medium", "Hard")]
    lines += [f"| Difficulty unresolved (null, not silently Easy) | {difficulties[None]} |",
              f"| Accepted local reference mappings | {accepted} |", f"| Unaccepted reference candidates | {len(rows)-accepted} |",
              f"| Operations mapped to Jest sources | {mapped} |", f"| Distinct Jest files | {len(unique_tests)} |",
              f"| Distinct scenario declarations | {len(unique_scenarios)} |",
              f"| Statically expanded cases in distinct declarations | {sum(s['static_case_count'] or 0 for s in unique_scenarios.values())} |",
              f"| Declarations with unknown expansion count | {sum(s['static_case_count'] is None for s in unique_scenarios.values())} |",
              f"| Evidence-anchored intent/pre/post clauses | {clauses} |",
              f"| Operations with pinned original RM2PT formal specification review | {len(upstream_rows)} |",
              f"| Distinct pinned RM2PT model files used | {len(upstream_files)} |",
              f"| Operations using source-aligned V2 oracle copies | {len(v2_oracle_rows)} |",
              f"| Distinct source-aligned V2 oracle files | {len(v2_oracle_files)} |",
              "| New model/runtime experiments executed | 0 |", "",
              "Parameterized test declarations are counted separately from their static case expansion. Shared ATM operations map to the same test files and are not counted as independent tests. A mapped declaration does not imply every clause is asserted.", "",
              "### By Project", "", "| Project | Operations | VERIFIED | NEEDS_REVIEW | NEEDS_SOURCE |", "|---|---:|---:|---:|---:|"]
    for project in dict.fromkeys(row["project"] for row in rows):
        subset = [row for row in rows if row["project"] == project]
        statuses = Counter(row["quality_status"] for row in subset)
        lines.append(f"| {project} | {len(subset)} | {statuses['VERIFIED']} | {statuses['NEEDS_REVIEW']} | {statuses['NEEDS_SOURCE']} |")
    lines += ["", "### Preserved Signature Distributions", "", "| Parameter count | Operations |", "|---:|---:|"]
    lines += [f"| {number} | {n} |" for number, n in sorted(Counter(len(row["parameters"]) for row in rows).items())]
    lines += ["", "| Return type (unchanged) | Operations |", "|---|---:|"]
    lines += [f"| {kind} | {n} |" for kind, n in sorted(Counter(row["return_type"] for row in rows).items())]
    lines += ["", "## Semantic Features and Difficulty", "",
              "Feature counts are multi-label. The all-record column includes known features of partially unresolved source candidates, not completed requirements. The VERIFIED column is local-static only. No feature is added merely to increase difficulty.",
              "", "| Feature | All 114 | Local VERIFIED subset |", "|---|---:|---:|"]
    lines += [f"| {feature} | {features[feature]} | {verified_features[feature]} |" for feature in sorted(FEATURES)]
    lines += ["", f"Difficulty was reassessed from actual obligations rather than copied from the guide's provisional labels. Simple lookups/field effects are Easy; ordinary creation/deletion or several independent updates are Medium; branches, coupled associations/multiple objects and richer session workflows are Hard. Every record carries its specific rationale. The {difficulties[None]} unresolved records retain null rather than an invented final label.",
              "No association-removal or recursive-call requirement was invented to fill an empty category. Closing a reservation is not deleting it; removing a repository member is not an unproven cascade.", "",
              "## Source Fidelity and Input Boundary", "",
              "- All protected fields, including original IDs, order, signatures, parameters, return types, model_context and description_original, compare equal to the byte-preserved starting scaffold.",
              "- Parameters and return types also match all 114 local Operation declarations. This is a local cross-check, not permission to rewrite upstream metadata.",
              "- Accepted reference sections are exact decoded strings from existing TypeScript literals. They were neither generated nor repaired. Source paths, line ranges and SHA-256 hashes are recorded.",
              "- Every new intent/pre/post clause has an exact source anchor; definitions are separately pinned as binding context. Whole-field source locations preserve the enclosing branches, not just isolated matched substrings.",
              "- Structured requirement fields contain no detected generic templates or OCL surface syntax. This check does not prove absence of all forms of semantic leakage.",
              "- This file is an annotation/master artifact, not a directly safe prompt payload. Exclude reference_contract, clause_evidence, binding_context_evidence, semantic_feature_evidence, provenance, audit notes and description_original from generation input.",
              "- No experimental model API calls or new reference contracts were generated. Source-aligned V2 oracle copies were created only where historical assertions exceeded the cited contract (for example array identity/order); every patch and reason is recorded. Historical Jest files, OCLTSVM, source Operation modules, results and data/operations.jsonl were not changed.", "",
              "### Legacy Description", ""]
    legacy_count = sum(bool(GENERIC.search(row.get("description", ""))) for row in rows)
    original_count = sum(bool(GENERIC.search(row.get("description_original", ""))) for row in rows)
    structured_count = sum(bool(GENERIC.search(" ".join([row["operation_intent"], *row["preconditions_nl"], *row["postconditions_nl"]]))) for row in rows)
    lines += [f"Generic template records: structured V2 NL **{structured_count}**, preserved description_original **{original_count}**, retained legacy description **{legacy_count}**.",
              "The original description and description_original remain unchanged for traceability. Only locally VERIFIED records are eligible for the separately generated description view; unresolved records are excluded. All generation_ready flags remain false because current-runner compatibility is a separate gate. See data/operation_revision/experiment_readiness.md. Do not rerun the old description-only pipeline and call that a V2 experiment.", "",
              "## Substantive Reconstruction", "",
              "The 108 RECONSTRUCT FROM SOURCE records now have source-linked structured text, although some remain partial. The six KEEP + NORMALIZE records preserve existing meaning; numeric thresholds, dates and missing effects were added only where local evidence supports them. Conflicting parts were withheld and documented, not silently replaced.", "",
              "| Original category | Count |", "|---|---:|"]
    lines += [f"| {status} | {n} |" for status, n in Counter(row["revision_status"] for row in original).items()]
    lines += ["", "The complete per-operation inventory below identifies exactly which records were reconstructed versus normalized.", "",
              "## NEEDS_SOURCE: Specific Missing Evidence", ""]
    for row in rows:
        if row["quality_status"] == "NEEDS_SOURCE":
            lines += [f"### {row['id']}", *[f"- {item}" for item in row["missing_evidence"]], *[f"- Conflict: {item}" for item in row["source_conflicts"]], ""]
    lines += ["## NEEDS_REVIEW: Oracle and Representation Issues", ""]
    for row in rows:
        if row["quality_status"] == "NEEDS_REVIEW":
            lines += [f"### {row['id']}", *[f"- {item}" for item in row["source_conflicts"]], ""]
    lines += ["## Source Reinspection Findings", "",
              "These findings clarify local implementation or test interpretation; they do not silently add business requirements or certify upstream fidelity.", ""]
    for row in rows:
        for finding in row["review_findings"]:
            locations = ", ".join(f"{item['path']}:{item['start_line']}" for item in finding["evidence"])
            lines.append(f"- **{row['id']}**: {finding['assessment']} Evidence: {locations}.")
    lines.append("")
    unmapped_reference = [row["id"] for row in rows if not row["source_provenance"]["reference_ocl_candidate_source"]]
    unmapped_tests = [row["id"] for row in rows if not row["oracle_refs"]["jest_scenarios"]]
    lines += ["## Reference and Jest Mapping Gaps", "",
              f"No local reference candidate mapping: {len(unmapped_reference)}. No Jest scenario mapping: {len(unmapped_tests)}.",
              f"A pointer is not acceptance: {len(rows)-accepted} candidates are deliberately not installed in reference_contract; their IDs and reasons are listed under NEEDS_SOURCE. Pinned upstream formal provenance is present for {len(upstream_rows)} operations only; no broader native-fidelity claim is made.",
              "No USE file or generated model output was substituted as reference evidence. The duplicate named ATM operations remain distinct original IDs, but share corroborating test files.", "",
              "## Use-Case Fidelity Audit Trail", "",
              "The machine-readable trail is data/operation_revision/use_case_audits.jsonl. Each operation stores original-description, reference, effect-completeness, scenario-obligation and leakage checks. Later annotation corrections are recorded as superseded annotation hashes, not erased. Audits are static; they do not assert scenario execution success.",
              "", "| Sequence | Project / Use case | Operations | Unresolved records |", "|---:|---|---:|---:|"]
    lines += [f"| {event['sequence']} | {event['project']} / {event['useCase']} | {len(event['operations'])} | {event['remaining_unresolved']} |" for event in progress]
    lines += ["", "## Complete Operation Inventory", "", "| JSONL line | Original ID | Revision | Status | Difficulty | Reference |", "|---:|---|---|---|---|---|"]
    for number, (before, row) in enumerate(zip(original, rows), 1):
        lines.append(f"| {number} | {row['id']} | {before['revision_status']} | {row['quality_status']} | {row['difficulty'] or 'UNRESOLVED'} | {'local verbatim' if row['reference_contract'] else 'candidate only'} |")
    lines += ["", "## Verification and Reproduction", "",
              "Read-only verification:", "", "```powershell", "python scripts/revise_operations_v2.py --verify", "```", "",
              "Regenerate this report after successful verification:", "", "```powershell", "python scripts/revise_operations_v2.py --verify --report", "```", "",
              "Regression tests for annotation machinery:", "", "```powershell", "python -m unittest scripts.test_revise_operations_v2 -v", "```", "",
              "Verification replays every reviewed annotation against current source literals and checks exact equality of the produced records, including source/test hashes, reference copies, scenario mappings, IDs, immutable fields and audit order. It is not a second semantic judge. After any source change, annotations must be reviewed again rather than simply rerunning experiments.", "",
              f"- Starting scaffold SHA-256: `{summary['original_sha256']}`",
              f"- Revised JSONL SHA-256: `{summary['output_sha256']}`",
              "- Starting snapshot: data/operation_revision/operations_v2_scaffold.original.jsonl",
              "- Reviewed annotations: data/operation_revision/annotations/",
              "- Machine verification summary: data/operation_revision/verification_summary.json", "",
              "## Before Publication", "",
              "Resolve the listed NEEDS_SOURCE items with author clarification, a domain invariant or a corrected authoritative specification; obtain independent human fidelity sign-off for the intended release subset; freeze the source-aligned V2 oracle version and a generation-only input view without reference/evidence fields; then rerun and separately label V2 experiments. Existing results must not be presented as results on these revised requirements.", ""]
    (ROOT / "data/revision_audit.md").write_text("\n".join(lines), encoding="utf-8")
    (WORK / "verification_summary.json").write_text(json.dumps(summary, indent=2) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project")
    parser.add_argument("--use-case")
    parser.add_argument("--verify", action="store_true")
    parser.add_argument("--refresh-group", action="store_true")
    parser.add_argument("--report", action="store_true")
    args = parser.parse_args()
    require(not args.report or args.verify, "--report requires --verify")
    if args.verify:
        summary = verify()
        if args.report:
            write_report(summary)
    else:
        require(bool(args.project and args.use_case), "Select one project/use case")
        apply_group(args.project, args.use_case, args.refresh_group)


if __name__ == "__main__":
    main()
