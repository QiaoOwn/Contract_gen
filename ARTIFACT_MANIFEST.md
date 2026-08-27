# Artifact Manifest

This manifest maps artifact files to the manuscript's research questions, tables, and reproducibility claims.

## Canonical Inputs

| File | Description |
| --- | --- |
| `data/operations.jsonl` | The 114 operation-context inputs, covering 107 distinct service operations and 106 distinct requirement specifications. Each row contains the structured requirement, context, oracle and requirement-group identifiers, return-value marker, version identifiers, and SHA-256 hashes; reference OCL is excluded. |
| `src/rm2pt/benchmarkRequirements.ts` | Author-normalized structured requirement catalog for all 114 operations. |
| `src/app/service/prompts/generationGrammar.txt` | Shared executable generation subset used by generation and controlled ablation scripts. |
| `src/app/service/prompts/generationRules.json` | Versioned OCL generation rule catalog shared by Contract Gen and controlled baselines. |
| `LibraryManagementSystem-borrowBook-borrowBook-run-1.json` | Logged running example used while preparing the paper's Library Management System example. |

## Implementation Source Map

| Path | Role in the paper/tool |
| --- | --- |
| `package.json` | Defines the Next.js/TypeScript artifact, test commands, experiment commands, and parser-generation command. |
| `env.template` | Documents required LLM environment variables. Do not commit `.env`. |
| `src/app/service/generateOCL.ts` | Main generation entry; selects `feedback` vs `linear` graph mode and `full`/`generic`/`none` feedback mode. |
| `src/app/service/createOperationInput.ts` | Builds and validates the canonical operation message and its provenance hashes. |
| `src/app/service/graph.ts` | Full Contract Gen graph: OCL Generator, assembly/parser/generated-subset validation, TypeScript generation/checking, and terminal Jest evaluation. |
| `src/app/service/graph-line.ts` | No-feedback graph that terminates at the first failed deterministic stage. |
| `src/app/service/createG4Prompt.ts` | OCL grammar guidance prompt. |
| `src/app/service/createDefinitionPrompt.ts` | Contract field guidance for definition/precondition/postcondition. |
| `src/app/service/createProjectContextPrompt.ts` | Project/model context prompt. |
| `src/app/service/createGenerationRulesPrompt.ts` | Renders and hashes the OCL generation rule catalog. |
| `src/app/service/validateGeneratedContractSemantics.ts` | Enforces typed bindings and clause-local restrictions after parsing. |
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

The manuscript tables are reconstructed from raw and summarized records carrying the `contractgen-study-v6` marker under `results/contractgen-study-v6/`. Legacy result folders are excluded, and no separate `results/paper_tables_current_data/` snapshot is required.

| Table family | Artifact source |
| --- | --- |
| RQ1 validity comparison | `results/contractgen-study-v6/contract_gen/full_feedback/` and `results/contractgen-study-v6/baselines/`. |
| RQ2 execution comparison | The same v5 result folders, using execution-success fields from strict attempt records. |
| External USE/OCLTSVM funnel | `results/contractgen-study-v6/validation/use_strong_114/summary.json` and its generated USE manifest. |
| RQ3 feedback specificity | `results/contractgen-study-v6/contract_gen/{no_feedback,generic_feedback,full_feedback}/`. |
| RQ3 pipeline-structure ablation | `results/contractgen-study-v6/ablations/end_to_end_full_feedback/` and the matching full-feedback Contract Gen run. |
| Evaluation-unit sensitivity | `rq1_syntax_validity_by_evaluation_unit.csv` and `rq2_execution_success_by_evaluation_unit.csv` in each result directory. |

## Raw Result Directories

