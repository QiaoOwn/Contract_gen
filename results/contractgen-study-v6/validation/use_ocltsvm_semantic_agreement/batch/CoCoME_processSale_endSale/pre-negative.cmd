!create ctx : OperationContext
!set ctx.Now := 1786422325
!set ctx.Today := 1786422325
!create o7 : Sale
!set o7.IsComplete := true
!set o7.IsReadytoPay := false
!insert (ctx, o7) into OperationContext_CurrentSale_Sale
? let lineItems : Set(SalesLineItem) = ctx.CurrentSale.ContainedSalesLine in let subamounts : Set(Real) = lineItems->collect(item: SalesLineItem|item.Subamount) in let amountDue : Real = subamounts->sum() in ctx.CurrentSale.oclIsUndefined() = false and ctx.CurrentSale.IsComplete = false and ctx.CurrentSale.IsReadytoPay = false
exit
