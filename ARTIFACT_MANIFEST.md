# Artifact Manifest

This manifest maps artifact files to the manuscript's research questions, tables, and reproducibility claims.

## Canonical Inputs

| File | Description |
| --- | --- |
| `data/operations.jsonl` | The 114 benchmark operations used in all reported experiments. Each row contains the operation description and associated project/model context. |
| `LibraryManagementSystem-borrowBook-borrowBook-run-1.json` | Logged running example used while preparing the paper's Library Management System example. |

## Implementation Source Map

| Path | Role in the paper/tool |
| --- | --- |
| `package.json` | Defines the Next.js/TypeScript artifact, test commands, experiment commands, and parser-generation command. |
| `env.template` | Documents required LLM environment variables. Do not commit `.env`. |
| `src/app/service/generateOCL.ts` | Main generation entry; selects `feedback` vs `linear` graph mode and `full`/`generic`/`none` feedback mode. |
| `src/app/service/graph.ts` | Full Contract Gen graph: OCL Generator, Contract Generator/parser, TypeScript Generator, TypeScript Parser, and Test Result. |
| `src/app/service/graph-line.ts` | Linear/no-feedback graph used by ablations. |
| `src/app/service/createG4Prompt.ts` | OCL grammar guidance prompt. |
| `src/app/service/createDefinitionPrompt.ts` | Contract field guidance for definition/precondition/postcondition. |
| `src/app/service/createProjectContextPrompt.ts` | Project/model context prompt. |
| `src/app/service/createTransformRulesPrompt.ts` | Transformation-rule prompt. |
| `src/app/service/createCommonContractErrorPrompt.ts` | Localized OCL contract repair feedback. |
| `src/app/service/createCommonTypescriptErrorPrompt.ts` | Localized TypeScript repair feedback. |
| `src/app/ContractToTypescript.ts` | OCL-to-TypeScript translation support. |
| `src/app/service/generateTypescriptCode.ts` | TypeScript code-generation support for OCLTSVM. |
| `src/app/service/evaluateContract.ts` | Execution-grounded contract evaluation support. |
| `src/app/api/generate-ocl/route.ts` | API route for running the full streaming graph. |
| `src/app/api/evaluate-contract/route.ts` | API route for evaluating supplied OCL contracts. |
| `src/app/api/transform-to-ts/route.ts` | API route for transforming a contract to TypeScript. |
| `src/rm2pt/project/` | Five benchmark projects and their encoded services/entities/operations. |
| `test/` | Jest tests used for execution-grounded validation. |
| `antlr4/` | REMODEL grammar and generated TypeScript parser files. |

## Paper Table Reconstruction

The manuscript tables are reconstructed from the raw and summarized experiment folders under `results/`. No separate `results/paper_tables_current_data/` snapshot is required.

| Table family | Artifact source |
| --- | --- |
| RQ1 validity comparison | Full Contract Gen summaries, PureLLM summaries, CodexPrompt-style summary, and PathOCL-style summary. |
| RQ2 execution comparison | The same result folders, using execution success fields and attempts logs. |
| External USE/OCLTSVM funnel | `results/ocltsvm_sanity_check_114_strong/summary.json` and generated USE manifests. |
| RQ3 feedback specificity | `results/rq3_ablation_no_feedback/`, `results/rq3_ablation_generic_feedback/`, and full Contract Gen result folders. |
| RQ3 architecture ablation | `results/rq3_ablation_single_agent_full_feedback/` and `results/rq_gpt_5_4_full_oracle_fixed/`. |

## Raw Result Directories

| Directory | Contents | Used for |
| --- | --- | --- |
| `results/rq_gpt_5_4_full_oracle_fixed/` | Contract Gen + gpt-5.4 full-diagnostic run logs and summaries. | RQ1, RQ2, RQ3 selected setting, USE selected setting. |
| `results/rq_gpt_5_4_mini_full_oracle_fixed/` | Contract Gen + gpt-5.4-mini full-diagnostic run logs and summaries. | RQ1, RQ2, RQ3 feedback specificity. |
| `results/rq_claude_opus_4_7_full_oracle_fixed/` | Contract Gen + claude-opus-4-7 full-diagnostic run logs and summaries. | RQ1, RQ2, RQ3 feedback specificity. |
| `results/rq_qwen3_coder_plus_full_oracle_fixed/` | Contract Gen + qwen3-coder-plus full-diagnostic run logs and summaries. | RQ1, RQ2, RQ3 feedback specificity. |
| `results/rq_qwen3_coder_flash_full_oracle_fixed/` | Contract Gen + qwen3-coder-flash full-diagnostic run logs and summaries. | RQ1, RQ2, RQ3 feedback specificity. |
| `results/baseline_llm_only/` | PureLLM runs with direct contract generation prompts. | RQ1 and RQ2 baseline. |
| `results/codex_prompt_style/` | Reproduced CodexPrompt-style baseline runs. | RQ1 and RQ2 baseline. |
| `results/pathocl_style/` | Reproduced PathOCL-style baseline runs. | RQ1 and RQ2 baseline. |
| `results/rq3_ablation_no_feedback/` | Contract Gen without feedback repair. | RQ3 feedback ablation. |
| `results/rq3_ablation_generic_feedback/` | Contract Gen with generic failure notice only. | RQ3 feedback ablation. |
| `results/rq3_ablation_single_agent_full_feedback/` | Single-agent full-diagnostic ablation logs. | RQ3 architecture ablation. |
| `results/ocltsvm_sanity_check_114_strong/` | Generated USE models/commands and USE run summary. | RQ2 external sanity check. |
| `results/analysis_report/` | Analysis outputs regenerated from raw result folders. | Supporting reports and plots. |

