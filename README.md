# Contract Gen Artifact

This repository contains the artifact for the manuscript **"Contract Gen: Verification-Driven OCL Contract Generation"**.

Start here:

- `ARTIFACT_README.md` explains how to inspect, validate, and optionally rerun the artifact.
- `ARTIFACT_MANIFEST.md` maps files and result directories to the paper's RQs and tables.
- `data/operations.jsonl` contains the 114 benchmark operations.
- `results/` contains the raw and summarized experiment outputs from which the manuscript tables are regenerated.
- `src/app/service/generateOCL.ts` and `src/app/service/graph.ts` contain the main Contract Gen implementation.
- `src/rm2pt/project/` and `test/` contain the encoded benchmark systems and execution-grounded tests.

Quick check:

```powershell
python scripts/verify_artifact_tables.py
```

The full LLM rerun path requires model API credentials. The included precomputed results are sufficient to inspect and recompute the paper-level tables without reissuing LLM calls.

If this repository is packaged together with the LaTeX paper source, the manuscript files are kept separately as `main.tex`, `sections/`, `figures/`, and `refs.bib`.

Do not archive `.env`, `node_modules/`, `.next/`, `.next-build/`, coverage folders, or generated `test/tmp/` files.
