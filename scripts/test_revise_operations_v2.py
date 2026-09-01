"""Regression checks for evidence-constrained V2 annotation tooling."""

import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

from scripts import revise_operations_v2 as revision
from scripts import operation_resolution_support as resolutions


class AnnotationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.original = revision.read_rows(revision.ORIGINAL)[0]
        cls.source = revision.sources("Airport", "manageDevice")["operations"][0]
        path = revision.WORK / "annotations/Airport/manageDevice.json"
        cls.annotation = json.loads(path.read_text(encoding="utf-8"))[0]

    def build(self, annotation=None, source=None):
        return revision.build_row(self.original, annotation or self.annotation, source or self.source)

    def test_preserves_all_protected_fields(self):
        row = self.build()
        for key in revision.IMMUTABLE:
            self.assertEqual(self.original[key], row[key], key)

    def test_reference_is_verbatim(self):
        row = self.build()
        for target, source in (("definitions", "definition"), ("preconditions", "precondition"), ("postconditions", "postcondition")):
            self.assertEqual(row["reference_contract"][target], [self.source["fields"][source]["value"]])

    def test_unresolved_candidate_is_not_generated_gold(self):
        annotation = copy.deepcopy(self.annotation)
        annotation.update(status="NEEDS_SOURCE", reference_accepted=False, missing=["Native specification needed."], difficulty=None)
        self.assertEqual(self.build(annotation)["reference_contract"], "")

    def test_missing_evidence_cannot_be_verified(self):
        annotation = copy.deepcopy(self.annotation)
        annotation["missing"] = ["Unresolved effect"]
        with self.assertRaisesRegex(ValueError, "cannot be VERIFIED"):
            self.build(annotation)

    def test_structured_readiness_is_not_runtime_readiness(self):
        row = self.build()
        self.assertTrue(row["structured_input_ready"])
        self.assertFalse(row["generation_ready"])

    def test_review_finding_requires_real_quote(self):
        annotation = copy.deepcopy(self.annotation)
        annotation["review_findings"] = [{"assessment": "Test finding", "evidence": [
            {"path": "src/app/ContractToTypescript.ts", "quote": "fabricated obligation is not evidence"}]}]
        with self.assertRaisesRegex(ValueError, "Review evidence quote not found"):
            self.build(annotation)

    def test_review_findings_are_anchored_and_pinned(self):
        annotation = copy.deepcopy(self.annotation)
        annotation["review_findings"] = [{"assessment": "Local null representation only", "evidence": [
            {"path": "src/app/ContractToTypescript.ts", "quote": "return t.identifier('undefined');"}]}]
        evidence = self.build(annotation)["review_findings"][0]["evidence"][0]
        self.assertGreater(evidence["start_line"], 0)
        self.assertEqual(evidence["source_sha256"], revision.sha(revision.ROOT / evidence["path"]))

    def test_needs_source_requires_reason(self):
        annotation = copy.deepcopy(self.annotation)
        annotation["status"] = "NEEDS_SOURCE"
        with self.assertRaisesRegex(ValueError, "explanation"):
            self.build(annotation)

    def test_rejects_fabricated_anchor(self):
        annotation = copy.deepcopy(self.annotation)
        annotation["post"][0][1] = "this evidence never existed"
        with self.assertRaisesRegex(ValueError, "quote not found"):
            self.build(annotation)

    def test_rejects_api_leak_and_generic_clause(self):
        for text in ("Use allInstances() to find devices.", "Required inputs are present.", "Keep the value at @pre."):
            annotation = copy.deepcopy(self.annotation)
            annotation["post"][0][0] = text
            with self.subTest(text=text), self.assertRaises(ValueError):
                self.build(annotation)

    def test_requires_all_scenarios(self):
        annotation = copy.deepcopy(self.annotation)
        annotation["scenarios"].pop()
        with self.assertRaisesRegex(ValueError, "Audit every scenario"):
            self.build(annotation)

    def test_rejects_unknown_scenario_obligation(self):
        annotation = copy.deepcopy(self.annotation)
        annotation["scenarios"][0][1] = ["postconditions_nl[999]"]
        with self.assertRaisesRegex(ValueError, "Unknown obligation"):
            self.build(annotation)

    def test_local_declaration_mismatch_does_not_repair_metadata(self):
        source = copy.deepcopy(self.source)
        source["parameters"][0]["type"] = "String"
        with self.assertRaisesRegex(ValueError, "Local declaration mismatch"):
            self.build(source=source)

    def test_literal_expansion_rejects_extra_constraint(self):
        source = copy.deepcopy(revision.sources("CoCoME", "changePrice")["operations"][0])
        annotation = json.loads((revision.WORK / "annotations/CoCoME/changePrice.json").read_text(encoding="utf-8"))[0]
        source["fields"]["precondition"]["value"] += " and newPrice > 0"
        with self.assertRaisesRegex(ValueError, "Complete literal contract mismatch"):
            revision.resolve_annotation(annotation, source)

    def test_reuse_rejects_changed_branch(self):
        source = copy.deepcopy(revision.sources("AutomatedTellerMachine", "depositFunds")["operations"][0])
        source["fields"]["postcondition"]["value"] += " and result = false"
        with self.assertRaisesRegex(ValueError, "Reuse requires identical"):
            revision.resolve_annotation({"name": "inputCard", "reuse": ["AutomatedTellerMachine", "checkBalance"]}, source)

    def test_parameterized_jest_declarations_not_dropped(self):
        source = revision.sources("LibraryManagementSystem", "borrowBook")["operations"][0]
        self.assertEqual(len(source["scenarios"]), 8)
        self.assertEqual([s["case_count"] for s in source["scenarios"]], [1, 1, 1, 1, 1, 1, 3, 3])

    def test_test_paths_preserve_case_on_case_insensitive_hosts(self):
        actual = {path.name for path in (revision.ROOT / "test").iterdir() if path.is_dir()}
        for use_case in ("listBookHistory", "searchBook"):
            for source in revision.sources("LibraryManagementSystem", use_case)["operations"]:
                self.assertIsNotNone(source["test_path"])
                self.assertIn(Path(source["test_path"]).parent.name, actual)


