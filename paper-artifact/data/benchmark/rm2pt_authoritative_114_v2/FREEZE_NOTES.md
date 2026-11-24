# RM2PT-authoritative 114, second project freeze

The original RM2PT files and the previous frozen 114-row input remain unchanged.
This 114-row snapshot was generated from the same laboratory parent input with the
current prompt configuration. The schema version in `manifest.json` identifies the
preparation tool, while this directory name identifies the frozen dataset revision.

On 2026-11-02, the project owner approved these three requirement clarifications for
the next freeze (not as claims about an unchanged original RM2PT contract):

| Operation | Clarification | Evidence and status |
| --- | --- | --- |
| `CoCoME_orderProducts_orderItem` | Require a current OrderProduct before linking a new OrderEntry. | RM2PT effect references CurrentOrderProduct at `cocome.remodel:707`; explicit project-owner approval. Original precondition at line 687 lacks this guard. |
| `CoCoME_processSale_enterItem` | State that the new SalesLineItem is stored and becomes CurrentSaleLine. | RM2PT postcondition at `cocome.remodel:450` and line 457; explicit project-owner approval. |
| `CoCoME_processSale_makeCashPayment` | Require a current Store before updating its Sales collection. | RM2PT effect at `cocome.remodel:533-534`; explicit project-owner approval. Original precondition at lines 506-510 lacks this guard. |

Only those three `description` fields changed relative to
`data/benchmark/rm2pt_authoritative_114/operations.jsonl`. Their dependent
requirement/input/task hashes changed as expected. The prompt hash changed for all
rows because this snapshot uses the current prompt configuration; no experiment
results are transferred between the two snapshots.

The Oracle files in the first freeze are candidate evaluation artifacts. Neither
this note nor historical Jest replay certifies full source fidelity, independent
expert agreement, or readiness for formal experiments.
