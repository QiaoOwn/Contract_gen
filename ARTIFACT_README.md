# Artifact README

This artifact accompanies the manuscript **"Contract Gen: Verification-Driven OCL Contract Generation"**. It provides the implementation, benchmark data, generated outputs, validation logs, and analysis scripts needed to inspect and reproduce the paper's reported results.

Repository URL: <https://github.com/QiaoOwn/Contract_gen>

> **Input-version notice.** The canonical benchmark now uses
> `contractgen-operation-input-v2` and `contractgen-system-prompt-v5`. Result
> directories produced before this migration are historical records and must
> not be combined with current v5 runs in a submitted table. Re-run the reported
> methods and ablations before finalizing the manuscript numbers.
> All current runners write under `results/contractgen-study-v6/`; analysis and
> revalidation tools reject records without that study marker.

The implementation repository is a Next.js/TypeScript project. The artifact combines that implementation with the experiment data and manuscript material used in the paper.

## 1. Artifact Scope

The artifact supports three levels of reproducibility.

1. **Inspect precomputed results.** Review the benchmark, raw result folders, USE sanity-check outputs, and generated paper PDF.
2. **Recompute paper tables from stored results.** Run the analysis scripts on the included result folders. This does not require LLM API access.
3. **Re-run generation experiments.** Re-execute Contract Gen, PureLLM, baseline-style prompting, ablations, and USE checks. This requires model API credentials and, for USE, a local USE installation.

The artifact is designed so that reviewers can verify the paper's main claims without re-running expensive LLM calls. Full regeneration is optional and may produce small variations unless model versions, decoding settings, and service behavior are fixed.

## 2. Repository Layout

| Path | Purpose |
| --- | --- |
| `data/operations.jsonl` | Oracle-isolated canonical input for 114 operation-context instances, covering 107 distinct service operations and 106 distinct requirement specifications. |
| `src/rm2pt/benchmarkRequirements.ts` | Auditable structured requirements: operation intent, preconditions, and postconditions. |
| `src/app/service/createOperationInput.ts` | Shared operation-message builder and input validator. |
| `src/app/service/prompts/generationGrammar.txt` | Versioned executable generation subset shared by Contract Gen and controlled baselines. |
| `src/app/service/prompts/generationRules.json` | Versioned, identifier-bearing OCL generation rule catalog. |
| `src/app/service/validateGeneratedContractSemantics.ts` | Clause-level generated-subset checks over the parsed REMODEL syntax tree. |
| `src/app/service/generateOCL.ts` | Main programmatic entry for Contract Gen. It selects the feedback graph, linear graph, and feedback mode. |
| `src/app/service/graph.ts` | LangGraph implementation of OCL generation, contract parsing, TypeScript generation, TypeScript checking, and Jest-based execution validation. |
| `src/app/service/graph-line.ts` | No-feedback variant that stops at the first failed deterministic validation stage. |
| `src/app/service/create*Prompt.ts` | Prompt builders for grammar guidance, definitions, project context, OCL generation rules, and localized repair feedback. |
| `src/app/ContractToTypescript.ts` and `src/app/service/generateTypescriptCode.ts` | OCL-to-TypeScript translation support used by OCLTSVM. |
| `src/app/api/generate-ocl/route.ts` | HTTP API route for running the full generation/validation stream. |
| `src/rm2pt/project/` | Encoded benchmark projects, services, entities, and operations. |
| `test/` | Operation-level Jest tests used for execution-grounded validation. |
| `antlr4/` | REMODEL grammar and generated TypeScript parser files. |
| `results/contractgen-study-v6/contract_gen/` | Full-, generic-, and no-feedback Contract Gen runs. |
| `results/contractgen-study-v6/baselines/` | PureLLM, CodexPrompt-style, and PathOCL-style runs. |
| `results/contractgen-study-v6/ablations/` | End-to-end full-feedback pipeline-structure ablation. |
| `results/contractgen-study-v6/validation/` | OCLTSVM revalidation and external USE artifacts. |
| Other directories under `results/` | Historical records from earlier study configurations; excluded from current analysis. |
| `scripts/` | Python analysis and USE artifact-generation scripts. |
| `script/` | Experiment-running scripts for Contract Gen, PureLLM, and baseline-style prompting. |
| `main.tex`, `sections/`, `figures/`, `refs.bib` | Optional LaTeX manuscript source when this artifact is packaged together with the paper source archive. |
| `ARTIFACT_MANIFEST.md` | Detailed mapping from directories/files to paper RQs and tables. |

