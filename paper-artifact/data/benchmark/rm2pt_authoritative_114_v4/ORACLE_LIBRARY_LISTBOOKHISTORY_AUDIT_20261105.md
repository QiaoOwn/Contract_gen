# v4 Oracle semantic audit: LibraryManagementSystem listBookHistory operations

Source: `data/operation_revision/upstream_rm2pt/LibraryManagementSystem/library.remodel`,
lines 852–993. Frozen v4 requirements for all five operations match the original
RM2PT contracts. `listOverDueBook` and `listReservationBook` retain approved
identity-Set clarifications from `R06_listOverDueBook.json` and
`R07_listReservationBook.json` (dedupe by object identity after collect
projection; closed reservations remain eligible). `listRecommendBook` history
view shares original OP19 with the standalone use-case view (`R08`); this round
audits only the `listBookHistory` binding. Original RM2PT and older Oracle
suites were not modified except by selecting a v4-only history recommendation
suite that adds association-only reachability.

| Obligation | Requirement basis | Selected assertion evidence | Verification | Judgment |
| --- | --- | --- | --- | --- |
| listBorrowHistory/P1 | Frozen/RM2PT: referenced User exists | Absent user rejected via `expectPreconditionRejected`; empty UserID accepted when the User exists | Source replay | Covered |
| listBorrowHistory/Q1 | Frozen/RM2PT: return all linked Loans | `expectSameMembers` on full association including returned and unreturned; empty history; equal-attribute distinct identities; association-only Loans without repository membership; no overdue-fee filter; foreign user excluded | Source replay | Covered |
| listHodingBook/P1 | Frozen/RM2PT: referenced User exists | Missing user rejected; empty UserID accepted | Source replay | Covered |
| listHodingBook/Q1 | Frozen/RM2PT: unreturned Loans only | `expectSameMembers` selects `IsReturned=false` only; empty when all returned; equal-attribute distinct identities; association-only; zero/negative fees included when unreturned; foreign user excluded | Source replay | Covered |
| listOverDueBook/P1 | Frozen/RM2PT + R06: referenced User exists | Missing user rejected; empty UserID accepted | Source replay | Covered |
| listOverDueBook/P2 | Frozen/RM2PT + R06: overdue active-loan collection resolvable | Unresolved `LoanedBook` rejected; empty resolved history accepted | Source replay | Covered |
| listOverDueBook/Q1 | Frozen + R06: distinct BookCopy of unreturned Loans with fee > 0 | Filters returned / zero / negative fee; excludes other user; association-only copy; empty history yields empty Set | Source replay | Covered |
| listOverDueBook/Q2 | Frozen + R06: identity dedupe; equal attrs stay distinct | Shared copy counted once across two qualifying Loans; two equal-attribute copies both retained | Active-source mismatch (below); Oracle keeps R06 Set | Covered |
| listReservationBook/P1 | Frozen/RM2PT + R07: referenced User exists | Unknown user rejected; empty UserID accepted | Source replay | Covered |
| listReservationBook/P2 | Frozen/RM2PT + R07: reservation collection resolvable | Unresolved `ReservedBook` rejected; empty resolved collection accepted | Source replay | Covered |
| listReservationBook/Q1 | Frozen + R07: BookCopy from all reservations including closed | Closed-only reservation included; foreign user excluded; association-only copy | Source replay success path | Covered |
| listReservationBook/Q2 | Frozen + R07: identity dedupe; equal attrs stay distinct | Shared copy across open+closed counted once; two equal-attribute copies retained | Active-source mismatch (below); Oracle keeps R07 Set | Covered |
| listRecommendBook/P1 | Frozen/RM2PT: referenced User exists | Unknown user rejected; empty UserID accepted in identity cases | Source replay | Covered |
| listRecommendBook/P2 | Frozen/RM2PT: recommendation collection resolvable | Unresolved `RecommendedBook` rejected; empty resolved collection accepted | Source replay | Covered |
| listRecommendBook/Q1 | Frozen/RM2PT: all linked RecommendBook identities | All and only selected-user recommendations; equal-attribute distinct identities; association-only without repository membership (v4); foreign recommendations excluded | Source replay | Covered |

Real gap closed in the v4-only history recommendation suite:
- Historical `recommendationHistory.oracle.ts` already compared object identities
  and rejected missing/unresolved users, but every positive fixture also stored
  RecommendBook instances in the repository. A contract that gated membership on
  `RecommendBook.allInstances()` would have passed. The v4 suite adds an
  association-only case matching the sibling listBorrowHistory / listHodingBook /
  listOverDueBook / listReservationBook pattern. No repository-membership
  precondition was invented; the source returns `user.RecommendedBook` directly.

`expectSameMembers` and local `check` helpers are real assertions. Heuristic
flags that claim missing return assertions for those helpers are false positives.

Active-source mismatch for `listOverDueBook/Q2`: original remodel postcondition is
`result = loans->collect(l:Loan | l.LoanedCopy)` while the declared return type and
frozen/R06 requirement are identity `Set(BookCopy)`. Against the active collect
encoding, two qualifying Loans that share one BookCopy yield a length-2 bag, so
the Oracle test `counts a shared copy once despite distinct qualifying loan records`
fails. The Oracle retains the approved R06 identity-Set clarification.

Active-source mismatch for `listReservationBook/Q2`: original remodel postcondition
is `result = res->collect(r:Reserve | r.ReservedCopy)` under declared
`Set(BookCopy)`. Against the active collect encoding, open+closed reserves of the
same copy yield length 2, so
`returns one identity shared by different open and closed records` fails. The
Oracle retains the approved R07 identity-Set clarification.

Source replay:
`results/contractgen-rm2pt-v4/validation/library-listBookHistory-source-replay-20261105.jsonl`
(`listBorrowHistory` 9/9, `listHodingBook` 9/9, `listRecommendBook` 7/7,
`listOverDueBook` 7/8 with the known R06 Set mismatch,
`listReservationBook` 7/8 with the known R07 Set mismatch).

Offline preflight remains 114/114. Fault-candidate controls:
`results/contractgen-rm2pt-v4/validation/library-listBookHistory-fault-candidates-20261105.json`
(9/9 incorrect candidates detected; 1/1 sanity pass).

Finite source replay is not exhaustive equivalence. `formal_experiment_ready` remains false.
