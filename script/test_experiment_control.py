#!/usr/bin/env python3

import csv
import json
import sys
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest import mock


SCRIPT_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(SCRIPT_DIR))

import run_rq1_validity_experiments as rq1
import run_baseline_llm_only as baseline
import run_codex_prompt_style_baseline as codex
import run_pathocl_style_baseline as pathocl
import run_rq3_end_to_end_full_feedback as end_to_end
import preflight_experiments as preflight
import run_paired_feedback_ablation as paired


class ExperimentControlTest(unittest.TestCase):
    @staticmethod
    def manifest_row() -> dict:
        path = SCRIPT_DIR.parent / "data" / "operations.jsonl"
        return json.loads(path.read_text(encoding="utf-8").splitlines()[0])

    def test_generation_budget_exhaustion_uses_llm_calls(self) -> None:
        rows = [
            {
                "operation_id": "operation",
                "model": "model",
                "attempt": 1,
                "budget_unit": "llm_generation",
                "llm_generation_count": 5,
                "cumulative_llm_generation_count": 5,
                "is_valid": False,
                "parser_skipped": False,
            }
        ]

        _, succeeded, exhausted = rq1.reindex_attempts(rows, 5)

        self.assertNotIn(("operation", "model"), succeeded)
        self.assertIn(("operation", "model"), exhausted)

    def test_no_feedback_retries_after_typescript_failure(self) -> None:
        rows = [
            {
                "operation_id": "operation",
                "model": "model",
                "attempt": 1,
                "budget_unit": "llm_generation",
                "llm_generation_count": 1,
                "cumulative_llm_generation_count": 1,
                "generation_backend": "next",
                "syntax_valid": True,
                "typescript_generation_ok": True,
                "typescript_parse_ok": False,
                "execution_valid": False,
                "parser_skipped": False,
            }
        ]

        self.assertTrue(rq1.record_syntax_valid(rows[0]))
        self.assertFalse(rq1.record_pre_execution_valid(rows[0]))
        _, completed, exhausted = rq1.reindex_attempts(rows, 5)
        self.assertNotIn(("operation", "model"), completed)
        self.assertNotIn(("operation", "model"), exhausted)

    def test_no_feedback_exhausts_five_pre_execution_failures(self) -> None:
        rows = [
            {
                "operation_id": "operation",
                "model": "model",
                "attempt": attempt,
                "budget_unit": "llm_generation",
                "llm_generation_count": 1,
                "cumulative_llm_generation_count": attempt,
                "generation_backend": "next",
                "syntax_valid": True,
                "typescript_generation_ok": False,
                "typescript_parse_ok": False,
                "execution_valid": False,
                "parser_skipped": False,
            }
            for attempt in range(1, 6)
        ]

        _, completed, exhausted = rq1.reindex_attempts(rows, 5)
        self.assertNotIn(("operation", "model"), completed)
        self.assertIn(("operation", "model"), exhausted)

    def test_jest_failure_stops_after_pre_execution_success(self) -> None:
        row = {
            "operation_id": "operation",
            "model": "model",
            "attempt": 1,
            "budget_unit": "llm_generation",
            "llm_generation_count": 1,
            "cumulative_llm_generation_count": 1,
            "generation_backend": "next",
            "syntax_valid": True,
            "pre_execution_valid": True,
            "typescript_generation_ok": True,
            "typescript_parse_ok": True,
            "test_execution_ok": False,
            "execution_valid": False,
            "parser_skipped": False,
        }

        _, completed, exhausted = rq1.reindex_attempts([row], 5)
        self.assertIn(("operation", "model"), completed)
        self.assertNotIn(("operation", "model"), exhausted)

    def test_rq_reports_preserve_earlier_syntax_success(self) -> None:
        rows = []
        for attempt in range(1, 6):
            rows.append(
                {
                    "operation_id": "operation",
                    "requirement_group_id": "requirement",
                    "model": "model",
                    "case_study": "case",
                    "attempt": attempt,
                    "syntax_valid": attempt == 1,
                    "pre_execution_valid": False,
                    "typescript_generation_ok": False,
                    "typescript_parse_ok": False,
                    "execution_valid": False,
                    "parser_skipped": False,
                    "repair_round_count": 1,
                    "intermediate_error_count": 1,
                    "had_intermediate_errors": True,
                }
            )

        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            (output_dir / "attempts.jsonl").write_text(
                "\n".join(json.dumps(row) for row in rows) + "\n",
                encoding="utf-8",
            )
            rq1.write_rq_csvs(output_dir)
            with (output_dir / "rq1_syntax_validity_by_model.csv").open(
                newline="", encoding="utf-8"
            ) as handle:
                syntax_row = next(csv.DictReader(handle))
            with (output_dir / "rq2_execution_success_by_model.csv").open(
                newline="", encoding="utf-8"
            ) as handle:
                execution_row = next(csv.DictReader(handle))
            with (output_dir / "rq3_feedback_utility_by_model.csv").open(
                newline="", encoding="utf-8"
            ) as handle:
                recovery_row = next(csv.DictReader(handle))

        self.assertEqual("1", syntax_row["syntax_valid_count"])
        self.assertEqual("0", execution_row["execution_success_count"])
        self.assertEqual("1", recovery_row["operations_with_pre_execution_failures"])
        self.assertEqual("0", recovery_row["recovered_after_retry_count"])
        self.assertEqual("5.0000", recovery_row["avg_generation_count"])
        self.assertEqual("5.0000", recovery_row["avg_pre_execution_failure_count"])

    def test_rq3_recovery_stops_at_pre_execution_boundary(self) -> None:
        row = {
            "operation_id": "operation",
            "requirement_group_id": "requirement",
            "model": "model",
            "case_study": "case",
            "attempt": 1,
            "syntax_valid": True,
            "pre_execution_valid": True,
            "execution_valid": False,
            "repair_round_count": 2,
            "intermediate_error_count": 1,
            "parser_skipped": False,
        }

        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            (output_dir / "attempts.jsonl").write_text(
                json.dumps(row) + "\n", encoding="utf-8"
            )
            rq1.write_rq_csvs(output_dir)
            with (output_dir / "rq3_feedback_utility_by_model.csv").open(
                newline="", encoding="utf-8"
            ) as handle:
                recovery_row = next(csv.DictReader(handle))

        self.assertEqual("1", recovery_row["recovered_after_retry_count"])
        self.assertEqual("0", recovery_row["unrecovered_after_retry_count"])
        self.assertEqual("100.0000", recovery_row["pre_execution_recovery_rate"])

    def test_record_error_type_uses_parser_diagnostics(self) -> None:
        row = {
            "error_type": "missing_context",
            "contract_errors": [
                {"line": 1, "column": 2, "msg": "mismatched input 'self' expecting RULE_ID"}
            ],
        }

        self.assertEqual("malformed_expression", rq1.record_error_type(row))

    def test_paired_summary_uses_one_shared_failure_set(self) -> None:
        candidate = {
            "definition": "",
            "precondition": "true",
            "postcondition": "true",
        }
        operations = [
            {"id": "passed", "input_hash": "a"},
            {"id": "failed", "input_hash": "b"},
        ]
        shared_rows = [
            {
                "paired_study_version": paired.PAIRED_STUDY_VERSION,
                "operation_id": operation["id"],
                "model": "gpt-5.5",
                "input_hash": operation["input_hash"],
                "initial_ocl": candidate,
                "initial_candidate_hash": paired.candidate_hash(candidate),
                "pre_execution_valid": operation["id"] == "passed",
                "execution_valid": operation["id"] == "passed",
                "validation_stage": "passed" if operation["id"] == "passed" else "parser",
            }
            for operation in operations
        ]
        repair_rows = []
        for treatment, recovered, execution_valid, extra in (
            ("none", True, False, 2),
            ("generic", False, False, 4),
            ("full", True, True, 1),
        ):
            repair_rows.append(
                {
                    "operation_id": "failed",
                    "model": "gpt-5.5",
                    "treatment": treatment,
                    "pre_execution_valid": recovered,
                    "execution_valid": execution_valid,
                    "additional_generation_count": extra,
                    "validation_stage": "jest" if recovered and not execution_valid else "passed",
                }
            )

        with tempfile.TemporaryDirectory() as tmp:
            output_dir = Path(tmp)
            (output_dir / "shared_initial_candidates.jsonl").write_text(
                "\n".join(json.dumps(row) for row in shared_rows) + "\n",
                encoding="utf-8",
            )
            (output_dir / "paired_attempts.jsonl").write_text(
                "\n".join(json.dumps(row) for row in repair_rows) + "\n",
                encoding="utf-8",
            )
            args = SimpleNamespace(
                output_dir=str(output_dir),
                model="gpt-5.5",
                treatments=list(paired.TREATMENTS),
                max_attempts=5,
            )
            rows = paired.summarize(args, operations)

        by_treatment = {row["treatment"]: row for row in rows}
        self.assertEqual(1, by_treatment["none"]["shared_initial_failures"])
        self.assertEqual(1, by_treatment["none"]["recovered_count"])
        self.assertEqual(2, by_treatment["none"]["final_valid_count"])
        self.assertEqual(1, by_treatment["none"]["final_pass_count"])
        self.assertEqual(4, by_treatment["none"]["total_generation_count"])
        self.assertEqual(0, by_treatment["generic"]["recovered_count"])
        self.assertEqual(3, by_treatment["full"]["total_generation_count"])

    def test_json_length_failure_is_recorded_as_model_truncation(self) -> None:
        error = (
            'HTTP 500: {"Pipeline Error":{"message":"JSON-mode response did not '
            'contain a JSON object (finish_reason=length, output_tokens=4096, '
            'reasoning_tokens=4096)."}}'
        )

        self.assertEqual("model_output_truncated", rq1.classify_next_http_model_error(error))
        self.assertEqual("", rq1.classify_next_http_model_error("HTTP 500: database unavailable"))

    def test_reasoning_policy_is_model_specific(self) -> None:
        self.assertEqual({"reasoning_effort": "none"}, baseline.model_reasoning_parameters("gpt-5.5"))
        self.assertEqual(
            {"reasoning_effort": "minimal"},
            baseline.model_reasoning_parameters("gemini-3.5-flash"),
        )
        self.assertEqual(
            {"reasoning_effort": "low"},
            baseline.model_reasoning_parameters("claude-opus-4-7"),
        )
        self.assertEqual(
            {"enable_thinking": False},
            baseline.model_reasoning_parameters("qwen3-coder-plus"),
        )

    def test_purellm_uses_the_exact_contractgen_initial_prompt(self) -> None:
        row = self.manifest_row()
        operation = baseline.safe_operation(row, 1)
        messages = baseline.build_messages(operation)

        self.assertEqual(row["prompt_hash"], baseline.sha256_text(messages[0]["content"]))
        self.assertEqual(["system", "user"], [message["role"] for message in messages])
        self.assertEqual(row["canonical_user_message"], messages[1]["content"])

    def test_purellm_requires_the_contractgen_json_schema_without_repair(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        malformed = json.dumps(
            {
                "precondition": "User.allInstance()->notEmpty()",
                "postcondition": "result = true",
            }
        )
        extracted = baseline.extract_contract_text(malformed, operation)
        self.assertFalse(extracted["extraction_ok"])

        valid_shape = json.dumps(
            {
                "definition": None,
                "precondition": "User.allInstance()->notEmpty()",
                "postcondition": "result = true",
            }
        )
        extracted = baseline.extract_contract_text(valid_shape, operation)
        self.assertTrue(extracted["extraction_ok"])
        self.assertIn("allInstance()", extracted["precondition"])
        self.assertNotIn("allInstances()", extracted["precondition"])

    def test_purellm_fixed_sampling_does_not_stop_after_success(self) -> None:
        attempts = [
            {
                "operation_id": "operation",
                "model": "model",
                "attempt": 1,
                "syntax_valid": True,
                "execution_valid": True,
            }
        ]
        self.assertFalse(
            baseline.pair_is_complete("operation", "model", attempts, 5, True)
        )
        attempts.extend(
            {
                "operation_id": "operation",
                "model": "model",
                "attempt": attempt,
                "syntax_valid": False,
                "execution_valid": False,
            }
            for attempt in range(2, 6)
        )
        self.assertTrue(
            baseline.pair_is_complete("operation", "model", attempts, 5, True)
        )

    def test_purellm_api_request_enables_json_mode(self) -> None:
        captured = {}

        def fake_http_json(url, payload, headers, timeout):
            captured.update(payload)
            return {"choices": [{"message": {"content": "{}"}}]}

        with mock.patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}), mock.patch.object(
            baseline, "_http_json", side_effect=fake_http_json
        ):
            baseline.call_llm(
                "gpt-5.5",
                [{"role": "system", "content": "system"}],
                temperature=0.2,
                max_tokens=4096,
                timeout=1,
            )

        self.assertEqual({"type": "json_object"}, captured["response_format"])
        self.assertEqual("none", captured["reasoning_effort"])

    def test_codexprompt_uses_uml_enriched_zero_shot_prefix_without_rules(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        prompt = codex.build_codex_prompt(operation, "uml-zero-shot-contract")

        self.assertIn(codex.comment_prefix_block(operation["model_context"]), prompt)
        self.assertIn(codex.comment_prefix_block(operation["description"]), prompt)
        self.assertTrue(prompt.rstrip().endswith("OCL:"))
        self.assertNotIn("OCL generation rule catalog", prompt)
        self.assertNotIn("Executable operation-contract generation subset", prompt)

    def test_codexprompt_wrapper_conversion_preserves_expression_text(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        raw = (
            f"context {operation['service']}::{operation['operation_signature']}\n"
            "pre: Device.allInstance()->isEmpty()\n"
            "post: result = true"
        )
        extracted = codex.extract_codex_prompt_output(
            raw, operation, "uml-zero-shot-contract"
        )

        self.assertTrue(extracted["extraction_ok"])
        self.assertTrue(extracted["context_match"])
        self.assertIn("allInstance()", extracted["precondition"])
        self.assertNotIn("allInstances()", extracted["precondition"])

    def test_codexprompt_rejects_incorrect_context_and_json_shortcuts(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        wrong_context = (
            "context WrongService::wrongOperation()\n"
            "pre: true\n"
            "post: result = true"
        )
        self.assertFalse(
            codex.extract_codex_prompt_output(
                wrong_context, operation, "uml-zero-shot-contract"
            )["extraction_ok"]
        )
        json_output = json.dumps(
            {"definition": None, "precondition": "true", "postcondition": "result = true"}
        )
        self.assertFalse(
            codex.extract_codex_prompt_output(
                json_output, operation, "uml-zero-shot-contract"
            )["extraction_ok"]
        )

    def test_codexprompt_text_request_uses_source_stop_without_json_mode(self) -> None:
        captured = {}

        def fake_http_json(url, payload, headers, timeout):
            captured.update(payload)
            return {"choices": [{"message": {"content": "context S::op()"}}]}

        with mock.patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}), mock.patch.object(
            baseline, "_http_json", side_effect=fake_http_json
        ):
            baseline.call_llm(
                "gpt-5.5",
                [{"role": "user", "content": "prompt"}],
                temperature=0.2,
                max_tokens=4096,
                timeout=1,
                json_mode=False,
                stop_sequences=["//"],
            )

        self.assertNotIn("response_format", captured)
        self.assertEqual(["//"], captured["stop"])

    def test_call_llm_keeps_string_prompt_compatibility(self) -> None:
        captured = {}

        def fake_http_json(url, payload, headers, timeout):
            captured.update(payload)
            return {"choices": [{"message": {"content": "ok"}}]}

        with mock.patch.dict("os.environ", {"OPENAI_API_KEY": "test-key"}), mock.patch.object(
            baseline, "_http_json", side_effect=fake_http_json
        ):
            baseline.call_llm(
                "gpt-5.5",
                "plain prompt",
                temperature=0.2,
                max_tokens=4096,
                timeout=1,
                json_mode=False,
            )

        self.assertEqual(
            [{"role": "user", "content": "plain prompt"}], captured["messages"]
        )

    def test_jest_failure_is_a_terminal_outcome(self) -> None:
        record = {
            "syntax_valid": True,
            "execution_eval_skipped": False,
            "contract_parse_ok": True,
            "typescript_generation_ok": True,
            "typescript_parse_ok": True,
            "test_execution_ok": False,
            "execution_valid": False,
        }

        self.assertTrue(end_to_end.repair_pipeline_completed(record))
        self.assertNotIn("Jest execution", end_to_end.build_feedback(record))

    def test_end_to_end_variant_uses_the_shared_standard_syntax_prompt(self) -> None:
        rules = end_to_end.PROJECT_PROMPT_ASSETS["generation_rules"]

        self.assertIn("allInstances()", rules)
        self.assertNotIn("allInstance()", rules)

    def test_v2_manifest_is_required_by_all_experiment_runners(self) -> None:
        row = self.manifest_row()

        baseline_op = baseline.safe_operation(row, 1)
        rq1_op = rq1.safe_operation(row, 1)

        self.assertEqual(row["input_hash"], baseline_op["input_hash"])
        self.assertEqual(row["input_hash"], rq1_op["input_hash"])
        prompt = baseline.build_prompt(baseline_op)
        self.assertEqual(
            row["canonical_user_message"], baseline.build_messages(baseline_op)[1]["content"]
        )
        self.assertRegex(baseline.sha256_text(prompt), r"^[0-9a-f]{64}$")

    def test_legacy_or_oracle_exposed_manifest_is_rejected(self) -> None:
        legacy = self.manifest_row()
        legacy["input_schema_version"] = "legacy-input"
        with self.assertRaises(ValueError):
            baseline.safe_operation(legacy, 1)

        exposed = self.manifest_row()
        exposed["oracle_available_to_generator"] = True
        with self.assertRaises(ValueError):
            rq1.safe_operation(exposed, 1)

    def test_resume_rejects_results_from_a_different_input_version(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        stale = {
            "operation_id": operation["id"],
            "input_schema_version": "legacy-input",
            "input_hash": "0" * 64,
        }

        with self.assertRaises(RuntimeError):
            baseline.assert_existing_records_match_manifest(
                [stale],
                [operation],
                baseline.PURELLM_PROMPT_VERSION,
                "json",
                baseline.EXPECTED_GENERATION_TEMPERATURE,
                baseline.EXPECTED_GENERATION_MAX_TOKENS,
            )

    def test_force_cannot_delete_legacy_results(self) -> None:
        with self.assertRaises(RuntimeError):
            baseline.assert_force_target_is_current_study(
                [{"operation_id": "legacy", "study_version": "old-study"}]
            )

    def test_preflight_validates_the_frozen_manifest(self) -> None:
        manifest = preflight.validate_manifest(
            SCRIPT_DIR.parent / "data" / "operations.jsonl"
        )
        self.assertEqual(114, len(manifest))

    def test_non_frozen_generation_parameters_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            baseline.assert_generation_configuration(0.0, 4096)
        with self.assertRaises(ValueError):
            rq1.assert_generation_configuration(0.2, 4095)

    def test_anthropic_direct_request_records_the_frozen_temperature(self) -> None:
        captured = {}

        def fake_http(url, payload, headers, timeout):
            captured.update(payload)
            return {"content": []}

        with mock.patch.object(rq1, "_http_json", side_effect=fake_http):
            rq1._anthropic_messages(
                "https://api.anthropic.com",
                "test-key",
                "claude-opus-4-7",
                "prompt",
                0.2,
                4096,
                1.0,
            )

        self.assertEqual(0.2, captured["temperature"])
        self.assertEqual(4096, captured["max_tokens"])

    def test_pathocl_context_contains_only_declared_entities(self) -> None:
        manifest_path = SCRIPT_DIR.parent / "data" / "operations.jsonl"
        rows = [json.loads(line) for line in manifest_path.read_text(encoding="utf-8").splitlines()]

        for row in rows:
            entities = pathocl.parse_model_context(row["model_context"])
            self.assertNotIn(row["useCase"], entities, row["id"])
            self.assertNotIn(row["service"], entities, row["id"])
            self.assertTrue(entities, row["id"])

    def test_pathocl_ranks_directed_simple_paths_by_jaccard(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        entities = pathocl.parse_model_context(operation["model_context"])
        ranked = pathocl.rank_simple_paths(operation)

        self.assertTrue(ranked)
        self.assertGreaterEqual(len(ranked), len(entities))
        self.assertEqual(
            sorted((score for _, score in ranked), reverse=True),
            [score for _, score in ranked],
        )
        for path, _ in ranked:
            self.assertEqual(len(path), len(set(path)))
            self.assertTrue(set(path).issubset(entities))

    def test_pathocl_prompt_uses_one_path_and_no_contractgen_rules(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        path, _ = pathocl.rank_simple_paths(operation)[0]
        messages, context = pathocl.build_pathocl_messages(operation, path)

        self.assertEqual(["system", "user"], [message["role"] for message in messages])
        self.assertIn("<OCL>", messages[0]["content"])
        self.assertIn(operation["description"], messages[1]["content"])
        self.assertIn(operation["operation_signature"], messages[1]["content"])
        self.assertNotIn("OCL generation rule catalog", json.dumps(messages))
        rendered = json.loads(context)
        self.assertEqual(list(path), [item["class"] for item in rendered])

    def test_pathocl_extracts_tagged_complete_contract(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        raw = (
            "<OCL>\n"
            f"context {operation['service']}::{operation['operation_signature']}\n"
            "pre: true\n"
            "post: result = true\n"
            "</OCL>"
        )
        extracted = pathocl.extract_pathocl_output(raw, operation)

        self.assertTrue(extracted["extraction_ok"])
        self.assertTrue(extracted["context_match"])
        self.assertEqual("true", extracted["precondition"])
        self.assertEqual("result = true", extracted["postcondition"])

        without_closing_tag = raw.replace("\n</OCL>", "")
        self.assertTrue(
            pathocl.extract_pathocl_output(without_closing_tag, operation)[
                "extraction_ok"
            ]
        )

    def test_study_records_are_required_even_when_input_hash_matches(self) -> None:
        operation = baseline.safe_operation(self.manifest_row(), 1)
        record = {
            "operation_id": operation["id"],
            "input_schema_version": operation["input_schema_version"],
            "input_hash": operation["input_hash"],
            "shared_prompt_hash": operation["prompt_hash"],
            "generation_prompt_version": baseline.PURELLM_PROMPT_VERSION,
        }
        with self.assertRaises(RuntimeError):
            baseline.assert_existing_records_match_manifest(
                [record],
                [operation],
                baseline.PURELLM_PROMPT_VERSION,
                "json",
                baseline.EXPECTED_GENERATION_TEMPERATURE,
                baseline.EXPECTED_GENERATION_MAX_TOKENS,
            )


if __name__ == "__main__":
    unittest.main()
