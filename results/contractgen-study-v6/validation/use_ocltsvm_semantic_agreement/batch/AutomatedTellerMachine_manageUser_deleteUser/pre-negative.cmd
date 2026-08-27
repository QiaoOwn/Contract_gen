!create ctx : OperationContext
!set ctx.userid := 99
!set ctx.Now := 1786422312
!set ctx.Today := 1786422312
? let targetUser : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.userid) in targetUser.oclIsUndefined() = false
exit
