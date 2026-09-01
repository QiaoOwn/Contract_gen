# Artifact Manifest

This map refers to retained `contractgen-study-v6` evidence. It does not claim
that every manuscript statistic is implemented by the current analysis entry point.
Canonical inputs use `contractgen-operation-input-v3` / `contractgen-system-prompt-v7`.

## Inputs and Implementation

| Path | Role |
| --- | --- |
| `data/operations.jsonl` | 114 operation-context instances, 107 service-operation oracles, 106 requirement groups; version and provenance fields. |
| `src/rm2pt/benchmarkRequirements.ts` | Structured requirement catalog; not unrestricted natural-language input. |
| `src/app/service/createOperationInput.ts` | Canonical operation-message builder and provenance. |
| `src/app/service/prompts/generationGrammar.txt` | Executable generation subset. |
| `src/app/service/prompts/generationRules.json` | Versioned generation rules. |
| `src/app/service/generateOCL.ts` | Generation entry and graph/feedback selection. |
| `src/app/service/graph.ts` | One LLM generator; deterministic assembly/parser/translation/static checks; terminal Jest evaluation. |
| `src/app/service/graph-line.ts` | Linear validation without in-graph repair. |
| `src/app/service/createProjectContextPrompt.ts` | Model context supplied to generation. |
| `src/app/service/createCommonContractErrorPrompt.ts` | Contract diagnostic feedback. |
| `src/app/service/createCommonTypescriptErrorPrompt.ts` | TypeScript diagnostic feedback. |
| `src/app/service/validateGeneratedContractSemantics.ts` | Generated-subset checks, not full standard-OCL conformance. |
| `src/app/ContractToTypescript.ts` | OCL-to-TypeScript lowering. |
| `src/app/service/generateTypescriptCode.ts` | Effect/check paths and generated validation code. |
| `src/app/service/evaluateContract.ts` | Contract evaluation support. |
| `src/app/api/generate-ocl/route.ts` | Generation API. |
| `src/app/api/evaluate-contract/route.ts` | Supplied-contract evaluation API. |
| `src/rm2pt/project/` | Encoded benchmark systems. |
| `test/` | Operation-level Jest oracles. |
| `antlr4/` | REMODEL grammar and generated parser. |
| `tools/` | Bundled USE 7.5.0 and ANTLR JAR; retain for reproduction. |

## Retained Result Map

All directory paths below are relative to `results/contractgen-study-v6/`.
Main and baseline model directories contain `attempts.jsonl` and derived summaries.

| Directory | Evidence and boundary |
| --- | --- |
| `contract_gen/full_feedback/gpt-5.5/` | Primary comparison: 114 Parse@5, 104 Pass@5, 122 calls. |
| `contract_gen/full_feedback/gpt-5.4/` | Cross-backbone run. |
| `contract_gen/full_feedback/gemini-3.5-flash/` | Cross-backbone run. |
| `contract_gen/full_feedback/claude-opus-4-7/` | Cross-backbone run. |
| `baselines/purellm-fixed5/gpt-5.5/` | Shared-guidance fixed-five PureLLM; source for offline early-stop replay. |
| `baselines/codexprompt-uml-zero-shot-fixed5/gpt-5.5/` | Contract-level prompting transfer with text output and different guidance. |
| `baselines/pathocl-jaccard-top5/gpt-5.5/` | Ranked-path contract transfer; not identical-input feedback ablation. |
| `contract_gen/generic_feedback/gpt-5.5/` | Unpaired generic-feedback run; not the paired pilot. |
| `contract_gen/no_feedback/gpt-5.5/` | Unpaired no-feedback run; not the paired pilot. |
| `rq3_paired/gpt-5.5/` | Shared candidates, repair records, and summary; only five initial failures. |
| `validation/use-external-gpt-5.5-v2/` | Converted models, logs, manifest and USE compile funnel; 105/114 complete contracts compile. |
| `validation/use_ocltsvm_semantic_agreement/final_30ops/` | Shared-state decisions and logs; external preconditions versus internal pre/post checks. |
| `validation/use-external-gpt-5.5/` and semantic pilot subdirectories | Earlier conversion/pilot history, not extra independent samples. |
| `smoke/` | Development checks, excluded from main tables. |

The old `validation/use_strong_114/` and `ablations/end_to_end_full_feedback/`
paths are not present in the retained v6 study. Their earlier documentation must
not be used to imply that the corresponding current-version runs exist.

## RQ Mapping

| Question | Inspect | Interpretation |
| --- | --- | --- |
| RQ1: effectiveness and generation effort | Main GPT-5.5 run, three baseline directories, offline replay | Separate fixed-budget cost, stopping, and diagnostic effects; non-significance is not equivalence. |
| RQ2: reliability beyond syntax | Four full-feedback runs, USE compile and shared-state records | Parser acceptance, USE compilation, and scenario success have different denominators and meanings. |
| RQ3: diagnostic repair | `rq3_paired/gpt-5.5/`; full-feedback trajectories as observational support | Full 5/5 vs none 2/5 vs generic 1/5 is a small pilot; paired full uses 124 calls, not 122. |

## Offline Analysis and Runners

| File | Purpose |
| --- | --- |
| `scripts/verify_artifact_tables.py` | Read-only reconstruction of selected current metrics, offline replay and its 114 selections, paired recovery and external/internal denominators. `--json` prints structured output. |
| `scripts/test_verify_artifact_tables.py` | Regression tests for provenance, budgets, hidden-Jest stopping, candidate pairing and agreement denominators. |
| `script/run_rq1_validity_experiments.py` | Main staged-generation runner. |
| `script/run_baseline_llm_only.py` | Fixed independent PureLLM sampling. |
| `script/run_codex_prompt_style_baseline.py` | CodexPrompt contract-transfer runner. |
| `script/run_pathocl_style_baseline.py` | Ranked-path contract-transfer runner. |
| `script/run_paired_feedback_ablation.py` | Shared-initial-candidate feedback pilot runner. |
| `script/run_rq3_end_to_end_full_feedback.py` | Architecture-ablation runner; presence does not establish a retained current-version experiment. |
| `scripts/generate_use_strong_114.py` | USE conversion/compile runner; writes artifacts, not a read-only inspection command. |
| `scripts/run_use_ocltsvm_semantic_agreement.py` | Shared-state comparison runner. |
| `script/validate-operation-inputs.ts` | Input validation. |
| `script/export-operations-jsonl.ts` | Input export; writes the manifest and must not silently change frozen inputs. |
| `docs/TOSEM_REVISION_PLAN.md` | Evidence audit, pending experiments, and proposed manuscript revisions. |

Other historical report builders are retained but their default paths and
interpretations are not certified by this audit. The verifier does not currently
rebuild all figures, clustered inference, or every table in the manuscript.

## Packaging Boundary

Keep source, structured inputs, tests, prompts/rules, raw evidence, analysis tools,
bundled tools and their notices. Exclude `.env`, `node_modules/`, `.next/`,
`.next-build/`, `coverage/`, `public/coverage/`, `test/tmp/`, and build caches;
keep `.artifactignore` as the packaging configuration.

`env.template` documents configuration without live credentials.
`CITATION.cff.example` and `.zenodo.json.example` are unfinished templates.
Author order, version metadata, licensing, and final DOI require confirmation.
No LaTeX manuscript source or paper figures are claimed to be included.