| Directory | Contents | Used for |
| --- | --- | --- |
| `results/contractgen-study-v6/contract_gen/full_feedback/` | Contract Gen runs with parser and TypeScript diagnostic feedback. | RQ1, RQ2, RQ3 selected setting, USE selected setting. |
| `results/contractgen-study-v6/contract_gen/generic_feedback/` | Contract Gen runs with a generic failure notice only. | RQ3 feedback-specificity ablation. |
| `results/contractgen-study-v6/contract_gen/no_feedback/` | Contract Gen runs without repair feedback. | RQ3 feedback-specificity ablation. |
| `results/contractgen-study-v6/baselines/purellm/` | PureLLM runs with direct contract-generation prompts. | RQ1 and RQ2 baseline. |
| `results/contractgen-study-v6/baselines/codexprompt/` | Reproduced CodexPrompt-style baseline runs. | RQ1 and RQ2 baseline. |
| `results/contractgen-study-v6/baselines/pathocl/` | Reproduced PathOCL-style baseline runs. | RQ1 and RQ2 baseline. |
| `results/contractgen-study-v6/ablations/end_to_end_full_feedback/` | End-to-end full-feedback pipeline-structure ablation. | RQ3 pipeline-structure ablation. |
| `results/contractgen-study-v6/validation/use_strong_114/` | Generated USE models, commands, manifest, and summary. | External semantic sanity check. |
| `results/contractgen-study-v6/reports/` | Reports regenerated exclusively from v6 records. | Supporting tables and analysis. |

## Analysis Scripts

| Script | Input | Output |
| --- | --- | --- |
| `scripts/build_rq_analysis_report.py` | Frozen v6 Contract Gen and baseline records. | `results/contractgen-study-v6/reports/analysis/` summaries. |
| `scripts/build_rq3_ablation_report.py` | v6 full-feedback and no-feedback records. | `results/contractgen-study-v6/reports/rq3_ablation/`. |
| `scripts/build_rq3_generic_feedback_report.py` | v6 full-, generic-, and no-feedback records. | `results/contractgen-study-v6/reports/rq3_generic_feedback/`. |
| `scripts/generate_use_strong_114.py` | `data/operations.jsonl` and selected Contract Gen attempts. | USE model files, command files, manifest, and summary. |
| `scripts/run_oclvm_sanity_check.py` | Generated contracts and OCLTSVM inputs. | Internal OCLTSVM sanity-check outputs. |
| `scripts/verify_artifact_tables.py` | Marker-validated v5 records and USE summary. | Compact RQ1/RQ2/RQ3 reconstruction with legacy-data rejection. |

## Experiment Scripts

| Script | Purpose |
| --- | --- |
| `script/run_rq1_validity_experiments.py` | Runs Contract Gen full-diagnostic experiments. |
| `script/run_baseline_llm_only.py` | Runs PureLLM baseline. |
| `script/run_codex_prompt_style_baseline.py` | Runs CodexPrompt-style baseline. |
| `script/run_pathocl_style_baseline.py` | Runs PathOCL-style baseline. |
| `scripts/run_baseline_llm_batch.ps1` | Batch helper for baseline runs on Windows. |
| `script/export-operations-jsonl.ts` | Exports benchmark operations to JSONL. |
| `script/validate-operation-inputs.ts` | Rejects missing, placeholder, duplicated, or version-inconsistent inputs before an experiment. |

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
| Contract Gen improves parser-valid contract generation over statement-level baselines. | `results/contractgen-study-v6/contract_gen/full_feedback/` and `results/contractgen-study-v6/baselines/` |
| Parser validity is not enough for executable correctness. | RQ1/RQ2 summaries and attempt records under `results/contractgen-study-v6/`. |
| External USE loading supports the OCLTSVM validation boundary. | `results/contractgen-study-v6/validation/use_strong_114/summary.json` |
| Full diagnostics improve over generic and no feedback. | `results/contractgen-study-v6/contract_gen/{no_feedback,generic_feedback,full_feedback}/` |
| Staged Contract Gen is more attempt-efficient than end-to-end full-feedback generation. | `results/contractgen-study-v6/ablations/end_to_end_full_feedback/` and the matching full-feedback records. |
