!create ctx : OperationContext
!set ctx.uid := 99
!set ctx.Now := 1786422329
!set ctx.Today := 1786422329
? let targetUser : User = User.allInstances()->any(user: User|user.UserID = ctx.uid) in targetUser.oclIsUndefined() = false
exit
