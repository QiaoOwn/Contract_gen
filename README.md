# Contract Gen Artifact

This repository contains the artifact for the manuscript **"Contract Gen: Verification-Driven OCL Contract Generation"**.

Start here:

- `ARTIFACT_README.md` explains how to inspect, validate, and optionally rerun the artifact.
- `ARTIFACT_MANIFEST.md` maps files and result directories to the paper's RQs and tables.
- `data/operations.jsonl` contains the 114 benchmark operation instances; each row includes an
  `oracle_id` pointing to one of 107 execution-grounded Jest oracles under `test/`.
- `src/rm2pt/benchmarkRequirements.ts` contains the structured, oracle-isolated requirements.
- `results/` contains the raw and summarized experiment outputs from which the manuscript tables are regenerated.
- `src/app/service/generateOCL.ts` and `src/app/service/graph.ts` contain the main Contract Gen implementation.
- `src/rm2pt/project/` and `test/` contain the encoded benchmark systems and execution-grounded tests.

Quick check:

```powershell
npm run validate-inputs
npm run export-operations-jsonl
python scripts/verify_artifact_tables.py
```

Do not mix historical result folders with runs generated under a different
`input_hash` or `prompt_hash`. The current canonical versions are
`contractgen-operation-input-v2` and `contractgen-system-prompt-v5`.

The full LLM rerun path requires model API credentials. Current paper-level tables must be regenerated from records carrying the `contractgen-study-v6` marker; historical records are intentionally excluded.

If this repository is packaged together with the LaTeX paper source, the manuscript files are kept separately as `main.tex`, `sections/`, `figures/`, and `refs.bib`.

Do not archive `.env`, `node_modules/`, `.next/`, `.next-build/`, coverage folders, or generated `test/tmp/` files.
