import importlib.util
import unittest
from pathlib import Path


SCRIPT = Path(__file__).with_name("run_use_ocltsvm_semantic_agreement.py")
SPEC = importlib.util.spec_from_file_location("semantic_agreement", SCRIPT)
assert SPEC and SPEC.loader
agreement = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(agreement)


class SemanticAgreementExperimentTest(unittest.TestCase):
    def test_scenario_template_contains_all_three_semantic_cases(self) -> None:
        templates = agreement.build_scenario_templates({"operation_id": "Example_operation"})

        self.assertEqual(3, len(templates))
        self.assertEqual(
            {"pre-positive", "pre-negative", "post-positive"},
            {row["scenario_id"].rsplit("::", 1)[-1] for row in templates},
        )
        self.assertTrue(all(row["status"] == "pending" for row in templates))

    def test_construct_detection_distinguishes_context_from_enumeration(self) -> None:
        contract = """Contract Service::approve(): Boolean {
        precondition:
          self.status = Status::READY
        postcondition:
          self.items->includes(item) and self.count = self.count@pre + 1
        }"""
        constructs = agreement.detect_constructs(contract)

        self.assertIn("enumeration", constructs)
        self.assertIn("navigation_update", constructs)
        self.assertIn("temporal_at_pre", constructs)
        self.assertNotIn("new_object", constructs)

        without_enum = agreement.detect_constructs(
            "Contract Service::query(): Boolean { precondition: true postcondition: result = true }"
        )
        self.assertNotIn("enumeration", without_enum)

    def test_stratified_sample_is_balanced_and_deterministic(self) -> None:
        candidates = []
        for tier_index, tier in enumerate(("simple", "medium", "complex")):
            for index in range(12):
                candidates.append(
                    {
                        "operation_id": f"{tier}-{index:02d}",
                        "case_study": f"case-{index % 4}",
                        "complexity_tier": tier,
                        "complexity_score": tier_index * 100 + index,
                        "constructs": [f"feature-{index % 5}"],
                    }
                )

        first = agreement.stratified_sample(candidates, 30, 17)
        second = agreement.stratified_sample(candidates, 30, 17)

        self.assertEqual(
            [row["operation_id"] for row in first],
            [row["operation_id"] for row in second],
        )
        self.assertEqual(
            {tier: 10 for tier in ("simple", "medium", "complex")},
            {
                tier: sum(row["complexity_tier"] == tier for row in first)
                for tier in ("simple", "medium", "complex")
            },
        )

    def test_summary_excludes_missing_decisions_from_denominators(self) -> None:
        rows = [
            {
                "clause": "precondition",
                "expected_decision": True,
                "use_decision": True,
                "ocltsvm_decision": True,
                "jest_decision": True,
                "use_status": "ok",
                "ocltsvm_status": "ok",
                "jest_status": "ok",
            },
            {
                "clause": "precondition",
                "expected_decision": False,
                "use_decision": False,
                "ocltsvm_decision": True,
                "jest_decision": None,
                "use_status": "ok",
                "ocltsvm_status": "ok",
                "jest_status": "unsupported",
            },
        ]

        summary = agreement.summarize(rows)
        metrics = {row["label"]: row for row in summary["metrics"]}

        self.assertEqual(2, metrics["use_ocltsvm_agreement"]["total"])
        self.assertEqual(1, metrics["use_ocltsvm_agreement"]["successes"])
        self.assertEqual(1, metrics["use_jest_agreement"]["total"])
        self.assertEqual(1, metrics["three_way_agreement"]["total"])

    def test_wilson_interval_is_bounded(self) -> None:
        low, high = agreement.wilson_interval(9, 10)
        self.assertGreaterEqual(low, 0.0)
        self.assertLessEqual(high, 1.0)
        self.assertLess(low, 0.9)
        self.assertGreater(high, 0.9)

    def test_runtime_reference_is_exported_as_navigation(self) -> None:
        snapshot = {
            "rootId": "service",
            "objects": [
                {
                    "id": "service",
                    "className": "Service",
                    "properties": {"InputCard": {"kind": "ref", "id": "card"}},
                },
                {"id": "card", "className": "BankCard", "properties": {}},
            ],
        }

        self.assertEqual(
            {"InputCard": "BankCard"},
            agreement.runtime_navigation_types(snapshot, {"BankCard": object()}),
        )

    def test_context_navigation_attribute_is_removed(self) -> None:
        model = """class OperationContext
attributes
  InputCard : Boolean
  Validated : Boolean
operations
  check() : Boolean
end
"""

        stripped = agreement.strip_context_navigation_attributes(model, {"InputCard"})

        self.assertNotIn("InputCard : Boolean", stripped)
        self.assertIn("Validated : Boolean", stripped)

    def test_millisecond_dates_fit_use_integer_range(self) -> None:
        literal = agreement.use_literal(
            {"kind": "date", "epochMillis": 1_786_421_775_587},
            "Integer",
            {},
        )

        self.assertEqual("1786421775", literal)


if __name__ == "__main__":
    unittest.main()
