# Artifact README

This repository accompanies **Contract Gen: Validation-Guided Generation of Executable OCL Operation Contracts**.
Repository: <https://github.com/QiaoOwn/Contract_gen>.

## 1. Frozen Evidence and Scope

The retained study is `results/contractgen-study-v6/`. Its canonical input versions
are `contractgen-operation-input-v3` and `contractgen-system-prompt-v7`, with
`llm-generation-config-v5`, `ocl-generation-grammar-v2`, and `ocl-generation-rules-v4`.
Study version and input/prompt version are different identifiers.

The benchmark has 114 operation-context instances, 107 distinct service-operation
oracles, and 106 requirement groups. Inputs are structured requirements containing
intent, preconditions, and postconditions, together with operation signatures and
model context. This is not unrestricted prose-to-contract generation. Reference OCL
and Jest outcomes are not generator inputs.

ContractGen uses one generative LLM and deterministic assembly, parsing,
translation, and TypeScript checking. Eligible pre-execution diagnostics can
trigger regeneration. On reaching Jest, the graph terminates whether Jest passes
or fails. Generation stops at the pre-execution boundary or budget exhaustion,
not after repeatedly using hidden Jest results to find a passing candidate.

The target language is the documented executable REMODEL/OCLTSVM subset.
Parser acceptance, compilation, scenario success, and general semantic correctness
are distinct claims. The artifact does not establish full standard-OCL support.

## 2. Read-Only Inspection

Requirements: Python 3.10+ and its standard library. No model API, Java, Node,
server, pandas, or plotting packages are needed for these commands:

```powershell
python scripts/verify_artifact_tables.py
python -m unittest scripts.test_verify_artifact_tables -v
```

For machine-readable output, including the selected attempt for every offline
replay operation:

```powershell
python scripts/verify_artifact_tables.py --json
```

The verifier reads, but never rewrites, inputs or results. It checks operation
coverage, duplicate attempts, recorded input/prompt provenance, generation budgets,
paired initial-candidate hashes, and selected stored summaries. It recomputes
Parse@5/Pass@5 counts, recorded generation counts, the paired pilot, USE compile
status counts, and decidable shared-state agreement denominators.

This is not a replay of backend execution or a proof that recorded validator
decisions are correct. It does not yet reconstruct every manuscript statistic,
figure, significance test, or confidence interval. Historical report builders
under `scripts/` have not all been re-audited for the current paths and protocols;
do not treat their defaults as the canonical reproduction route.

Do not export inputs or regenerate USE files merely to inspect frozen evidence:
those commands write files. New runs and revised semantics need separate output
directories and versioned configurations, never silent replacement of v6 records.

## 3. Main Recorded Counts

All rows below use 114 operation-context instances. Parse@5 and Pass@5 are observed
attainment counts within up to five generations, not unbiased sampling estimators.
Calls count model generations, including internal repair generations, not graph
nodes or the number of stream records.

| Setting | Model | Parse@5 | Pass@5 | Calls |
| --- | --- | ---: | ---: | ---: |
| ContractGen full feedback | gpt-5.5 | 114 | 104 | 122 |
| ContractGen full feedback | gpt-5.4 | 111 | 102 | 134 |
| ContractGen full feedback | gemini-3.5-flash | 114 | 101 | 128 |
| ContractGen full feedback | claude-opus-4-7 | 114 | 102 | 122 |
| PureLLM fixed-five | gpt-5.5 | 111 | 103 | 570 |
| CodexPrompt contract transfer | gpt-5.5 | 75 | 34 | 570 |
| PathOCL contract transfer | gpt-5.5 | 70 | 17 | 570 |

PureLLM shares the generation guidance with ContractGen. The two prompting
transfers use text output and omit the shared generation grammar/rules; PathOCL
also varies ranked path context. Their shared manifest hash does not imply
identical actual prompts. They are adaptations to the operation-contract task,
not exact reruns of the original papers or controlled tests of feedback alone.
Three CodexPrompt attempts record parser failures with subsequent execution
skipped; these remain unsuccessful attempts, not missing successes or removals.

### Stopping Versus Feedback

The full-feedback primary run uses 122 calls versus 570 fixed-five PureLLM calls.
Offline replay takes each stored PureLLM sequence in attempt order and stops at
the first pre-execution-valid candidate, irrespective of its Jest outcome, or at
attempt five. It requires 139 counterfactual calls and retains 111 Parse@5 and
103 Pass@5 on these particular sequences.

Thus 431 of the 448 calls in the fixed-five-to-ContractGen difference are avoidable
under this replay. The remaining 17-call difference compares different generation
trajectories and is not a causal estimate of diagnostic feedback. Call counts are
not token expenditure, monetary cost, or measured online latency. Equal replay
success on these records is not a guarantee for other runs.

