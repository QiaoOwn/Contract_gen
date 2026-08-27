!create ctx : OperationContext
!set ctx.requestid := 1
!set ctx.name := '2'
!set ctx.loanamount := 3
!set ctx.loanpurpose := '4'
!set ctx.income := 5
!set ctx.phonenumber := 6
!set ctx.postaladdress := '7'
!set ctx.zipcode := 8
!set ctx.email := '9'
!set ctx.workreferences := '10'
!set ctx.creditreferences := '11'
!set ctx.checkingaccountnumber := 12
!set ctx.securitynumber := 13
!set ctx.Now := 1786422376
!set ctx.Today := 1786422376
!create o3 : LoanRequest
!set o3.RequestID := 1
? LoanRequest.allInstances()->forAll(request: LoanRequest|request.RequestID<>ctx.requestid)
exit
