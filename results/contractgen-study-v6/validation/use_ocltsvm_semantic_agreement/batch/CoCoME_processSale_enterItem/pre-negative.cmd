!create ctx : OperationContext
!set ctx.barcode := 99
!set ctx.quantity := 1
!set ctx.Now := 1786422366
!set ctx.Today := 1786422366
? let item : Item = Item.allInstances()->any(candidate: Item|candidate.Barcode = ctx.barcode) in ctx.CurrentSale.oclIsUndefined() = false and ctx.CurrentSale.IsComplete = false and item.oclIsUndefined() = false and item.StockNumber>0
exit
