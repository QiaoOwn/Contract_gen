!create ctx : OperationContext
!set ctx.cardid := 1
!set ctx.Now := 1786422345
!set ctx.Today := 1786422345
!create o1 : BankCard
!create o2 : User
!set o1.CardID := 1
!set o1.CardStatus := #NORMAL
!set o2.UserID := 1
!insert (o1, o2) into BankCard_BelongedUser_User
!insert (o2, o1) into User_OwnedCard_BankCard
? let card : BankCard = BankCard.allInstances()->any(candidate: BankCard|candidate.CardID = ctx.cardid) in BankCard.allInstances()->includes(card) and card.CardStatus = #NORMAL
exit
