#!/usr/bin/env python3

import json
import sys
import unittest
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
REPO_ROOT = SCRIPT_DIR.parent
sys.path.insert(0, str(SCRIPT_DIR))

import generate_use_strong_114 as use_export


class UseExternalValidationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.operations = [
            json.loads(line)
            for line in (REPO_ROOT / "data" / "operations.jsonl").read_text(
                encoding="utf-8"
            ).splitlines()
            if line.strip()
        ]
        cls.operation_map = {row["id"]: row for row in cls.operations}
        cls.attempts = use_export.choose_attempts(
            REPO_ROOT
            / "results"
            / "contractgen-study-v6"
            / "contract_gen"
            / "full_feedback"
            / "gpt-5.5"
            / "attempts.jsonl",
            "gpt-5.5",
            cls.operation_map,
        )

    def test_current_study_provenance_is_frozen(self) -> None:
        self.assertEqual("contractgen-study-v6", use_export.STUDY_VERSION)
        self.assertEqual("contractgen-operation-input-v3", use_export.INPUT_SCHEMA_VERSION)
        self.assertEqual(114, len(self.operations))
        self.assertEqual(114, len(self.attempts))

    def test_model_parser_preserves_inheritance_without_context_leakage(self) -> None:
        operation = self.operation_map["LibraryManagementSystem_borrowBook_borrowBook"]
        entities, _ = use_export.parse_model_context(operation["model_context"])

        self.assertEqual("User", entities["Student"].parent)
        self.assertEqual("User", entities["Faculty"].parent)
        self.assertNotIn(operation["service"], entities)
        self.assertNotIn(operation["useCase"], entities)

    def test_borrow_book_exports_complete_use_operation_contract(self) -> None:
        operation = self.operation_map["LibraryManagementSystem_borrowBook_borrowBook"]
        combined, pre_model, post_model, _, metadata = use_export.make_model(
            operation, self.attempts[operation["id"]], 1
        )

        self.assertIn("class Student < User", combined)
        self.assertIn("Contract_borrowBook(uid : String, barcode : String) : Boolean", combined)
        self.assertIn("pre borrowBookGeneratedPre", pre_model)
        self.assertIn("post borrowBookGeneratedPost", post_model)
        self.assertIn("Loan.allInstances()->exists(loan: Loan |", post_model)
        self.assertIn("date_values_as_integer_offsets", metadata["translation_adaptations"])
        self.assertIn("new_object_let_to_exists", metadata["postcondition_adaptations"])

    def test_base_model_removes_all_contract_constraints(self) -> None:
        operation = self.operations[0]
        combined, _, _, _, _ = use_export.make_model(
            operation, self.attempts[operation["id"]], 1
        )
        base = use_export.model_without_constraints(combined)

        self.assertNotIn("\nconstraints\n", base)
        self.assertIn("class OperationContext", base)


if __name__ == "__main__":
    unittest.main()
