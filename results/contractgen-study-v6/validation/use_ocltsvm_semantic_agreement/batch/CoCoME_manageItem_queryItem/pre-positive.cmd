!create ctx : OperationContext
!set ctx.barcode := 1
!set ctx.Now := 1786422318
!set ctx.Today := 1786422318
!create o1 : Item
!set o1.Barcode := 1
!set o1.Name := 'test'
!set o1.Price := 1
!set o1.StockNumber := 1
!set o1.OrderPrice := 1
? let referencedItem : Item = Item.allInstances()->any(candidate: Item|candidate.Barcode = ctx.barcode) in referencedItem.oclIsUndefined() = false
exit
