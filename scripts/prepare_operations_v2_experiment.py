"""Export locally reviewed NL without gold; explicitly audit experiment blockers.

This does not call a model or alter the historical benchmark/runtime. The output
is a candidate input view, NOT a manifest accepted by the frozen 114-row runners.
"""

from __future__ import annotations

import argparse
from collections import Counter
import importlib.util
import json
from pathlib import Path
import subprocess

try:
    from . import revise_operations_v2 as revision
except ImportError:
    import revise_operations_v2 as revision

ROOT = revision.ROOT
WORK = revision.WORK
VIEW = ROOT / "data/operations_v2_generation_candidates.jsonl"
ALLOWED = ("id", "case_study", "project", "useCase", "operation", "service", "entity",
           "operation_name", "operation_signature", "parameters", "return_type", "model_context",
           "operation_intent", "preconditions_nl", "postconditions_nl")


def describe(row):
    pre = row["preconditions_nl"] or ["No additional domain precondition is specified."]
    return "\n".join(["Operation intent:", row["operation_intent"], "", "Preconditions:",
                      *["- " + text for text in pre], "", "Postconditions:",
                      *["- " + text for text in row["postconditions_nl"]]])


def input_view(rows):
    output = []
    for row in rows:
        if row["quality_status"] != "VERIFIED":
            continue
        revision.require(row["structured_input_ready"] and row["reference_contract"]
                         and not row["missing_evidence"] and not row["source_conflicts"],
                         "Only evidence-complete local annotations can enter the candidate view")
        revision.require(bool(row["operation_intent"]) and bool(row["postconditions_nl"]),
                         "Incomplete structured requirement")
        description = describe(row)
        revision.require(not revision.LEAK.search(description) and not revision.GENERIC.search(description),
                         "Unsafe requirement text")
        candidate = {key: row[key] for key in ALLOWED}
        candidate["description"] = description
        output.append(candidate)
    return output


def inspect_runtime():
    command = ["node", "--import", "tsx", "scripts/inspect_operations_v2_runtime.ts", str(revision.TARGET)]
    result = subprocess.run(command, cwd=ROOT, check=True, capture_output=True, encoding="utf-8")
    return json.loads(result.stdout)


def inspect_runner(candidates):
    path = ROOT / "script/run_rq1_validity_experiments.py"
    spec = importlib.util.spec_from_file_location("v2_runner_inspection", path)
    runner = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(runner)
    errors = []
    for number, candidate in enumerate(candidates, 1):
        try:
            runner.validate_manifest_row(candidate, number)
        except ValueError as exc:
            errors.append({"id": candidate["id"], "error": str(exc)})
    return {"runner_path": path.relative_to(ROOT).as_posix(), "runner_sha256": revision.sha(path),
            "expected_count": runner.EXPECTED_OPERATION_COUNT,
            "candidate_count": len(candidates), "count_matches": len(candidates) == runner.EXPECTED_OPERATION_COUNT,
            "manifest_validation_errors": errors,
            "ready": not errors and len(candidates) == runner.EXPECTED_OPERATION_COUNT}


