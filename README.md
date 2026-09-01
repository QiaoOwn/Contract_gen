# ContractGen Artifact

This repository contains the implementation and retained experiment records for
**"Contract Gen: Validation-Guided Generation of Executable OCL Operation Contracts"**.

Start here:

- `ARTIFACT_README.md` explains how to inspect, validate, and optionally rerun the artifact.
- `ARTIFACT_MANIFEST.md` maps files and result directories to the paper's RQs and tables.
- `data/operations.jsonl` contains the 114 benchmark operation instances; each row includes an
  `oracle_id` pointing to one of 107 execution-grounded Jest oracles under `test/`.
- `src/rm2pt/benchmarkRequirements.ts` contains the structured, oracle-isolated requirements.
- `results/contractgen-study-v6/` contains the retained study records. Earlier folders and smoke runs are not additional independent study samples.
- `src/app/service/generateOCL.ts` and `src/app/service/graph.ts` contain the main Contract Gen implementation.
- `src/rm2pt/project/` and `test/` contain the encoded benchmark systems and execution-grounded tests.

Read-only result check (Python 3.10+, standard library; no API key or running server):

```powershell
python scripts/verify_artifact_tables.py
python -m unittest scripts.test_verify_artifact_tables -v
```

Do not mix historical result folders with runs generated under a different
`input_hash` or shared `prompt_hash`. The current canonical versions are
`contractgen-operation-input-v3` and `contractgen-system-prompt-v7`.
Method-specific prompts and configuration differences must be reported separately.

The verifier reconstructs selected Parse@5/Pass@5 counts, generation counts,
offline early-stopping replay, the small paired-feedback pilot, and external-check
denominators. It does not verify all manuscript statistics or prove backend correctness.
Use `--json` for machine-readable output including all 114 replay selections.

ContractGen uses one generative LLM with staged deterministic checks. Parser,
translation, and TypeScript diagnostics can trigger repair; Jest is a terminal
hidden acceptance check, not a feedback source. The supported target is the
documented REMODEL/OCLTSVM generation subset, not arbitrary standard OCL.

The 570-to-122 call comparison uses fixed-five PureLLM sampling. Offline early
stopping reduces those PureLLM sequences to 139 calls; the remaining 17-call
difference is not an isolated causal effect of feedback. The paired pilot has only
five initial failures. USE compiles converted contracts but does not independently
execute their postconditions in the retained shared-state study.

Full LLM reruns require credentials. USE 7.5.0 and ANTLR remain bundled in `tools/`;
USE requires Java 21. LaTeX manuscript source is not currently included.

Do not archive `.env`, `node_modules/`, `.next/`, `.next-build/`, coverage folders, or generated `test/tmp/` files.
