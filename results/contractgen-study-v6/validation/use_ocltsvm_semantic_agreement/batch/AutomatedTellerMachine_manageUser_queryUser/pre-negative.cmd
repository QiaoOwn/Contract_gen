!create ctx : OperationContext
!set ctx.userid := 99
!set ctx.Now := 1786422285
!set ctx.Today := 1786422285
? let queriedUser : User = User.allInstances()->any(user: User|user.UserID = ctx.userid) in User.allInstances()->includes(queriedUser)
exit
