# RQ2: Reviewer Navigation

## Validation_Cohort
Entry: `scripts/prepare_rq2_validation_cohort.ts`

Input: `data/narrative_v3_114/generation/requirements.jsonl`

Data: `paper-experiment-data/RQ2/ValidationStages`

## Boundary_Capture
Entry: `scripts/run_rq2_validation_capture.ts`

Input: `data/narrative_v3_114/generation/requirements.jsonl`

Data: `paper-experiment-data/RQ2/ValidationStages`

## Fault_Replay
Entry: `scripts/run_rq2_validation_mutations.ts`

Input: `Captured boundaries or external input specified by the entry; see EXPERIMENT_CATALOG.json`

Data: `paper-experiment-data/RQ2/EffectCheckFaultReplay`

## Checker_Purity
Entry: `scripts/run_rq2_purity.ts`

Input: `Captured boundaries or external input specified by the entry; see EXPERIMENT_CATALOG.json`

Data: `paper-experiment-data/RQ2/CheckerPurity`

## Extended_Validation
Entry: `scripts/run_rq2_extended_validation.ts`

Input: `Captured boundaries or external input specified by the entry; see EXPERIMENT_CATALOG.json`

Data: `paper-experiment-data/RQ2/statistics.json`

## Summary
Entry: `scripts/summarize_rq2_validation.ts`

Input: `Captured boundaries or external input specified by the entry; see EXPERIMENT_CATALOG.json`

Data: `paper-experiment-data/RQ2/statistics.json`

## USE_Semantic_Agreement
Entry: `scripts/run_use_ocltsvm_semantic_agreement.py`

Input: `Captured boundaries or external input specified by the entry; see EXPERIMENT_CATALOG.json`

Data: `paper-experiment-data/RQ2/USE-semantic`

## External_USE20
Entry: `scripts/run_use_external_current.ts`

Input: `Captured boundaries or external input specified by the entry; see EXPERIMENT_CATALOG.json`

Data: `paper-experiment-data/RQ2`

Original paths preserve code references. EXPERIMENT_SAMPLE_INDEX.json links each generation operation and repair seed to its input and result. Runners require additional execution resources; these are not certified standalone commands.
