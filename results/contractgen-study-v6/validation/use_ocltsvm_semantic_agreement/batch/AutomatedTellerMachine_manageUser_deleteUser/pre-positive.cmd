!create ctx : OperationContext
!set ctx.userid := 1
!set ctx.Now := 1786422312
!set ctx.Today := 1786422312
!create o1 : User
!set o1.UserID := 1
? let targetUser : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.userid) in targetUser.oclIsUndefined() = false
exit
