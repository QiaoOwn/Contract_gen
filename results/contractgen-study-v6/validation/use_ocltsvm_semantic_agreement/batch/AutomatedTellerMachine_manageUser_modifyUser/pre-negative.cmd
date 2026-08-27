!create ctx : OperationContext
!set ctx.userid := 99
!set ctx.name := 'newName'
!set ctx.address := 'newAddr'
!set ctx.Now := 1786422315
!set ctx.Today := 1786422315
? let targetUser : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.userid) in targetUser.oclIsUndefined() = false
exit
