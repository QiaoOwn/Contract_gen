!create ctx : OperationContext
!create card : BankCard
!set ctx.PasswordValidated := true
!set ctx.CardIDValidated := true
!set ctx.result := 9999.0
!set ctx.preBalance := 9999.0
!set card.Balance := 9999.0
!insert (ctx, card) into ContextInputCard
? ctx.PasswordValidated = true and ctx.CardIDValidated = true and ctx.InputCard.oclIsUndefined() = false
exit
