!create ctx : OperationContext
!set ctx.id := 1
!set ctx.name := 'alice'
!set ctx.pswd := 'secret'
!set ctx.phone := '13344442222'
!set ctx.role := 1
!set ctx.bossid := 99
!set ctx.Now := 1786422352
!set ctx.Today := 1786422352
? let existingBoss : Staff = Staff.allInstances()->any(candidate: Staff|candidate.Id = ctx.bossid) in Staff.allInstances()->forAll(staff: Staff|staff.Id<>ctx.id)
exit
