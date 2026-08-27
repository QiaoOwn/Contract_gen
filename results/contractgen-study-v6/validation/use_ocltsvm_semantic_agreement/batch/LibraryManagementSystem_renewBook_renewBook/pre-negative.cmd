!create ctx : OperationContext
!set ctx.uid := '1'
!set ctx.barcode := '1'
!set ctx.Now := 1786422373
!set ctx.Today := 1786422373
!create o17 : Student
!create o18 : BookCopy
!create o19 : Loan
!set o17.UserID := '1'
!set o17.BorrowStatus := #NORMAL
!set o17.Programme := #BACHELOR
!set o18.Barcode := '1'
!set o18.Status := #LOANED
!set o18.IsReserved := false
!set o19.DueDate := 1786508773
!set o19.RenewedTimes := 3
!set o19.IsReturned := false
!set o19.OverDueFee := 0
!insert (o19, o17) into Loan_LoanedUser_User
!insert (o19, o18) into Loan_LoanedCopy_BookCopy
? let user : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.uid) in let copy : BookCopy = BookCopy.allInstances()->any(candidate: BookCopy|candidate.Barcode = ctx.barcode) in let loan : Loan = Loan.allInstances()->any(candidate: Loan|candidate.LoanedUser = user and candidate.LoanedCopy = copy and candidate.IsReturned = false) in let student : Student = Student.allInstances()->any(candidate: Student|candidate.UserID = ctx.uid) in let faculty : Faculty = Faculty.allInstances()->any(candidate: Faculty|candidate.UserID = ctx.uid) in User.allInstances()->exists(candidate: User|candidate.UserID = ctx.uid) and BookCopy.allInstances()->exists(candidate: BookCopy|candidate.Barcode = ctx.barcode) and Loan.allInstances()->exists(candidate: Loan|candidate.LoanedUser = user and candidate.LoanedCopy = copy and candidate.IsReturned = false) and user.BorrowStatus = #NORMAL and copy.IsReserved = false and (loan.DueDate > ctx.Today) and loan.OverDueFee = 0.0 and if user.oclIsTypeOf(Student) then loan.RenewedTimes<3 else if user.oclIsTypeOf(Faculty) then loan.RenewedTimes<6 else false endif endif
exit
