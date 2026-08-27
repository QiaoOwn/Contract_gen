!create ctx : OperationContext
!set ctx.termid := 1
!set ctx.Now := 1786422339
!set ctx.Today := 1786422339
!create o1 : LoanTerm
!create o3 : LoanRequest
!set o1.ItemID := 1
!insert (ctx, o3) into OperationContext_CurrentLoanRequest_LoanRequest
? let selectedLoanTerm : LoanTerm = LoanTerm.allInstances()->any(candidate: LoanTerm|candidate.ItemID = ctx.termid) in ctx.CurrentLoanRequest.oclIsUndefined() = false and selectedLoanTerm.oclIsUndefined() = false
exit
