!create ctx : OperationContext
!create card : BankCard
!set ctx.PasswordValidated := true
!set ctx.CardIDValidated := true
!set ctx.result := 9999.0
!set ctx.preBalance := 9999.0
!set card.Balance := 9999.0
!insert (ctx, card) into ContextInputCard
? ctx.result = ctx.InputCard.Balance and ctx.InputCard.Balance = ctx.preBalance
exit
