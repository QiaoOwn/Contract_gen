# renewBook missing-User boundary audit (2026-11-08)

This is an evidence-based resolution of an original-source replay mismatch,
not a change to the frozen v4 requirement, selected Oracle, or upstream RM2PT.

## Evidence

- The original `library.remodel` renewBook precondition commentary at lines
  586-602 explicitly states `user exists`.
- The executable original precondition evaluates
  `user.BorrowStatus = BorrowStatus::NORMAL` before checking
  `user.oclIsUndefined() = false`.
- The frozen v4 requirement explicitly requires the User to exist.
- The selected v4 Oracle tests missing User as a precondition rejection and
  checks that the Loan remains unchanged.
- In the full original-source replay, 16/17 scenarios passed. The missing-User
  case produced `TypeError: Cannot read properties of undefined (reading
  'BorrowStatus')` instead of `PreconditionError`.

## Resolution for experiment preparation

Keep the selected Oracle's missing-User precondition requirement. Classify
this replay failure as a source-side guard-order/exception-boundary mismatch,
not as a new laboratory business rule and not as evidence that the Oracle
should accept an arbitrary runtime exception. Preserve the original replay
and obtain a separate v4-compliant executable witness before claiming a
whole-suite behavioral release.

This audit resolves how to interpret the mismatch; it does not certify a
laboratory witness or set `formal_experiment_ready=true`.
