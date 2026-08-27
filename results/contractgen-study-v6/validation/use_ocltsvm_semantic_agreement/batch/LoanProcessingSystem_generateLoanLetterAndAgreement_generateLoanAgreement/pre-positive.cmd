!create ctx : OperationContext
!set ctx.Now := 1786422342
!set ctx.Today := 1786422342
!create o2 : LoanRequest
!insert (ctx, o2) into OperationContext_CurrentLoanRequest_LoanRequest
? ctx.CurrentLoanRequest.oclIsUndefined() = false
exit
