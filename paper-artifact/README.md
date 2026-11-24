# Contract Gen: Paper Experiment Artifact

Start with `EXPERIMENT_CATALOG.json` (experiment -> script -> input -> data), then `EXPERIMENT_SAMPLE_INDEX.json` (660 operation/seed records). The RQ folders have separate READMEs.

## Offline verification
From this directory: `python scripts/artifact/reproduce_tables.py`. This uses normalized records without network, LLM or a results directory. RQ1/RQ3 are recomputed; RQ2 is summary verification, not full fault-replay reproduction.

## Contents
RQ1: 114 Narrative inputs and four methods, with operation-level syntax, PreExec and behavioral results. RQ2: validation-stage, fault-replay, purity and USE summaries; external USE20 input and outcomes. RQ3: 68 seeds/52 operation contexts, original baseline input v1 and ContractGen input v2_20261121, per-seed outcomes and available candidates. Latest ContractGen: PreExec 67, method acceptance 58, accepted terminal success 56; one transport-blocked seed remains in the denominator. Baseline behavioral successes are 34 and 33. Historical execution environments are not asserted identical.

Source and runtime dependencies support inspection of the paper methods. The experiment scripts retain original paths; full reruns may require capture/snapshot resources excluded here, API configuration or USE. A successful offline summary is not a paid experiment reproduction. Generation does not receive terminal Oracle results.

No results trees, development logs, ZIPs, manuscript or API credentials are included. Original repository files outside this directory are not modified. Upstream licensing and dataset redistribution remain subject to their original terms; no new license or DOI is assigned.
