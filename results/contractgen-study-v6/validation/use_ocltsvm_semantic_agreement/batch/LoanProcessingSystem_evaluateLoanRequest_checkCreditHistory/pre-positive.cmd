!create ctx : OperationContext
!set ctx.Now := 1786422305
!set ctx.Today := 1786422305
!create o2 : LoanRequest
!create o3 : CreditHistory
!set o2.RequestID := 1
!insert (o2, o3) into LoanRequest_RequestedCreditHistory_CreditHistory
!insert (ctx, o2) into OperationContext_CurrentLoanRequest_LoanRequest
? ctx.CurrentLoanRequest.oclIsUndefined() = false
exit
