!create ctx : OperationContext
!set ctx.Now := 1786422302
!set ctx.Today := 1786422302
? let submittedLoanRequests : Set(LoanRequest) = LoanRequest.allInstances()->select(loanRequest: LoanRequest|loanRequest.Status = #SUBMITTED) in submittedLoanRequests->notEmpty()
exit