## Analysis Scripts

| Script | Input | Output |
| --- | --- | --- |
| `scripts/build_rq_analysis_report.py` | `results/rq_*_full_oracle_fixed/` | `results/analysis_report/` CSV, PNG, and Markdown summaries. |
| `scripts/build_rq3_ablation_report.py` | RQ3 ablation directories. | RQ3 ablation summaries. |
| `scripts/build_rq3_generic_feedback_report.py` | Full, generic-feedback, and no-feedback result folders. | `results/rq3_generic_feedback_report/`. |
| `scripts/update_purellm_paper_tables.py` | PureLLM and Contract Gen result folders. | Current PureLLM-related table CSV/Markdown files. |
| `scripts/generate_use_strong_114.py` | `data/operations.jsonl` and selected Contract Gen attempts. | USE model files, command files, manifest, and summary. |
| `scripts/run_oclvm_sanity_check.py` | Generated contracts and OCLTSVM inputs. | Internal OCLTSVM sanity-check outputs. |
| `scripts/verify_artifact_tables.py` | Raw/summarized `results/` folders and USE summary. | Compact console summary of RQ1/RQ2/RQ3 values reconstructed from results. |

## Experiment Scripts

| Script | Purpose |
| --- | --- |
| `script/run_rq1_validity_experiments.py` | Runs Contract Gen full-diagnostic experiments. |
| `script/run_baseline_llm_only.py` | Runs PureLLM baseline. |
| `script/run_codex_prompt_style_baseline.py` | Runs CodexPrompt-style baseline. |
| `script/run_pathocl_style_baseline.py` | Runs PathOCL-style baseline. |
| `scripts/run_baseline_llm_batch.ps1` | Batch helper for baseline runs on Windows. |
| `script/export-operations-jsonl.ts` | Exports benchmark operations to JSONL. |

## Files to Exclude From Archival Packages

| Path | Reason |
| --- | --- |
| `.env` | Contains local API configuration/secrets. Use `env.template` instead. |
| `.artifactignore` | Packaging checklist for artifact-only archives; keep this file. |
| `node_modules/` | Reinstall from `package.json`/`yarn.lock`. |
| `.next/`, `.next-build/` | Generated Next.js build artifacts. |
| `coverage/`, `public/coverage/` | Generated test coverage reports. |
| `test/tmp/` | Generated temporary test files. |
| `tsconfig.tsbuildinfo` | Generated TypeScript build cache. |

## Manuscript and Figures

These files are present only when the implementation artifact is packaged together with the paper source archive.

| Path | Description |
| --- | --- |
| `main.tex` | Main ACM manuscript source. |
| `sections/*.tex` | Manuscript sections. |
| `figures/*.pdf`, `figures/*.png` | Figures used by the paper. |
| `refs.bib` | Bibliography. |
| `Contract_Gen_LaTeX.pdf` | Last compiled manuscript PDF. |

## Reviewer Verification Targets

| Claim to inspect | Recommended file(s) |
| --- | --- |
| Contract Gen improves parser-valid contract generation over statement-level baselines. | `results/rq_*_full_oracle_fixed/`, `results/codex_prompt_style/`, `results/pathocl_style/` |
| Parser validity is not enough for executable correctness. | RQ1/RQ2 summaries and attempts logs under `results/`. |
| External USE loading supports the OCLTSVM validation boundary. | `results/ocltsvm_sanity_check_114_strong/summary.json` |
| Full diagnostics improve over generic and no feedback. | `results/rq3_ablation_no_feedback/`, `results/rq3_ablation_generic_feedback/`, full result folders. |
| Staged Contract Gen is more attempt-efficient than single-agent generation. | `results/rq3_ablation_single_agent_full_feedback/`, `results/rq_gpt_5_4_full_oracle_fixed/` |
