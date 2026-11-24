# v4 Oracle semantic audit: CoCoME order operations

The following judgments compare the frozen v4 obligations with the selected
Jest assertions. The v4-only tests add unassociated order entries so the
asserted sum cannot accidentally include entries outside the target order.

| Obligation | Assertion evidence | Judgment |
| --- | --- | --- |
| placeOrder/P1 | Missing current order rejects with PreconditionError | Covered |
| placeOrder/Q1 | Every successful scenario checks REQUESTED status | Covered |
| placeOrder/Q2 | Nonzero initial amounts, distinct equal subtotals, decimals and an unassociated repository entry check the associated-entry sum | Covered |
| placeOrder/Q3 | Empty associated collection preserves initial amount even with an unrelated repository entry | Covered |
| placeOrder/Q4 | Every successful scenario returns true | Covered |
| receiveOrderedProduct/P1 | Unknown order ID rejects with PreconditionError | Covered |
| receiveOrderedProduct/Q1 | Every successful scenario checks RECEIVED status | Covered |
| receiveOrderedProduct/Q2 | Each Item's expected stock is based on its previous stock and entries in the target order, with a neighbor order's entry excluded | Covered |
| receiveOrderedProduct/Q3 | Separate scenarios include repeated Item identity with distinct and equal quantities | Covered; active-source mismatch |
| receiveOrderedProduct/Q4 | Every successful scenario returns true | Covered |

Active-source replay: placeOrder passed 5/5. receiveOrderedProduct passed 3/6;
all three failures are the previously identified R04 repeated-entry behavior
of the source contract. The v4 requirement and Oracle retain the approved
per-Item cumulative semantics; the source implementation is not silently
treated as the answer. These finite tests are not mutation-adequacy proof.
