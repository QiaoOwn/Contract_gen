!create ctx : OperationContext
!set ctx.termid := 1
!set ctx.Now := 1786422339
!set ctx.Today := 1786422339
!create o4 : LoanTerm
!set o4.ItemID := 1
? let selectedLoanTerm : LoanTerm = LoanTerm.allInstances()->any(candidate: LoanTerm|candidate.ItemID = ctx.termid) in ctx.CurrentLoanRequest.oclIsUndefined() = false and selectedLoanTerm.oclIsUndefined() = false
exit
