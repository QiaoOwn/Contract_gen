!create ctx : OperationContext
!set ctx.CardIDValidated := true
!set ctx.Now := 1786422278
!set ctx.PasswordValidated := false
!set ctx.Today := 1786422278
!create o4 : BankCard
!set o4.Balance := 9999
!insert (ctx, o4) into OperationContext_InputCard_BankCard
? ctx.CardIDValidated = true and ctx.PasswordValidated = true and ctx.InputCard.oclIsUndefined() = false
exit
