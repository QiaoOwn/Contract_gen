"""Offline regression tests for metric reconstruction and stopping boundaries."""

import copy
import unittest

from scripts import verify_artifact_tables as audit


def fixture():
    canonical = {
        "id": "op", "input_schema_version": "contractgen-operation-input-v3",
        "input_hash": "input", "requirement_hash": "requirement", "context_hash": "context",
        "prompt_hash": "prompt", "generation_config_hash": "config",
        "generation_grammar_hash": "grammar", "generation_rules_hash": "rules",
    }
    row = {
        **canonical, "operation_id": "op", "model": "model",
        "study_version": audit.STUDY_VERSION,
        "generation_prompt_version": "contractgen-system-prompt-v7", "generation_prompt_hash": "prompt",
        "sampling_protocol": "fixed_independent_samples", "attempt": 1,
        "syntax_valid": True, "pre_execution_valid": True, "execution_valid": True,
        "validation_stage": "passed",
    }
    return {"op": canonical}, [dict(row, attempt=i) for i in range(1, 6)]


class ReconstructionTests(unittest.TestCase):
    def test_fixed_five_is_not_early_stopped(self):
        manifest, rows = fixture()
        report = audit.summarize(audit.validate_rows(rows, manifest, "model", True))
        self.assertEqual((report["generations"], report["pass_at_5"]), (5, 1))

    def test_rejects_incomplete_fixed_five(self):
        manifest, rows = fixture()
        with self.assertRaisesRegex(ValueError, "incomplete fixed-five"):
            audit.validate_rows(rows[:4], manifest, "model", True)

    def test_rejects_foreign_provenance(self):
        for field in ("study_version", "input_hash", "generation_rules_hash", "prompt_hash"):
            with self.subTest(field=field):
                manifest, rows = fixture()
                rows[0][field] = "foreign"
                with self.assertRaises(ValueError):
                    audit.validate_rows(rows, manifest, "model", True)

    def test_rejects_duplicate_and_missing_operation(self):
        manifest, rows = fixture()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            audit.validate_rows(rows + [rows[0]], manifest, "model", True)
        manifest["other"] = manifest["op"]
        with self.assertRaisesRegex(ValueError, "coverage"):
            audit.validate_rows(rows, manifest, "model", True)

    def test_counts_internal_generations_not_stream_records(self):
        manifest, rows = fixture()
        row = dict(rows[0], budget_unit="llm_generation", llm_generation_count=3,
                   cumulative_llm_generation_count=3)
        report = audit.summarize(audit.validate_rows([row], manifest, "model"))
        self.assertEqual(report["generations"], 3)
        row["cumulative_llm_generation_count"] = 2
        with self.assertRaisesRegex(ValueError, "cumulative"):
            audit.validate_rows([row], manifest, "model")

    def test_rejects_unfinished_trajectory(self):
        manifest, rows = fixture()
        row = dict(rows[0], pre_execution_valid=False, execution_valid=False,
                   llm_generation_count=2)
        with self.assertRaisesRegex(ValueError, "unfinished"):
            audit.validate_rows([row], manifest, "model")

    def test_rejects_success_without_pre_execution_validity(self):
        manifest, rows = fixture()
        rows[0]["pre_execution_valid"] = False
        with self.assertRaisesRegex(ValueError, "without pre-execution"):
            audit.validate_rows(rows, manifest, "model", True)

    def test_parser_failure_may_block_execution_but_is_not_a_pass(self):
        manifest, rows = fixture()
        rows[0].update(syntax_valid=False, pre_execution_valid=False, execution_valid=False,
                       validation_stage="parser", execution_eval_skipped=True)
        report = audit.summarize(audit.validate_rows(rows, manifest, "model", True))
        self.assertEqual(report["execution_skips_after_parser_failure"], 1)
        rows[0]["syntax_valid"] = True
        with self.assertRaisesRegex(ValueError, "skipped"):
            audit.validate_rows(rows, manifest, "model", True)

    def test_replay_does_not_peek_at_jest_success(self):
        _, rows = fixture()
        rows[0]["execution_valid"] = False
        result = audit.early_stop_replay({"op": rows})
        self.assertEqual((result["generations"], result["pass_at_5"]), (1, 0))
        self.assertEqual(audit.summarize({"op": rows})["pass_at_5"], 1)

    def test_replay_orders_attempts_and_keeps_exhausted_prefix(self):
        _, rows = fixture()
        for row in rows:
            row.update(pre_execution_valid=False, execution_valid=False)
        report = audit.early_stop_replay({"op": list(reversed(rows))})
        self.assertEqual(report["generations"], 5)
        self.assertEqual(report["selections"][0]["selected_attempt"], 5)

    def test_replay_rejects_ranked_path_sampling(self):
        _, rows = fixture()
        rows[0]["sampling_protocol"] = "ranked_path_fixed_budget"
        with self.assertRaisesRegex(ValueError, "independent"):
            audit.early_stop_replay({"op": rows})

    def test_agreement_excludes_missing_non_boolean_and_error_decisions(self):
        base = dict(clause="postcondition", use_status="ok", ocltsvm_status="recorded",
                    use_decision=True, ocltsvm_decision=True)
        rows = [base, dict(base, use_decision=False), dict(base, use_decision=None),
                dict(base, use_status="error"), dict(base, use_decision="true")]
        self.assertEqual(audit.agreement(rows, "use", "ocltsvm", "postcondition"),
                         {"planned": 5, "decidable": 2, "agree": 1})

    def test_retained_records_reconstruct_key_counts(self):
        report = audit.build_report()
        self.assertEqual(report["early_stop_replay"]["generations"], 139)
        self.assertEqual(report["early_stop_replay"]["selected_candidate_pass_count"], 103)
        self.assertEqual([row["recovered_count"] for row in report["paired_pilot"]], [2, 1, 5])
        self.assertEqual(report["shared_state_agreement"]["external_postcondition"]["decidable"], 0)

    def test_paired_hash_tampering_is_rejected(self):
        directory = audit.RESULTS / "rq3_paired/gpt-5.5"
        shared = audit.read_jsonl(directory / "shared_initial_candidates.jsonl")
        repairs = copy.deepcopy(audit.read_jsonl(directory / "paired_attempts.jsonl"))
        repairs[0]["initial_ocl"]["postcondition"] += " and false"
        with self.assertRaisesRegex(ValueError, "shared initial candidate"):
            audit.paired_recovery(shared, repairs, audit.load_manifest())


if __name__ == "__main__":
    unittest.main()
