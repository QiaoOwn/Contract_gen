!create ctx : OperationContext
!set ctx.password := 1
!set ctx.DepositedNumber := 10.0
!set ctx.IsDeposit := true
!create automatedtellermachinesystem1 : AutomatedTellerMachineSystem
!create bankcard1 : BankCard
!set bankcard1.CardID := 1
!set bankcard1.CardStatus := #CANNEL
!set bankcard1.Catalog := #CREDIT
!set bankcard1.Password := 1
!set bankcard1.Balance := 10.0
!create user1 : User
!set user1.UserID := 1
!set user1.Name := 'sample'
!set user1.Address := 'sample'
!create depositfunds1 : depositFunds
!insert (ctx, bankcard1) into OperationContext_InputCard_BankCard
-- semantic load/typecheck only; no invariant truth check for operation pre-state
