!create ctx : OperationContext
!set ctx.uid := '1'
!set ctx.Now := 1786422329
!set ctx.Today := 1786422329
!create o1 : User
!create o3 : Loan
!set o1.UserID := '1'
!insert (o1, o3) into User_LoanedBook_Loan
? let targetUser : User = User.allInstances()->any(user: User|user.UserID = ctx.uid) in targetUser.oclIsUndefined() = false
exit
