!create ctx : OperationContext
!set ctx.cardid := 99
!set ctx.Now := 1786422345
!set ctx.Today := 1786422345
? let card : BankCard = BankCard.allInstances()->any(candidate: BankCard|candidate.CardID = ctx.cardid) in BankCard.allInstances()->includes(card) and card.CardStatus = #NORMAL
exit
