!create ctx : OperationContext
!set ctx.subject := 'test'
!set ctx.Now := 1786422295
!set ctx.Today := 1786422295
!create o1 : Book
!create o2 : Subject
!set o2.Name := 'test'
!insert (o1, o2) into Book_Subject_Subject
? ctx.subject.oclIsTypeOf(String)
exit