def check_existing_jest(rows):
    paths = sorted({row.get("resolution_audit", {}).get("historical_test_source",
                                                       row["source_provenance"]["test_source"])
                    for row in rows})
    watched = {path: revision.sha(ROOT / path) for path in paths}
    for path in paths:
        entry = str(Path(path).with_name("entry.ts"))
        watched[entry] = revision.sha(ROOT / entry)
    output = WORK / "existing_jest_check.json"
    command = ["node", "node_modules/jest/bin/jest.js", "--runInBand", "--coverage=false",
               "--watch=false", "--json", "--outputFile", str(output), "--runTestsByPath", *paths]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, encoding="utf-8", errors="replace")
    (WORK / "existing_jest_check.log").write_text(result.stdout + result.stderr, encoding="utf-8")
    revision.require(output.is_file(), "Jest did not emit a result; inspect existing_jest_check.log")
    raw = json.loads(output.read_text(encoding="utf-8"))
    for path, checksum in watched.items():
        revision.require(revision.sha(ROOT / path) == checksum, "Existing oracle or entry changed during check")
    checks = []
    for test in raw["testResults"]:
        name = Path(test["name"]).resolve().relative_to(ROOT).as_posix()
        checks.append({"path": name, "status": test["status"], "assertions": len(test["assertionResults"])})
    revision.require({test["path"] for test in checks} == set(paths), "Jest file coverage mismatch")
    return {"scope": "Existing authored Jest tests against existing entry.ts files, NOT V2 generated candidates or independent gold verification",
            "return_code": result.returncode, "success": bool(raw["success"]) and result.returncode == 0,
            "test_suites": raw["numTotalTestSuites"], "tests": raw["numTotalTests"],
            "passed_tests": raw["numPassedTests"], "failed_tests": raw["numFailedTests"],
            "test_results": checks, "pinned_file_sha256": watched,
            "raw_result": output.relative_to(ROOT).as_posix(), "raw_result_sha256": revision.sha(output)}


def check_v2_jest(rows):
    paths = sorted({row["source_provenance"]["test_source"] for row in rows
                    if row.get("resolution_audit", {}).get("oracle_edits")})
    watched = {path: revision.sha(ROOT / path) for path in paths}
    for path in paths:
        entry = str(Path(path).with_name("entry.ts"))
        watched[entry] = revision.sha(ROOT / entry)
    for helper in ("data/operation_revision/oracles_v2/helpers/contractOracle.ts",
                   "data/operation_revision/oracles_v2/helpers/setOracle.ts"):
        watched[helper] = revision.sha(ROOT / helper)
    output = WORK / "v2_oracle_jest_check.json"
    command = ["node", "node_modules/jest/bin/jest.js", "--config", "scripts/jest.v2-oracles.config.cjs",
               "--runInBand", "--json", "--outputFile", str(output), "--runTestsByPath", *paths]
    result = subprocess.run(command, cwd=ROOT, capture_output=True, encoding="utf-8", errors="replace")
    (WORK / "v2_oracle_jest_check.log").write_text(result.stdout + result.stderr, encoding="utf-8")
    revision.require(output.is_file(), "V2 Jest did not emit a result; inspect v2_oracle_jest_check.log")
    raw = json.loads(output.read_text(encoding="utf-8"))
    revision.require(bool(raw["success"]) and result.returncode == 0, "Source-aligned V2 oracle tests failed")
    for path, checksum in watched.items():
        revision.require(revision.sha(ROOT / path) == checksum, "V2 oracle changed during check")
    observed = {Path(test["name"]).resolve().relative_to(ROOT).as_posix() for test in raw["testResults"]}
    revision.require(observed == set(paths), "V2 Jest file coverage mismatch")
    return {"scope": "Versioned source-aligned oracle copies for historical assertions stronger than the cited contracts; not generated contracts and not independent ground truth",
            "return_code": result.returncode, "success": True,
            "test_suites": raw["numTotalTestSuites"], "tests": raw["numTotalTests"],
            "passed_tests": raw["numPassedTests"], "failed_tests": raw["numFailedTests"],
            "pinned_file_sha256": watched,
            "raw_result": output.relative_to(ROOT).as_posix(), "raw_result_sha256": revision.sha(output)}


