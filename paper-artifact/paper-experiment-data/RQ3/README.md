# RQ3: Reviewer Navigation

## Ordinary_LLM_and_SelfRefine
Entry: `scripts/run_rq3_repair_v2.ts`

Input: `data/repair_validation_natural_v1/generation/repair-inputs.jsonl`

Data: `paper-experiment-data/RQ3/unified-data-v1/records.json`

## ContractGen_68
Entry: `scripts/run_rq3_contractgen68.ts`

Input: `data/repair_validation_natural_v2/generation/repair-inputs.jsonl`

Data: `paper-experiment-data/RQ3/unified-data-v1/ContractGenRepair`

## ContractGen_Single_Seed
Entry: `scripts/run_rq3_repair_v3.ts`

Input: `data/repair_validation_natural_v2/generation/repair-inputs.jsonl`

Data: `paper-experiment-data/RQ3/unified-data-v1/ContractGenRepair`

Original paths preserve code references. EXPERIMENT_SAMPLE_INDEX.json links each generation operation and repair seed to its input and result. Runners require additional execution resources; these are not certified standalone commands.
