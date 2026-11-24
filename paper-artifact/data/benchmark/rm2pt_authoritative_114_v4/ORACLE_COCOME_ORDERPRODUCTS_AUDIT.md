# v4 Oracle semantic audit: CoCoME orderProducts core operations

Source: `data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel`, lines 609-740.
Frozen v4 requirements are unchanged for `chooseSupplier`, `listAllOutOfStoreProducts`,
and `makeNewOrder`. `orderItem` retains the approved v2 clarification that a current
`OrderProduct` must exist (original remodel precondition names only the Item). Original
RM2PT and older Oracle suites were not modified. `placeOrder` was already reviewed in
`ORACLE_COCOME_ORDER_AUDIT.md`; this round only checked that its OrderProduct/
OrderEntry fixtures do not conflict with the four audited suites (no shared mutable
setup; SubAmount spelling remains consistent). Its audit count is unchanged.

| Obligation | Requirement basis | Selected assertion evidence | Verification | Judgment |
| --- | --- | --- | --- | --- |
| chooseSupplier/P1 | Frozen/RM2PT: Supplier exists | Missing ID rejected among other suppliers and on empty repository; order Supplier unchanged on reject | Source replay; neighbor-overwrite candidate fails isolation | Covered |
| chooseSupplier/P2 | Frozen/RM2PT: CurrentOrderProduct exists | Absent current order rejected with an existing Supplier | Source replay | Covered |
| chooseSupplier/Q1 | Frozen/RM2PT: `CurrentOrderProduct.Supplier = sup` | Current order links selected Supplier identity; neighbor order keeps its Supplier | Source replay | Covered |
| chooseSupplier/Q2 | Frozen/RM2PT: `result = true` | Successful path returns true | Source replay | Covered |
| listAllOutOfStoreProducts/P1 | Frozen/RM2PT: `true` | No business reject path; empty and nonempty repositories exercise the always-true precondition | Source replay | Covered |
| listAllOutOfStoreProducts/Q1 | Frozen/RM2PT: items with `StockNumber = 0` | `expectSameMembers` returns exactly the zero-stock object identities, including empty, negatives, positives, and repeated zeros | Source replay (retained historical suite) | Covered |
| makeNewOrder/P1 | Frozen/RM2PT: unused order id | Duplicate ID rejected; existing object/status/amount locked | Source replay; duplicate-replace candidate fails | Covered |
| makeNewOrder/Q1 | Frozen/RM2PT: new OrderProduct, NEW, Time = Now | Exactly one new OrderProduct with NEW status and time inside the call window | Source replay; over-insert candidate fails cardinality | Covered |
| makeNewOrder/Q2 | Frozen/RM2PT: CurrentOrderProduct and repository include | CurrentOrderProduct is the created object; previous/neighbor remain | Source replay | Covered |
| makeNewOrder/Q3 | Frozen/RM2PT: `result = true` | Successful create returns true | Source replay | Covered |
| orderItem/P1 | Frozen/RM2PT: Item by barcode exists | Missing barcode rejected with no OrderEntry created | Source replay | Covered |
| orderItem/P2 | Frozen + approved v2 clarification: current OrderProduct exists | Absent current order expected to reject with PreconditionError and no OrderEntry | Active-source mismatch (below); Oracle keeps approved clarification | Covered |
| orderItem/Q1 | Frozen: new OrderEntry with Item, quantity, order-price subtotal (`SubAmount`) | Selected barcode Item, Quantity, and `SubAmount = OrderPrice * quantity` | Source replay success path; multi-insert candidate fails | Covered |
| orderItem/Q2 | Frozen/RM2PT: stored and linked via ContainedEntries | Exactly one new OrderEntry; prior entry retained; neighbor order entries unchanged | Source replay success path | Covered |
| orderItem/Q3 | Frozen/RM2PT: `result = true` | Successful path returns true | Source replay success path | Covered |

Real gaps closed in v4-only chooseSupplier / makeNewOrder / orderItem suites:
- chooseSupplier previously linked the selected Supplier but did not lock a neighbor order's Supplier association.
- makeNewOrder previously checked NEW/time/CurrentOrderProduct but not exact repository cardinality next to neighbors, nor locked fields on duplicate-ID rejection.
- orderItem previously covered SubAmount and missing Item/order rejects, but not exact one-entry growth with prior/neighbor retention.

`listAllOutOfStoreProducts` retained the existing selected suite; its zero-only identity membership already matches the frozen postcondition.

Active-source mismatch for `orderItem/P2`: original `cocome.remodel` precondition guards only Item existence. Against that source, a missing `CurrentOrderProduct` raises `TypeError` on `ContainedEntries` during postcondition rather than `PreconditionError`. The frozen v4 input already carries `approved-v2-clarification` / owner decision `cocome_context_guards.json` requiring the current-order guard. The Oracle retains that approved behavior; the active source is not treated as the answer (same stance as receiveOrderedProduct/R04).

Source replay:
`results/contractgen-rm2pt-v4/validation/cocome-orderProducts-source-replay-20261104.jsonl`
(`chooseSupplier` 4/4, `makeNewOrder` 2/2, `orderItem` 2/3 with the known P2 mismatch)
and
`results/contractgen-rm2pt-v4/validation/cocome-listAllOutOfStoreProducts-source-replay-20261104.jsonl`
(`listAllOutOfStoreProducts` 7/7).
Offline preflight remains 114/114. Fault-candidate controls:
`results/contractgen-rm2pt-v4/validation/cocome-orderProducts-fault-candidates-20261104.json`.
Finite source replay is not exhaustive equivalence. `formal_experiment_ready` remains false.
