# USE Semantic-Load Sanity Check for 114 Operations

## Scope

- Source operations: `data/operations.jsonl`
- Generated contracts: `results/rq_gpt_5_4_full_oracle_fixed/attempts.jsonl`
- USE run mode: semantic-load/typecheck only
- Checked clauses: generated `definition` and `precondition`
- Postconditions are retained as comments because USE invariants do not directly model operation post-state semantics.

## Summary

| Metric | Count |
| --- | ---: |
| Total operations | 114 |
| With generated contract | 114 |
| With precondition expression | 113 |
| USE fail | 4 |
| USE pass | 110 |

## Failed USE Loads

| # | Operation | Case study | USE stdout |
| ---: | --- | --- | --- |
| 60 | `CoCoME_orderProducts_orderItem` | CoCoME | `results\oclvm_sanity_check_114_strong\use_runs\CoCoME_orderProducts_orderItem.stdout.txt` |
| 69 | `LibraryManagementSystem_borrowBook_borrowBook` | Library Management | `results\oclvm_sanity_check_114_strong\use_runs\LibraryManagementSystem_borrowBook_borrowBook.stdout.txt` |
| 74 | `LibraryManagementSystem_listBookHistory_listOverDueBook` | Library Management | `results\oclvm_sanity_check_114_strong\use_runs\LibraryManagementSystem_listBookHistory_listOverDueBook.stdout.txt` |
| 75 | `LibraryManagementSystem_listBookHistory_listReservationBook` | Library Management | `results\oclvm_sanity_check_114_strong\use_runs\LibraryManagementSystem_listBookHistory_listReservationBook.stdout.txt` |
