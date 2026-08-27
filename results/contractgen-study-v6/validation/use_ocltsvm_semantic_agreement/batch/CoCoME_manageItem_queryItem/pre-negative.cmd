!create ctx : OperationContext
!set ctx.barcode := 99
!set ctx.Now := 1786422318
!set ctx.Today := 1786422318
? let referencedItem : Item = Item.allInstances()->any(candidate: Item|candidate.Barcode = ctx.barcode) in referencedItem.oclIsUndefined() = false
exit
