# v4 Oracle semantic audit: CoCoME processSale operations

Source: `data/operation_revision/upstream_rm2pt/CoCoME/cocome.remodel`, lines 368-541.
Frozen v4 requirements for `makeNewSale` match the original RM2PT contract.
`enterItem` retains the approved laboratory quantity bound (`quantity <= stock`) from
`OWNER_ADJUDICATIONS.md` / development registration; original remodel requires only
`StockNumber > 0`. `endSale` follows approved decision `R03_endSale.json` (every sales
line contributes, including equal subtotals). `makeCashPayment` retains the approved
CurrentStore existence guard from `cocome_context_guards.json`; original remodel
omits that precondition while its postcondition uses `CurrentStore.Sales`. Original RM2PT
and older Oracle suites were not modified.

| Obligation | Requirement basis | Selected assertion evidence | Verification | Judgment |
| --- | --- | --- | --- | --- |
| makeNewSale/P1 | Frozen/RM2PT: current CashDesk exists and is open | Missing desk and closed desk rejected; repository stays empty | Source replay | Covered |
| makeNewSale/P2 | Frozen/RM2PT: no current Sale, or previous is complete | Incomplete current Sale rejected; repository and incomplete Sale fields locked | Source replay | Covered |
| makeNewSale/Q1 | Frozen/RM2PT: new incomplete, not-ready Sale linked to desk | Created Sale `IsComplete=false`, `IsReadytoPay=false`, `BelongedCashDesk` and desk `ContainedSales` | Source replay | Covered |
| makeNewSale/Q2 | Frozen/RM2PT: current Sale and repository membership | Exact one new Sale; previous/neighbor retained and field-locked; `CurrentSale` is the created object | Source replay | Covered |
| makeNewSale/Q3 | Frozen/RM2PT: `result = true` | Successful path returns true | Source replay | Covered |
| enterItem/P1 | Frozen/RM2PT: current Sale exists and is incomplete | Absent and complete Sale rejected; prior/foreign lines retained | Source replay | Covered |
| enterItem/P2 | Frozen/RM2PT: Item exists with positive stock | Missing barcode and zero stock rejected; no line created | Source replay | Covered |
| enterItem/P3 | Frozen + laboratory adjudication: `quantity <= stock` | Excess quantity expected to reject; equal-stock boundary accepted | Active-source mismatch (below); Oracle keeps approved bound | Covered |
| enterItem/Q1 | Frozen/RM2PT: new SalesLineItem with Sale/Item, quantity, subtotal | Selected Item, Quantity, `Subamount = Price * quantity`, Sale/Item links | Source replay success path | Covered |
| enterItem/Q2 | Frozen/RM2PT: stored and becomes current sale line | Exact one new line; prior/neighbor lines retained; `CurrentSaleLine` set | Source replay success path | Covered |
| enterItem/Q3 | Frozen/RM2PT: stock decreases by entered quantity from `@pre` | `stockBefore - quantity`; neighbor Item stock unchanged | Source replay success path | Covered |
| enterItem/Q4 | Frozen/RM2PT: `result = true` | Successful paths return true | Source replay success path | Covered |
| endSale/P1 | Frozen/RM2PT: current Sale incomplete and not ready | Missing, completed, and already-ready Sales rejected without mutating amount/ready | Source replay | Covered |
| endSale/Q1 | Frozen + R03: sum every line Subamount; equal values each contribute | Cases `[3,8]->11`, `[7,7]->14`, `[1.25,2.5]->3.75`; replaces prior Amount | Source replay | Covered |
| endSale/Q2 | Frozen + R03: empty lines yield zero | Empty ContainedSalesLine sets Amount to 0 | Source replay | Covered |
| endSale/Q3 | Frozen/RM2PT: Sale becomes ready for payment | `IsReadytoPay=true`; neighbor Sale remains not ready | Source replay | Covered |
| endSale/Q4 | Frozen/RM2PT: returns resulting Amount | Returned value equals post-state Amount | Source replay | Covered |
| makeCashPayment/P1 | Frozen/RM2PT: current Sale incomplete and ready | Missing, completed, and unready Sales rejected; no payment created | Source replay | Covered |
| makeCashPayment/P2 | Frozen/RM2PT: tender covers Sale amount | Insufficient tender rejected | Source replay | Covered |
| makeCashPayment/P3 | Frozen + approved clarification: current Store exists | Missing CurrentStore expected to reject with PreconditionError | Active-source mismatch (below); Oracle keeps approved guard | Covered |
| makeCashPayment/Q1 | Frozen/RM2PT: CashPayment tender, change, Sale link | Exact one new payment; AmountTendered/Balance; BelongedSale / AssoicatedPayment | Source replay success path | Covered |
| makeCashPayment/Q2 | Frozen/RM2PT: Sale linked to Store, timestamped, complete | Belongedstore, Store.Sales membership, Time window, IsComplete; neighbor Sale locked | Source replay success path | Covered |
| makeCashPayment/Q3 | Frozen/RM2PT: payment stored and `result = true` | Repository includes payment; successful path returns true | Source replay success path | Covered |

Real gaps closed in v4-only processSale suites:
- makeNewSale previously linked the new Sale but did not lock repository cardinality next to previous/neighbor Sales, nor lock fields on incomplete-Sale rejection.
- enterItem previously covered quantity=stock and basic links, but not prior-line / neighbor-Sale / neighbor-Item isolation with exact one-line growth.
- endSale already encoded R03 equal-subtotal aggregation; this round added neighbor-Sale isolation and separate completed vs already-ready reject locks.
- makeCashPayment previously recorded tender/change/store links, but not exact payment cardinality next to a prior payment or neighbor Sale isolation inside the same Store.

Active-source mismatch for `enterItem/P3`: original `cocome.remodel` precondition guards only `item.StockNumber > 0`. Against that source, `quantity = stock + 1` is admitted and the postcondition subtracts stock (possibly negative) rather than raising `PreconditionError`. The frozen v4 input already carries the laboratory-adjudicated bound. The Oracle retains that approved behavior; the active source is not treated as the answer.

Active-source mismatch for `makeCashPayment/P3`: original precondition omits CurrentStore existence. Against that source, a missing CurrentStore fails during postcondition use of `CurrentStore.Sales` (typically `TypeError`) rather than `PreconditionError`. The frozen v4 input already carries the approved clarification from `cocome_context_guards.json`. The Oracle retains that approved behavior.

Source replay:
`results/contractgen-rm2pt-v4/validation/cocome-processSale-source-replay-20261105.jsonl`
(`makeNewSale` 8/8, `endSale` 7/7, `enterItem` 3/4 with the known P3 mismatch,
`makeCashPayment` 2/3 with the known P3 mismatch).

`enterItem` failure: test `rejects quantity above available stock (laboratory rule)` —
expected `PreconditionError`, active source did not throw because remodel only requires
`StockNumber > 0`.

`makeCashPayment` failure: test
`rejects missing sale, completed sale, unready sale, insufficient tender and missing store`
— missing `CurrentStore` raised `TypeError: Cannot read properties of undefined (reading 'Sales')`
instead of `PreconditionError`, matching the original precondition gap.

Offline preflight remains 114/114. Fault-candidate controls:
`results/contractgen-rm2pt-v4/validation/cocome-processSale-fault-candidates-20261105.json`
(8/8 incorrect candidates detected).
Finite source replay is not exhaustive equivalence. `formal_experiment_ready` remains false.
