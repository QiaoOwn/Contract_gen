# Artifact README

This artifact accompanies the manuscript **"Contract Gen: Verification-Driven OCL Contract Generation"**. It provides the implementation, benchmark data, generated outputs, validation logs, and analysis scripts needed to inspect and reproduce the paper's reported results.

Repository URL: <https://github.com/QiaoOwn/Contract_gen>

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
| `data/operations.jsonl` | Benchmark input: 114 operations from five case studies. |
| `src/app/service/generateOCL.ts` | Main programmatic entry for Contract Gen. It selects the feedback graph, linear graph, and feedback mode. |
| `src/app/service/graph.ts` | LangGraph implementation of OCL generation, contract parsing, TypeScript generation, TypeScript checking, and Jest-based execution validation. |
| `src/app/service/graph-line.ts` | Linear/no-feedback variant used by ablation settings. |
| `src/app/service/create*Prompt.ts` | Prompt builders for grammar guidance, definitions, project context, transformation rules, and localized repair feedback. |
| `src/app/ContractToTypescript.ts` and `src/app/service/generateTypescriptCode.ts` | OCL-to-TypeScript translation support used by OCLTSVM. |
| `src/app/api/generate-ocl/route.ts` | HTTP API route for running the full generation/validation stream. |
| `src/rm2pt/project/` | Encoded benchmark projects, services, entities, and operations. |
| `test/` | Operation-level Jest tests used for execution-grounded validation. |
| `antlr4/` | REMODEL grammar and generated TypeScript parser files. |
| `results/rq_*_full_oracle_fixed/` | Full-diagnostic Contract Gen runs for the five evaluated models. |
| `results/baseline_llm_only/` | PureLLM baseline runs. |
| `results/codex_prompt_style/` | Reproduced CodexPrompt-style baseline results. |
| `results/pathocl_style/` | Reproduced PathOCL-style baseline results. |
| `results/rq3_ablation_no_feedback/` | No-feedback ablation logs. |
| `results/rq3_ablation_generic_feedback/` | Generic-feedback ablation logs. |
| `results/rq3_ablation_single_agent_full_feedback/` | Single-agent full-diagnostic ablation logs. |
| `results/ocltsvm_sanity_check_114_strong/` | External USE sanity-check artifacts and summary for OCLTSVM support evidence. |
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
python scripts/verify_artifact_tables.py
python scripts/build_rq_analysis_report.py
python scripts/build_rq3_generic_feedback_report.py --output-dir results/rq3_generic_feedback_report_check
python scripts/generate_use_strong_114.py --out-dir results/ocltsvm_sanity_check_114_strong_check
```

Expected outputs:

- `results/analysis_report/rq_analysis_report.md`
- `results/analysis_report/rq1_syntax_validity_summary.csv`
- `results/analysis_report/rq2_execution_success_summary.csv`
- Console output from `scripts/verify_artifact_tables.py` summarizing RQ1/RQ2/RQ3 directly from `results/`.
- `results/rq3_generic_feedback_report_check/rq3_generic_feedback_by_model.csv`
- `results/ocltsvm_sanity_check_114_strong_check/manifest.csv`
- `results/ocltsvm_sanity_check_114_strong_check/summary.json`

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

- `results/rq_*_full_oracle_fixed/`
- `results/baseline_llm_only/`
- `results/codex_prompt_style/`
- `results/pathocl_style/`
- `results/*/summary.json`
- `results/*/rq1_syntax_validity_by_model.csv`
- `results/*/rq2_execution_success_by_model.csv`

Analysis command:

```powershell
python scripts/build_rq_analysis_report.py
```

The key paper-level comparison is the syntax-validity rate across reproduced baseline-style prompts, PureLLM, and Contract Gen.

### RQ2: Beyond-syntax reliability

Evidence:

- `results/rq_*_full_oracle_fixed/`
- `results/baseline_llm_only/`
- `results/codex_prompt_style/`
- `results/pathocl_style/`
- `results/ocltsvm_sanity_check_114_strong/summary.json`
- `results/*/summary.json`
- `results/*/rq2_execution_success_by_model.csv`

The USE sanity check is an external agreement check for generated definition and precondition clauses. It does not claim full post-state equivalence because USE invariants do not directly model operation postconditions involving `oclIsNew`, `@pre`, mutation, and result values.

To regenerate the USE artifacts without running USE:

```powershell
python scripts/generate_use_strong_114.py --out-dir results/ocltsvm_sanity_check_114_strong_check
```

To also run USE, provide a USE executable:

```powershell
python scripts/generate_use_strong_114.py --run-use --use-bat tools/use-7.5.0/bin/use.bat --out-dir results/ocltsvm_sanity_check_114_strong_check
```

Expected paper result from the included run:

- Generated contracts from selected setting: 100.00%.
- USE-encodable precondition: 99.12%.
- USE semantic load: 96.49%.

### RQ3: Mechanism and efficiency

Evidence:

- `results/rq3_ablation_no_feedback/`
- `results/rq3_ablation_generic_feedback/`
- `results/rq3_ablation_single_agent_full_feedback/`
- `results/rq_*_full_oracle_fixed/`
- `results/*/attempts.jsonl`

Paper-level interpretation:

- Generic failure notices improve over no feedback.
- Full localized diagnostics improve further.
- The staged Contract Gen architecture reaches useful results with far fewer attempts than the single-agent full-diagnostic setting, even though the single-agent setting has a slightly higher final Pass@5 in the current gpt-5.4 run.

## 7. Full Experiment Re-run Notes

Full LLM experiments are intentionally separated from table reproduction because they require paid or rate-limited model endpoints. The relevant scripts are:

| Experiment | Script |
| --- | --- |
| Contract Gen full-diagnostic runs | `script/run_rq1_validity_experiments.py` |
| PureLLM baseline | `script/run_baseline_llm_only.py` |
| CodexPrompt-style baseline | `script/run_codex_prompt_style_baseline.py` |
| PathOCL-style baseline | `script/run_pathocl_style_baseline.py` |
| Baseline batch helper | `scripts/run_baseline_llm_batch.ps1` |

Before re-running, record the model provider, model identifier, temperature/top-p/seed if available, date, and API endpoint version. These details matter because LLM services can change over time.

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
| RQ1 validity | `results/rq_*_full_oracle_fixed/`, `results/baseline_llm_only/`, `results/codex_prompt_style/`, `results/pathocl_style/` |
| RQ2 execution success | Same result folders plus execution summaries and attempts logs. |
| External USE funnel | `results/ocltsvm_sanity_check_114_strong/summary.json` |
| RQ3 feedback specificity | `results/rq3_ablation_no_feedback/`, `results/rq3_ablation_generic_feedback/`, `results/rq_*_full_oracle_fixed/` |
| RQ3 architecture ablation | `results/rq3_ablation_single_agent_full_feedback/`, `results/rq_gpt_5_4_full_oracle_fixed/` |

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