### Paired Feedback Pilot

Source: `results/contractgen-study-v6/rq3_paired/gpt-5.5/`.
All treatments reuse the same 114 initial candidates. Only five fail pre-execution
validation and enter repair branches.

| Treatment | Recovered initial failures | Final Pass | Total calls |
| --- | ---: | ---: | ---: |
| No feedback | 2/5 | 102/114 | 129 |
| Generic feedback | 1/5 | 101/114 | 131 |
| Full diagnostics | 5/5 | 104/114 | 124 |

This is a small mechanism pilot, not general evidence that every feedback type
improves success. Generic does not outperform no feedback here. The paired
full-feedback count of 124 must not be substituted for the primary run's 122.
Unpaired generic/no-feedback runs are separate trajectories and must not be pooled
with these branches as additional independent paired samples. The retained v6
directories do not contain the previously documented end-to-end architecture run.

## 4. External and Internal Checks

External compile source:
`results/contractgen-study-v6/validation/use-external-gpt-5.5-v2/`.

| USE compilation stage | Successful / planned |
| --- | ---: |
| Class model | 114/114 |
| Definitions and precondition | 108/114 |
| Definitions and postcondition | 106/114 |
| Complete converted operation contract | 105/114 |

Conversion adaptations are recorded in `manifest.json`. These are syntax/type
compilation results for converted artifacts, not successful execution of 105
operations or proof of equivalence to the original contracts.

Shared-state source:
`results/contractgen-study-v6/validation/use_ocltsvm_semantic_agreement/final_30ops/`.

| Comparison | Planned | Decidable/recorded pairs | Agreements |
| --- | ---: | ---: | ---: |
| USE vs OCLTSVM, preconditions | 60 | 55 | 54 |
| USE vs OCLTSVM, postconditions | 30 | 0 | Not evaluated independently |
| OCLTSVM vs Jest, preconditions | 60 | 57 | 57 |
| OCLTSVM vs Jest, postconditions | 30 | 30 | 28 |

Unsupported, error, and missing decisions are not agreements. The 85/87 internal
OCLTSVM-Jest agreement may share implementation assumptions and is not an
independent postcondition validation. Pilot directories and earlier USE conversion
versions are diagnostic history, not additional independent samples.

## 5. Optional Regeneration

Use Node.js, the repository's `package.json`/`yarn.lock`, Python, and compatible
model credentials. Install application dependencies with
`yarn install --frozen-lockfile`. `env.template` documents `OPENAI_API_KEY` and
`OPENAI_BASE_URL`; never publish a populated `.env`.

`tools/` retains USE 7.5.0 and the ANTLR JAR. USE requires Java 21. Preserve these
bundled tools and their distribution notices in the reproducibility archive.

The relevant runner help is available without making model requests:

```powershell
python script/run_rq1_validity_experiments.py --help
python script/run_baseline_llm_only.py --help
python script/run_paired_feedback_ablation.py --help
python scripts/generate_use_strong_114.py --help
python scripts/run_use_ocltsvm_semantic_agreement.py --help
```

For generation, start the application with `yarn dev`, then use the documented
runner options and a fresh output directory. ContractGen's reported path uses
`--backend next`; `direct` is not that treatment. Do not run `--force` against the
retained study to reproduce a table. Before starting a new study, validate inputs
with `npm run validate-inputs`, record configurations and the repository revision,
and explicitly inspect any export/preflight output changes.

Record model/provider, request parameters, actual input/output tokens when
available, request and validation latency, failures, retries, and configuration
hashes. Hosted model reruns are not guaranteed to match archived responses.
Missing historical token counts cannot be replaced by call counts or current
provider prices.

## 6. Manuscript and Release Status

LaTeX manuscript source is not currently included in this repository. The read-only
result checks do not require it. `docs/TOSEM_REVISION_PLAN.md` contains revision
instructions and proposed replacement passages, not a modified manuscript PDF.

`CITATION.cff.example` and `.zenodo.json.example` remain templates, not completed
release metadata. Confirm author order, title, version, licensing, and the actual
Zenodo record before creating the final citation metadata and frozen release.
GitHub-Zenodo linkage alone does not establish that a final DOI has been published.

Exclude `.env`, dependencies, build caches, coverage, and `test/tmp/` from archival
packages; consult `.artifactignore`. Keep benchmark inputs, raw results, tests,
source, generation guidance, bundled tools, and analysis scripts. See
`ARTIFACT_MANIFEST.md` for the current source map.
