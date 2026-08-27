!create ctx : OperationContext
!set ctx.CardIDValidated := true
!set ctx.Now := 1786422278
!set ctx.PasswordValidated := true
!set ctx.Today := 1786422278
!create o1 : BankCard
!set o1.CardID := 1
!set o1.CardStatus := #NORMAL
!set o1.Password := 123
!set o1.Balance := 9999
!insert (ctx, o1) into OperationContext_InputCard_BankCard
? ctx.CardIDValidated = true and ctx.PasswordValidated = true and ctx.InputCard.oclIsUndefined() = false
exit
