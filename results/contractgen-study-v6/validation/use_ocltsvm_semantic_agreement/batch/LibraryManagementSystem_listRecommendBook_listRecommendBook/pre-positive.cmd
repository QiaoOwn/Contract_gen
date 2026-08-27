!create ctx : OperationContext
!set ctx.uid := '1'
!set ctx.Now := 1786422332
!set ctx.Today := 1786422332
!create o1 : User
!create o3 : RecommendBook
!set o1.UserID := '1'
!insert (o1, o3) into User_RecommendedBook_RecommendBook
? let user : User = User.allInstances()->any(candidate: User|candidate.UserID = ctx.uid) in let recommendedBooks : Set(RecommendBook) = user.RecommendedBook in user.oclIsUndefined() = false and recommendedBooks->size() >= 0
exit
