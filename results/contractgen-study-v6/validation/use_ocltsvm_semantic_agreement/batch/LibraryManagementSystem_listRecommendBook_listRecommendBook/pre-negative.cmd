!create ctx : OperationContext
!set ctx.uid := '1'
!set ctx.Now := 1786422332
!set ctx.Today := 1786422332
!create o4 : User
!set o4.UserID := '1'
? let user : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.uid) in let recommendedBooks : Set(RecommendBook) = user.RecommendedBook in user.oclIsUndefined() = false and recommendedBooks->size() >= 0
exit
