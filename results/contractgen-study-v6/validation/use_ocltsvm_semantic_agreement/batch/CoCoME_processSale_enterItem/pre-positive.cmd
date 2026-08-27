!create ctx : OperationContext
!set ctx.barcode := 1
!set ctx.quantity := 1
!set ctx.Now := 1786422366
!set ctx.Today := 1786422366
!create o1 : Item
!create o3 : Sale
!set o1.Barcode := 1
!set o1.Price := 3.5
!set o1.StockNumber := 2
!set o3.IsComplete := false
!insert (ctx, o3) into OperationContext_CurrentSale_Sale
? let item : Item = Item.allInstances()->any(candidate: Item|candidate.Barcode = ctx.barcode) in ctx.CurrentSale.oclIsUndefined() = false and ctx.CurrentSale.IsComplete = false and item.oclIsUndefined() = false and item.StockNumber>0
exit