Generated or private folders/files such as `node_modules/`, `.next/`, `.next-build/`, `coverage/`, `test/tmp/`, and `.env` should not be included in an archival package. Use `env.template` to document required environment variables.
The repository also includes `.artifactignore` as an explicit packaging checklist.

## 3. Hardware and Software Requirements

### Minimum environment for table reproduction

- Windows 10/11, macOS, or Linux.
- Python 3.10 or later.
- Python packages: `pandas`, `matplotlib`.

Install the lightweight analysis dependencies:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements-artifact.txt
```

On macOS/Linux, activate the virtual environment with `source .venv/bin/activate`.

### Optional environment for full regeneration

- Node.js and TypeScript tooling, for running the TypeScript experiment scripts in `script/`.
- Yarn or npm. The repository includes `yarn.lock`; either `yarn install --frozen-lockfile` or `npm install` can be used depending on the reviewer environment.
- LLM API credentials for the evaluated models.
- USE OCL 7.5.0 or compatible, for external sanity checks.
- Tectonic or another LaTeX engine, for rebuilding the manuscript PDF.

The manuscript directory includes `tools/tectonic/tectonic.exe` for the current Windows workspace. If it is unavailable after cloning, install Tectonic separately or use a standard ACM-compatible LaTeX toolchain.

The implementation reads the following environment variables:

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | API key for the OpenAI-compatible model provider. |
| `OPENAI_BASE_URL` | Optional OpenAI-compatible endpoint; see `env.template`. |

## 4. Quick Validation Path

Use this path when the goal is to check that the artifact contains the same data used by the paper.

```powershell
npm run export-operations-jsonl
npm run preflight:experiments
python scripts/verify_artifact_tables.py
python scripts/build_rq3_generic_feedback_report.py
python scripts/generate_use_strong_114.py --run-use
```

Expected outputs:

- A successful 114-operation input audit with 114 unique input hashes.
- A preflight report showing the frozen input/prompt hashes, isolated v5 result count, and excluded legacy-file count.
- Console output from `scripts/verify_artifact_tables.py` summarizing RQ1/RQ2/RQ3 only from `results/contractgen-study-v6/`.
- `results/contractgen-study-v6/reports/rq3_generic_feedback/rq3_generic_feedback_by_model.csv`
- `results/contractgen-study-v6/validation/use_strong_114/manifest.csv`
- `results/contractgen-study-v6/validation/use_strong_114/summary.json`

The paper tables are derived from the raw and summarized result folders under `results/`; no separate table snapshot directory is required. The regenerated `*_check` directories are useful sanity checks and should not be treated as new experiment runs unless the manuscript is intentionally updated.

## 5. Rebuilding the Paper

If the LaTeX manuscript source is included in the same archive, rebuild it with:

```powershell
tools\tectonic\tectonic.exe main.tex
Copy-Item -LiteralPath main.pdf -Destination Contract_Gen_LaTeX.pdf -Force
```

Expected output:

- `main.pdf`
- `Contract_Gen_LaTeX.pdf`

The implementation-only GitHub repository does not need to include the paper source for artifact validation; the experiment and table checks above are independent of LaTeX compilation.

## 6. Reproducing Each Research Question

### RQ1: Contract-generation effectiveness

Evidence:

- `results/contractgen-study-v6/contract_gen/full_feedback/`
- `results/contractgen-study-v6/baselines/`

Analysis command:

```powershell
python scripts/build_rq_analysis_report.py
```

The key paper-level comparison is the syntax-validity rate across reproduced baseline-style prompts, PureLLM, and Contract Gen.

### RQ2: Beyond-syntax reliability

Evidence:

- `results/contractgen-study-v6/contract_gen/full_feedback/`
- `results/contractgen-study-v6/baselines/`
- `results/contractgen-study-v6/validation/use_strong_114/summary.json`

The USE sanity check is an external agreement check for generated definition and precondition clauses. It does not claim full post-state equivalence because USE invariants do not directly model operation postconditions involving `oclIsNew`, `@pre`, mutation, and result values.

To regenerate the USE artifacts without running USE:

```powershell
python scripts/generate_use_strong_114.py
```

To also run USE, provide a USE executable:

```powershell
python scripts/generate_use_strong_114.py --run-use --use-bat tools/use-7.5.0/bin/use.bat
```

Expected paper result from the included run:

- Generated contracts from selected setting: 100.00%.
- USE-encodable precondition: 99.12%.
- USE semantic load: 96.49%.

### RQ3: Mechanism and efficiency

Evidence:

- `results/contractgen-study-v6/contract_gen/{no_feedback,generic_feedback,full_feedback}/`
- `results/contractgen-study-v6/ablations/end_to_end_full_feedback/`

Paper-level interpretation:

- Generic failure notices improve over no feedback.
- Full localized diagnostics improve further.
- The staged Contract Gen architecture reaches useful results with far fewer attempts than end-to-end full-feedback generation, even though the end-to-end variant has a slightly higher final Pass@5 in the current GPT-5.4 run. Both treatments use one LLM; this comparison isolates pipeline structure rather than agent count.

## 7. Full Experiment Re-run Notes

Full LLM experiments are intentionally separated from table reproduction because they require paid or rate-limited model endpoints. The relevant scripts are:

| Experiment | Script |
| --- | --- |
| Contract Gen full-diagnostic runs | `script/run_rq1_validity_experiments.py` |
| End-to-end full-feedback pipeline ablation | `script/run_rq3_end_to_end_full_feedback.py` |
| PureLLM baseline | `script/run_baseline_llm_only.py` |
| CodexPrompt-style baseline | `script/run_codex_prompt_style_baseline.py` |
| PathOCL-style baseline | `script/run_pathocl_style_baseline.py` |
| Baseline batch helper | `scripts/run_baseline_llm_batch.ps1` |

Before re-running, record the model provider, model identifier, temperature/top-p/seed if available, date, and API endpoint version. These details matter because LLM services can change over time.
Run `npm run export-operations-jsonl` and then `npm run preflight:experiments` before issuing model calls. The Contract Gen runner defaults to `--backend next`; its `direct` backend is a prompt-level diagnostic path and is not the treatment reported in the paper.
All experiment runners require `contractgen-operation-input-v2`, verify oracle isolation, and reject an existing result directory whose input, manifest prompt, method prompt, feedback, or graph configuration does not match the current run.
Current defaults use isolated subdirectories under `results/contractgen-study-v6/`. `--force` refuses to delete legacy or foreign records; choose a new output directory when the study marker or configuration differs.
Each new result row records both the frozen manifest hashes and the version/hash of the actual method-specific prompt sent to the model; comparisons with mismatched hashes are invalid.

Each manifest row also records an `oracle_id`, a `requirement_group_id`, and a
Boolean `has_return_value`. These fields link an operation-context instance to its
Jest oracle, identify repeated requirement text across different contexts, and make
void operations explicit. Main results use all 114 instances. The runner additionally
writes `rq1_syntax_validity_by_evaluation_unit.csv` and
`rq2_execution_success_by_evaluation_unit.csv`; their strict requirement-level rows
count a requirement as successful only when every context instance in the group
succeeds.

For a local implementation smoke test:

```powershell
yarn install --frozen-lockfile
yarn lint
yarn test
yarn dev
```

The web API route `src/app/api/generate-ocl/route.ts` streams one JSON object per line for each graph step. The generation entry point supports `graphMode = "feedback"` or `"linear"` and `feedbackMode = "full"`, `"generic"`, or `"none"`.

## 8. Expected Result Summary

The current manuscript is based on the following result families:

| Result family | Artifact source |
| --- | --- |
| Dataset summary | `data/operations.jsonl` |
| RQ1 validity | `results/contractgen-study-v6/contract_gen/full_feedback/` and `results/contractgen-study-v6/baselines/` |
| RQ2 execution success | Same result folders plus execution summaries and attempts logs. |
| External USE funnel | `results/contractgen-study-v6/validation/use_strong_114/summary.json` |
| RQ3 feedback specificity | `results/contractgen-study-v6/contract_gen/{no_feedback,generic_feedback,full_feedback}/` |
| RQ3 pipeline-structure ablation | `results/contractgen-study-v6/ablations/end_to_end_full_feedback/` and the full-feedback Contract Gen run |

## 9. Known Limitations

- The included results are single recorded LLM experiment runs. Re-running against hosted models may not produce byte-identical outputs.
- Some scripts are designed for the original Windows development environment. Paths may need small adjustments on macOS/Linux.
- The current external USE check validates semantic loading of generated definitions and preconditions, not full operation postcondition execution.
- The Git metadata in some copied workspace folders may be incomplete. Use the GitHub URL above as the canonical public source.

## 10. Artifact Evaluation Checklist

- [x] Benchmark inputs are included.
- [x] Raw and consolidated experimental outputs are included.
- [x] Scripts for recomputing analysis reports are included.
- [x] Current paper tables can be reconstructed from included result folders.
- [x] External USE sanity-check artifacts are included.
- [x] Manuscript source and figures are included.
- [ ] Full LLM re-run requires reviewer-provided API credentials.
- [ ] Full USE re-run requires a local USE installation.
