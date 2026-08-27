!create ctx : OperationContext
!set ctx.CardIDValidated := false
!set ctx.Now := 1786422282
!set ctx.PasswordValidated := false
!set ctx.Today := 1786422282
? ctx.CardIDValidated = true and ctx.PasswordValidated = true and ctx.InputCard.oclIsUndefined() = false
exit