class SerializationAndAuditTests(unittest.TestCase):
    def test_rejects_nonstandard_json_and_duplicate_keys(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary) / "invalid.jsonl"
            for text in ('{"value":NaN}\n', '{"id":1,"id":2}\n'):
                path.write_text(text, encoding="utf-8")
                with self.assertRaises(ValueError):
                    revision.read_rows(path)

    def test_prohibits_skipping_use_case(self):
        with tempfile.TemporaryDirectory() as temporary:
            log = Path(temporary) / "empty-log.jsonl"
            log.write_text("", encoding="utf-8")
            with patch.object(revision, "LOG", log), self.assertRaisesRegex(ValueError, "sequentially"):
                revision.apply_group("CoCoME", "changePrice")

    def test_partial_annotation_group_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            work = Path(temporary)
            folder = work / "annotations/Airport"
            folder.mkdir(parents=True)
            (folder / "manageDevice.json").write_text("[]", encoding="utf-8")
            log = work / "empty-log.jsonl"
            log.write_text("", encoding="utf-8")
            with patch.object(revision, "WORK", work), patch.object(revision, "LOG", log), self.assertRaisesRegex(ValueError, "whole use case"):
                revision.apply_group("Airport", "manageDevice")

    def test_tampering_with_original_id_is_rejected(self):
        rows = revision.read_rows(revision.TARGET)
        rows[0]["id"] = "invented_operation"
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary) / "tampered.jsonl"
            target.write_text("".join(json.dumps(row) + "\n" for row in rows), encoding="utf-8")
            with patch.object(revision, "TARGET", target), self.assertRaises(ValueError):
                revision.verify()

    def test_blank_extra_line_is_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            target = Path(temporary) / "blank-line.jsonl"
            target.write_bytes(revision.TARGET.read_bytes() + b"\n")
            with patch.object(revision, "TARGET", target), self.assertRaisesRegex(ValueError, "114 nonblank"):
                revision.verify()

    def test_complete_artifact_replay(self):
        with contextlib.redirect_stdout(io.StringIO()):
            summary = revision.verify()
        self.assertEqual(summary["operations"], 114)
        self.assertEqual(summary["use_cases_audited"], 47)
        self.assertFalse(summary["runtime_tests_executed"])


class ResolutionAndOracleTests(unittest.TestCase):
    def test_upstream_reference_is_commit_and_hash_pinned(self):
        source = next(item for item in revision.sources("LibraryManagementSystem", "recommendBook")["operations"]
                      if item["name"] == "recommendBook")
        resolution = resolutions.load_resolution(source)
        upstream = resolutions.upstream_reference(source, resolution)
        self.assertEqual(upstream["commit"], "3c08c41dc8671f857169e82cce662a075a306aa3")
        self.assertEqual(upstream["sha256"], resolutions.checksum(revision.ROOT / upstream["path"]))

    def test_resolution_alias_reuses_reviewed_eject_card_decision(self):
        source = next(item for item in revision.sources("AutomatedTellerMachine", "depositFunds")["operations"]
                      if item["name"] == "ejectCard")
        resolution = resolutions.load_resolution(source)
        self.assertIn("seven session resets", resolution["assessment"])
        self.assertEqual(resolution["updates"]["status"], "VERIFIED")

    def test_v2_oracle_exactly_replays_patch_without_changing_history(self):
        source = next(item for item in revision.sources("LibraryManagementSystem", "listBookHistory")["operations"]
                      if item["name"] == "listBorrowHistory")
        resolution = resolutions.load_resolution(source)
        historical_hash = resolutions.checksum(revision.ROOT / source["test_path"])
        path = resolutions.check_oracle(source, resolution)
        self.assertEqual(path.read_text(encoding="utf-8"), resolutions.oracle_content(source, resolution))
        self.assertEqual(historical_hash, resolutions.checksum(revision.ROOT / source["test_path"]))
        self.assertIn("expectSameMembers", path.read_text(encoding="utf-8"))


if __name__ == "__main__":
    unittest.main()
