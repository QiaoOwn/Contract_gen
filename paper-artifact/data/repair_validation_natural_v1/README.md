# Natural OCL Contract Repair Validation Dataset v1

68 naturally generated erroneous contracts across 52 operations from the existing 114-operation Narrative V3 corpus. This is a derived repair benchmark, not new independent projects or requirements. No artificial mutations were added.

## Files

- generation/repair-inputs.jsonl: one repair seed per line, original requirement, signature, complete UML reference, D/P/Q and public validator diagnostics.
- generation/models/: exact frozen typed UML snapshots. Model paths in JSONL resolve relative to generation/.
- evaluation/: replay evidence, backend identity and terminal evaluation protocol. Do not send this directory or hidden Oracle to the model.
- manifest.json: content hashes and original evidence hashes.

## Use

Compare repair methods on the same seed with at most four additional calls (five including original generation). Evaluate output protocol, OCL syntax, PreExec, permission compliance and terminal behavior separately. Hidden test results never enter repair feedback. A PreExec failure is not itself a proven business-semantic error.

Retain the five Full-origin seeds as the primary cohort. Report other origins separately; some pairs have multiple origins. Candidate-level results are correlated within operation/project. Do not claim independent holdout validation after developing on these operations. Split by operation or project if using development/test partitions.

No repaired gold contract is provided. The frozen terminal Oracle is referenced only in evaluation/protocol.json, remains outside generation inputs and retains its existing release status. This packaging does not grant formal experiment readiness or establish a repair success rate.
