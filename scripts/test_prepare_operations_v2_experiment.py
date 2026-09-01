"""Test the candidate boundary without API calls or changing any experiment."""

import copy
import unittest

from scripts import prepare_operations_v2_experiment as prepare
from scripts import revise_operations_v2 as revision


class CandidateTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows = revision.read_rows(revision.TARGET)
        cls.candidates = prepare.input_view(cls.rows)

    def test_only_verified_original_order_and_metadata(self):
        expected = [row for row in self.rows if row["quality_status"] == "VERIFIED"]
        self.assertEqual([r["id"] for r in self.candidates], [r["id"] for r in expected])
        for before, after in zip(expected, self.candidates):
            for key in prepare.ALLOWED:
                self.assertEqual(before[key], after[key])

    def test_no_gold_audit_or_original_description_fields(self):
        for row in self.candidates:
            self.assertEqual(set(row), set(prepare.ALLOWED) | {"description"})
            self.assertNotIn("reference_contract", row)
            self.assertNotIn("description_original", row)
            self.assertNotIn("clause_evidence", row)

    def test_rejects_false_verified_flag(self):
        row = copy.deepcopy(next(row for row in self.rows if row["quality_status"] == "NEEDS_SOURCE"))
        row.update(quality_status="VERIFIED", structured_input_ready=True)
        with self.assertRaises(ValueError):
            prepare.input_view([row])

    def test_no_placeholder_or_ocl_in_derived_description(self):
        for row in self.candidates:
            self.assertIsNone(revision.LEAK.search(row["description"]))
            self.assertIsNone(revision.GENERIC.search(row["description"]))
            for clause in [row["operation_intent"], *row["preconditions_nl"], *row["postconditions_nl"]]:
                self.assertIn(clause, row["description"])

    def test_unconditional_guard_is_not_invented(self):
        row = next(row for row in self.rows if not row["preconditions_nl"])
        self.assertIn("No additional domain precondition is specified.", prepare.describe(row))

    def test_existing_runner_fails_closed_without_manifest(self):
        report = prepare.inspect_runner(self.candidates)
        self.assertFalse(report["ready"])
        self.assertEqual(len(report["manifest_validation_errors"]), len(self.candidates))

    def test_runtime_comparison_keeps_frozen_context_hash(self):
        runtime = prepare.inspect_runtime()
        import hashlib
        self.assertEqual([row["id"] for row in runtime], [row["id"] for row in self.rows])
        for row, check in zip(self.rows, runtime):
            expected = hashlib.sha256(row["model_context"].encode("utf-8")).hexdigest()
            self.assertEqual(check["preserved_context_sha256"], expected)


if __name__ == "__main__":
    unittest.main()
