!create ctx : OperationContext
!set ctx.userid := 1
!set ctx.name := 'newName'
!set ctx.address := 'newAddr'
!set ctx.Now := 1786422315
!set ctx.Today := 1786422315
!create o1 : User
!set o1.UserID := 1
? let targetUser : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.userid) in targetUser.oclIsUndefined() = false
exit
