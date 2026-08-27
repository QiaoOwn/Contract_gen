!create ctx : OperationContext
!set ctx.uid := 'missing'
!set ctx.barcode := '1'
!set ctx.Now := 1786422369
!set ctx.Today := 1786422369
!create o10 : Student
!create o11 : BookCopy
!set o10.UserID := '1'
!set o10.LoanedNumber := 0
!set o10.BorrowStatus := #NORMAL
!set o10.SuspensionDays := 0
!set o10.Programme := #BACHELOR
!set o11.Barcode := '1'
!set o11.Status := #AVAILABLE
!set o11.IsReserved := false
? let user : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.uid) in let copy : BookCopy = BookCopy.allInstances()->any(candidate: BookCopy|candidate.Barcode = ctx.barcode) in let student : Student = Student.allInstances()->any(candidate: Student|candidate.UserID = ctx.uid) in let faculty : Faculty = Faculty.allInstances()->any(candidate: Faculty|candidate.UserID = ctx.uid) in let reservation : Reserve = Reserve.allInstances()->any(candidate: Reserve|candidate.ReservedUser = user and candidate.ReservedCopy = copy and candidate.IsReserveClosed = false) in let dueDate : Integer = if user.oclIsTypeOf(Student) then (ctx.Today + 30) else (ctx.Today + 60) endif in User.allInstances()->exists(candidate: User|candidate.UserID = ctx.uid) and BookCopy.allInstances()->exists(candidate: BookCopy|candidate.Barcode = ctx.barcode) and user.BorrowStatus = #NORMAL and user.SuspensionDays = 0 and (if user.oclIsTypeOf(Student) then if student.Programme = #BACHELOR then user.LoanedNumber<20 else if student.Programme = #MASTER then user.LoanedNumber<40 else user.LoanedNumber<60 endif endif else if user.oclIsTypeOf(Faculty) then user.LoanedNumber<60 else false endif endif ) and (copy.Status = #AVAILABLE or (copy.Status = #ONHOLDSHELF and copy.IsReserved = true and Reserve.allInstances()->exists(candidate: Reserve|candidate.ReservedUser = user and candidate.ReservedCopy = copy and candidate.IsReserveClosed = false)))
exit
