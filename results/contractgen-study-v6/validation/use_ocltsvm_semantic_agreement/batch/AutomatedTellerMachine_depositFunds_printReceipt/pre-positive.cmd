!create ctx : OperationContext
!set ctx.CardIDValidated := true
!set ctx.DepositedNumber := 200
!set ctx.IsDeposit := true
!set ctx.Now := 1786422282
!set ctx.PasswordValidated := true
!set ctx.Today := 1786422282
!create o3 : BankCard
!set o3.CardID := 1
!set o3.CardStatus := #NORMAL
!set o3.Balance := 9999
!insert (ctx, o3) into OperationContext_InputCard_BankCard
? ctx.CardIDValidated = true and ctx.PasswordValidated = true and ctx.InputCard.oclIsUndefined() = false
exit
