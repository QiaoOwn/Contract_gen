!create ctx : OperationContext
!set ctx.name := '1'
!set ctx.Now := 1786422335
!set ctx.Today := 1786422335
!create o4 : Subject
!set o4.Name := '1'
? Subject.allInstances()->forAll(subject: Subject|subject.Name<>ctx.name)
exit
