!create ctx : OperationContext
!set ctx.Now := 1786422325
!set ctx.Today := 1786422325
!create o2 : Sale
!create o3 : SalesLineItem
!create o4 : SalesLineItem
!create o5 : SalesLineItem
!set o2.IsComplete := false
!set o2.IsReadytoPay := false
!set o3.Subamount := 1
!set o4.Subamount := 2
!set o5.Subamount := 3
!insert (o2, o3) into Sale_ContainedSalesLine_SalesLineItem
!insert (o2, o4) into Sale_ContainedSalesLine_SalesLineItem
!insert (o2, o5) into Sale_ContainedSalesLine_SalesLineItem
!insert (ctx, o2) into OperationContext_CurrentSale_Sale
? let lineItems : Set(SalesLineItem) = ctx.CurrentSale.ContainedSalesLine in let subamounts : Set(Real) = lineItems->collect(item: SalesLineItem|item.Subamount) in let amountDue : Real = subamounts->sum() in ctx.CurrentSale.oclIsUndefined() = false and ctx.CurrentSale.IsComplete = false and ctx.CurrentSale.IsReadytoPay = false
exit
