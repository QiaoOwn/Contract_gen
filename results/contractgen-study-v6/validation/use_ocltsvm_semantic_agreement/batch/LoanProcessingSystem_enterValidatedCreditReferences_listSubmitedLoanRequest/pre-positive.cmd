!create ctx : OperationContext
!set ctx.Now := 1786422302
!set ctx.Today := 1786422302
!create o1 : LoanRequest
!set o1.Status := #SUBMITTED
? let submittedLoanRequests : Set(LoanRequest) = LoanRequest.allInstances()->select(loanRequest: LoanRequest|loanRequest.Status = #SUBMITTED) in submittedLoanRequests->notEmpty()
exit