def write_readiness(rows, candidates, runtime, runner, jest, v2_jest):
    counts = Counter(row["quality_status"] for row in rows)
    context_mismatch = sum(not check["context_matches_current_service"] for check in runtime)
    absent_today = sum(not check["preserved_context_declares_today"] for check in runtime)
    absent_now = sum(not check["preserved_context_declares_now"] for check in runtime)
    excluded = [{"id": row["id"], "quality_status": row["quality_status"],
                 "missing_evidence": row["missing_evidence"], "source_conflicts": row["source_conflicts"],
                 "reference_source": row["source_provenance"]["reference_ocl_candidate_source"],
                 "test_source": row["source_provenance"]["test_source"]}
                for row in rows if row["quality_status"] != "VERIFIED"]
    manifest = {"version": "v2-source-audit-input-candidates-v1", "master_count": len(rows),
                "quality_status": dict(counts), "candidate_count": len(candidates),
                "excluded_count": len(excluded), "master_sha256": revision.sha(revision.TARGET),
                "candidate_sha256": revision.sha(VIEW), "current_runners_ready": False,
                "publication_ready": False, "model_calls": 0,
                "context_policy": "Original model_context is preserved exactly; no current-service context replacement",
                "runtime_context_mismatch_count": context_mismatch, "runtime_checks": runtime,
                "runner_compatibility": runner, "existing_jest": jest, "source_aligned_v2_oracles": v2_jest,
                "candidate_ids": [row["id"] for row in candidates], "excluded": excluded}
    (WORK / "experiment_readiness.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    lines = ["# V2 数据修复与实验准入检查", "",
             "## 结论", "",
             f"主文件仍保留全部 {len(rows)} 条。局部源证据核验通过 {counts['VERIFIED']} 条，待复核 {counts['NEEDS_REVIEW']} 条，缺依据 {counts['NEEDS_SOURCE']} 条；尚未完全确认 {len(excluded)} 条。",
             "VERIFIED 表示与仓库内参考合约和审计后的场景声明静态一致；其中有固定上游来源的记录还核对了对应 RM2PT 形式规范。它仍不表示独立人工确认、完整测试覆盖或论文发布批准。", "",
             f"已从确认记录导出 {len(candidates)} 条无参考答案的输入候选，位于 `data/operations_v2_generation_candidates.jsonl`。这不是 114 条正式实验清单，当前不能直接交给原实验命令。未确认记录没有填充、复制或替换来凑足 114 条。", "",
             "## 本轮有依据的修复", "",
             "- 对原 27 条问题记录逐条复核：19 条已消除来源、类型或 oracle 表示问题，8 条因上游形式规范本身仍有歧义而保持 NEEDS_SOURCE。没有补写业务常识。",
             "- 对固定上游 RM2PT 文件进行哈希与 commit 固定；仅在 operation owner 和形式规范能够明确映射时记录上游来源。",
             "- 旧 Jest 中超出合约的数组身份、顺序、额外 frame 条件，以及 String 参数误用数字的断言，被放入独立 V2 oracle 副本修正。历史 Jest 文件保持不变。",
             "- `sendNotificationEmail` 仅作为非空输入并返回 true 的抽象第三方服务 stub；未声称真实发送、送达或外部副作用。", "",
             "## 当前实验阻碍", "",
             f"1. 冻结上下文与当前服务上下文不一致：{context_mismatch}/{len(rows)}。冻结上下文没有 Today 声明的有 {absent_today} 条，没有 Now 声明的有 {absent_now} 条。此处是输入版本差异，不等于这些 operation 全部缺少业务语义。",
             "2. 当前服务在 buildOperationInput 中重新构造上下文；仅传 userInput 只能替换需求，不能保留冻结的 model_context。直接跑 Next 后端会改变实验输入，且输入哈希检查无法通过。",
             f"3. 当前实验脚本要求 {runner['expected_count']} 条 canonical manifest，以及输入、上下文、提示词和生成配置的哈希字段；候选视图仅 {len(candidates)} 条且没有伪造这些字段。实际调用其清单校验器得到的错误已保存在 experiment_readiness.json。",
             f"4. 仍有 {len(excluded)} 条 source ambiguity；它们不能进入当前候选输入，也不能通过改写 NL 或放宽测试来消除。", "",
             "## 输入边界", "",
             "- 主文件的 description_original、description 和所有禁止修改的标识、签名、类型、参数、model_context 均未改变。",
             "- 候选文件的 description 从 operation_intent / preconditions_nl / postconditions_nl 派生，采用当前服务要求的 Operation intent / Preconditions / Postconditions 标题。",
             "- 候选文件只保留明确白名单字段，没有 reference_contract、证据引文、审计结论、oracle_refs 或原始模板描述。",
             "- 不确定记录继续保留在 114 条主文件；候选数量不是最终 benchmark 样本量，更不能与旧 114 条实验结果直接混报。", "",
             "## 现有测试检查", ""]
    if jest:
        lines += [f"检查 {jest['test_suites']} 个既有测试文件，共 {jest['tests']} 个测试；通过 {jest['passed_tests']}，失败 {jest['failed_tests']}。总体成功：{jest['success']}。",
                  "检查对象是原有 entry.ts 与 Jest 文件，不是用 V2 新需求生成的合约，也不是独立正确性证据。没有修改原 oracle、entry 或历史结果。详情见 existing_jest_check.json / existing_jest_check.log。"]
    else:
        lines += ["本次未执行既有 Jest；静态源审计不代表运行成功。"]
    if v2_jest:
        lines += [f"独立 V2 oracle 共 {v2_jest['test_suites']} 个文件、{v2_jest['tests']} 个测试；通过 {v2_jest['passed_tests']}，失败 {v2_jest['failed_tests']}。这些文件只校正历史断言与来源合约的表示差异，不是新生成的 ground truth。详情见 v2_oracle_jest_check.json / v2_oracle_jest_check.log。"]
    lines += ["", "## 剩余记录与具体补充项", ""]
    for item in excluded:
        lines += [f"### {item['id']} ({item['quality_status']})",
                  *["- " + text for text in item["missing_evidence"] + item["source_conflicts"]],
                  f"- 本地参考：`{item['reference_source']['path']}`；测试：`{item['test_source']}`。", ""]
    lines += ["## 下一步顺序", "",
              f"1. 对 {counts['NEEDS_SOURCE']} 条 NEEDS_SOURCE 取得作者确认、领域不变量或修订后的权威规范；在此之前保持隔离。",
              "2. 由至少一名未参与当前整理的研究者，对 106 条候选的来源映射与原子化 NL 做独立复核并记录签字/分歧处理。",
              "3. 确认 V2 上下文策略。若继续冻结原上下文，应实现独立版本的输入通道并统一各实验组；若升级上下文，必须另建版本、说明变化并重新运行，不能静默替换本主文件。",
              "4. 冻结完整 manifest、评估器和样本清单后再运行新实验。旧 results 不重标为 V2。", "",
              "## 重现本检查", "", "```powershell",
              "python scripts/prepare_operations_v2_experiment.py --check-existing-jest", "```", ""]
    (WORK / "experiment_readiness.md").write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({key: manifest[key] for key in ("master_count", "quality_status", "candidate_count", "excluded_count", "current_runners_ready", "runtime_context_mismatch_count")}, ensure_ascii=False))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check-existing-jest", action="store_true")
    args = parser.parse_args()
    summary = revision.verify()
    revision.write_report(summary)
    rows = revision.read_rows(revision.TARGET)
    candidates = input_view(rows)
    runtime = inspect_runtime()
    runner = inspect_runner(candidates)
    # Prepare everything before writing the candidate view; no fallback to old NL.
    jest = check_existing_jest(rows) if args.check_existing_jest else None
    v2_jest = check_v2_jest(rows) if args.check_existing_jest else None
    VIEW.write_text("".join(json.dumps(row, ensure_ascii=False, separators=(",", ":")) + "\n" for row in candidates), encoding="utf-8")
    write_readiness(rows, candidates, runtime, runner, jest, v2_jest)


if __name__ == "__main__":
    main()
